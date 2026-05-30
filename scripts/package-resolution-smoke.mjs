import { readdirSync } from "node:fs";
import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const buildResult = spawnSync("bun", ["run", "build"], {
  cwd: repoRoot,
  encoding: "utf8",
  stdio: "inherit",
});
if (buildResult.status !== 0) {
  throw new Error("package resolution smoke requires a fresh successful build");
}

const tempRoot = await mkdir(join(tmpdir(), `agent-ui-package-resolution-${process.pid}`), {
  recursive: true,
}).then(() => join(tmpdir(), `agent-ui-package-resolution-${process.pid}`));

const packageSurfaces = await readWorkspacePackageSurfaces(repoRoot);
assertCanonicalPublicSpecifiers(packageSurfaces);
const groupedSurfaces = new Map();
for (const surface of packageSurfaces) {
  groupedSurfaces.set(surface.packageName, [...(groupedSurfaces.get(surface.packageName) ?? []), surface]);
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
    await symlink(join(repoRoot, "packages", pkg.dir), join(scopeDir, pkg.name.split("/")[1]), "dir");
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

  const css = await readFile(join(repoRoot, "packages", "react", "dist", "styles.css"), "utf8");
  if (!css.includes('@import "./styles/tokens.css";')) {
    throw new Error("dist/styles.css does not reference copied style chunks");
  }
  await assertWebComponentsConsumerSmoke();
  process.stdout.write(result.stdout);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
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
    if (!ctor) throw new Error("defineAgentChatElement did not register a custom element");
    const element = dom.window.document.createElement("agent-chat");
    dom.window.document.body.append(element);
    await new Promise((resolve) => globalThis.setTimeout(resolve, 20));
    if (!dom.window.document.body.textContent?.includes("Agent UI transport is not configured.")) {
      throw new Error("web-components no-transport render smoke did not render fallback status");
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
  if (dir === "web-components") return ["./dist/index.js", "./dist/index.cjs", "./src/index.tsx"];
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
    "@nyosegawa/agent-ui-codex/websocket",
    "@nyosegawa/agent-ui-core",
    "@nyosegawa/agent-ui-react",
    "@nyosegawa/agent-ui-react/styles.css",
    "@nyosegawa/agent-ui-server",
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
