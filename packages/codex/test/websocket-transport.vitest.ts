import { describe, expect, it } from "vitest";
import { createCodexWebSocketTransport } from "../src/websocket-transport";

describe("CodexWebSocketTransport", () => {
  it("reconnects when explicitly configured", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      initialize: { clientInfo: { name: "test", version: "0.0.0" } },
      reconnect: { initialDelayMs: 1, maxAttempts: 1 },
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    const iterator = transport.events[Symbol.asyncIterator]();

    await transport.connect();
    expect(sockets).toHaveLength(1);
    sockets[0]!.emitClose("network");

    await waitForEvent(iterator, "connection/closed");
    await waitForEvent(iterator, "connection/connecting");
    await waitForEvent(iterator, "connection/connected");

    expect(sockets).toHaveLength(2);
    expect(sockets[1]!.sent.some((message) => message.includes('"method":"initialize"'))).toBe(true);

    await transport.close();
  });

  it("rejects pending requests when the socket closes", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    const request = transport.request("thread/list", {});
    sockets[0]!.emitClose("network");

    await expect(request).rejects.toThrow("disconnected");
  });
});

async function waitForEvent(
  iterator: AsyncIterator<any>,
  type: string,
): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    const next = await iterator.next();
    if (next.value?.event?.type === type) return;
  }
  throw new Error(`Timed out waiting for ${type}`);
}

function fakeWebSocketFactory(sockets: FakeWebSocket[]) {
  return class extends FakeWebSocket {
    constructor(url: URL, protocols?: string | string[]) {
      super(url, protocols);
      sockets.push(this);
    }
  };
}

class FakeWebSocket {
  readonly sent: string[] = [];
  readyState = 0;
  #listeners = new Map<string, Array<(event: any) => void>>();

  constructor(
    readonly url: URL,
    readonly protocols?: string | string[],
  ) {
    queueMicrotask(() => {
      this.readyState = 1;
      this.#emit("open", {});
    });
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    this.#listeners.set(type, [...(this.#listeners.get(type) ?? []), listener]);
  }

  close(): void {
    this.emitClose("closed");
  }

  emitClose(reason: string): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.#emit("close", { reason });
  }

  send(message: string): void {
    this.sent.push(message);
    const parsed = JSON.parse(message);
    if (parsed.method === "initialize") {
      queueMicrotask(() => {
        this.#emit("message", { data: JSON.stringify({ id: parsed.id, result: {} }) });
      });
    }
  }

  #emit(type: string, event: any): void {
    for (const listener of this.#listeners.get(type) ?? []) listener(event);
  }
}
