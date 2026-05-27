import { createCodexSession } from "@nyosegawa/agent-ui-codex";
import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type { createCodexAppServerBridge } from "./bridge";

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

const DEFAULT_DYNAMIC_TOOL_TIMEOUT_MS = 20_000;

export async function handleDynamicToolRequest(
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

export async function defaultDynamicToolHandler(
  request: DynamicToolRequest,
  context: DynamicToolHandlerContext,
): Promise<DynamicToolCallResponse> {
  const server = mcpServerNameFromDynamicNamespace(request.namespace);
  if (!server) {
    return dynamicToolFailure(
      `Unsupported dynamic tool namespace: ${request.namespace ?? "(none)"}`,
    );
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

export function dynamicToolFailure(error: unknown): DynamicToolCallResponse {
  return {
    contentItems: [
      { text: error instanceof Error ? error.message : String(error), type: "inputText" },
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
