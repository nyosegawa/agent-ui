#!/usr/bin/env node
import { log } from "node:console";
import process from "node:process";

import {
  codexRepoPath,
  codexRemoteMainCommit,
  currentGeneratedMethods,
  currentProtocolMetadata,
  diffMethodSets,
  ensureCodexSubmoduleInitialized,
  exportedUpstreamMethods,
  hasMethodDrift,
  parseArgs,
  renderDriftMarkdown,
  upstreamInfo,
  withCodexRemoteMainWorktree,
  writeReport,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.has("help")) {
  log(
    `Usage: node summarize-protocol-drift.mjs [--json] [--report file] [--fail-on-drift]\n`,
  );
  process.exit(0);
}

const generatedAt = new Date().toISOString();
await ensureCodexSubmoduleInitialized();
const [currentMetadata, currentMethods, currentSubmodule, remoteCommit] = await Promise.all([
  currentProtocolMetadata(),
  currentGeneratedMethods(),
  upstreamInfo(codexRepoPath),
  codexRemoteMainCommit(),
]);
const { upstream, upstreamMethods } =
  currentSubmodule.commit === remoteCommit
    ? {
        upstream: currentSubmodule,
        upstreamMethods: await exportedUpstreamMethods(codexRepoPath),
      }
    : await withCodexRemoteMainWorktree(async (worktree) => {
        return {
          upstream: await upstreamInfo(worktree),
          upstreamMethods: await exportedUpstreamMethods(worktree),
        };
      });
const diff = diffMethodSets(currentMethods, upstreamMethods);
const drift =
  currentMetadata.commit !== upstream.commit ||
  currentMetadata.packageCommit !== currentMetadata.commit ||
  hasMethodDrift(diff);

const payload = { currentMetadata, diff, drift, generatedAt, upstream };
const output = args.has("json")
  ? JSON.stringify(payload, null, 2)
  : renderDriftMarkdown({ currentMetadata, diff, generatedAt, upstream });

if (args.has("report")) {
  await writeReport(String(args.get("report")), output);
}
log(output);

if (drift && args.has("fail-on-drift")) {
  process.exitCode = 20;
}
