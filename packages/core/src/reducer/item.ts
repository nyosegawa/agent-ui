import type { ItemEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY } from "../retention";
import {
  appendById,
  ensureItemOrder,
  updateTurn,
  upsertItem,
  withBoundedRecordEntry,
} from "./shared";

export function reduceItemEvent(
  state: AgentSessionState,
  event: ItemEvent,
): AgentSessionState {
  switch (event.type) {
    case "item/started":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    case "item/agentMessage/delta":
    case "item/reasoning/summaryTextDelta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        streamingTextByItemId: appendById(
          turn.streamingTextByItemId,
          event.itemId,
          event.delta,
        ),
      }));
    case "item/commandOutput/delta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        commandOutputByItemId: appendById(
          turn.commandOutputByItemId,
          event.itemId,
          event.delta,
          AGENT_RETENTION_POLICY.commandOutputMaxChars,
        ),
      }));
    case "item/filePatch/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        filePatchByItemId: withBoundedRecordEntry(
          turn.filePatchByItemId,
          event.itemId,
          event.patch,
          AGENT_RETENTION_POLICY.filePatchesPerTurnMax,
        ),
      }));
    case "item/completed":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled item event: ${JSON.stringify(value)}`);
}
