import type { AgentTransportEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";

export interface ServerRequestPolicy {
  commandExecution?: "accept" | "acceptForSession" | "manual";
  fileChange?: "accept" | "acceptForSession" | "manual";
  mcpToolApproval?: "accept" | "manual";
  permissions?: "grant" | "manual";
  userInput?: "manual";
}

export type ResolvedServerRequestPolicy = Required<ServerRequestPolicy>;

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

function isMcpToolApprovalElicitation(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  const meta = isRecord(payload._meta) ? payload._meta : undefined;
  return meta?.codex_approval_kind === "mcp_tool_call";
}
