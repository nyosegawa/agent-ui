import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import {
  boundedFileSystemPermission,
  boundedGenericPermission,
} from "./permission-bounding";

export interface ServerRequestPolicy {
  commandExecution?: CommandApprovalPolicy | "manual";
  decide?: ServerRequestPolicyCallback;
  fileChange?: FileChangeApprovalPolicy | "manual";
  mcpToolApproval?: "accept" | "manual";
  permissions?: PermissionApprovalPolicy | "manual";
  userInput?: "manual";
}

export interface ServerRequestPolicyContext {
  kind: PendingServerRequest["kind"];
  payload: unknown;
  request: PendingServerRequest;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  threadId?: string;
  turnId?: string;
}

export type ServerRequestPolicyDecision =
  | {
      action: "respond";
      auditAction?: string;
      response: unknown;
    }
  | { action: "manual" }
  | null
  | undefined;

export type ServerRequestPolicyCallback = (
  context: ServerRequestPolicyContext,
) => ServerRequestPolicyDecision;

export interface CommandApprovalContext {
  command?: string;
  cwd?: string;
  itemId?: string;
  payload: unknown;
  reason?: string;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  threadId?: string;
  turnId?: string;
}

export type CommandApprovalDecision =
  | {
      action: "accept";
      scope?: "request" | "session";
    }
  | { action: "manual" }
  | null
  | undefined;

export type CommandApprovalPolicy = (
  context: CommandApprovalContext,
) => CommandApprovalDecision;

export interface FileChangeApprovalContext {
  grantRoot?: string;
  itemId?: string;
  payload: unknown;
  reason?: string;
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  threadId?: string;
  turnId?: string;
}

export type FileChangeApprovalDecision =
  | {
      action: "accept";
      scope?: "request" | "session";
    }
  | { action: "manual" }
  | null
  | undefined;

export type FileChangeApprovalPolicy = (
  context: FileChangeApprovalContext,
) => FileChangeApprovalDecision;

export interface PermissionApprovalContext {
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

export type PermissionApprovalDecision =
  | {
      action: "grant";
      permissions: {
        fileSystem?: unknown;
        network?: unknown;
      };
      scope?: "session" | "turn";
    }
  | { action: "manual" }
  | null
  | undefined;

export type PermissionApprovalPolicy = (
  context: PermissionApprovalContext,
) => PermissionApprovalDecision;

export type ResolvedServerRequestPolicy = {
  commandExecution: CommandApprovalPolicy | "manual";
  decide?: ServerRequestPolicyCallback;
  fileChange: FileChangeApprovalPolicy | "manual";
  mcpToolApproval: NonNullable<ServerRequestPolicy["mcpToolApproval"]>;
  permissions: PermissionApprovalPolicy | "manual";
  userInput: NonNullable<ServerRequestPolicy["userInput"]>;
};

export function resolveServerRequestPolicy(
  policy?: ServerRequestPolicy,
): ResolvedServerRequestPolicy {
  return {
    commandExecution:
      typeof policy?.commandExecution === "function" ? policy.commandExecution : "manual",
    decide: policy?.decide,
    fileChange: typeof policy?.fileChange === "function" ? policy.fileChange : "manual",
    mcpToolApproval: policy?.mcpToolApproval ?? "manual",
    permissions: policy?.permissions ?? "manual",
    userInput: policy?.userInput ?? "manual",
  };
}

export function responseForServerRequest(
  event: AgentTransportEvent,
  policy: ResolvedServerRequestPolicy,
): {
  action: string;
  kind: PendingServerRequest["kind"];
  requestId: NonNullable<AgentTransportEvent["requestId"]>;
  response: unknown;
} | undefined {
  if (event.type !== "request" || event.requestId === undefined || !event.request) {
    return undefined;
  }
  const request = event.request;
  const requestId = event.requestId;

  const context = serverRequestPolicyContext(request, requestId);
  const customDecision = policy.decide?.(context);
  if (customDecision?.action === "manual") return undefined;
  if (customDecision?.action === "respond") {
    return {
      action: customDecision.auditAction ?? "custom",
      kind: request.kind,
      requestId,
      response: customDecision.response,
    };
  }

  if (
    event.request.kind === "mcpElicitation" &&
    policy.mcpToolApproval === "accept" &&
    isMcpToolApprovalElicitation(event.request.payload)
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
    typeof policy.permissions === "function" &&
    isRecord(event.request.payload)
  ) {
    const requested = requestedPermissionsFromPayload(event.request.payload);
    const decision = policy.permissions({
      cwd: stringValue(event.request.payload.cwd),
      payload: event.request.payload,
      requestId: event.requestId,
      requested,
      threadId: stringValue(event.request.payload.threadId),
      turnId: stringValue(event.request.payload.turnId),
    });
    if (!decision || decision.action !== "grant") return undefined;
    return {
      action: "grant",
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        permissions: boundedPermissions(decision.permissions, requested),
        scope: decision.scope ?? "turn",
      },
    };
  }

  if (
    event.request.kind === "commandApproval" &&
    typeof policy.commandExecution === "function" &&
    isRecord(event.request.payload)
  ) {
    const decision = policy.commandExecution(commandApprovalContext(event.request.payload, requestId));
    if (!decision || decision.action !== "accept") return undefined;
    return {
      action: commandDecisionValue(decision),
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        decision: commandDecisionValue(decision),
      },
    };
  }

  if (
    event.request.kind === "fileChangeApproval" &&
    typeof policy.fileChange === "function" &&
    isRecord(event.request.payload)
  ) {
    const decision = policy.fileChange(fileChangeApprovalContext(event.request.payload, requestId));
    if (!decision || decision.action !== "accept") return undefined;
    return {
      action: fileChangeDecisionValue(decision),
      kind: event.request.kind,
      requestId: event.requestId,
      response: {
        decision: fileChangeDecisionValue(decision),
      },
    };
  }

  return undefined;
}

function commandApprovalContext(
  payload: Record<string, unknown>,
  requestId: NonNullable<AgentTransportEvent["requestId"]>,
): CommandApprovalContext {
  return {
    command: commandValue(payload.command),
    cwd: stringValue(payload.cwd),
    itemId: stringValue(payload.itemId ?? payload.item_id ?? payload.callId),
    payload,
    reason: stringValue(payload.reason),
    requestId,
    threadId: stringValue(payload.threadId ?? payload.thread_id ?? payload.conversationId),
    turnId: stringValue(payload.turnId ?? payload.turn_id),
  };
}

function fileChangeApprovalContext(
  payload: Record<string, unknown>,
  requestId: NonNullable<AgentTransportEvent["requestId"]>,
): FileChangeApprovalContext {
  return {
    grantRoot: stringValue(payload.grantRoot),
    itemId: stringValue(payload.itemId ?? payload.item_id ?? payload.callId),
    payload,
    reason: stringValue(payload.reason),
    requestId,
    threadId: stringValue(payload.threadId ?? payload.thread_id ?? payload.conversationId),
    turnId: stringValue(payload.turnId ?? payload.turn_id),
  };
}

function commandDecisionValue(decision: Extract<CommandApprovalDecision, { action: "accept" }>): "accept" | "acceptForSession" {
  return decision.scope === "session" ? "acceptForSession" : "accept";
}

function fileChangeDecisionValue(decision: Extract<FileChangeApprovalDecision, { action: "accept" }>): "accept" | "acceptForSession" {
  return decision.scope === "session" ? "acceptForSession" : "accept";
}

function serverRequestPolicyContext(
  request: PendingServerRequest,
  requestId: NonNullable<AgentTransportEvent["requestId"]>,
): ServerRequestPolicyContext {
  const payload = request.payload;
  return {
    kind: request.kind,
    payload,
    request,
    requestId,
    threadId: request.threadId ?? threadIdFromPayload(payload),
    turnId: request.turnId ?? turnIdFromPayload(payload),
  };
}

function boundedPermissions(
  permissions: {
    fileSystem?: unknown;
    network?: unknown;
  },
  requested: PermissionApprovalContext["requested"],
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

function requestedPermissionsFromPayload(payload: Record<string, unknown>): PermissionApprovalContext["requested"] {
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

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function commandValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((part) => String(part)).join(" ");
  return undefined;
}

function threadIdFromPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  return stringValue(payload.threadId ?? payload.thread_id ?? payload.conversationId);
}

function turnIdFromPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  return stringValue(payload.turnId ?? payload.turn_id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMcpToolApprovalElicitation(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  const meta = isRecord(payload._meta) ? payload._meta : undefined;
  return meta?.codex_approval_kind === "mcp_tool_call";
}
