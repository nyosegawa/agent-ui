import type { ThreadState, TurnState } from "@nyosegawa/agent-ui-core";

export const DEFAULT_TRANSCRIPT_ITEM_LIMIT = 48;
export const TRANSCRIPT_ITEM_INCREMENT = 48;

export function transcriptItemIds(turn: TurnState): string[] {
  const ids = new Set(turn.itemOrder);
  for (const itemId of Object.keys(turn.commandOutputByItemId)) ids.add(itemId);
  for (const itemId of Object.keys(turn.filePatchByItemId)) ids.add(itemId);
  return [...ids];
}

export function visibleTranscriptWindow(
  thread: ThreadState,
  visibleItemLimit: number,
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
  const itemIdsByTurnId = new Map<string, string[]>();
  for (const entry of visibleEntries) {
    const ids = itemIdsByTurnId.get(entry.turnId) ?? [];
    ids.push(entry.itemId);
    itemIdsByTurnId.set(entry.turnId, ids);
  }
  return {
    itemIdsByTurnId,
    totalItemCount: allEntries.length,
    visibleItemCount: visibleEntries.length,
  };
}
