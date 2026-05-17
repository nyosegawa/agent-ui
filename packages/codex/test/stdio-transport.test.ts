import { PassThrough } from "node:stream";
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
      initialize: { clientInfo: { name: "agent_ui_test", version: "0.0.0" } },
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

  it("classifies only idempotent read requests as retry-safe", () => {
    expect(isBackpressureRetrySafeMethod("thread/read")).toBe(true);
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
});

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error("timed out waiting for condition");
}
