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
import { AGENT_RETENTION_POLICY, boundedRecordEntry } from "../src/retention";
import {
  selectAccountRateLimits,
  selectApps,
  selectDiagnostics,
  selectHostMetrics,
  selectItemBlock,
  selectLatestRunningTurnId,
  selectOrderedThreads,
  selectOrderedItems,
  selectOrderedTurns,
  selectPendingApprovals,
  selectServerRequestQueue,
  selectStatusBanners,
  selectThreadRegistry,
  selectUsage,
} from "../src/selectors";
import type { FixtureStep } from "../src/fixtures";

describe("agentReducer", () => {
  it("moves updated bounded record entries to the newest slot before trimming", () => {
    const updated = boundedRecordEntry({ a: 1, b: 2, c: 3 }, "a", 4, 3);
    expect(updated).toEqual({ b: 2, c: 3, a: 4 });
    expect(Object.keys(updated)).toEqual(["b", "c", "a"]);

    expect(boundedRecordEntry(updated, "d", 5, 3)).toEqual({ c: 3, a: 4, d: 5 });
  });

  it("bounds raw diagnostics, command output, file patches, and stale thread snapshot entities", () => {
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
    state = agentReducer(state, {
      type: "item/filePatch/updated",
      threadId: "thread-retention",
      turnId: "turn-retention",
      itemId: "patch-5",
      patch: { refreshed: true },
    });
    state = agentReducer(state, {
      type: "item/filePatch/updated",
      threadId: "thread-retention",
      turnId: "turn-retention",
      itemId: "patch-new",
      patch: { newest: true },
    });
    const retainedPatches =
      state.threads["thread-retention"]?.turns["turn-retention"]?.filePatchByItemId ?? {};
    expect(Object.keys(retainedPatches)).toHaveLength(AGENT_RETENTION_POLICY.filePatchesPerTurnMax);
    expect(retainedPatches["patch-5"]).toEqual({ refreshed: true });
    expect(retainedPatches["patch-6"]).toBeUndefined();
    expect(retainedPatches["patch-new"]).toEqual({ newest: true });

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
    expect(Object.keys(state.threads)).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax + 1,
    );
    expect(state.threads["thread-retention"]).toBeDefined();
    expect(state.threads["thread-0"]).toBeUndefined();

    for (let index = 0; index < AGENT_RETENTION_POLICY.appScopesMax + 5; index += 1) {
      state = agentReducer(state, {
        apps: [{ id: `app-${index}`, name: `App ${index}`, needsAuth: false }],
        threadId: `thread-apps-${index}`,
        type: "apps/updated",
      });
    }
    expect(Object.keys(state.apps.byScope)).toHaveLength(
      AGENT_RETENTION_POLICY.appScopesMax,
    );
    expect(state.apps.byScope["thread-apps-0"]).toBeUndefined();
    expect(
      state.apps.byScope[`thread-apps-${AGENT_RETENTION_POLICY.appScopesMax + 4}`]
        ?.apps[0]?.id,
    ).toBe(`app-${AGENT_RETENTION_POLICY.appScopesMax + 4}`);

    for (
      let index = 0;
      index < AGENT_RETENTION_POLICY.skillsCwdEntriesMax + 5;
      index += 1
    ) {
      state = agentReducer(state, {
        cwd: `/repo/skills-${index}`,
        skills: [{ name: `skill-${index}` }],
        type: "skills/updated",
      });
    }
    expect(Object.keys(state.skills.byCwd)).toHaveLength(
      AGENT_RETENTION_POLICY.skillsCwdEntriesMax,
    );
    expect(state.skills.byCwd["/repo/skills-0"]).toBeUndefined();
    expect(
      state.skills.byCwd[
        `/repo/skills-${AGENT_RETENTION_POLICY.skillsCwdEntriesMax + 4}`
      ]?.[0]?.name,
    ).toBe(`skill-${AGENT_RETENTION_POLICY.skillsCwdEntriesMax + 4}`);

    for (
      let index = 0;
      index < AGENT_RETENTION_POLICY.hooksCwdEntriesMax + 5;
      index += 1
    ) {
      state = agentReducer(state, {
        cwd: `/repo/hooks-${index}`,
        hooks: [{ id: `hook-${index}`, name: `Hook ${index}` }],
        type: "hooks/updated",
      });
    }
    expect(Object.keys(state.hooks.byCwd)).toHaveLength(
      AGENT_RETENTION_POLICY.hooksCwdEntriesMax,
    );
    expect(state.hooks.byCwd["/repo/hooks-0"]).toBeUndefined();
    expect(
      state.hooks.byCwd[
        `/repo/hooks-${AGENT_RETENTION_POLICY.hooksCwdEntriesMax + 4}`
      ]?.[0]?.id,
    ).toBe(`hook-${AGENT_RETENTION_POLICY.hooksCwdEntriesMax + 4}`);
  });

  it("prunes evicted cold, preview, and loaded thread entities while retaining active, live, and pending request threads", () => {
    let state = createInitialAgentState();
    state = agentReducer(state, {
      status: "running",
      thread: { id: "thread-active" },
      type: "thread/started",
    });
    state = agentReducer(state, {
      status: "running",
      thread: { id: "thread-live" },
      type: "thread/upserted",
    });
    state = agentReducer(state, {
      status: "notLoaded",
      thread: { id: "thread-pending", raw: { retained: "pending" } },
      type: "thread/upserted",
    });
    state = agentReducer(state, {
      request: {
        id: "approval-pending",
        itemId: "item-pending",
        kind: "commandApproval",
        payload: {},
        threadId: "thread-pending",
        turnId: "turn-pending",
      },
      type: "serverRequest/created",
    });

    for (let index = 0; index < AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax + 5; index += 1) {
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-cold-${index}`, raw: { index } },
        type: "thread/upserted",
      });
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-preview-${index}`, raw: { index } },
        turns: [{ id: `turn-preview-${index}` }],
        type: "thread/upserted",
      });
      state = agentReducer(state, {
        status: "loaded",
        thread: { id: `thread-loaded-${index}`, raw: { index } },
        type: "thread/upserted",
      });
    }

    expect(state.threadRegistry.coldThreadIds).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax,
    );
    expect(state.threadRegistry.previewThreadIds).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax,
    );
    expect(state.threadRegistry.loadedThreadIds).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax,
    );
    expect(state.threads["thread-cold-0"]).toBeUndefined();
    expect(state.threads["thread-preview-0"]).toBeUndefined();
    expect(state.threads["thread-loaded-0"]).toBeUndefined();
    expect(state.threads["thread-active"]).toBeDefined();
    expect(state.threads["thread-live"]).toBeDefined();
    expect(state.threads["thread-pending"]).toBeDefined();
    expect(state.threads["thread-cold-204"]).toBeDefined();
    expect(state.threads["thread-preview-204"]).toBeDefined();
    expect(state.threads["thread-loaded-204"]).toBeDefined();

    const orderedThreadIds = selectOrderedThreads(state).map((thread) => thread.thread.id);
    expect(orderedThreadIds).toContain("thread-active");
    expect(orderedThreadIds).toContain("thread-live");
    expect(orderedThreadIds).toContain("thread-pending");
    expect(orderedThreadIds).not.toContain("thread-cold-0");
    expect(orderedThreadIds).not.toContain("thread-preview-0");
    expect(orderedThreadIds).not.toContain("thread-loaded-0");
    expect(Object.keys(state.threads)).toHaveLength(
      AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax * 3 + 3,
    );
  });

  it("bounds ordered thread registry indexes while preserving recency and bucket moves", () => {
    let state = createInitialAgentState();
    const max = AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax;

    for (let index = 0; index < max + 2; index += 1) {
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-cold-${index}` },
        type: "thread/upserted",
      });
    }

    expect(state.threadRegistry.coldThreadIds).toHaveLength(max);
    expect(state.threadRegistry.coldThreadIds[0]).toBe("thread-cold-2");
    expect(state.threadRegistry.coldThreadIds.at(-1)).toBe(`thread-cold-${max + 1}`);

    state = agentReducer(state, {
      status: "loaded",
      thread: { id: "thread-cold-2" },
      type: "thread/upserted",
    });
    state = agentReducer(state, {
      status: "loaded",
      thread: { id: "thread-cold-2" },
      type: "thread/upserted",
    });

    expect(state.threadRegistry.coldThreadIds).not.toContain("thread-cold-2");
    expect(state.threadRegistry.loadedThreadIds).toEqual(["thread-cold-2"]);
  });

  it("bounds backing entity maps when registry and retained turn maps evict stale entries", () => {
    let state = createInitialAgentState();
    const max = AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax;

    state = agentReducer(state, {
      status: "running",
      thread: { id: "thread-active" },
      type: "thread/started",
    });
    state = agentReducer(state, {
      status: "notLoaded",
      thread: { id: "thread-pending" },
      type: "thread/upserted",
    });
    state = agentReducer(state, {
      request: {
        id: "approval-retains-thread",
        kind: "commandApproval",
        payload: {},
        threadId: "thread-pending",
        turnId: "turn-pending",
      },
      type: "serverRequest/created",
    });

    for (let index = 0; index < max + 2; index += 1) {
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-cold-${index}` },
        type: "thread/upserted",
      });
      state = agentReducer(state, {
        status: "notLoaded",
        thread: { id: `thread-preview-${index}` },
        turns: [{ id: `turn-preview-${index}`, threadId: `thread-preview-${index}` }],
        type: "thread/upserted",
      });
      state = agentReducer(state, {
        status: "loaded",
        thread: { id: `thread-loaded-${index}` },
        type: "thread/upserted",
      });
    }

    const retainedThreadIds = new Set([
      "thread-active",
      "thread-pending",
      ...Array.from({ length: max }, (_, index) => `thread-cold-${index + 2}`),
      ...Array.from({ length: max }, (_, index) => `thread-preview-${index + 2}`),
      ...Array.from({ length: max }, (_, index) => `thread-loaded-${index + 2}`),
    ]);
    expect(new Set(Object.keys(state.threads))).toEqual(retainedThreadIds);
    expect(state.threads["thread-cold-0"]).toBeUndefined();
    expect(state.threads["thread-preview-0"]).toBeUndefined();
    expect(state.threads["thread-loaded-0"]).toBeUndefined();
    expect(state.threads["thread-active"]).toBeDefined();
    expect(state.threads["thread-pending"]).toBeDefined();

    for (let index = 0; index < AGENT_RETENTION_POLICY.filePatchesPerTurnMax + 3; index += 1) {
      state = agentReducer(state, {
        type: "item/filePatch/updated",
        threadId: "thread-active",
        turnId: "turn-active",
        itemId: `patch-${index}`,
        patch: { index },
      });
    }

    expect(
      Object.keys(
        state.threads["thread-active"]?.turns["turn-active"]?.filePatchByItemId ?? {},
      ),
    ).toEqual(
      Array.from(
        { length: AGENT_RETENTION_POLICY.filePatchesPerTurnMax },
        (_, index) => `patch-${index + 3}`,
      ),
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

  it("clears pending server requests on disconnect and recovers waiting threads", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-disconnect" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "r1",
            kind: "fileChangeApproval",
            payload: {},
            threadId: "thread-disconnect",
          },
          type: "serverRequest/created",
        },
      },
      { event: { type: "connection/closed" } },
    ]);
    expect(state.serverRequestQueue).toEqual({ byId: {}, order: [] });
    expect(state.threads["thread-disconnect"]?.status).toBe("running");
    expect(state.threads["thread-disconnect"]?.registryStatus).toBe("live");
    expect(selectThreadRegistry(state).liveThreadIds).toContain("thread-disconnect");
  });

  it("syncs thread registry while an approval is created and resolved", () => {
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
    expect(state.threads["thread-approval"]?.registryStatus).toBe("live");
    expect(selectThreadRegistry(state).liveThreadIds).toContain("thread-approval");
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
    expect(resolved.threads["thread-approval"]?.registryStatus).toBe("live");
    expect(selectThreadRegistry(resolved).liveThreadIds).toContain("thread-approval");
    expect(selectServerRequestQueue(resolved, "thread-approval")).toEqual([]);
  });

  it("commits thread entity registry status and bucket membership together", () => {
    const state = runEventFixture([
      {
        event: {
          status: "notLoaded",
          thread: { id: "thread-commit" },
          turns: [{ id: "turn-commit", threadId: "thread-commit" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          status: "running",
          thread: { id: "thread-commit" },
          turns: [{ id: "turn-commit", threadId: "thread-commit" }],
          type: "thread/started",
        },
      },
    ]);

    expectThreadRegistryMembership(state, "thread-commit", "live");
  });

  it("treats thread status changes as known-thread status-only updates", () => {
    const unknown = runEventFixture([
      {
        event: {
          status: "notLoaded",
          threadId: "missing-thread",
          type: "thread/status/changed",
        },
      },
    ]);
    expect(unknown.threads["missing-thread"]).toBeUndefined();
    expect(selectThreadRegistry(unknown).coldThreadIds).not.toContain("missing-thread");
    expect(selectThreadRegistry(unknown).previewThreadIds).not.toContain("missing-thread");
    expect(selectThreadRegistry(unknown).loadedThreadIds).not.toContain("missing-thread");
    expect(selectThreadRegistry(unknown).liveThreadIds).not.toContain("missing-thread");

    const known = runEventFixture([
      {
        event: {
          status: "loaded",
          thread: { id: "thread-status-known" },
          turns: [{ id: "turn-status-known", threadId: "thread-status-known" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          status: "notLoaded",
          threadId: "thread-status-known",
          type: "thread/status/changed",
        },
      },
    ]);
    expect(known.threads["thread-status-known"]?.orderedTurnIds).toEqual([
      "turn-status-known",
    ]);
    expectThreadRegistryMembership(known, "thread-status-known", "preview");
  });

  it("synchronizes thread registry buckets on turn lifecycle events", () => {
    const running = runEventFixture([
      {
        event: {
          status: "notLoaded",
          thread: { id: "thread-turn-sync" },
          turns: [{ id: "turn-turn-sync", threadId: "thread-turn-sync" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          threadId: "thread-turn-sync",
          turn: { id: "turn-turn-sync", threadId: "thread-turn-sync" },
          type: "turn/started",
        },
      },
    ]);

    expect(running.threads["thread-turn-sync"]?.status).toBe("running");
    expectThreadRegistryMembership(running, "thread-turn-sync", "live");

    const completed = agentReducer(running, {
      items: [],
      threadId: "thread-turn-sync",
      turn: { id: "turn-turn-sync", threadId: "thread-turn-sync", status: "completed" },
      type: "turn/completed",
    });

    expect(completed.threads["thread-turn-sync"]?.status).toBe("completed");
    expectThreadRegistryMembership(completed, "thread-turn-sync", "loaded");
  });

  it("keeps a thread waiting until all pending server requests resolve or reject", () => {
    const firstResolved = runEventFixture([
      { event: { thread: { id: "thread-multi" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-1",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-multi",
          },
          type: "serverRequest/created",
        },
      },
      {
        event: {
          request: {
            id: "approval-2",
            kind: "fileChangeApproval",
            payload: {},
            threadId: "thread-multi",
          },
          type: "serverRequest/created",
        },
      },
      { event: { requestId: "approval-1", type: "serverRequest/resolved" } },
    ]);
    expect(firstResolved.threads["thread-multi"]?.status).toBe("waitingForInput");
    expect(selectServerRequestQueue(firstResolved, "thread-multi").map((request) => request.id)).toEqual([
      "approval-2",
    ]);
    expect(selectThreadRegistry(firstResolved).liveThreadIds).toContain("thread-multi");

    const secondRejected = agentReducer(firstResolved, {
      error: { message: "declined" },
      requestId: "approval-2",
      type: "serverRequest/rejected",
    });
    expect(secondRejected.threads["thread-multi"]?.status).toBe("running");
    expect(secondRejected.threads["thread-multi"]?.registryStatus).toBe("live");
    expect(selectServerRequestQueue(secondRejected, "thread-multi")).toEqual([]);
    expect(selectDiagnostics(secondRejected).errors[0]?.message).toBe("declined");
  });

  it("selects pending approvals in server request queue order", () => {
    const state = createInitialAgentState();
    state.serverRequestQueue = {
      byId: {
        "1": {
          id: "1",
          kind: "userInput",
          payload: {},
          threadId: "thread-fifo",
        },
        "2": {
          id: "2",
          kind: "fileChangeApproval",
          payload: {},
          threadId: "thread-fifo",
        },
        "10": {
          id: "10",
          kind: "commandApproval",
          payload: {},
          threadId: "thread-fifo",
        },
      },
      order: ["10", "1", "2"],
    };

    expect(selectPendingApprovals(state, "thread-fifo").map((request) => request.id)).toEqual([
      "10",
      "2",
    ]);
    expect(selectServerRequestQueue(state, "thread-fifo").map((request) => request.id)).toEqual([
      "10",
      "1",
      "2",
    ]);
  });

  it("does not retain dynamic tool calls in the default server request queue", () => {
    const state = runEventFixture([
      {
        event: {
          status: "running",
          thread: { id: "thread-dynamic-tool" },
          type: "thread/started",
        },
      },
      {
        event: {
          request: {
            id: "dynamic-tool-1",
            kind: "dynamicTool",
            payload: {
              callId: "call-1",
              namespace: "mcp__browser",
              tool: "get_app_state",
            },
            threadId: "thread-dynamic-tool",
            turnId: "turn-dynamic-tool",
          },
          type: "serverRequest/created",
        },
      },
    ]);

    expect(selectServerRequestQueue(state, "thread-dynamic-tool")).toEqual([]);
    expect(selectPendingApprovals(state, "thread-dynamic-tool")).toEqual([]);
    expect(state.threads["thread-dynamic-tool"]?.status).toBe("running");
  });

  it("reconciles pending server requests on connection errors", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-error" }, type: "thread/started" } },
      {
        event: {
          request: {
            id: "approval-error",
            kind: "commandApproval",
            payload: {},
            threadId: "thread-error",
          },
          type: "serverRequest/created",
        },
      },
      {
        event: {
          error: { message: "transport failed" },
          type: "connection/error",
        },
      },
    ]);

    expect(state.serverRequestQueue).toEqual({ byId: {}, order: [] });
    expect(state.threads["thread-error"]?.status).toBe("running");
    expect(state.threads["thread-error"]?.registryStatus).toBe("live");
    expect(selectThreadRegistry(state).liveThreadIds).toContain("thread-error");
    expect(selectDiagnostics(state).errors[0]?.message).toBe("transport failed");
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
    expect(state.threadRegistry.activeThreadId).toBe("thread-active");
    expect(selectThreadRegistry(state).activeThreadId).toBe("thread-active");
    expect(selectThreadRegistry(state).liveThreadIds).toEqual([
      "thread-active",
      "thread-preview",
    ]);
  });

  it("preserves stored turns and preview classification when later thread payloads omit turns", () => {
    const state = runEventFixture([
      {
        event: {
          status: "notLoaded",
          thread: {
            ephemeral: false,
            id: "thread-history",
            path: "/workspace/history",
            raw: { version: 1 },
          },
          turns: [{ id: "turn-history", threadId: "thread-history", status: "completed" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          items: [
            {
              id: "item-history",
              kind: "message",
              status: "completed",
              text: "history item",
              threadId: "thread-history",
              turnId: "turn-history",
            },
          ],
          threadId: "thread-history",
          turn: { id: "turn-history", threadId: "thread-history", status: "completed" },
          type: "turn/completed",
        },
      },
      {
        event: {
          threadId: "thread-history",
          tokenUsage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          type: "thread/tokenUsage/updated",
        },
      },
      {
        event: {
          status: "notLoaded",
          thread: {
            ephemeral: true,
            id: "thread-history",
            name: "History without turns",
            path: "/workspace/history-renamed",
            raw: { version: 2 },
          },
          type: "thread/upserted",
        },
      },
    ]);

    expect(state.threads["thread-history"]?.orderedTurnIds).toEqual(["turn-history"]);
    expect(state.threads["thread-history"]?.turns["turn-history"]?.turn.status).toBe(
      "completed",
    );
    expect(state.threads["thread-history"]?.turns["turn-history"]?.itemOrder).toEqual([
      "item-history",
    ]);
    expect(state.threads["thread-history"]?.tokenUsage).toMatchObject({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    });
    expect(state.threads["thread-history"]?.thread).toMatchObject({
      ephemeral: true,
      id: "thread-history",
      name: "History without turns",
      path: "/workspace/history-renamed",
      raw: { version: 2 },
    });
    expect(state.threads["thread-history"]?.registryStatus).toBe("preview");
    expect(selectThreadRegistry(state).previewThreadIds).toContain("thread-history");
    expect(selectThreadRegistry(state).coldThreadIds).not.toContain("thread-history");
  });

  it("stores turn item view completeness from thread snapshots", () => {
    const state = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-items-view" },
          turns: [
            { id: "turn-not-loaded", itemsView: "notLoaded", threadId: "thread-items-view" },
            { id: "turn-summary", itemsView: "summary", threadId: "thread-items-view" },
            { id: "turn-full", itemsView: "full", threadId: "thread-items-view" },
          ],
          type: "thread/upserted",
        },
      },
    ]);

    expect(state.threads["thread-items-view"]?.turns["turn-not-loaded"]?.turn.itemsView).toBe(
      "notLoaded",
    );
    expect(state.threads["thread-items-view"]?.turns["turn-summary"]?.turn.itemsView).toBe(
      "summary",
    );
    expect(state.threads["thread-items-view"]?.turns["turn-full"]?.turn.itemsView).toBe("full");
  });

  it("merges turn item view completeness without downgrading full item data", () => {
    const full = runEventFixture([
      { event: { thread: { id: "thread-view-merge" }, type: "thread/started" } },
      {
        event: {
          items: [
            {
              id: "item-command-full",
              kind: "commandExecution",
              raw: { command: "bun test" },
              status: "completed",
              text: "full command",
              threadId: "thread-view-merge",
              turnId: "turn-view-merge",
            },
            {
              id: "item-file-full",
              kind: "fileChange",
              raw: { changes: [{ path: "src/app.ts", type: "modify" }] },
              status: "completed",
              threadId: "thread-view-merge",
              turnId: "turn-view-merge",
            },
            {
              id: "item-tool-full",
              kind: "toolCall",
              raw: { tool: "search" },
              status: "completed",
              threadId: "thread-view-merge",
              turnId: "turn-view-merge",
            },
          ],
          snapshot: true,
          threadId: "thread-view-merge",
          turn: { id: "turn-view-merge", itemsView: "full", threadId: "thread-view-merge" },
          type: "turn/completed",
        },
      },
      {
        event: {
          items: [
            {
              id: "item-command-full",
              kind: "commandExecution",
              status: "completed",
              text: "summary command",
              threadId: "thread-view-merge",
              turnId: "turn-view-merge",
            },
          ],
          snapshot: true,
          threadId: "thread-view-merge",
          turn: { id: "turn-view-merge", itemsView: "summary", threadId: "thread-view-merge" },
          type: "turn/completed",
        },
      },
    ]);

    const fullTurn = full.threads["thread-view-merge"]?.turns["turn-view-merge"];
    expect(fullTurn?.turn.itemsView).toBe("full");
    expect(fullTurn?.itemOrder).toEqual([
      "item-command-full",
      "item-file-full",
      "item-tool-full",
    ]);
    expect(fullTurn?.blocksByItemId["item-command-full"]?.kind).toBe("commandExecution");
    expect(fullTurn?.items["item-command-full"]?.text).toBe("full command");
    expect(fullTurn?.blocksByItemId["item-file-full"]?.kind).toBe("fileChange");
    expect(fullTurn?.blocksByItemId["item-tool-full"]?.kind).toBe("toolCall");

    const upgraded = runEventFixture([
      { event: { thread: { id: "thread-view-upgrade" }, type: "thread/started" } },
      {
        event: {
          items: [
            {
              id: "item-message",
              kind: "assistantMessage",
              status: "completed",
              text: "summary text",
              threadId: "thread-view-upgrade",
              turnId: "turn-view-upgrade",
            },
          ],
          snapshot: true,
          threadId: "thread-view-upgrade",
          turn: { id: "turn-view-upgrade", itemsView: "summary", threadId: "thread-view-upgrade" },
          type: "turn/completed",
        },
      },
      {
        event: {
          items: [
            {
              id: "item-message",
              kind: "assistantMessage",
              status: "completed",
              text: "full text",
              threadId: "thread-view-upgrade",
              turnId: "turn-view-upgrade",
            },
          ],
          snapshot: true,
          threadId: "thread-view-upgrade",
          turn: { id: "turn-view-upgrade", itemsView: "full", threadId: "thread-view-upgrade" },
          type: "turn/completed",
        },
      },
    ]);

    const upgradedTurn = upgraded.threads["thread-view-upgrade"]?.turns["turn-view-upgrade"];
    expect(upgradedTurn?.turn.itemsView).toBe("full");
    expect(upgradedTurn?.items["item-message"]?.text).toBe("full text");
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

  it("merges active turn snapshots idempotently without clearing streamed items", () => {
    const state = runEventFixture([
      {
        event: {
          status: "running",
          thread: { id: "thread-active-snapshot" },
          type: "thread/started",
        },
      },
      {
        event: {
          threadId: "thread-active-snapshot",
          turn: {
            id: "turn-active-snapshot",
            status: "running",
            threadId: "thread-active-snapshot",
          },
          type: "turn/started",
        },
      },
      {
        event: {
          item: {
            id: "item-streaming",
            kind: "assistantMessage",
            status: "inProgress",
            threadId: "thread-active-snapshot",
            turnId: "turn-active-snapshot",
          },
          threadId: "thread-active-snapshot",
          turnId: "turn-active-snapshot",
          type: "item/started",
        },
      },
      {
        event: {
          delta: "streamed text",
          itemId: "item-streaming",
          threadId: "thread-active-snapshot",
          turnId: "turn-active-snapshot",
          type: "item/agentMessage/delta",
        },
      },
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-active-snapshot" },
          turns: [
            {
              id: "turn-active-snapshot",
              itemsView: "summary",
              status: "interrupted",
              threadId: "thread-active-snapshot",
            },
          ],
          type: "thread/upserted",
        },
      },
      {
        event: {
          items: [],
          snapshot: true,
          threadId: "thread-active-snapshot",
          turn: {
            id: "turn-active-snapshot",
            itemsView: "summary",
            status: "interrupted",
            threadId: "thread-active-snapshot",
          },
          type: "turn/completed",
        },
      },
      {
        event: {
          snapshot: true,
          status: "loaded",
          threadId: "thread-active-snapshot",
          type: "thread/status/changed",
        },
      },
    ]);
    const turn =
      state.threads["thread-active-snapshot"]?.turns["turn-active-snapshot"];

    expect(state.threads["thread-active-snapshot"]?.status).toBe("running");
    expect(state.threads["thread-active-snapshot"]?.orderedTurnIds).toEqual([
      "turn-active-snapshot",
    ]);
    expect(turn?.itemOrder).toEqual(["item-streaming"]);
    expect(turn?.streamingTextByItemId["item-streaming"]).toBe("streamed text");
    expect(turn?.turn.status).toBe("interrupted");
  });

  it("keeps full turn snapshots merge-only until destructive replacement is designed", () => {
    const state = runEventFixture([
      {
        event: {
          thread: { id: "thread-full-merge-only" },
          type: "thread/started",
        },
      },
      {
        event: {
          items: [
            {
              id: "item-present",
              kind: "assistantMessage",
              status: "completed",
              text: "present",
              threadId: "thread-full-merge-only",
              turnId: "turn-full-merge-only",
            },
            {
              id: "item-omitted",
              kind: "assistantMessage",
              status: "completed",
              text: "omitted from later full snapshot",
              threadId: "thread-full-merge-only",
              turnId: "turn-full-merge-only",
            },
          ],
          snapshot: true,
          threadId: "thread-full-merge-only",
          turn: {
            id: "turn-full-merge-only",
            itemsView: "full",
            threadId: "thread-full-merge-only",
          },
          type: "turn/completed",
        },
      },
      {
        event: {
          items: [
            {
              id: "item-present",
              kind: "assistantMessage",
              status: "completed",
              text: "present refreshed",
              threadId: "thread-full-merge-only",
              turnId: "turn-full-merge-only",
            },
          ],
          snapshot: true,
          threadId: "thread-full-merge-only",
          turn: {
            id: "turn-full-merge-only",
            itemsView: "full",
            threadId: "thread-full-merge-only",
          },
          type: "turn/completed",
        },
      },
    ]);
    const turn = state.threads["thread-full-merge-only"]?.turns["turn-full-merge-only"];

    expect(turn?.itemOrder).toEqual(["item-present", "item-omitted"]);
    expect(turn?.items["item-present"]?.text).toBe("present refreshed");
    expect(turn?.items["item-omitted"]?.text).toBe("omitted from later full snapshot");
  });

  it("keeps thread/read snapshot status when stored history ends with an interrupted turn", () => {
    const state = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-interrupted-history" },
          turns: [
            {
              id: "turn-interrupted-history",
              status: "interrupted",
              threadId: "thread-interrupted-history",
            },
          ],
          type: "thread/started",
        },
      },
      {
        event: {
          items: [],
          snapshot: true,
          threadId: "thread-interrupted-history",
          turn: {
            id: "turn-interrupted-history",
            status: "interrupted",
            threadId: "thread-interrupted-history",
          },
          type: "turn/completed",
        },
      },
      {
        event: {
          snapshot: true,
          status: "loaded",
          threadId: "thread-interrupted-history",
          type: "thread/status/changed",
        },
      },
    ]);

    expect(state.threads["thread-interrupted-history"]?.status).toBe("loaded");
    expect(
      state.threads["thread-interrupted-history"]?.turns["turn-interrupted-history"]?.turn.status,
    ).toBe("interrupted");
    expect(selectThreadRegistry(state).loadedThreadIds).toContain(
      "thread-interrupted-history",
    );
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
    expect(selectApps(state).apps[0]?.id).toBe("app://browser");
    expect(state.hooks.byCwd["/repo"]?.[0]?.id).toBe("hook-1");
    expect(selectUsage(state)).toEqual({
      accountRateLimits: { primary: { usedPercent: 33 } },
      hostMetrics: { totalTokens: 12 },
    });
    expect(selectAccountRateLimits(state)).toEqual({ primary: { usedPercent: 33 } });
    expect(selectHostMetrics(state)).toEqual({ totalTokens: 12 });
    expect(state.diagnostics.banners[0]?.kind).toBe("rateLimit");
    expect(selectDiagnostics(state).banners[0]?.kind).toBe("rateLimit");
    expect(selectStatusBanners(state)[0]?.kind).toBe("rateLimit");
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
    expect(selectApps(state).apps[0]?.id).toBe("app://global");
    expect(selectApps(state, "thread-a")).toMatchObject({
      apps: [{ id: "app://thread-a", name: "Thread A" }],
      nextCursor: "next-a",
      threadId: "thread-a",
    });
    expect(selectApps(state, "thread-missing")).toEqual({
      apps: [],
      nextCursor: null,
      threadId: "thread-missing",
    });
  });

  it("loads the demo session fixture with threads, diff preview, and file approval", () => {
    const state = runEventFixture(demoFixture as FixtureStep[]);
    const threads = selectOrderedThreads(state);
    const turns = selectOrderedTurns(state, "thread-demo");

    expect(state.account.status).toBe("authenticated");
    expect(state.threadRegistry.activeThreadId).toBe("thread-demo");
    expect(threads.map((thread) => thread.thread.id)).toEqual([
      "thread-demo",
      "thread-docs",
    ]);
    expect(turns[0]?.streamingTextByItemId["item-agent"]).toContain("Approval UI");
    expect(turns[0]?.streamingTextByItemId["item-reasoning"]).toContain("reviewable");
    expect(turns[0]?.commandOutputByItemId["item-command"]).toContain("7 tests passed");
    expect(turns[0]?.filePatchByItemId["item-file"]).toContain("AgentDiffViewer");
    expect(selectOrderedItems(state, "thread-demo", "turn-demo")[0]?.id).toBe(
      "item-user",
    );
    expect(selectItemBlock(state, "thread-demo", "turn-demo", "item-agent")?.kind).toBe(
      "text",
    );
    expect(
      selectPendingApprovals(state, "thread-demo").map((request) => request.kind),
    ).toEqual(["commandApproval", "fileChangeApproval"]);
  });

  it("selects the latest running turn from thread status and turn status", () => {
    const state = runEventFixture([
      { event: { thread: { id: "thread-running" }, type: "thread/started" } },
      {
        event: {
          threadId: "thread-running",
          turn: { id: "turn-complete", status: "completed", threadId: "thread-running" },
          type: "turn/started",
        },
      },
      {
        event: {
          items: [],
          threadId: "thread-running",
          turn: { id: "turn-complete", status: "completed", threadId: "thread-running" },
          type: "turn/completed",
        },
      },
      {
        event: {
          threadId: "thread-running",
          turn: { id: "turn-running", status: "running", threadId: "thread-running" },
          type: "turn/started",
        },
      },
    ]);

    expect(selectLatestRunningTurnId(state, "thread-running")).toBe("turn-running");
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

  it("normalizes stored snapshot items into selectable item blocks", () => {
    const state = runEventFixture([
      {
        event: {
          snapshot: true,
          status: "loaded",
          thread: { id: "thread-stored-blocks" },
          turns: [{ id: "turn-stored-blocks", threadId: "thread-stored-blocks" }],
          type: "thread/upserted",
        },
      },
      {
        event: {
          items: [
            {
              id: "stored-reasoning",
              kind: "reasoning",
              raw: {
                content: [{ text: "stored reasoning" }],
                summary: [{ text: "stored summary" }],
              },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-command",
              kind: "commandExecution",
              raw: { command: "bun test", cwd: "/repo", exitCode: 0 },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-file",
              kind: "fileChange",
              raw: { changes: [{ path: "src/app.ts", status: "modified" }] },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-tool",
              kind: "toolCall",
              raw: { arguments: { q: "agent-ui" }, result: { ok: true }, tool: "search" },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-mcp",
              kind: "mcpToolCall",
              raw: { server: "browser", tool: "snapshot" },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-search",
              kind: "webSearch",
              raw: { query: "Codex App Server" },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-image",
              kind: "imageView",
              raw: { path: "/tmp/stored.png" },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
            {
              id: "stored-system",
              kind: "systemInfo",
              raw: { message: "Stored status" },
              status: "completed",
              threadId: "thread-stored-blocks",
              turnId: "turn-stored-blocks",
            },
          ],
          snapshot: true,
          threadId: "thread-stored-blocks",
          turn: { id: "turn-stored-blocks", threadId: "thread-stored-blocks" },
          type: "turn/completed",
        },
      },
    ]);

    expect(
      selectItemBlock(
        state,
        "thread-stored-blocks",
        "turn-stored-blocks",
        "stored-reasoning",
      ),
    ).toMatchObject({
      content: "stored reasoning",
      kind: "thinking",
      summary: "stored summary",
    });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-command"),
    ).toMatchObject({ command: "bun test", cwd: "/repo", exitCode: 0 });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-file"),
    ).toMatchObject({ changes: [{ path: "src/app.ts", status: "modified" }] });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-tool"),
    ).toMatchObject({ kind: "toolCall", tool: "search", toolType: "generic" });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-mcp"),
    ).toMatchObject({ kind: "mcpToolCall", server: "browser", toolType: "mcp" });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-search"),
    ).toMatchObject({ kind: "webSearch", query: "Codex App Server" });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-image"),
    ).toMatchObject({ kind: "image", path: "/tmp/stored.png" });
    expect(
      selectItemBlock(state, "thread-stored-blocks", "turn-stored-blocks", "stored-system"),
    ).toMatchObject({ kind: "systemInfo", text: "Stored status" });
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
    expect(rateLimited.usage.accountRateLimits).toEqual({
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

function expectThreadRegistryMembership(
  state: ReturnType<typeof createInitialAgentState>,
  threadId: string,
  expectedStatus: "cold" | "preview" | "live" | "loaded",
) {
  const registry = selectThreadRegistry(state);
  const memberships = [
    ["cold", registry.coldThreadIds] as const,
    ["preview", registry.previewThreadIds] as const,
    ["live", registry.liveThreadIds] as const,
    ["loaded", registry.loadedThreadIds] as const,
  ]
    .filter(([, ids]) => ids.includes(threadId))
    .map(([status]) => status);

  expect(memberships).toEqual([expectedStatus]);
  expect(state.threads[threadId]?.registryStatus).toBe(expectedStatus);
}
