import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";
import { createServer } from "node:http";
import { connect } from "node:net";
import { PassThrough } from "node:stream";
import WebSocket, { WebSocketServer } from "ws";
import { afterEach, describe, expect, it } from "vitest";
import { createCodexWebSocketTransport } from "../../codex/src/websocket";
import {
  attachAgentUiWebSocketBridge,
  createMcpDynamicToolHandler,
  handleAgentUiWebSocketConnection,
  type AgentUiWebSocketBridgeOptions,
  type AgentUiBridgeHealthEvent,
  type BrowserMethodCapability,
  type CodexChildProcess,
  type CodexSpawnOptions,
  type DynamicToolDebugEvent,
  type DynamicToolHelperPermissionPolicy,
} from "../src";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe("attachAgentUiWebSocketBridge", () => {
  it("uses explicit host-callback admission mode before spawning", async () => {
    let spawnCount = 0;
    let sawRequest = false;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      bridgePolicy: {
        admission: {
          admit(request) {
            sawRequest = request.headers.host !== undefined;
            return false;
          },
          mode: "host-callback",
        },
      },
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");
    expect(response.statusLine).toContain("403 Forbidden");
    expect(response.body).toContain("admission_rejected");
    expect(sawRequest).toBe(true);
    expect(spawnCount).toBe(0);
  });

  it("closes unmatched upgrade paths when no other upgrade handler owns them", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
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

    const response = await rawUpgradeResponse(address.port, "/not-agent-ui/ws");

    expect(response.statusLine).toContain("404 Not Found");
    expect(response.body).toContain("path_not_found");
    expect(spawnCount).toBe(0);
  });

  it("leaves unmatched upgrade paths for another handler", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      server: httpServer,
      spawn: () => {
        spawnCount += 1;
        throw new Error("spawn should not run");
      },
    });
    servers.push(webSocketServer);
    httpServer.on("upgrade", (request, socket) => {
      if (request.url !== "/other/ws") return;
      socket.write(
        [
          "HTTP/1.1 418 Other Handler",
          "Connection: close",
          "Content-Length: 13",
          "",
          "other handler",
        ].join("\r\n"),
      );
      socket.destroy();
    });

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const response = await rawUpgradeResponse(address.port, "/other/ws");

    expect(response.statusLine).toContain("418 Other Handler");
    expect(response.body).toBe("other handler");
    expect(spawnCount).toBe(0);
  });

  it("resolves per-connection cwd and env before spawning", async () => {
    const spawns: Array<CodexSpawnOptions> = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      bridgePolicy: { admission: { mode: "unsafe-no-admission", reason: "resolver test" } },
      resolveBridgeOptions({ request }) {
        const url = new URL(request?.url ?? "/", "http://127.0.0.1");
        const workspace = url.searchParams.get("workspace") ?? "default";
        return {
          cwd: `/tmp/${workspace}`,
          env: { AGENT_UI_WORKSPACE: workspace },
        };
      },
      server: httpServer,
      spawn: (_command, _args, options) => {
        spawns.push(options);
        return createSocketTestProcess();
      },
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const first = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws?workspace=one`);
    const second = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws?workspace=two`);
    await Promise.all([onceOpen(first), onceOpen(second)]);

    expect(spawns).toEqual([
      { cwd: "/tmp/one", env: { AGENT_UI_WORKSPACE: "one" } },
      { cwd: "/tmp/two", env: { AGENT_UI_WORKSPACE: "two" } },
    ]);
    first.close();
    second.close();
  });

  it("closes rejected or failed bridge option resolvers before spawning", async () => {
    for (const resolveBridgeOptions of [
      () => false,
      () => Promise.reject(new Error("token: resolver-secret")),
    ]) {
      let spawnCount = 0;
      const logs: string[] = [];
      const httpServer = createServer();
      servers.push(httpServer);
      const webSocketServer = attachAgentUiWebSocketBridge({
        bridgePolicy: { admission: { mode: "unsafe-no-admission", reason: "resolver rejection test" } },
        resolveBridgeOptions,
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

      const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

      expect(spawnCount).toBe(0);
      expect([403, 500]).toContain(response.status);
      expect(logs.join("")).not.toContain("resolver-secret");
      httpServer.close();
      webSocketServer.close();
    }
  });

  it("continues admission after an accepted resolver result", async () => {
    let spawnCount = 0;
    let sawAdmission = false;
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      bridgePolicy: {
        admission: {
          admit: () => {
            sawAdmission = true;
            return false;
          },
          mode: "host-callback",
        },
      },
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
      resolveBridgeOptions: () => ({ accepted: true }),
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

    expect(response.statusLine).toContain("403 Forbidden");
    expect(response.body).toContain("admission_rejected");
    expect(sawAdmission).toBe(true);
    expect(spawnCount).toBe(0);
    expect(healthEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: "admissionChecked",
          reasonCode: "admission_rejected",
        }),
        expect.objectContaining({
          phase: "rejected",
          reasonCode: "admission_rejected",
        }),
      ]),
    );
  });

  it("returns structured HTTP 409 resolver rejections before spawning", async () => {
    let spawnCount = 0;
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
      resolveBridgeOptions: () => ({
        accepted: false,
        body: "workspace missing",
        reason: "workspace_missing",
        status: 409,
        statusText: "Workspace Missing",
      }),
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

    expect(response).toMatchObject({
      body: "workspace missing",
      status: 409,
      statusLine: "HTTP/1.1 409 Workspace Missing",
    });
    expect(spawnCount).toBe(0);
    expect(healthEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: "rejected",
          reasonCode: "workspace_missing",
        }),
      ]),
    );
  });

  it("sanitizes structured HTTP rejection status metadata", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      resolveBridgeOptions: () => ({
        accepted: false,
        body: "bad status",
        reason: "bad_status",
        status: 200,
        statusText: "Bad\r\nInjected: header",
      }),
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

    expect(response.statusLine).toBe("HTTP/1.1 403 Bad  Injected: header");
    expect(response.headers).not.toContain("Injected: header");
    expect(response.body).toBe("bad status");
    expect(spawnCount).toBe(0);
  });

  it("returns structured HTTP 403 admission rejections before spawning", async () => {
    let spawnCount = 0;
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      bridgePolicy: {
        admission: {
          admit: () => ({
            accepted: false,
            body: "token rejected",
            closeCode: 1008,
            closeReason: "Agent UI bridge token rejected",
            reason: "token_rejected",
            status: 403,
          }),
          mode: "host-callback",
        },
      },
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

    expect(response).toMatchObject({
      body: "token rejected",
      status: 403,
    });
    expect(spawnCount).toBe(0);
    expect(healthEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: "admissionChecked",
          reasonCode: "token_rejected",
        }),
        expect.objectContaining({
          phase: "rejected",
          reasonCode: "token_rejected",
        }),
      ]),
    );
  });

  it("keeps already-upgraded manual hosts on WebSocket close rejection", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = new WebSocketServer({
      path: "/manual/ws",
      server: httpServer,
    });
    webSocketServer.on("connection", (socket, request) => {
      void handleAgentUiWebSocketConnection(socket, {
        bridgePolicy: {
          admission: {
            admit: () => ({
              accepted: false,
              closeCode: 1008,
              closeReason: "Agent UI bridge manual admission rejected",
              reason: "token_rejected",
            }),
            mode: "host-callback",
          },
        },
        spawn: () => {
          spawnCount += 1;
          throw new Error("spawn should not run");
        },
      }, request);
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/manual/ws`);
    const close = await onceCloseWithInfo(client);

    expect(close).toMatchObject({
      code: 1008,
      reason: "Agent UI bridge manual admission rejected",
    });
    expect(spawnCount).toBe(0);
  });

  it("sanitizes already-upgraded structured WebSocket close metadata", async () => {
    let spawnCount = 0;
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = new WebSocketServer({
      path: "/manual/ws",
      server: httpServer,
    });
    webSocketServer.on("connection", (socket, request) => {
      void handleAgentUiWebSocketConnection(socket, {
        bridgePolicy: {
          admission: {
            admit: () => ({
              accepted: false,
              closeCode: 999,
              closeReason: "x".repeat(124),
              reason: "bad_close_metadata",
            }),
            mode: "host-callback",
          },
        },
        spawn: () => {
          spawnCount += 1;
          throw new Error("spawn should not run");
        },
      }, request);
    });
    servers.push(webSocketServer);

    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address();
    if (!address || typeof address === "string") throw new Error("missing server address");

    const client = new WebSocket(`ws://127.0.0.1:${address.port}/manual/ws`);
    const close = await onceCloseWithInfo(client);

    expect(close).toMatchObject({
      code: 1008,
      reason: "Agent UI bridge rejected",
    });
    expect(spawnCount).toBe(0);
  });

  it("requires a reason before unsafe no-admission mode can spawn", async () => {
    let spawnCount = 0;
    const logs: string[] = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      bridgePolicy: { admission: { mode: "unsafe-no-admission", reason: "" } },
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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");
    expect(response.statusLine).toContain("500 Internal Server Error");
    expect(response.body).toContain("unsafe_admission_reason_missing");
    expect(logs.join("")).toContain("reason is required");
    expect(spawnCount).toBe(0);
  });

  it("allows explicit unsafe no-admission mode only with an audit reason", async () => {
    const logs: string[] = [];
    const { socket } = await createBridgeBackedSocket({
      bridgePolicy: {
        admission: {
          mode: "unsafe-no-admission",
          reason: "single-user dev tunnel with host auth disabled for fixture QA",
        },
      },
      stderr: (line) => logs.push(line),
    });

    expect(logs.join("")).toContain("unsafe admission enabled");
    socket.close();
  });

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

    const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");
    expect(response.statusLine).toContain("403 Forbidden");
    expect(response.body).toContain("admission_rejected");
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

      const response = await rawUpgradeResponse(address.port, "/agent-ui/ws");

      expect(response.statusLine).toContain("500 Internal Server Error");
      expect(response.body).toContain("admission_failed");
      expect(spawnCount).toBe(0);
      expect(logs.join("")).toContain("admission failed");
      expect(logs.join("")).toContain("token: [REDACTED]");
      expect(logs.join("")).not.toContain("admission-secret");
    }
  });

  it("closes with generic startup failure when bridge creation fails after admission", async () => {
    for (const spawn of [
      () => {
        throw new Error("missing binary token: websocket-spawn-secret");
      },
      () => ({ ...createFakeChildProcess().process, stdout: null }),
    ]) {
      const logs: string[] = [];
      const httpServer = createServer();
      servers.push(httpServer);
      const webSocketServer = attachAgentUiWebSocketBridge({
        server: httpServer,
        spawn,
        stderr: (line) => logs.push(line),
      });
      servers.push(webSocketServer);

      await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
      const address = httpServer.address();
      if (!address || typeof address === "string") throw new Error("missing server address");

      const client = new WebSocket(`ws://127.0.0.1:${address.port}/agent-ui/ws`);
      const close = await onceCloseWithInfo(client);

      expect(close).toMatchObject({
        code: 1011,
        reason: "Agent UI bridge startup failed",
      });
      expect(logs.join("")).toContain("startup failed");
      expect(logs.join("")).not.toContain("websocket-spawn-secret");
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

  it("keeps full-chat browser methods available by default", async () => {
    const { socket, writes } = await createBridgeBackedSocket();

    socket.send(
      JSON.stringify({
        id: "turn-start",
        method: "turn/start",
        params: { input: [{ text: "hello", type: "text" }], threadId: "thread-1" },
      }),
    );

    await waitFor(() =>
      writes.some((line) => JSON.parse(line).method === "turn/start"),
    );
    expect(writes.map((line) => JSON.parse(line)).at(-1)).toMatchObject({
      method: "turn/start",
      params: { threadId: "thread-1" },
    });
    socket.close();
  });

  it("narrows browser methods by capability category", async () => {
    const { socket, writes } = await createBridgeBackedSocket({
      browserMethodPolicy: { capabilities: ["connection", "models"] },
    });

    socket.send(JSON.stringify({ id: "model-list", method: "model/list", params: {} }));
    await waitFor(() =>
      writes.some((line) => JSON.parse(line).method === "model/list"),
    );
    expect(writes.map((line) => JSON.parse(line)).at(-1)).toMatchObject({
      method: "model/list",
    });

    socket.send(
      JSON.stringify({
        id: "turn-start",
        method: "turn/start",
        params: { input: [{ text: "hello", type: "text" }], threadId: "thread-1" },
      }),
    );
    await expect(nextResponseMessage(socket, "turn-start")).resolves.toMatchObject({
      error: {
        code: -32601,
        data: { method: "turn/start" },
      },
      id: "turn-start",
    });
    expect(writes.map((line) => JSON.parse(line)).filter((message) => message.method === "turn/start")).toHaveLength(0);
    socket.close();
  });

  it("rejects unknown browser method capabilities before spawning", async () => {
    let spawnCount = 0;
    const logs: string[] = [];
    const httpServer = createServer();
    servers.push(httpServer);
    const webSocketServer = attachAgentUiWebSocketBridge({
      browserMethodPolicy: {
        capabilities: [
          "models",
          "token=browser-method-policy-secret",
        ] as unknown as BrowserMethodCapability[],
      },
      bridgePolicy: {
        admission: {
          mode: "unsafe-no-admission",
          reason: "test invalid runtime capability before spawn",
        },
      },
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
    expect(close).toMatchObject({
      code: 1011,
      reason: "Agent UI bridge browser method policy failed",
    });
    expect(spawnCount).toBe(0);
    expect(logs.join("")).toContain("browser method policy failed");
    expect(logs.join("")).toContain("token=[REDACTED]");
    expect(logs.join("")).not.toContain("browser-method-policy-secret");
  });

  it("keeps unsafe all browser method policy explicit", async () => {
    const { socket, writes } = await createBridgeBackedSocket({
      browserMethodPolicy: "all",
    });

    socket.send(JSON.stringify({ id: "fs-read", method: "fs/readFile", params: { path: "/tmp/secret" } }));
    await waitFor(() =>
      writes.some((line) => JSON.parse(line).method === "fs/readFile"),
    );
    expect(writes.map((line) => JSON.parse(line)).at(-1)).toMatchObject({
      method: "fs/readFile",
    });
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

  it("keeps dynamic tool execution disabled unless host policy provides a handler", async () => {
    const dynamicToolEvents: DynamicToolDebugEvent[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      hostEvents: {
        onDynamicToolEvent: (event) => dynamicToolEvents.push(event),
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "dynamic-disabled",
        method: "item/tool/call",
        params: {
          arguments: {},
          callId: "call-disabled",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-disabled"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "dynamic-disabled"),
    ).toEqual({
      id: "dynamic-disabled",
      result: {
        contentItems: [
          { text: "Dynamic tool handling is disabled by host policy", type: "inputText" },
        ],
        success: false,
      },
    });
    expect(writes.some((line) => JSON.parse(line).method === "thread/start")).toBe(false);
    expect(dynamicToolEvents).toEqual([
      expect.objectContaining({
        phase: "received",
        requestId: "dynamic-disabled",
      }),
      {
        audience: ["developer", "audit"],
        message: "Dynamic tool handling is disabled by host policy",
        phase: "denied",
        request: {
          callId: "call-disabled",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
        requestId: "dynamic-disabled",
        success: false,
        type: "dynamicTool",
      },
    ]);
    await transport.close();
  });

  it("does not let throwing dynamic tool event sinks block disabled denial responses", async () => {
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      hostEvents: {
        onDynamicToolEvent() {
          throw new Error("event sink token: sink-secret");
        },
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
        id: "dynamic-disabled-sink",
        method: "item/tool/call",
        params: {
          callId: "call-disabled-sink",
          namespace: "mcp__computer_use__",
          threadId: "thread-1",
          tool: "get_app_state",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-disabled-sink"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "dynamic-disabled-sink"),
    ).toMatchObject({
      id: "dynamic-disabled-sink",
      result: { success: false },
    });
    expect(logs.join("")).toContain("dynamic tool host event sink failed");
    expect(logs.join("")).not.toContain("sink-secret");
    await transport.close();
  });

  it("handles dynamic MCP tool calls through the app-server bridge", async () => {
    const dynamicToolEvents: DynamicToolDebugEvent[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolPolicy: {
        handler: createMcpDynamicToolHandler({
          tools: [
            {
              namespace: "mcp__computer_use__",
              server: "computer-use",
              tools: ["get_app_state"],
            },
          ],
        }),
        mode: "host-callback",
      },
      hostEvents: {
        onDynamicToolEvent: (event) => dynamicToolEvents.push(event),
      },
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
    await waitFor(() => dynamicToolEvents.some((event) => event.phase === "completed"));
    expect(dynamicToolEvents.map((event) => event.phase)).toEqual([
      "received",
      "helperThreadCreated",
      "mcpCallStarted",
      "completed",
    ]);
    expect(dynamicToolEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          helperThreadId: "helper-thread-1",
          phase: "helperThreadCreated",
          requestId: "dynamic-1",
        }),
        expect.objectContaining({
          helperThreadId: "helper-thread-1",
          phase: "mcpCallStarted",
          request: {
            callId: "call-1",
            namespace: "mcp__computer_use__",
            threadId: "thread-1",
            tool: "get_app_state",
            turnId: "turn-1",
          },
          requestId: "dynamic-1",
          server: "computer-use",
        }),
        expect.objectContaining({
          durationMs: expect.any(Number),
          phase: "completed",
          requestId: "dynamic-1",
          success: true,
        }),
      ]),
    );
    expect(JSON.stringify(dynamicToolEvents)).not.toContain("Google Chrome");
    await transport.close();
  });

  it("does not let throwing dynamic tool event sinks block successful handler responses", async () => {
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolPolicy: {
        handler: () => ({
          contentItems: [{ text: "ok", type: "inputText" }],
          success: true,
        }),
        mode: "host-callback",
      },
      hostEvents: {
        onDynamicToolEvent() {
          throw new Error("event sink token: success-secret");
        },
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
        id: "dynamic-success-sink",
        method: "item/tool/call",
        params: {
          callId: "call-success-sink",
          namespace: "host__debug__",
          threadId: "thread-1",
          tool: "debug",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "dynamic-success-sink"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "dynamic-success-sink"),
    ).toEqual({
      id: "dynamic-success-sink",
      result: {
        contentItems: [{ text: "ok", type: "inputText" }],
        success: true,
      },
    });
    expect(logs.join("")).toContain("dynamic tool host event sink failed");
    expect(logs.join("")).not.toContain("success-secret");
    await transport.close();
  });

  it("redacts dynamic tool handler failures from host stderr and App Server responses", async () => {
    const dynamicToolEvents: DynamicToolDebugEvent[] = [];
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolPolicy: {
        handler: () => {
          throw new Error("dynamic failed token: tool-secret api_key: sk-tool");
        },
        mode: "host-callback",
      },
      hostEvents: {
        onDynamicToolEvent: (event) => dynamicToolEvents.push(event),
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
    expect(dynamicToolEvents).toEqual([
      expect.objectContaining({
        phase: "received",
        requestId: "dynamic-secret",
      }),
      expect.objectContaining({
        message: "dynamic failed token: [REDACTED] api_key: [REDACTED]",
        phase: "failed",
        requestId: "dynamic-secret",
        success: false,
      }),
    ]);
    await transport.close();
  });

  it("auto-resolves MCP approvals for dynamic tool helper calls", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      dynamicToolPolicy: {
        handler: createMcpDynamicToolHandler({
          tools: [
            {
              namespace: "mcp__computer_use__",
              server: "computer-use",
              tools: ["get_app_state"],
            },
          ],
        }),
        mode: "host-callback",
      },
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

  it("starts dynamic tool helper threads with the resolved connection cwd", async () => {
    const { transport, writes } = await createStartedDynamicHelper({
      resolveBridgeOptions: () => ({ cwd: "/tmp/resolved-project" }),
    });

    const helperThreadStart = writes
      .map((line) => JSON.parse(line))
      .find((message) => message.method === "thread/start");

    expect(helperThreadStart.params).toMatchObject({
      cwd: "/tmp/resolved-project",
    });
    await transport.close();
  });

  it("does not auto-grant dynamic helper permissions without an explicit policy", async () => {
    const { stdout, transport, writes } = await createStartedDynamicHelper();

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-manual",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: { fileSystem: "read-only", network: true },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "serverRequest/created";
      }),
    ).resolves.toMatchObject({
      event: { request: { id: "helper-permissions-manual" } },
    });
    expect(
      writes
        .map((line) => JSON.parse(line))
        .find((message) => message.id === "helper-permissions-manual" && "result" in message),
    ).toBeUndefined();
    await transport.close();
  });

  it("bounds dynamic helper permission callback grants to requested families", async () => {
    const { stdout, transport, writes } = await createStartedDynamicHelper({
      helperPermissions: (context) => ({
        action: "grant",
        permissions: {
          fileSystem: { mode: "read-only", paths: [context.cwd] },
          network: true,
        },
      }),
    });

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-grant",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: { fileSystem: "read-only" },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "helper-permissions-grant"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "helper-permissions-grant"),
    ).toEqual({
      id: "helper-permissions-grant",
      result: {
        permissions: { fileSystem: { mode: "read-only", paths: ["/tmp/project"] } },
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("drops dynamic helper callback grants that broaden requested filesystem values", async () => {
    const { stdout, transport, writes } = await createStartedDynamicHelper({
      helperPermissions: () => ({
        action: "grant",
        permissions: {
          fileSystem: { mode: "workspace-write", paths: ["/"] },
          network: true,
        },
      }),
    });

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-broad",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: { fileSystem: { mode: "read-only", paths: ["/tmp/project"] } },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "helper-permissions-broad"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "helper-permissions-broad"),
    ).toEqual({
      id: "helper-permissions-broad",
      result: {
        permissions: {},
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("keeps dynamic helper protocol filesystem grants within requested subsets", async () => {
    const requestedEntry = {
      access: "read",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const { stdout, transport, writes } = await createStartedDynamicHelper({
      helperPermissions: () => ({
        action: "grant",
        permissions: {
          fileSystem: {
            entries: [requestedEntry],
            globScanMaxDepth: 2,
            read: ["/tmp/project/src"],
            write: ["/tmp/project"],
          },
          network: true,
        },
      }),
    });

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-protocol-subset",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: {
            fileSystem: {
              entries: [requestedEntry],
              globScanMaxDepth: 4,
              read: ["/tmp/project/src", "/tmp/project/README.md"],
              write: ["/tmp/project", "/tmp/shared"],
            },
            network: true,
          },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "helper-permissions-protocol-subset"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "helper-permissions-protocol-subset"),
    ).toEqual({
      id: "helper-permissions-protocol-subset",
      result: {
        permissions: {
          fileSystem: {
            entries: [requestedEntry],
            globScanMaxDepth: 2,
            read: ["/tmp/project/src"],
            write: ["/tmp/project"],
          },
          network: true,
        },
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("drops dynamic helper protocol filesystem grants that broaden requested values", async () => {
    const requestedEntry = {
      access: "read",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const broaderEntry = {
      access: "write",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const { stdout, transport, writes } = await createStartedDynamicHelper({
      helperPermissions: () => ({
        action: "grant",
        permissions: {
          fileSystem: {
            entries: [broaderEntry],
            globScanMaxDepth: 3,
            read: ["/tmp/project/src"],
            write: ["/"],
          },
          network: true,
        },
      }),
    });

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-protocol-broad",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: {
            fileSystem: {
              entries: [requestedEntry],
              globScanMaxDepth: 2,
              read: null,
              write: ["/tmp/project"],
            },
          },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "helper-permissions-protocol-broad"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "helper-permissions-protocol-broad"),
    ).toEqual({
      id: "helper-permissions-protocol-broad",
      result: {
        permissions: {},
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("can explicitly deny dynamic helper permissions", async () => {
    const { stdout, transport, writes } = await createStartedDynamicHelper({
      helperPermissions: "deny",
    });

    stdout.write(
      `${JSON.stringify({
        id: "helper-permissions-deny",
        method: "item/permissions/requestApproval",
        params: {
          permissions: { network: true },
          threadId: "helper-thread-policy",
          turnId: "helper-turn",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "helper-permissions-deny"));
    expect(
      writes.map((line) => JSON.parse(line)).find((message) => message.id === "helper-permissions-deny"),
    ).toMatchObject({
      error: {
        code: -32001,
        message: "Dynamic tool helper permissions denied by host policy",
      },
      id: "helper-permissions-deny",
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

  it("drops normal permission grants outside the requested permission families", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        permissions: () => ({
          action: "grant",
          permissions: {
            fileSystem: { mode: "read-only", paths: ["/tmp/project"] },
            network: true,
          },
          scope: "turn",
        }),
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-family-bound-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: {
            fileSystem: "read-only",
          },
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "permissions-family-bound-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-family-bound-1")).toEqual({
      id: "permissions-family-bound-1",
      result: {
        permissions: {
          fileSystem: { mode: "read-only", paths: ["/tmp/project"] },
        },
        scope: "turn",
      },
    });
    await transport.close();
  });

  it("keeps normal permission grants within requested protocol permission subsets", async () => {
    const requestedEntry = {
      access: "read",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        permissions: () => ({
          action: "grant",
          permissions: {
            fileSystem: {
              entries: [requestedEntry],
              globScanMaxDepth: 2,
              read: ["/tmp/project/src"],
              write: ["/tmp/project"],
            },
            network: true,
          },
          scope: "session",
        }),
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-protocol-subset-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: {
            fileSystem: {
              entries: [requestedEntry],
              globScanMaxDepth: 4,
              read: ["/tmp/project/src", "/tmp/project/README.md"],
              write: ["/tmp/project", "/tmp/shared"],
            },
            network: true,
          },
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "permissions-protocol-subset-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-protocol-subset-1")).toEqual({
      id: "permissions-protocol-subset-1",
      result: {
        permissions: {
          fileSystem: {
            entries: [requestedEntry],
            globScanMaxDepth: 2,
            read: ["/tmp/project/src"],
            write: ["/tmp/project"],
          },
          network: true,
        },
        scope: "session",
      },
    });
    await transport.close();
  });

  it("drops normal permission grants that broaden requested filesystem values", async () => {
    const requestedEntry = {
      access: "read",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const broaderEntry = {
      access: "write",
      path: { path: "/tmp/project/src", type: "path" },
    };
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        permissions: () => ({
          action: "grant",
          permissions: {
            fileSystem: {
              entries: [broaderEntry],
              globScanMaxDepth: 3,
              read: ["/tmp/project/src"],
              write: ["/"],
            },
            network: true,
          },
          scope: "turn",
        }),
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "permissions-filesystem-bound-1",
        method: "item/permissions/requestApproval",
        params: {
          cwd: "/tmp/project",
          permissions: {
            fileSystem: {
              entries: [requestedEntry],
              globScanMaxDepth: 2,
              read: null,
              write: ["/tmp/project"],
            },
          },
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "permissions-filesystem-bound-1"));
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "permissions-filesystem-bound-1")).toEqual({
      id: "permissions-filesystem-bound-1",
      result: {
        permissions: {},
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

  it("can auto-resolve server requests through a context-rich host callback", async () => {
    const contexts: unknown[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        decide: (context) => {
          contexts.push(context);
          if (context.kind !== "userInput") return undefined;
          return {
            action: "respond",
            auditAction: "answer",
            response: {
              content: [{ text: "Use the fixture target.", type: "inputText" }],
            },
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
        id: "input-active-1",
        method: "item/tool/requestUserInput",
        params: {
          itemId: "tool-input-1",
          prompt: "Which target should the bridge verify?",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );

    await waitFor(() => writes.some((line) => JSON.parse(line).id === "input-active-1"));
    expect(contexts).toEqual([
      expect.objectContaining({
        kind: "userInput",
        payload: expect.objectContaining({
          prompt: "Which target should the bridge verify?",
        }),
        requestId: "input-active-1",
        threadId: "active-thread-1",
        turnId: "turn-1",
      }),
    ]);
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "input-active-1")).toEqual({
      id: "input-active-1",
      result: {
        content: [{ text: "Use the fixture target.", type: "inputText" }],
      },
    });
    await transport.close();
  });

  it("lets the context-rich host callback force manual handling before fallback policy", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        commandExecution: () => ({ action: "accept" }),
        decide: (context) =>
          context.kind === "commandApproval" ? { action: "manual" } : undefined,
      },
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "command-manual-callback-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "open -a 'Google Chrome'",
          cwd: "/tmp/project",
          itemId: "cmd-manual-callback",
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
          id: "command-manual-callback-1",
          kind: "commandApproval",
        },
        type: "serverRequest/created",
      },
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "command-manual-callback-1" && "result" in message)).toBeUndefined();
    await transport.close();
  });

  it("keeps server requests manual when the context-rich host callback throws", async () => {
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        commandExecution: () => ({ action: "accept" }),
        decide: () => {
          throw new Error("token=server-request-policy-secret");
        },
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
        id: "command-throwing-callback-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "open -a 'Google Chrome'",
          cwd: "/tmp/project",
          itemId: "cmd-throwing-callback",
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
          id: "command-throwing-callback-1",
          kind: "commandApproval",
        },
        type: "serverRequest/created",
      },
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "command-throwing-callback-1" && "result" in message)).toBeUndefined();
    expect(logs.join("")).toContain("server request policy failed");
    expect(logs.join("")).toContain("token=[REDACTED]");
    expect(logs.join("")).not.toContain("server-request-policy-secret");
    await transport.close();
  });

  it("can auto-accept command and file approvals through context callbacks", async () => {
    const commandContexts: unknown[] = [];
    const fileContexts: unknown[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        commandExecution: (context) => {
          commandContexts.push(context);
          if (context.cwd === "/tmp/project" && context.command === "open -a 'Google Chrome'") {
            return { action: "accept", scope: "session" };
          }
          return { action: "manual" };
        },
        fileChange: (context) => {
          fileContexts.push(context);
          if (context.grantRoot === "/tmp/project") {
            return { action: "accept", scope: "session" };
          }
          return { action: "manual" };
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
          grantRoot: "/tmp/project",
          itemId: "file-1",
          reason: "Allow patch for fixture project",
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
    expect(commandContexts).toEqual([
      expect.objectContaining({
        command: "open -a 'Google Chrome'",
        cwd: "/tmp/project",
        itemId: "cmd-1",
        requestId: "command-active-1",
        threadId: "active-thread-1",
        turnId: "turn-1",
      }),
    ]);
    expect(fileContexts).toEqual([
      expect.objectContaining({
        grantRoot: "/tmp/project",
        itemId: "file-1",
        reason: "Allow patch for fixture project",
        requestId: "file-active-1",
        threadId: "active-thread-1",
        turnId: "turn-1",
      }),
    ]);
    await transport.close();
  });

  it("does not auto-accept command and file approvals from legacy broad string policies", async () => {
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      serverRequestPolicy: {
        commandExecution: "acceptForSession",
        fileChange: "acceptForSession",
      } as unknown as AgentUiWebSocketBridgeOptions["serverRequestPolicy"],
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        id: "command-legacy-string-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "rm -rf /tmp/project",
          cwd: "/tmp/project",
          itemId: "cmd-legacy-string",
          threadId: "active-thread-1",
          turnId: "turn-1",
        },
      })}\n`,
    );
    stdout.write(
      `${JSON.stringify({
        id: "file-legacy-string-1",
        method: "item/fileChange/requestApproval",
        params: {
          grantRoot: "/tmp/project",
          itemId: "file-legacy-string",
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
          id: "command-legacy-string-1",
          kind: "commandApproval",
        },
        type: "serverRequest/created",
      },
    });
    await expect(
      nextTransportEvent(transport, (candidate) => {
        return candidate.event?.type === "serverRequest/created";
      }),
    ).resolves.toMatchObject({
      event: {
        request: {
          id: "file-legacy-string-1",
          kind: "fileChangeApproval",
        },
        type: "serverRequest/created",
      },
    });
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "command-legacy-string-1" && "result" in message)).toBeUndefined();
    expect(writes.map((line) => JSON.parse(line)).find((message) => message.id === "file-legacy-string-1" && "result" in message)).toBeUndefined();
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

  it("emits bridge health lifecycle, pending request count, and redacted diagnostics", async () => {
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
    const logs: string[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
      stderr: (line) => logs.push(line),
    });

    const connected = transport.connect();
    await waitFor(() => healthEvents.some((event) => event.phase === "processSpawned"));
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;
    await waitFor(() => healthEvents.some((event) => event.phase === "connected"));

    stdout.write(
      `${JSON.stringify({
        id: "health-command-1",
        method: "item/commandExecution/requestApproval",
        params: {
          command: "echo token=health-secret",
          threadId: "thread-health",
          turnId: "turn-health",
        },
      })}\n`,
    );

    await nextTransportEvent(transport, (candidate) => candidate.type === "request");
    await waitFor(() =>
      healthEvents.some(
        (event) => event.phase === "pendingRequestCount" && event.state.pendingRequestCount === 1,
      ),
    );
    await transport.respond("unknown-health-command", { decision: "decline" });
    await waitFor(() =>
      writes.some((line) => {
        const message = JSON.parse(line) as { id?: unknown };
        return message.id === "unknown-health-command";
      }),
    );
    expect(healthEvents.findLast((event) => event.phase === "pendingRequestCount")?.state.pendingRequestCount).toBe(1);
    await transport.respond("health-command-1", { decision: "decline" });
    await waitFor(() =>
      healthEvents.some(
        (event) => event.phase === "pendingRequestCount" && event.state.pendingRequestCount === 0,
      ),
    );

    expect(healthEvents.map((event) => event.phase)).toEqual(
      expect.arrayContaining([
        "admissionChecked",
        "processSpawned",
        "initialized",
        "connected",
        "pendingRequestCount",
        "diagnostic",
      ]),
    );
    const connectedHealth = healthEvents.find((event) => event.phase === "connected");
    expect(connectedHealth?.audience).toEqual(["developer", "audit"]);
    expect(connectedHealth?.state).toMatchObject({
      admissionChecked: true,
      connected: true,
      initialized: true,
      processSpawned: true,
    });
    const lastDiagnostic = healthEvents.findLast((event) => event.phase === "diagnostic");
    expect(lastDiagnostic?.state.lastRedactedDiagnostic).toContain("request kind=commandApproval");
    expect(JSON.stringify(healthEvents)).not.toContain("health-secret");
    expect(logs.join("")).not.toContain("health-secret");
    await transport.close();
  });

  it("emits bridge health idle closure", async () => {
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
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
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
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
    expect(healthEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          closeCode: 1000,
          closeReason: "Agent UI bridge idle timeout",
          phase: "idleClosed",
        }),
      ]),
    );
    client.close();
  });

  it("emits bridge health backpressure closure", async () => {
    const healthEvents: AgentUiBridgeHealthEvent[] = [];
    const { stdout, transport, writes } = await createBridgeBackedTransport({
      hostEvents: {
        onBridgeHealthEvent: (event) => healthEvents.push(event),
      },
      maxBufferedBytes: 1024,
    });

    const connected = transport.connect();
    await waitFor(() => writes.length === 1);
    const init = JSON.parse(writes[0] ?? "{}") as { id: number; method: string };
    stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
    await connected;

    stdout.write(
      `${JSON.stringify({
        method: "thread/name/updated",
        params: { name: "x".repeat(2048), threadId: "thread-backpressure" },
      })}\n`,
    );

    await waitFor(() => healthEvents.some((event) => event.phase === "backpressureClosed"));
    expect(healthEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          closeCode: 1013,
          closeReason: "Agent UI bridge backpressure limit exceeded",
          phase: "backpressureClosed",
        }),
      ]),
    );
    await transport.close().catch(() => undefined);
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

    expect(event.message).toContain("Authorization: [REDACTED]");
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

async function createStartedDynamicHelper(
  options: Pick<AgentUiWebSocketBridgeOptions, "resolveBridgeOptions"> & {
    helperPermissions?: DynamicToolHelperPermissionPolicy;
  } = {},
) {
  const setup = await createBridgeBackedTransport({
    dynamicToolPolicy: {
      handler: createMcpDynamicToolHandler({
        tools: [
          {
            namespace: "mcp__computer_use__",
            server: "computer-use",
            tools: ["get_app_state"],
          },
        ],
      }),
      helperPermissions: options.helperPermissions,
      mode: "host-callback",
    },
    resolveBridgeOptions: options.resolveBridgeOptions,
  });
  const { stdout, transport, writes } = setup;
  const connected = transport.connect();
  await waitFor(() => writes.length === 1);
  const init = JSON.parse(writes[0] ?? "{}") as { id: number };
  stdout.write(`${JSON.stringify({ id: init.id, result: { userAgent: "test" } })}\n`);
  await connected;

  stdout.write(
    `${JSON.stringify({
      id: "dynamic-helper-start",
      method: "item/tool/call",
      params: {
        callId: "call-helper-start",
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
      result: { thread: { id: "helper-thread-policy" } },
    })}\n`,
  );
  await waitFor(() =>
    writes.some((line) => JSON.parse(line).method === "mcpServer/tool/call"),
  );
  return setup;
}

async function createBridgeBackedTransport(
  options: Pick<
    AgentUiWebSocketBridgeOptions,
    | "dynamicToolPolicy"
    | "hostEvents"
    | "maxBufferedBytes"
    | "resolveBridgeOptions"
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
    | "bridgePolicy"
    | "dynamicToolPolicy"
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

function createSocketTestProcess(): CodexChildProcess {
  return {
    kill: () => true,
    stderr: new PassThrough(),
    stdin: new PassThrough(),
    stdout: new PassThrough(),
  };
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

function rawUpgradeResponse(
  port: number,
  path: string,
): Promise<{ body: string; headers: string; status: number; statusLine: string }> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, "127.0.0.1");
    let data = "";
    socket.setEncoding("utf8");
    socket.on("connect", () => {
      socket.write(
        [
          `GET ${path} HTTP/1.1`,
          `Host: 127.0.0.1:${port}`,
          "Connection: Upgrade",
          "Upgrade: websocket",
          "Sec-WebSocket-Version: 13",
          "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
          "",
          "",
        ].join("\r\n"),
      );
    });
    socket.on("data", (chunk) => {
      data += chunk;
    });
    socket.on("error", reject);
    socket.on("close", () => {
      const [head = "", body = ""] = data.split("\r\n\r\n");
      const [statusLine = "", ...headerLines] = head.split("\r\n");
      const status = Number(statusLine.match(/^HTTP\/1\.1\s+(\d+)/)?.[1] ?? 0);
      resolve({
        body,
        headers: headerLines.join("\n"),
        status,
        statusLine,
      });
    });
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
