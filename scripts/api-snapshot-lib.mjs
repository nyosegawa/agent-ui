import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";

export async function checkApiSnapshots({ repoRoot, snapshotRoot, update = false }) {
  await mkdir(snapshotRoot, { recursive: true });
  const declarations = await collectPublicDeclarations(repoRoot);
  assertBuiltDeclarationsExist(declarations, repoRoot);
  await assertDeclarationConditionParity(declarations, repoRoot);
  const expectedSnapshots = new Set(declarations.map((entry) => entry.snapshotName));
  const existingSnapshots = new Set(
    (await readdir(snapshotRoot)).filter((entry) => entry.endsWith(".d.ts")).sort(),
  );

  const missing = [];
  const changed = [];
  const stale = [...existingSnapshots]
    .filter((snapshotName) => !expectedSnapshots.has(snapshotName))
    .sort();

  for (const entry of declarations) {
    const actual = normalizeDeclarationSnapshot(await readFile(entry.declarationPath, "utf8"));
    const snapshotPath = join(snapshotRoot, entry.snapshotName);
    if (!existsSync(snapshotPath)) {
      missing.push(entry.snapshotName);
      if (update) await writeFile(snapshotPath, actual);
      continue;
    }
    const expected = normalizeDeclarationSnapshot(await readFile(snapshotPath, "utf8"));
    if (actual !== expected) {
      changed.push(entry.snapshotName);
      if (update) await writeFile(snapshotPath, actual);
    }
  }

  if (update) {
    for (const snapshotName of stale) await rm(join(snapshotRoot, snapshotName), { force: true });
    return { changed, missing, stale };
  }

  if (missing.length > 0 || changed.length > 0 || stale.length > 0) {
    throw new Error(formatSnapshotFailure({ changed, missing, stale }));
  }

  return { changed, missing, stale };
}

export async function collectPublicDeclarations(repoRoot) {
  const surfaces = await readWorkspacePackageSurfaces(repoRoot);
  return surfaces
    .filter((surface) => surface.typesTarget)
    .map((surface) => ({
      declarationPath: join(surface.packageRoot, surface.typesTarget.replace(/^\.\//, "")),
      importDeclarationPath: surface.importTypesTarget
        ? join(surface.packageRoot, surface.importTypesTarget.replace(/^\.\//, ""))
        : undefined,
      packageName: surface.packageName,
      requireDeclarationPath: surface.requireTypesTarget
        ? join(surface.packageRoot, surface.requireTypesTarget.replace(/^\.\//, ""))
        : undefined,
      snapshotName: surface.snapshotName,
      specifier: surface.specifier,
    }))
    .sort((left, right) => left.snapshotName.localeCompare(right.snapshotName));
}

function formatSnapshotFailure({ changed, missing, stale }) {
  const parts = [];
  if (missing.length > 0) parts.push(`missing: ${missing.join(", ")}`);
  if (changed.length > 0) parts.push(`changed: ${changed.join(", ")}`);
  if (stale.length > 0) parts.push(`stale: ${stale.join(", ")}`);
  return `Built declaration snapshots are out of date (${parts.join("; ")}). Run bun run test:api-snapshots:update intentionally after reviewing the public API.`;
}

function assertBuiltDeclarationsExist(declarations, repoRoot) {
  const missing = declarations
    .filter((entry) => !existsSync(entry.declarationPath))
    .map((entry) => {
      const relativePath = relative(repoRoot, entry.declarationPath);
      return `${entry.specifier} -> ${relativePath}`;
    });
  if (missing.length === 0) return;

  throw new Error(
    [
      "Built declaration files are missing for public API snapshot checks.",
      ...missing.map((entry) => `- ${entry}`),
      "Run bun run build or bun run validate:packages before bun run test:api-snapshots.",
    ].join("\n"),
  );
}

async function assertDeclarationConditionParity(declarations, repoRoot) {
  const mismatches = [];
  for (const entry of declarations) {
    if (
      !entry.importDeclarationPath ||
      !entry.requireDeclarationPath ||
      entry.importDeclarationPath === entry.requireDeclarationPath
    ) {
      continue;
    }
    const importDeclaration = normalizeDeclarationForConditionParity(
      await readFile(entry.importDeclarationPath, "utf8"),
    );
    const requireDeclaration = normalizeDeclarationForConditionParity(
      await readFile(entry.requireDeclarationPath, "utf8"),
    );
    if (importDeclaration !== requireDeclaration) {
      mismatches.push(
        `${entry.specifier} -> ${relative(repoRoot, entry.importDeclarationPath)} != ${relative(
          repoRoot,
          entry.requireDeclarationPath,
        )}`,
      );
    }
  }
  if (mismatches.length === 0) return;

  throw new Error(
    [
      "Declaration condition parity failed for public exports.",
      ...mismatches.map((entry) => `- ${entry}`),
    ].join("\n"),
  );
}

export function normalizeDeclarationSnapshot(value) {
  return `${normalizePrivateDeclarationChunks(value).trim()}\n`;
}

function normalizeDeclarationForConditionParity(value) {
  return normalizeDeclarationSnapshot(value)
    .replace(/\.d\.cts\b/g, ".d.ts")
    .replace(/\.cjs\b/g, ".js");
}

function normalizePrivateDeclarationChunks(value) {
  return value.replace(
    /(\.\/[A-Za-z0-9_$-]+-)[A-Za-z0-9_-]{6,}(\.(?:cjs|js))/g,
    "$1<chunk>$2",
  );
}
