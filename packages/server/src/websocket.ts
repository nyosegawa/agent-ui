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

export interface AgentUiWebSocketBridgeOptions extends CodexAppServerBridgeOptions {
  dynamicToolHandler?: DynamicToolHandler;
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

export interface ServerRequestPolicy {
  commandExecution?: "accept" | "acceptForSession" | "manual";
  fileChange?: "accept" | "acceptForSession" | "manual";
  mcpToolApproval?: "accept" | "manual";
  permissions?: "grant" | "manual";
  userInput?: "manual";
}

export type DynamicToolHandler = (
  request: DynamicToolRequest,
  context: DynamicToolHandlerContext,
) => Promise<DynamicToolCallResponse> | DynamicToolCallResponse;

export interface DynamicToolHandlerContext {
  getMcpThreadId(): Promise<string>;
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"];
}

export interface DynamicToolRequest {
  arguments?: unknown;
  callId: string;
  namespace: string | null;
  threadId: string;
  tool: string;
  turnId: string;
}

export interface DynamicToolCallResponse {
  contentItems: DynamicToolCallOutputContentItem[];
  success: boolean;
}

export type DynamicToolCallOutputContentItem =
  | { type: "inputText"; text: string }
  | { type: "inputImage"; imageUrl: string };

interface McpServerToolCallResponse {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
}

const DEFAULT_PATH = "/agent-ui/ws";
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS = 20_000;

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
    dynamicToolHandler = defaultDynamicToolHandler,
    idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
    serverRequestPolicy,
    ...bridgeOptions
  } = options;
  const bridge = createCodexAppServerBridge(bridgeOptions);
  const effectiveServerRequestPolicy: Required<ServerRequestPolicy> = {
    commandExecution: serverRequestPolicy?.commandExecution ?? "manual",
    fileChange: serverRequestPolicy?.fileChange ?? "manual",
    mcpToolApproval: serverRequestPolicy?.mcpToolApproval ?? "manual",
    permissions: serverRequestPolicy?.permissions ?? "manual",
    userInput: serverRequestPolicy?.userInput ?? "manual",
  };
  const log = (message: string) => {
    bridgeOptions.stderr?.(`[agent-ui] ${message}\n`);
  };
  let closed = false;
  let dynamicToolHelperThreadId: Promise<string> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const getMcpThreadId = () => {
    dynamicToolHelperThreadId ??= createDynamicToolHelperThread(
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
        if (await maybeResolveHelperThreadRequest(event, bridge.transport, dynamicToolHelperThreadId)) {
          log(`auto-resolved helper request id=${event.requestId}`);
          continue;
        }
        const serverRequestDecision = responseForServerRequest(
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
          void handleDynamicToolRequest(
            event,
            bridge.transport,
            dynamicToolHandler,
            getMcpThreadId,
          ).catch((error: unknown) => {
            log(
              `dynamic tool failed id=${event.requestId} message=${error instanceof Error ? error.message : String(error)}`,
            );
            void bridge.transport
              .respond(event.requestId, dynamicToolFailure(error))
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

function responseForServerRequest(
  event: AgentTransportEvent,
  policy: Required<ServerRequestPolicy>,
): { action: string; kind: PendingServerRequest["kind"]; requestId: NonNullable<AgentTransportEvent["requestId"]>; response: unknown } | undefined {
  if (
    event.type !== "request" ||
    event.requestId === undefined ||
    !event.request
  ) {
    return undefined;
  }

  if (
    event.request.kind === "mcpElicitation" &&
    policy.mcpToolApproval === "accept"
  ) {
    return {
      action: "accept",
      kind: event.request.kind,
      requestId: event.requestId,
      response: { action: "accept", content: null, _meta: null },
    };
  }

  if (
    event.request.kind === "permissionsApproval" &&
    policy.permissions === "grant" &&
    isRecord(event.request.payload)
  ) {
    const permissions = event.request.payload.permissions;
    return {
      action: "grant",
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        permissions: isRecord(permissions) ? grantedPermissionsFromRequest(permissions) : {},
        scope: "turn",
      },
    };
  }

  if (
    event.request.kind === "commandApproval" &&
    policy.commandExecution !== "manual"
  ) {
    return {
      action: policy.commandExecution,
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        decision:
          policy.commandExecution === "acceptForSession" ? "acceptForSession" : "accept",
      },
    };
  }

  if (event.request.kind === "fileChangeApproval" && policy.fileChange !== "manual") {
    return {
      action: policy.fileChange,
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        decision: policy.fileChange === "acceptForSession" ? "acceptForSession" : "accept",
      },
    };
  }

  return undefined;
}

async function handleDynamicToolRequest(
  event: AgentTransportEvent & {
    request: PendingServerRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
  },
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  handler: DynamicToolHandler,
  getMcpThreadId: () => Promise<string>,
): Promise<void> {
  const request = dynamicToolRequestFromPending(event.request);
  const response = await handler(request, { getMcpThreadId, transport });
  await transport.respond(event.requestId, response);
}

async function defaultDynamicToolHandler(
  request: DynamicToolRequest,
  context: DynamicToolHandlerContext,
): Promise<DynamicToolCallResponse> {
  const server = mcpServerNameFromDynamicNamespace(request.namespace);
  if (!server) {
    return dynamicToolFailure(`Unsupported dynamic tool namespace: ${request.namespace ?? "(none)"}`);
  }
  const threadId = await context.getMcpThreadId();
  const response = await withTimeout(
    context.transport.request<
      { arguments?: unknown; server: string; threadId: string; tool: string },
      McpServerToolCallResponse
    >("mcpServer/tool/call", {
      arguments: request.arguments,
      server,
      threadId,
      tool: request.tool,
    }),
    DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS,
    `Dynamic tool ${request.namespace ?? ""}${request.tool} timed out after ${DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS}ms`,
  );
  return mcpResponseToDynamicToolResponse(response);
}

async function createDynamicToolHelperThread(
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  cwd?: string,
): Promise<string> {
  const response = await transport.request<Record<string, unknown>, unknown>("thread/start", {
    approvalPolicy: "never",
    ...(cwd ? { cwd } : {}),
    sandbox: "danger-full-access",
  });
  const threadId = extractThreadId(response);
  if (!threadId) throw new Error("Could not create dynamic tool helper thread");
  return threadId;
}

async function maybeResolveHelperThreadRequest(
  event: AgentTransportEvent,
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  helperThreadId: Promise<string> | undefined,
): Promise<boolean> {
  if (event.type !== "request" || event.requestId === undefined || !event.request || !helperThreadId) {
    return false;
  }
  const threadId = threadIdFromRequest(event.request);
  if (!threadId) return false;
  const resolvedHelperThreadId = await helperThreadId.catch(() => undefined);
  if (threadId !== resolvedHelperThreadId) return false;

  if (event.request.kind === "mcpElicitation" && isMcpToolApprovalElicitation(event.request.payload)) {
    await transport.respond(event.requestId, {
      action: "accept",
      content: null,
      _meta: null,
    });
    return true;
  }

  if (event.request.kind === "permissionsApproval" && isRecord(event.request.payload)) {
    const permissions = event.request.payload.permissions;
    await transport.respond(event.requestId, {
      permissions: isRecord(permissions) ? grantedPermissionsFromRequest(permissions) : {},
      scope: "turn",
    });
    return true;
  }

  return false;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function extractThreadId(response: unknown): string | undefined {
  const record = isRecord(response) ? response : undefined;
  const thread = isRecord(record?.thread) ? record.thread : undefined;
  const nestedResult = isRecord(record?.result) ? record.result : undefined;
  const nestedThread = isRecord(nestedResult?.thread) ? nestedResult.thread : undefined;
  const value =
    thread?.id ?? nestedThread?.id ?? record?.threadId ?? nestedResult?.threadId ?? record?.id;
  return typeof value === "string" ? value : undefined;
}

function mcpServerNameFromDynamicNamespace(namespace: string | null): string | undefined {
  const match = namespace?.match(/^mcp__(.+)__$/);
  return match?.[1]?.replaceAll("_", "-");
}

function mcpResponseToDynamicToolResponse(
  response: McpServerToolCallResponse,
): DynamicToolCallResponse {
  const contentItems = (response.content ?? []).flatMap(dynamicContentItemFromMcpContent);
  if (response.structuredContent !== undefined) {
    contentItems.push({
      text: JSON.stringify(response.structuredContent),
      type: "inputText",
    });
  }
  return {
    contentItems:
      contentItems.length > 0
        ? contentItems
        : [{ text: response.isError ? "MCP tool call failed" : "MCP tool call returned no content", type: "inputText" }],
    success: response.isError !== true,
  };
}

function dynamicContentItemFromMcpContent(
  item: unknown,
): DynamicToolCallOutputContentItem[] {
  if (!isRecord(item)) return [{ text: String(item), type: "inputText" }];
  if (item.type === "text" && typeof item.text === "string") {
    return [{ text: item.text, type: "inputText" }];
  }
  if (item.type === "image" && typeof item.data === "string") {
    const mimeType = typeof item.mimeType === "string" ? item.mimeType : "image/png";
    return [{ imageUrl: `data:${mimeType};base64,${item.data}`, type: "inputImage" }];
  }
  return [{ text: JSON.stringify(item), type: "inputText" }];
}

function dynamicToolFailure(error: unknown): DynamicToolCallResponse {
  return {
    contentItems: [
      { text: error instanceof Error ? error.message : String(error), type: "inputText" },
    ],
    success: false,
  };
}

function threadIdFromRequest(request: PendingServerRequest): string | undefined {
  const payload = isRecord(request.payload) ? request.payload : undefined;
  const value = request.threadId ?? payload?.threadId ?? payload?.thread_id;
  return typeof value === "string" ? value : undefined;
}

function isMcpToolApprovalElicitation(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  if (payload.mode !== "form") return false;
  const meta = isRecord(payload._meta) ? payload._meta : undefined;
  return meta?.codex_approval_kind === "mcp_tool_call";
}

function grantedPermissionsFromRequest(permissions: Record<string, unknown>): Record<string, unknown> {
  return {
    ...(permissions.fileSystem !== undefined && permissions.fileSystem !== null
      ? { fileSystem: permissions.fileSystem }
      : {}),
    ...(permissions.network !== undefined && permissions.network !== null
      ? { network: permissions.network }
      : {}),
  };
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

function dynamicToolRequestFromPending(request: PendingServerRequest | undefined): DynamicToolRequest {
  const payload = isRecord(request?.payload) ? request.payload : {};
  return {
    arguments: payload.arguments,
    callId: String(payload.callId ?? payload.call_id ?? ""),
    namespace:
      typeof payload.namespace === "string" || payload.namespace === null
        ? payload.namespace
        : null,
    threadId: String(payload.threadId ?? payload.thread_id ?? ""),
    tool: String(payload.tool ?? ""),
    turnId: String(payload.turnId ?? payload.turn_id ?? ""),
  };
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
