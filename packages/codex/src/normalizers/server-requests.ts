import type { AgentEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import type { MethodMessage } from "./shared";
import { asRecord, optionalStringValue, requestIdValue } from "./shared";

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

export function isServerRequestMethod(method: string): boolean {
  return (
    method === "account/chatgptAuthTokens/refresh" ||
    method === "attestation/generate" ||
    method === "item/tool/call" ||
    method === "mcpServer/elicitation/request" ||
    method.includes("requestApproval") ||
    method.includes("Approval") ||
    method.includes("requestUserInput")
  );
}

function normalizeServerRequest(message: MethodMessage): PendingServerRequest {
  const params = asRecord(message.params) ?? {};
  return {
    id: message.id ?? "",
    itemId: optionalStringValue(params.itemId ?? params.item_id),
    kind: requestKind(message.method),
    payload: params,
    threadId: optionalStringValue(params.threadId ?? params.thread_id),
    turnId: optionalStringValue(params.turnId ?? params.turn_id),
  };
}

function requestKind(method: string): PendingServerRequest["kind"] {
  if (method === "account/chatgptAuthTokens/refresh") return "authRefresh";
  if (method === "attestation/generate") return "attestation";
  if (method === "item/tool/call") return "dynamicTool";
  if (method === "mcpServer/elicitation/request") return "mcpElicitation";
  if (method === "item/permissions/requestApproval") return "permissionsApproval";
  if (method === "execCommandApproval") return "legacyExecApproval";
  if (method === "applyPatchApproval") return "legacyPatchApproval";
  if (method.includes("command")) return "commandApproval";
  if (method.includes("fileChange")) return "fileChangeApproval";
  if (method.includes("requestUserInput")) return "userInput";
  return "unknown";
}
