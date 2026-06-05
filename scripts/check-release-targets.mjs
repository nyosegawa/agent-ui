import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import process from "node:process";

import { readPublicPackageManifests } from "./release-package-policy.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = await checkReleaseTargets(repoRoot);
  if (process.env.GITHUB_OUTPUT) {
    await writeGithubOutputs(result, process.env.GITHUB_OUTPUT);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.error) {
    process.exitCode = 1;
  }
}

export async function checkReleaseTargets(root = repoRoot, options = {}) {
  const changesets = await listPendingChangesets(root);
  const packages = await readPublicPackageManifests(root);
  const packageStatuses = await Promise.all(
    packages.map(async (workspacePackage) => {
      const published = await npmVersionExists(workspacePackage.name, workspacePackage.version, options);
      return {
        directory: workspacePackage.directory,
        name: workspacePackage.name,
        published,
        version: workspacePackage.version,
      };
    }),
  );
  const unpublished = packageStatuses.filter((pkg) => !pkg.published);
  const published = packageStatuses.filter((pkg) => pkg.published);
  const shouldPublish = changesets.length === 0 && unpublished.length > 0;
  const error =
    changesets.length > 0 && unpublished.length > 0
      ? "Unversioned changesets remain while unpublished package versions exist. Merge a reviewed Changesets version PR before publishing."
      : undefined;

  return {
    changesets,
    error,
    packageNames: unpublished.map((pkg) => pkg.name).join(" "),
    packages: packageStatuses,
    published,
    publishedCount: published.length,
    shouldPublish,
    unpublished,
    unpublishedCount: unpublished.length,
    versions: [...new Set(packageStatuses.map((pkg) => pkg.version))],
  };
}

async function listPendingChangesets(root) {
  const changesetRoot = resolve(root, ".changeset");
  if (!existsSync(changesetRoot)) return [];
  const entries = await readdir(changesetRoot);
  return entries.filter((entry) => entry.endsWith(".md")).sort();
}

async function npmVersionExists(name, version, options) {
  if (options.registryVersions?.has(`${name}@${version}`)) {
    return options.registryVersions.get(`${name}@${version}`);
  }
  const result = await execFileAsync("npm", ["view", `${name}@${version}`, "version"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  }).catch((error) => error);
  if (result.stdout?.trim() === version) return true;
  if (result.code !== undefined || result.status !== undefined) return false;
  throw result;
}

async function writeGithubOutputs(result, outputPath) {
  const { appendFile } = await import("node:fs/promises");
  const lines = [
    `should_publish=${result.shouldPublish}`,
    `unpublished_count=${result.unpublishedCount}`,
    `published_count=${result.publishedCount}`,
    `package_names=${result.packageNames}`,
    `versions=${result.versions.join(" ")}`,
    `error=${result.error ?? ""}`,
  ];
  await appendFile(outputPath, `${lines.join("\n")}\n`);
}
