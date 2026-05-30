import {
  AGENT_RETENTION_POLICY,
  agentReducer,
  createInitialAgentState,
  type ThreadState,
  type TurnState,
} from "@nyosegawa/agent-ui-core";
import { describe, expect, it } from "vitest";
import { transcriptItemIds, visibleTranscriptWindow } from "../src/transcript-window";
import { blockForTranscriptItem } from "../src/timeline/blocks";
import { displayItemStatus, displayText } from "../src/timeline/formatters";
import { toolPreview } from "../src/timeline/previews";

describe("timeline pure helpers", () => {
  it("synthesizes stored mcp tool and file-change blocks without React", () => {
    const turn: TurnState = {
      commandOutputByItemId: {},
      filePatchByItemId: {},
      itemOrder: ["tool", "file"],
      items: {
        file: {
          id: "file",
          kind: "fileChange",
          raw: { changes: [{ kind: "update", path: "src/app.ts" }] },
          status: "completed",
          threadId: "thread",
          turnId: "turn",
        },
        tool: {
          id: "tool",
          kind: "mcpToolCall",
          raw: {
            arguments: { selector: "#app" },
            durationMs: 42,
            result: { content: [{ text: "DOM snapshot captured", type: "text" }] },
            server: "agent-browser",
            tool: "snapshot",
          },
          status: "completed",
          threadId: "thread",
          turnId: "turn",
        },
      },
      streamingTextByItemId: {},
      turn: { id: "turn", threadId: "thread" },
    };

    expect(blockForTranscriptItem(turn, "tool", undefined)).toMatchObject({
      arguments: { selector: "#app" },
      durationMs: 42,
      kind: "mcpToolCall",
      server: "agent-browser",
      tool: "snapshot",
    });
    expect(blockForTranscriptItem(turn, "file", undefined)).toMatchObject({
      changes: [{ kind: "update", path: "src/app.ts" }],
      kind: "fileChange",
    });
  });

  it("keeps same-turn execution context when a visible tail ends with a file change", () => {
    const fillerIds = Array.from({ length: 60 }, (_, index) => `message-${index}`);
    const turn: TurnState = {
      commandOutputByItemId: {},
      filePatchByItemId: {},
      itemOrder: ["tool", ...fillerIds, "file"],
      items: {
        file: {
          id: "file",
          kind: "fileChange",
          status: "completed",
          threadId: "thread",
          turnId: "turn",
        },
        ...Object.fromEntries(
          fillerIds.map((id) => [
            id,
            {
              id,
              kind: "agentMessage",
              status: "completed",
              text: id,
              threadId: "thread",
              turnId: "turn",
            },
          ]),
        ),
        tool: {
          id: "tool",
          kind: "mcpToolCall",
          status: "completed",
          threadId: "thread",
          turnId: "turn",
        },
      },
      streamingTextByItemId: {},
      turn: { id: "turn", threadId: "thread" },
    };
    const thread: ThreadState = {
      orderedTurnIds: ["turn"],
      status: "loaded",
      thread: { id: "thread", name: "Stored" },
      turns: { turn },
    };

    const window = visibleTranscriptWindow(thread, 12);
    expect(window.itemIdsByTurnId.get("turn")).toContain("tool");
    expect(window.itemIdsByTurnId.get("turn")).toContain("file");
    expect(window.visibleItemCount).toBe(12);
  });

  it("counts only retained patch-only transcript ids after core patch eviction", () => {
    let state = createInitialAgentState();
    state = agentReducer(state, {
      status: "running",
      thread: { id: "thread-patch-window" },
      type: "thread/started",
    });
    for (let index = 0; index < AGENT_RETENTION_POLICY.filePatchesPerTurnMax + 6; index += 1) {
      state = agentReducer(state, {
        itemId: `patch-window-${index}`,
        patch: { index },
        threadId: "thread-patch-window",
        turnId: "turn-patch-window",
        type: "item/filePatch/updated",
      });
    }

    const thread = state.threads["thread-patch-window"];
    const turn = thread?.turns["turn-patch-window"];
    expect(turn).toBeDefined();
    expect(transcriptItemIds(turn as TurnState)).toHaveLength(
      AGENT_RETENTION_POLICY.filePatchesPerTurnMax,
    );
    expect(visibleTranscriptWindow(thread as ThreadState, 200).totalItemCount).toBe(
      AGENT_RETENTION_POLICY.filePatchesPerTurnMax,
    );
  });

  it("keeps normal text readable while suppressing machine previews", () => {
    expect(displayText([{ text: "hello", type: "text" }])).toBe("hello");
    expect(displayItemStatus("inProgress", "loaded")).toBe("completed");
    expect(
      toolPreview({
        id: "tool",
        kind: "mcpToolCall",
        result: { content: [{ text: "true", type: "text" }] },
        status: "completed",
      }),
    ).toBe("Result captured");
    expect(
      toolPreview({
        id: "tool",
        kind: "mcpToolCall",
        result: { content: [{ text: "DOM snapshot captured", type: "text" }] },
        status: "completed",
      }),
    ).toBe("DOM snapshot captured");
  });
});
