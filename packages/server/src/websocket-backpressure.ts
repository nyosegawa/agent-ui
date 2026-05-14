import type { WebSocket } from "ws";

export interface WebSocketBackpressureOptions {
  maxBufferedBytes?: number | false;
}

export interface WebSocketBackpressureGuard {
  maxBufferedBytes: number | false;
}

export const DEFAULT_WEBSOCKET_MAX_BUFFERED_BYTES = 16 * 1024 * 1024;

export function createWebSocketBackpressureGuard(
  options: WebSocketBackpressureOptions = {},
): WebSocketBackpressureGuard {
  return {
    maxBufferedBytes:
      options.maxBufferedBytes === undefined
        ? DEFAULT_WEBSOCKET_MAX_BUFFERED_BYTES
        : options.maxBufferedBytes,
  };
}

export function sendJsonWithBackpressure(
  socket: Pick<WebSocket, "bufferedAmount" | "close" | "readyState" | "send">,
  guard: WebSocketBackpressureGuard,
  value: unknown,
): boolean {
  if (socket.readyState !== 1) return false;
  if (
    guard.maxBufferedBytes !== false &&
    socket.bufferedAmount > guard.maxBufferedBytes
  ) {
    socket.close(1013, "Agent UI bridge backpressure limit exceeded");
    return false;
  }
  socket.send(JSON.stringify(value));
  return true;
}
