import type { ItemEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY } from "../retention";
import { itemStore } from "../stores/item";
import { turnStore } from "../stores/turn";

export function reduceItemEvent(
  state: AgentSessionState,
  event: ItemEvent,
): AgentSessionState {
  switch (event.type) {
    case "item/started":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.upsert(turn, event.item),
      );
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
    case "item/completed":
      return turnStore.update(state, event.threadId, event.turnId, (turn) =>
        itemStore.upsert(turn, event.item),
      );
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled item event: ${JSON.stringify(value)}`);
}
