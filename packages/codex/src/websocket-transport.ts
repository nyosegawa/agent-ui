import type {
  AgentTransport,
  AgentTransportEvent,
  RequestId,
} from "@nyosegawa/agent-ui-core";
import {
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  parseJsonRpcLine,
  type JsonRpcMessage,
} from "./json-rpc";
import { normalizeCodexServerMessage } from "./normalizer";
import type { CodexInitializeOptions } from "./protocol";

export interface CodexWebSocketTransportOptions {
  initialize?: CodexInitializeOptions;
  protocols?: string | string[];
  reconnect?: false | CodexWebSocketReconnectOptions;
  url: string | URL;
  webSocketImpl?: typeof WebSocket;
}

export interface CodexWebSocketReconnectOptions {
  initialDelayMs?: number;
  maxAttempts?: number;
  maxDelayMs?: number;
  multiplier?: number;
}

export function createCodexWebSocketTransport(
  options: CodexWebSocketTransportOptions,
): AgentTransport {
  return new CodexWebSocketTransport(options);
}

class CodexWebSocketTransport implements AgentTransport {
  readonly #options: CodexWebSocketTransportOptions;
  readonly #pending = new Map<
    string,
    { reject: (error: Error) => void; resolve: (value: unknown) => void }
  >();
  #events: AgentTransportEvent[] = [];
  #waiters: Array<(value: IteratorResult<AgentTransportEvent>) => void> = [];
  #manualClose = false;
  #nextId = 0;
  #reconnectAttempts = 0;
  #reconnectTimer?: ReturnType<typeof setTimeout>;
  #socket?: WebSocket;

  constructor(options: CodexWebSocketTransportOptions) {
    this.#options = options;
  }

  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => this.#nextEvent(),
      }),
    };
  }

  async connect(): Promise<void> {
    this.#manualClose = false;
    this.#push({ event: { type: "connection/connecting" }, type: "event" });
    await this.#openSocket();
  }

  async close(): Promise<void> {
    this.#manualClose = true;
    if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
    this.#rejectPending(new Error("Codex websocket transport closed"));
    this.#socket?.close();
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    const id = this.#nextId++;
    this.#send(params === undefined ? { id, method } : { id, method, params });
    return new Promise<TResult>((resolve, reject) => {
      this.#pending.set(String(id), {
        reject,
        resolve: (value) => resolve(value as TResult),
      });
    });
  }

  notify(method: string, params?: unknown): void {
    this.#send(params === undefined ? { method } : { method, params });
  }

  async respond(requestId: RequestId, result: unknown): Promise<void> {
    this.#send({ id: requestId, result });
  }

  async reject(
    requestId: RequestId,
    error: { code?: number; message: string; data?: unknown },
  ): Promise<void> {
    this.#send({ error, id: requestId });
  }

  async #openSocket(): Promise<void> {
    const url = new URL(this.#options.url);
    const WebSocketImpl = this.#options.webSocketImpl ?? WebSocket;
    const socket = new WebSocketImpl(url, this.#options.protocols);
    this.#socket = socket;
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener(
        "error",
        () => reject(new Error("Codex websocket failed to open")),
        {
          once: true,
        },
      );
    });
    socket.addEventListener("message", (event) => {
      try {
        this.#handleMessage(parseJsonRpcLine(String(event.data)));
      } catch (error) {
        this.#push({
          error: { message: error instanceof Error ? error.message : String(error) },
          type: "error",
        });
      }
    });
    socket.addEventListener("close", (event) => {
      this.#rejectPending(new Error("Codex websocket transport disconnected"));
      this.#push({
        event: { reason: event.reason, type: "connection/closed" },
        type: "event",
      });
      this.#scheduleReconnect();
    });
    if (this.#options.initialize) {
      await this.request("initialize", {
        capabilities: {
          experimentalApi: this.#options.initialize.experimentalApi,
          optOutNotificationMethods: this.#options.initialize.optOutNotificationMethods,
        },
        clientInfo: this.#options.initialize.clientInfo,
      });
      this.notify("initialized");
    }
    this.#reconnectAttempts = 0;
    this.#push({ event: { type: "connection/connected" }, type: "event" });
  }

  #scheduleReconnect(): void {
    if (
      this.#manualClose ||
      this.#options.reconnect === false ||
      !this.#options.reconnect
    )
      return;
    const options = this.#options.reconnect;
    const maxAttempts = options.maxAttempts ?? 5;
    if (this.#reconnectAttempts >= maxAttempts) return;
    const initialDelayMs = options.initialDelayMs ?? 500;
    const maxDelayMs = options.maxDelayMs ?? 10_000;
    const multiplier = options.multiplier ?? 2;
    const delay = Math.min(
      maxDelayMs,
      Math.round(initialDelayMs * multiplier ** this.#reconnectAttempts),
    );
    this.#reconnectAttempts += 1;
    this.#reconnectTimer = setTimeout(() => {
      this.#push({ event: { type: "connection/connecting" }, type: "event" });
      void this.#openSocket().catch((error: unknown) => {
        this.#push({
          error: { message: error instanceof Error ? error.message : String(error) },
          type: "error",
        });
        this.#scheduleReconnect();
      });
    }, delay);
  }

  #rejectPending(error: Error): void {
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }

  #send(message: JsonRpcMessage): void {
    if (!this.#socket || this.#socket.readyState !== 1) {
      throw new Error("Codex websocket transport is not connected");
    }
    this.#socket.send(JSON.stringify(message));
  }

  #handleMessage(message: JsonRpcMessage): void {
    if (isTransportEventEnvelope(message)) {
      this.#push(envelopeEvent(message));
      return;
    }

    if (isJsonRpcResponse(message)) {
      const pending = this.#pending.get(String(message.id));
      if (!pending) return;
      this.#pending.delete(String(message.id));
      if ("error" in message) pending.reject(jsonRpcError(message.error));
      else pending.resolve(message.result);
      this.#push({ payload: message, requestId: message.id, type: "response" });
      return;
    }
    if (isJsonRpcRequest(message) || isJsonRpcNotification(message)) {
      const events = normalizeCodexServerMessage(message);
      for (const event of events) this.#push({ event, type: "event" });
      if (isJsonRpcRequest(message)) {
        this.#push({
          request: {
            id: message.id,
            kind:
              events[0]?.type === "serverRequest/created"
                ? events[0].request.kind
                : "unknown",
            payload: message.params,
          },
          requestId: message.id,
          type: "request",
        });
      }
      return;
    }
    this.#push({ payload: message, type: "raw" });
  }

  #push(event: AgentTransportEvent): void {
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ done: false, value: event });
      return;
    }
    this.#events.push(event);
  }

  #nextEvent(): Promise<IteratorResult<AgentTransportEvent>> {
    const event = this.#events.shift();
    if (event) return Promise.resolve({ done: false, value: event });
    return new Promise((resolve) => this.#waiters.push(resolve));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTransportEventEnvelope(
  value: unknown,
): value is { event: AgentTransportEvent; type: "agent-ui/transport-event" } {
  if (!isRecord(value) || value.type !== "agent-ui/transport-event") return false;
  return isRecord(value.event) && typeof value.event.type === "string";
}

function envelopeEvent(value: {
  event: AgentTransportEvent;
  type: "agent-ui/transport-event";
}): AgentTransportEvent {
  return value.event;
}

function jsonRpcError(error: { code?: number; message: string; data?: unknown }): Error {
  const next = new Error(error.message) as Error & { code?: number; data?: unknown };
  next.code = error.code;
  next.data = error.data;
  return next;
}
