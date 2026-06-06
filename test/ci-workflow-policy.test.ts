import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("CI workflow policy", () => {
  it("keeps root agent guidance short and delegated to durable docs", () => {
    const agents = readRepoFile("AGENTS.md");

    expect(agents).toContain("This file is the short, always-read entry point");
    expect(agents).toContain("CONTRIBUTING.md");
    expect(agents).toContain("docs/maintenance/ci-cd.md");
    expect(agents).toContain("docs/architecture/product-boundary.md");
    expect(agents).toContain("npm-release` skill");
    expect(agents).toContain("codex-upstream-sync` skill");
    expect(agents.split(/\r?\n/).length).toBeLessThanOrEqual(85);
  });

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
    expect(ci).toContain("actions/upload-artifact@v7");
  });

  it("keeps release publishing tied to reviewed single release PR merges", () => {
    const release = readRepoFile(".github/workflows/release.yml");

    expect(release).toContain("push:");
    expect(release).toContain("branches:\n      - main");
    expect(release).not.toContain("workflow_dispatch:");
    expect(release).not.toContain("type: choice");
    expect(release).not.toContain("- prepare");
    expect(release).not.toContain("pull_request_target");

    expect(release).toContain("name: Check release targets");
    expect(release).toContain("name: Validate release");
    expect(release).not.toContain("name: Prepare version PR");
    expect(release).toContain("name: Publish npm packages");
    expect(release).not.toContain("environment: npm-release");
    expect(release).toContain("id-token: write");
    expect(release).toContain("NPM_CONFIG_PROVENANCE: true");
    expect(release).toContain("NPM_TOKEN: ${{ secrets.NPM_TOKEN }}");
    expect(release).toContain("Unversioned changesets remain");
    expect(release).toContain("node scripts/check-release-targets.mjs");
    expect(release).toContain("node scripts/post-publish-smoke.mjs");
    expect(release).toContain("Create GitHub releases");
    expect(release).not.toContain("title: Release Agent UI packages");
    expect(release).not.toContain("version: bunx changeset version");
  });

  it("keeps package validation reusable without duplicating every PR run", () => {
    const packageValidation = readRepoFile(".github/workflows/package-validation.yml");

    expect(packageValidation).toContain("workflow_dispatch:");
    expect(packageValidation).not.toContain("pull_request:");
    expect(packageValidation).not.toContain("branches: [main]");
    expect(packageValidation).toContain("permissions:\n  contents: read");
    expect(packageValidation).toContain("bun run validate:packages");
    expect(packageValidation).toContain("actions/upload-artifact@v7");
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

  it("keeps the pull request template aligned with contributor review gates", () => {
    const template = readRepoFile(".github/pull_request_template.md");

    for (const heading of [
      "## Summary",
      "## Test Plan",
      "## Release Impact",
      "## UI Impact",
      "## Protocol And Upstream Impact",
      "## Documentation",
      "## Security And Secrets",
    ]) {
      expect(template).toContain(heading);
    }

    expect(template).toContain("changeset");
    expect(template).toContain("No secrets, credentials, local `.npmrc` files");
    expect(template).toContain("Codex upstream sync work; review remains human-owned");
  });
});
