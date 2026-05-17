import { mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdir(join(tmpdir(), `agent-ui-package-resolution-${process.pid}`), {
  recursive: true,
}).then(() => join(tmpdir(), `agent-ui-package-resolution-${process.pid}`));

const packages = [
  {
    dir: "core",
    name: "@nyosegawa/agent-ui-core",
    expected: {
      ".": "/dist/index.js",
    },
    blocked: ["./dist/index.js", "./src/index.ts", "./reducer"],
  },
  {
    dir: "codex",
    name: "@nyosegawa/agent-ui-codex",
    expected: {
      ".": "/dist/index.js",
      "./request-builders": "/dist/request-builders.js",
      "./websocket": "/dist/websocket.js",
    },
    blocked: ["./dist/index.js", "./src/protocol.ts", "./generated/stable"],
  },
  {
    dir: "react",
    name: "@nyosegawa/agent-ui-react",
    expected: {
      ".": "/dist/index.js",
      "./styles.css": "/dist/styles.css",
    },
    blocked: ["./dist/index.js", "./src/index.ts", "./style.css", "./styles/tokens.css"],
  },
  {
    dir: "server",
    name: "@nyosegawa/agent-ui-server",
    expected: {
      ".": "/dist/index.js",
    },
    blocked: ["./dist/index.js", "./src/websocket.ts", "./dynamic-tools"],
  },
  {
    dir: "web-components",
    name: "@nyosegawa/agent-ui-web-components",
    expected: {
      ".": "/dist/index.js",
    },
    blocked: ["./dist/index.js", "./src/index.tsx"],
  },
];

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
      `const packages = ${JSON.stringify(packages.map(({ name, expected, blocked }) => ({ name, expected, blocked })))};`,
      "const resolved = {};",
      "for (const pkg of packages) {",
      "  resolved[pkg.name] = {};",
      "  for (const [subpath, suffix] of Object.entries(pkg.expected)) {",
      "    const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`;",
      "    const target = import.meta.resolve(specifier);",
      "    if (!target.endsWith(suffix)) throw new Error(`${specifier} resolved to ${target}, expected ${suffix}`);",
      "    if (!suffix.endsWith('.css')) await import(specifier);",
      "    resolved[pkg.name][subpath] = target;",
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
  process.stdout.write(result.stdout);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}
