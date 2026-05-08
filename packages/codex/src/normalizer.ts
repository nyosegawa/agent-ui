import type {
  AgentEvent,
  AgentItemState,
  AgentModel,
  AgentThread,
  AgentTurn,
  PendingServerRequest,
} from "@nyosegawa/agent-ui-core";

interface MethodMessage {
  id?: string | number;
  method: string;
  params?: any;
}

export function normalizeCodexServerMessage(message: MethodMessage): AgentEvent[] {
  if ("id" in message && message.id != null && isServerRequestMethod(message.method)) {
    return [{ type: "serverRequest/created", request: normalizeServerRequest(message) }];
  }

  const params = message.params ?? {};
  switch (message.method) {
    case "account/updated":
      return [
        {
          type: "account/updated",
          account: params.account ?? params,
          status: accountStatus(params.account ?? params),
        },
      ];
    case "account/login/completed":
      return [{ type: "account/login/completed", account: params.account ?? params }];
    case "account/rateLimits/updated":
      return [{ type: "account/rateLimits/updated", rateLimits: params.rateLimits ?? params }];
    case "configWarning":
    case "warning":
      return [
        {
          type: "warning/added",
          warning: {
            id: String(params.id ?? params.code ?? Date.now()),
            message: String(params.message ?? params.warning ?? "Codex warning"),
            raw: params,
          },
        },
      ];
    case "error":
      return [
        {
          type: "error/added",
          error: {
            code: params.code,
            data: params.data,
            message: String(params.message ?? "Codex error"),
          },
        },
      ];
    case "thread/started": {
      const thread = normalizeThread(params.thread ?? params);
      return [
        {
          type: "thread/started",
          status: params.status ?? params.thread?.status,
          thread,
          turns: Array.isArray(params.turns)
            ? params.turns.map((turn: any) => normalizeTurn(turn, thread.id))
            : undefined,
        },
      ];
    }
    case "thread/status/changed":
      return [
        {
          type: "thread/status/changed",
          status: params.status,
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/name/updated":
      return [
        {
          type: "thread/name/updated",
          name: String(params.name ?? ""),
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/tokenUsage/updated":
      return [
        {
          type: "thread/tokenUsage/updated",
          threadId: String(params.threadId ?? params.thread_id),
          tokenUsage: {
            inputTokens: params.tokenUsage?.inputTokens ?? params.inputTokens,
            outputTokens: params.tokenUsage?.outputTokens ?? params.outputTokens,
            totalTokens: params.tokenUsage?.totalTokens ?? params.totalTokens,
            raw: params,
          },
        },
      ];
    case "turn/started":
      return [
        {
          type: "turn/started",
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(params.turn ?? params, String(params.threadId ?? params.thread_id)),
        },
      ];
    case "turn/completed":
      return [
        {
          type: "turn/completed",
          items: Array.isArray(params.items)
            ? params.items.map((item: any) => normalizeItem(item, params))
            : undefined,
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(params.turn ?? params, String(params.threadId ?? params.thread_id)),
        },
      ];
    case "turn/plan/updated":
      return [
        {
          explanation: params.explanation,
          plan: params.plan ?? [],
          raw: params,
          threadId: String(params.threadId ?? params.thread_id),
          turnId: String(params.turnId ?? params.turn_id),
          type: "turn/plan/updated",
        },
      ];
    case "item/started":
      return [
        {
          type: "item/started",
          item: normalizeItem(params.item ?? params, params),
          threadId: String(params.threadId ?? params.thread_id),
          turnId: String(params.turnId ?? params.turn_id),
        },
      ];
    case "item/completed":
      return [
        {
          type: "item/completed",
          item: normalizeItem(params.item ?? params, params),
          threadId: String(params.threadId ?? params.thread_id),
          turnId: String(params.turnId ?? params.turn_id),
        },
      ];
    case "item/agentMessage/delta":
      return [deltaEvent("item/agentMessage/delta", params)];
    case "item/reasoning/summaryTextDelta":
      return [deltaEvent("item/reasoning/summaryTextDelta", params)];
    case "item/commandExecution/outputDelta":
    case "item/fileChange/outputDelta":
    case "command/exec/outputDelta":
      return [
        {
          type: "item/commandOutput/delta",
          delta: decodeDelta(params.delta ?? params.data ?? params.chunk ?? ""),
          itemId: String(params.itemId ?? params.item_id ?? params.processId ?? "command"),
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    case "item/fileChange/patchUpdated":
    case "turn/diff/updated":
      return [
        {
          type: "item/filePatch/updated",
          itemId: String(params.itemId ?? params.item_id ?? "diff"),
          patch: params.patch ?? params.diff ?? params,
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    case "serverRequest/resolved":
      return [
        {
          type: "serverRequest/resolved",
          requestId: params.requestId ?? params.request_id ?? params.id,
        },
      ];
    default:
      return [];
  }
}

export function normalizeModelListResponse(response: any): AgentModel[] {
  const models = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.models)
      ? response.models
      : Array.isArray(response)
        ? response
        : [];
  return models.map((model: any) => ({
    id: String(model.id ?? model.slug ?? model.name),
    defaultEffort: model.defaultReasoningEffort ?? model.default_effort,
    name: model.name ?? model.displayName ?? model.model,
    raw: model,
    supportedEfforts: Array.isArray(model.supportedReasoningEfforts)
      ? model.supportedReasoningEfforts
          .map((effort: any) => effort.reasoningEffort ?? effort)
          .filter(Boolean)
      : undefined,
  }));
}

function normalizeThread(raw: any): AgentThread {
  return {
    ephemeral: raw.ephemeral,
    id: String(raw.id ?? raw.threadId ?? raw.thread_id),
    name: raw.name ?? raw.title,
    path: raw.path,
    raw,
  };
}

function normalizeTurn(raw: any, threadId: string): AgentTurn {
  return {
    id: String(raw.id ?? raw.turnId ?? raw.turn_id),
    raw,
    status: raw.status,
    threadId,
  };
}

function normalizeItem(raw: any, context: any): AgentItemState {
  const kind = raw.kind ?? raw.type ?? raw.itemType ?? raw.item_type ?? "unknown";
  return {
    id: String(raw.id ?? raw.itemId ?? raw.item_id),
    kind: String(kind),
    raw,
    status: raw.status === "failed" ? "failed" : raw.status === "completed" ? "completed" : "inProgress",
    text: raw.text ?? raw.message ?? raw.content,
    threadId: String(raw.threadId ?? raw.thread_id ?? context.threadId ?? context.thread_id),
    turnId: String(raw.turnId ?? raw.turn_id ?? context.turnId ?? context.turn_id),
  };
}

function deltaEvent(
  type: "item/agentMessage/delta" | "item/reasoning/summaryTextDelta",
  params: any,
): AgentEvent {
  return {
    type,
    delta: decodeDelta(params.delta ?? params.text ?? ""),
    itemId: String(params.itemId ?? params.item_id),
    threadId: String(params.threadId ?? params.thread_id),
    turnId: String(params.turnId ?? params.turn_id),
  };
}

function normalizeServerRequest(message: MethodMessage): PendingServerRequest {
  const params = message.params ?? {};
  return {
    id: message.id ?? "",
    itemId: params.itemId ?? params.item_id,
    kind: requestKind(message.method),
    payload: params,
    threadId: params.threadId ?? params.thread_id,
    turnId: params.turnId ?? params.turn_id,
  };
}

function isServerRequestMethod(method: string): boolean {
  return method.includes("requestApproval") || method.includes("Approval") || method.includes("requestUserInput");
}

function requestKind(method: string): PendingServerRequest["kind"] {
  if (method.includes("command") || method === "execCommandApproval") return "commandApproval";
  if (method.includes("fileChange") || method === "applyPatchApproval") return "fileChangeApproval";
  if (method.includes("requestUserInput")) return "userInput";
  return "unknown";
}

function accountStatus(account: unknown): "unauthenticated" | "authenticated" {
  if (account == null) return "unauthenticated";
  if (typeof account === "object" && "authMethod" in account && (account as any).authMethod == null) {
    return "unauthenticated";
  }
  return "authenticated";
}

function decodeDelta(delta: unknown): string {
  if (typeof delta !== "string") return "";
  return delta;
}
