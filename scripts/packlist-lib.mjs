import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const workspacePackageDirs = ["core", "codex", "react", "server", "web-components"];
const staleArtifactPattern = /(?:^|\/)(?:\.DS_Store|.*\.(?:bak|old|tmp|tsbuildinfo))$/;

export { workspacePackageDirs };

export async function readPackagePacklist(packageRoot) {
  const { stdout } = await execFileAsync("npm", ["pack", "--dry-run", "--json"], {
    cwd: packageRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });
  return parseNpmPackDryRun(stdout);
}

export function parseNpmPackDryRun(output) {
  const [packument] = JSON.parse(output);
  return packument.files.map((file) => file.path).sort();
}

export function validatePacklistEntries(packageDir, entries) {
  const issues = [];
  if (!entries.some((entry) => entry.startsWith("dist/"))) {
    issues.push(`${packageDir} packs no dist files`);
  }
  for (const entry of entries) {
    if (staleArtifactPattern.test(entry)) {
      issues.push(`${packageDir} packs stale artifact ${entry}`);
      continue;
    }
    if (entry === "package.json" || entry === "README.md" || entry.startsWith("dist/")) continue;
    if (packageDir === "codex" && entry.startsWith("src/generated/")) {
      issues.push(`${packageDir} packs private generated file ${entry}`);
      continue;
    }
    if (entry.startsWith("src/")) {
      issues.push(`${packageDir} packs unexpected source file ${entry}`);
      continue;
    }
    issues.push(`${packageDir} packs unexpected file ${entry}`);
  }
  return issues;
}

export function formatPacklistIssues(issues) {
  return [
    "Package packlists include files outside the allowed publish surface.",
    ...issues.map((issue) => `- ${issue}`),
  ].join("\n");
}
