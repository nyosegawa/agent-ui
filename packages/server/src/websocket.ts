import {
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  parseJsonRpcLine,
} from "@nyosegawa/agent-ui-codex";
import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type { Server } from "node:http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";
import * as dynamicTools from "./dynamic-tools";
import type { AgentUiHostEventSink } from "./host-events";
import { emitHostEvent } from "./host-events";
import * as requestPolicy from "./server-request-policy";

export interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
  dynamicToolHandler?: DynamicToolHandler;
  hostEvents?: AgentUiHostEventSink;
  idleTimeoutMs?: number | false;
  /**
   * Policy for server requests that can block a turn. Defaults to manual forwarding
   * so application UIs stay in control unless they explicitly opt in.
   */
  serverRequestPolicy?: ServerRequestPolicy;
  path?: string;
}

export interface AgentUiWebSocketServerOptions extends AgentUiWebSocketBridgeOptions {
  server: Server;
}

type ServerRequestPolicy = requestPolicy.ServerRequestPolicy;
type DynamicToolHandler = dynamicTools.DynamicToolHandler;

const DEFAULT_PATH = "/agent-ui/ws";
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

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
  options: AgentUiWebSocketBridgeOptions = {},
): void {
  const {
    dynamicToolHandler = dynamicTools.defaultDynamicToolHandler,
    hostEvents,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    serverRequestPolicy,
    ...bridgeOptions
  } = options;
  const bridge = createCodexAppServerBridge(bridgeOptions);
  const effectiveServerRequestPolicy =
    requestPolicy.resolveServerRequestPolicy(serverRequestPolicy);
  const log = (message: string) => {
    bridgeOptions.stderr?.(`[agent-ui] ${message}\n`);
  };
  let closed = false;
  let dynamicToolHelperThreadId: Promise<string> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const getMcpThreadId = () => {
    dynamicToolHelperThreadId ??= dynamicTools.createDynamicToolHelperThread(
      bridge.transport,
      bridgeOptions.cwd,
    );
    return dynamicToolHelperThreadId;
  };

  const closeBridge = () => {
    if (closed) return;
    closed = true;
    if (idleTimer) clearTimeout(idleTimer);
    void bridge.close().catch(() => undefined);
  };
  const resetIdleTimer = () => {
    if (idleTimeoutMs === false) return;
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      socket.close(1000, "Agent UI bridge idle timeout");
      closeBridge();
    }, idleTimeoutMs);
    idleTimer.unref?.();
  };

  socket.on("close", closeBridge);
  socket.on("error", closeBridge);
  resetIdleTimer();

  void bridge.transport
    .connect()
    .then(async () => {
      for await (const event of bridge.transport.events) {
        if (event.type === "response") continue;
        emitHostEvent(hostEvents, event);
        resetIdleTimer();
        if (event.type === "request" && event.request) {
          log(
            `request kind=${event.request.kind} id=${event.requestId ?? event.request.id} thread=${threadIdFromRequest(event.request) ?? "(none)"}`,
          );
        }
        const dynamicToolCreatedRequest =
          event.event?.type === "serverRequest/created" &&
          event.event.request.kind === "dynamicTool"
            ? event.event.request
            : undefined;
        if (dynamicToolCreatedRequest) {
          log(
            `dynamic tool request created id=${dynamicToolCreatedRequest.id} thread=${threadIdFromRequest(dynamicToolCreatedRequest) ?? "(none)"}`,
          );
          continue;
        }
        if (await dynamicTools.maybeResolveHelperThreadRequest(event, bridge.transport, dynamicToolHelperThreadId)) {
          log(`auto-resolved helper request id=${event.requestId}`);
          continue;
        }
        const serverRequestDecision = requestPolicy.responseForServerRequest(
          event,
          effectiveServerRequestPolicy,
        );
        if (serverRequestDecision) {
          await bridge.transport.respond(
            serverRequestDecision.requestId,
            serverRequestDecision.response,
          );
          log(
            `auto-resolved ${serverRequestDecision.kind} id=${serverRequestDecision.requestId} action=${serverRequestDecision.action}`,
          );
          continue;
        }
        if (isDynamicToolRequestEvent(event)) {
          log(
            `handling dynamic tool id=${event.requestId} thread=${threadIdFromRequest(event.request) ?? "(none)"}`,
          );
          void dynamicTools.handleDynamicToolRequest(
            event,
            bridge.transport,
            dynamicToolHandler,
            getMcpThreadId,
          ).catch((error: unknown) => {
            log(
              `dynamic tool failed id=${event.requestId} message=${error instanceof Error ? error.message : String(error)}`,
            );
            void bridge.transport
              .respond(event.requestId, dynamicTools.dynamicToolFailure(error))
              .catch(() => undefined);
          });
          continue;
        }
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
    resetIdleTimer();
    void handleClientMessage(socket, bridge.transport, data).catch((error: unknown) => {
      sendEnvelope(socket, {
        error: { message: error instanceof Error ? error.message : String(error) },
        type: "error",
      });
    });
  });
}

function threadIdFromRequest(request: PendingServerRequest): string | undefined {
  const payload = isRecord(request.payload) ? request.payload : undefined;
  const value = request.threadId ?? payload?.threadId ?? payload?.thread_id;
  return typeof value === "string" ? value : undefined;
}

function isDynamicToolRequestEvent(
  event: AgentTransportEvent,
): event is AgentTransportEvent & {
  request: PendingServerRequest;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
} {
  return (
    event.type === "request" &&
    event.request?.kind === "dynamicTool" &&
    event.requestId !== undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
