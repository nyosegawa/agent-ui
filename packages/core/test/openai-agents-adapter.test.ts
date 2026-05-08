import { describe, expect, it } from "vitest";
import { createOpenAIAgentsSdkTransportAdapter } from "../src";

describe("createOpenAIAgentsSdkTransportAdapter", () => {
  it("maps a runner result into normalized turn events", async () => {
    const transport = createOpenAIAgentsSdkTransportAdapter({
      createThreadId: () => "thread-agents",
      createTurnId: () => "turn-agents",
      run: async function* () {
        yield "hello ";
        yield "agent";
      },
    });
    const iterator = transport.events[Symbol.asyncIterator]();

    await transport.connect();
    const started = await transport.request("thread/start");
    const result = await transport.request("turn/start", {
      input: [{ text: "hello", type: "text" }],
      threadId: "thread-agents",
    });

    const events = [];
    for (let index = 0; index < 6; index += 1) {
      events.push((await iterator.next()).value);
    }

    expect(started).toEqual({
      thread: { id: "thread-agents", name: "OpenAI Agents thread", path: null },
    });
    expect(result).toEqual({
      turn: { id: "turn-agents", status: "completed", threadId: "thread-agents" },
    });
    expect(events.map((event) => event.event?.type)).toEqual([
      "connection/connected",
      "turn/started",
      "item/started",
      "item/agentMessage/delta",
      "item/agentMessage/delta",
      "item/completed",
    ]);
    expect((await iterator.next()).value.event?.type).toBe("turn/completed");
  });
});
