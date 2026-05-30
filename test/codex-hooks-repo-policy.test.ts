import { describe, expect, it } from "vitest";

import {
  commandPolicy,
  evaluateHook,
  parseGitStatus,
  patchPolicy,
  promptWarnings,
  validationCommandsForPaths,
} from "../scripts/codex-hooks/repo-policy-lib.mjs";

describe("Codex repo policy hooks", () => {
  it("blocks destructive git and package publish commands", () => {
    expect(commandPolicy("git reset --hard HEAD~1")).toContain("destructive git reset");
    expect(commandPolicy("git clean -fd")).toContain("destructive git clean");
    expect(commandPolicy("git push --force origin main")).toContain("force push");
    expect(commandPolicy("npm publish --access public")).toContain("package publish");
  });

  it("blocks non-Bun repository package mutations but allows global npm installs", () => {
    expect(commandPolicy("npm install react")).toContain("non-Bun package-manager");
    expect(commandPolicy("npm ci")).toContain("non-Bun package-manager");
    expect(commandPolicy("pnpm add react")).toContain("non-Bun package-manager");
    expect(commandPolicy("npm install -g agent-browser")).toBeUndefined();
    expect(commandPolicy("npm install --global agent-browser")).toBeUndefined();
    expect(commandPolicy("bun add react")).toBeUndefined();
  });

  it("blocks direct submodule and generated output mutations", () => {
    expect(commandPolicy("git -C third_party/codex checkout main")).toContain(
      "direct mutation inside third_party/codex",
    );
    expect(commandPolicy("sed -i s/foo/bar/ packages/codex/src/generated/stable/index.ts")).toContain(
      "generated or built output",
    );
    expect(commandPolicy("bun --filter @nyosegawa/agent-ui-codex generate:schema")).toBeUndefined();
  });

  it("blocks patches to upstream submodule internals and generated output", () => {
    expect(
      patchPolicy("*** Update File: third_party/codex/codex-rs/app-server/src/lib.rs\n"),
    ).toContain("third_party/codex");
    expect(
      patchPolicy("*** Update File: packages/codex/src/generated/stable/index.ts\n"),
    ).toContain("generated or built output");
  });

  it("adds prompt context for host boundary, publishing, and upstream edits", () => {
    expect(promptWarnings("please edit third_party/codex directly")).toHaveLength(1);
    expect(promptWarnings("publish package to npm")).toHaveLength(1);
    expect(promptWarnings("move watcher behavior into core")).toHaveLength(1);
  });

  it("denies permission requests for blocked Bash commands", () => {
    const result = evaluateHook({
      hook_event_name: "PermissionRequest",
      tool_input: { command: "git push --force origin main" },
      tool_name: "Bash",
    });

    expect(result.stdout).toMatchObject({
      hookSpecificOutput: {
        decision: { behavior: "deny" },
        hookEventName: "PermissionRequest",
      },
    });
  });

  it("returns PreToolUse exit code 2 for blocked tool calls", () => {
    const result = evaluateHook({
      hook_event_name: "PreToolUse",
      tool_input: { command: "npm publish" },
      tool_name: "Bash",
    });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("package publish");
  });

  it("maps changed paths to focused validation commands", () => {
    expect(
      validationCommandsForPaths([
        "packages/codex/src/generated/stable/index.ts",
        "docs/maintenance/codex-hooks.md",
        "packages/react/src/styles/thread.css",
      ]),
    ).toEqual(
      expect.arrayContaining([
        "bun run test:protocol",
        "bun run test:styles",
        "bunx vitest run test/docs-staleness.test.ts",
      ]),
    );
  });

  it("parses git status paths and emits Stop reminders for dirty trees", () => {
    const status = " M packages/codex/src/protocol.ts\n?? docs/maintenance/codex-hooks.md\n";
    expect(parseGitStatus(status)).toEqual([
      "packages/codex/src/protocol.ts",
      "docs/maintenance/codex-hooks.md",
    ]);

    const result = evaluateHook(
      {
        cwd: process.cwd(),
        hook_event_name: "Stop",
        stop_hook_active: false,
      },
      { gitStatus: status },
    );
    expect(result.stdout).toMatchObject({
      systemMessage: expect.stringContaining("working tree is dirty"),
    });
  });
});
