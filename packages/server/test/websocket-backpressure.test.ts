import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WEBSOCKET_MAX_BUFFERED_BYTES,
  createWebSocketBackpressureGuard,
  sendJsonWithBackpressure,
} from "../src/websocket-backpressure";

describe("WebSocket backpressure guard", () => {
  it("uses a bounded default buffer limit", () => {
    expect(createWebSocketBackpressureGuard().maxBufferedBytes).toBe(
      DEFAULT_WEBSOCKET_MAX_BUFFERED_BYTES,
    );
  });

  it("sends while the socket buffer plus payload is below the configured limit", () => {
    const socket = {
      bufferedAmount: 4,
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
    };

    expect(
      sendJsonWithBackpressure(
        socket,
        createWebSocketBackpressureGuard({ maxBufferedBytes: 16 }),
        { ok: true },
      ),
    ).toBe(true);
    expect(socket.send).toHaveBeenCalledWith('{"ok":true}');
    expect(socket.close).not.toHaveBeenCalled();
  });

  it("closes slow consumers before sending a payload that would exceed the limit", () => {
    const socket = {
      bufferedAmount: 4,
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
    };

    expect(
      sendJsonWithBackpressure(
        socket,
        createWebSocketBackpressureGuard({ maxBufferedBytes: 8 }),
        { ok: true },
      ),
    ).toBe(false);
    expect(socket.send).not.toHaveBeenCalled();
    expect(socket.close).toHaveBeenCalledWith(
      1013,
      "Agent UI bridge backpressure limit exceeded",
    );
  });

  it("closes when a single payload is larger than the limit", () => {
    const socket = {
      bufferedAmount: 0,
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
    };

    expect(
      sendJsonWithBackpressure(
        socket,
        createWebSocketBackpressureGuard({ maxBufferedBytes: 8 }),
        { message: "large" },
      ),
    ).toBe(false);
    expect(socket.send).not.toHaveBeenCalled();
    expect(socket.close).toHaveBeenCalledWith(
      1013,
      "Agent UI bridge backpressure limit exceeded",
    );
  });

  it("allows the exact buffer boundary", () => {
    const socket = {
      bufferedAmount: 1,
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
    };

    expect(
      sendJsonWithBackpressure(
        socket,
        createWebSocketBackpressureGuard({ maxBufferedBytes: 12 }),
        { ok: true },
      ),
    ).toBe(true);
    expect(socket.send).toHaveBeenCalledWith('{"ok":true}');
    expect(socket.close).not.toHaveBeenCalled();
  });

  it("can be disabled for host-owned experiments", () => {
    const socket = {
      bufferedAmount: Number.MAX_SAFE_INTEGER,
      close: vi.fn(),
      readyState: 1,
      send: vi.fn(),
    };

    expect(
      sendJsonWithBackpressure(
        socket,
        createWebSocketBackpressureGuard({ maxBufferedBytes: false }),
        { ok: true },
      ),
    ).toBe(true);
    expect(socket.send).toHaveBeenCalled();
  });
});
