import type { AgentEvent, PendingServerRequest } from "@nyosegawa/agent-ui-core";
import { stableServerRequestMethods, type StableServerRequestMethod } from "../protocol";
import type { MethodMessage } from "./shared";
import { asRecord, optionalStringValue, requestIdValue } from "./shared";

const serverRequestKindByMethod = {
  "account/chatgptAuthTokens/refresh": "authRefresh",
  applyPatchApproval: "legacyPatchApproval",
  "attestation/generate": "attestation",
  execCommandApproval: "legacyExecApproval",
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
  return isServerRequestMethod(method)
    ? serverRequestKindByMethod[method]
    : "unknown";
}
