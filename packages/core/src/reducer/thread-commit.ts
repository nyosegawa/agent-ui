import type { AgentSessionState, ThreadId, ThreadState } from "../state";
import {
  threadAvailabilityFromStatus,
  threadLifecycleStore,
  threadMetadataFromThread,
  threadStorageFromThread,
} from "../stores/thread-lifecycle";
import {
  threadActivityFromRuntime,
  threadRuntimeFromStatus,
} from "../stores/thread-runtime";

export function commitThreadEntity(
  state: AgentSessionState,
  thread: ThreadState,
  options: {
    activeThreadId?: ThreadId;
    collectionKeys?: readonly string[];
    preserveOrder?: boolean;
  } = {},
): AgentSessionState {
  const runtime = thread.runtime ?? threadRuntimeFromStatus(thread.status);
  const activity = threadActivityFromRuntime(runtime);
  const availability = threadAvailabilityFromStatus(thread.status);
  const metadata = {
    ...thread.metadata,
    ...threadMetadataFromThread(thread.thread),
  };
  const storage = threadStorageFromThread(thread.thread);
  return {
    ...state,
    threadLifecycle: threadLifecycleStore.upsertThread(
      state.threadLifecycle,
      {
        ...thread,
        activity,
        availability,
        metadata,
        runtime,
        storage,
      },
      options,
    ),
    threads: {
      ...state.threads,
      [thread.thread.id]: {
        ...thread,
        activity,
        availability,
        metadata,
        runtime,
        storage,
      },
    },
  };
}
