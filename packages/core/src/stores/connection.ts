import type { ConnectionEvent } from "../events";
import type { ConnectionState } from "../state";

export interface ConnectionStore {
  createInitialState(): ConnectionState;
  reduce(state: ConnectionState, event: ConnectionEvent): ConnectionState;
}

export const connectionStore: ConnectionStore = {
  createInitialState: createInitialConnectionState,
  reduce: reduceConnectionState,
};

export function createInitialConnectionState(): ConnectionState {
  return { status: "idle" };
}

export function reduceConnectionState(
  state: ConnectionState,
  event: ConnectionEvent,
): ConnectionState {
  switch (event.type) {
    case "connection/connecting":
      return { status: "connecting" };
    case "connection/connected":
      return { status: "connected" };
    case "connection/closed":
      return { status: "closed", reason: event.reason };
    case "connection/error":
      return { status: "error", error: event.error };
    default:
      return state;
  }
}
