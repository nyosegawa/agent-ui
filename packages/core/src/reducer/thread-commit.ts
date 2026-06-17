import type { AgentSessionState, ThreadId, ThreadState } from "../state";
import {
  threadActivityFromStatus,
  threadAvailabilityFromStatus,
  threadLifecycleStore,
  threadMetadataFromThread,
  threadStorageFromThread,
} from "../stores/thread-lifecycle";

export function commitThreadEntity(
  state: AgentSessionState,
  thread: ThreadState,
  options: {
    activeThreadId?: ThreadId;
    collectionKeys?: readonly string[];
    preserveOrder?: boolean;
  } = {},
): AgentSessionState {
  const activity = threadActivityFromStatus(thread.status);
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
        storage,
      },
    },
  };
}
