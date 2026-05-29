import type {
  AgentError,
  AgentEvent,
  AgentTransport,
  AgentTransportEvent,
  RequestId,
} from "@nyosegawa/agent-ui-core";

export interface CodexSdkLikeClient {
  readonly events?: AsyncIterable<AgentTransportEvent | AgentEvent | unknown>;
  close?: () => Promise<void> | void;
  connect?: () => Promise<void> | void;
  notify?: (method: string, params?: unknown) => void;
  reject?: (requestId: RequestId, error: AgentError) => Promise<void> | void;
  request: <TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ) => Promise<TResult> | TResult;
  respond?: (requestId: RequestId, result: unknown) => Promise<void> | void;
}

export function createCodexSdkTransportAdapter(client: CodexSdkLikeClient): AgentTransport {
  return new CodexSdkTransportAdapter(client);
}

class CodexSdkTransportAdapter implements AgentTransport {
  #closed = false;
  #ended = false;
  #events: AgentTransportEvent[] = [];
  #pumpStarted = false;
  #waiters: Array<(value: IteratorResult<AgentTransportEvent>) => void> = [];

  constructor(private readonly client: CodexSdkLikeClient) {}

  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => this.#nextEvent(),
      }),
    };
  }

  async connect(): Promise<void> {
    await this.client.connect?.();
    this.#push({ event: { type: "connection/connected" }, type: "event" });
    this.#startPump();
  }

  async close(): Promise<void> {
    this.#closed = true;
    await this.client.close?.();
    this.#finish({ event: { type: "connection/closed" }, type: "event" });
  }

  notify(method: string, params?: unknown): void {
    this.client.notify?.(method, params);
  }

  async reject(requestId: RequestId, error: AgentError): Promise<void> {
    if (!this.client.reject) throw new Error("Codex SDK client does not support reject()");
    await this.client.reject(requestId, error);
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    return this.client.request<TParams, TResult>(method, params);
  }

  async respond(requestId: RequestId, result: unknown): Promise<void> {
    if (!this.client.respond) throw new Error("Codex SDK client does not support respond()");
    await this.client.respond(requestId, result);
  }

  #startPump() {
    if (this.#pumpStarted || !this.client.events) return;
    this.#pumpStarted = true;
    void (async () => {
      try {
        for await (const event of this.client.events!) {
          if (this.#closed) return;
          this.#push(normalizeSdkEvent(event));
        }
      } catch (caught) {
        if (this.#closed || this.#ended) return;
        this.#push({
          error: caught instanceof Error ? { message: caught.message } : { message: String(caught) },
          type: "error",
        });
      }
    })();
  }

  #nextEvent(): Promise<IteratorResult<AgentTransportEvent>> {
    const event = this.#events.shift();
    if (event) return Promise.resolve({ done: false, value: event });
    if (this.#ended) return Promise.resolve({ done: true, value: undefined });
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  #push(event: AgentTransportEvent) {
    if (this.#ended) return;
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ done: false, value: event });
      return;
    }
    this.#events.push(event);
  }

  #finish(event: AgentTransportEvent) {
    if (this.#ended) return;
    this.#push(event);
    this.#ended = true;
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ done: true, value: undefined });
    }
  }
}

function normalizeSdkEvent(event: AgentTransportEvent | AgentEvent | unknown): AgentTransportEvent {
  if (isTransportEvent(event)) return event;
  if (isAgentEvent(event)) return { event, type: "event" };
  return { payload: event, type: "raw" };
}

function isTransportEvent(event: unknown): event is AgentTransportEvent {
  return (
    typeof event === "object" &&
    event != null &&
    "type" in event &&
    ["event", "request", "response", "error", "stderr", "raw"].includes(String((event as { type?: unknown }).type))
  );
}

function isAgentEvent(event: unknown): event is AgentEvent {
  return typeof event === "object" && event != null && "type" in event;
}
