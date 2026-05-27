import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const codexSrc = join(__dirname, "..", "src");

describe("Codex package public surface", () => {
  it("keeps generated request builders behind their explicit subpath", () => {
    const rootBarrel = readFileSync(join(codexSrc, "index.ts"), "utf8");
    expect(rootBarrel).not.toContain('export * from "./request-builders"');
  });
});
