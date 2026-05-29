import { createRequire } from "node:module";
import { log } from "node:console";
import { existsSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";
import { assertRepresentativeNamedExports } from "./runtime-export-policy.mjs";

const require = createRequire(import.meta.url);
const repoRoot = fileURLToPath(new globalThis.URL("..", import.meta.url));

const packages = [
  {
    dir: "core",
    name: "core",
  },
  {
    dir: "codex",
    name: "codex",
  },
  {
    dir: "react",
    name: "react",
  },
  {
    dir: "server",
    name: "server",
  },
  {
    dir: "web-components",
    name: "web-components",
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
  const packageSpecifier = `@nyosegawa/agent-ui-${pkg.name}`;
  assertRepresentativeNamedExports(packageSpecifier, "ESM", esmModule);
  assertRepresentativeNamedExports(packageSpecifier, "CJS", cjsModule);
  for (const surface of publicSurfaceByPackage.get(`@nyosegawa/agent-ui-${pkg.name}`) ?? []) {
    const importTarget = new globalThis.URL(surface.importTarget.replace(/^\.\//, ""), root);
    const requireTarget = new globalThis.URL(surface.requireTarget.replace(/^\.\//, ""), root);
    if (!existsSync(importTarget) || !existsSync(requireTarget)) {
      throw new Error(`${surface.specifier} export targets must exist after build`);
    }
    if (!surface.isAsset) {
      const importModule = await import(importTarget);
      const requireModule = require(fileURLToPath(requireTarget));
      assertRepresentativeNamedExports(surface.specifier, "ESM", importModule);
      assertRepresentativeNamedExports(surface.specifier, "CJS", requireModule);
    }
  }
}

log(`Node compatibility smoke passed on ${process.version}`);
