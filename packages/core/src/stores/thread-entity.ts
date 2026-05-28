import type {
  AgentSessionState,
  AgentThread,
  ThreadId,
  ThreadStatus,
  ThreadState,
} from "../state";
import { threadIndexStore } from "./thread-index";

export type ThreadEntityState = Record<ThreadId, ThreadState>;

export interface ThreadEntityStore {
  createInitialState(): ThreadEntityState;
  createThreadState(thread: AgentThread): ThreadState;
  getOrCreate(threads: ThreadEntityState, thread: AgentThread): ThreadState;
  setStatus(
    state: AgentSessionState,
    threadId: ThreadId,
    status: ThreadStatus,
    options?: { onlyIf?: ThreadStatus },
  ): AgentSessionState;
  update(
    state: AgentSessionState,
    threadId: ThreadId,
    updater: (thread: ThreadState) => ThreadState,
  ): AgentSessionState;
  pruneSnapshots(state: AgentSessionState): AgentSessionState;
}

export const threadEntityStore: ThreadEntityStore = {
  createInitialState: createInitialThreadEntityState,
  createThreadState,
  getOrCreate: getOrCreateThreadState,
  pruneSnapshots: pruneThreadSnapshots,
  setStatus: setThreadStatus,
  update: updateThreadEntity,
};

export function createInitialThreadEntityState(): ThreadEntityState {
  return {};
}

export function createThreadState(thread: AgentThread): ThreadState {
  return {
    orderedTurnIds: [],
    registryStatus: "loaded",
    status: "loaded",
    thread,
    turns: {},
  };
}

export function getOrCreateThreadState(
  threads: ThreadEntityState,
  thread: AgentThread,
): ThreadState {
  return threads[thread.id] ?? createThreadState(thread);
}

export function updateThreadEntity(
  state: AgentSessionState,
  threadId: ThreadId,
  updater: (thread: ThreadState) => ThreadState,
): AgentSessionState {
  const thread = state.threads[threadId];
  if (!thread) return state;
  return {
    ...state,
    threads: {
      ...state.threads,
      [threadId]: updater(thread),
    },
  };
}

export function setThreadStatus(
  state: AgentSessionState,
  threadId: ThreadId,
  status: ThreadStatus,
  options: { onlyIf?: ThreadStatus } = {},
): AgentSessionState {
  const thread = state.threads[threadId];
  if (!thread || (options.onlyIf !== undefined && thread.status !== options.onlyIf)) {
    return state;
  }
  const registryStatus = threadIndexStore.classifyStatus(
    status,
    thread.orderedTurnIds
      .map((turnId) => thread.turns[turnId]?.turn)
      .filter((turn) => turn != null),
  );
  return {
    ...state,
    threadRegistry: threadIndexStore.upsert(
      state.threadRegistry,
      threadId,
      registryStatus,
    ),
    threads: {
      ...state.threads,
      [threadId]: {
        ...thread,
        registryStatus,
        status,
      },
    },
  };
}

export function pruneThreadSnapshots(state: AgentSessionState): AgentSessionState {
  const retainedThreadIds = new Set<ThreadId>([
    ...state.threadRegistry.coldThreadIds,
    ...state.threadRegistry.previewThreadIds,
    ...state.threadRegistry.liveThreadIds,
    ...state.threadRegistry.loadedThreadIds,
  ]);
  if (state.threadRegistry.activeThreadId) {
    retainedThreadIds.add(state.threadRegistry.activeThreadId);
  }
  for (const request of Object.values(state.serverRequestQueue.byId)) {
    if (request.threadId) retainedThreadIds.add(request.threadId);
  }

  let changed = false;
  const threads: ThreadEntityState = {};
  for (const [threadId, thread] of Object.entries(state.threads)) {
    if (retainedThreadIds.has(threadId)) {
      threads[threadId] = thread;
      continue;
    }
    if (thread.registryStatus === "live") {
      threads[threadId] = thread;
      retainedThreadIds.add(threadId);
      continue;
    }
    changed = true;
  }
  return changed ? { ...state, threads } : state;
}
