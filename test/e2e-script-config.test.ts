import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("e2e script configuration", () => {
  it("keeps fixture and real-local Playwright commands split", () => {
    const packageJson = JSON.parse(readRepoFile("package.json"));
    const scripts = packageJson.scripts as Record<string, string>;

    expect(scripts["test:e2e:fixtures"]).toContain("--config playwright.fixtures.config.ts");
    expect(scripts["test:e2e:real-local"]).toContain("--config playwright.real-local.config.ts");
    expect(scripts["validate:e2e"]).toBe(
      "bun run test:e2e:fixtures && bun run test:e2e:real-local",
    );
    expect(scripts["test:e2e:playwright"]).toBe("bun run validate:e2e");
  });

  it("starts only the server required by each split Playwright config", () => {
    const fixtureConfig = readRepoFile("playwright.fixtures.config.ts");
    const realLocalConfig = readRepoFile("playwright.real-local.config.ts");

    expect(fixtureConfig).toContain("examples/local-react-vite");
    expect(fixtureConfig).toContain('outputDir: "test-results/fixtures"');
    expect(fixtureConfig).toContain('["html", { open: "never" }]');
    expect(fixtureConfig).not.toContain("examples/codex-local-web");
    expect(realLocalConfig).toContain("examples/codex-local-web");
    expect(realLocalConfig).toContain('outputDir: "test-results/real-local"');
    expect(realLocalConfig).toContain('["html", { open: "never" }]');
    expect(realLocalConfig).not.toContain("examples/local-react-vite");
  });
});
