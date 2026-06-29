import {
  isJsonRpcNotification,
  isJsonRpcRequest,
  isJsonRpcResponse,
  jsonRpcErrorPayload,
  parseJsonRpcLine,
} from "@nyosegawa/agent-ui-codex";
import type { AgentTransportEvent } from "@nyosegawa/agent-ui-core";
import type { PendingServerRequest } from "@nyosegawa/agent-ui-core/internal";
import { createHash, timingSafeEqual } from "node:crypto";
import { STATUS_CODES, type IncomingMessage, type Server } from "node:http";
import type { Duplex } from "node:stream";
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
  resolveBridgeOptions?: AgentUiWebSocketBridgeOptionsResolver;
}

export interface AgentUiWebSocketInboundLimits {
  maxMessageBytes?: number;
  rateLimitIntervalMs?: number;
  rateLimitMessages?: number;
}

export interface AgentUiWebSocketBridgeOptionsResolverContext {
  request?: IncomingMessage;
}

export type AgentUiResolvedWebSocketBridgeOptions = Omit<
  AgentUiWebSocketBridgeOptions,
  "resolveBridgeOptions"
>;

export type AgentUiWebSocketBridgeOptionsResolver = (
  context: AgentUiWebSocketBridgeOptionsResolverContext,
) =>
  | AgentUiResolvedWebSocketBridgeOptions
  | AgentUiBridgeResult
  | false
  | null
  | undefined
  | Promise<
      | AgentUiResolvedWebSocketBridgeOptions
      | AgentUiBridgeResult
      | false
      | null
      | undefined
    >;

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
export type AgentUiBridgeRejectionReason =
  | "request_context_missing"
  | "loopback_required"
  | "resolver_rejected"
  | "resolver_failed"
  | "admission_rejected"
  | "admission_failed"
  | "unsafe_admission_reason_missing"
  | "bearer_subprotocol_missing"
  | "bearer_subprotocol_malformed"
  | "bearer_subprotocol_mismatch"
  | (string & {});
export interface AgentUiBridgeRejection {
  body?: string | Buffer;
  closeCode?: number;
  closeReason?: string;
  reason: AgentUiBridgeRejectionReason;
  status?: number;
  statusText?: string;
}
export type AgentUiBridgeResult =
  | { accepted: true }
  | ({ accepted: false } & AgentUiBridgeRejection);
export type AgentUiBridgeAdmissionDecision =
  | boolean
  | AgentUiBridgeResult;
export type AgentUiBridgeAdmissionHook = (
  request: IncomingMessage,
) => AgentUiBridgeAdmissionDecision | Promise<AgentUiBridgeAdmissionDecision>;
export interface AgentUiBridgePolicy {
  admission?: AgentUiBridgeAdmissionPolicy;
}
export type AgentUiBearerSubprotocolParseResult =
  | { ok: true; protocol: string; token: string }
  | {
      ok: false;
      reason:
        | "bearer_subprotocol_missing"
        | "bearer_subprotocol_malformed";
    };
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
export const AGENT_UI_BEARER_SUBPROTOCOL_PREFIX = "agent-ui-bearer.";
const WEB_SOCKET_OPEN_STATE = 1;
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
      "account/usage/read",
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
    noServer: true,
  });
  const onUpgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    if (!requestMatchesPath(request, path)) {
      if (server.listenerCount("upgrade") <= 1) {
        sendHttpBridgeRejection(
          socket,
          bridgeRejection(
            { reason: "path_not_found", status: 404 },
            {
              closeCode: 1008,
              closeReason: "Agent UI bridge path not found",
            },
          ),
        );
      }
      return;
    }
    let upgradeSocketClosed = false;
    socket.once("close", () => {
      upgradeSocketClosed = true;
    });
    request.once("close", () => {
      upgradeSocketClosed = true;
    });
    request.once("aborted", () => {
      upgradeSocketClosed = true;
    });
    void (async () => {
      const preflight = await evaluateBridgePreflight({
        options: bridgeOptions,
        request,
      });
      if (preflight.accepted === false) {
        sendHttpBridgeRejection(socket, preflight.rejection);
        return;
      }
      if (
        upgradeSocketClosed ||
        request.destroyed ||
        request.socket.destroyed ||
        socket.destroyed ||
        !socket.writable
      ) return;
      webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        void handleAgentUiWebSocketConnectionInternal(
          webSocket,
          preflight.options,
          request,
          preflight.bridgeHealth,
        );
        webSocketServer.emit("connection", webSocket, request);
      });
    })().catch((error: unknown) => {
      const rejection = bridgeRejection(
        {
          reason: "resolver_failed",
          status: 500,
        },
        {
          closeCode: 1011,
          closeReason: "Agent UI bridge option resolver failed",
        },
      );
      bridgeOptions.stderr?.(
        redactSecrets(
          `[agent-ui] bridge upgrade failed message=${error instanceof Error ? error.message : String(error)}\n`,
        ),
      );
      sendHttpBridgeRejection(socket, rejection);
    });
  };
  server.on("upgrade", onUpgrade);
  webSocketServer.on("close", () => {
    server.off("upgrade", onUpgrade);
  });
  return webSocketServer;
}

export function parseAgentUiBearerSubprotocol(
  requestOrHeader: IncomingMessage | string | string[] | undefined,
): AgentUiBearerSubprotocolParseResult {
  const header = isIncomingMessage(requestOrHeader)
    ? requestOrHeader.headers["sec-websocket-protocol"]
    : requestOrHeader;
  const matches = protocolHeaderValues(header).filter((protocol) =>
    protocol.startsWith(AGENT_UI_BEARER_SUBPROTOCOL_PREFIX),
  );
  if (matches.length === 0) return { ok: false, reason: "bearer_subprotocol_missing" };
  if (matches.length !== 1) return { ok: false, reason: "bearer_subprotocol_malformed" };
  const protocol = matches[0]!;
  const encoded = protocol.slice(AGENT_UI_BEARER_SUBPROTOCOL_PREFIX.length);
  const token = decodeBearerSubprotocolToken(encoded);
  if (token === undefined) return { ok: false, reason: "bearer_subprotocol_malformed" };
  return { ok: true, protocol, token };
}

export function verifyAgentUiBearerSubprotocol(
  request: IncomingMessage,
  expectedToken: string | undefined,
): AgentUiBridgeResult {
  const parsed = parseAgentUiBearerSubprotocol(request);
  if (parsed.ok === false) {
    return {
      accepted: false,
      ...bridgeRejection(
        { reason: parsed.reason, status: 403 },
        {
          closeCode: 1008,
          closeReason: "Agent UI bridge bearer token rejected",
        },
      ),
    };
  }
  if (!expectedToken || !constantTimeTokenEqual(parsed.token, expectedToken)) {
    return {
      accepted: false,
      ...bridgeRejection(
        { reason: "bearer_subprotocol_mismatch", status: 403 },
        {
          closeCode: 1008,
          closeReason: "Agent UI bridge bearer token rejected",
        },
      ),
    };
  }
  return { accepted: true };
}

export async function handleAgentUiWebSocketConnection(
  socket: WebSocket,
  options: AgentUiWebSocketBridgeOptions = {},
  request?: IncomingMessage,
): Promise<void> {
  return handleAgentUiWebSocketConnectionInternal(socket, options, request);
}

async function handleAgentUiWebSocketConnectionInternal(
  socket: WebSocket,
  options: AgentUiWebSocketBridgeOptions = {},
  request?: IncomingMessage,
  preflightBridgeHealth?: AgentUiBridgeHealthState,
): Promise<void> {
  let closed = false;
  let bridge: ReturnType<typeof createCodexAppServerBridge> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const closeBridge = () => {
    if (closed) return;
    closed = true;
    if (idleTimer) clearTimeout(idleTimer);
    void bridge?.close().catch(() => undefined);
  };
  socket.on("close", closeBridge);
  socket.on("error", closeBridge);

  const preflight = preflightBridgeHealth
    ? {
        accepted: true as const,
        bridgeHealth: preflightBridgeHealth,
        options: options as AgentUiResolvedWebSocketBridgeOptions,
      }
    : await evaluateBridgePreflight({
        options,
        request,
  });
  if (preflight.accepted === false) {
    const closeCode = sanitizeWebSocketCloseCode(preflight.rejection.closeCode);
    const closeReason = sanitizeWebSocketCloseReason(
      bridgeCloseReason(preflight.rejection),
    );
    socket.close(
      closeCode,
      closeReason,
    );
    return;
  }
  if (closed || socket.readyState !== WEB_SOCKET_OPEN_STATE) {
    closeBridge();
    return;
  }
  const resolvedOptions = preflight.options;
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
  } = resolvedOptions;
  void admission;
  void bridgePolicy;
  const bridgeHealth: AgentUiBridgeHealthState = preflight.bridgeHealth;
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
  try {
    bridge = createCodexAppServerBridge(bridgeOptions);
    bridgeHealth.processSpawned = true;
    emitBridgeHealthEvent("processSpawned");
  } catch (error) {
    log(`startup failed message=${error instanceof Error ? error.message : String(error)}`);
    socket.close(1011, "Agent UI bridge startup failed");
    return;
  }
  const activeBridge = bridge;
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
  let dynamicToolHelperThreadId: Promise<string> | undefined;
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
      activeBridge.transport,
      bridgeOptions.cwd,
    );
    return dynamicToolHelperThreadId;
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

  resetIdleTimer();

  void activeBridge.transport
    .connect()
    .then(async () => {
      bridgeHealth.initialized = true;
      emitBridgeHealthEvent("initialized");
      bridgeHealth.connected = true;
      emitBridgeHealthEvent("connected");
      for await (const event of activeBridge.transport.events) {
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

async function evaluateBridgePreflight({
  options,
  request,
}: {
  options: AgentUiWebSocketBridgeOptions;
  request?: IncomingMessage;
}): Promise<
  | {
      accepted: true;
      bridgeHealth: AgentUiBridgeHealthState;
      options: AgentUiResolvedWebSocketBridgeOptions;
    }
  | {
      accepted: false;
      bridgeHealth: AgentUiBridgeHealthState;
      rejection: AgentUiBridgeRejection;
    }
> {
  const bridgeHealth = createInitialBridgeHealthState();
  const { resolveBridgeOptions, ...baseOptions } = options;
  let resolvedOptions: AgentUiResolvedWebSocketBridgeOptions = baseOptions;
  if (resolveBridgeOptions) {
    try {
      const resolved = await resolveBridgeOptions({ request });
      if (isBridgeResult(resolved)) {
        if (resolved.accepted === false) {
          const rejection = bridgeRejection(resolved, {
            closeCode: 1008,
            closeReason: "Agent UI bridge options rejected",
            status: 403,
          });
          emitBridgeHealthEventForOptions(baseOptions, bridgeHealth, "rejected", {
            closeCode: rejection.closeCode,
            closeReason: bridgeCloseReason(rejection),
            reasonCode: rejection.reason,
          });
          return { accepted: false, bridgeHealth, rejection };
        }
      } else if (!resolved) {
        const rejection = bridgeRejection(
          { reason: "resolver_rejected" },
          {
            closeCode: 1008,
            closeReason: "Agent UI bridge options rejected",
            status: 403,
          },
        );
        emitBridgeHealthEventForOptions(baseOptions, bridgeHealth, "rejected", {
          closeCode: rejection.closeCode,
          closeReason: bridgeCloseReason(rejection),
          reasonCode: rejection.reason,
        });
        return { accepted: false, bridgeHealth, rejection };
      } else {
        resolvedOptions = { ...baseOptions, ...resolved };
      }
    } catch (error) {
      baseOptions.stderr?.(
        redactSecrets(
          `[agent-ui] bridge option resolver failed message=${error instanceof Error ? error.message : String(error)}\n`,
        ),
      );
      const rejection = bridgeRejection(
        { reason: "resolver_failed", status: 500 },
        {
          closeCode: 1011,
          closeReason: "Agent UI bridge option resolver failed",
        },
      );
      emitBridgeHealthEventForOptions(baseOptions, bridgeHealth, "rejected", {
        closeCode: rejection.closeCode,
        closeReason: bridgeCloseReason(rejection),
        reasonCode: rejection.reason,
      });
      return { accepted: false, bridgeHealth, rejection };
    }
  }
  const admissionPolicy = resolveBridgeAdmissionPolicy({
    admission: resolvedOptions.admission,
    bridgePolicy: resolvedOptions.bridgePolicy,
  });
  const admissionResult = await checkBridgeAdmission({
    policy: admissionPolicy,
    request,
    stderr: resolvedOptions.stderr,
  });
  bridgeHealth.admissionChecked = true;
  emitBridgeHealthEventForOptions(resolvedOptions, bridgeHealth, "admissionChecked", {
    ...(admissionResult.accepted === false
      ? {
          closeCode: admissionResult.rejection.closeCode,
          closeReason: bridgeCloseReason(admissionResult.rejection),
          reasonCode: admissionResult.rejection.reason,
        }
      : {}),
  });
  if (admissionResult.accepted === false) {
    emitBridgeHealthEventForOptions(resolvedOptions, bridgeHealth, "rejected", {
      closeCode: admissionResult.rejection.closeCode,
      closeReason: bridgeCloseReason(admissionResult.rejection),
      reasonCode: admissionResult.rejection.reason,
    });
    return {
      accepted: false,
      bridgeHealth,
      rejection: admissionResult.rejection,
    };
  }
  return { accepted: true, bridgeHealth, options: resolvedOptions };
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
}): Promise<{ accepted: true } | { accepted: false; rejection: AgentUiBridgeRejection }> {
  if (policy.mode === "unsafe-no-admission") {
    if (!policy.reason.trim()) {
      stderr?.(redactSecrets("[agent-ui] unsafe admission rejected: reason is required\n"));
      return {
        accepted: false,
        rejection: bridgeRejection(
          { reason: "unsafe_admission_reason_missing", status: 500 },
          {
            closeCode: 1011,
            closeReason: "Agent UI bridge admission failed",
          },
        ),
      };
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
    return {
      accepted: false,
      rejection: bridgeRejection(
        { reason: "request_context_missing", status: 400 },
        {
          closeCode: 1008,
          closeReason: "Agent UI bridge admission rejected",
        },
      ),
    };
  }
  if (policy.mode === "local-loopback") {
    return isLoopbackRequest(request)
      ? { accepted: true }
      : {
          accepted: false,
          rejection: bridgeRejection(
            { reason: "loopback_required", status: 403 },
            {
              closeCode: 1008,
              closeReason: "Agent UI bridge admission rejected",
            },
          ),
        };
  }
  let decision: AgentUiBridgeAdmissionDecision;
  try {
    decision = await policy.admit(request);
  } catch (error) {
    stderr?.(
      redactSecrets(
        `[agent-ui] admission failed message=${error instanceof Error ? error.message : String(error)}\n`,
      ),
    );
    return {
      accepted: false,
      rejection: bridgeRejection(
        { reason: "admission_failed", status: 500 },
        {
          closeCode: 1011,
          closeReason: "Agent UI bridge admission failed",
        },
      ),
    };
  }
  if (isBridgeResult(decision)) {
    return decision.accepted === true
      ? { accepted: true }
      : {
          accepted: false,
          rejection: bridgeRejection(decision, {
            closeCode: 1008,
            closeReason: "Agent UI bridge admission rejected",
            status: 403,
          }),
        };
  }
  return decision
    ? { accepted: true }
    : {
        accepted: false,
        rejection: bridgeRejection(
          { reason: "admission_rejected", status: 403 },
          {
            closeCode: 1008,
            closeReason: "Agent UI bridge admission rejected",
          },
        ),
      };
}

function isLoopbackRequest(request: IncomingMessage): boolean {
  const remoteAddress = request.socket.remoteAddress;
  if (!remoteAddress) return false;
  if (remoteAddress === "127.0.0.1" || remoteAddress === "::1") return true;
  if (remoteAddress.startsWith("127.")) return true;
  if (remoteAddress === "::ffff:127.0.0.1") return true;
  return remoteAddress.startsWith("::ffff:127.");
}

function createInitialBridgeHealthState(): AgentUiBridgeHealthState {
  return {
    admissionChecked: false,
    connected: false,
    initialized: false,
    pendingRequestCount: 0,
    processSpawned: false,
  };
}

function emitBridgeHealthEventForOptions(
  options: Pick<AgentUiWebSocketBridgeOptions, "hostEvents" | "stderr">,
  bridgeHealth: AgentUiBridgeHealthState,
  phase: AgentUiBridgeHealthPhase,
  extra: Omit<AgentUiBridgeHealthEvent, "audience" | "phase" | "state" | "timestamp" | "type"> = {},
) {
  try {
    options.hostEvents?.onBridgeHealthEvent?.({
      ...extra,
      audience: ["developer", "audit"],
      phase,
      state: { ...bridgeHealth },
      timestamp: Date.now(),
      type: "bridgeHealth",
    });
  } catch (error) {
    options.stderr?.(
      redactSecrets(
        `[agent-ui] bridge health event sink failed phase=${phase} message=${error instanceof Error ? error.message : String(error)}\n`,
      ),
    );
  }
}

function bridgeRejection(
  rejection: AgentUiBridgeRejection,
  defaults: Required<Pick<AgentUiBridgeRejection, "closeCode" | "closeReason">> &
    Pick<AgentUiBridgeRejection, "status" | "statusText">,
): AgentUiBridgeRejection {
  return {
    ...rejection,
    closeCode: rejection.closeCode ?? defaults.closeCode,
    closeReason: rejection.closeReason ?? defaults.closeReason,
    status: rejection.status ?? defaults.status,
    statusText: rejection.statusText ?? defaults.statusText,
  };
}

function isBridgeResult(value: unknown): value is AgentUiBridgeResult {
  return isRecord(value) && typeof value.accepted === "boolean";
}

function bridgeCloseReason(rejection: AgentUiBridgeRejection): string {
  return rejection.closeReason ?? `Agent UI bridge rejected: ${rejection.reason}`;
}

function sendHttpBridgeRejection(
  socket: Duplex,
  rejection: AgentUiBridgeRejection,
) {
  const status = sanitizeHttpStatus(rejection.status);
  const statusText = sanitizeHttpStatusText(rejection.statusText, status);
  const body = Buffer.isBuffer(rejection.body)
    ? rejection.body
    : Buffer.from(
        rejection.body ?? `Agent UI bridge rejected: ${rejection.reason}\n`,
        "utf8",
      );
  const headers = Buffer.from(
    [
      `HTTP/1.1 ${status} ${statusText}`,
      "Connection: close",
      "Content-Type: text/plain; charset=utf-8",
      `Content-Length: ${body.byteLength}`,
      "",
      "",
    ].join("\r\n"),
    "utf8",
  );
  socket.end(Buffer.concat([headers, body]));
}

function sanitizeHttpStatus(status: number | undefined): number {
  if (typeof status !== "number" || !Number.isInteger(status)) return 403;
  const integerStatus = status;
  return integerStatus >= 400 && integerStatus <= 599 ? integerStatus : 403;
}

function sanitizeHttpStatusText(statusText: string | undefined, status: number): string {
  const fallback = STATUS_CODES[status] ?? "Forbidden";
  if (!statusText) return fallback;
  const sanitized = statusText.replace(/[\r\n]/g, " ").trim();
  return sanitized.length > 0 ? sanitized : fallback;
}

function sanitizeWebSocketCloseCode(closeCode: number | undefined): number {
  if (typeof closeCode !== "number" || !Number.isInteger(closeCode)) return 1008;
  const integerCloseCode = closeCode;
  return integerCloseCode !== 1004 &&
    integerCloseCode !== 1005 &&
    integerCloseCode !== 1006 &&
    integerCloseCode >= 1000 &&
    integerCloseCode <= 4999
    ? integerCloseCode
    : 1008;
}

function sanitizeWebSocketCloseReason(closeReason: string): string {
  const buffer = Buffer.from(closeReason, "utf8");
  if (buffer.byteLength <= 123) return closeReason;
  return "Agent UI bridge rejected";
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  return isRecord(value) && isRecord(value.headers);
}

function protocolHeaderValues(
  header: string | string[] | undefined,
): string[] {
  const values = Array.isArray(header) ? header : header === undefined ? [] : [header];
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function decodeBearerSubprotocolToken(encoded: string): string | undefined {
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) return undefined;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    if (base64UrlEncodeUtf8(decoded) !== encoded) return undefined;
    return decoded;
  } catch {
    return undefined;
  }
}

function base64UrlEncodeUtf8(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function constantTimeTokenEqual(actual: string, expected: string): boolean {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function requestMatchesPath(request: IncomingMessage, path: string): boolean {
  try {
    return new URL(request.url ?? "/", "http://agent-ui.local").pathname === path;
  } catch {
    return false;
  }
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
  if (socket.readyState !== WEB_SOCKET_OPEN_STATE || guard.maxBufferedBytes === false) return undefined;
  const payloadBytes = Buffer.byteLength(JSON.stringify(value));
  if (socket.bufferedAmount + payloadBytes > guard.maxBufferedBytes) {
    return "Agent UI bridge backpressure limit exceeded";
  }
  return undefined;
}
