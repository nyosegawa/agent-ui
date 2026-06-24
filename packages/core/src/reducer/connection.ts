import type { ConnectionEvent } from "../events";
import type { AgentSessionState, ServerRequestQueueState, ThreadId } from "../state";
import { connectionStore } from "../stores/connection";
import { diagnosticsStore } from "../stores/diagnostics";
import { serverRequestStore } from "../stores/server-request";
import { threadEntityStore } from "../stores/thread-entity";
import { runtimeWithPendingRequests } from "../stores/thread-runtime";
import { commitThreadEntity } from "./thread-commit";

export function reduceConnectionEvent(
  state: AgentSessionState,
  event: ConnectionEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
    case "connection/connected":
      return { ...state, connection: connectionStore.reduce(state.connection, event) };
    case "connection/closed": {
      const pendingThreadIds = threadIdsWithPendingRequests(state.serverRequestQueue);
      return recoverPendingRequestThreads({
        ...state,
        connection: connectionStore.reduce(state.connection, event),
        serverRequestQueue: serverRequestStore.createInitialQueueState(),
      }, pendingThreadIds);
    }
    case "connection/error": {
      const pendingThreadIds = threadIdsWithPendingRequests(state.serverRequestQueue);
      return recoverPendingRequestThreads({
        ...state,
        connection: connectionStore.reduce(state.connection, event),
        diagnostics: diagnosticsStore.addError(state.diagnostics, event.error),
        serverRequestQueue: serverRequestStore.createInitialQueueState(),
      }, pendingThreadIds);
    }
    default:
      return assertNever(event);
  }
}

function threadIdsWithPendingRequests(queue: ServerRequestQueueState): ThreadId[] {
  const threadIds = new Set<ThreadId>();
  for (const request of Object.values(queue.byId)) {
    if (request.threadId) threadIds.add(request.threadId);
  }
  return [...threadIds];
}

function recoverPendingRequestThreads(
  state: AgentSessionState,
  threadIds: readonly ThreadId[],
): AgentSessionState {
  let nextState = state;
  for (const threadId of threadIds) {
    const thread = nextState.threads[threadId];
    if (!thread) continue;
    nextState = commitThreadEntity(nextState, {
      ...thread,
      runtime: runtimeWithPendingRequests(thread.runtime, [], thread.status),
    });
  }
  return threadEntityStore.pruneSnapshots(nextState);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled connection event: ${JSON.stringify(value)}`);
}
