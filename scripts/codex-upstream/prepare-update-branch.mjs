#!/usr/bin/env node
import { log } from "node:console";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import process from "node:process";

import {
  codexRepoPath,
  codexRemoteMainCommit,
  currentGeneratedMethods,
  currentProtocolMetadata,
  diffMethodSets,
  execStatus,
  execText,
  ensureCodexSubmoduleInitialized,
  exportedUpstreamMethods,
  hasMethodDrift,
  parseArgs,
  renderDriftMarkdown,
  repoRoot,
  updateCodexSubmoduleToRemote,
  upstreamInfo,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.has("help")) {
  log(`Usage: node prepare-update-branch.mjs [options]

Options:
  --base main             Base ref for the update branch.
  --branch name           Branch name. Defaults to codex-upstream/<short-commit>.
  --push                  Push branch to origin.
  --pr                    Create a GitHub pull request. Requires --push.
  --draft                 Create a draft PR.
  --skip-validation       Skip local validation commands.
  --force                 Create a branch even when no drift is detected.
`);
  process.exit(0);
}

const generatedAt = new Date().toISOString();
await assertRepoClean();
await ensureCodexSubmoduleInitialized();
const [currentMetadataBeforeUpdate, currentMethodsBeforeUpdate, upstreamBeforeUpdate, remoteCommit] =
  await Promise.all([
    currentProtocolMetadata(),
    currentGeneratedMethods(),
    upstreamInfo(codexRepoPath),
    codexRemoteMainCommit(),
  ]);
const upstreamMethodsBeforeUpdate = await exportedUpstreamMethods(codexRepoPath);
const diffBeforeUpdate = diffMethodSets(currentMethodsBeforeUpdate, upstreamMethodsBeforeUpdate);
if (
  !args.has("force") &&
  currentMetadataBeforeUpdate.commit === remoteCommit &&
  currentMetadataBeforeUpdate.packageCommit === currentMetadataBeforeUpdate.commit &&
  upstreamBeforeUpdate.commit === currentMetadataBeforeUpdate.commit &&
  !hasMethodDrift(diffBeforeUpdate)
) {
  const report = renderDriftMarkdown({
    currentMetadata: currentMetadataBeforeUpdate,
    diff: diffBeforeUpdate,
    generatedAt,
    upstream: upstreamBeforeUpdate,
  });
  log(report);
  log("No Codex App Server drift detected; no update commit created.");
  process.exit(0);
}

const base = String(args.get("base") ?? "main");
const requestedBranch = args.get("branch");
let branch = String(requestedBranch ?? `codex-upstream/${remoteCommit.slice(0, 12)}`);
await execText("git", ["checkout", "-B", branch, base], { cwd: repoRoot });
await updateCodexSubmoduleToRemote();
const [currentMetadata, currentMethods, upstream] = await Promise.all([
  currentProtocolMetadata(),
  currentGeneratedMethods(),
  upstreamInfo(codexRepoPath),
]);
const upstreamMethods = await exportedUpstreamMethods(codexRepoPath);
const diff = diffMethodSets(currentMethods, upstreamMethods);
const drift =
  currentMetadata.commit !== upstream.commit ||
  currentMetadata.packageCommit !== currentMetadata.commit ||
  hasMethodDrift(diff);
const report = renderDriftMarkdown({ currentMetadata, diff, generatedAt, upstream });

if (!drift && !args.has("force")) {
  log(report);
  log("No Codex App Server drift detected; no update commit created.");
  process.exit(0);
}

await execText("bun", ["--filter", "@nyosegawa/agent-ui-codex", "generate:schema"], {
  cwd: repoRoot,
  maxBuffer: 1024 * 1024 * 60,
});

const changed = await execText("git", ["status", "--short"], { cwd: repoRoot });
if (!changed) {
  log(report);
  log("Schema import produced no repository changes.");
  process.exit(0);
}

const validation = args.has("skip-validation")
  ? [{ command: "skipped", ok: true, output: "Validation skipped by --skip-validation." }]
  : await runValidation();

await execText(
  "git",
  [
    "add",
    "third_party/codex",
    "packages/codex/src/generated",
    "packages/codex/src/protocol.ts",
    "packages/codex/package.json",
  ],
  { cwd: repoRoot },
);
await execText(
  "git",
  ["commit", "-m", `Refresh Codex App Server schema to ${upstream.commit.slice(0, 12)}`],
  { cwd: repoRoot },
);

if (args.has("push")) {
  await execText("git", ["push", "-u", "origin", "HEAD"], { cwd: repoRoot });
}

if (args.has("pr")) {
  if (!args.has("push")) throw new Error("--pr requires --push.");
  const bodyPath = await writePullRequestBody(report, validation, upstream);
  const prArgs = [
    "pr",
    "create",
    "--title",
    `Refresh Codex App Server schema to ${upstream.commit.slice(0, 12)}`,
    "--body-file",
    bodyPath,
  ];
  if (args.has("draft")) prArgs.push("--draft");
  await execText("gh", prArgs, { cwd: repoRoot });
}

log(report);
log(`Prepared update branch: ${branch}`);
log(
  validation.map((entry) => `- ${entry.command}: ${entry.ok ? "pass" : "fail"}`).join("\n"),
);

async function assertRepoClean() {
  const status = await execText("git", ["status", "--short"], { cwd: repoRoot });
  if (status) {
    throw new Error(`Working tree must be clean before preparing an update branch:\n${status}`);
  }
}

async function runValidation() {
  const commands = [
    ["bun", ["run", "test:protocol"]],
    ["bun", ["run", "typecheck"]],
    ["bun", ["run", "test:api-snapshots"]],
    ["bun", ["run", "test:package-resolution"]],
  ];
  const results = [];
  for (const [command, commandArgs] of commands) {
    const result = await execStatus(command, commandArgs, {
      cwd: repoRoot,
      maxBuffer: 1024 * 1024 * 60,
    });
    results.push({
      command: `${command} ${commandArgs.join(" ")}`,
      ok: result.ok,
      output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
    });
  }
  return results;
}

async function writePullRequestBody(report, validation, upstream) {
  const tempDir = await mkdtemp(resolve(tmpdir(), "agent-ui-codex-pr-"));
  const bodyPath = resolve(tempDir, "body.md");
  await writeFile(
    bodyPath,
    [
      "## Summary",
      "",
      `- Refreshes generated Codex App Server schema to \`${upstream.commit}\`.`,
      "- Leaves protocol classification, normalizers, request builders, docs, and examples for review if validation exposes drift.",
      "- Does not publish packages or modify the upstream Codex checkout.",
      "",
      "## Drift Report",
      "",
      report,
      "",
      "## Validation",
      "",
      ...validation.map((entry) => {
        return `- ${entry.ok ? "[x]" : "[ ]"} \`${entry.command}\`${entry.ok ? "" : " failed"}`;
      }),
      "",
      "## Review Checklist",
      "",
      "- [ ] Classify every new stable and experimental method.",
      "- [ ] Update request builders, method result types, normalizers, and server-request handling when behavior changed.",
      "- [ ] Update docs and examples for any productized surface changes.",
      "- [ ] Rerun focused validation after semantic fixes.",
      "",
    ].join("\n"),
  );
  return bodyPath;
}
