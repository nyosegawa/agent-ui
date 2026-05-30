import { execFileSync } from "node:child_process";
import process from "node:process";

const REPO_POLICY_CONTEXT = [
  "Agent UI repo policy:",
  "- Read AGENTS.md plus relevant docs, tests, and examples before editing public surfaces.",
  "- Keep Agent UI a reusable Codex App Server UI library, not a host runtime.",
  "- Do not edit files inside third_party/codex; use the upstream sync workflow to update the submodule pointer and generated schema together.",
  "- Do not hand-edit generated schema or dist output; update the source command or generator instead.",
  "- Use Bun for repository package operations and report focused validation before stopping.",
].join("\n");

const SUBAGENT_CONTEXT = [
  "Agent UI subagent review context:",
  "- Prioritize concrete regressions, missing validation, protocol drift, package boundary issues, security risks, and transcript-first UX failures.",
  "- Do not propose host-specific runtime ownership inside the core library.",
  "- Treat third_party/codex as upstream reference material unless the user explicitly asks to change that repository.",
].join("\n");

const GENERATED_PATHS = [
  "packages/codex/src/generated/",
  "packages/core/dist/",
  "packages/codex/dist/",
  "packages/react/dist/",
  "packages/server/dist/",
  "packages/web-components/dist/",
  "examples/codex-local-web/dist/",
  "examples/docs-site/dist/",
  "examples/local-react-vite/dist/",
  "examples/recipes/dist/",
];

const VALIDATION_RULES = [
  {
    command: "bun run test:protocol",
    matches: [
      "packages/codex/src/generated/",
      "packages/codex/src/protocol.ts",
      "packages/codex/src/request-builders.ts",
      "packages/codex/src/normalizers/",
      "fixtures/app-server/",
      "third_party/codex",
    ],
  },
  {
    command: "bun run test:api-snapshots",
    matches: [
      "packages/core/src/",
      "packages/codex/src/",
      "packages/react/src/",
      "packages/server/src/",
      "packages/web-components/src/",
      "test/api-snapshots/",
    ],
  },
  {
    command: "bun run test:styles",
    matches: ["packages/react/src/styles", "docs/guides/theming.md"],
  },
  {
    command: "bun run validate:packages",
    matches: ["package.json", "packages/", "tsup.config.ts", "test/api-snapshots/"],
  },
  {
    command: "bunx vitest run test/docs-staleness.test.ts",
    matches: ["README.md", "docs/", "examples/", "AGENTS.md", "CLAUDE.md"],
  },
  {
    command: "bun run lint",
    matches: [".", "scripts/", "packages/", "examples/", "test/"],
  },
  {
    command: "bun run typecheck",
    matches: ["packages/", "examples/", "tsconfig", "package.json"],
  },
];

export function evaluateHook(input, options = {}) {
  const event = options.eventName ?? input.hook_event_name;
  switch (event) {
    case "SessionStart":
      return jsonAdditionalContext("SessionStart", REPO_POLICY_CONTEXT);
    case "SubagentStart":
      return jsonAdditionalContext("SubagentStart", SUBAGENT_CONTEXT);
    case "UserPromptSubmit":
      return userPromptSubmit(input);
    case "PreToolUse":
      return preToolUse(input);
    case "PermissionRequest":
      return permissionRequest(input);
    case "PostToolUse":
      return postToolUse(input, options);
    case "SubagentStop":
      return stop(input, options, "Agent UI subagent stop checklist");
    case "Stop":
      return stop(input, options);
    default:
      return continueWithoutOutput();
  }
}

export function commandPolicy(command) {
  const normalized = normalizeCommand(command);
  if (!normalized) return undefined;

  const blockers = [
    {
      pattern: /\bgit\s+reset\s+--hard\b/,
      reason: "Blocked destructive git reset. Preserve user changes unless explicitly approved outside the hook.",
    },
    {
      pattern: /\bgit\s+clean\s+-(?:[^\s]*[fd][^\s]*|[^\s]*[df][^\s]*)\b/,
      reason: "Blocked destructive git clean. Review untracked files manually before deleting them.",
    },
    {
      pattern: /\bgit\s+push\b[^\n;&|]*\s--force(?:-with-lease)?\b/,
      reason: "Blocked force push. Use a normal push or get explicit human approval outside the hook.",
    },
    {
      pattern: /\b(?:npm|pnpm|yarn|bun)\s+publish\b/,
      reason: "Blocked package publish from a repository hook. Use the reviewed release workflow instead.",
    },
    {
      pattern: /\b(?:npm\s+(?:install|i|ci)|pnpm\s+(?:install|i|add)|yarn\s+(?:install|add))\b(?![^\n;&|]*(?:\s-g\b|\s--global\b))/,
      reason: "Blocked non-Bun package-manager mutation. Use Bun for repository package operations.",
    },
    {
      pattern: /\bgit\s+-C\s+["']?third_party\/codex["']?\s+(?:checkout|switch|reset|clean|commit|restore|apply|am|rebase|merge|pull)\b/,
      reason: "Blocked direct mutation inside third_party/codex. Update the submodule pointer through the Codex upstream sync workflow.",
    },
  ];

  for (const blocker of blockers) {
    if (blocker.pattern.test(normalized)) return blocker.reason;
  }

  if (touchesGeneratedPath(normalized) && looksLikeMutationCommand(normalized)) {
    return "Blocked direct mutation of generated or built output. Update source files or run the owning generator instead.";
  }

  if (touchesSubmoduleInternals(normalized) && looksLikeMutationCommand(normalized)) {
    return "Blocked direct file mutation inside third_party/codex. Treat the submodule as upstream reference material.";
  }

  return undefined;
}

export function patchPolicy(command) {
  const normalized = normalizeCommand(command);
  if (!normalized) return undefined;
  if (touchesPath(normalized, "third_party/codex/")) {
    return "Blocked patch to files inside third_party/codex. Update only the submodule pointer through the upstream sync workflow.";
  }
  if (touchesGeneratedPath(normalized)) {
    return "Blocked patch to generated or built output. Change the source or generator instead.";
  }
  return undefined;
}

export function promptWarnings(prompt) {
  const warnings = [];
  const text = String(prompt ?? "");
  if (/third_party\/codex|upstream Codex checkout|Codex checkout/i.test(text)) {
    warnings.push(
      "Reminder: third_party/codex is upstream reference material. Do not edit files inside it unless the user explicitly asks to change the Codex repository itself.",
    );
  }
  if (/\b(?:npm|pnpm|yarn|bun)\s+publish\b|publish (?:the )?(?:package|packages)|npm package release/i.test(text)) {
    warnings.push(
      "Reminder: package publication must use the reviewed release workflow; do not publish from an ad hoc hook-protected session.",
    );
  }
  if (/\b(?:watcher|skill-with-app)\b/i.test(text)) {
    warnings.push(
      "Reminder: host-specific workflows should stay outside the core Agent UI library. Prefer reusable primitives and documented extension points.",
    );
  }
  return warnings;
}

export function validationCommandsForPaths(paths) {
  const normalizedPaths = paths.map(normalizePath).filter(Boolean);
  const commands = new Set();
  for (const rule of VALIDATION_RULES) {
    if (normalizedPaths.some((path) => rule.matches.some((prefix) => path.startsWith(prefix)))) {
      commands.add(rule.command);
    }
  }
  return [...commands];
}

export function parseGitStatus(status) {
  return String(status ?? "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => normalizePath(line.slice(3).split(" -> ").pop() ?? ""))
    .filter(Boolean);
}

function userPromptSubmit(input) {
  const warnings = promptWarnings(input.prompt);
  if (warnings.length === 0) return continueWithoutOutput();
  return jsonAdditionalContext("UserPromptSubmit", warnings.join("\n"));
}

function preToolUse(input) {
  const reason = toolBlockReason(input);
  if (reason) return blockWithStderr(reason);
  return continueWithoutOutput();
}

function permissionRequest(input) {
  const reason = toolBlockReason(input);
  if (!reason) return continueWithoutOutput();
  return {
    stdout: {
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "deny",
          message: reason,
        },
      },
    },
  };
}

function postToolUse(input, options) {
  const status = options.gitStatus ?? readGitStatus(input.cwd);
  const commands = validationCommandsForPaths(parseGitStatus(status));
  if (commands.length === 0) return continueWithoutOutput();
  return {
    stdout: {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: validationMessage(commands),
      },
    },
  };
}

function stop(input, options, label = "Agent UI stop checklist") {
  if (input.stop_hook_active) return continueWithoutOutput();
  const status = options.gitStatus ?? readGitStatus(input.cwd);
  const paths = parseGitStatus(status);
  if (paths.length === 0) return continueWithoutOutput();
  const commands = validationCommandsForPaths(paths);
  return {
    stdout: {
      systemMessage: [
        `${label}: working tree is dirty.`,
        commands.length > 0 ? validationMessage(commands) : "Report changed files, validation status, and residual risks before stopping.",
      ].join("\n"),
    },
  };
}

function toolBlockReason(input) {
  const toolName = String(input.tool_name ?? "");
  const toolInput = recordValue(input.tool_input);
  const command = typeof toolInput.command === "string" ? toolInput.command : "";
  if (toolName === "Bash") return commandPolicy(command);
  if (toolName === "apply_patch" || toolName === "Edit" || toolName === "Write") {
    return patchPolicy(command);
  }
  return undefined;
}

function validationMessage(commands) {
  return [
    "Changed files match Agent UI validation-sensitive areas. Before finishing, run or explicitly report why you skipped:",
    ...commands.map((command) => `- ${command}`),
  ].join("\n");
}

function readGitStatus(cwd) {
  try {
    return execFileSync("git", ["status", "--short"], {
      cwd: typeof cwd === "string" && cwd ? cwd : process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function jsonAdditionalContext(hookEventName, additionalContext) {
  return {
    stdout: {
      hookSpecificOutput: {
        hookEventName,
        additionalContext,
      },
    },
  };
}

function blockWithStderr(reason) {
  return { exitCode: 2, stderr: reason };
}

function continueWithoutOutput() {
  return {};
}

function normalizeCommand(command) {
  return String(command ?? "").replace(/\\\n/g, " ").trim();
}

function normalizePath(path) {
  return String(path ?? "").replace(/\\/g, "/").replace(/^"|"$/g, "");
}

function touchesPath(command, path) {
  return normalizeCommand(command).includes(path);
}

function touchesGeneratedPath(command) {
  return GENERATED_PATHS.some((path) => touchesPath(command, path));
}

function touchesSubmoduleInternals(command) {
  return touchesPath(command, "third_party/codex/");
}

function looksLikeMutationCommand(command) {
  return /\b(?:rm|mv|cp|touch|truncate|chmod|chown|sed\s+-i|perl\s+-pi|python(?:3)?\s+-c|node\s+-e|bun\s+run|npm\s+run|git\s+apply)\b/.test(
    command,
  );
}

function recordValue(value) {
  return typeof value === "object" && value !== null ? value : {};
}
