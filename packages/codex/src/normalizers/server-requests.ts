import type { AgentEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import { stableServerRequestMethods, type StableServerRequestMethod } from "../protocol";
import type { MethodMessage } from "./shared";
import { asRecord, optionalStringValue, requestIdValue } from "./shared";

const serverRequestKindByMethod = {
  "account/chatgptAuthTokens/refresh": "authRefresh",
  applyPatchApproval: "fileChangeApproval",
  "attestation/generate": "attestation",
  execCommandApproval: "commandApproval",
  "item/commandExecution/requestApproval": "commandApproval",
  "item/fileChange/requestApproval": "fileChangeApproval",
  "item/permissions/requestApproval": "permissionsApproval",
  "item/tool/call": "dynamicTool",
  "item/tool/requestUserInput": "userInput",
  "mcpServer/elicitation/request": "mcpElicitation",
} as const satisfies Record<StableServerRequestMethod, PendingServerRequest["kind"]>;

const serverRequestMethodSet = new Set<StableServerRequestMethod>(stableServerRequestMethods);

export function normalizeServerRequestCreated(message: MethodMessage): AgentEvent {
  return { type: "serverRequest/created", request: normalizeServerRequest(message) };
}

export function normalizeServerRequestNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "serverRequest/resolved":
      return [
        {
          type: "serverRequest/resolved",
          requestId: requestIdValue(params.requestId ?? params.request_id ?? params.id),
        },
      ];
    default:
      return undefined;
  }
}

export function isServerRequestMethod(method: string): method is StableServerRequestMethod {
  return serverRequestMethodSet.has(method as StableServerRequestMethod);
}

function normalizeServerRequest(message: MethodMessage): PendingServerRequest {
  const params = asRecord(message.params) ?? {};
  const payload = normalizeServerRequestPayload(message.method, params);
  const legacyApproval = isLegacyApprovalMethod(message.method);
  return {
    id: message.id ?? "",
    itemId: optionalStringValue(
      payload.itemId ?? payload.item_id ?? (legacyApproval ? payload.callId : undefined),
    ),
    kind: requestKind(message.method),
    payload,
    threadId: optionalStringValue(payload.threadId ?? payload.thread_id),
    turnId: optionalStringValue(payload.turnId ?? payload.turn_id),
  };
}

function requestKind(method: string): PendingServerRequest["kind"] {
  return isServerRequestMethod(method)
    ? serverRequestKindByMethod[method]
    : "unknown";
}

function normalizeServerRequestPayload(
  method: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  if (!isLegacyApprovalMethod(method)) {
    return params;
  }

  const payload = { ...params };
  if (payload.threadId == null && payload.thread_id == null && payload.conversationId != null) {
    payload.threadId = payload.conversationId;
  }
  if (payload.itemId == null && payload.item_id == null && payload.callId != null) {
    payload.itemId = payload.callId;
  }
  if (method === "execCommandApproval" && Array.isArray(payload.command)) {
    payload.command = payload.command.map((part) => String(part)).join(" ");
  }
  return payload;
}

function isLegacyApprovalMethod(method: string): boolean {
  return method === "execCommandApproval" || method === "applyPatchApproval";
}
