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

  it("keeps validate:packages docs aligned with the script order", () => {
    const packageJson = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts["validate:packages"]).toBe(
      "bun run build && bun run test:packlist && bun run test:node-compat && bun run publint && bun run attw",
    );

    const testingDocs = readRepoFile("docs/architecture/testing.md");
    expect(testingDocs).toContain(
      "`test:packlist`, `test:node-compat`, `publint`, then `attw`",
    );
    expect(testingDocs).toContain(
      "packlist smoke, Node\n  compatibility smoke, `publint`, and `arethetypeswrong`",
    );
  });

  it("keeps package export docs aligned with canonical public subpaths", () => {
    const packageExportsDocs = readRepoFile("docs/reference/package-exports.md");
    const listedSubpaths = [...packageExportsDocs.matchAll(/^- `(@nyosegawa\/agent-ui[^`]+)`$/gm)]
      .map((match) => match[1])
      .sort();

    expect(listedSubpaths).toEqual([
      "@nyosegawa/agent-ui-codex",
      "@nyosegawa/agent-ui-codex/clients",
      "@nyosegawa/agent-ui-codex/normalizer",
      "@nyosegawa/agent-ui-codex/request-builders",
      "@nyosegawa/agent-ui-codex/session",
      "@nyosegawa/agent-ui-codex/stable-types",
      "@nyosegawa/agent-ui-codex/websocket",
      "@nyosegawa/agent-ui-core",
      "@nyosegawa/agent-ui-react",
      "@nyosegawa/agent-ui-react/styles.css",
      "@nyosegawa/agent-ui-server",
      "@nyosegawa/agent-ui-web-components",
    ].sort());
  });
});
