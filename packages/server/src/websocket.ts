import {
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  jsonRpcErrorPayload,
  parseJsonRpcLine,
} from "@nyosegawa/agent-ui-codex";
import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type { IncomingMessage, Server } from "node:http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import { createCodexAppServerBridge, type CodexAppServerBridgeOptions } from "./bridge";
import * as dynamicTools from "./dynamic-tools";
import type { AgentUiHostEventSink } from "./host-events";
import { emitHostEvent } from "./host-events";
import * as requestPolicy from "./server-request-policy";
import { redactStructuredValue, redactTransportEvent } from "./redaction";
import {
  createWebSocketBackpressureGuard,
  sendJsonWithBackpressure,
  type WebSocketBackpressureOptions,
} from "./websocket-backpressure";

export interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
  admission?: AgentUiBridgeAdmissionHook;
  dynamicToolHandler?: DynamicToolHandler;
  hostEvents?: AgentUiHostEventSink;
  idleTimeoutMs?: number | false;
  /**
   * Maximum browser socket output buffer before the bridge closes the session
   * with 1013. Set to false only for host-owned experiments.
   */
  maxBufferedBytes?: WebSocketBackpressureOptions["maxBufferedBytes"];
  inbound?: AgentUiWebSocketInboundLimits;
  /**
   * Policy for server requests that can block a turn. Defaults to manual forwarding
   * so application UIs stay in control unless they explicitly opt in.
   */
  serverRequestPolicy?: ServerRequestPolicy;
  path?: string;
  browserMethodPolicy?: BrowserMethodPolicy;
}

export interface AgentUiWebSocketInboundLimits {
  maxMessageBytes?: number;
  rateLimitIntervalMs?: number;
  rateLimitMessages?: number;
}

export interface AgentUiWebSocketServerOptions extends AgentUiWebSocketBridgeOptions {
  server: Server;
}

type ServerRequestPolicy = requestPolicy.ServerRequestPolicy;
type DynamicToolHandler = dynamicTools.DynamicToolHandler;
export type AgentUiBridgeAdmissionHook = (
  request: IncomingMessage,
) => boolean | Promise<boolean>;
export type BrowserMethodPolicy =
  | "productized"
  | "all"
  | {
      allowedMethods?: readonly string[];
      allowedNotifications?: readonly string[];
    };

const DEFAULT_PATH = "/agent-ui/ws";
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_INBOUND_MESSAGE_BYTES = 256 * 1024;
const DEFAULT_INBOUND_RATE_LIMIT_INTERVAL_MS = 1_000;
const DEFAULT_INBOUND_RATE_LIMIT_MESSAGES = 60;
const DEFAULT_BROWSER_REQUEST_METHODS = new Set([
  "initialize",
  "account/read",
  "account/login/start",
  "account/login/cancel",
  "account/logout",
  "account/rateLimits/read",
  "model/list",
  "thread/start",
  "thread/resume",
  "thread/fork",
  "thread/list",
  "thread/loaded/list",
  "thread/read",
  "thread/archive",
  "thread/unarchive",
  "thread/name/set",
  "thread/metadata/update",
  "thread/compact/start",
  "thread/rollback",
  "thread/inject_items",
  "thread/unsubscribe",
  "turn/start",
  "turn/steer",
  "turn/interrupt",
  "skills/list",
  "skills/config/write",
  "hooks/list",
  "app/list",
]);
const DEFAULT_BROWSER_NOTIFICATION_METHODS = new Set(["initialized"]);

export function attachAgentUiWebSocketBridge(
  options: AgentUiWebSocketServerOptions,
): WebSocketServer {
  const { path = DEFAULT_PATH, server, ...bridgeOptions } = options;
  const webSocketServer = new WebSocketServer({ path, server });
  webSocketServer.on("connection", (socket, request) => {
    void handleAgentUiWebSocketConnection(socket, bridgeOptions, request);
  });
  return webSocketServer;
}

export async function handleAgentUiWebSocketConnection(
  socket: WebSocket,
  options: AgentUiWebSocketBridgeOptions = {},
  request?: IncomingMessage,
): Promise<void> {
  const {
    admission,
    browserMethodPolicy,
    dynamicToolHandler,
    hostEvents,
    inbound,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    maxBufferedBytes,
    serverRequestPolicy,
    ...bridgeOptions
  } = options;
  if (admission && request) {
    const accepted = await admission(request);
    if (!accepted) {
      socket.close(1008, "Agent UI bridge admission rejected");
      return;
    }
  }
  const methodPolicy = resolveBrowserMethodPolicy(browserMethodPolicy);
  const inboundGuard = createInboundGuard(inbound);
  const bridge = createCodexAppServerBridge(bridgeOptions);
  const bridgeOwnsInitialize = bridgeOptions.initialize !== undefined;
  const backpressure = createWebSocketBackpressureGuard({ maxBufferedBytes });
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
        const safeEvent = redactTransportEvent(event);
        emitHostEvent(hostEvents, safeEvent);
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
          if (!dynamicToolHandler) {
            await bridge.transport.respond(
              event.requestId,
              dynamicTools.dynamicToolFailure("Dynamic tool handling is disabled by host policy"),
            );
            continue;
          }
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
        sendEnvelope(socket, backpressure, safeEvent);
      }
    })
    .catch((error: unknown) => {
      sendEnvelope(socket, backpressure, {
        error: { message: error instanceof Error ? error.message : String(error) },
        type: "error",
      });
      closeBridge();
    });

  socket.on("message", (data) => {
    resetIdleTimer();
    const inboundDecision = inboundGuard(data);
    if (inboundDecision.allowed === false) {
      socket.close(inboundDecision.code, inboundDecision.reason);
      closeBridge();
      return;
    }
    void handleClientMessage(
      socket,
      bridge.transport,
      backpressure,
      data,
      methodPolicy,
      bridgeOwnsInitialize,
    ).catch((error: unknown) => {
      sendEnvelope(socket, backpressure, {
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
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  data: RawData,
  methodPolicy: ResolvedBrowserMethodPolicy,
  bridgeOwnsInitialize: boolean,
): Promise<void> {
  const message = parseJsonRpcLine(data.toString()) as unknown;
  if (isJsonRpcRequest(message)) {
    if (bridgeOwnsInitialize && message.method === "initialize") {
      sendJsonRpcError(socket, backpressure, message.id, {
        code: -32600,
        data: { method: message.method },
        message: "Browser initialize is not allowed when the bridge owns initialization",
      });
      return;
    }
    if (!methodPolicy.requests.has("*") && !methodPolicy.requests.has(message.method)) {
      sendJsonRpcError(socket, backpressure, message.id, {
        code: -32601,
        data: { method: message.method },
        message: `Browser method is not allowed: ${message.method}`,
      });
      return;
    }
    try {
      const result = await transport.request(message.method, message.params, {
        ...(message.trace === undefined ? {} : { trace: message.trace }),
      });
      sendJson(socket, backpressure, { id: message.id, result });
    } catch (error) {
      sendJsonRpcError(socket, backpressure, message.id, jsonRpcErrorPayload(error));
    }
    return;
  }

  if (isJsonRpcNotification(message)) {
    if (!methodPolicy.notifications.has(message.method)) return;
    transport.notify(message.method, message.params);
    return;
  }

  if (isJsonRpcResponse(message)) {
    if ("error" in message) await transport.reject(message.id, message.error);
    else await transport.respond(message.id, message.result);
    return;
  }

  if (isRecord(message) && "id" in message) {
    sendJsonRpcError(socket, backpressure, message.id, {
      code: -32600,
      data: { message },
      message: "Invalid JSON-RPC message",
    });
  }
}

function rawDataByteLength(data: RawData): number {
  if (typeof data === "string") return Buffer.byteLength(data);
  if (Buffer.isBuffer(data)) return data.byteLength;
  if (Array.isArray(data)) return data.reduce((total, chunk) => total + chunk.byteLength, 0);
  return data.byteLength;
}

function createInboundGuard(options: AgentUiWebSocketInboundLimits = {}) {
  const maxMessageBytes = options.maxMessageBytes ?? DEFAULT_MAX_INBOUND_MESSAGE_BYTES;
  const rateLimitMessages =
    options.rateLimitMessages ?? DEFAULT_INBOUND_RATE_LIMIT_MESSAGES;
  const rateLimitIntervalMs =
    options.rateLimitIntervalMs ?? DEFAULT_INBOUND_RATE_LIMIT_INTERVAL_MS;
  let windowStartedAt = Date.now();
  let count = 0;
  return (data: RawData): { allowed: true } | { allowed: false; code: number; reason: string } => {
    if (rawDataByteLength(data) > maxMessageBytes) {
      return {
        allowed: false,
        code: 1009,
        reason: "Agent UI bridge inbound message exceeds size limit",
      };
    }
    const now = Date.now();
    if (now - windowStartedAt >= rateLimitIntervalMs) {
      windowStartedAt = now;
      count = 0;
    }
    count += 1;
    if (count > rateLimitMessages) {
      return {
        allowed: false,
        code: 1008,
        reason: "Agent UI bridge inbound rate limit exceeded",
      };
    }
    return { allowed: true };
  };
}

interface ResolvedBrowserMethodPolicy {
  notifications: Set<string>;
  requests: Set<string>;
}

function resolveBrowserMethodPolicy(policy?: BrowserMethodPolicy): ResolvedBrowserMethodPolicy {
  if (policy === "all") {
    return {
      notifications: new Set(["initialized"]),
      requests: new Set(["*"]),
    };
  }
  if (policy && typeof policy === "object") {
    return {
      notifications: new Set(policy.allowedNotifications ?? ["initialized"]),
      requests: new Set(policy.allowedMethods ?? DEFAULT_BROWSER_REQUEST_METHODS),
    };
  }
  return {
    notifications: DEFAULT_BROWSER_NOTIFICATION_METHODS,
    requests: DEFAULT_BROWSER_REQUEST_METHODS,
  };
}

function sendEnvelope(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  event: AgentTransportEvent,
): void {
  sendJson(socket, backpressure, { event: redactTransportEvent(event), type: "agent-ui/transport-event" });
}

function sendJson(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  value: unknown,
): void {
  sendJsonWithBackpressure(socket, backpressure, value);
}

function sendJsonRpcError(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  id: unknown,
  error: unknown,
): void {
  sendJson(socket, backpressure, {
    error: redactStructuredValue(error),
    id,
  });
}
