import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const workspacePackageDirs = ["core", "codex", "react", "server", "web-components"];
const staleArtifactPattern = /(?:^|\/)(?:\.DS_Store|.*\.(?:bak|old|tmp|tsbuildinfo))$/;

export { workspacePackageDirs };

export async function readBunPacklist(packageRoot) {
  const { stdout } = await execFileAsync("bun", ["pm", "pack", "--dry-run"], {
    cwd: packageRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });
  return parseBunPackDryRun(stdout);
}

export function parseBunPackDryRun(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.match(/^packed\s+\S+\s+(.+)$/)?.[1])
    .filter(Boolean)
    .sort();
}

export function validatePacklistEntries(packageDir, entries) {
  const issues = [];
  for (const entry of entries) {
    if (staleArtifactPattern.test(entry)) {
      issues.push(`${packageDir} packs stale artifact ${entry}`);
      continue;
    }
    if (entry === "package.json" || entry.startsWith("dist/")) continue;
    if (packageDir === "codex" && entry.startsWith("src/generated/")) {
      if (entry.endsWith(".json")) {
        issues.push(`${packageDir} packs private generated file ${entry}`);
      }
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
