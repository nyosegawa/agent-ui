import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("CI workflow policy", () => {
  it("keeps PR and main CI split into focused, cancelable, read-only jobs", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("pull_request:");
    expect(ci).toContain("branches: [main]");
    expect(ci).toContain("permissions:\n  contents: read");
    expect(ci).toContain("cancel-in-progress: true");
    expect(ci).toContain("docs-only:");
    expect(ci).toContain("run-package:");
    expect(ci).toContain("run-protocol:");
    expect(ci).toContain("run-ui:");

    for (const jobName of [
      "Repository policy",
      "Typecheck",
      "Lint",
      "Unit tests",
      "Protocol and fixtures",
      "Package validation",
      "API snapshots",
      "Package resolution",
      "Playwright fixtures",
    ]) {
      expect(ci, jobName).toContain(`name: ${jobName}`);
    }

    expect(ci).toContain("bun run validate:packages");
    expect(ci).toMatch(/name: API snapshots[\s\S]+bun run build[\s\S]+bun run test:api-snapshots/);
    expect(ci).toContain("bun run test:package-resolution");
    expect(ci).toContain("bun run test:e2e:fixtures");
    expect(ci).toContain("actions/upload-artifact@v4");
  });

  it("keeps release publishing manual and environment-gated", () => {
    const release = readRepoFile(".github/workflows/release.yml");

    expect(release).toContain("workflow_dispatch:");
    expect(release).toContain("type: choice");
    expect(release).toContain("- prepare");
    expect(release).toContain("- publish");
    expect(release).not.toContain("push:");
    expect(release).not.toContain("pull_request_target");

    expect(release).toContain("name: Validate release");
    expect(release).toContain("name: Prepare version PR");
    expect(release).toContain("name: Publish npm packages");
    expect(release).toContain("environment: npm-release");
    expect(release).toContain("id-token: write");
    expect(release).toContain("NPM_CONFIG_PROVENANCE: true");
    expect(release).toContain("NPM_TOKEN: ${{ secrets.NPM_TOKEN }}");
    expect(release).toContain("Unversioned changesets remain");
  });

  it("keeps package validation reusable without duplicating every PR run", () => {
    const packageValidation = readRepoFile(".github/workflows/package-validation.yml");

    expect(packageValidation).toContain("workflow_dispatch:");
    expect(packageValidation).not.toContain("pull_request:");
    expect(packageValidation).not.toContain("branches: [main]");
    expect(packageValidation).toContain("permissions:\n  contents: read");
    expect(packageValidation).toContain("bun run validate:packages");
    expect(packageValidation).toContain("actions/upload-artifact@v4");
  });

  it("keeps compatibility checks path-filtered and read-only", () => {
    const compatibility = readRepoFile(".github/workflows/compatibility.yml");

    expect(compatibility).toContain("permissions:\n  contents: read");
    expect(compatibility).toContain("cancel-in-progress: true");
    expect(compatibility).toContain("run-compatibility:");
    expect(compatibility).toContain("Node.js ${{ matrix.node-version }}");
    expect(compatibility).toContain("pnpm workspace smoke");
  });

  it("keeps Codex upstream cadence owned by Codex App Automation, not scheduled Actions", () => {
    expect(
      existsSync(new URL("../.github/workflows/codex-upstream-drift.yml", import.meta.url)),
    ).toBe(false);

    const codexDocs = readRepoFile("docs/maintenance/codex-upstream-sync.md");
    const codexSkill = readRepoFile(".agents/skills/codex-upstream-sync/SKILL.md");

    expect(codexDocs).toContain("weekly or manual Codex App Automation");
    expect(codexSkill).toContain("Do not merge the PR created by this skill");
    expect(codexSkill).toContain("Do not publish npm packages");
  });
});
