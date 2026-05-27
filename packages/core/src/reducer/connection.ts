import type { ConnectionEvent } from "../events";
import type { AgentSessionState } from "../state";
import { connectionStore } from "../stores/connection";
import { serverRequestStore } from "../stores/server-request";

export function reduceConnectionEvent(
  state: AgentSessionState,
  event: ConnectionEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
    case "connection/connected":
      return { ...state, connection: connectionStore.reduce(state.connection, event) };
    case "connection/closed":
      return {
        ...state,
        connection: connectionStore.reduce(state.connection, event),
        pendingServerRequests: serverRequestStore.createInitialPendingState(),
        serverRequestQueue: serverRequestStore.createInitialQueueState(),
      };
    case "connection/error":
      return {
        ...state,
        connection: connectionStore.reduce(state.connection, event),
        errors: [...state.errors, event.error],
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled connection event: ${JSON.stringify(value)}`);
}
