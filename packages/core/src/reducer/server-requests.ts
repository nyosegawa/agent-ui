import type { ServerRequestEvent } from "../events";
import type { AgentSessionState } from "../state";
import { AGENT_RETENTION_POLICY, boundedAppend } from "../retention";
import {
  dequeueServerRequest,
  enqueueServerRequest,
  hasPendingThreadRequest,
  pruneThreadSnapshots,
  updateThread,
} from "./shared";

export function reduceServerRequestEvent(
  state: AgentSessionState,
  event: ServerRequestEvent,
): AgentSessionState {
  switch (event.type) {
    case "serverRequest/created":
      return updateThread(
        {
          ...state,
          pendingServerRequests: {
            ...state.pendingServerRequests,
            [String(event.request.id)]: event.request,
          },
          serverRequestQueue: enqueueServerRequest(
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
        serverRequestQueue: dequeueServerRequest(state.serverRequestQueue, requestId),
      };
      if (
        !request?.threadId ||
        hasPendingThreadRequest(pendingServerRequests, request.threadId)
      ) {
        return pruneThreadSnapshots(nextState);
      }
      return pruneThreadSnapshots(updateThread(nextState, request.threadId, (thread) =>
        thread.status === "waitingForInput" ? { ...thread, status: "running" } : thread,
      ));
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
          ? {
              ...state.diagnostics,
              errors: boundedAppend(
                state.diagnostics.errors,
                event.error,
                AGENT_RETENTION_POLICY.diagnosticsErrorsMax,
              ),
            }
          : state.diagnostics,
        pendingServerRequests,
        serverRequestQueue: dequeueServerRequest(state.serverRequestQueue, requestId),
      };
      if (
        !request?.threadId ||
        hasPendingThreadRequest(pendingServerRequests, request.threadId)
      ) {
        return pruneThreadSnapshots(nextState);
      }
      return pruneThreadSnapshots(updateThread(nextState, request.threadId, (thread) =>
        thread.status === "waitingForInput" ? { ...thread, status: "running" } : thread,
      ));
    }
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled server request event: ${JSON.stringify(value)}`);
}
