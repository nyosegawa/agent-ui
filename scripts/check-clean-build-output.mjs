import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";

const repoRoot = resolve(import.meta.dirname, "..");
const roots = ["packages", "examples"];
const buildOutputNames = new Set(["dist", ".next"]);
const ignoredSegments = new Set(["node_modules"]);
const found = [];

for (const root of roots) {
  walk(join(repoRoot, root));
}

if (found.length > 0) {
  process.stderr.write("Build output directories are present:\n");
  for (const path of found) process.stderr.write(`- ${path}\n`);
  process.stderr.write(
    "Remove build artifacts before clean-state validation, or run a build step that recreates them intentionally.",
  );
  process.stderr.write("\n");
  process.exit(1);
}

function walk(directory) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    if (ignoredSegments.has(entry)) continue;
    const path = join(directory, entry);
    const stats = statSync(path);
    if (!stats.isDirectory()) continue;
    if (buildOutputNames.has(entry)) {
      found.push(relative(repoRoot, path));
      continue;
    }
    walk(path);
  }
}
