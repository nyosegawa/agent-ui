import { describe, expect, it } from "vitest";
import loginFixture from "../../../fixtures/app-server/device-code-login.json" with { type: "json" };
import demoFixture from "../../../fixtures/app-server/demo-session.json" with { type: "json" };
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
});
