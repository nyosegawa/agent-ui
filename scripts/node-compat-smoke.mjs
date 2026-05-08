import { createRequire } from "node:module";
import { log } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const packages = ["core", "codex", "react", "server"];

for (const name of packages) {
  const root = new globalThis.URL(`../packages/${name}/`, import.meta.url);
  const esm = new globalThis.URL("dist/index.js", root);
  const cjs = new globalThis.URL("dist/index.cjs", root);
  if (!existsSync(esm) || !existsSync(cjs)) {
    throw new Error(`Package ${name} must be built before compatibility smoke`);
  }
  await import(esm);
  require(fileURLToPath(cjs));
}

const core = await import(new globalThis.URL("../packages/core/dist/index.js", import.meta.url));
const codex = await import(new globalThis.URL("../packages/codex/dist/index.js", import.meta.url));
const server = await import(new globalThis.URL("../packages/server/dist/index.js", import.meta.url));

if (typeof core.createInitialAgentState !== "function") {
  throw new Error("core ESM export missing createInitialAgentState");
}
if (typeof codex.createCodexStdioTransport !== "function") {
  throw new Error("codex ESM export missing createCodexStdioTransport");
}
if (typeof server.createCodexAppServerBridge !== "function") {
  throw new Error("server ESM export missing createCodexAppServerBridge");
}

log(`Node compatibility smoke passed on ${process.version}`);
