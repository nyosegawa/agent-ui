import { readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = process.argv.slice(2);

if (roots.length === 0) {
  process.stderr.write("Usage: node scripts/build-workspaces.mjs <root> [...root]\n");
  process.exit(1);
}

for (const root of roots) {
  const rootPath = join(repoRoot, root);
  let entries;
  try {
    entries = await readdir(rootPath, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") continue;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const result = spawnSync("bun", ["run", "--if-present", "build"], {
      cwd: join(rootPath, entry.name),
      encoding: "utf8",
      stdio: "inherit",
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}
