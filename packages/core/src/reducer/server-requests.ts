import type { ServerRequestEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY, boundedAppend } from "../retention";
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
          pendingServerRequests: {
            ...state.pendingServerRequests,
            [String(event.request.id)]: event.request,
          },
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
      const request = state.pendingServerRequests[requestId];
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[requestId];
      const nextState = {
        ...state,
        pendingServerRequests,
        serverRequestQueue: serverRequestStore.dequeue(
          state.serverRequestQueue,
          requestId,
        ),
      };
      if (
        !request?.threadId ||
        serverRequestStore.hasPendingThreadRequest(
          pendingServerRequests,
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
      const request = state.pendingServerRequests[requestId];
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[requestId];
      const nextState = {
        ...state,
        errors: event.error
          ? boundedAppend(state.errors, event.error, AGENT_RETENTION_POLICY.diagnosticsErrorsMax)
          : state.errors,
        diagnostics: event.error
          ? diagnosticsStore.addError(state.diagnostics, event.error)
          : state.diagnostics,
        pendingServerRequests,
        serverRequestQueue: serverRequestStore.dequeue(
          state.serverRequestQueue,
          requestId,
        ),
      };
      if (
        !request?.threadId ||
        serverRequestStore.hasPendingThreadRequest(
          pendingServerRequests,
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
