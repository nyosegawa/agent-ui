import type { ThreadState, TurnState } from "@nyosegawa/agent-ui-core";

export const DEFAULT_TRANSCRIPT_ITEM_LIMIT = 48;
export const TRANSCRIPT_ITEM_INCREMENT = 48;

const EXECUTION_CONTEXT_KINDS = new Set([
  "commandExecution",
  "command",
  "dynamicTool",
  "dynamicToolCall",
  "fileChange",
  "mcpToolCall",
  "patch",
  "toolCall",
]);

export function transcriptItemIds(turn: TurnState): string[] {
  const ids = new Set(turn.itemOrder);
  for (const itemId of Object.keys(turn.commandOutputByItemId)) ids.add(itemId);
  for (const itemId of Object.keys(turn.filePatchByItemId)) ids.add(itemId);
  return [...ids];
}

export function visibleTranscriptWindow(
  thread: ThreadState,
  visibleItemLimit: number,
  options?: {
    pinnedItemIdsByTurnId?: Map<string, string[]>;
  },
): {
  itemIdsByTurnId: Map<string, string[]>;
  totalItemCount: number;
  visibleItemCount: number;
} {
  const allEntries: Array<{ itemId: string; turnId: string }> = [];
  for (const turnId of thread.orderedTurnIds) {
    const turn = thread.turns[turnId];
    if (!turn) continue;
    for (const itemId of transcriptItemIds(turn)) {
      allEntries.push({ itemId, turnId });
    }
  }
  const visibleEntries = allEntries.slice(Math.max(0, allEntries.length - visibleItemLimit));
  const visibleByTurnId = new Map<string, Set<string>>();
  for (const entry of visibleEntries) {
    const ids = visibleByTurnId.get(entry.turnId) ?? new Set<string>();
    ids.add(entry.itemId);
    visibleByTurnId.set(entry.turnId, ids);
  }
  for (const [turnId, itemIds] of options?.pinnedItemIdsByTurnId ?? []) {
    const turn = thread.turns[turnId];
    if (!turn) continue;
    const transcriptIds = new Set(transcriptItemIds(turn));
    const ids = visibleByTurnId.get(turnId) ?? new Set<string>();
    for (const itemId of itemIds) {
      if (transcriptIds.has(itemId)) ids.add(itemId);
    }
    if (ids.size > 0) visibleByTurnId.set(turnId, ids);
  }
  const itemIdsByTurnId = new Map<string, string[]>();
  for (const turnId of thread.orderedTurnIds) {
    const turn = thread.turns[turnId];
    const visibleIds = visibleByTurnId.get(turnId);
    if (!turn || !visibleIds) continue;
    const shouldKeepExecutionContext = [...visibleIds].some((itemId) =>
      isFileChangeKind(turn.items[itemId]?.kind),
    );
    const ids = shouldKeepExecutionContext
      ? transcriptItemIds(turn).filter((itemId) => {
          return visibleIds.has(itemId) || isExecutionContextKind(turn.items[itemId]?.kind);
        })
      : transcriptItemIds(turn).filter((itemId) => visibleIds.has(itemId));
    itemIdsByTurnId.set(turnId, ids);
  }
  return {
    itemIdsByTurnId,
    totalItemCount: allEntries.length,
    visibleItemCount: [...visibleByTurnId.values()].reduce(
      (total, ids) => total + ids.size,
      0,
    ),
  };
}

function isExecutionContextKind(kind: string | undefined): boolean {
  return kind !== undefined && EXECUTION_CONTEXT_KINDS.has(kind);
}

function isFileChangeKind(kind: string | undefined): boolean {
  return kind === "fileChange" || kind === "patch";
}
