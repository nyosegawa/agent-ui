import type { ServerRequestEvent } from "../events";
import type { AgentSessionState } from "../state";
import { requestIdKey } from "../request-id-key";
import { diagnosticsStore } from "../stores/diagnostics";
import { serverRequestStore } from "../stores/server-request";
import { threadEntityStore } from "../stores/thread-entity";

export function reduceServerRequestEvent(
  state: AgentSessionState,
  event: ServerRequestEvent,
): AgentSessionState {
  switch (event.type) {
    case "serverRequest/created":
      if (event.request.kind === "dynamicTool") return state;
      if (hasConflictingServerRequest(state, event)) {
        return {
          ...state,
          diagnostics: diagnosticsStore.addWarning(state.diagnostics, {
            id: `server-request-duplicate:${requestIdKey(event.request.id)}`,
            message: `Ignored duplicate server request ${String(event.request.id)} for a different thread.`,
            raw: event.request,
          }),
        };
      }
      return threadEntityStore.pruneSnapshots(
        threadEntityStore.setStatus(
          {
            ...state,
            serverRequestQueue: serverRequestStore.enqueue(
              state.serverRequestQueue,
              event.request,
            ),
          },
          event.request.threadId ?? "",
          "waitingForInput",
        ),
      );
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
  event: Extract<ServerRequestEvent, { type: "serverRequest/created" }>,
): boolean {
  const existing = state.serverRequestQueue.byId[requestIdKey(event.request.id)];
  return Boolean(
    existing &&
      existing.threadId &&
      event.request.threadId &&
      existing.threadId !== event.request.threadId,
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled server request event: ${JSON.stringify(value)}`);
}
