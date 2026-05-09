import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";
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

  it("is consumable by createCodexWebSocketTransport and forwards approval responses", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport();

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    expect(init.method).toBe("initialize");
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    const requestPromise = transport.request("model/list", {});
    await waitFor(() => writes.some((line) => JSON.parse(line).method === "model/list"));
    const modelList = writes.map((line) => JSON.parse(line) as { id: number; method?: string })
      .find((message) => message.method === "model/list");
    if (!modelList) throw new Error("missing model/list request");
    expect(modelList.method).toBe("model/list");
    stdout.write(`${JSON.stringify({ id: modelList.id, result: { data: [] } })}\n`);
    await expect(requestPromise).resolves.toEqual({ data: [] });

    stdout.write(
      `${JSON.stringify({
        method: "item/agentMessage/delta",
        params: { delta: "hello", itemId: "item-1", threadId: "thread-1", turnId: "turn-1" },
      })}\n`,
    );
    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "item/agentMessage/delta";
      }),
    ).resolves.toMatchObject({
      event: {
        delta: "hello",
        itemId: "item-1",
        threadId: "thread-1",
        turnId: "turn-1",
        type: "item/agentMessage/delta",
      },
    });

    stdout.write(
      `${JSON.stringify({
        method: "item/commandExecution/outputDelta",
        params: { delta: "ok\n", itemId: "cmd-1", threadId: "thread-1", turnId: "turn-1" },
      })}\n`,
    );
    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "item/commandOutput/delta";
      }),
    ).resolves.toMatchObject({
      event: {
        delta: "ok\n",
        itemId: "cmd-1",
        threadId: "thread-1",
        turnId: "turn-1",
        type: "item/commandOutput/delta",
      },
    });

    stdout.write(
      `${JSON.stringify({
        method: "item/fileChange/patchUpdated",
        params: {
          itemId: "diff-1",
          patch: "diff --git a/a b/a",
          threadId: "thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );
    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "item/filePatch/updated";
      }),
    ).resolves.toMatchObject({
      event: {
        itemId: "diff-1",
        patch: "diff --git a/a b/a",
        threadId: "thread-1",
        turnId: "turn-1",
        type: "item/filePatch/updated",
      },
    });

    stdout.write(
      `${JSON.stringify({
        id: "approval-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "bun test",
          cwd: "/tmp/project",
          itemId: "item-1",
          threadId: "thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    const event = await nextTransportEvent(transport, (candidate) => {
      return candidate.event?.type === "serverRequest/created";
    });
    expect(event.event).toMatchObject({
      request: {
        id: "approval-1",
        kind: "commandApproval",
        itemId: "item-1",
        threadId: "thread-1",
        turnId: "turn-1",
      },
      type: "serverRequest/created",
    });

    await transport.respond("approval-1", { decision: "accept" });
    await waitFor(() => writes.some((line) => JSON.parse(line).id === "approval-1"));
    const approvalResponse = writes.map((line) => JSON.parse(line)).find((message) => message.id === "approval-1");
    expect(approvalResponse).toEqual({
      id: "approval-1",
      result: { decision: "accept" },
    });

    stdout.write(
      `${JSON.stringify({
        id: "approval-2",
        method: "item/fileChange/requestApproval",
        params: {
          itemId: "item-2",
          threadId: "thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );
    await nextTransportEvent(transport, (candidate) => {
      return candidate.event?.type === "serverRequest/created";
    });
    await transport.respond("approval-2", { decision: "decline" });
    await waitFor(() => writes.some((line) => JSON.parse(line).id === "approval-2"));
    const declineResponse = writes.map((line) => JSON.parse(line)).find((message) => message.id === "approval-2");
    expect(declineResponse).toEqual({
      id: "approval-2",
      result: { decision: "decline" },
    });
    await transport.close();
  });

  it("shuts down abandoned browser sessions after the idle timeout", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const stderr = new PassThrough();
    let killed = false;

    const process: CodexChildProcess = {
      get killed() {
        return killed;
      },
      kill: () => {
        killed = true;
        return true;
      },
      stderr,
      stdin,
      stdout,
    };

    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      idleTimeoutMs: 20,
      server: httpServer,
      spawn: () => process,
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
    await onceOpen(client);
    await waitFor(() => killed, 500);
    expect(killed).toBe(true);
    client.close();
  });
});

async function createBridgeBackedTransport() {
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
  const transport = createCodexWebSocketTransport({
    initialize: {
      clientInfo: {
        name: "agent_ui_websocket_test",
        title: "Agent UI WebSocket Test",
        version: "0.0.0",
      },
    },
    url: `ws://127.0.0.1:${address.port}/agent-ui/ws`,
    webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
  });
  return { stdout, transport, writes };
}

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

async function waitFor(predicate: () => boolean, timeoutMs = 1000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("timed out");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function nextTransportEvent(transport: {
  events: AsyncIterable<AgentTransportEvent>;
}, predicate: (event: AgentTransportEvent) => boolean): Promise<AgentTransportEvent> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timed out waiting for transport event")), 1000),
  );
  const next = (async () => {
    for await (const event of transport.events) {
      if (predicate(event)) return event;
    }
    throw new Error("transport closed");
  })();
  return Promise.race([next, timeout]);
}
