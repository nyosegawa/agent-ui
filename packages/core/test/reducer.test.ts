import { describe, expect, it } from "vitest";
import loginFixture from "../../../fixtures/app-server/device-code-login.json" with { type: "json" };
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import failedFixture from "../../../fixtures/app-server/failed-turn.json" with { type: "json" };
import interruptedFixture from "../../../fixtures/app-server/interrupted-turn.json" with { type: "json" };
import planFixture from "../../../fixtures/app-server/plan-update.json" with { type: "json" };
import rateLimitFixture from "../../../fixtures/app-server/rate-limit-update.json" with { type: "json" };
import fixture from "../../../fixtures/app-server/text-turn.json" with { type: "json" };
import { runEventFixture } from "../src/fixtures";
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
    expect(state.hooks.byCwd["/repo"]?.[0]?.id).toBe("hook-1");
    expect(selectUsage(state)).toEqual({
      accountRateLimits: { primary: { usedPercent: 33 } },
      hostMetrics: { totalTokens: 12 },
    });
    expect(state.account.rateLimits).toEqual({ primary: { usedPercent: 33 } });
    expect(state.diagnostics.banners[0]?.kind).toBe("rateLimit");
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
    expect(turns[0]?.filePatchByItemId["item-file"]).toContain("AgentDiffPanel");
    expect(
      selectPendingApprovals(state, "thread-demo").map((request) => request.kind),
    ).toEqual(["commandApproval", "fileChangeApproval"]);
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
