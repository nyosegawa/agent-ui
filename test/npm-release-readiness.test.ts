import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicPackages = [
  { directory: "packages/core", name: "@nyosegawa/agent-ui-core" },
  { directory: "packages/codex", name: "@nyosegawa/agent-ui-codex" },
  { directory: "packages/react", name: "@nyosegawa/agent-ui-react" },
  { directory: "packages/server", name: "@nyosegawa/agent-ui-server" },
  { directory: "packages/web-components", name: "@nyosegawa/agent-ui-web-components" },
];

describe("npm release readiness", () => {
  it("keeps public package manifests ready for scoped public publishing", async () => {
    for (const workspacePackage of publicPackages) {
      const packagePath = join(root, workspacePackage.directory, "package.json");
      const manifest = JSON.parse(await readFile(packagePath, "utf8")) as PackageManifest;

      expect(manifest.name).toBe(workspacePackage.name);
      expect(manifest.private).not.toBe(true);
      expect(manifest.publishConfig?.access).toBe("public");
      expect(manifest.repository?.type).toBe("git");
      expect(manifest.repository?.url).toBe("https://github.com/nyosegawa/agent-ui.git");
      expect(manifest.repository?.directory).toBe(workspacePackage.directory);
      expect(manifest.bugs?.url).toBe("https://github.com/nyosegawa/agent-ui/issues");
      expect(manifest.homepage).toBe("https://github.com/nyosegawa/agent-ui#readme");
      expect(manifest.license).toBe("MIT");
      expect(manifest.engines?.node).toMatch(/^>=20/);
      expect(manifest.files).toContain("dist");
      expect(manifest.exports).toBeDefined();
      expect(existsSync(join(root, workspacePackage.directory, "README.md"))).toBe(true);
      for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
        expect(version, `${manifest.name} dependency ${name}`).not.toMatch(/^workspace:/);
        if (name.startsWith("@nyosegawa/agent-ui-")) {
          expect(version, `${manifest.name} dependency ${name}`).toBe("^0.1.0");
        }
      }
    }
  });

  it("keeps release automation provenance-enabled and token-scoped", async () => {
    const workflow = await readFile(join(root, ".github", "workflows", "release.yml"), "utf8");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("NPM_TOKEN: ${{ secrets.NPM_TOKEN }}");
    expect(workflow).toContain("bun run validate:release");
    expect(workflow).toContain("bun run validate:e2e");
    expect(workflow).toContain("bunx changeset publish --provenance");
    expect(workflow).toContain("NPM_CONFIG_PROVENANCE: true");
    expect(workflow).not.toContain("pull_request_target");
  });

  it("documents npm release operations and checklist gates", async () => {
    const npmRelease = await readFile(join(root, "docs", "maintenance", "npm-release.md"), "utf8");
    const checklist = await readFile(join(root, "docs", "maintenance", "release-checklist.md"), "utf8");

    expect(npmRelease).toContain("The first public release is `0.1.0`");
    expect(npmRelease).toContain("Do not increment package versions on every `main` push");
    expect(npmRelease).toContain("bunx changeset publish --provenance");
    expect(npmRelease).toContain("post-publish smoke");
    expect(checklist).toContain("NPM_TOKEN");
    expect(checklist).toContain("bun run validate:release");
    expect(checklist).toContain("bun run validate:e2e");
    expect(checklist).toContain("temporary consumer project outside the");
  });
});

type PackageManifest = {
  name?: string;
  private?: boolean;
  license?: string;
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  bugs?: {
    url?: string;
  };
  homepage?: string;
  engines?: {
    node?: string;
  };
  files?: string[];
  exports?: unknown;
  publishConfig?: {
    access?: string;
  };
  dependencies?: Record<string, string>;
};
