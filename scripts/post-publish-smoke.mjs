import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { readPublicPackageManifests } from "./release-package-policy.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await postPublishSmoke();
}

export async function postPublishSmoke(root = repoRoot) {
  const packages = await readPublicPackageManifests(root);
  const tempRoot = join(tmpdir(), `agent-ui-npm-smoke-${process.pid}`);
  await rm(tempRoot, { force: true, recursive: true });
  await mkdir(tempRoot, { recursive: true });

  try {
    run("bun", ["init", "-y"], tempRoot);
    run(
      "bun",
      [
        "add",
        "react",
        "react-dom",
        ...packages.map((pkg) => `${pkg.name}@${pkg.version}`),
      ],
      tempRoot,
    );
    await writeFile(join(tempRoot, "smoke.mjs"), smokeSource());
    run(process.execPath, [join(tempRoot, "smoke.mjs")], tempRoot);
    process.stdout.write(`post-publish smoke passed in ${tempRoot}\n`);
  } finally {
    if (!process.env.AGENT_UI_KEEP_NPM_SMOKE) {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }
}

function smokeSource() {
  const specifiers = [
    "@nyosegawa/agent-ui-core",
    "@nyosegawa/agent-ui-codex",
    "@nyosegawa/agent-ui-codex/clients",
    "@nyosegawa/agent-ui-codex/normalizer",
    "@nyosegawa/agent-ui-codex/request-builders",
    "@nyosegawa/agent-ui-codex/session",
    "@nyosegawa/agent-ui-codex/stable-types",
    "@nyosegawa/agent-ui-codex/test-fixtures",
    "@nyosegawa/agent-ui-codex/websocket",
    "@nyosegawa/agent-ui-react",
    "@nyosegawa/agent-ui-server",
    "@nyosegawa/agent-ui-web-components",
  ];
  return [
    "import { createRequire } from 'node:module';",
    "const require = createRequire(import.meta.url);",
    `const specifiers = ${JSON.stringify(specifiers)};`,
    "for (const specifier of specifiers) {",
    "  const esm = await import(specifier);",
    "  const cjs = require(specifier);",
    "  console.log('esm', specifier, Object.keys(esm).length);",
    "  console.log('cjs', specifier, Object.keys(cjs).length);",
    "}",
    "",
  ].join("\n");
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
