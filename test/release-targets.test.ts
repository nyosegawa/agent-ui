import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import { checkReleaseTargets } from "../scripts/check-release-targets.mjs";

describe("release target detection", () => {
  it("publishes only unpublished already-versioned package manifests", async () => {
    const root = await fakeReleaseRepo("0.4.0");
    const registryVersions = new Map([
      ["@nyosegawa/agent-ui-core@0.4.0", false],
      ["@nyosegawa/agent-ui-codex@0.4.0", false],
      ["@nyosegawa/agent-ui-react@0.4.0", true],
      ["@nyosegawa/agent-ui-server@0.4.0", false],
      ["@nyosegawa/agent-ui-web-components@0.4.0", false],
    ]);

    const result = await checkReleaseTargets(root, { registryVersions });

    expect(result.shouldPublish).toBe(true);
    expect(result.unpublished.map((pkg) => pkg.name).sort()).toEqual([
      "@nyosegawa/agent-ui-codex",
      "@nyosegawa/agent-ui-core",
      "@nyosegawa/agent-ui-server",
      "@nyosegawa/agent-ui-web-components",
    ]);
    expect(result.published.map((pkg) => pkg.name)).toEqual(["@nyosegawa/agent-ui-react"]);
    expect(result.packageNames).toContain("@nyosegawa/agent-ui-core");
  });

  it("does not publish when changesets remain unversioned", async () => {
    const root = await fakeReleaseRepo("0.4.0");
    await writeFile(join(root, ".changeset", "pending.md"), "---\n---\n\nPending\n");
    const registryVersions = new Map([
      ["@nyosegawa/agent-ui-core@0.4.0", false],
      ["@nyosegawa/agent-ui-codex@0.4.0", false],
      ["@nyosegawa/agent-ui-react@0.4.0", false],
      ["@nyosegawa/agent-ui-server@0.4.0", false],
      ["@nyosegawa/agent-ui-web-components@0.4.0", false],
    ]);

    const result = await checkReleaseTargets(root, { registryVersions });

    expect(result.shouldPublish).toBe(false);
    expect(result.error).toContain("Unversioned changesets remain");
  });

  it("hard-fails when fixed public package versions diverge", async () => {
    const root = await fakeReleaseRepo("0.4.0", {
      react: "0.5.0",
    });
    const registryVersions = new Map([
      ["@nyosegawa/agent-ui-core@0.4.0", false],
      ["@nyosegawa/agent-ui-codex@0.4.0", false],
      ["@nyosegawa/agent-ui-react@0.5.0", false],
      ["@nyosegawa/agent-ui-server@0.4.0", false],
      ["@nyosegawa/agent-ui-web-components@0.4.0", false],
    ]);

    const result = await checkReleaseTargets(root, { registryVersions });

    expect(result.shouldPublish).toBe(false);
    expect(result.error).toContain("Public package versions diverge");
    expect(result.versions.sort()).toEqual(["0.4.0", "0.5.0"]);
  });
});

async function fakeReleaseRepo(version: string, versionOverrides: Record<string, string> = {}) {
  const root = join(tmpdir(), `agent-ui-release-targets-${process.pid}-${Math.random()}`);
  await mkdir(join(root, ".changeset"), { recursive: true });
  for (const dir of ["core", "codex", "react", "server", "web-components"]) {
    await mkdir(join(root, "packages", dir), { recursive: true });
    await writeFile(
      join(root, "packages", dir, "package.json"),
      JSON.stringify(
        {
          name: `@nyosegawa/agent-ui-${dir}`,
          version: versionOverrides[dir] ?? version,
        },
        null,
        2,
      ),
    );
  }
  return root;
}
