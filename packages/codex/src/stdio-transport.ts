import type { AgentTransport, AgentTransportEvent, RequestId } from "@nyosegawa/agent-ui-core";
import type { Readable, Writable } from "node:stream";
import { createInterface } from "node:readline";
import {
  encodeJsonRpcLine,
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  jsonRpcErrorObject,
  parseJsonRpcLine,
  type JsonRpcMessage,
} from "./json-rpc";
import { normalizeCodexServerMessage } from "./normalizer";
import { codexInitializeParams, type CodexInitializeOptions } from "./protocol";

export interface CodexStdioTransportOptions {
  stdin: Writable;
  stdout: Readable;
  stderr?: Readable;
  initialize?: CodexInitializeOptions;
  backpressure?: {
    baseDelayMs?: number;
    maxRetries?: number;
  };
}

export function createCodexStdioTransport(options: CodexStdioTransportOptions): AgentTransport {
  return new CodexStdioTransport(options);
}

class CodexStdioTransport implements AgentTransport {
  readonly #options: CodexStdioTransportOptions;
  readonly #pending = new Map<string, { reject: (error: Error) => void; resolve: (value: unknown) => void }>();
  #closed = false;
  #events: AgentTransportEvent[] = [];
  #waiters: Array<(value: IteratorResult<AgentTransportEvent>) => void> = [];
  #nextId = 0;

  constructor(options: CodexStdioTransportOptions) {
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
    this.#readStdout();
    this.#readStderr();
    if (this.#options.initialize) {
      await this.request("initialize", codexInitializeParams(this.#options.initialize));
      this.notify("initialized");
    }
    this.#push({ event: { type: "connection/connected" }, type: "event" });
  }

  async close(): Promise<void> {
    this.#closed = true;
    this.#options.stdin.end();
    for (const pending of this.#pending.values()) {
      pending.reject(new Error("Codex stdio transport closed"));
    }
    this.#pending.clear();
    this.#push({ event: { type: "connection/closed" }, type: "event" });
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    const maxRetries = this.#options.backpressure?.maxRetries ?? 2;
    const baseDelayMs = this.#options.backpressure?.baseDelayMs ?? 100;
    let attempt = 0;
    for (;;) {
      try {
        return await this.#sendRequest<TParams, TResult>(method, params);
      } catch (error) {
        if (
          !isBackpressureError(error) ||
          !isBackpressureRetrySafeMethod(method) ||
          attempt >= maxRetries
        ) {
          throw error;
        }
        attempt += 1;
        await delay(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }

  async #sendRequest<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    const id = this.#nextId++;
    const payload = params === undefined ? { id, method } : { id, method, params };
    this.#write(payload);
    return new Promise<TResult>((resolve, reject) => {
      this.#pending.set(String(id), {
        reject,
        resolve: (value) => resolve(value as TResult),
      });
    });
  }

  notify(method: string, params?: unknown): void {
    this.#write(params === undefined ? { method } : { method, params });
  }

  async respond(requestId: RequestId, result: unknown): Promise<void> {
    this.#write({ id: requestId, result });
  }

  async reject(
    requestId: RequestId,
    error: { code?: number; message: string; data?: unknown },
  ): Promise<void> {
    this.#write({ error, id: requestId });
  }

  #write(message: JsonRpcMessage): void {
    if (this.#closed) throw new Error("Codex stdio transport is closed");
    this.#options.stdin.write(encodeJsonRpcLine(message));
  }

  #readStdout(): void {
    const lines = createInterface({ input: this.#options.stdout });
    lines.on("line", (line) => {
      try {
        this.#handleMessage(parseJsonRpcLine(line));
      } catch (error) {
        this.#push({
          error: { message: error instanceof Error ? error.message : String(error) },
          type: "error",
        });
      }
    });
  }

  #readStderr(): void {
    const stderr = this.#options.stderr;
    if (!stderr) return;
    stderr.setEncoding("utf8");
    stderr.on("data", (chunk) => {
      this.#push({ message: String(chunk), type: "stderr" });
    });
  }

  #handleMessage(message: JsonRpcMessage): void {
    if (isJsonRpcResponse(message)) {
      const pending = this.#pending.get(String(message.id));
      if (!pending) return;
      this.#pending.delete(String(message.id));
      if ("error" in message) pending.reject(jsonRpcErrorObject(message.error));
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
            kind: events[0]?.type === "serverRequest/created" ? events[0].request.kind : "unknown",
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

export function isBackpressureRetrySafeMethod(method: string): boolean {
  return BACKPRESSURE_RETRY_SAFE_METHODS.has(method);
}

const BACKPRESSURE_RETRY_SAFE_METHODS = new Set([
  "account/read",
  "account/rateLimits/read",
  "app/list",
  "hooks/list",
  "model/list",
  "skills/list",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
]);

function isBackpressureError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === -32001
  );
}


function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
