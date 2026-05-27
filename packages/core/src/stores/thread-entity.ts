import type {
  AgentSessionState,
  AgentThread,
  ThreadId,
  ThreadState,
} from "../state";

export type ThreadEntityState = Record<ThreadId, ThreadState>;

export interface ThreadEntityStore {
  createInitialState(): ThreadEntityState;
  createThreadState(thread: AgentThread): ThreadState;
  getOrCreate(threads: ThreadEntityState, thread: AgentThread): ThreadState;
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

export function pruneThreadSnapshots(state: AgentSessionState): AgentSessionState {
  const retainedThreadIds = new Set<ThreadId>([
    ...state.threadRegistry.coldThreadIds,
    ...state.threadRegistry.previewThreadIds,
    ...state.threadRegistry.liveThreadIds,
    ...state.threadRegistry.loadedThreadIds,
  ]);
  if (state.activeThreadId) retainedThreadIds.add(state.activeThreadId);
  if (state.threadRegistry.activeThreadId) {
    retainedThreadIds.add(state.threadRegistry.activeThreadId);
  }
  for (const request of Object.values(state.pendingServerRequests)) {
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
