import { describe, expect, it } from "vitest";
import loginFixture from "../../../fixtures/app-server/device-code-login.json" with { type: "json" };
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import failedFixture from "../../../fixtures/app-server/failed-turn.json" with { type: "json" };
import interruptedFixture from "../../../fixtures/app-server/interrupted-turn.json" with { type: "json" };
import planFixture from "../../../fixtures/app-server/plan-update.json" with { type: "json" };
import rateLimitFixture from "../../../fixtures/app-server/rate-limit-update.json" with { type: "json" };
import fixture from "../../../fixtures/app-server/text-turn.json" with { type: "json" };
import { agentReducer } from "../src/reducer";
import { runEventFixture } from "../src/fixtures";
import { createInitialAgentState } from "../src/state";
import { AGENT_RETENTION_POLICY } from "../src/retention";
import {
  selectOrderedThreads,
  selectOrderedTurns,
  selectPendingApprovals,
  selectServerRequestQueue,
  selectThreadRegistry,
  selectUsage,
} from "../src/selectors";
import type { FixtureStep } from "../src/fixtures";

describe("agentReducer", () => {
  it("bounds raw diagnostics, command output, file patches, and stale thread snapshots", () => {
    let state = createInitialAgentState();
    state = agentReducer(state, {
      status: "running",
      thread: { id: "thread-retention" },
      type: "thread/started",
    });
    for (let index = 0; index < AGENT_RETENTION_POLICY.warningsMax + 10; index += 1) {
      state = agentReducer(state, {
        type: "warning/added",
        warning: { id: `warning-${index}`, message: `warning ${index}`, raw: { index } },
      });
    }
    expect(state.diagnostics.warnings).toHaveLength(AGENT_RETENTION_POLICY.warningsMax);
    expect(state.diagnostics.warnings[0]?.id).toBe("warning-10");

    state = agentReducer(state, {
      type: "item/commandOutput/delta",
      threadId: "thread-retention",
      turnId: "turn-retention",
      itemId: "cmd-retention",
      delta: "x".repeat(AGENT_RETENTION_POLICY.commandOutputMaxChars + 10),
    });
    expect(
      state.threads["thread-retention"]?.turns["turn-retention"]?.commandOutputByItemId["cmd-retention"].length,
    ).toBe(AGENT_RETENTION_POLICY.commandOutputMaxChars);

    for (let index = 0; index < AGENT_RETENTION_POLICY.filePatchesPerTurnMax + 5; index += 1) {
      state = agentReducer(state, {
        type: "item/filePatch/updated",
        threadId: "thread-retention",
        turnId: "turn-retention",
        itemId: `patch-${index}`,
        patch: { index },
      });
    }
    expect(
      Object.keys(state.threads["thread-retention"]?.turns["turn-retention"]?.filePatchByItemId ?? {}),
    ).toHaveLength(AGENT_RETENTION_POLICY.filePatchesPerTurnMax);

    for (let index = 0; index < AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax + 5; index += 1) {
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-${index}` },
        type: "thread/upserted",
      });
    }
    expect(state.threadRegistry.coldThreadIds).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax,
    );
  });

  it("applies streaming text, command output, approvals, and authoritative completion", () => {
    const state = runEventFixture(fixture as FixtureStep[]);
    const turns = selectOrderedTurns(state, "thread-1");
    expect(turns).toHaveLength(1);
    expect(turns[0]?.streamingTextByItemId["item-1"]).toBe("Hello");
    expect(turns[0]?.commandOutputByItemId["cmd-1"]).toBe("ok\n");
    expect(turns[0]?.items["item-1"]?.status).toBe("completed");
    expect(turns[0]?.blocksByItemId["item-1"]?.kind).toBe("text");
    expect(selectPendingApprovals(state, "thread-1")).toHaveLength(0);
  });

  it("clears pending server requests on disconnect", () => {
    const state = runEventFixture([
      {
        event: {
          request: { id: "r1", kind: "fileChangeApproval", payload: {} },
          type: "serverRequest/created",
        },
      },
      { event: { type: "connection/closed" } },
    ]);
    expect(state.pendingServerRequests).toEqual({});
    expect(state.serverRequestQueue).toEqual({ byId: {}, order: [] });
  });

  it("marks a thread as waiting while approval is pending", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-approval" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-1",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-approval",
          },
          type: "serverRequest/created",
        },
      },
    ]);
    expect(state.threads["thread-approval"]?.status).toBe("waitingForInput");
    expect(selectServerRequestQueue(state, "thread-approval").map((request) => request.id)).toEqual([
      "approval-1",
    ]);

    const resolved = runEventFixture([
      { event: { thread: { id: "thread-approval" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-1",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-approval",
          },
          type: "serverRequest/created",
        },
      },
      { event: { requestId: "approval-1", type: "serverRequest/resolved" } },
    ]);
    expect(resolved.threads["thread-approval"]?.status).toBe("running");
    expect(selectServerRequestQueue(resolved, "thread-approval")).toEqual([]);
  });

  it("keeps duplicate server request resolution idempotent", () => {
    const once = runEventFixture([
      { event: { thread: { id: "thread-approval" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-1",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-approval",
          },
          type: "serverRequest/created",
        },
      },
      { event: { requestId: "approval-1", type: "serverRequest/resolved" } },
    ]);
    const twice = runEventFixture([
      { event: { thread: { id: "thread-approval" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-1",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-approval",
          },
          type: "serverRequest/created",
        },
      },
      { event: { requestId: "approval-1", type: "serverRequest/resolved" } },
      { event: { requestId: "approval-1", type: "serverRequest/resolved" } },
    ]);
    expect(twice.pendingServerRequests).toEqual(once.pendingServerRequests);
    expect(twice.serverRequestQueue).toEqual(once.serverRequestQueue);
    expect(twice.threads["thread-approval"]?.status).toBe("running");
  });

  it("orders live deltas even when item start arrives late or is omitted", () => {
    const state = runEventFixture([
      {
        event: {
          thread: { id: "thread-live" },
          type: "thread/started",
        },
      },
      {
        event: {
          threadId: "thread-live",
          turn: { id: "turn-live", threadId: "thread-live", status: "running" },
          type: "turn/started",
        },
      },
      {
        event: {
          delta: "hello",
          itemId: "item-live",
          threadId: "thread-live",
          turnId: "turn-live",
          type: "item/agentMessage/delta",
        },
      },
      {
        event: {
          delta: "ok\n",
          itemId: "cmd-live",
          threadId: "thread-live",
          turnId: "turn-live",
          type: "item/commandOutput/delta",
        },
      },
      {
        event: {
          itemId: "diff-live",
          patch: "diff --git a/a b/a",
          threadId: "thread-live",
          turnId: "turn-live",
          type: "item/filePatch/updated",
        },
      },
      {
        event: {
          diff: "diff --git a/a b/a",
          threadId: "thread-live",
          turnId: "turn-live",
          type: "turn/diff/updated",
        },
      },
    ]);
    expect(state.threads["thread-live"]?.turns["turn-live"]?.itemOrder).toEqual([
      "item-live",
      "cmd-live",
      "diff-live",
    ]);
    expect(state.threads["thread-live"]?.turns["turn-live"]?.diff?.diff).toBe(
      "diff --git a/a b/a",
    );
  });

  it("updates non-active thread registries without changing active selection", () => {
    const state = runEventFixture([
      {
        event: {
          status: "running",
          thread: { id: "thread-active" },
          type: "thread/started",
        },
      },
      {
        event: {
          status: "notLoaded",
          thread: { id: "thread-preview" },
          turns: [{ id: "turn-preview", threadId: "thread-preview" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          status: "running",
          threadId: "thread-preview",
          type: "thread/status/changed",
        },
      },
    ]);
    expect(state.activeThreadId).toBe("thread-active");
    expect(selectThreadRegistry(state).activeThreadId).toBe("thread-active");
    expect(selectThreadRegistry(state).liveThreadIds).toEqual([
      "thread-active",
      "thread-preview",
    ]);
  });

  it("does not downgrade a live thread when a preview snapshot is activated", () => {
    const state = runEventFixture([
      {
        event: {
          status: "ready",
          thread: { id: "thread-resumed" },
          type: "thread/started",
        },
      },
      {
        event: {
          status: "loaded",
          thread: { id: "thread-resumed" },
          turns: [{ id: "turn-preview", threadId: "thread-resumed" }],
          type: "thread/started",
        },
      },
      {
        event: {
          status: "loaded",
          threadId: "thread-resumed",
          type: "thread/status/changed",
        },
      },
    ]);
    expect(state.threads["thread-resumed"]?.status).toBe("ready");
    expect(selectThreadRegistry(state).loadedThreadIds).toContain("thread-resumed");

    const preview = runEventFixture([
      {
        event: {
          status: "loaded",
          thread: { id: "thread-preview" },
          turns: [{ id: "turn-preview", threadId: "thread-preview", status: "completed" }],
          type: "thread/started",
        },
      },
      {
        event: {
          items: [],
          threadId: "thread-preview",
          turn: { id: "turn-preview", threadId: "thread-preview", status: "completed" },
          type: "turn/completed",
        },
      },
      {
        event: {
          status: "loaded",
          threadId: "thread-preview",
          type: "thread/status/changed",
        },
      },
    ]);
    expect(preview.threads["thread-preview"]?.status).toBe("loaded");
  });

  it("normalizes skills, apps, hooks, diagnostics, and split usage state", () => {
    const state = runEventFixture([
      {
        event: {
          cwd: "/repo",
          skills: [{ name: "agent-browser", path: "/repo/.agents/skills/agent-browser/SKILL.md" }],
          type: "skills/updated",
        },
      },
      {
        event: {
          apps: [{ id: "app://browser", name: "Browser", needsAuth: false }],
          nextCursor: null,
          type: "apps/updated",
        },
      },
      {
        event: {
          cwd: "/repo",
          hooks: [{ id: "hook-1", name: "SessionStart" }],
          type: "hooks/updated",
        },
      },
      { event: { metrics: { totalTokens: 12 }, type: "usage/hostMetrics/updated" } },
      {
        event: {
          rateLimits: { primary: { usedPercent: 33 } },
          type: "account/rateLimits/updated",
        },
      },
      {
        event: {
          banner: {
            id: "rate-limit",
            kind: "rateLimit",
            message: "Usage at 33%",
          },
          type: "status/banner/added",
        },
      },
    ]);

    expect(state.skills.byCwd["/repo"]?.[0]?.name).toBe("agent-browser");
    expect(state.apps.apps[0]?.id).toBe("app://browser");
    expect(state.apps.byScope[""]?.apps[0]?.id).toBe("app://browser");
    expect(state.hooks.byCwd["/repo"]?.[0]?.id).toBe("hook-1");
    expect(selectUsage(state)).toEqual({
      accountRateLimits: { primary: { usedPercent: 33 } },
      hostMetrics: { totalTokens: 12 },
    });
    expect(state.account.rateLimits).toEqual({ primary: { usedPercent: 33 } });
    expect(state.diagnostics.banners[0]?.kind).toBe("rateLimit");
  });

  it("stores restored thread token usage with context-window breakdown", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-usage" }, type: "thread/started" } },
      {
        event: {
          threadId: "thread-usage",
          tokenUsage: {
            cachedInputTokens: 20,
            inputTokens: 120,
            last: { inputTokens: 80, outputTokens: 10, totalTokens: 90 },
            modelContextWindow: 200_000,
            outputTokens: 30,
            reasoningOutputTokens: 10,
            totalTokens: 150,
          },
          type: "thread/tokenUsage/updated",
        },
      },
    ]);

    expect(state.threads["thread-usage"]?.tokenUsage).toMatchObject({
      inputTokens: 120,
      modelContextWindow: 200_000,
      outputTokens: 30,
      totalTokens: 150,
    });
  });

  it("keeps app connector lists scoped by thread id", () => {
    const state = runEventFixture([
      {
        event: {
          apps: [{ id: "app://global", name: "Global" }],
          nextCursor: null,
          type: "apps/updated",
        },
      },
      {
        event: {
          apps: [{ id: "app://thread-a", name: "Thread A" }],
          nextCursor: "next-a",
          threadId: "thread-a",
          type: "apps/updated",
        },
      },
      {
        event: {
          apps: [{ id: "app://thread-b", name: "Thread B" }],
          nextCursor: null,
          threadId: "thread-b",
          type: "apps/updated",
        },
      },
    ]);

    expect(state.apps.apps[0]?.id).toBe("app://global");
    expect(state.apps.byScope["thread-a"]).toMatchObject({
      apps: [{ id: "app://thread-a", name: "Thread A" }],
      nextCursor: "next-a",
      threadId: "thread-a",
    });
    expect(state.apps.byScope["thread-b"]?.apps[0]?.id).toBe("app://thread-b");
  });

  it("loads the demo session fixture with threads, diff preview, and file approval", () => {
    const state = runEventFixture(demoFixture as FixtureStep[]);
    const threads = selectOrderedThreads(state);
    const turns = selectOrderedTurns(state, "thread-demo");

    expect(state.account.status).toBe("authenticated");
    expect(state.activeThreadId).toBe("thread-demo");
    expect(threads.map((thread) => thread.thread.id)).toEqual([
      "thread-demo",
      "thread-docs",
    ]);
    expect(turns[0]?.streamingTextByItemId["item-agent"]).toContain("Approval UI");
    expect(turns[0]?.streamingTextByItemId["item-reasoning"]).toContain("reviewable");
    expect(turns[0]?.commandOutputByItemId["item-command"]).toContain("7 tests passed");
    expect(turns[0]?.filePatchByItemId["item-file"]).toContain("AgentDiffViewer");
    expect(
      selectPendingApprovals(state, "thread-demo").map((request) => request.kind),
    ).toEqual(["commandApproval", "fileChangeApproval"]);
  });

  it("normalizes rich transcript block taxonomy into item blocks", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-blocks" }, type: "thread/started" } },
      {
        event: {
          threadId: "thread-blocks",
          turn: { id: "turn-blocks", threadId: "thread-blocks" },
          type: "turn/started",
        },
      },
      {
        event: {
          item: {
            id: "reasoning",
            kind: "reasoning",
            raw: {
              content: [{ text: "full reasoning" }],
              summary: [{ text: "short thought" }],
            },
            text: "short thought",
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/started",
        },
      },
      {
        event: {
          item: {
            id: "command",
            kind: "commandExecution",
            raw: { command: "bun test", cwd: "/repo", durationMs: 1500, exitCode: 0 },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "tool",
            kind: "mcpToolCall",
            raw: {
              arguments: { q: "agent-ui" },
              result: { ok: true },
              server: "browser",
              tool: "snapshot",
            },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "search",
            kind: "webSearch",
            raw: { query: "Codex App Server" },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
      {
        event: {
          item: {
            id: "image",
            kind: "imageView",
            raw: { path: "/tmp/screenshot.png" },
            threadId: "thread-blocks",
            turnId: "turn-blocks",
          },
          threadId: "thread-blocks",
          turnId: "turn-blocks",
          type: "item/completed",
        },
      },
    ]);
    const blocks = state.threads["thread-blocks"]?.turns["turn-blocks"]?.blocksByItemId;

    expect(blocks?.reasoning).toMatchObject({
      content: "full reasoning",
      kind: "thinking",
      summary: "short thought",
    });
    expect(blocks?.command).toMatchObject({
      command: "bun test",
      cwd: "/repo",
      durationMs: 1500,
      exitCode: 0,
      kind: "commandExecution",
    });
    expect(blocks?.tool).toMatchObject({
      arguments: { q: "agent-ui" },
      result: { ok: true },
      server: "browser",
      tool: "snapshot",
      toolType: "mcp",
    });
    expect(blocks?.search).toMatchObject({ kind: "webSearch", query: "Codex App Server" });
    expect(blocks?.image).toMatchObject({ kind: "image", path: "/tmp/screenshot.png" });
  });

  it("loads the device-code login fixture", () => {
    const state = runEventFixture(loginFixture as FixtureStep[]);
    expect(state.account.status).toBe("authenticated");
    expect(state.account.account?.email).toBe("user@example.com");
    expect(state.account.login).toBeUndefined();
  });

  it("loads plan, interrupted, failed, and rate-limit fixtures", () => {
    const planned = runEventFixture(planFixture as FixtureStep[]);
    expect(
      planned.threads["thread-plan"]?.turns["turn-plan"]?.plan?.explanation,
    ).toContain("Prepare UI");

    const interrupted = runEventFixture(interruptedFixture as FixtureStep[]);
    expect(interrupted.threads["thread-interrupted"]?.status).toBe("interrupted");
    expect(
      interrupted.threads["thread-interrupted"]?.turns["turn-interrupted"]?.turn.status,
    ).toBe("interrupted");

    const failed = runEventFixture(failedFixture as FixtureStep[]);
    expect(failed.threads["thread-failed"]?.status).toBe("failed");
    expect(failed.threads["thread-failed"]?.turns["turn-failed"]?.turn.raw).toEqual({
      error: { message: "Model request failed" },
    });

    const rateLimited = runEventFixture(rateLimitFixture as FixtureStep[]);
    expect(rateLimited.account.rateLimits).toEqual({
      limitName: "fixture-demo-model",
      planType: "plus",
      primary: {
        limit: 100,
        resetAt: "2026-05-09T12:00:00.000Z",
        used: 12,
      },
    });
    expect(rateLimited.usage.accountRateLimits).toEqual(rateLimited.account.rateLimits);
  });
});
