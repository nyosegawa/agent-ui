import { describe, expect, it } from "vitest";
import { normalizeThreadReadResponse } from "@nyosegawa/agent-ui-codex/normalizer";
import {
  threadProjectPath,
  threadSnapshotEvents,
  threadUpsertEvent,
} from "../src/thread-history";

describe("thread history normalization", () => {
  it("keeps public compatibility helpers aligned with the Codex normalizer", () => {
    const rawThread = {
      id: "thread-parity",
      name: "Normalizer parity",
      status: { type: "idle" },
      turns: [
        {
          id: "turn-parity",
          items: [{ id: "item-parity", text: "same output", type: "agentMessage" }],
          itemsView: "full",
          status: "completed",
        },
      ],
    };

    expect(threadSnapshotEvents(rawThread, true)).toEqual(
      normalizeThreadReadResponse({ thread: rawThread }, { activate: true }),
    );
    expect(threadUpsertEvent(rawThread)).toEqual(
      normalizeThreadReadResponse({ thread: rawThread }, { activate: false })[0],
    );
  });

  it("upserts thread/list entries without activating them", () => {
    expect(
      threadUpsertEvent({
        id: "thread-1",
        preview: "Fix stored bug",
        status: { type: "notLoaded" },
      }),
    ).toMatchObject({
      status: "notLoaded",
      thread: { id: "thread-1", name: "Fix stored bug" },
      type: "thread/upserted",
    });
  });

  it("rejects thread payloads without ids", () => {
    expect(() => threadUpsertEvent({ name: "Broken thread" })).toThrow(
      "thread payload is missing an id",
    );
    expect(() => threadSnapshotEvents({ name: "Broken thread" }, true)).toThrow(
      "thread payload is missing an id",
    );
  });

  it("prefers real cwd over internal Codex session paths", () => {
    expect(
      threadProjectPath({
        cwd: "/Users/example/project",
        path: "/Users/example/.codex/sessions/2026/05/10/rollout-demo.jsonl",
      }),
    ).toBe("/Users/example/project");
    expect(
      threadUpsertEvent({
        cwd: "/Users/example/project",
        id: "thread-cwd",
        path: "/Users/example/.codex/sessions/2026/05/10/rollout-demo.jsonl",
      }),
    ).toMatchObject({
      thread: { path: "/Users/example/project" },
    });
    expect(
      threadProjectPath({
        path: "/Users/example/.codex/sessions/2026/05/10/rollout-demo.jsonl",
      }),
    ).toBeUndefined();
  });

  it("hydrates thread/read turns, command output, and file changes", () => {
    const events = threadSnapshotEvents(
      {
        id: "thread-1",
        name: "Fix stored bug",
        status: { type: "idle" },
        turns: [
          {
            id: "turn-1",
            items: [
              {
                content: [{ text: "Please inspect this", type: "text" }],
                id: "item-user",
                type: "userMessage",
              },
              {
                aggregatedOutput: "bun test\nok\n",
                command: "bun test",
                id: "item-command",
                status: "completed",
                type: "commandExecution",
              },
              {
                changes: [{ path: "src/app.ts", type: "update" }],
                id: "item-file",
                status: "completed",
                type: "fileChange",
              },
            ],
            status: "completed",
          },
        ],
      },
      true,
    );

    expect(events.map((event) => event.type)).toEqual([
      "thread/started",
      "turn/completed",
      "item/commandOutput/delta",
      "item/filePatch/updated",
      "thread/status/changed",
    ]);
    expect(events[1]).toMatchObject({
      items: [
        { id: "item-user", status: "completed", text: "Please inspect this" },
        { id: "item-command", status: "completed", text: "bun test" },
        { id: "item-file", status: "completed" },
      ],
      snapshot: true,
    });
    expect(events[4]).toMatchObject({ snapshot: true, status: "loaded" });
  });

  it("marks interrupted thread/read turns as snapshot history", () => {
    const events = threadSnapshotEvents(
      {
        id: "thread-interrupted-history",
        status: { type: "notLoaded" },
        turns: [{ id: "turn-interrupted-history", status: "interrupted" }],
      },
      true,
    );

    expect(events[0]).toMatchObject({ snapshot: true, status: "loaded" });
    expect(events[1]).toMatchObject({
      snapshot: true,
      turn: { id: "turn-interrupted-history", status: "interrupted" },
      type: "turn/completed",
    });
    expect(events.at(-1)).toMatchObject({ snapshot: true, status: "loaded" });
  });

  it("preserves upstream turn item view completeness", () => {
    const events = threadSnapshotEvents(
      {
        id: "thread-items-view",
        status: { type: "idle" },
        turns: [
          { id: "turn-not-loaded", itemsView: "notLoaded" },
          { id: "turn-summary", items_view: "summary" },
          { id: "turn-full", itemsView: "full" },
        ],
      },
      true,
    );

    expect(events[0]).toMatchObject({
      turns: [
        { id: "turn-not-loaded", itemsView: "notLoaded" },
        { id: "turn-summary", itemsView: "summary" },
        { id: "turn-full", itemsView: "full" },
      ],
    });
    expect(events[1]).toMatchObject({
      turn: { id: "turn-not-loaded", itemsView: "notLoaded" },
    });
  });

  it("preserves omitted turns as omitted snapshot payloads", () => {
    expect(
      threadSnapshotEvents(
        {
          id: "thread-history",
          status: { type: "notLoaded" },
        },
        true,
      )[0],
    ).toEqual({
      snapshot: true,
      status: "notLoaded",
      thread: {
        ephemeral: false,
        id: "thread-history",
        name: undefined,
        path: undefined,
        raw: {
          id: "thread-history",
          status: { type: "notLoaded" },
        },
      },
      type: "thread/started",
    });
  });
});
