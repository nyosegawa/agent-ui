#!/usr/bin/env node
import { log } from "node:console";
import process from "node:process";

import {
  codexRepoPath,
  codexRemoteMainCommit,
  currentProtocolMetadata,
  ensureCodexSubmoduleInitialized,
  parseArgs,
  upstreamInfo,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.has("help")) {
  log(`Usage: node collect-upstream-info.mjs [--json]\n`);
  process.exit(0);
}

await ensureCodexSubmoduleInitialized();
const [upstream, current, remoteMainCommit] = await Promise.all([
  upstreamInfo(codexRepoPath),
  currentProtocolMetadata(),
  codexRemoteMainCommit(),
]);

if (args.has("json")) {
  log(JSON.stringify({ current, remoteMainCommit, upstream }, null, 2));
} else {
  log(`# Codex Upstream Info

- Current Agent UI protocol commit: \`${current.commit}\`
- Current package metadata commit: \`${current.packageCommit ?? "missing"}\`
- Codex submodule: \`${upstream.codexRepo}\`
- Codex submodule branch: \`${upstream.branch}\`
- Codex submodule commit: \`${upstream.commit}\`
- Codex remote main commit: \`${remoteMainCommit}\`
- Codex commit date: \`${upstream.commitDate}\`
- Codex subject: ${upstream.subject}
- Codex App Server focused status: ${upstream.focusedStatus ? "dirty" : "clean"}
`);
}
