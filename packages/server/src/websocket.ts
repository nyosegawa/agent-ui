import {
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  parseJsonRpcLine,
} from "@nyosegawa/agent-ui-codex";
import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";
import type { Server } from "node:http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";

export interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
  path?: string;
}

export interface AgentUiWebSocketServerOptions extends AgentUiWebSocketBridgeOptions {
  server: Server;
}

const DEFAULT_PATH = "/agent-ui/ws";

export function attachAgentUiWebSocketBridge(
  options: AgentUiWebSocketServerOptions,
): WebSocketServer {
  const { path = DEFAULT_PATH, server, ...bridgeOptions } = options;
  const webSocketServer = new WebSocketServer({ path, server });
  webSocketServer.on("connection", (socket) => {
    handleAgentUiWebSocketConnection(socket, bridgeOptions);
  });
  return webSocketServer;
}

export function handleAgentUiWebSocketConnection(
  socket: WebSocket,
  options: CodexAppServerBridgeOptions = {},
): void {
  const bridge = createCodexAppServerBridge(options);
  let closed = false;

  const closeBridge = () => {
    if (closed) return;
    closed = true;
    void bridge.close().catch(() => undefined);
  };

  socket.on("close", closeBridge);
  socket.on("error", closeBridge);

  void bridge.transport
    .connect()
    .then(async () => {
      for await (const event of bridge.transport.events) {
        if (event.type === "response") continue;
        sendEnvelope(socket, event);
      }
    })
    .catch((error: unknown) => {
      sendEnvelope(socket, {
        error: { message: error instanceof Error ? error.message : String(error) },
        type: "error",
      });
      closeBridge();
    });

  socket.on("message", (data) => {
    void handleClientMessage(socket, bridge.transport, data).catch((error: unknown) => {
      sendEnvelope(socket, {
        error: { message: error instanceof Error ? error.message : String(error) },
        type: "error",
      });
    });
  });
}

async function handleClientMessage(
  socket: WebSocket,
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  data: RawData,
): Promise<void> {
  const message = parseJsonRpcLine(data.toString());
  if (isJsonRpcRequest(message)) {
    try {
      const result = await transport.request(message.method, message.params);
      sendJson(socket, { id: message.id, result });
    } catch (error) {
      sendJson(socket, {
        error: { message: error instanceof Error ? error.message : String(error) },
        id: message.id,
      });
    }
    return;
  }

  if (isJsonRpcNotification(message)) {
    transport.notify(message.method, message.params);
    return;
  }

  if (isJsonRpcResponse(message)) {
    if ("error" in message) await transport.reject(message.id, message.error);
    else await transport.respond(message.id, message.result);
  }
}

function sendEnvelope(socket: WebSocket, event: AgentTransportEvent): void {
  sendJson(socket, { event, type: "agent-ui/transport-event" });
}

function sendJson(socket: WebSocket, value: unknown): void {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify(value));
}
