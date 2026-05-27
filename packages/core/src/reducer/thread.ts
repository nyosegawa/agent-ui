import type { ThreadEvent } from "../events";
import type { AgentSessionState } from "../state";
import { threadEntityStore } from "../stores/thread-entity";
import { threadIndexStore } from "../stores/thread-index";
import { turnStore } from "../stores/turn";
import {
  isPreviewThreadStatus,
  preservesAgainstPreviewSnapshot,
} from "./shared";

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
      const orderedTurnIds = [...threadState.orderedTurnIds];
      for (const turn of event.turns ?? []) {
        if (!orderedTurnIds.includes(turn.id)) orderedTurnIds.push(turn.id);
        turns[turn.id] =
          turns[turn.id] ?? turnStore.createTurnState(turn, event.thread.id);
      }
      return threadEntityStore.pruneSnapshots({
        ...state,
        activeThreadId:
          event.type === "thread/started" ? event.thread.id : state.activeThreadId,
        threadRegistry: threadIndexStore.upsert(
          state.threadRegistry,
          event.thread.id,
          threadIndexStore.classifyStatus(status, event.turns),
          event.type === "thread/started" ? event.thread.id : state.threadRegistry.activeThreadId,
        ),
        threads: {
          ...state.threads,
          [event.thread.id]: {
            ...threadState,
            orderedTurnIds,
            registryStatus: threadIndexStore.classifyStatus(status, event.turns),
            status,
            turns,
          },
        },
      });
    }
    case "thread/status/changed": {
      const currentStatus = state.threads[event.threadId]?.status;
      const status =
        !event.snapshot &&
        currentStatus &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(currentStatus)
          ? currentStatus
          : event.status;
      return threadEntityStore.pruneSnapshots(threadEntityStore.update(
        {
          ...state,
          threadRegistry: threadIndexStore.upsert(
            state.threadRegistry,
            event.threadId,
            threadIndexStore.classifyStatus(status),
          ),
        },
        event.threadId,
        (thread) => ({
          ...thread,
          registryStatus: threadIndexStore.classifyStatus(status),
          status,
        }),
      ));
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
        activeThreadId: event.threadId,
        threadRegistry: { ...state.threadRegistry, activeThreadId: event.threadId },
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled thread event: ${JSON.stringify(value)}`);
}
