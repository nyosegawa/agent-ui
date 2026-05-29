import type { AgentSessionState, ThreadId, ThreadState } from "../state";
import { threadIndexStore } from "../stores/thread-index";

export function commitThreadEntity(
  state: AgentSessionState,
  thread: ThreadState,
  options: { activeThreadId?: ThreadId } = {},
): AgentSessionState {
  const registryStatus = threadIndexStore.classifyStatus(
    thread.status,
    thread.orderedTurnIds
      .map((turnId) => thread.turns[turnId]?.turn)
      .filter((turn) => turn != null),
  );
  return {
    ...state,
    threadRegistry: threadIndexStore.upsert(
      state.threadRegistry,
      thread.thread.id,
      registryStatus,
      options.activeThreadId,
    ),
    threads: {
      ...state.threads,
      [thread.thread.id]: {
        ...thread,
        registryStatus,
      },
    },
  };
}
