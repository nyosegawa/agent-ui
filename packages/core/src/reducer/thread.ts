import type { ThreadEvent } from "../events";
import type { AgentSessionState } from "../state";
import { threadEntityStore } from "../stores/thread-entity";
import { turnStore } from "../stores/turn";
import { mergeAgentTurn } from "../stores/turn-merge";
import { mergeOrderedTurnIds } from "../stores/turn-order";
import {
  isPreviewThreadStatus,
  preservesAgainstPreviewSnapshot,
} from "./shared";
import { commitThreadEntity } from "./thread-commit";

export function reduceThreadEvent(
  state: AgentSessionState,
  event: ThreadEvent,
): AgentSessionState {
  switch (event.type) {
    case "thread/upserted":
    case "thread/started": {
      const threadState = threadEntityStore.getOrCreate(state.threads, event.thread);
      const stalePreviewStatus =
        !event.snapshot &&
        state.threads[event.thread.id] &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(threadState.status);
      const status = stalePreviewStatus
        ? threadState.status
        : (event.status ?? threadState.status);
      const turns = { ...threadState.turns };
      const incomingTurnIds = (event.turns ?? []).map((turn) => turn.id);
      const orderedTurnIds = mergeOrderedTurnIds(
        threadState.orderedTurnIds,
        incomingTurnIds,
      );
      for (const turn of event.turns ?? []) {
        const existingTurn = turns[turn.id];
        turns[turn.id] = existingTurn
          ? { ...existingTurn, turn: mergeAgentTurn(existingTurn.turn, turn) }
          : turnStore.createTurnState(turn, event.thread.id);
      }
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(
          state,
          {
            ...threadState,
            orderedTurnIds,
            thread: { ...threadState.thread, ...event.thread },
            status,
            turns,
          },
          {
            activeThreadId:
              event.type === "thread/started"
                ? event.thread.id
                : state.threadRegistry.activeThreadId,
          },
        ),
      );
    }
    case "thread/status/changed": {
      const currentThread = state.threads[event.threadId];
      const currentStatus = currentThread?.status;
      if (!currentThread) return state;
      const status =
        !event.snapshot &&
        currentStatus &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(currentStatus)
          ? currentStatus
          : event.status;
      return threadEntityStore.pruneSnapshots(
        commitThreadEntity(state, {
          ...currentThread,
          status,
        }),
      );
    }
    case "thread/name/updated":
      return threadEntityStore.update(state, event.threadId, (thread) => ({
        ...thread,
        thread: { ...thread.thread, name: event.name },
      }));
    case "thread/tokenUsage/updated":
      return threadEntityStore.update(state, event.threadId, (thread) => ({
        ...thread,
        tokenUsage: event.tokenUsage,
      }));
    case "thread/active/set":
      return {
        ...state,
        threadRegistry: { ...state.threadRegistry, activeThreadId: event.threadId },
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled thread event: ${JSON.stringify(value)}`);
}
