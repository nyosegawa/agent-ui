import { spawnSync } from "node:child_process";
import process from "node:process";

import { prepareNpmPublishManifests } from "./prepare-npm-publish-manifests.mjs";

run("bun", ["run", "build"]);
await prepareNpmPublishManifests();
run("bunx", ["changeset", "publish"]);

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
