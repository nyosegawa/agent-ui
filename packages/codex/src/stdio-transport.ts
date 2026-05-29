import type { AgentRequestOptions, AgentTransport, AgentTransportEvent, RequestId } from "@nyosegawa/agent-ui-core";
import type { Readable, Writable } from "node:stream";
import { createInterface } from "node:readline";
import {
  delay,
  isBackpressureError,
  isBackpressureRetrySafeMethod,
} from "./backpressure";
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
import { requestIdKey } from "./request-id-key";

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
  readonly #pending = new Map<string, PendingRequest>();
  #closed = false;
  #ended = false;
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
    this.#options.stdin.end();
    this.#finish(
      new Error("Codex stdio transport closed"),
      { event: { type: "connection/closed" }, type: "event" },
    );
  }

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
    options?: AgentRequestOptions,
  ): Promise<TResult> {
    const maxRetries = this.#options.backpressure?.maxRetries ?? 2;
    const baseDelayMs = this.#options.backpressure?.baseDelayMs ?? 100;
    let attempt = 0;
    for (;;) {
      try {
        return await this.#sendRequest<TParams, TResult>(method, params, options);
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
    options?: AgentRequestOptions,
  ): Promise<TResult> {
    if (options?.signal?.aborted) throw abortError();
    const id = this.#nextId++;
    return new Promise<TResult>((resolve, reject) => {
      let settled = false;
      const pendingKey = requestIdKey(id);
      const cleanup = () => {
        this.#pending.delete(pendingKey);
        if (timeout) clearTimeout(timeout);
        options?.signal?.removeEventListener("abort", onAbort);
      };
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };
      const pass = (value: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value as TResult);
      };
      const onAbort = () => fail(abortError());
      const timeout =
        options?.timeoutMs && options.timeoutMs > 0
          ? setTimeout(() => fail(timeoutError(options.timeoutMs!)), options.timeoutMs)
          : undefined;
      timeout?.unref?.();
      options?.signal?.addEventListener("abort", onAbort, { once: true });
      this.#pending.set(pendingKey, {
        reject: fail,
        resolve: pass,
      });
      const payload = requestPayload(id, method, params, options);
      try {
        this.#write(payload);
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
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
    lines.on("close", () => {
      if (!this.#closed) {
        this.#finish(
          new Error("Codex stdio stdout closed"),
          { event: { type: "connection/closed", reason: "stdout closed" }, type: "event" },
        );
      }
    });
    this.#options.stdout.on("error", (error) => {
      this.#finish(error, {
        event: { error: { message: error.message }, type: "connection/error" },
        type: "event",
      });
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
      const pending = this.#pending.get(requestIdKey(message.id));
      if (!pending) return;
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
    if (this.#ended) return;
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
    if (this.#ended) return Promise.resolve({ done: true, value: undefined });
    return new Promise((resolve) => this.#waiters.push(resolve));
  }

  #finish(error: Error, event: AgentTransportEvent): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const pending of this.#pending.values()) {
      pending.reject(error);
    }
    this.#pending.clear();
    this.#push(event);
    this.#ended = true;
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ done: true, value: undefined });
    }
  }
}

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
}

function requestPayload(
  id: RequestId,
  method: string,
  params: unknown,
  options?: AgentRequestOptions,
): JsonRpcMessage {
  return {
    id,
    method,
    ...(params === undefined ? {} : { params }),
    ...(options?.trace === undefined ? {} : { trace: options.trace }),
  };
}

export { isBackpressureRetrySafeMethod } from "./backpressure";

function abortError(): Error {
  const error = new Error("Codex stdio request aborted");
  error.name = "AbortError";
  return error;
}

function timeoutError(timeoutMs: number): Error {
  const error = new Error(`Codex stdio request timed out after ${timeoutMs}ms`);
  error.name = "TimeoutError";
  return error;
}
