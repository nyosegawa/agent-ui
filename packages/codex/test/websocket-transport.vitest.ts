import { describe, expect, it } from "vitest";
import {
  createAgentUiBearerSubprotocol,
  createCodexWebSocketTransport,
} from "../src/websocket-transport";

describe("CodexWebSocketTransport", () => {
  it("builds a bearer WebSocket subprotocol and forwards it to the socket", async () => {
    const protocol = createAgentUiBearerSubprotocol("token:with/slash+unicode-雪");
    expect(protocol).toMatch(/^agent-ui-bearer\.[A-Za-z0-9_-]+$/);
    expect(protocol).not.toContain("token:with");

    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      protocols: [protocol],
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    expect(sockets[0]?.protocols).toEqual([protocol]);
    await transport.close();
  });

  it("rejects empty bearer subprotocol tokens", () => {
    expect(() => createAgentUiBearerSubprotocol("")).toThrow("token is required");
  });

  it("reconnects when explicitly configured", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      initialize: {
        capabilities: {
          experimentalApi: false,
          requestAttestation: false,
        },
        clientInfo: { name: "test", title: null, version: "0.0.0" },
      },
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

  it("sends initialize params in the generated stable shape", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      initialize: {
        capabilities: {
          experimentalApi: false,
          optOutNotificationMethods: ["thread/started"],
          requestAttestation: true,
        },
        clientInfo: { name: "test", title: null, version: "0.0.0" },
      },
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    expect(JSON.parse(sockets[0]!.sent[0] ?? "{}")).toEqual({
      id: 0,
      method: "initialize",
      params: {
        capabilities: {
          experimentalApi: false,
          optOutNotificationMethods: ["thread/started"],
          requestAttestation: true,
        },
        clientInfo: { name: "test", title: null, version: "0.0.0" },
      },
    });
    expect(JSON.parse(sockets[0]!.sent[1] ?? "{}")).toEqual({ method: "initialized" });
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

  it("drains the close event and finishes iterators when reconnect is disabled", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    const iterator = transport.events[Symbol.asyncIterator]();
    await transport.connect();
    await waitForEvent(iterator, "connection/connected");

    const waiting = iterator.next();
    sockets[0]!.emitClose("network");

    await expect(waiting).resolves.toMatchObject({
      done: false,
      value: { event: { reason: "network", type: "connection/closed" } },
    });
    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined });
  });

  it("preserves JSON-RPC error code and data", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    const request = transport.request("thread/read", { threadId: "thread-1" });
    const parsed = JSON.parse(sockets[0]!.sent.at(-1) ?? "{}") as { id: number };
    sockets[0]!.emitMessage({
      error: {
        code: -32042,
        data: { retryAfterMs: 250, threadId: "thread-1" },
        message: "busy",
      },
      id: parsed.id,
    });

    await expect(request).rejects.toMatchObject({
      code: -32042,
      data: { retryAfterMs: 250, threadId: "thread-1" },
      message: "busy",
    });
  });

  it("does not resolve numeric requests from string response ids", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    const request = transport.request("thread/read", { threadId: "thread-1" });
    sockets[0]!.emitMessage({ id: "0", result: { wrong: true } });
    await expect(notSettled(request)).resolves.toBe("pending");
    sockets[0]!.emitMessage({ id: 0, result: { ok: true } });

    await expect(request).resolves.toEqual({ ok: true });
  });

  it("retries safe reads but not mutating requests on -32001", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    const read = transport.request("thread/read", { threadId: "thread-1" });
    sockets[0]!.emitMessage({
      error: { code: -32001, message: "busy" },
      id: 0,
    });
    await waitFor(() => sockets[0]!.sent.length === 2);
    sockets[0]!.emitMessage({ id: 1, result: { thread: { id: "thread-1" } } });
    await expect(read).resolves.toEqual({ thread: { id: "thread-1" } });

    const mutation = transport.request("turn/start", { threadId: "thread-1" });
    sockets[0]!.emitMessage({
      error: { code: -32001, message: "busy" },
      id: 2,
    });
    await expect(mutation).rejects.toMatchObject({ code: -32001 });
    expect(sockets[0]!.sent).toHaveLength(3);
  });

  it("preserves top-level trace and cleans up aborted, timed-out, and closed pending requests", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    await transport.connect();

    const traced = transport.request("thread/read", { threadId: "thread-1" }, { trace: { span: "ws" } });
    const tracedMessage = JSON.parse(sockets[0]!.sent.at(-1) ?? "{}") as { id: number };
    expect(tracedMessage).toMatchObject({
      method: "thread/read",
      trace: { span: "ws" },
    });
    sockets[0]!.emitMessage({ id: tracedMessage.id, result: { ok: true } });
    await expect(traced).resolves.toEqual({ ok: true });

    const controller = new AbortController();
    const aborted = transport.request("thread/list", {}, { signal: controller.signal });
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ name: "AbortError" });

    const timedOut = transport.request("thread/list", {}, { timeoutMs: 1 });
    await expect(timedOut).rejects.toMatchObject({ name: "TimeoutError" });

    const closed = transport.request("thread/list", {});
    await transport.close();
    await expect(closed).rejects.toThrow("closed");
  });

  it("emits raw JSON-RPC server requests as request events", async () => {
    const sockets: FakeWebSocket[] = [];
    const transport = createCodexWebSocketTransport({
      reconnect: false,
      url: "ws://localhost/agent-ui",
      webSocketImpl: fakeWebSocketFactory(sockets) as any,
    });
    const iterator = transport.events[Symbol.asyncIterator]();
    await transport.connect();

    sockets[0]!.emitMessage({
      id: "mcp-approval-1",
      method: "mcpServer/elicitation/request",
      params: {
        _meta: { codex_approval_kind: "mcp_tool_call" },
        mode: "form",
        threadId: "thread-1",
        turnId: "turn-1",
      },
    });

    await waitForEvent(iterator, "serverRequest/created");
    const requestEvent = await waitForTransportEvent(iterator, "request");
    expect(requestEvent).toMatchObject({
      request: {
        id: "mcp-approval-1",
        kind: "mcpElicitation",
        payload: {
          threadId: "thread-1",
        },
      },
      requestId: "mcp-approval-1",
      type: "request",
    });
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

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let index = 0; index < 250; index += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error("timed out waiting for condition");
}

async function waitForTransportEvent(
  iterator: AsyncIterator<any>,
  type: string,
): Promise<any> {
  for (let index = 0; index < 10; index += 1) {
    const next = await iterator.next();
    if (next.value?.type === type) return next.value;
  }
  throw new Error(`Timed out waiting for transport event ${type}`);
}

function fakeWebSocketFactory(sockets: FakeWebSocket[]) {
  return class extends FakeWebSocket {
    constructor(url: URL, protocols?: string | string[]) {
      super(url, protocols);
      sockets.push(this);
    }
  };
}

async function notSettled(promise: Promise<unknown>): Promise<"pending" | "settled"> {
  return Promise.race([
    promise.then(
      () => "settled" as const,
      () => "settled" as const,
    ),
    new Promise<"pending">((resolve) => setTimeout(() => resolve("pending"), 5)),
  ]);
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

  emitMessage(message: unknown): void {
    this.#emit("message", { data: JSON.stringify(message) });
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
