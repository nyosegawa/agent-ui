import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";

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
    command: stringValue(payload.command),
    cwd: stringValue(payload.cwd),
    itemId: stringValue(payload.itemId),
    payload,
    reason: stringValue(payload.reason),
    requestId,
    threadId: stringValue(payload.threadId),
    turnId: stringValue(payload.turnId),
  };
}

function fileChangeApprovalContext(
  payload: Record<string, unknown>,
  requestId: NonNullable<AgentTransportEvent["requestId"]>,
): FileChangeApprovalContext {
  return {
    grantRoot: stringValue(payload.grantRoot),
    itemId: stringValue(payload.itemId),
    payload,
    reason: stringValue(payload.reason),
    requestId,
    threadId: stringValue(payload.threadId),
    turnId: stringValue(payload.turnId),
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

export function boundedFileSystemPermission(
  granted: unknown,
  requested: unknown,
): unknown {
  if (granted === undefined || granted === null || requested === undefined) return undefined;
  if (typeof requested === "string") {
    if (granted === requested) return granted;
    if (isRecord(granted) && granted.mode === requested) return granted;
    return undefined;
  }
  if (!isRecord(requested)) return boundedGenericPermission(granted, requested);
  if (!isRecord(granted)) return undefined;
  if (
    typeof requested.mode === "string" &&
    typeof granted.mode === "string" &&
    granted.mode !== requested.mode
  ) {
    return undefined;
  }
  if (Array.isArray(requested.paths)) {
    if (!Array.isArray(granted.paths)) return undefined;
    const requestedPaths = new Set(requested.paths.filter((path) => typeof path === "string"));
    if (!granted.paths.every((path) => typeof path === "string" && requestedPaths.has(path))) {
      return undefined;
    }
    return granted;
  }
  return boundedProtocolFileSystemPermission(granted, requested);
}

function boundedProtocolFileSystemPermission(
  granted: Record<string, unknown>,
  requested: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const read = boundedPathArrayPermission(granted.read, requested.read);
  const write = boundedPathArrayPermission(granted.write, requested.write);
  const entries = boundedEntriesPermission(granted.entries, requested.entries);
  const globScanMaxDepth = boundedMaxDepthPermission(
    granted.globScanMaxDepth,
    requested.globScanMaxDepth,
  );
  const bounded = {
    ...(read !== undefined ? { read } : {}),
    ...(write !== undefined ? { write } : {}),
    ...(entries !== undefined ? { entries } : {}),
    ...(globScanMaxDepth !== undefined ? { globScanMaxDepth } : {}),
  };
  return Object.keys(bounded).length > 0 ? bounded : undefined;
}

function boundedPathArrayPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (!Array.isArray(granted) || !Array.isArray(requested)) return undefined;
  const requestedPaths = new Set(requested.filter((path) => typeof path === "string"));
  if (!granted.every((path) => typeof path === "string" && requestedPaths.has(path))) {
    return undefined;
  }
  return granted;
}

function boundedEntriesPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (!Array.isArray(granted) || !Array.isArray(requested)) return undefined;
  const requestedEntries = new Set(requested.map(permissionEntryKey).filter(Boolean));
  if (
    !granted.every((entry) => {
      const key = permissionEntryKey(entry);
      return key !== undefined && requestedEntries.has(key);
    })
  ) {
    return undefined;
  }
  return granted;
}

function permissionEntryKey(entry: unknown): string | undefined {
  if (!isRecord(entry)) return undefined;
  return JSON.stringify({
    access: entry.access,
    path: entry.path,
  });
}

function boundedMaxDepthPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null) return undefined;
  if (typeof granted !== "number" || typeof requested !== "number") return undefined;
  return granted <= requested ? granted : undefined;
}

function boundedGenericPermission(granted: unknown, requested: unknown): unknown {
  if (granted === undefined || granted === null || requested === undefined) return undefined;
  return JSON.stringify(granted) === JSON.stringify(requested) ? granted : undefined;
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

function threadIdFromPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  return stringValue(payload.threadId ?? payload.thread_id);
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
