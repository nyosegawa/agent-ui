import type { ThreadId, TurnId } from "./state";
import type { AgentEvent, AgentTransportEvent } from "./events";
import type { AgentTransport } from "./transport";

export type OpenAIAgentsAdapterChunk = string | AgentEvent | AgentTransportEvent;

export interface OpenAIAgentsRunContext {
  input: unknown;
  params?: Record<string, unknown>;
  threadId: ThreadId;
  turnId: TurnId;
}

export interface OpenAIAgentsAdapterOptions {
  createItemId?: (context: OpenAIAgentsRunContext) => string;
  createThreadId?: () => ThreadId;
  createTurnId?: (threadId: ThreadId) => TurnId;
  run: (
    context: OpenAIAgentsRunContext,
  ) =>
    | AsyncIterable<OpenAIAgentsAdapterChunk>
    | Iterable<OpenAIAgentsAdapterChunk>
    | Promise<string | OpenAIAgentsAdapterChunk[]>
    | string
    | OpenAIAgentsAdapterChunk[];
}

export function createOpenAIAgentsSdkTransportAdapter(
  options: OpenAIAgentsAdapterOptions,
): AgentTransport {
  return new OpenAIAgentsSdkTransportAdapter(options);
}

class OpenAIAgentsSdkTransportAdapter implements AgentTransport {
  #connected = false;
  #events: AgentTransportEvent[] = [];
  #nextThread = 1;
  #nextTurn = 1;
  #waiters: Array<(value: IteratorResult<AgentTransportEvent>) => void> = [];

  constructor(private readonly options: OpenAIAgentsAdapterOptions) {}

  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]: () => ({
        next: () => this.#nextEvent(),
      }),
    };
  }

  async connect(): Promise<void> {
    this.#connected = true;
    this.#push({ event: { type: "connection/connected" }, type: "event" });
  }

  async close(): Promise<void> {
    this.#connected = false;
    this.#push({ event: { type: "connection/closed" }, type: "event" });
  }

  notify(): void {
    // OpenAI Agents SDK runner adapters are request-driven.
  }

  async reject(): Promise<void> {
    throw new Error("OpenAI Agents SDK adapter does not support server-request rejection");
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    if (!this.#connected) throw new Error("OpenAI Agents SDK adapter is not connected");
    if (method === "thread/start") return this.#startThread(params) as TResult;
    if (method === "thread/resume") return this.#resumeThread(params) as TResult;
    if (method === "turn/start") return (await this.#startTurn(params)) as TResult;
    if (method === "account/read") return { status: "authenticated" } as TResult;
    if (method === "account/rateLimits/read") return {} as TResult;
    if (method === "model/list") return { data: [] } as TResult;
    throw new Error(`OpenAI Agents SDK adapter does not support ${method}`);
  }

  async respond(): Promise<void> {
    throw new Error("OpenAI Agents SDK adapter does not support server-request responses");
  }

  #startThread(params?: unknown) {
    const id = this.options.createThreadId?.() ?? `agents-thread-${this.#nextThread++}`;
    return {
      thread: {
        id,
        name: readString(params, "name") ?? "OpenAI Agents thread",
        path: readString(params, "path") ?? null,
      },
    };
  }

  #resumeThread(params?: unknown) {
    const threadId = readString(params, "threadId") ?? this.options.createThreadId?.() ?? `agents-thread-${this.#nextThread++}`;
    return {
      thread: {
        id: threadId,
        name: readString(params, "name") ?? "OpenAI Agents thread",
        path: readString(params, "path") ?? null,
        status: "loaded",
      },
    };
  }

  async #startTurn(params?: unknown) {
    const record = params && typeof params === "object" ? (params as Record<string, unknown>) : {};
    const threadId = String(record.threadId ?? this.options.createThreadId?.() ?? `agents-thread-${this.#nextThread++}`);
    const turnId = this.options.createTurnId?.(threadId) ?? `agents-turn-${this.#nextTurn++}`;
    const context: OpenAIAgentsRunContext = {
      input: record.input,
      params: record,
      threadId,
      turnId,
    };
    const itemId = this.options.createItemId?.(context) ?? `${turnId}-assistant`;
    this.#push({
      event: { threadId, turn: { id: turnId, threadId, status: "running" }, type: "turn/started" },
      type: "event",
    });

    let text = "";
    let itemStarted = false;
    for await (const chunk of toAsyncIterable(this.options.run(context))) {
      if (typeof chunk === "string") {
        if (!itemStarted) {
          itemStarted = true;
          this.#push({
            event: {
              item: { id: itemId, kind: "agentMessage", status: "inProgress", threadId, turnId },
              threadId,
              turnId,
              type: "item/started",
            },
            type: "event",
          });
        }
        text += chunk;
        this.#push({
          event: { delta: chunk, itemId, threadId, turnId, type: "item/agentMessage/delta" },
          type: "event",
        });
        continue;
      }
      this.#push(normalizeAgentsChunk(chunk));
    }

    if (itemStarted) {
      this.#push({
        event: {
          item: { id: itemId, kind: "agentMessage", status: "completed", text, threadId, turnId },
          threadId,
          turnId,
          type: "item/completed",
        },
        type: "event",
      });
    }
    const turn = { id: turnId, status: "completed", threadId };
    this.#push({ event: { threadId, turn, type: "turn/completed" }, type: "event" });
    return { turn };
  }

  #nextEvent(): Promise<IteratorResult<AgentTransportEvent>> {
    const event = this.#events.shift();
    if (event) return Promise.resolve({ done: false, value: event });
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  #push(event: AgentTransportEvent) {
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ done: false, value: event });
      return;
    }
    this.#events.push(event);
  }
}

async function* toAsyncIterable(
  value:
    | AsyncIterable<OpenAIAgentsAdapterChunk>
    | Iterable<OpenAIAgentsAdapterChunk>
    | Promise<string | OpenAIAgentsAdapterChunk[]>
    | string
    | OpenAIAgentsAdapterChunk[],
) {
  const resolved = await value;
  if (typeof resolved === "string") {
    yield resolved;
    return;
  }
  if (Symbol.asyncIterator in Object(resolved)) {
    yield* resolved as AsyncIterable<OpenAIAgentsAdapterChunk>;
    return;
  }
  yield* resolved as Iterable<OpenAIAgentsAdapterChunk>;
}

function normalizeAgentsChunk(chunk: AgentEvent | AgentTransportEvent): AgentTransportEvent {
  if (isTransportEvent(chunk)) return chunk;
  return { event: chunk, type: "event" };
}

function isTransportEvent(chunk: unknown): chunk is AgentTransportEvent {
  return (
    typeof chunk === "object" &&
    chunk != null &&
    "type" in chunk &&
    ["event", "request", "response", "error", "stderr", "raw"].includes(String((chunk as { type?: unknown }).type))
  );
}

function readString(value: unknown, key: string) {
  if (!value || typeof value !== "object") return undefined;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : undefined;
}
