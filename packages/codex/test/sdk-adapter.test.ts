import { describe, expect, it } from "vitest";
import { createCodexSdkTransportAdapter, type CodexSdkLikeClient } from "../src";

describe("createCodexSdkTransportAdapter", () => {
  it("adapts request/response clients and normalizes SDK events", async () => {
    async function* events() {
      yield { type: "account/updated", status: "authenticated" };
      yield { hello: "raw" };
    }
    const calls: Array<[string, unknown]> = [];
    const client: CodexSdkLikeClient = {
      events: events(),
      request(method, params) {
        calls.push([method, params]);
        return { ok: true };
      },
      respond: () => undefined,
    };
    const transport = createCodexSdkTransportAdapter(client);
    const iterator = transport.events[Symbol.asyncIterator]();

    await transport.connect();
    await expect(transport.request("model/list", { limit: 10 })).resolves.toEqual({ ok: true });
    await transport.respond("request-1", { decision: "approved" });

    expect(calls).toEqual([["model/list", { limit: 10 }]]);
    expect((await iterator.next()).value.event?.type).toBe("connection/connected");
    expect((await iterator.next()).value.event?.type).toBe("account/updated");
    expect((await iterator.next()).value).toEqual({ payload: { hello: "raw" }, type: "raw" });
  });

  it("drains the close event and finishes iterators", async () => {
    let closeCalls = 0;
    const client: CodexSdkLikeClient = {
      close: () => {
        closeCalls += 1;
      },
      request: () => ({ ok: true }),
    };
    const transport = createCodexSdkTransportAdapter(client);
    const iterator = transport.events[Symbol.asyncIterator]();

    await transport.connect();
    expect((await iterator.next()).value.event?.type).toBe("connection/connected");

    const waiting = iterator.next();
    await transport.close();

    expect(closeCalls).toBe(1);
    await expect(waiting).resolves.toMatchObject({
      done: false,
      value: { event: { type: "connection/closed" } },
    });
    await expect(iterator.next()).resolves.toEqual({ done: true, value: undefined });
  });
});
