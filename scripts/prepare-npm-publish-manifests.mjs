import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import { workspacePackageDirs } from "./packlist-lib.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const packageDir of workspacePackageDirs) {
    const manifestPath = join(repoRoot, "packages", packageDir, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const normalized = normalizePublishManifest(manifest);
    await writeFile(manifestPath, `${JSON.stringify(normalized, null, 2)}\n`);
  }
}

export function normalizePublishManifest(manifest) {
  const normalized = { ...manifest };
  if (!normalized.dependencies) return normalized;

  normalized.dependencies = Object.fromEntries(
    Object.entries(normalized.dependencies).map(([name, version]) => {
      if (!name.startsWith("@nyosegawa/agent-ui-") || !String(version).startsWith("workspace:")) {
        return [name, version];
      }

      const range = String(version).slice("workspace:".length);
      return [name, range === "*" ? normalized.version : range];
    }),
  );
  return normalized;
}
