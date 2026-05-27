import type { ConnectionEvent } from "../events";
import type { AgentSessionState } from "../state";

export function reduceConnectionEvent(
  state: AgentSessionState,
  event: ConnectionEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
      return { ...state, connection: { status: "connecting" } };
    case "connection/connected":
      return { ...state, connection: { status: "connected" } };
    case "connection/closed":
      return {
        ...state,
        connection: { status: "closed", reason: event.reason },
        pendingServerRequests: {},
        serverRequestQueue: { byId: {}, order: [] },
      };
    case "connection/error":
      return {
        ...state,
        connection: { status: "error", error: event.error },
        errors: [...state.errors, event.error],
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled connection event: ${JSON.stringify(value)}`);
}
