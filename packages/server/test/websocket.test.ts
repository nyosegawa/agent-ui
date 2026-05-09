import { createServer } from "node:http";
import { PassThrough } from "node:stream";
import WebSocket from "ws";
import { afterEach, describe, expect, it } from "vitest";
import { attachAgentUiWebSocketBridge, type CodexChildProcess } from "../src";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("attachAgentUiWebSocketBridge", () => {
  it("keeps a stdio bridge alive for browser requests and server events", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    const writes: string[] = [];
    stdin.on("data", (chunk) => writes.push(String(chunk)));

    const process: CodexChildProcess = {
      kill: () => true,
      stderr,
      stdin,
      stdout,
    };

    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      server: httpServer,
      spawn: () => process,
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
    await onceOpen(client);

    client.send(JSON.stringify({ id: 7, method: "initialize", params: {} }));
    await waitFor(() => writes.length === 1);
    const request = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    expect(request.method).toBe("initialize");

    stdout.write(`${JSON.stringify({ id: request.id, result: { userAgent: "test" } })}\n`);
    expect(await nextMessage(client)).toEqual({ id: 7, result: { userAgent: "test" } });

    stdout.write(
      `${JSON.stringify({
        method: "item/agentMessage/delta",
        params: { delta: "hi", itemId: "i1", threadId: "t1", turnId: "u1" },
      })}\n`,
    );
    expect(await nextMessage(client)).toMatchObject({
      event: {
        event: {
          delta: "hi",
          itemId: "i1",
          threadId: "t1",
          turnId: "u1",
          type: "item/agentMessage/delta",
        },
        type: "event",
      },
      type: "agent-ui/transport-event",
    });
  });
});

function onceOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
  });
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 1000) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
