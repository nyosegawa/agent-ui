import type { ServerRequestEvent } from "../events";
import type { AgentSessionState, PendingServerRequest, ThreadId } from "../state";
import { requestIdKey } from "../request-id-key";
import { diagnosticsStore } from "../stores/diagnostics";
import { serverRequestStore } from "../stores/server-request";
import { threadEntityStore } from "../stores/thread-entity";

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
      return threadEntityStore.pruneSnapshots(
        threadEntityStore.setStatus(
          {
            ...state,
            serverRequestQueue: serverRequestStore.enqueue(
              state.serverRequestQueue,
              request,
            ),
          },
          request.threadId ?? "",
          "waitingForInput",
        ),
      );
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
        threadEntityStore.setStatus(
          nextState,
          request.threadId,
          "running",
          { onlyIf: "waitingForInput" },
        ),
      );
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
        threadEntityStore.setStatus(
          nextState,
          request.threadId,
          "running",
          { onlyIf: "waitingForInput" },
        ),
      );
    }
    default:
      return assertNever(event);
  }
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

function canonicalThreadId(state: AgentSessionState, threadId: ThreadId): ThreadId {
  let current = threadId;
  const seen = new Set<ThreadId>();
  while (state.threadLifecycle.aliasById[current] && !seen.has(current)) {
    seen.add(current);
    current = state.threadLifecycle.aliasById[current]!;
  }
  return current;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled server request event: ${JSON.stringify(value)}`);
}
