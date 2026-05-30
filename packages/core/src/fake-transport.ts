import type { AgentTransportEvent } from "./events";
import { requestIdKey } from "./request-id-key";
import type { AgentError, RequestId } from "./state";
import type { AgentRequestOptions, AgentTransport } from "./transport";

export interface FakeTransportRequest {
  id: RequestId;
  method: string;
  options?: AgentRequestOptions;
  params?: unknown;
}

export interface FakeAgentTransportOptions {
  onRequest?: (request: FakeTransportRequest, transport: FakeAgentTransport) => unknown;
}

export class FakeAgentTransport implements AgentTransport {
  readonly requests: FakeTransportRequest[] = [];
  readonly notifications: Array<{ method: string; params?: unknown }> = [];
  readonly responses = new Map<string, unknown>();
  readonly rejections = new Map<string, AgentError>();

  #closed = true;
  #connected = false;
  #events: AgentTransportEvent[] = [];
  #generation = 0;
  #waiters: Array<{
    generation: number;
    resolve: (value: IteratorResult<AgentTransportEvent>) => void;
  }> = [];
  #nextId = 0;
  #options: FakeAgentTransportOptions;

  constructor(options: FakeAgentTransportOptions = {}) {
    this.#options = options;
  }

  get events(): AsyncIterable<AgentTransportEvent> {
    const generation = this.#generation;
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => this.#nextEvent(generation),
      }),
    };
  }

  async connect(): Promise<void> {
    this.#generation += 1;
    this.#releaseStaleWaiters();
    this.#events = [];
    this.#closed = false;
    this.#connected = true;
    this.push({ event: { type: "connection/connected" }, type: "event" });
  }

  async close(): Promise<void> {
    this.#connected = false;
    this.#closed = true;
    this.#finishCurrentGeneration({ event: { type: "connection/closed" }, type: "event" });
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
    options?: AgentRequestOptions,
  ): Promise<TResult> {
    if (!this.#connected) {
      throw new Error("FakeAgentTransport is not connected");
    }
    const id = this.#nextId++;
    const request = { id, method, options, params };
    this.requests.push(request);
    return (this.#options.onRequest?.(request, this) ?? {}) as TResult;
  }

  notify(method: string, params?: unknown): void {
    this.notifications.push({ method, params });
  }

  async respond(requestId: RequestId, result: unknown): Promise<void> {
    this.responses.set(requestIdKey(requestId), result);
    this.push({ requestId, type: "response", payload: result });
  }

  async reject(requestId: RequestId, error: AgentError): Promise<void> {
    this.rejections.set(requestIdKey(requestId), error);
    this.push({ error, requestId, type: "error" });
  }

  push(event: AgentTransportEvent): void {
    const waiterIndex = this.#waiters.findIndex(
      (candidate) => candidate.generation === this.#generation,
    );
    const waiter = waiterIndex >= 0 ? this.#waiters.splice(waiterIndex, 1)[0] : undefined;
    if (waiter) {
      waiter.resolve({ done: false, value: event });
      return;
    }
    this.#events.push(event);
  }

  #nextEvent(generation: number): Promise<IteratorResult<AgentTransportEvent>> {
    if (generation !== this.#generation) return Promise.resolve({ done: true, value: undefined });
    const event = this.#events.shift();
    if (event) return Promise.resolve({ done: false, value: event });
    if (this.#closed) return Promise.resolve({ done: true, value: undefined });
    return new Promise((resolve) => this.#waiters.push({ generation, resolve }));
  }

  #releaseStaleWaiters(): void {
    const stale = this.#waiters.filter((waiter) => waiter.generation !== this.#generation);
    this.#waiters = this.#waiters.filter((waiter) => waiter.generation === this.#generation);
    for (const waiter of stale) waiter.resolve({ done: true, value: undefined });
  }

  #finishCurrentGeneration(closingEvent: AgentTransportEvent): void {
    const current = this.#waiters.filter((waiter) => waiter.generation === this.#generation);
    this.#waiters = this.#waiters.filter((waiter) => waiter.generation !== this.#generation);
    if (current.length === 0) {
      this.#events.push(closingEvent);
      return;
    }
    const [first, ...rest] = current;
    first?.resolve({ done: false, value: closingEvent });
    for (const waiter of rest) waiter.resolve({ done: true, value: undefined });
  }
}
