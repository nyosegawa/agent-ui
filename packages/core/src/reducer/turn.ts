import type { TurnEvent } from "../events";
import type { AgentSessionState } from "../state";
import {
  createTurnState,
  isCompletedTurnStatus,
  isPreviewThreadStatus,
  updateThread,
  updateTurn,
  upsertTurn,
} from "./shared";

export function reduceTurnEvent(
  state: AgentSessionState,
  event: TurnEvent,
): AgentSessionState {
  switch (event.type) {
    case "turn/started":
      return updateThread(state, event.threadId, (thread) =>
        upsertTurn(thread, event.turn, "running"),
      );
    case "turn/completed":
      return updateThread(state, event.threadId, (thread) => {
        const completedStatus =
          event.snapshot
            ? thread.status
            : (thread.status === "ready" || isPreviewThreadStatus(thread.status)) &&
                isCompletedTurnStatus(event.turn.status)
              ? thread.status
              : (event.turn.status ?? "complete");
        const next = upsertTurn(thread, event.turn, completedStatus);
        const turn =
          next.turns[event.turn.id] ?? createTurnState(event.turn, event.threadId);
        const items = { ...turn.items };
        const itemOrder = [...turn.itemOrder];
        for (const item of event.items ?? []) {
          items[item.id] = item;
          if (!itemOrder.includes(item.id)) itemOrder.push(item.id);
        }
        return {
          ...next,
          turns: {
            ...next.turns,
            [event.turn.id]: {
              ...turn,
              itemOrder,
              items,
              turn: event.turn,
            },
          },
        };
      });
    case "turn/plan/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        plan: {
          explanation: event.explanation,
          plan: event.plan,
          raw: event.raw,
        },
      }));
    case "turn/diff/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        diff: {
          diff: event.diff,
          raw: event.raw,
        },
      }));
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled turn event: ${JSON.stringify(value)}`);
}
