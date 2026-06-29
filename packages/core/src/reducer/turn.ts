import type { TurnEvent } from "../events";
import type {
  AgentItemState,
  AgentSessionState,
  AgentTurn,
  ThreadId,
  ThreadStatus,
} from "../state";
import { itemStore } from "../stores/item";
import { turnStore } from "../stores/turn";
import {
  runtimeWithCompletedTurn,
  runtimeWithStartedTurn,
} from "../stores/thread-runtime";
import { mergeAgentTurn, shouldApplyTurnItems } from "../stores/turn-merge";
import { canonicalThreadId } from "../thread-alias";
import {
  isCompletedTurnStatus,
  isPreviewThreadStatus,
} from "./shared";
import { commitThreadEntity } from "./thread-commit";

export function reduceTurnEvent(
  state: AgentSessionState,
  event: TurnEvent,
): AgentSessionState {
  switch (event.type) {
    case "turn/started": {
      const threadId = canonicalThreadId(state, event.threadId);
      const thread = state.threads[threadId];
      if (!thread) return state;
      const incomingTurn = canonicalTurn(event.turn, threadId);
      return commitThreadEntity(
        state,
        {
          ...turnStore.upsert(thread, incomingTurn, "running"),
          runtime: runtimeWithStartedTurn(thread.runtime, incomingTurn),
        },
      );
    }
    case "turn/completed": {
      const threadId = canonicalThreadId(state, event.threadId);
      const thread = state.threads[threadId];
      if (!thread) return state;
      const incomingTurn = canonicalTurn(event.turn, threadId);
      const nextThread = (() => {
        const completedStatus: ThreadStatus =
          event.snapshot
            ? thread.status
            : (thread.status === "ready" || isPreviewThreadStatus(thread.status)) &&
                isCompletedTurnStatus(incomingTurn.status)
              ? thread.status
              : turnCompletionThreadStatus(incomingTurn.status);
        const next = turnStore.upsert(thread, incomingTurn, completedStatus);
        const turn =
          next.turns[incomingTurn.id] ??
          turnStore.createTurnState(incomingTurn, threadId);
        let completedTurn = {
          ...turn,
          turn: mergeAgentTurn(turn.turn, incomingTurn),
        };
        if (shouldApplyTurnItems(turn.turn, incomingTurn)) {
          for (const item of event.items ?? []) {
            completedTurn = itemStore.upsert(
              completedTurn,
              canonicalItem(item as AgentItemState, threadId),
            );
          }
        }
        return {
          ...next,
          runtime: runtimeWithCompletedTurn(thread.runtime, incomingTurn),
          turns: {
            ...next.turns,
            [incomingTurn.id]: completedTurn,
          },
        };
      })();
      return commitThreadEntity(state, nextThread);
    }
    case "turn/plan/updated":
      return turnStore.update(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        plan: {
          explanation: event.explanation,
          plan: event.plan,
        },
      }));
    case "turn/diff/updated":
      return turnStore.update(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        diff: {
          diff: event.diff,
        },
      }));
    default:
      return assertNever(event);
  }
}

function canonicalTurn(turn: AgentTurn, threadId: ThreadId): AgentTurn {
  return turn.threadId === threadId ? turn : { ...turn, threadId };
}

function turnCompletionThreadStatus(status: string | undefined): ThreadStatus {
  if (status === "failed") return "failed";
  if (status === "interrupted") return "interrupted";
  if (status === "completed") return "completed";
  return status === "error" ? "error" : "complete";
}

function canonicalItem(
  item: AgentItemState,
  threadId: ThreadId,
): AgentItemState {
  return item.threadId === threadId ? item : { ...item, threadId };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled turn event: ${JSON.stringify(value)}`);
}
