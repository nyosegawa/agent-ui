import { PassThrough, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  createCodexStdioTransport,
  isBackpressureRetrySafeMethod,
} from "../src/stdio-transport";

describe("Codex stdio transport backpressure", () => {
  it("emits connected only after initialize resolves", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      initialize: {
        capabilities: null,
        clientInfo: { name: "agent_ui_test", title: null, version: "0.0.0" },
      },
      stdin,
      stdout,
    });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));
    const iterator = transport.events[Symbol.asyncIterator]();

    const connected = transport.connect();
    await waitFor(() => written.length === 1);
    const init = JSON.parse(written[0] ?? "{}") as { id: number; method: string };
    expect(init.method).toBe("initialize");

    const early = Promise.race([
      iterator.next(),
      new Promise<"no-event">((resolve) => setTimeout(() => resolve("no-event"), 10)),
    ]);
    await expect(early).resolves.toBe("no-event");

    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;
    await expect(iterator.next()).resolves.toMatchObject({
      value: { event: { type: "connection/connected" }, type: "event" },
    });
  });

  it("sends initialize params in the generated stable shape before initialized notification", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      initialize: {
        capabilities: {
          experimentalApi: true,
          requestAttestation: true,
          optOutNotificationMethods: null,
        },
        clientInfo: { name: "agent_ui_test", title: null, version: "0.0.0" },
      },
      stdin,
      stdout,
    });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));

    const connected = transport.connect();
    await waitFor(() => written.length === 1);
    const init = JSON.parse(written[0] ?? "{}");
    expect(init).toEqual({
      id: 0,
      method: "initialize",
      params: {
        capabilities: {
          experimentalApi: true,
          optOutNotificationMethods: null,
          requestAttestation: true,
        },
        clientInfo: {
          name: "agent_ui_test",
          title: null,
          version: "0.0.0",
        },
      },
    });
    expect(written.some((line) => JSON.parse(line).method === "initialized")).toBe(false);

    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;
    expect(written.map((line) => JSON.parse(line)).at(-1)).toEqual({
      method: "initialized",
    });
  });

  it("classifies only idempotent read requests as retry-safe", () => {
    expect(isBackpressureRetrySafeMethod("thread/read")).toBe(true);
    expect(isBackpressureRetrySafeMethod("thread/turns/list")).toBe(true);
    expect(isBackpressureRetrySafeMethod("skills/list")).toBe(true);
    expect(isBackpressureRetrySafeMethod("turn/start")).toBe(false);
    expect(isBackpressureRetrySafeMethod("thread/archive")).toBe(false);
  });

  it("retries safe reads when App Server returns -32001", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      backpressure: { baseDelayMs: 0, maxRetries: 1 },
      stdin,
      stdout,
    });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));

    await transport.connect();
    const resultPromise = transport.request("thread/read", {
      includeTurns: true,
      threadId: "thread-1",
    });

    stdout.write('{"id":0,"error":{"code":-32001,"message":"busy"}}\n');
    await waitFor(() => written.length === 2);
    stdout.write('{"id":1,"result":{"thread":{"id":"thread-1"}}}\n');

    await expect(resultPromise).resolves.toEqual({ thread: { id: "thread-1" } });
    expect(written.map((line) => JSON.parse(line).id)).toEqual([0, 1]);
  });

  it("does not retry mutating requests on -32001", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      backpressure: { baseDelayMs: 0, maxRetries: 1 },
      stdin,
      stdout,
    });

    await transport.connect();
    const resultPromise = transport.request("turn/start", {
      input: [{ text: "hello", text_elements: [], type: "text" }],
      threadId: "thread-1",
    });
    stdout.write('{"id":0,"error":{"code":-32001,"message":"busy"}}\n');

    await expect(resultPromise).rejects.toMatchObject({ code: -32001 });
  });

  it("preserves top-level trace and rejects aborted or timed-out requests without leaking pending state", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({ stdin, stdout });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));
    await transport.connect();

    const traced = transport.request("thread/read", { threadId: "thread-1" }, { trace: { span: "abc" } });
    await waitFor(() => written.length === 1);
    expect(JSON.parse(written[0] ?? "{}")).toMatchObject({
      method: "thread/read",
      params: { threadId: "thread-1" },
      trace: { span: "abc" },
    });
    stdout.write(`${JSON.stringify({ id: 0, result: { ok: true } })}\n`);
    await expect(traced).resolves.toEqual({ ok: true });

    const controller = new AbortController();
    const aborted = transport.request("thread/read", {}, { signal: controller.signal });
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ name: "AbortError" });

    const timedOut = transport.request("thread/read", {}, { timeoutMs: 1 });
    await expect(timedOut).rejects.toMatchObject({ name: "TimeoutError" });
    stdout.write(`${JSON.stringify({ id: 2, result: { stale: true } })}\n`);
    await transport.close();
  });

  it("does not resolve numeric requests from string response ids", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({ stdin, stdout });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));
    await transport.connect();

    const request = transport.request("thread/read", { threadId: "thread-1" });
    await waitFor(() => written.length === 1);
    stdout.write('{"id":"0","result":{"wrong":true}}\n');
    await expect(notSettled(request)).resolves.toBe("pending");
    stdout.write('{"id":0,"result":{"ok":true}}\n');

    await expect(request).resolves.toEqual({ ok: true });
  });

  it("queues writes after stdin backpressure and flushes them in order on drain", async () => {
    const stdin = new DelayedDrainWritable();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({ stdin, stdout });
    await transport.connect();

    transport.notify("first");
    transport.notify("second");
    transport.notify("third");

    expect(stdin.lines.map((line) => JSON.parse(line).method)).toEqual(["first"]);
    stdin.release();
    await waitFor(() => stdin.lines.length === 3);

    expect(stdin.lines.map((line) => JSON.parse(line).method)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("bounds the queued stdin write backlog while waiting for drain", async () => {
    const stdin = new DelayedDrainWritable();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      backpressure: { maxWriteQueueBytes: 20 },
      stdin,
      stdout,
    });
    await transport.connect();

    transport.notify("first");

    expect(() => transport.notify("second", { payload: "larger than queue" })).toThrow(
      "write queue exceeded 20 bytes",
    );
  });

  it("rejects pending requests when stdout ends", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({ stdin, stdout });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));
    const iterator = transport.events[Symbol.asyncIterator]();
    await transport.connect();
    await expect(iterator.next()).resolves.toMatchObject({
      value: { event: { type: "connection/connected" }, type: "event" },
    });

    const pending = transport.request("model/list", {});
    await waitFor(() => written.length === 1);
    stdout.end();

    await expect(pending).rejects.toThrow("Codex stdio stdout closed");
    await expect(iterator.next()).resolves.toMatchObject({
      value: {
        event: { reason: "stdout closed", type: "connection/closed" },
        type: "event",
      },
    });
    await expect(iterator.next()).resolves.toMatchObject({ done: true });
  });

  it("rejects initialize when stdout closes before the response", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({
      initialize: {
        capabilities: null,
        clientInfo: { name: "agent_ui_test", title: null, version: "0.0.0" },
      },
      stdin,
      stdout,
    });
    const written: string[] = [];
    stdin.on("data", (chunk) => written.push(String(chunk)));

    const connected = transport.connect();
    await waitFor(() => written.length === 1);
    stdout.end();

    await expect(connected).rejects.toThrow("Codex stdio stdout closed");
  });

  it("does not accept new requests after stdout EOF", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const transport = createCodexStdioTransport({ stdin, stdout });
    await transport.connect();
    stdout.end();
    await nextTick();

    await expect(transport.request("model/list", {})).rejects.toThrow(
      "Codex stdio transport is closed",
    );
  });
});

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error("timed out waiting for condition");
}

async function nextTick(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

class DelayedDrainWritable extends Writable {
  readonly lines: string[] = [];
  #callbacks: Array<() => void> = [];
  #released = false;

  constructor() {
    super({ highWaterMark: 1 });
  }

  _write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void): void {
    this.lines.push(String(chunk));
    if (this.#released) {
      callback();
      return;
    }
    this.#callbacks.push(callback);
  }

  release(): void {
    this.#released = true;
    for (const callback of this.#callbacks.splice(0)) callback();
  }
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
