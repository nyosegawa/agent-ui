import { describe, expect, it } from "vitest";
import fixture from "../../../fixtures/app-server/text-turn.json" with { type: "json" };
import { runEventFixture } from "../src/fixtures";
import { selectOrderedTurns, selectPendingApprovals } from "../src/selectors";
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
});
