import { describe, expect, it } from "vitest";
import loginFixture from "../../../fixtures/app-server/device-code-login.json" with { type: "json" };
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
import failedFixture from "../../../fixtures/app-server/failed-turn.json" with { type: "json" };
import interruptedFixture from "../../../fixtures/app-server/interrupted-turn.json" with { type: "json" };
import planFixture from "../../../fixtures/app-server/plan-update.json" with { type: "json" };
import rateLimitFixture from "../../../fixtures/app-server/rate-limit-update.json" with { type: "json" };
import fixture from "../../../fixtures/app-server/text-turn.json" with { type: "json" };
import { runEventFixture } from "../src/fixtures";
import { selectOrderedThreads, selectOrderedTurns, selectPendingApprovals } from "../src/selectors";
import type { FixtureStep } from "../src/fixtures";

describe("agentReducer", () => {
  it("applies streaming text, command output, approvals, and authoritative completion", () => {
    const state = runEventFixture(fixture as FixtureStep[]);
    const turns = selectOrderedTurns(state, "thread-1");
    expect(turns).toHaveLength(1);
    expect(turns[0]?.streamingTextByItemId["item-1"]).toBe("Hello");
    expect(turns[0]?.commandOutputByItemId["cmd-1"]).toBe("ok\n");
    expect(turns[0]?.items["item-1"]?.status).toBe("completed");
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
    ]);
    expect(state.threads["thread-live"]?.turns["turn-live"]?.itemOrder).toEqual([
      "item-live",
      "cmd-live",
      "diff-live",
    ]);
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
    expect(selectPendingApprovals(state, "thread-demo").map((request) => request.kind)).toEqual([
      "commandApproval",
      "fileChangeApproval",
    ]);
  });

  it("loads the device-code login fixture", () => {
    const state = runEventFixture(loginFixture as FixtureStep[]);
    expect(state.account.status).toBe("authenticated");
    expect(state.account.account?.email).toBe("user@example.com");
    expect(state.account.login).toBeUndefined();
  });

  it("loads plan, interrupted, failed, and rate-limit fixtures", () => {
    const planned = runEventFixture(planFixture as FixtureStep[]);
    expect(planned.threads["thread-plan"]?.turns["turn-plan"]?.plan?.explanation).toContain(
      "Prepare UI",
    );

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
  });
});
