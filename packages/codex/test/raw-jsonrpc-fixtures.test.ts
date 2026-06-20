import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { agentReducer, createInitialAgentState } from "@nyosegawa/agent-ui-core";
import { describe, expect, it } from "vitest";
import { normalizeCodexServerMessage } from "../src/normalizer";
import { CODEX_PROTOCOL_COMMIT, parseJsonRpcLine } from "../src";

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
      expect(["current", "deprecated"]).toContain(entry.stability);
    }
  });

  it("keeps manifest methods aligned with sorted unique JSONL methods", () => {
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8"));
    for (const entry of manifest.fixtures as Array<{ file: string; methods: string[] }>) {
      const lines = readFileSync(join(fixtureRoot, entry.file), "utf8").trim().split("\n");
      const methods = new Set<string>();
      for (const line of lines) {
        const message = parseJsonRpcLine(line) as { method?: unknown };
        if (typeof message.method === "string") methods.add(message.method);
      }
      expect(entry.methods).toEqual([...methods].sort());
    }
  });

  it("keeps deprecated file-change output delta isolated and readable", () => {
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8"));
    for (const entry of manifest.fixtures as Array<{ file: string }>) {
      const lines = readFileSync(join(fixtureRoot, entry.file), "utf8").trim().split("\n");
      for (const line of lines) {
        const message = parseJsonRpcLine(line) as { method?: string; params?: { delta?: string } };
        if (entry.file !== "deprecated-file-change-output-delta.jsonl") {
          expect(message.method).not.toBe("item/fileChange/outputDelta");
          continue;
        }
        expect(message.method).toBe("item/fileChange/outputDelta");
        expect(message.params?.delta).toBe("applied patch\n");
        expect(message.params?.delta).not.toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      }
    }
  });

  it("keeps current app fixtures on generated AppInfo vocabulary", () => {
    const manifest = JSON.parse(readFileSync(join(fixtureRoot, "manifest.json"), "utf8"));
    const currentAppFixtures = manifest.fixtures.filter(
      (entry: { methods: string[]; stability: string }) =>
        entry.stability === "current" && entry.methods.includes("app/list/updated"),
    );
    for (const entry of currentAppFixtures as Array<{ file: string }>) {
      const lines = readFileSync(join(fixtureRoot, entry.file), "utf8").trim().split("\n");
      for (const line of lines) {
        const message = parseJsonRpcLine(line) as { params?: { data?: unknown } };
        const apps = Array.isArray(message.params?.data) ? message.params.data : [];
        for (const app of apps as Array<Record<string, unknown>>) {
          expect(app).toHaveProperty("logoUrl");
          expect(app).toHaveProperty("logoUrlDark");
          expect(app).toHaveProperty("distributionChannel");
          expect(app).toHaveProperty("appMetadata");
          expect(app).not.toHaveProperty("uri");
          expect(app).not.toHaveProperty("installed");
          expect(app).not.toHaveProperty("needsAuth");
        }
      }
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
    expect(state.serverRequestQueue.byId["string:approval-file-raw"]).toMatchObject({
      itemId: "item-file",
      kind: "fileChangeApproval",
      threadId: "thread-basic",
      turnId: "turn-text",
    });
    expect(state.serverRequestQueue.byId["string:legacy-exec-approval-raw"]).toMatchObject({
      itemId: "legacy-cmd",
      kind: "commandApproval",
      payload: {
        command: "sh -lc bun test",
        threadId: "thread-basic",
      },
      threadId: "thread-basic",
    });
    expect(state.serverRequestQueue.byId["string:legacy-patch-approval-raw"]).toMatchObject({
      itemId: "legacy-patch",
      kind: "fileChangeApproval",
      threadId: "thread-basic",
    });
    expect(state.serverRequestQueue.byId["string:approval-command-raw"]).toBeUndefined();
    expect(state.threads["thread-resume"]?.tokenUsage?.totalTokens).toBe(168);
    expect(state.apps.apps.map((app) => app.id)).toEqual(["gmail", "drive"]);
    expect(state.apps.byScope["thread-basic"]?.apps[0]?.id).toBe("calendar");
    expect(state.account.status).toBe("authenticated");
    expect(state.diagnostics.warnings.at(-1)?.message).toContain("Config warning");
  });
});
