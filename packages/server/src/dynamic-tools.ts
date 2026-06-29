import { createCodexSession } from "@nyosegawa/agent-ui-codex";
import type {
  AgentDiagnosticAudience,
  AgentTransportEvent,
} from "@nyosegawa/agent-ui-core";
import type { PendingServerRequest } from "@nyosegawa/agent-ui-core/internal";
import type { createCodexAppServerBridge } from "./bridge";
import {
  boundedFileSystemPermission,
  boundedGenericPermission,
} from "./permission-bounding";
import { redactSecrets } from "./redaction";

export type DynamicToolHandler = (
  request: DynamicToolRequest,
  context: DynamicToolHandlerContext,
) => Promise<DynamicToolCallResponse> | DynamicToolCallResponse;

export interface DynamicToolHandlerContext {
  emitDebugEvent(event: DynamicToolDebugEventDetails): void;
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

export type DynamicToolDebugPhase =
  | "received"
  | "denied"
  | "helperThreadCreated"
  | "mcpCallStarted"
  | "timeout"
  | "completed"
  | "failed";

export interface DynamicToolDebugRequest {
  callId: string;
  namespace: string | null;
  threadId: string;
  tool: string;
  turnId: string;
}

export interface DynamicToolDebugEvent {
  audience?: readonly AgentDiagnosticAudience[];
  durationMs?: number;
  helperThreadId?: string;
  message?: string;
  phase: DynamicToolDebugPhase;
  request: DynamicToolDebugRequest;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  server?: string;
  success?: boolean;
  type: "dynamicTool";
}

export type DynamicToolDebugEventDetails = Omit<
  DynamicToolDebugEvent,
  "request" | "requestId" | "type"
>;

export interface McpDynamicToolMapping {
  namespace: string;
  server: string;
  tools: readonly string[] | "all";
}

export interface McpDynamicToolHandlerOptions {
  timeoutMs?: number;
  tools: readonly McpDynamicToolMapping[];
}

export type DynamicToolHelperPermissionPolicy =
  | "manual"
  | "deny"
  | "grantRequestedForTurn"
  | ((context: DynamicToolHelperPermissionContext) => DynamicToolHelperPermissionDecision);

export interface DynamicToolHelperPermissionContext {
  cwd?: string;
  payload: unknown;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  requested: {
    fileSystem?: unknown;
    network?: unknown;
  };
  threadId?: string;
  turnId?: string;
}

export type DynamicToolHelperPermissionDecision =
  | {
      action: "grant";
      permissions: {
        fileSystem?: unknown;
        network?: unknown;
      };
    }
  | { action: "deny" }
  | { action: "manual" }
  | null
  | undefined;

type DynamicToolHelperGrantedPermissions = {
  fileSystem?: unknown;
  network?: unknown;
};

interface McpServerToolCallResponse {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
}

const DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS = 20_000;

export async function handleDynamicToolRequest(
  event: AgentTransportEvent & {
    request: PendingServerRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
  },
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  handler: DynamicToolHandler,
  getMcpThreadId: () => Promise<string>,
  emitDynamicToolEvent?: (event: DynamicToolDebugEvent) => void,
): Promise<void> {
  const request = dynamicToolRequestFromPending(event.request);
  const startedAt = Date.now();
  const emitDebugEvent = (details: DynamicToolDebugEventDetails) => {
    try {
      emitDynamicToolEvent?.(
        dynamicToolDebugEventFromRequest(event.requestId, request, details),
      );
    } catch {
      // Host diagnostics must not affect dynamic tool execution.
    }
  };
  emitDebugEvent({ phase: "received" });
  try {
    const response = await handler(request, { emitDebugEvent, getMcpThreadId, transport });
    await transport.respond(event.requestId, response);
    emitDebugEvent({
      durationMs: Date.now() - startedAt,
      phase: "completed",
      success: response.success,
    });
  } catch (error) {
    emitDebugEvent({
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
      phase: "failed",
      success: false,
    });
    throw error;
  }
}

export function createMcpDynamicToolHandler(
  options: McpDynamicToolHandlerOptions,
): DynamicToolHandler {
  const timeoutMs = options.timeoutMs ?? DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS;
  return async (request, context) => {
    const mapping = options.tools.find((candidate) => {
      return candidate.namespace === request.namespace;
    });
    if (!mapping) {
      context.emitDebugEvent({
        message: `Dynamic tool namespace is not allowlisted: ${request.namespace ?? "(none)"}`,
        phase: "denied",
        success: false,
      });
      return dynamicToolFailure(
        `Dynamic tool namespace is not allowlisted: ${request.namespace ?? "(none)"}`,
      );
    }
    if (mapping.tools !== "all" && !mapping.tools.includes(request.tool)) {
      context.emitDebugEvent({
        message: `Dynamic tool is not allowlisted: ${request.namespace ?? "(none)"}${request.tool}`,
        phase: "denied",
        server: mapping.server,
        success: false,
      });
      return dynamicToolFailure(
        `Dynamic tool is not allowlisted: ${request.namespace ?? "(none)"}${request.tool}`,
      );
    }
    const threadId = await context.getMcpThreadId();
    context.emitDebugEvent({
      helperThreadId: threadId,
      phase: "mcpCallStarted",
      server: mapping.server,
    });
    const timeoutMessage =
      `Dynamic tool ${request.namespace ?? ""}${request.tool} timed out after ${timeoutMs}ms`;
    const response = await withTimeout(
      context.transport.request<
        { arguments?: unknown; server: string; threadId: string; tool: string },
        McpServerToolCallResponse
      >("mcpServer/tool/call", {
        arguments: request.arguments,
        server: mapping.server,
        threadId,
        tool: request.tool,
      }),
      timeoutMs,
      timeoutMessage,
      () => {
        context.emitDebugEvent({
          helperThreadId: threadId,
          message: timeoutMessage,
          phase: "timeout",
          server: mapping.server,
          success: false,
        });
      },
    );
    return mcpResponseToDynamicToolResponse(response);
  };
}

export async function createDynamicToolHelperThread(
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  cwd?: string,
): Promise<string> {
  const response = await createCodexSession(transport).thread.start({
    approvalPolicy: "on-request",
    ...(cwd ? { cwd } : {}),
    sandbox: "workspace-write",
  });
  const threadId = extractThreadId(response);
  if (!threadId) throw new Error("Could not create dynamic tool helper thread");
  return threadId;
}

export async function maybeResolveHelperThreadRequest(
  event: AgentTransportEvent,
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  helperThreadId: Promise<string> | undefined,
  permissionPolicy: DynamicToolHelperPermissionPolicy = "manual",
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
    return resolveHelperPermissionRequest(
      {
        ...event,
        request: event.request,
        requestId: event.requestId,
      },
      transport,
      event.request.payload,
      permissionPolicy,
    );
  }

  return false;
}

export function dynamicToolFailure(error: unknown): DynamicToolCallResponse {
  const text = error instanceof Error ? error.message : String(error);
  return {
    contentItems: [
      { text: redactSecrets(text), type: "inputText" },
    ],
    success: false,
  };
}

function dynamicToolRequestFromPending(request: PendingServerRequest | undefined): DynamicToolRequest {
  const payload = isRecord(request?.payload) ? request.payload : {};
  const namespace = payload.namespace;
  return {
    arguments: payload.arguments,
    callId: String(payload.callId ?? payload.call_id ?? ""),
    namespace: typeof namespace === "string" ? namespace : null,
    threadId: String(payload.threadId ?? payload.thread_id ?? ""),
    tool: String(payload.tool ?? ""),
    turnId: String(payload.turnId ?? payload.turn_id ?? ""),
  };
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
  onTimeout?: () => void,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          onTimeout?.();
          reject(new Error(message));
        }, timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function dynamicToolDebugEventFromRequest(
  requestId: NonNullable<AgentTransportEvent["requestId"]>,
  request: DynamicToolRequest,
  details: DynamicToolDebugEventDetails,
): DynamicToolDebugEvent {
  return {
    ...details,
    audience: details.audience ?? ["developer", "audit"],
    ...(details.message ? { message: redactSecrets(details.message) } : {}),
    request: {
      callId: request.callId,
      namespace: request.namespace,
      threadId: request.threadId,
      tool: request.tool,
      turnId: request.turnId,
    },
    requestId,
    type: "dynamicTool",
  };
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

async function resolveHelperPermissionRequest(
  event: AgentTransportEvent & {
    request: PendingServerRequest;
    requestId: NonNullable<AgentTransportEvent["requestId"]>;
  },
  transport: ReturnType<typeof createCodexAppServerBridge>["transport"],
  payload: Record<string, unknown>,
  policy: DynamicToolHelperPermissionPolicy,
): Promise<boolean> {
  if (policy === "manual") return false;
  if (policy === "deny") {
    await transport.reject(event.requestId, {
      code: -32001,
      message: "Dynamic tool helper permissions denied by host policy",
    });
    return true;
  }
  const requested = requestedPermissionsFromPayload(payload);
  const decision =
    policy === "grantRequestedForTurn"
      ? { action: "grant" as const, permissions: requested }
      : policy({
          cwd: stringValue(payload.cwd),
          payload,
          requestId: event.requestId,
          requested,
          threadId: stringValue(payload.threadId),
          turnId: stringValue(payload.turnId),
        });
  if (!decision || decision.action === "manual") return false;
  if (decision.action === "deny") {
    await transport.reject(event.requestId, {
      code: -32001,
      message: "Dynamic tool helper permissions denied by host policy",
    });
    return true;
  }
  await transport.respond(event.requestId, {
    permissions: boundedGrantedPermissions(decision.permissions, requested),
    scope: "turn",
  });
  return true;
}

function requestedPermissionsFromPayload(
  payload: Record<string, unknown>,
): DynamicToolHelperPermissionContext["requested"] {
  const permissions = isRecord(payload.permissions) ? payload.permissions : {};
  return {
    ...(permissions.fileSystem !== undefined && permissions.fileSystem !== null
      ? { fileSystem: permissions.fileSystem }
      : {}),
    ...(permissions.network !== undefined && permissions.network !== null
      ? { network: permissions.network }
      : {}),
  };
}

function boundedGrantedPermissions(
  permissions: DynamicToolHelperGrantedPermissions,
  requested: DynamicToolHelperPermissionContext["requested"],
): Record<string, unknown> {
  const fileSystem = boundedFileSystemPermission(
    permissions.fileSystem,
    requested.fileSystem,
  );
  const network = boundedGenericPermission(permissions.network, requested.network);
  return {
    ...(fileSystem !== undefined ? { fileSystem } : {}),
    ...(network !== undefined ? { network } : {}),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
