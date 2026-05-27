import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "..", "..", "..");
const packagesRoot = join(repoRoot, "packages");

describe("generated App Server schema ownership", () => {
  it("keeps generated schema files inside the Codex package only", () => {
    const generatedRoots = packageDirs()
      .map((packageName) => join(packagesRoot, packageName, "src", "generated"))
      .filter((path) => existsSync(path))
      .map((path) => relative(repoRoot, path));

    expect(generatedRoots).toEqual(["packages/codex/src/generated"]);
  });

  it("keeps direct generated schema imports inside the Codex package", () => {
    const offenders = sourceFiles()
      .filter((file) => !relative(repoRoot, file).startsWith("packages/codex/"))
      .filter((file) => /generated\/(stable|experimental)|\.\/generated/.test(readFileSync(file, "utf8")))
      .map((file) => relative(repoRoot, file));

    expect(offenders).toEqual([]);
  });
});

function packageDirs(): string[] {
  return readdirSync(packagesRoot).filter((entry) => {
    return existsSync(join(packagesRoot, entry, "package.json"));
  });
}

function sourceFiles(): string[] {
  const files: string[] = [];
  for (const packageName of packageDirs()) {
    collectSourceFiles(join(packagesRoot, packageName), files);
  }
  return files;
}

function collectSourceFiles(dir: string, files: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "dist" || entry.name === "node_modules") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(path, files);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
}
