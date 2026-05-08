import type { AgentTransportEvent } from "./events";
import type { AgentError, RequestId } from "./state";
import type { AgentTransport } from "./transport";

export interface FakeTransportRequest {
  id: RequestId;
  method: string;
  params?: unknown;
}

export class FakeAgentTransport implements AgentTransport {
  readonly requests: FakeTransportRequest[] = [];
  readonly notifications: Array<{ method: string; params?: unknown }> = [];
  readonly responses = new Map<string, unknown>();
  readonly rejections = new Map<string, AgentError>();

  #connected = false;
  #events: AgentTransportEvent[] = [];
  #waiters: Array<(value: IteratorResult<AgentTransportEvent>) => void> = [];
  #nextId = 0;

  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => this.#nextEvent(),
      }),
    };
  }

  async connect(): Promise<void> {
    this.#connected = true;
    this.push({ event: { type: "connection/connected" }, type: "event" });
  }

  async close(): Promise<void> {
    this.#connected = false;
    this.push({ event: { type: "connection/closed" }, type: "event" });
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    if (!this.#connected) {
      throw new Error("FakeAgentTransport is not connected");
    }
    const id = this.#nextId++;
    this.requests.push({ id, method, params });
    return {} as TResult;
  }

  notify(method: string, params?: unknown): void {
    this.notifications.push({ method, params });
  }

  async respond(requestId: RequestId, result: unknown): Promise<void> {
    this.responses.set(String(requestId), result);
    this.push({ requestId, type: "response", payload: result });
  }

  async reject(requestId: RequestId, error: AgentError): Promise<void> {
    this.rejections.set(String(requestId), error);
    this.push({ error, requestId, type: "error" });
  }

  push(event: AgentTransportEvent): void {
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
