import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function readRepoFile(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("package script documentation", () => {
  it("keeps test:fixtures documented as the core fixture runner", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts["test:core-fixtures"]).toBe("bun test packages/core/test");
    expect(packageJson.scripts["test:fixtures"]).toBe("bun run test:core-fixtures");

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    const protocolDocs = readRepoFile("docs/reference/codex-protocol.md");

    expect(testingDocs).toContain("bun run test:core-fixtures");
    expect(testingDocs).toContain("core reducer/state fixture gate");
    expect(protocolDocs).toContain("bun run test:core-fixtures");
    expect(protocolDocs).toContain("compatibility alias");
  });
});
