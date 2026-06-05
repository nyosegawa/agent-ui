import { readFile } from "node:fs/promises";
import { join } from "node:path";

const publicPackages = [
  { directory: "packages/core", name: "@nyosegawa/agent-ui-core" },
  { directory: "packages/codex", name: "@nyosegawa/agent-ui-codex" },
  { directory: "packages/react", name: "@nyosegawa/agent-ui-react" },
  { directory: "packages/server", name: "@nyosegawa/agent-ui-server" },
  { directory: "packages/web-components", name: "@nyosegawa/agent-ui-web-components" },
];

export async function readPublicPackageManifests(repoRoot) {
  return Promise.all(
    publicPackages.map(async (workspacePackage) => {
      const manifestPath = join(repoRoot, workspacePackage.directory, "package.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      return {
        directory: workspacePackage.directory,
        manifest,
        name: workspacePackage.name,
        version: manifest.version,
      };
    }),
  );
}
