import type {
  AgentSessionState,
  AgentThread,
  ThreadId,
  ThreadStatus,
  ThreadState,
} from "../state";
import {
  threadActivityFromStatus,
  threadAvailabilityFromStatus,
  threadLifecycleStore,
  threadMetadataFromThread,
  threadStorageFromThread,
} from "./thread-lifecycle";

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
    activity: "idle",
    availability: "available",
    id: thread.id,
    metadata: threadMetadataFromThread(thread),
    operations: {},
    orderedTurnIds: [],
    status: "loaded",
    storage: threadStorageFromThread(thread),
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
  const activity = threadActivityFromStatus(status);
  const availability = threadAvailabilityFromStatus(status);
  return {
    ...state,
    threadLifecycle: threadLifecycleStore.upsertThread(state.threadLifecycle, {
      ...thread,
      activity,
      availability,
      status,
    }),
    threads: {
      ...state.threads,
      [threadId]: {
        ...thread,
        activity,
        availability,
        status,
      },
    },
  };
}

export function pruneThreadSnapshots(state: AgentSessionState): AgentSessionState {
  const retainedThreadIds = new Set<ThreadId>([
    ...Object.values(state.threadLifecycle.collections).flatMap(
      (collection) => collection.ids,
    ),
  ]);
  if (state.threadLifecycle.activeThreadId) {
    retainedThreadIds.add(state.threadLifecycle.activeThreadId);
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
    if (thread.activity === "running" || thread.activity === "waitingForInput") {
      threads[threadId] = thread;
      retainedThreadIds.add(threadId);
      continue;
    }
    changed = true;
  }
  if (!changed) return state;
  return {
    ...state,
    threadLifecycle: threadLifecycleStore.removeThreadIds(
      state.threadLifecycle,
      retainedThreadIds,
    ),
    threads,
  };
}
