import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";
import { createServer } from "node:http";
import { PassThrough } from "node:stream";
import WebSocket from "ws";
import { afterEach, describe, expect, it } from "vitest";
import { createCodexWebSocketTransport } from "../../codex/src/websocket";
import {
  attachAgentUiWebSocketBridge,
  createMcpDynamicToolHandler,
  type AgentUiWebSocketBridgeOptions,
  type CodexChildProcess,
} from "../src";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("attachAgentUiWebSocketBridge", () => {
  it("runs admission before spawning the Codex process", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      admission: () => false,
      server: httpServer,
      spawn: () => {
        spawnCount += 1;
        throw new Error("spawn should not run");
      },
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
    const close = await onceCloseWithInfo(client);
    expect(close.code).toBe(1008);
    expect(spawnCount).toBe(0);
  });

  it("closes deterministically when admission throws or rejects before spawning", async () => {
    for (const admission of [
      () => {
        throw new Error("token: sync-admission-secret");
      },
      () => Promise.reject(new Error("token: async-admission-secret")),
    ]) {
      let spawnCount = 0;
      const logs: string[] = [];
      const httpServer = createServer();
      servers.push(httpServer);
      const webSocketServer = attachAgentUiWebSocketBridge({
        admission,
        server: httpServer,
        spawn: () => {
          spawnCount += 1;
          throw new Error("spawn should not run");
        },
        stderr: (line) => logs.push(line),
      });
      servers.push(webSocketServer);

      await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
      const address = httpServer.address();
      if (!address || typeof address === "string") throw new Error("missing server address");

      const client = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
      const close = await onceCloseWithInfo(client);

      expect(close.code).toBe(1011);
      expect(spawnCount).toBe(0);
      expect(logs.join("")).toContain("admission failed");
      expect(logs.join("")).toContain("token: [REDACTED]");
      expect(logs.join("")).not.toContain("admission-secret");
    }
  });

  it("rejects host-only browser methods before forwarding to App Server", async () => {
    const { socket, writes } = await createBridgeBackedSocket();

    socket.send(JSON.stringify({ id: 1, method: "fs/readFile", params: { path: "/tmp/secret" } }));
    await expect(nextResponseMessage(socket, 1)).resolves.toMatchObject({
      error: {
        code: -32601,
        data: { method: "fs/readFile" },
      },
      id: 1,
    });
    expect(writes.map((line) => JSON.parse(line)).some((message) => message.method === "fs/readFile")).toBe(false);
    socket.close();
  });

  it("rejects browser initialize when the bridge owns initialization", async () => {
    const { socket, stdout, writes } = await createBridgeBackedSocket({
      initialize: {
        capabilities: {
          experimentalApi: false,
          requestAttestation: false,
        },
        clientInfo: {
          name: "agent_ui_bridge_test",
          title: "Agent UI Bridge Test",
          version: "0.0.0",
        },
      },
    });
    await waitFor(() => writes.some((line) => JSON.parse(line).method === "initialize"));
    const bridgeInitialize = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "initialize");
    stdout.write(
      `${JSON.stringify({ id: bridgeInitialize.id, result: { userAgent: "test" } })}\n`,
    );

    socket.send(JSON.stringify({ id: "browser-init", method: "initialize", params: {} }));
    await expect(nextResponseMessage(socket, "browser-init")).resolves.toMatchObject({
      error: {
        code: -32600,
        data: { method: "initialize" },
      },
      id: "browser-init",
    });
    expect(writes.map((line) => JSON.parse(line)).filter((message) => message.method === "initialize")).toHaveLength(1);
    socket.close();
  });

  it("closes oversized browser messages before parsing or forwarding", async () => {
    const { socket, writes } = await createBridgeBackedSocket({
      inbound: { maxMessageBytes: 32 },
    });
    socket.send(`{"id":1,"method":"model/list","params":{"pad":"${"x".repeat(80)}"}}`);
    const close = await onceCloseWithInfo(socket);
    expect(close.code).toBe(1009);
    expect(writes).toHaveLength(0);
  });

  it("applies inbound byte limits to the attached WebSocket server", () => {
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      inbound: { maxMessageBytes: 1234 },
      server: httpServer,
      spawn: () => createFakeChildProcess().process,
    });
    servers.push(webSocketServer);

    expect((webSocketServer.options as { maxPayload?: number }).maxPayload).toBe(1234);
  });

  it("rate limits abusive browser message bursts", async () => {
    const { socket } = await createBridgeBackedSocket({
      inbound: { rateLimitIntervalMs: 10_000, rateLimitMessages: 1 },
    });
    socket.send(JSON.stringify({ id: 1, method: "model/list", params: {} }));
    socket.send(JSON.stringify({ id: 2, method: "model/list", params: {} }));
    const close = await onceCloseWithInfo(socket);
    expect(close.code).toBe(1008);
  });

  it("forwards browser request trace to the stdio transport", async () => {
    const { socket, stdout, writes } = await createBridgeBackedSocket();
    socket.send(JSON.stringify({ id: 41, method: "model/list", params: {}, trace: { span: "browser" } }));
    await waitFor(() => writes.some((line) => JSON.parse(line).method === "model/list"));
    const forwarded = writes.map((line) => JSON.parse(line)).find((message) => message.method === "model/list");
    expect(forwarded.trace).toEqual({ span: "browser" });
    stdout.write(`${JSON.stringify({ id: forwarded.id, result: { data: [] } })}\n`);
    await expect(nextResponseMessage(socket, 41)).resolves.toEqual({ id: 41, result: { data: [] } });
    socket.close();
  });

  it("preserves safe JSON-RPC error metadata and redacts secrets for browser requests", async () => {
    const { socket, stdout, writes } = await createBridgeBackedSocket();

    socket.send(JSON.stringify({ id: 11, method: "model/list", params: {} }));
    await waitFor(() => writes.some((line) => JSON.parse(line).method === "model/list"));
    const forwarded = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "model/list");
    stdout.write(
      `${JSON.stringify({
        error: {
          code: -32042,
          data: { apiKey: "sk-data", retryAfterMs: 250, reason: "busy" },
          message: "App Server is busy token: raw-token",
        },
        id: forwarded.id,
      })}\n`,
    );

    const response = await nextResponseMessage(socket, 11);
    expect(response).toEqual({
      error: {
        code: -32042,
        data: { apiKey: "[REDACTED]", retryAfterMs: 250, reason: "busy" },
        message: "App Server is busy token: [REDACTED]",
      },
      id: 11,
    });
    expect(JSON.stringify(response)).not.toContain("raw-token");
    expect(JSON.stringify(response)).not.toContain("sk-data");
    socket.close();
  });

  it("returns JSON-RPC validation error metadata for invalid browser messages", async () => {
    const { socket } = await createBridgeBackedSocket();

    socket.send(JSON.stringify({ id: 12, params: {} }));

    await expect(nextResponseMessage(socket, 12)).resolves.toMatchObject({
      error: {
        code: -32600,
        data: {
          message: { id: 12, params: {} },
        },
        message: "Invalid JSON-RPC message",
      },
      id: 12,
    });
    socket.close();
  });

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
    const notification = await nextMessage(client);
    expect(notification).not.toMatchObject({
      method: "item/agentMessage/delta",
      params: { delta: "hi", itemId: "i1", threadId: "t1", turnId: "u1" },
    });
    expect(notification).toMatchObject({
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

  it("handles dynamic MCP tool calls through the app-server bridge", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolHandler: createMcpDynamicToolHandler({
        tools: [
          {
            namespace: "mcp__computer_use__",
            server: "computer-use",
            tools: ["get_app_state"],
          },
        ],
      }),
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "dynamic-1",
        method: "item/tool/call",
        params: {
          arguments: { app: "Google Chrome" },
          callId: "call-1",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).method === "thread/start"));
    const helperThreadStart = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "thread/start");
    expect(helperThreadStart).toMatchObject({
      method: "thread/start",
      params: {
        approvalPolicy: "on-request",
        sandbox: "workspace-write",
      },
    });
    stdout.write(
      `${JSON.stringify({
        id: helperThreadStart.id,
        result: { thread: { id: "helper-thread-1" } },
      })}\n`,
    );

    await waitFor(() =>
      writes.some((line) => JSON.parse(line).method === "mcpServer/tool/call"),
    );
    const mcpCall = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "mcpServer/tool/call");
    expect(mcpCall).toMatchObject({
      method: "mcpServer/tool/call",
      params: {
        arguments: { app: "Google Chrome" },
        server: "computer-use",
        threadId: "helper-thread-1",
        tool: "get_app_state",
      },
    });

    stdout.write(
      `${JSON.stringify({
        id: mcpCall.id,
        result: {
          content: [
            { text: "Chrome state is visible.", type: "text" },
            { data: "iVBORw0KGgo=", mimeType: "image/png", type: "image" },
          ],
          isError: false,
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-1"));
    const dynamicResponse = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.id === "dynamic-1");
    expect(dynamicResponse).toEqual({
      id: "dynamic-1",
      result: {
        contentItems: [
          { text: "Chrome state is visible.", type: "inputText" },
          { imageUrl: "data:image/png;base64,iVBORw0KGgo=", type: "inputImage" },
        ],
        success: true,
      },
    });
    await transport.close();
  });

  it("redacts dynamic tool handler failures from host stderr and App Server responses", async () => {
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolHandler: () => {
        throw new Error("dynamic failed token: tool-secret api_key: sk-tool");
      },
      stderr: (line) => logs.push(line),
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "dynamic-secret",
        method: "item/tool/call",
        params: {
          arguments: {},
          callId: "call-secret",
          namespace: "host__secret__",
          threadId: "thread-1",
          tool: "leaky",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-secret"));
    const dynamicResponse = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.id === "dynamic-secret");
    expect(dynamicResponse).toEqual({
      id: "dynamic-secret",
      result: {
        contentItems: [
          {
            text: "dynamic failed token: [REDACTED] api_key: [REDACTED]",
            type: "inputText",
          },
        ],
        success: false,
      },
    });
    expect(logs.join("")).toContain("dynamic tool failed id=dynamic-secret");
    expect(logs.join("")).not.toContain("tool-secret");
    expect(logs.join("")).not.toContain("sk-tool");
    await transport.close();
  });

  it("auto-resolves MCP approvals for dynamic tool helper calls", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolHandler: createMcpDynamicToolHandler({
        tools: [
          {
            namespace: "mcp__computer_use__",
            server: "computer-use",
            tools: ["get_app_state"],
          },
        ],
      }),
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "dynamic-approval-1",
        method: "item/tool/call",
        params: {
          arguments: { app: "Google Chrome" },
          callId: "call-approval-1",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).method === "thread/start"));
    const helperThreadStart = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "thread/start");
    stdout.write(
      `${JSON.stringify({
        id: helperThreadStart.id,
        result: { thread: { id: "helper-thread-approval" } },
      })}\n`,
    );

    await waitFor(() =>
      writes.some((line) => JSON.parse(line).method === "mcpServer/tool/call"),
    );
    const mcpCall = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "mcpServer/tool/call");

    stdout.write(
      `${JSON.stringify({
        id: "mcp-approval-request-1",
        method: "mcpServer/elicitation/request",
        params: {
          _meta: {
            codex_approval_kind: "mcp_tool_call",
          },
          message: "Allow computer-use to read the screen?",
          mode: "form",
          requestedSchema: {
            properties: {},
            type: "object",
          },
          serverName: "computer-use",
          threadId: "helper-thread-approval",
          turnId: null,
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "mcp-approval-request-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "mcp-approval-request-1")).toEqual({
      id: "mcp-approval-request-1",
      result: {
        _meta: null,
        action: "accept",
        content: null,
      },
    });

    stdout.write(
      `${JSON.stringify({
        id: mcpCall.id,
        result: {
          content: [{ text: "screen visible after approval", type: "text" }],
          isError: false,
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-approval-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "dynamic-approval-1")).toEqual({
      id: "dynamic-approval-1",
      result: {
        contentItems: [{ text: "screen visible after approval", type: "inputText" }],
        success: true,
      },
    });
    await transport.close();
  });

  it("can auto-accept MCP tool approvals for the active browser session", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: { mcpToolApproval: "accept" },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "mcp-active-approval-1",
        method: "mcpServer/elicitation/request",
        params: {
          _meta: {
            codex_approval_kind: "mcp_tool_call",
          },
          message: "Allow computer-use to read the screen?",
          mode: "form",
          requestedSchema: {
            properties: {},
            type: "object",
          },
          serverName: "computer-use",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "mcp-active-approval-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "mcp-active-approval-1")).toEqual({
      id: "mcp-active-approval-1",
      result: {
        _meta: null,
        action: "accept",
        content: null,
      },
    });
    await transport.close();
  });

  it("does not auto-accept MCP elicitations without approval metadata", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: { mcpToolApproval: "accept" },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "mcp-active-elicitation-1",
        method: "mcpServer/elicitation/request",
        params: {
          message: "Allow computer-use?",
          requestedSchema: {
            properties: {},
            type: "object",
          },
          serverName: "computer-use",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "serverRequest/created";
      }),
    ).resolves.toMatchObject({
      event: {
        request: {
          id: "mcp-active-elicitation-1",
          kind: "mcpElicitation",
        },
        type: "serverRequest/created",
      },
      type: "event",
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "mcp-active-elicitation-1" && "result" in message)).toBeUndefined();
    await transport.close();
  });

  it("preserves numeric server request ids when auto-resolving", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: { mcpToolApproval: "accept" },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: 0,
        method: "mcpServer/elicitation/request",
        params: {
          message: "Allow computer-use?",
          _meta: {
            codex_approval_kind: "mcp_tool_call",
          },
          requestedSchema: {
            properties: {},
            type: "object",
          },
          serverName: "computer-use",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === 0 && "result" in JSON.parse(line)));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === 0 && "result" in message)).toEqual({
      id: 0,
      result: {
        _meta: null,
        action: "accept",
        content: null,
      },
    });
    await transport.close();
  });

  it("keeps permission approvals manual by default", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport();

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-manual-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: { fileSystem: "read-only", network: true },
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "serverRequest/created";
      }),
    ).resolves.toMatchObject({
      event: {
        request: {
          id: "permissions-manual-1",
          kind: "permissionsApproval",
        },
        type: "serverRequest/created",
      },
      type: "event",
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-manual-1" && "result" in message)).toBeUndefined();
    await transport.close();
  });

  it("can auto-grant bounded permission approvals through a host callback", async () => {
    const contexts: unknown[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        permissions: (context) => {
          contexts.push(context);
          return {
            action: "grant",
            permissions: {
              fileSystem: { paths: ["/tmp/project"], mode: "read-only" },
            },
            scope: "turn",
          };
        },
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-active-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          itemId: "tool-1",
          permissions: {
            fileSystem: "read-only",
            network: true,
          },
          reason: "Allow approved task to inspect the current screen.",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "permissions-active-1"));
    expect(contexts).toEqual([
      expect.objectContaining({
        cwd: "/tmp/project",
        requestId: "permissions-active-1",
        requested: {
          fileSystem: "read-only",
          network: true,
        },
        threadId: "active-thread-1",
        turnId: "turn-1",
      }),
    ]);
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-active-1")).toEqual({
      id: "permissions-active-1",
      result: {
        permissions: {
          fileSystem: { paths: ["/tmp/project"], mode: "read-only" },
        },
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("keeps permission approvals manual when the host callback declines", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        permissions: () => undefined,
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-declined-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: { fileSystem: "read-only", network: true },
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "serverRequest/created";
      }),
    ).resolves.toMatchObject({
      event: {
        request: {
          id: "permissions-declined-1",
          kind: "permissionsApproval",
        },
        type: "serverRequest/created",
      },
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-declined-1" && "result" in message)).toBeUndefined();
    await transport.close();
  });

  it("can auto-accept command and file approvals for the active browser session", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        commandExecution: "acceptForSession",
        fileChange: "acceptForSession",
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "command-active-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "open -a 'Google Chrome'",
          cwd: "/tmp/project",
          itemId: "cmd-1",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );
    stdout.write(
      `${JSON.stringify({
        id: "file-active-1",
        method: "item/fileChange/requestApproval",
        params: {
          itemId: "file-1",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "command-active-1"));
    await waitFor(() => writes.some((line) => JSON.parse(line).id === "file-active-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "command-active-1")).toEqual({
      id: "command-active-1",
      result: { decision: "acceptForSession" },
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "file-active-1")).toEqual({
      id: "file-active-1",
      result: { decision: "acceptForSession" },
    });
    await transport.close();
  });

  it("emits host events for thread, turn, usage, and server request lifecycles", async () => {
    const received = {
      requests: [] as AgentTransportEvent[],
      threads: [] as AgentTransportEvent[],
      transports: [] as AgentTransportEvent[],
      turns: [] as AgentTransportEvent[],
      usage: [] as AgentTransportEvent[],
    };
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      hostEvents: {
        onServerRequest: (event) => received.requests.push(event),
        onThreadEvent: (event) => received.threads.push(event),
        onTransportEvent: (event) => received.transports.push(event),
        onTurnEvent: (event) => received.turns.push(event),
        onUsageEvent: (event) => received.usage.push(event),
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        method: "thread/status/changed",
        params: { status: "running", threadId: "thread-host" },
      })}\n`,
    );
    stdout.write(
      `${JSON.stringify({
        method: "turn/started",
        params: { threadId: "thread-host", turn: { id: "turn-host", threadId: "thread-host" } },
      })}\n`,
    );
    stdout.write(
      `${JSON.stringify({
        method: "thread/tokenUsage/updated",
        params: { threadId: "thread-host", tokenUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
      })}\n`,
    );
    stdout.write(
      `${JSON.stringify({
        id: "request-host",
        method: "item/commandExecution/requestApproval",
        params: { command: "bun test", threadId: "thread-host", turnId: "turn-host" },
      })}\n`,
    );

    await nextTransportEvent(transport, (event) => event.type === "request");
    await waitFor(() => received.requests.length === 1);
    expect(received.threads.some((event) => event.event?.type === "thread/status/changed")).toBe(true);
    expect(received.turns.some((event) => event.event?.type === "turn/started")).toBe(true);
    expect(received.usage.some((event) => event.event?.type === "thread/tokenUsage/updated")).toBe(true);
    expect(received.requests[0]?.request?.kind).toBe("commandApproval");
    expect(received.transports.length).toBeGreaterThanOrEqual(4);
    await transport.close();
  });

  it("forwards only redacted stderr through the browser transport", async () => {
    const { stderr, stdout, transport, writes } = await createBridgeBackedTransport();

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stderr.write("Authorization: Bearer raw.secret token=raw-token password=raw-pass\n");
    const event = await nextTransportEvent(transport, (candidate) => candidate.type === "stderr");

    expect(event.message).toContain("Authorization: Bearer [REDACTED]");
    expect(event.message).toContain("token=[REDACTED]");
    expect(event.message).toContain("password=[REDACTED]");
    expect(event.message).not.toContain("raw.secret");
    expect(event.message).not.toContain("raw-token");
    expect(event.message).not.toContain("raw-pass");
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

async function createBridgeBackedTransport(
  options: Pick<
    AgentUiWebSocketBridgeOptions,
    "dynamicToolHandler" | "hostEvents" | "serverRequestPolicy" | "stderr"
  > = {},
) {
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
    ...options,
    server: httpServer,
    spawn: () => process,
  });
  servers.push(webSocketServer);

  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  if (!address || typeof address === "string") throw new Error("missing server address");
  const transport = createCodexWebSocketTransport({
    initialize: {
      capabilities: {
        experimentalApi: false,
        requestAttestation: false,
      },
      clientInfo: {
        name: "agent_ui_websocket_test",
        title: "Agent UI WebSocket Test",
        version: "0.0.0",
      },
    },
    url: `ws://127.0.0.1:${address.port}/agent-ui/ws`,
    webSocketImpl: WebSocket as unknown as typeof globalThis.WebSocket,
  });
  return { stderr, stdout, transport, writes };
}

async function createBridgeBackedSocket(
  options: Pick<
    AgentUiWebSocketBridgeOptions,
    | "browserMethodPolicy"
    | "dynamicToolHandler"
    | "hostEvents"
    | "inbound"
    | "initialize"
    | "serverRequestPolicy"
    | "stderr"
  > = {},
) {
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
    ...options,
    server: httpServer,
    spawn: () => process,
  });
  servers.push(webSocketServer);

  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  if (!address || typeof address === "string") throw new Error("missing server address");
  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
  await onceOpen(socket);
  return { socket, stderr, stdout, writes };
}

function onceOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function onceCloseWithInfo(socket: WebSocket): Promise<{ code: number; reason: string }> {
  return new Promise((resolve, reject) => {
    socket.once("close", (code, reason) =>
      resolve({ code, reason: reason.toString() }),
    );
    socket.once("error", reject);
  });
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
  });
}

function nextResponseMessage(socket: WebSocket, id: string | number): Promise<unknown> {
  return new Promise((resolve) => {
    const onMessage = (data: { toString(): string }) => {
      const parsed = JSON.parse(data.toString());
      if (parsed && typeof parsed === "object" && "id" in parsed && parsed.id === id) {
        socket.off("message", onMessage);
        resolve(parsed);
      }
    };
    socket.on("message", onMessage);
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
