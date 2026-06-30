import { readdirSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildResult = spawnSync("bun", ["run", "build:packages"], {
  cwd: repoRoot,
  encoding: "utf8",
  stdio: "inherit",
});
if (buildResult.status !== 0) {
  throw new Error("package resolution smoke requires a fresh successful package build");
}

const tempRoot = await mkdir(
  join(tmpdir(), `agent-ui-package-resolution-${process.pid}`),
  {
    recursive: true,
  },
).then(() => join(tmpdir(), `agent-ui-package-resolution-${process.pid}`));

const packageSurfaces = await readWorkspacePackageSurfaces(repoRoot);
assertCanonicalPublicSpecifiers(packageSurfaces);
const groupedSurfaces = new Map();
for (const surface of packageSurfaces) {
  groupedSurfaces.set(surface.packageName, [
    ...(groupedSurfaces.get(surface.packageName) ?? []),
    surface,
  ]);
}
const packages = [...groupedSurfaces.values()].map((surfaces) => {
  const first = surfaces[0];
  return {
    blocked: blockedSubpathsForPackage(first.dir),
    dir: first.dir,
    name: first.packageName,
    publicSubpaths: surfaces.map((surface) => ({
      importTarget: surface.importTarget,
      isAsset: surface.isAsset,
      requireTarget: surface.requireTarget,
      specifier: surface.specifier,
      subpath: surface.subpath,
    })),
  };
});

try {
  const scopeDir = join(tempRoot, "node_modules", "@nyosegawa");
  await mkdir(scopeDir, { recursive: true });
  for (const pkg of packages) {
    await cp(
      join(repoRoot, "packages", pkg.dir),
      join(scopeDir, pkg.name.split("/")[1]),
      {
        dereference: false,
        filter: (source) =>
          source !== join(repoRoot, "packages", pkg.dir, "node_modules"),
        recursive: true,
      },
    );
    await linkPackageDependencies(pkg.dir, tempRoot);
  }
  await writeFile(join(tempRoot, "package.json"), JSON.stringify({ type: "module" }));

  const smokePath = join(tempRoot, "smoke.mjs");
  await writeFile(
    smokePath,
    [
      "import { createRequire } from 'node:module';",
      "const require = createRequire(import.meta.url);",
      `const packages = ${JSON.stringify(packages.map(({ name, publicSubpaths, blocked }) => ({ name, publicSubpaths, blocked })))};`,
      "const resolved = {};",
      "for (const pkg of packages) {",
      "  resolved[pkg.name] = {};",
      "  for (const entry of pkg.publicSubpaths) {",
      "    const target = import.meta.resolve(entry.specifier);",
      "    if (!target.endsWith(entry.importTarget.replace(/^\\./, ''))) throw new Error(`${entry.specifier} resolved to ${target}, expected ${entry.importTarget}`);",
      "    const cjsTarget = require.resolve(entry.specifier);",
      "    if (!cjsTarget.endsWith((entry.requireTarget ?? entry.importTarget).replace(/^\\./, ''))) throw new Error(`${entry.specifier} require.resolve returned ${cjsTarget}, expected ${entry.requireTarget ?? entry.importTarget}`);",
      "    if (!entry.isAsset) {",
      "      await import(entry.specifier);",
      "      require(entry.specifier);",
      "    }",
      "    resolved[pkg.name][entry.subpath] = { esm: target, cjs: cjsTarget };",
      "  }",
      "  for (const subpath of pkg.blocked) {",
      "    const specifier = `${pkg.name}/${subpath.slice(2)}`;",
      "    let failed = false;",
      "    try { import.meta.resolve(specifier); } catch { failed = true; }",
      "    if (!failed) throw new Error(`undocumented deep import unexpectedly resolved: ${specifier}`);",
      "  }",
      "}",
      "console.log(JSON.stringify(resolved, null, 2));",
    ].join("\n"),
  );

  const result = spawnSync(process.execPath, [smokePath], {
    cwd: tempRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stdout.write(result.stdout);
    throw new Error("package resolution smoke failed");
  }
  await assertReactEntrypointContextSmoke(tempRoot);

  const css = await readFile(
    join(repoRoot, "packages", "react", "dist", "styles.css"),
    "utf8",
  );
  if (!css.includes('@import "./styles/tokens.css";')) {
    throw new Error("dist/styles.css does not reference copied style chunks");
  }
  await assertWebComponentsConsumerSmoke();
  process.stdout.write(result.stdout);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

async function assertReactEntrypointContextSmoke(tempRoot) {
  const fixtureSource = `
function createSharedState(createInitialAgentState) {
  const state = createInitialAgentState();
  state.threadLifecycle.activeThreadId = "thread-shared";
  state.threads["thread-shared"] = {
    activity: "idle",
    availability: "available",
    id: "thread-shared",
    metadata: {
      cwd: "/workspace/shared",
      title: "Shared provider thread"
    },
    operations: {},
    orderedTurnIds: ["turn-shared"],
    runtime: { status: { type: "idle" } },
    status: "ready",
    storage: "stored",
    thread: {
      id: "thread-shared",
      name: "Shared provider thread",
      path: "/workspace/shared"
    },
    turns: {
      "turn-shared": {
        blocksByItemId: {
          "item-shared": {
            id: "item-shared",
            kind: "text",
            status: "completed",
            text: "Rendered from package-resolution smoke."
          }
        },
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: ["item-shared"],
        items: {
          "item-shared": {
            id: "item-shared",
            kind: "agentMessage",
            status: "completed",
            text: "Rendered from package-resolution smoke.",
            threadId: "thread-shared",
            turnId: "turn-shared"
          }
        },
        streamingTextByItemId: {},
        turn: {
          id: "turn-shared",
          itemsView: "full",
          status: "completed",
          threadId: "thread-shared"
        }
      }
    }
  };
  return state;
}
`;
  const esmSmokePath = join(tempRoot, "react-context-smoke.mjs");
  await writeFile(
    esmSmokePath,
    [
      "import React from 'react';",
      "import { renderToString } from 'react-dom/server';",
      "import { createInitialAgentState, FakeAgentTransport } from '@nyosegawa/agent-ui-core';",
      "import { AgentI18nProvider, AgentProvider } from '@nyosegawa/agent-ui-react';",
      "import { useAgentI18n, useAgentThreads } from '@nyosegawa/agent-ui-react/headless';",
      "import { AgentComposer, AgentMessageList } from '@nyosegawa/agent-ui-react/primitives';",
      fixtureSource,
      "function Probe() {",
      "  const { activeThreadId, threads } = useAgentThreads();",
      "  const { t } = useAgentI18n();",
      "  return React.createElement(React.Fragment, null,",
      "    React.createElement('output', { 'aria-label': 'active thread' }, activeThreadId ?? ''),",
      "    React.createElement('output', { 'aria-label': 'thread count' }, String(threads.length)),",
      "    React.createElement('output', { 'aria-label': 'localized message' }, t('common.message')),",
      "    React.createElement(AgentMessageList, { threadId: 'thread-shared' }),",
      "    React.createElement(AgentComposer, { threadId: 'thread-shared' })",
      "  );",
      "}",
      "const html = renderToString(React.createElement(AgentProvider, { initialState: createSharedState(createInitialAgentState), transport: new FakeAgentTransport() }, React.createElement(AgentI18nProvider, { messages: { 'common.message': 'Package smoke message' } }, React.createElement(Probe))));",
      "if (!html.includes('thread-shared') || !html.includes('Rendered from package-resolution smoke.') || !html.includes('Package smoke message')) throw new Error('ESM React entrypoints did not share AgentProvider context');",
    ].join("\n"),
  );
  const cjsSmokePath = join(tempRoot, "react-context-smoke.cjs");
  await writeFile(
    cjsSmokePath,
    [
      "const React = require('react');",
      "const { renderToString } = require('react-dom/server');",
      "const { createInitialAgentState, FakeAgentTransport } = require('@nyosegawa/agent-ui-core');",
      "const { AgentI18nProvider, AgentProvider } = require('@nyosegawa/agent-ui-react');",
      "const { useAgentI18n, useAgentThreads } = require('@nyosegawa/agent-ui-react/headless');",
      "const { AgentComposer, AgentMessageList } = require('@nyosegawa/agent-ui-react/primitives');",
      fixtureSource,
      "function Probe() {",
      "  const { activeThreadId, threads } = useAgentThreads();",
      "  const { t } = useAgentI18n();",
      "  return React.createElement(React.Fragment, null,",
      "    React.createElement('output', { 'aria-label': 'active thread' }, activeThreadId || ''),",
      "    React.createElement('output', { 'aria-label': 'thread count' }, String(threads.length)),",
      "    React.createElement('output', { 'aria-label': 'localized message' }, t('common.message')),",
      "    React.createElement(AgentMessageList, { threadId: 'thread-shared' }),",
      "    React.createElement(AgentComposer, { threadId: 'thread-shared' })",
      "  );",
      "}",
      "const html = renderToString(React.createElement(AgentProvider, { initialState: createSharedState(createInitialAgentState), transport: new FakeAgentTransport() }, React.createElement(AgentI18nProvider, { messages: { 'common.message': 'Package smoke message' } }, React.createElement(Probe))));",
      "if (!html.includes('thread-shared') || !html.includes('Rendered from package-resolution smoke.') || !html.includes('Package smoke message')) throw new Error('CJS React entrypoints did not share AgentProvider context');",
    ].join("\n"),
  );
  const mixedSmokePath = join(tempRoot, "react-context-mixed-smoke.mjs");
  await writeFile(
    mixedSmokePath,
    [
      "import { createRequire } from 'node:module';",
      "import React from 'react';",
      "import { renderToString } from 'react-dom/server';",
      "import { createInitialAgentState, FakeAgentTransport } from '@nyosegawa/agent-ui-core';",
      "import { AgentI18nProvider as EsmAgentI18nProvider, AgentProvider as EsmAgentProvider } from '@nyosegawa/agent-ui-react';",
      "import { useAgentI18n as useEsmAgentI18n, useAgentThreads as useEsmAgentThreads } from '@nyosegawa/agent-ui-react/headless';",
      "import { AgentComposer as EsmAgentComposer, AgentMessageList as EsmAgentMessageList } from '@nyosegawa/agent-ui-react/primitives';",
      "const require = createRequire(import.meta.url);",
      "const { AgentI18nProvider: CjsAgentI18nProvider, AgentProvider: CjsAgentProvider } = require('@nyosegawa/agent-ui-react');",
      "const { useAgentI18n: useCjsAgentI18n, useAgentThreads: useCjsAgentThreads } = require('@nyosegawa/agent-ui-react/headless');",
      "const { AgentComposer: CjsAgentComposer, AgentMessageList: CjsAgentMessageList } = require('@nyosegawa/agent-ui-react/primitives');",
      fixtureSource,
      "function CjsProbe() {",
      "  const { activeThreadId, threads } = useCjsAgentThreads();",
      "  const { t } = useCjsAgentI18n();",
      "  return React.createElement(React.Fragment, null,",
      "    React.createElement('output', null, activeThreadId ?? ''),",
      "    React.createElement('output', null, String(threads.length)),",
      "    React.createElement('output', null, t('common.message')),",
      "    React.createElement(CjsAgentMessageList, { threadId: 'thread-shared' }),",
      "    React.createElement(CjsAgentComposer, { threadId: 'thread-shared' })",
      "  );",
      "}",
      "function EsmProbe() {",
      "  const { activeThreadId, threads } = useEsmAgentThreads();",
      "  const { t } = useEsmAgentI18n();",
      "  return React.createElement(React.Fragment, null,",
      "    React.createElement('output', null, activeThreadId ?? ''),",
      "    React.createElement('output', null, String(threads.length)),",
      "    React.createElement('output', null, t('common.message')),",
      "    React.createElement(EsmAgentMessageList, { threadId: 'thread-shared' }),",
      "    React.createElement(EsmAgentComposer, { threadId: 'thread-shared' })",
      "  );",
      "}",
      "const esmRootHtml = renderToString(React.createElement(EsmAgentProvider, { initialState: createSharedState(createInitialAgentState), transport: new FakeAgentTransport() }, React.createElement(EsmAgentI18nProvider, { messages: { 'common.message': 'Mixed ESM root message' } }, React.createElement(CjsProbe))));",
      "if (!esmRootHtml.includes('thread-shared') || !esmRootHtml.includes('Rendered from package-resolution smoke.') || !esmRootHtml.includes('Mixed ESM root message')) throw new Error('ESM root did not share context with CJS subpaths');",
      "const cjsRootHtml = renderToString(React.createElement(CjsAgentProvider, { initialState: createSharedState(createInitialAgentState), transport: new FakeAgentTransport() }, React.createElement(CjsAgentI18nProvider, { messages: { 'common.message': 'Mixed CJS root message' } }, React.createElement(EsmProbe))));",
      "if (!cjsRootHtml.includes('thread-shared') || !cjsRootHtml.includes('Rendered from package-resolution smoke.') || !cjsRootHtml.includes('Mixed CJS root message')) throw new Error('CJS root did not share context with ESM subpaths');",
    ].join("\n"),
  );
  for (const smokePath of [esmSmokePath, cjsSmokePath, mixedSmokePath]) {
    const result = spawnSync(process.execPath, [smokePath], {
      cwd: tempRoot,
      encoding: "utf8",
      stdio: "pipe",
    });
    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      process.stdout.write(result.stdout);
      throw new Error(`${smokePath} failed`);
    }
  }
}

async function assertWebComponentsConsumerSmoke() {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM("<!doctype html><body></body>", {
    pretendToBeVisual: true,
    url: "http://127.0.0.1/",
  });
  const previous = {
    customElements: globalThis.customElements,
    document: globalThis.document,
    HTMLElement: globalThis.HTMLElement,
    navigator: globalThis.navigator,
    window: globalThis.window,
  };
  Object.defineProperties(globalThis, {
    customElements: { configurable: true, value: dom.window.customElements },
    document: { configurable: true, value: dom.window.document },
    HTMLElement: { configurable: true, value: dom.window.HTMLElement },
    navigator: { configurable: true, value: dom.window.navigator },
    window: { configurable: true, value: dom.window },
  });
  try {
    const module = await import(
      new globalThis.URL("../packages/web-components/dist/index.js", import.meta.url)
    );
    const ctor = module.defineAgentChatElement();
    if (!ctor)
      throw new Error("defineAgentChatElement did not register a custom element");
    const element = dom.window.document.createElement("agent-chat");
    dom.window.document.body.append(element);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
    if (
      !dom.window.document.body.textContent?.includes(
        "Agent UI transport is not configured.",
      )
    ) {
      throw new Error(
        "web-components no-transport render smoke did not render fallback status",
      );
    }
    element.remove();
    await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
  } finally {
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete globalThis[key];
      } else {
        Object.defineProperty(globalThis, key, { configurable: true, value });
      }
    }
  }
}

async function linkPackageDependencies(packageDir, tempRoot) {
  const nodeModulesDir = join(repoRoot, "packages", packageDir, "node_modules");
  let entries;
  try {
    entries = await readdir(nodeModulesDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === ".bin" || entry.name === "@nyosegawa") continue;
    const sourcePath = join(nodeModulesDir, entry.name);
    if (entry.name.startsWith("@")) {
      const scopeTarget = join(tempRoot, "node_modules", entry.name);
      await mkdir(scopeTarget, { recursive: true });
      const scopedEntries = await readdir(sourcePath, { withFileTypes: true });
      for (const scopedEntry of scopedEntries) {
        await linkDependency(
          join(sourcePath, scopedEntry.name),
          join(scopeTarget, scopedEntry.name),
        );
      }
      continue;
    }
    await linkDependency(sourcePath, join(tempRoot, "node_modules", entry.name));
  }
}

async function linkDependency(sourcePath, targetPath) {
  await rm(targetPath, { force: true, recursive: true });
  await symlink(sourcePath, targetPath, "dir");
}

function blockedSubpathsForPackage(dir) {
  const common = ["./dist/index.js", "./dist/index.cjs", "./src/index.ts"];
  if (dir === "codex") {
    return [
      ...common,
      "./src/protocol.ts",
      "./src/generated",
      "./src/generated/stable",
      "./src/generated/experimental",
      "./src/generated/protocol-capabilities.ts",
      "./src/generated/stable/ClientRequest.ts",
      "./src/generated/stable/v2/ThreadStartParams.ts",
      "./generated/stable",
      "./dist/request-builders-bJCKxvYC.js",
    ];
  }
  if (dir === "react") {
    const styleChunks = readdirSync(join(repoRoot, "packages", "react", "src", "styles"))
      .filter((name) => name.endsWith(".css"))
      .flatMap((name) => [
        `./src/styles/${name}`,
        `./styles/${name}`,
        `./dist/styles/${name}`,
      ]);
    return [...common, "./style.css", "./dist/styles.css", ...styleChunks];
  }
  if (dir === "server") return [...common, "./src/websocket.ts", "./dynamic-tools"];
  if (dir === "web-components")
    return ["./dist/index.js", "./dist/index.cjs", "./src/index.tsx"];
  return [...common, "./reducer"];
}

function assertCanonicalPublicSpecifiers(surfaces) {
  const expected = [
    "@nyosegawa/agent-ui-codex",
    "@nyosegawa/agent-ui-codex/clients",
    "@nyosegawa/agent-ui-codex/normalizer",
    "@nyosegawa/agent-ui-codex/request-builders",
    "@nyosegawa/agent-ui-codex/session",
    "@nyosegawa/agent-ui-codex/stable-types",
    "@nyosegawa/agent-ui-codex/test-fixtures",
    "@nyosegawa/agent-ui-codex/websocket",
    "@nyosegawa/agent-ui-core",
    "@nyosegawa/agent-ui-core/internal",
    "@nyosegawa/agent-ui-react",
    "@nyosegawa/agent-ui-react/headless",
    "@nyosegawa/agent-ui-react/primitives",
    "@nyosegawa/agent-ui-react/styles.css",
    "@nyosegawa/agent-ui-server",
    "@nyosegawa/agent-ui-server/advanced",
    "@nyosegawa/agent-ui-web-components",
  ];
  const actual = surfaces.map((surface) => surface.specifier).sort();
  const missing = expected.filter((specifier) => !actual.includes(specifier));
  const extra = actual.filter((specifier) => !expected.includes(specifier));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      [
        "Package exports map drifted from the documented public surface.",
        missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
        extra.length > 0 ? `Extra: ${extra.join(", ")}` : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
}
