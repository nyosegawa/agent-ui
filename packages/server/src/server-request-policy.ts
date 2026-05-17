import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";

export interface ServerRequestPolicy {
  commandExecution?: "accept" | "acceptForSession" | "manual";
  fileChange?: "accept" | "acceptForSession" | "manual";
  mcpToolApproval?: "accept" | "manual";
  permissions?: PermissionApprovalPolicy | "manual";
  userInput?: "manual";
}

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
  commandExecution: NonNullable<ServerRequestPolicy["commandExecution"]>;
  fileChange: NonNullable<ServerRequestPolicy["fileChange"]>;
  mcpToolApproval: NonNullable<ServerRequestPolicy["mcpToolApproval"]>;
  permissions: PermissionApprovalPolicy | "manual";
  userInput: NonNullable<ServerRequestPolicy["userInput"]>;
};

export function resolveServerRequestPolicy(
  policy?: ServerRequestPolicy,
): ResolvedServerRequestPolicy {
  return {
    commandExecution: policy?.commandExecution ?? "manual",
    fileChange: policy?.fileChange ?? "manual",
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
        permissions: boundedPermissions(decision.permissions),
        scope: decision.scope ?? "turn",
      },
    };
  }

  if (event.request.kind === "commandApproval" && policy.commandExecution !== "manual") {
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

function boundedPermissions(permissions: {
  fileSystem?: unknown;
  network?: unknown;
}): Record<string, unknown> {
  return {
    ...(permissions.fileSystem !== undefined && permissions.fileSystem !== null
      ? { fileSystem: permissions.fileSystem }
      : {}),
    ...(permissions.network !== undefined && permissions.network !== null
      ? { network: permissions.network }
      : {}),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMcpToolApprovalElicitation(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  const meta = isRecord(payload._meta) ? payload._meta : undefined;
  return meta?.codex_approval_kind === "mcp_tool_call";
}
