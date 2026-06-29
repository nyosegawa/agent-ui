import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("core public surface", () => {
  it("keeps the root barrel limited to stable primitives", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../src/index.ts", import.meta.url)),
      "utf8",
    );
    const lines = source.trim().split(/\r?\n/);
    const exportSources = Array.from(source.matchAll(/from "([^"]+)";/g)).map(
      (match) => match[1],
    );

    expect(exportSources).toEqual([
      "./events",
      "./fake-transport",
      "./public-reducer",
      "./public-state",
      "./request-id-key",
      "./retention",
      "./public-selectors",
      "./state/account",
      "./state/apps",
      "./state/common",
      "./state/connection",
      "./state/diagnostics",
      "./state/hooks",
      "./state/item",
      "./state/models",
      "./state/run-settings",
      "./state/skills",
      "./state/thread",
      "./state/turn",
      "./state/usage",
      "./transport",
    ]);
    expect(lines).toContain('export * from "./events";');
    expect(lines).toContain('export * from "./fake-transport";');
    expect(lines).toContain('export * from "./request-id-key";');
    expect(lines).toContain('export * from "./public-selectors";');
    expect(lines).toContain('export * from "./transport";');
    expect(lines).toContain('export { agentReducer } from "./public-reducer";');
    expect(lines).toContain(
      'export { createInitialAgentState, type AgentSessionState } from "./public-state";',
    );
    expect(lines).not.toContain('export * from "./fixtures";');
    expect(lines).not.toContain('export * from "./reducer";');
    expect(lines).not.toContain('export * from "./selectors";');
    expect(lines).not.toContain('export * from "./state";');
    for (const forbiddenRawStoreSymbol of [
      "AgentItemBlock",
      "AgentTranscriptBlockView",
      "PendingServerRequest",
      "ServerRequestQueueState",
      "ThreadLifecycleState",
      "ThreadState",
    ]) {
      expect(source, forbiddenRawStoreSymbol).not.toMatch(
        new RegExp(`\\b${forbiddenRawStoreSymbol}\\b`),
      );
    }
  });
});
