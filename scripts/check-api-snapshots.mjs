import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { checkApiSnapshots } from "./api-snapshot-lib.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotRoot = join(repoRoot, "test", "api-snapshots");
const update = process.argv.includes("--update");

await checkApiSnapshots({ repoRoot, snapshotRoot, update });
