import { createRequire } from "node:module";
import { log } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const packages = [
  {
    dir: "core",
    name: "core",
    namedExports: [
      "agentReducer",
      "FakeAgentTransport",
      "createInitialAgentState",
      "selectServerRequestQueue",
    ],
  },
  {
    dir: "codex",
    name: "codex",
    namedExports: [
      "createCodexSession",
      "createCodexStdioTransport",
      "createCodexWebSocketTransport",
      "normalizeCodexServerMessage",
      "threadStartParams",
    ],
  },
  {
    dir: "react",
    name: "react",
    namedExports: [
      "AgentChat",
      "AgentComposer",
      "AgentProvider",
      "AgentThreadTimeline",
      "useAgentApprovals",
      "useAgentContext",
    ],
  },
  {
    dir: "server",
    name: "server",
    namedExports: [
      "attachAgentUiWebSocketBridge",
      "createCodexAppServerBridge",
      "createAgentUiLocalUploadHandler",
      "resolveServerRequestPolicy",
    ],
  },
  {
    dir: "web-components",
    name: "web-components",
    namedExports: ["AgentChatElement", "defineAgentChatElement"],
  },
];

for (const pkg of packages) {
  const root = new globalThis.URL(`../packages/${pkg.dir}/`, import.meta.url);
  const esm = new globalThis.URL("dist/index.js", root);
  const cjs = new globalThis.URL("dist/index.cjs", root);
  if (!existsSync(esm) || !existsSync(cjs)) {
    throw new Error(`Package ${pkg.name} must be built before compatibility smoke`);
  }
  const esmModule = await import(esm);
  const cjsModule = require(fileURLToPath(cjs));
  for (const exportName of pkg.namedExports) {
    if (!(exportName in esmModule)) {
      throw new Error(`${pkg.name} ESM export missing ${exportName}`);
    }
    if (!(exportName in cjsModule)) {
      throw new Error(`${pkg.name} CJS export missing ${exportName}`);
    }
  }
}

const codexRequestBuilders = await import(
  new globalThis.URL("../packages/codex/dist/request-builders.js", import.meta.url)
);
if (typeof codexRequestBuilders.turnStartParams !== "function") {
  throw new Error("codex/request-builders ESM export missing turnStartParams");
}

const codexWebsocket = await import(
  new globalThis.URL("../packages/codex/dist/websocket.js", import.meta.url)
);
if (typeof codexWebsocket.createCodexWebSocketTransport !== "function") {
  throw new Error("codex/websocket ESM export missing createCodexWebSocketTransport");
}

log(`Node compatibility smoke passed on ${process.version}`);
