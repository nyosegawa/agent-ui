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
import type { DynamicToolDebugEvent, DynamicToolDebugEventDetails } from "./dynamic-tools";
import type {
  AgentUiBridgeHealthEvent,
  AgentUiBridgeHealthPhase,
  AgentUiBridgeHealthState,
  AgentUiHostEventSink,
} from "./host-events";
import { emitHostEvent } from "./host-events";
import * as requestPolicy from "./server-request-policy";
import { redactSecrets, redactStructuredValue, redactTransportEvent } from "./redaction";
import {
  createWebSocketBackpressureGuard,
  sendJsonWithBackpressure,
  type WebSocketBackpressureOptions,
} from "./websocket-backpressure";

export interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
  admission?: AgentUiBridgeAdmissionHook;
  bridgePolicy?: AgentUiBridgePolicy;
  dynamicToolPolicy?: AgentUiDynamicToolPolicy;
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
export type AgentUiDynamicToolPolicy =
  | { mode: "disabled" }
  | {
      handler: dynamicTools.DynamicToolHandler;
      helperPermissions?: dynamicTools.DynamicToolHelperPermissionPolicy;
      mode: "host-callback";
    };
export type AgentUiBridgeAdmissionHook = (
  request: IncomingMessage,
) => boolean | Promise<boolean>;
export interface AgentUiBridgePolicy {
  admission?: AgentUiBridgeAdmissionPolicy;
}
export type AgentUiBridgeAdmissionPolicy =
  | { mode: "local-loopback" }
  | { mode: "host-callback"; admit: AgentUiBridgeAdmissionHook }
  | { mode: "unsafe-no-admission"; reason: string };
export type BrowserMethodPolicy =
  | "productized"
  | "all"
  | {
      capabilities?: readonly BrowserMethodCapability[];
    };
export type BrowserMethodCapability =
  | "connection"
  | "account"
  | "models"
  | "threadHistory"
  | "threadLifecycle"
  | "turns"
  | "skills"
  | "hooks"
  | "apps";

const DEFAULT_PATH = "/agent-ui/ws";
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_INBOUND_MESSAGE_BYTES = 256 * 1024;
const DEFAULT_INBOUND_RATE_LIMIT_INTERVAL_MS = 1_000;
const DEFAULT_INBOUND_RATE_LIMIT_MESSAGES = 60;
const DISABLED_DYNAMIC_TOOL_POLICY = { mode: "disabled" } as const satisfies AgentUiDynamicToolPolicy;
const DEFAULT_BROWSER_METHOD_CAPABILITIES = [
  "connection",
  "account",
  "models",
  "threadHistory",
  "threadLifecycle",
  "turns",
  "skills",
  "hooks",
  "apps",
] as const satisfies readonly BrowserMethodCapability[];
const BROWSER_METHOD_CAPABILITIES: Record<
  BrowserMethodCapability,
  { notifications?: readonly string[]; requests?: readonly string[] }
> = {
  account: {
    requests: [
      "account/read",
      "account/login/start",
      "account/login/cancel",
      "account/logout",
      "account/rateLimits/read",
    ],
  },
  apps: { requests: ["app/list"] },
  connection: { notifications: ["initialized"], requests: ["initialize"] },
  hooks: { requests: ["hooks/list"] },
  models: { requests: ["model/list"] },
  skills: { requests: ["skills/list", "skills/config/write"] },
  threadHistory: {
    requests: [
      "thread/list",
      "thread/loaded/list",
      "thread/read",
      "thread/archive",
      "thread/unarchive",
    ],
  },
  threadLifecycle: {
    requests: [
      "thread/start",
      "thread/resume",
      "thread/fork",
      "thread/name/set",
      "thread/metadata/update",
      "thread/compact/start",
      "thread/rollback",
      "thread/inject_items",
      "thread/unsubscribe",
    ],
  },
  turns: { requests: ["turn/start", "turn/steer", "turn/interrupt"] },
};

export function attachAgentUiWebSocketBridge(
  options: AgentUiWebSocketServerOptions,
): WebSocketServer {
  const { path = DEFAULT_PATH, server, ...bridgeOptions } = options;
  const webSocketServer = new WebSocketServer({
    maxPayload: bridgeOptions.inbound?.maxMessageBytes ?? DEFAULT_MAX_INBOUND_MESSAGE_BYTES,
    path,
    server,
  });
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
    bridgePolicy,
    browserMethodPolicy,
    dynamicToolPolicy,
    hostEvents,
    inbound,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    maxBufferedBytes,
    serverRequestPolicy,
    ...bridgeOptions
  } = options;
  const bridgeHealth: AgentUiBridgeHealthState = {
    admissionChecked: false,
    connected: false,
    initialized: false,
    pendingRequestCount: 0,
    processSpawned: false,
  };
  const emitBridgeHealthEvent = (
    phase: AgentUiBridgeHealthPhase,
    extra: Omit<AgentUiBridgeHealthEvent, "audience" | "phase" | "state" | "timestamp" | "type"> = {},
  ) => {
    try {
      hostEvents?.onBridgeHealthEvent?.({
        ...extra,
        audience: ["developer", "audit"],
        phase,
        state: { ...bridgeHealth },
        timestamp: Date.now(),
        type: "bridgeHealth",
      });
    } catch (error) {
      bridgeOptions.stderr?.(
        redactSecrets(
          `[agent-ui] bridge health event sink failed phase=${phase} message=${error instanceof Error ? error.message : String(error)}\n`,
        ),
      );
    }
  };
  const setBridgeDiagnostic = (message: string) => {
    const diagnostic = redactSecrets(`[agent-ui] ${message}\n`);
    bridgeHealth.lastRedactedDiagnostic = diagnostic;
    emitBridgeHealthEvent("diagnostic", { diagnostic });
    return diagnostic;
  };
  const admissionPolicy = resolveBridgeAdmissionPolicy({ admission, bridgePolicy });
  const admissionResult = await checkBridgeAdmission({
    policy: admissionPolicy,
    request,
    stderr: bridgeOptions.stderr,
  });
  bridgeHealth.admissionChecked = true;
  emitBridgeHealthEvent("admissionChecked", {
    ...(admissionResult.accepted === false
      ? {
          closeCode: admissionResult.closeCode,
          closeReason: admissionResult.reason,
        }
      : {}),
  });
  if (admissionResult.accepted === false) {
    socket.close(admissionResult.closeCode, admissionResult.reason);
    return;
  }
  let methodPolicy: ResolvedBrowserMethodPolicy;
  try {
    methodPolicy = resolveBrowserMethodPolicy(browserMethodPolicy);
  } catch (error) {
    const diagnostic = setBridgeDiagnostic(
      `browser method policy failed message=${error instanceof Error ? error.message : String(error)}`,
    );
    bridgeOptions.stderr?.(
      diagnostic,
    );
    socket.close(1011, "Agent UI bridge browser method policy failed");
    return;
  }
  const inboundGuard = createInboundGuard(inbound);
  const log = (message: string) => {
    bridgeOptions.stderr?.(setBridgeDiagnostic(message));
  };
  let bridge: ReturnType<typeof createCodexAppServerBridge>;
  try {
    bridge = createCodexAppServerBridge(bridgeOptions);
    bridgeHealth.processSpawned = true;
    emitBridgeHealthEvent("processSpawned");
  } catch (error) {
    log(`startup failed message=${error instanceof Error ? error.message : String(error)}`);
    socket.close(1011, "Agent UI bridge startup failed");
    return;
  }
  const bridgeOwnsInitialize = bridgeOptions.initialize !== undefined;
  const backpressure = createWebSocketBackpressureGuard({ maxBufferedBytes });
  const effectiveServerRequestPolicy =
    requestPolicy.resolveServerRequestPolicy(serverRequestPolicy);
  const effectiveDynamicToolPolicy = dynamicToolPolicy ?? DISABLED_DYNAMIC_TOOL_POLICY;
  const dynamicToolHelperPermissionPolicy =
    effectiveDynamicToolPolicy.mode === "host-callback"
      ? effectiveDynamicToolPolicy.helperPermissions
      : undefined;
  const emitDynamicToolEvent = (event: DynamicToolDebugEvent) => {
    try {
      hostEvents?.onDynamicToolEvent?.(event);
    } catch (error) {
      log(
        `dynamic tool host event sink failed phase=${event.phase} id=${event.requestId} message=${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };
  let closed = false;
  let dynamicToolHelperThreadId: Promise<string> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const pendingRequestIds = new Set<NonNullable<AgentTransportEvent["requestId"]>>();
  const incrementPendingRequestCount = (requestId: NonNullable<AgentTransportEvent["requestId"]>) => {
    pendingRequestIds.add(requestId);
    bridgeHealth.pendingRequestCount = pendingRequestIds.size;
    emitBridgeHealthEvent("pendingRequestCount");
  };
  const decrementPendingRequestCount = (requestId: NonNullable<AgentTransportEvent["requestId"]>) => {
    if (!pendingRequestIds.delete(requestId)) return;
    bridgeHealth.pendingRequestCount = pendingRequestIds.size;
    emitBridgeHealthEvent("pendingRequestCount");
  };
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
      const closeReason = "Agent UI bridge idle timeout";
      socket.close(1000, closeReason);
      emitBridgeHealthEvent("idleClosed", { closeCode: 1000, closeReason });
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
      bridgeHealth.initialized = true;
      emitBridgeHealthEvent("initialized");
      bridgeHealth.connected = true;
      emitBridgeHealthEvent("connected");
      for await (const event of bridge.transport.events) {
        if (event.type === "response") continue;
        const safeEvent = redactTransportEvent(event);
        emitHostEvent(hostEvents, safeEvent);
        resetIdleTimer();
        if (event.type === "request" && event.requestId !== undefined) {
          incrementPendingRequestCount(event.requestId);
        }
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
        if (
          await dynamicTools.maybeResolveHelperThreadRequest(
            event,
            bridge.transport,
            dynamicToolHelperThreadId,
            dynamicToolHelperPermissionPolicy,
          )
        ) {
          log(`auto-resolved helper request id=${event.requestId}`);
          if (event.requestId !== undefined) decrementPendingRequestCount(event.requestId);
          continue;
        }
        let serverRequestDecision:
          | ReturnType<typeof requestPolicy.responseForServerRequest>
          | undefined;
        try {
          serverRequestDecision = requestPolicy.responseForServerRequest(
            event,
            effectiveServerRequestPolicy,
          );
        } catch (error) {
          log(
            `server request policy failed id=${event.requestId ?? "(none)"} message=${error instanceof Error ? error.message : String(error)}`,
          );
          serverRequestDecision = undefined;
        }
        if (serverRequestDecision) {
          await bridge.transport.respond(
            serverRequestDecision.requestId,
            serverRequestDecision.response,
          );
          decrementPendingRequestCount(serverRequestDecision.requestId);
          log(
            `auto-resolved ${serverRequestDecision.kind} id=${serverRequestDecision.requestId} action=${serverRequestDecision.action}`,
          );
          continue;
        }
        if (isDynamicToolRequestEvent(event)) {
          log(
            `handling dynamic tool id=${event.requestId} thread=${threadIdFromRequest(event.request) ?? "(none)"}`,
          );
          if (effectiveDynamicToolPolicy.mode !== "host-callback") {
            emitDynamicToolEvent(
              dynamicToolDebugEventFromPending(event, {
                phase: "received",
              }),
            );
            emitDynamicToolEvent(
              dynamicToolDebugEventFromPending(event, {
                message: "Dynamic tool handling is disabled by host policy",
                phase: "denied",
                success: false,
              }),
            );
            await bridge.transport.respond(
              event.requestId,
              dynamicTools.dynamicToolFailure("Dynamic tool handling is disabled by host policy"),
            );
            decrementPendingRequestCount(event.requestId);
            continue;
          }
          const getRequestMcpThreadId = async () => {
            const creatingHelperThread = dynamicToolHelperThreadId === undefined;
            const threadId = await getMcpThreadId();
            if (creatingHelperThread) {
              emitDynamicToolEvent(
                dynamicToolDebugEventFromPending(event, {
                  helperThreadId: threadId,
                  phase: "helperThreadCreated",
                }),
              );
            }
            return threadId;
          };
          void dynamicTools.handleDynamicToolRequest(
            event,
            bridge.transport,
            effectiveDynamicToolPolicy.handler,
            getRequestMcpThreadId,
            emitDynamicToolEvent,
          ).catch(async (error: unknown) => {
            log(
              `dynamic tool failed id=${event.requestId} message=${error instanceof Error ? error.message : String(error)}`,
            );
            await bridge.transport
              .respond(event.requestId, dynamicTools.dynamicToolFailure(error))
              .catch(() => undefined);
          }).finally(() => {
            decrementPendingRequestCount(event.requestId);
          });
          continue;
        }
        sendEnvelope(socket, backpressure, safeEvent, (code, reason) => {
          emitBridgeHealthEvent("backpressureClosed", {
            closeCode: code,
            closeReason: reason,
          });
        });
      }
    })
    .catch((error: unknown) => {
      log(`startup failed message=${error instanceof Error ? error.message : String(error)}`);
      socket.close(1011, "Agent UI bridge startup failed");
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
      decrementPendingRequestCount,
      (code, reason) => {
        emitBridgeHealthEvent("backpressureClosed", {
          closeCode: code,
          closeReason: reason,
        });
      },
    ).catch((error: unknown) => {
      sendEnvelope(socket, backpressure, {
        error: { message: redactSecrets(error instanceof Error ? error.message : String(error)) },
        type: "error",
      }, (code, reason) => {
        emitBridgeHealthEvent("backpressureClosed", {
          closeCode: code,
          closeReason: reason,
        });
      });
    });
  });
}

function resolveBridgeAdmissionPolicy({
  admission,
  bridgePolicy,
}: {
  admission?: AgentUiBridgeAdmissionHook;
  bridgePolicy?: AgentUiBridgePolicy;
}): AgentUiBridgeAdmissionPolicy {
  if (bridgePolicy?.admission) return bridgePolicy.admission;
  if (admission) return { admit: admission, mode: "host-callback" };
  return { mode: "local-loopback" };
}

async function checkBridgeAdmission({
  policy,
  request,
  stderr,
}: {
  policy: AgentUiBridgeAdmissionPolicy;
  request?: IncomingMessage;
  stderr?: (line: string) => void;
}): Promise<{ accepted: true } | { accepted: false; closeCode: number; reason: string }> {
  if (policy.mode === "unsafe-no-admission") {
    if (!policy.reason.trim()) {
      stderr?.(redactSecrets("[agent-ui] unsafe admission rejected: reason is required\n"));
      return { accepted: false, closeCode: 1011, reason: "Agent UI bridge admission failed" };
    }
    stderr?.(
      redactSecrets(
        `[agent-ui] unsafe admission enabled reason=${policy.reason.trim()}\n`,
      ),
    );
    return { accepted: true };
  }
  if (!request) {
    stderr?.(redactSecrets("[agent-ui] admission rejected: request context is required\n"));
    return { accepted: false, closeCode: 1008, reason: "Agent UI bridge admission rejected" };
  }
  if (policy.mode === "local-loopback") {
    return isLoopbackRequest(request)
      ? { accepted: true }
      : { accepted: false, closeCode: 1008, reason: "Agent UI bridge admission rejected" };
  }
  let accepted: boolean;
  try {
    accepted = await policy.admit(request);
  } catch (error) {
    stderr?.(
      redactSecrets(
        `[agent-ui] admission failed message=${error instanceof Error ? error.message : String(error)}\n`,
      ),
    );
    return { accepted: false, closeCode: 1011, reason: "Agent UI bridge admission failed" };
  }
  return accepted
    ? { accepted: true }
    : { accepted: false, closeCode: 1008, reason: "Agent UI bridge admission rejected" };
}

function isLoopbackRequest(request: IncomingMessage): boolean {
  const remoteAddress = request.socket.remoteAddress;
  if (!remoteAddress) return false;
  if (remoteAddress === "127.0.0.1" || remoteAddress === "::1") return true;
  if (remoteAddress.startsWith("127.")) return true;
  if (remoteAddress === "::ffff:127.0.0.1") return true;
  return remoteAddress.startsWith("::ffff:127.");
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

function dynamicToolDebugEventFromPending(
  event: AgentTransportEvent & {
    request: PendingServerRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
  },
  details: DynamicToolDebugEventDetails,
): DynamicToolDebugEvent {
  const payload = isRecord(event.request.payload) ? event.request.payload : {};
  const namespace = payload.namespace;
  return {
    ...details,
    audience: details.audience ?? ["developer", "audit"],
    request: {
      callId: String(payload.callId ?? payload.call_id ?? ""),
      namespace: typeof namespace === "string" ? namespace : null,
      threadId: String(payload.threadId ?? payload.thread_id ?? ""),
      tool: String(payload.tool ?? ""),
      turnId: String(payload.turnId ?? payload.turn_id ?? ""),
    },
    requestId: event.requestId,
    type: "dynamicTool",
  };
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
  onResponseHandled: (requestId: NonNullable<AgentTransportEvent["requestId"]>) => void,
  onBackpressureClosed: (code: number, reason: string) => void,
): Promise<void> {
  const message = parseJsonRpcLine(data.toString()) as unknown;
  if (isJsonRpcRequest(message)) {
    if (bridgeOwnsInitialize && message.method === "initialize") {
      sendJsonRpcError(socket, backpressure, message.id, {
        code: -32600,
        data: { method: message.method },
        message: "Browser initialize is not allowed when the bridge owns initialization",
      }, onBackpressureClosed);
      return;
    }
    if (!methodPolicy.requests.has("*") && !methodPolicy.requests.has(message.method)) {
      sendJsonRpcError(socket, backpressure, message.id, {
        code: -32601,
        data: { method: message.method },
        message: `Browser method is not allowed: ${message.method}`,
      }, onBackpressureClosed);
      return;
    }
    try {
      const result = await transport.request(message.method, message.params, {
        ...(message.trace === undefined ? {} : { trace: message.trace }),
      });
      sendJson(socket, backpressure, { id: message.id, result }, onBackpressureClosed);
    } catch (error) {
      sendJsonRpcError(socket, backpressure, message.id, jsonRpcErrorPayload(error), onBackpressureClosed);
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
    onResponseHandled(message.id);
    return;
  }

  if (isRecord(message) && "id" in message) {
    sendJsonRpcError(socket, backpressure, message.id, {
      code: -32600,
      data: { message },
      message: "Invalid JSON-RPC message",
    }, onBackpressureClosed);
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
    return browserMethodPolicyForCapabilities(policy.capabilities);
  }
  return browserMethodPolicyForCapabilities(DEFAULT_BROWSER_METHOD_CAPABILITIES);
}

function browserMethodPolicyForCapabilities(
  capabilities: readonly BrowserMethodCapability[] | undefined,
): ResolvedBrowserMethodPolicy {
  const selected = capabilities ?? DEFAULT_BROWSER_METHOD_CAPABILITIES;
  const notifications = new Set<string>();
  const requests = new Set<string>();
  for (const capability of selected) {
    const methods = BROWSER_METHOD_CAPABILITIES[capability];
    if (!methods) {
      throw new Error(`Unknown browser method capability: ${String(capability)}`);
    }
    for (const method of methods.requests ?? []) requests.add(method);
    for (const method of methods.notifications ?? []) notifications.add(method);
  }
  return { notifications, requests };
}

function sendEnvelope(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  event: AgentTransportEvent,
  onBackpressureClosed: (code: number, reason: string) => void,
): void {
  sendJson(
    socket,
    backpressure,
    { event: redactTransportEvent(event), type: "agent-ui/transport-event" },
    onBackpressureClosed,
  );
}

function sendJson(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  value: unknown,
  onBackpressureClosed: (code: number, reason: string) => void,
): void {
  const reason = backpressureCloseReason(socket, backpressure, value);
  if (reason) onBackpressureClosed(1013, reason);
  sendJsonWithBackpressure(socket, backpressure, value);
}

function sendJsonRpcError(
  socket: WebSocket,
  backpressure: ReturnType<typeof createWebSocketBackpressureGuard>,
  id: unknown,
  error: unknown,
  onBackpressureClosed: (code: number, reason: string) => void,
): void {
  sendJson(socket, backpressure, {
    error: redactStructuredValue(error),
    id,
  }, onBackpressureClosed);
}

function backpressureCloseReason(
  socket: Pick<WebSocket, "bufferedAmount" | "readyState">,
  guard: ReturnType<typeof createWebSocketBackpressureGuard>,
  value: unknown,
): string | undefined {
  if (socket.readyState !== 1 || guard.maxBufferedBytes === false) return undefined;
  const payloadBytes = Buffer.byteLength(JSON.stringify(value));
  if (socket.bufferedAmount + payloadBytes > guard.maxBufferedBytes) {
    return "Agent UI bridge backpressure limit exceeded";
  }
  return undefined;
}
