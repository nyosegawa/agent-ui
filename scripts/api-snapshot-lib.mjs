import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { readWorkspacePackageSurfaces } from "./public-package-surface.mjs";

export async function checkApiSnapshots({ repoRoot, snapshotRoot, update = false }) {
  await mkdir(snapshotRoot, { recursive: true });
  const declarations = await collectPublicDeclarations(repoRoot);
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
    const actual = normalizeDeclarations(await readFile(entry.declarationPath, "utf8"));
    const snapshotPath = join(snapshotRoot, entry.snapshotName);
    if (!existsSync(snapshotPath)) {
      missing.push(entry.snapshotName);
      if (update) await writeFile(snapshotPath, actual);
      continue;
    }
    const expected = normalizeDeclarations(await readFile(snapshotPath, "utf8"));
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
      packageName: surface.packageName,
      snapshotName: surface.snapshotName,
      specifier: surface.specifier,
    }))
    .sort((left, right) => left.snapshotName.localeCompare(right.snapshotName));
}

export function formatSnapshotFailure({ changed, missing, stale }) {
  const parts = [];
  if (missing.length > 0) parts.push(`missing: ${missing.join(", ")}`);
  if (changed.length > 0) parts.push(`changed: ${changed.join(", ")}`);
  if (stale.length > 0) parts.push(`stale: ${stale.join(", ")}`);
  return `Built declaration snapshots are out of date (${parts.join("; ")}). Run bun run test:api-snapshots:update intentionally after reviewing the public API.`;
}

function normalizeDeclarations(value) {
  return `${value.trim()}\n`;
}
