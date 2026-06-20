import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const codexSrc = join(__dirname, "..", "src");
const apiSnapshots = join(__dirname, "..", "..", "..", "test", "api-snapshots");

describe("Codex package public surface", () => {
  it("keeps generated request builders behind their explicit subpath", () => {
    const rootBarrel = readFileSync(join(codexSrc, "index.ts"), "utf8");
    expect(rootBarrel).not.toContain('export * from "./request-builders"');
  });

  it("keeps generated method params and results out of the Codex root barrel", () => {
    const rootBarrel = readFileSync(join(codexSrc, "index.ts"), "utf8");
    expect(rootBarrel).not.toContain('export * from "./method-params"');
    expect(rootBarrel).not.toContain('export * from "./method-results"');
  });

  it("keeps request-builders as the preferred raw-free request boundary", () => {
    const source = readFileSync(join(codexSrc, "request-builders.ts"), "utf8");
    expect(source).not.toContain('export type { CodexStableMethodParams');
    expect(source).not.toContain('export type { CodexStableMethodResult');
    expect(source).not.toContain('export type { CodexExperimentalMethodParams');
    expect(source).not.toContain('export type { CodexExperimentalMethodResult');
  });

  it("keeps generated path names out of preferred request-builder declarations", () => {
    const snapshot = readFileSync(join(apiSnapshots, "codex__request-builders.d.ts"), "utf8");
    expect(snapshot).toContain("AgentWorkingDirectory");
    expect(snapshot).toContain("AgentResourcePath");
    expect(snapshot).toContain("AgentSkillPath");
    expect(snapshot).toContain("AgentMentionPath");
    expect(snapshot).not.toContain("LegacyAppPathString");
    expect(snapshot).not.toContain("AbsolutePathBuf");
  });

  it("keeps generated path names confined to generated-backed facades", () => {
    const rootSnapshot = readFileSync(join(apiSnapshots, "codex__index.d.ts"), "utf8");
    expect(rootSnapshot).toContain("AgentWorkingDirectory");
    expect(rootSnapshot).not.toContain("LegacyAppPathString");
    expect(rootSnapshot).not.toContain("AbsolutePathBuf");
  });
});
