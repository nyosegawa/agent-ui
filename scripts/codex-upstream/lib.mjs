import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(scriptDir, "../..");

export async function execText(command, args, options = {}) {
  const { stdout } = await execFileAsync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: options.maxBuffer ?? 1024 * 1024 * 20,
  });
  return stdout.trim();
}

export async function execStatus(command, args, options = {}) {
  try {
    const stdout = await execText(command, args, options);
    return { ok: true, stdout };
  } catch (error) {
    return {
      ok: false,
      stderr: error?.stderr ?? String(error),
      stdout: error?.stdout ?? "",
    };
  }
}

export const codexRepoPath = resolve(repoRoot, "third_party/codex");

function assertCodexAppServerCheckout(codexRepo) {
  const required = ["codex-rs/app-server", "codex-rs/app-server-protocol"];
  const missing = required.filter((path) => !existsSync(resolve(codexRepo, path)));
  if (missing.length > 0) {
    throw new Error(`third_party/codex is missing required paths: ${missing.join(", ")}`);
  }
}

export async function ensureCodexSubmoduleInitialized() {
  if (existsSync(resolve(codexRepoPath, ".git"))) return;
  await execText("git", ["submodule", "update", "--init", "--depth", "1", "third_party/codex"]);
}

export async function updateCodexSubmoduleToRemote() {
  await ensureCodexSubmoduleInitialized();
  await execText("git", ["submodule", "update", "--remote", "--depth", "1", "third_party/codex"]);
}

export async function codexRemoteMainCommit() {
  await ensureCodexSubmoduleInitialized();
  const output = await execText("git", ["ls-remote", "origin", "refs/heads/main"], {
    cwd: codexRepoPath,
  });
  const [commit] = output.split(/\s+/);
  if (!commit) throw new Error("Could not resolve origin/main for third_party/codex.");
  return commit;
}

export async function withCodexRemoteMainWorktree(callback) {
  await ensureCodexSubmoduleInitialized();
  await execText("git", ["fetch", "--depth", "1", "origin", "main"], { cwd: codexRepoPath });
  const tempRoot = await mkdtemp(resolve(tmpdir(), "agent-ui-codex-remote-"));
  const worktree = resolve(tempRoot, "codex");
  try {
    await execText("git", ["worktree", "add", "--detach", worktree, "FETCH_HEAD"], {
      cwd: codexRepoPath,
    });
    return await callback(worktree);
  } finally {
    await execStatus("git", ["worktree", "remove", "--force", worktree], {
      cwd: codexRepoPath,
    });
    await rm(tempRoot, { force: true, recursive: true });
  }
}

export async function upstreamInfo(codexRepo) {
  assertCodexAppServerCheckout(codexRepo);
  const [commit, commitDate, subject, branch, focusedStatus] = await Promise.all([
    execText("git", ["rev-parse", "HEAD"], { cwd: codexRepo }),
    execText("git", ["show", "-s", "--format=%cI", "HEAD"], { cwd: codexRepo }),
    execText("git", ["show", "-s", "--format=%s", "HEAD"], { cwd: codexRepo }),
    execText("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: codexRepo }),
    execText(
      "git",
      [
        "status",
        "--porcelain",
        "--",
        "codex-rs/app-server",
        "codex-rs/app-server-protocol",
      ],
      { cwd: codexRepo },
    ),
  ]);
  return { branch, codexRepo, commit, commitDate, focusedStatus, subject };
}

export async function currentProtocolMetadata() {
  const protocolSource = await readFile(
    resolve(repoRoot, "packages/codex/src/protocol.ts"),
    "utf8",
  );
  const packageJson = JSON.parse(
    await readFile(resolve(repoRoot, "packages/codex/package.json"), "utf8"),
  );
  return {
    commit: stringConstant(protocolSource, "CODEX_PROTOCOL_COMMIT"),
    generatedAt: stringConstant(protocolSource, "CODEX_PROTOCOL_GENERATED_AT"),
    packageCommit: packageJson.agentUi?.codexProtocolCommit,
    packageGeneratedAt: packageJson.agentUi?.generatedAt,
  };
}

export async function currentGeneratedMethods() {
  const source = await readFile(
    resolve(repoRoot, "packages/codex/src/generated/protocol-capabilities.ts"),
    "utf8",
  );
  return parseCapabilitySource(source);
}

export async function exportedUpstreamMethods(codexRepo) {
  assertCodexAppServerCheckout(codexRepo);
  const tempRoot = await mkdtemp(resolve(tmpdir(), "agent-ui-codex-drift-"));
  try {
    const stableDir = resolve(tempRoot, "stable");
    const experimentalDir = resolve(tempRoot, "experimental");
    await runCargoExport(codexRepo, stableDir, false);
    await runCargoExport(codexRepo, experimentalDir, true);
    const stableClient = await extractMethods(resolve(stableDir, "ClientRequest.ts"));
    const stableNotifications = await extractMethods(resolve(stableDir, "ServerNotification.ts"));
    const stableServerRequests = await extractMethods(resolve(stableDir, "ServerRequest.ts"));
    const experimentalClient = await extractMethods(resolve(experimentalDir, "ClientRequest.ts"));
    const experimentalOnlyClient = experimentalClient.filter(
      (method) => !stableClient.includes(method),
    );
    return {
      generatedExperimentalOnlyClientMethods: experimentalOnlyClient.sort(),
      generatedStableClientMethods: stableClient.sort(),
      generatedStableNotificationMethods: stableNotifications.sort(),
      generatedStableServerRequestMethods: stableServerRequests.sort(),
    };
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

export function diffMethodSets(current, upstream) {
  const result = {};
  for (const key of Object.keys(upstream).sort()) {
    const before = new Set(current[key] ?? []);
    const after = new Set(upstream[key] ?? []);
    result[key] = {
      added: [...after].filter((method) => !before.has(method)).sort(),
      removed: [...before].filter((method) => !after.has(method)).sort(),
      unchanged: [...after].filter((method) => before.has(method)).sort(),
    };
  }
  return result;
}

export function hasMethodDrift(diff) {
  return Object.values(diff).some((entry) => entry.added.length > 0 || entry.removed.length > 0);
}

export function renderDriftMarkdown({ currentMetadata, diff, generatedAt, upstream }) {
  const lines = [
    "# Codex App Server Drift Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    "## Commits",
    "",
    `- Current Agent UI protocol commit: \`${currentMetadata.commit}\``,
    `- Current package metadata commit: \`${currentMetadata.packageCommit ?? "missing"}\``,
    `- Upstream Codex commit: \`${upstream.commit}\``,
    `- Upstream branch: \`${upstream.branch}\``,
    `- Upstream commit date: \`${upstream.commitDate}\``,
    `- Upstream subject: ${upstream.subject}`,
    "",
    "## Method Drift",
    "",
  ];
  for (const [key, entry] of Object.entries(diff)) {
    lines.push(`### ${key}`, "");
    lines.push(methodList("Added", entry.added));
    lines.push(methodList("Removed", entry.removed));
    lines.push("");
  }
  lines.push("## Next Steps", "");
  if (currentMetadata.commit === upstream.commit && !hasMethodDrift(diff)) {
    lines.push("- No protocol commit or method drift detected.");
  } else {
    lines.push("- Run the Codex upstream sync skill to create a review PR.");
    lines.push("- Classify every new method before treating the PR as complete.");
    lines.push("- Update normalizers, request builders, docs, examples, and tests as needed.");
  }
  lines.push("");
  return lines.join("\n");
}

export async function writeReport(path, report) {
  await writeFile(path, report);
  return path;
}

export function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      const values = args.get("_") ?? [];
      values.push(token);
      args.set("_", values);
      continue;
    }
    const [key, inlineValue] = token.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(key, inlineValue);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(key, next);
      index += 1;
    } else {
      args.set(key, true);
    }
  }
  return args;
}

function stringConstant(source, name) {
  const match = new RegExp(`export const ${name} = "([^"]+)";`).exec(source);
  if (!match?.[1]) throw new Error(`Missing ${name} in protocol.ts.`);
  return match[1];
}

function parseCapabilitySource(source) {
  return Object.fromEntries(
    [
      "generatedStableClientMethods",
      "generatedStableNotificationMethods",
      "generatedStableServerRequestMethods",
      "generatedExperimentalOnlyClientMethods",
    ].map((name) => [name, parseStringArray(source, name)]),
  );
}

function parseStringArray(source, name) {
  const match = new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\] as const;`).exec(source);
  if (!match?.[1]) throw new Error(`Missing generated method array: ${name}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]).sort();
}

async function runCargoExport(codexRepo, outDir, experimental) {
  await execFileAsync(
    "cargo",
    [
      "run",
      "-p",
      "codex-app-server-protocol",
      "--bin",
      "export",
      "--",
      ...(experimental ? ["--experimental"] : []),
      "--out",
      outDir,
    ],
    {
      cwd: resolve(codexRepo, "codex-rs"),
      maxBuffer: 1024 * 1024 * 20,
    },
  );
}

async function extractMethods(file) {
  const source = await readFile(file, "utf8");
  return [...source.matchAll(/"method": "([^"]+)"/g)]
    .map((match) => match[1])
    .filter(Boolean)
    .sort();
}

function methodList(label, values) {
  if (values.length === 0) return `- ${label}: none`;
  return [`- ${label}:`, ...values.map((method) => `  - \`${method}\``)].join("\n");
}
