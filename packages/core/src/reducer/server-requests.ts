import type { ServerRequestEvent } from "../events";
import type { AgentSessionState } from "../state";
import { diagnosticsStore } from "../stores/diagnostics";
import { serverRequestStore } from "../stores/server-request";
import { threadEntityStore } from "../stores/thread-entity";

export function reduceServerRequestEvent(
  state: AgentSessionState,
  event: ServerRequestEvent,
): AgentSessionState {
  switch (event.type) {
    case "serverRequest/created":
      return threadEntityStore.update(
        {
          ...state,
          serverRequestQueue: serverRequestStore.enqueue(
            state.serverRequestQueue,
            event.request,
          ),
        },
        event.request.threadId ?? "",
        (thread) => ({ ...thread, status: "waitingForInput" }),
      );
    case "serverRequest/resolved": {
      const requestId = String(event.requestId);
      const request = state.serverRequestQueue.byId[requestId];
      const serverRequestQueue = serverRequestStore.dequeue(
        state.serverRequestQueue,
        requestId,
      );
      const nextState = {
        ...state,
        serverRequestQueue,
      };
      if (
        !request?.threadId ||
        serverRequestStore.hasPendingThreadRequest(
          serverRequestQueue.byId,
          request.threadId,
        )
      ) {
        return threadEntityStore.pruneSnapshots(nextState);
      }
      return threadEntityStore.pruneSnapshots(
        threadEntityStore.update(nextState, request.threadId, (thread) =>
          thread.status === "waitingForInput"
            ? { ...thread, status: "running" }
            : thread,
        ),
      );
    }
    case "serverRequest/rejected": {
      const requestId = String(event.requestId);
      const request = state.serverRequestQueue.byId[requestId];
      const serverRequestQueue = serverRequestStore.dequeue(
        state.serverRequestQueue,
        requestId,
      );
      const nextState = {
        ...state,
        diagnostics: event.error
          ? diagnosticsStore.addError(state.diagnostics, event.error)
          : state.diagnostics,
        serverRequestQueue,
      };
      if (
        !request?.threadId ||
        serverRequestStore.hasPendingThreadRequest(
          serverRequestQueue.byId,
          request.threadId,
        )
      ) {
        return threadEntityStore.pruneSnapshots(nextState);
      }
      return threadEntityStore.pruneSnapshots(
        threadEntityStore.update(nextState, request.threadId, (thread) =>
          thread.status === "waitingForInput"
            ? { ...thread, status: "running" }
            : thread,
        ),
      );
    }
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled server request event: ${JSON.stringify(value)}`);
}
