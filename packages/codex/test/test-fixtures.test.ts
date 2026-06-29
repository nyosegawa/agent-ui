import { describe, expect, it } from "vitest";
import { createCodexSession } from "../src/session";
import { createCodexAppServerSuccessFixture } from "../src/test-fixtures";

describe("Codex App Server success fixture", () => {
  it("runs thread/start through streamed turn/completed with a canonical thread id", async () => {
    const fixture = createCodexAppServerSuccessFixture();
    await fixture.transport.connect();
    const session = createCodexSession(fixture.transport);

    const startResult = await session.thread.start({ cwd: "/repo", model: "gpt-5.1" });
    const threadId = threadIdFrom(startResult);
    const turnResult = await session.turn.start({ input: "hello", threadId });

    expect(threadId).toBe("thread-fixture-1");
    expect(turnIdFrom(turnResult)).toBe("turn-fixture-1");
    expect(turnFrom(turnResult).status).toBe("inProgress");
    expect(fixture.requests.map((request) => request.method)).toEqual([
      "thread/start",
      "turn/start",
    ]);
    expect(fixture.events.map((event) => event.type)).toEqual([
      "thread/started",
      "turn/started",
      "item/agentMessage/delta",
      "turn/completed",
    ]);
    expect(
      fixture.events.find((event) => event.type === "item/agentMessage/delta"),
    ).toMatchObject({
      delta: "Fixture response to: hello",
      itemId: "agent-message-fixture-1",
      threadId,
      turnId: "turn-fixture-1",
    });
  });

  it("keeps a running turn open for queued steer and manual completion", async () => {
    const fixture = createCodexAppServerSuccessFixture({ autoCompleteTurns: false });
    await fixture.transport.connect();
    const session = createCodexSession(fixture.transport);

    const threadId = threadIdFrom(await session.thread.start());
    const turnId = turnIdFrom(await session.turn.start({ input: "draft", threadId }));
    await session.turn.steer({
      expectedTurnId: turnId,
      input: "add detail",
      threadId,
    });
    const completed = fixture.completeTurn(threadId, turnId);

    expect(completed?.steers).toEqual(["add detail"]);
    expect(fixture.activeTurn(threadId)).toBeUndefined();
    expect(fixture.events.map((event) => event.type)).toEqual([
      "thread/started",
      "turn/started",
      "item/agentMessage/delta",
      "item/agentMessage/delta",
      "turn/completed",
    ]);
    expect(
      fixture.events.filter((event) => event.type === "item/agentMessage/delta").at(-1),
    ).toMatchObject({ delta: "\nFixture steer: add detail" });
  });

  it("marks a running turn interrupted without reporting success", async () => {
    const fixture = createCodexAppServerSuccessFixture({ autoCompleteTurns: false });
    await fixture.transport.connect();
    const session = createCodexSession(fixture.transport);

    const threadId = threadIdFrom(await session.thread.start());
    const turnId = turnIdFrom(await session.turn.start({ input: "stop me", threadId }));
    await session.turn.interrupt(threadId, turnId);

    expect(fixture.activeTurn(threadId)).toBeUndefined();
    expect(fixture.threads[0]?.turns[0]?.status).toBe("interrupted");
    expect(
      fixture.events.find((event) => event.type === "turn/completed"),
    ).toMatchObject({
      threadId,
      turn: { id: turnId, status: "interrupted" },
      type: "turn/completed",
    });
  });

  it("returns started threads through thread/read for host resume smoke tests", async () => {
    const fixture = createCodexAppServerSuccessFixture();
    await fixture.transport.connect();
    const session = createCodexSession(fixture.transport);

    const threadId = threadIdFrom(await session.thread.start({ cwd: "/repo" }));
    await session.turn.start({ input: "persist me", threadId });
    const readResult = await session.thread.read(threadId);
    const readWithoutTurns = await session.thread.read(threadId, false);

    expect(threadIdFrom(readResult)).toBe(threadId);
    expect(threadFrom(readResult).turns).toHaveLength(1);
    expect(threadFrom(readWithoutTurns).turns).toHaveLength(0);
  });
});

function threadIdFrom(result: unknown): string {
  const thread = threadFrom(result);
  if (typeof thread.id !== "string") throw new Error("Expected thread id");
  return thread.id;
}

function turnIdFrom(result: unknown): string {
  const turn = turnFrom(result);
  if (typeof turn.id !== "string") throw new Error("Expected turn id");
  return turn.id;
}

function turnFrom(result: unknown): { id?: unknown; status?: unknown } {
  const record = result as { turn?: { id?: unknown; status?: unknown } };
  if (!record.turn) throw new Error("Expected turn result");
  return record.turn;
}

function threadFrom(result: unknown): { id?: unknown; turns?: unknown[] } {
  const record = result as { thread?: { id?: unknown; turns?: unknown[] } };
  if (!record.thread) throw new Error("Expected thread result");
  return record.thread;
}
