import { readFile } from "node:fs/promises";
import { join } from "node:path";

const workspacePackageDirs = ["core", "codex", "react", "server", "web-components"];

export async function readWorkspacePackageSurfaces(repoRoot) {
  const surfaces = [];
  for (const dir of workspacePackageDirs) {
    const packageRoot = join(repoRoot, "packages", dir);
    const packageJson = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
    surfaces.push(...publicSubpathsFromPackageJson({ dir, packageJson, packageRoot }));
  }
  return surfaces.sort((left, right) => left.specifier.localeCompare(right.specifier));
}

function publicSubpathsFromPackageJson({ dir, packageJson, packageRoot }) {
  const exportsMap = packageJson.exports;
  if (!exportsMap || typeof exportsMap !== "object") {
    throw new Error(`${packageJson.name} must declare an exports map`);
  }
  return Object.entries(exportsMap).map(([subpath, entry]) => {
    const importEntry = conditionEntry(entry, "import");
    const requireEntry = conditionEntry(entry, "require");
    const defaultTarget =
      typeof entry === "string" ? entry : stringField(entry, "default") ?? importEntry.defaultTarget;
    const typesTarget =
      typeof entry === "string"
        ? undefined
        : stringField(entry, "types") ?? importEntry.typesTarget ?? requireEntry.typesTarget;
    const isAsset = !defaultTarget?.match(/\.[cm]?js$/);
    return {
      defaultTarget,
      dir,
      importTarget: importEntry.defaultTarget ?? defaultTarget,
      isAsset,
      packageName: packageJson.name,
      packageRoot,
      requireTarget: requireEntry.defaultTarget ?? defaultTarget,
      snapshotName: `${dir}__${snapshotFileName(subpath, typesTarget)}`,
      specifier: subpath === "." ? packageJson.name : `${packageJson.name}/${subpath.slice(2)}`,
      subpath,
      typesTarget,
    };
  });
}

function conditionEntry(entry, condition) {
  if (!entry || typeof entry !== "object") return {};
  const value = entry[condition];
  if (typeof value === "string") return { defaultTarget: value };
  if (!value || typeof value !== "object") return {};
  return {
    defaultTarget: stringField(value, "default"),
    typesTarget: stringField(value, "types"),
  };
}

function stringField(value, field) {
  return typeof value[field] === "string" ? value[field] : undefined;
}

function snapshotFileName(subpath, typesTarget) {
  if (!typesTarget) {
    throw new Error(`Public export ${subpath} must include a declaration target`);
  }
  const normalized = typesTarget.replace(/^\.\//, "").replace(/^dist\//, "");
  if (!normalized.endsWith(".d.ts") && !normalized.endsWith(".d.cts")) {
    throw new Error(`Public export ${subpath} declaration must be a .d.ts/.d.cts file`);
  }
  return normalized.replace(/\.d\.cts$/, ".d.ts");
}
