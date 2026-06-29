import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("browser e2e workflow gate", () => {
  it("runs fixture e2e broadly and real-local e2e only for sensitive changes", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("bunx playwright install --with-deps chromium");
    expect(ci).toContain("bun run test:e2e:fixtures");
    expect(ci).toContain("playwright-report/");
    expect(ci).toContain("test-results/");
    expect(ci).toContain("run-real-local:");
    expect(ci).toContain("bun run test:e2e:real-local");
    expect(ci).not.toContain("bun run validate:e2e");
  });

  it("keeps real-local e2e on the release/local validation path", () => {
    const release = readRepoFile(".github/workflows/release.yml");
    const testingDocs = readRepoFile("docs/architecture/testing.md");

    expect(release).toContain("bunx playwright install --with-deps chromium");
    expect(release).toContain("bun run validate:e2e");
    expect(testingDocs).toMatch(
      /Fixture e2e is the broad pull request browser gate; real-local e2e runs for\s+local-bridge-sensitive pull requests plus release and local validation\./,
    );
  });
});
