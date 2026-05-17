import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotRoot = join(repoRoot, "test", "api-snapshots");
const packages = ["core", "codex", "react", "server", "web-components"];
const update = process.argv.includes("--update");

await mkdir(snapshotRoot, { recursive: true });

const failures = [];
for (const name of packages) {
  const dist = join(repoRoot, "packages", name, "dist");
  const entries = (await readdir(dist)).filter((entry) => entry.endsWith(".d.ts")).sort();
  for (const entry of entries) {
    const actualPath = join(dist, entry);
    const snapshotName = `${name}__${entry}`;
    const snapshotPath = join(snapshotRoot, snapshotName);
    const actual = normalizeDeclarations(await readFile(actualPath, "utf8"));
    if (update || !existsSync(snapshotPath)) {
      await writeFile(snapshotPath, actual);
      continue;
    }
    const expected = normalizeDeclarations(await readFile(snapshotPath, "utf8"));
    if (actual !== expected) failures.push(snapshotName);
  }
}

if (failures.length > 0) {
  throw new Error(
    `Built declaration snapshots changed: ${failures.join(", ")}. Run bun run test:api-snapshots:update intentionally after reviewing the public API.`,
  );
}

function normalizeDeclarations(value) {
  return `${value.trim()}\n`;
}
