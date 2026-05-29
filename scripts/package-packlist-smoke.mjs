import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatPacklistIssues,
  readBunPacklist,
  validatePacklistEntries,
  workspacePackageDirs,
} from "./packlist-lib.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const issues = [];

for (const packageDir of workspacePackageDirs) {
  const packageRoot = join(repoRoot, "packages", packageDir);
  const entries = await readBunPacklist(packageRoot);
  issues.push(...validatePacklistEntries(packageDir, entries));
}

if (issues.length > 0) {
  throw new Error(formatPacklistIssues(issues));
}
