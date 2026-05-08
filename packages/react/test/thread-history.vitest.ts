import { describe, expect, it } from "vitest";
import { threadSnapshotEvents, threadUpsertEvent } from "../src/thread-history";

describe("thread history normalization", () => {
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

  it("hydrates thread/read turns, command output, and file changes", () => {
    expect(
      threadSnapshotEvents(
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
      ).map((event) => event.type),
    ).toEqual([
      "thread/started",
      "turn/completed",
      "item/commandOutput/delta",
      "item/filePatch/updated",
    ]);
  });
});
