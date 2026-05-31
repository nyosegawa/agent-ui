import { describe, expect, it } from "vitest";

import { parseBunPackDryRun, validatePacklistEntries } from "../scripts/packlist-lib.mjs";

describe("package packlist policy", () => {
  it("parses bun pack dry-run output into sorted package entries", () => {
    expect(
      parseBunPackDryRun("packed 12B dist/index.js\nignored line\npacked 8B package.json\n"),
    ).toEqual(["dist/index.js", "package.json"]);
  });

  it("detects unexpected source files outside allowed package output", () => {
    expect(
      validatePacklistEntries("core", [
        "package.json",
        "README.md",
        "dist/index.js",
        "src/index.ts",
      ]),
    ).toMatchInlineSnapshot(`
        [
          "core packs unexpected source file src/index.ts",
        ]
      `);
  });

  it("detects stale build artifacts in dist output", () => {
    expect(
      validatePacklistEntries("react", [
        "package.json",
        "dist/index.js",
        "dist/index.tsbuildinfo",
      ]),
    ).toMatchInlineSnapshot(`
      [
        "react packs stale artifact dist/index.tsbuildinfo",
      ]
    `);
  });

  it("detects private generated files in the Codex package", () => {
    expect(
      validatePacklistEntries("codex", [
        "package.json",
        "dist/index.js",
        "src/generated/stable/ClientRequest.ts",
      ]),
    ).toMatchInlineSnapshot(`
      [
        "codex packs private generated file src/generated/stable/ClientRequest.ts",
      ]
    `);
  });
});
