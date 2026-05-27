import { createRequire } from "node:module";
import { log } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";

const require = createRequire(import.meta.url);
const repoRoot = fileURLToPath(new globalThis.URL("..", import.meta.url));

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

const publicSurfaces = await readWorkspacePackageSurfaces(repoRoot);
const publicSurfaceByPackage = new Map();
for (const surface of publicSurfaces) {
  publicSurfaceByPackage.set(surface.packageName, [
    ...(publicSurfaceByPackage.get(surface.packageName) ?? []),
    surface,
  ]);
}

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
  for (const surface of publicSurfaceByPackage.get(`@nyosegawa/agent-ui-${pkg.name}`) ?? []) {
    const importTarget = new globalThis.URL(surface.importTarget.replace(/^\.\//, ""), root);
    const requireTarget = new globalThis.URL(surface.requireTarget.replace(/^\.\//, ""), root);
    if (!existsSync(importTarget) || !existsSync(requireTarget)) {
      throw new Error(`${surface.specifier} export targets must exist after build`);
    }
    if (!surface.isAsset) {
      await import(importTarget);
      require(fileURLToPath(requireTarget));
    }
  }
}

log(`Node compatibility smoke passed on ${process.version}`);
