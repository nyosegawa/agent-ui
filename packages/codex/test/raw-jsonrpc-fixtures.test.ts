import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { agentReducer, createInitialAgentState } from "@nyosegawa/agent-ui-core";
import { describe, expect, it } from "vitest";
import {
  CODEX_PROTOCOL_COMMIT,
  normalizeCodexServerMessage,
  parseJsonRpcLine,
} from "../src";

const fixtureRoot = join(process.cwd(), "fixtures/app-server/v2-jsonrpc");

describe("raw App Server JSON-RPC fixture pack", () => {
  it("records every JSONL fixture in the manifest with upstream source metadata", () => {
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8"));
    expect(manifest.upstreamCommit).toBeUndefined();
    expect(manifest.schemaCommit).toBe(CODEX_PROTOCOL_COMMIT);
    expect(manifest.schemaCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(manifest.fixtureSourceCommit).toMatch(/^[0-9a-f]{40}$/);
    if (manifest.fixtureSourceCommit !== manifest.schemaCommit) {
      expect(manifest.divergenceReason).toMatch(/\w/);
    }
    expect(manifest.source).toContain("codex-rs/app-server");
    const listed = new Set(manifest.fixtures.map((entry: { file: string }) => entry.file));
    const actual = readdirSync(fixtureRoot).filter((file) => file.endsWith(".jsonl"));
    expect([...listed].sort()).toEqual(actual.sort());
    for (const entry of manifest.fixtures) {
      expect(entry.methods.length).toBeGreaterThan(0);
      expect(entry.purpose).toMatch(/\w/);
    }
  });

  it("normalizes and reduces the raw JSON-RPC lines without relying on AgentEvent fixtures", () => {
    let state = createInitialAgentState();
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8"));
    const files = manifest.fixtures.map((entry: { file: string }) => entry.file);
    for (const file of files) {
      const lines = readFileSync(join(fixtureRoot, file), "utf8").trim().split("\n");
      for (const line of lines) {
        const message = parseJsonRpcLine(line);
        for (const event of normalizeCodexServerMessage(message as any)) {
          state = agentReducer(state, event);
        }
      }
    }

    expect(
      state.threads["thread-basic"]?.turns["turn-text"]?.streamingTextByItemId[
        "item-assistant"
      ],
    ).toBe("Hello there.");
    expect(state.serverRequestQueue.byId["approval-file-raw"]).toMatchObject({
      itemId: "item-file",
      kind: "fileChangeApproval",
      threadId: "thread-basic",
      turnId: "turn-text",
    });
    expect(state.serverRequestQueue.byId["approval-command-raw"]).toBeUndefined();
    expect(state.threads["thread-resume"]?.tokenUsage?.totalTokens).toBe(168);
    expect(state.apps.apps.map((app) => app.id)).toEqual(["gmail", "drive"]);
    expect(state.apps.byScope["thread-basic"]?.apps[0]?.id).toBe("calendar");
    expect(state.account.status).toBe("authenticated");
    expect(state.diagnostics.warnings.at(-1)?.message).toContain("Config warning");
  });
});
