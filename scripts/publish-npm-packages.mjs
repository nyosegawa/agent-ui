import { spawnSync } from "node:child_process";
import process from "node:process";

import { prepareNpmPublishManifests } from "./prepare-npm-publish-manifests.mjs";

await prepareNpmPublishManifests();

const result = spawnSync("bunx", ["changeset", "publish"], {
  encoding: "utf8",
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
