import { describe, expect, it } from "vitest";
import { FakeAgentTransport } from "../src/fake-transport";

describe("FakeAgentTransport", () => {
  it("drains connection/closed before completing the iterator", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();
    const iterator = transport.events[Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/connected" }, type: "event" },
    });

    const pending = iterator.next();
    await transport.close();

    await expect(pending).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/closed" }, type: "event" },
    });
    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined });
  });

  it("releases pending waiters when closed without a queued event", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();
    const iterator = transport.events[Symbol.asyncIterator]();
    await iterator.next();

    await transport.close();
    await iterator.next();

    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined });
  });

  it("resolves extra same-iterator pending reads after the close event", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();
    const iterator = transport.events[Symbol.asyncIterator]();
    await iterator.next();

    const closed = iterator.next();
    const extra = iterator.next();
    await transport.close();

    await expect(closed).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/closed" }, type: "event" },
    });
    await expect(extra).resolves.toEqual({ done: true, value: undefined });
  });

  it("resolves extra same-generation waiters across iterators after close", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();
    const first = transport.events[Symbol.asyncIterator]();
    const second = transport.events[Symbol.asyncIterator]();
    await first.next();

    const closed = first.next();
    const extra = second.next();
    await transport.close();

    await expect(closed).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/closed" }, type: "event" },
    });
    await expect(extra).resolves.toEqual({ done: true, value: undefined });
  });

  it("keeps stale iterators from consuming reconnect events", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();
    const stale = transport.events[Symbol.asyncIterator]();
    await stale.next();
    await transport.close();
    await stale.next();

    await transport.connect();
    const current = transport.events[Symbol.asyncIterator]();

    await expect(stale.next()).resolves.toEqual({ done: true, value: undefined });
    await expect(current.next()).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/connected" }, type: "event" },
    });
  });

  it("keys fake responses and rejections by typed request id", async () => {
    const transport = new FakeAgentTransport();
    await transport.connect();

    await transport.respond(0, { ok: "number" });
    await transport.respond("0", { ok: "string" });
    await transport.reject(1, { message: "number denied" });
    await transport.reject("1", { message: "string denied" });

    expect(transport.responses.get("number:0")).toEqual({ ok: "number" });
    expect(transport.responses.get("string:0")).toEqual({ ok: "string" });
    expect(transport.rejections.get("number:1")).toEqual({ message: "number denied" });
    expect(transport.rejections.get("string:1")).toEqual({ message: "string denied" });
  });
});
