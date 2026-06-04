import type { ItemEvent } from "../events";
import type { AgentItemState, AgentSessionState, ThreadState, TurnState } from "../state";
import { AGENT_RETENTION_POLICY } from "../retention";
import {
  clientUserMessageId,
  itemStore,
  reconcileUserMessageItem,
} from "../stores/item";
import { threadEntityStore } from "../stores/thread-entity";
import { turnStore } from "../stores/turn";

export function reduceItemEvent(
  state: AgentSessionState,
  event: ItemEvent,
): AgentSessionState {
  switch (event.type) {
    case "item/started":
      return upsertItemEvent(state, event);
    case "item/agentMessage/delta":
    case "item/reasoning/summaryTextDelta":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.appendStreamingText(turn, event.itemId, event.delta),
      );
    case "item/commandOutput/delta":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.appendCommandOutput(
          turn,
          event.itemId,
          event.delta,
          AGENT_RETENTION_POLICY.commandOutputMaxChars,
        ),
      );
    case "item/filePatch/updated":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.updateFilePatch(
          turn,
          event.itemId,
          event.patch,
          AGENT_RETENTION_POLICY.filePatchesPerTurnMax,
        ),
      );
    case "item/failed":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.updateItemStatus(turn, event.itemId, "failed", {
          raw: event.error ? { error: event.error } : undefined,
        }),
      );
    case "item/completed":
      return upsertItemEvent(state, event);
    default:
      return assertNever(event);
  }
}

function upsertItemEvent(
  state: AgentSessionState,
  event: Extract<ItemEvent, { type: "item/started" | "item/completed" }>,
): AgentSessionState {
  const clientId =
    event.item.kind === "userMessage"
      ? clientUserMessageId(event.item.raw)
      : undefined;
  if (!clientId) {
    return turnStore.update(state, event.threadId, event.turnId, (turn) =>
      itemStore.upsert(turn, event.item),
    );
  }
  const thread = state.threads[event.threadId];
  const match = thread ? findClientUserMessage(thread, clientId) : undefined;
  if (!match || match.turnId === event.turnId) {
    return turnStore.update(state, event.threadId, event.turnId, (turn) =>
      itemStore.upsert(turn, event.item),
    );
  }
  return threadEntityStore.update(state, event.threadId, (currentThread) =>
    moveReconciledUserMessage(currentThread, event, match),
  );
}

function findClientUserMessage(
  thread: ThreadState,
  clientId: string,
): { item: AgentItemState; turnId: string } | undefined {
  for (const [turnId, turn] of Object.entries(thread.turns)) {
    for (const item of Object.values(turn.items)) {
      if (
        item.kind === "userMessage" &&
        clientUserMessageId(item.raw) === clientId
      ) {
        return { item, turnId };
      }
    }
  }
  return undefined;
}

function moveReconciledUserMessage(
  thread: ThreadState,
  event: Extract<ItemEvent, { type: "item/started" | "item/completed" }>,
  match: { item: AgentItemState; turnId: string },
): ThreadState {
  const sourceTurn = thread.turns[match.turnId];
  if (!sourceTurn) return thread;
  const targetTurn =
    thread.turns[event.turnId] ??
    turnStore.createTurnState(
      { id: event.turnId, status: "running", threadId: event.threadId },
      event.threadId,
    );
  const reconciledItem = reconcileUserMessageItem(
    match.item,
    {
      ...event.item,
      threadId: event.threadId,
      turnId: event.turnId,
    },
    clientUserMessageId(event.item.raw) ?? match.item.id,
  );
  const nextSourceTurn = removeItemFromTurn(sourceTurn, match.item.id);
  const nextTargetTurn = itemStore.upsert(targetTurn, reconciledItem);
  const turns = { ...thread.turns };
  const orderedTurnIds = thread.orderedTurnIds.includes(event.turnId)
    ? thread.orderedTurnIds
    : [...thread.orderedTurnIds, event.turnId];
  if (shouldRemoveOptimisticTurn(nextSourceTurn)) {
    delete turns[match.turnId];
  } else {
    turns[match.turnId] = nextSourceTurn;
  }
  turns[event.turnId] = nextTargetTurn;
  return {
    ...thread,
    orderedTurnIds: orderedTurnIds.filter(
      (turnId) => turnId !== match.turnId || !shouldRemoveOptimisticTurn(nextSourceTurn),
    ),
    turns,
  };
}

function removeItemFromTurn(turn: TurnState, itemId: string): TurnState {
  const { [itemId]: _item, ...items } = turn.items;
  const { [itemId]: _block, ...blocksByItemId } = turn.blocksByItemId;
  const { [itemId]: _streamingText, ...streamingTextByItemId } =
    turn.streamingTextByItemId;
  const { [itemId]: _commandOutput, ...commandOutputByItemId } =
    turn.commandOutputByItemId;
  const { [itemId]: _filePatch, ...filePatchByItemId } = turn.filePatchByItemId;
  void _item;
  void _block;
  void _streamingText;
  void _commandOutput;
  void _filePatch;
  return {
    ...turn,
    blocksByItemId,
    commandOutputByItemId,
    filePatchByItemId,
    itemOrder: turn.itemOrder.filter((candidate) => candidate !== itemId),
    items,
    streamingTextByItemId,
  };
}

function shouldRemoveOptimisticTurn(turn: TurnState): boolean {
  const raw = turn.turn.raw;
  const optimistic =
    typeof raw === "object" &&
    raw !== null &&
    (raw as Record<string, unknown>).optimistic === true;
  return (
    optimistic &&
    turn.itemOrder.length === 0 &&
    Object.keys(turn.items).length === 0 &&
    Object.keys(turn.blocksByItemId).length === 0 &&
    Object.keys(turn.streamingTextByItemId).length === 0 &&
    Object.keys(turn.commandOutputByItemId).length === 0 &&
    Object.keys(turn.filePatchByItemId).length === 0
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled item event: ${JSON.stringify(value)}`);
}
