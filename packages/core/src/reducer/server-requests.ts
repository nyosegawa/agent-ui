import type { ServerRequestEvent } from "../events";
import type { AgentSessionState, PendingServerRequest } from "../state";
import { requestIdKey } from "../request-id-key";
import { diagnosticsStore } from "../stores/diagnostics";
import { serverRequestStore } from "../stores/server-request";
import { threadEntityStore } from "../stores/thread-entity";
import { runtimeWithServerRequestOverlay } from "../stores/thread-runtime";
import { canonicalThreadId } from "../thread-alias";
import { commitThreadEntity } from "./thread-commit";

export function reduceServerRequestEvent(
  state: AgentSessionState,
  event: ServerRequestEvent,
): AgentSessionState {
  switch (event.type) {
    case "serverRequest/created": {
      if (event.request.kind === "dynamicTool") return state;
      const request = canonicalizeServerRequest(state, event.request);
      if (hasConflictingServerRequest(state, request)) {
        return {
          ...state,
          diagnostics: diagnosticsStore.addWarning(state.diagnostics, {
            audience: ["developer", "audit"],
            id: `server-request-duplicate:${requestIdKey(request.id)}`,
            message: `Ignored duplicate server request ${String(request.id)} for a different thread.`,
            raw: request,
          }),
        };
      }
      return updateThreadRequestRuntime({
        ...state,
        serverRequestQueue: serverRequestStore.enqueue(
          state.serverRequestQueue,
          request,
        ),
      }, request.threadId);
    }
    case "serverRequest/resolved": {
      const request = state.serverRequestQueue.byId[requestIdKey(event.requestId)];
      const serverRequestQueue = serverRequestStore.dequeue(
        state.serverRequestQueue,
        event.requestId,
      );
      const nextState = {
        ...state,
        serverRequestQueue,
      };
      return updateThreadRequestRuntime(nextState, request?.threadId);
    }
    case "serverRequest/rejected": {
      const request = state.serverRequestQueue.byId[requestIdKey(event.requestId)];
      const serverRequestQueue = serverRequestStore.dequeue(
        state.serverRequestQueue,
        event.requestId,
      );
      const nextState = {
        ...state,
        diagnostics: event.error
          ? diagnosticsStore.addError(state.diagnostics, event.error)
          : state.diagnostics,
        serverRequestQueue,
      };
      return updateThreadRequestRuntime(nextState, request?.threadId);
    }
    default:
      return assertNever(event);
  }
}

function updateThreadRequestRuntime(
  state: AgentSessionState,
  threadId: string | undefined,
): AgentSessionState {
  if (!threadId) return threadEntityStore.pruneSnapshots(state);
  const thread = state.threads[threadId];
  if (!thread) return threadEntityStore.pruneSnapshots(state);
  return threadEntityStore.pruneSnapshots(
    commitThreadEntity(state, {
      ...thread,
      runtime: runtimeWithServerRequestOverlay(state, thread, thread.status),
    }),
  );
}

function hasConflictingServerRequest(
  state: AgentSessionState,
  request: PendingServerRequest,
): boolean {
  const existing = state.serverRequestQueue.byId[requestIdKey(request.id)];
  return Boolean(
    existing &&
      existing.threadId &&
      request.threadId &&
      existing.threadId !== request.threadId,
  );
}

function canonicalizeServerRequest(
  state: AgentSessionState,
  request: PendingServerRequest,
): PendingServerRequest {
  return request.threadId
    ? { ...request, threadId: canonicalThreadId(state, request.threadId) }
    : request;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled server request event: ${JSON.stringify(value)}`);
}
