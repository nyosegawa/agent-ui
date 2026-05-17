import type {
  AgentEvent,
  AgentApp,
  AgentItemState,
  AgentModel,
  AgentThread,
  AgentTurn,
  PendingServerRequest,
} from "@nyosegawa/agent-ui-core";
import { stableNotificationMethods } from "./protocol";

interface MethodMessage {
  id?: string | number;
  method: string;
  params?: unknown;
}

export function normalizeCodexServerMessage(message: MethodMessage): AgentEvent[] {
  if ("id" in message && message.id != null && isServerRequestMethod(message.method)) {
    return [{ type: "serverRequest/created", request: normalizeServerRequest(message) }];
  }

  const params = asRecord(message.params) ?? {};
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
      return [
        {
          type: "account/login/completed",
          account: params.account,
          error: stringValue(params.error) ?? null,
          loginId: stringValue(params.loginId) ?? stringValue(params.login_id),
          success: booleanValue(params.success),
        },
      ];
    case "account/rateLimits/updated":
      return [
        { type: "account/rateLimits/updated", rateLimits: params.rateLimits ?? params },
      ];
    case "warning":
      return [
        {
          type: "warning/added",
          warning: {
            id: String(params.id ?? params.code ?? params.message ?? "codex-warning"),
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
            code: numberValue(params.code),
            data: params.data,
            message: String(params.message ?? "Codex error"),
          },
        },
      ];
    case "thread/started": {
      const thread = normalizeThread(params.thread ?? params);
      const threadRecord = asRecord(params.thread);
      return [
        {
          type: "thread/started",
          status: normalizeThreadStatus(params.status ?? threadRecord?.status),
          thread,
          turns: Array.isArray(params.turns)
            ? params.turns.map((turn) => normalizeTurn(turn, thread.id))
            : undefined,
        },
      ];
    }
    case "thread/status/changed":
      return [
        {
          type: "thread/status/changed",
          status: normalizeThreadStatus(params.status),
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/archived":
      return [
        {
          type: "thread/status/changed",
          status: "archived",
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/unarchived":
      return [
        {
          type: "thread/status/changed",
          status: "loaded",
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/closed":
      return [
        {
          type: "thread/status/changed",
          status: "closed",
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
    case "thread/tokenUsage/updated": {
      const tokenUsage = asRecord(params.tokenUsage);
      const totalUsage = asRecord(tokenUsage?.total) ?? tokenUsage;
      const lastUsage = asRecord(tokenUsage?.last);
      return [
        {
          type: "thread/tokenUsage/updated",
          threadId: String(params.threadId ?? params.thread_id),
          tokenUsage: {
            cachedInputTokens:
              numberValue(totalUsage?.cachedInputTokens) ??
              numberValue(totalUsage?.cached_input_tokens) ??
              numberValue(params.cachedInputTokens),
            inputTokens:
              numberValue(totalUsage?.inputTokens) ??
              numberValue(totalUsage?.input_tokens) ??
              numberValue(params.inputTokens),
            last: lastUsage
              ? {
                  cachedInputTokens:
                    numberValue(lastUsage.cachedInputTokens) ??
                    numberValue(lastUsage.cached_input_tokens),
                  inputTokens:
                    numberValue(lastUsage.inputTokens) ??
                    numberValue(lastUsage.input_tokens),
                  outputTokens:
                    numberValue(lastUsage.outputTokens) ??
                    numberValue(lastUsage.output_tokens),
                  reasoningOutputTokens:
                    numberValue(lastUsage.reasoningOutputTokens) ??
                    numberValue(lastUsage.reasoning_output_tokens),
                  totalTokens:
                    numberValue(lastUsage.totalTokens) ??
                    numberValue(lastUsage.total_tokens),
                }
              : undefined,
            modelContextWindow:
              numberValue(tokenUsage?.modelContextWindow) ??
              numberValue(tokenUsage?.model_context_window) ??
              numberValue(params.modelContextWindow),
            outputTokens:
              numberValue(totalUsage?.outputTokens) ??
              numberValue(totalUsage?.output_tokens) ??
              numberValue(params.outputTokens),
            reasoningOutputTokens:
              numberValue(totalUsage?.reasoningOutputTokens) ??
              numberValue(totalUsage?.reasoning_output_tokens) ??
              numberValue(params.reasoningOutputTokens),
            totalTokens:
              numberValue(totalUsage?.totalTokens) ??
              numberValue(totalUsage?.total_tokens) ??
              numberValue(params.totalTokens),
            raw: params,
          },
        },
      ];
    }
    case "turn/started":
      return [
        {
          type: "turn/started",
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(
            params.turn ?? params,
            String(params.threadId ?? params.thread_id),
          ),
        },
      ];
    case "turn/completed":
      return [
        {
          type: "turn/completed",
          items: Array.isArray(params.items)
            ? params.items.map((item) => normalizeItem(item, params, "completed"))
            : undefined,
          threadId: String(params.threadId ?? params.thread_id),
          turn: normalizeTurn(
            params.turn ?? params,
            String(params.threadId ?? params.thread_id),
          ),
        },
      ];
    case "turn/plan/updated":
      return [
        {
          explanation: stringValue(params.explanation) ?? null,
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
          item: normalizeItem(params.item ?? params, params, "inProgress"),
          threadId: String(params.threadId ?? params.thread_id),
          turnId: String(params.turnId ?? params.turn_id),
        },
      ];
    case "item/completed":
      return [
        {
          type: "item/completed",
          item: normalizeItem(params.item ?? params, params, "completed"),
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
          itemId: String(
            params.itemId ?? params.item_id ?? params.processId ?? "command",
          ),
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    case "item/fileChange/patchUpdated":
      return [
        {
          type: "item/filePatch/updated",
          itemId: String(params.itemId ?? params.item_id ?? "diff"),
          patch: params.patch ?? params.diff ?? params,
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    case "turn/diff/updated":
      return [
        {
          type: "turn/diff/updated",
          diff: params.diff ?? params,
          raw: params,
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    case "serverRequest/resolved":
      return [
        {
          type: "serverRequest/resolved",
          requestId: requestIdValue(params.requestId ?? params.request_id ?? params.id),
        },
      ];
    case "app/list/updated":
      return [
        {
          type: "apps/updated",
          apps: normalizeApps(params.data ?? params.apps ?? []),
          nextCursor: optionalStringValue(params.nextCursor ?? params.next_cursor) ?? null,
          threadId: optionalStringValue(params.threadId ?? params.thread_id),
        },
      ];
    case "skills/changed":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: "skills-changed",
            kind: "system",
            message: "Skills changed. Re-run skills/list to refresh metadata.",
            raw: params,
          },
        },
      ];
    case "model/rerouted":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: `model-rerouted:${params.threadId ?? ""}:${params.turnId ?? ""}`,
            kind: "modelReroute",
            message: `Model rerouted from ${String(params.fromModel ?? "unknown")} to ${String(params.toModel ?? "unknown")}.`,
            raw: params,
          },
        },
      ];
    case "deprecationNotice":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: `deprecation:${params.summary ?? "notice"}`,
            kind: "deprecationNotice",
            message: joinSummaryDetails(params.summary, params.details, "Deprecation notice"),
            raw: params,
          },
        },
      ];
    case "configWarning":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: `config-warning:${params.path ?? params.summary ?? "warning"}`,
            kind: "configWarning",
            message: joinSummaryDetails(params.summary, params.details, "Config warning"),
            raw: params,
          },
        },
        {
          type: "warning/added",
          warning: {
            id: `config-warning:${params.path ?? params.summary ?? "warning"}`,
            message: joinSummaryDetails(params.summary, params.details, "Config warning"),
            raw: params,
          },
        },
      ];
    case "mcpServer/oauthLogin/completed":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: `mcp-oauth:${params.name ?? "server"}`,
            kind: "mcpOAuth",
            message:
              params.success === false
                ? `MCP OAuth failed for ${String(params.name ?? "server")}.`
                : `MCP OAuth completed for ${String(params.name ?? "server")}.`,
            raw: params,
          },
        },
      ];
    case "mcpServer/startupStatus/updated":
      return [
        {
          type: "status/banner/added",
          banner: {
            id: `mcp-startup:${params.name ?? "server"}`,
            kind: "system",
            message: `MCP server ${String(params.name ?? "server")} status: ${String(params.status ?? "unknown")}.`,
            raw: params,
          },
        },
      ];
    default:
      if (isStableNotificationMethod(message.method)) {
        return [
          {
            type: "notification/received",
            notification: {
              id: `codex-notification:${message.method}:${stringValue(params.threadId ?? params.thread_id) ?? ""}:${stringValue(params.turnId ?? params.turn_id) ?? ""}:${stringValue(params.itemId ?? params.item_id) ?? ""}`,
              method: message.method,
              params: message.params,
            },
          },
        ];
      }
      return [
        {
          type: "warning/added",
          warning: {
            id: `unsupported-codex-notification:${message.method}`,
            message: `Unsupported Codex notification: ${message.method}`,
          },
        },
      ];
  }
}

function isStableNotificationMethod(method: string): method is (typeof stableNotificationMethods)[number] {
  return (stableNotificationMethods as readonly string[]).includes(method);
}

export function normalizeApps(raw: unknown): AgentApp[] {
  const apps = Array.isArray(raw) ? raw : [];
  return apps.flatMap((app) => {
    const record = asRecord(app);
    if (!record) return [];
    return [
      {
        id: String(record.id ?? record.uri ?? record.name),
        installed: booleanValue(record.installed ?? record.isEnabled),
        name: stringValue(record.name),
        needsAuth: booleanValue(record.needsAuth) ?? record.isAccessible === false,
        raw: app,
        uri: stringValue(record.uri ?? record.installUrl),
      },
    ];
  });
}

export function normalizeModelListResponse(response: unknown): AgentModel[] {
  const record = asRecord(response);
  const models = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.models)
      ? record.models
      : Array.isArray(response)
        ? response
        : [];
  return models
    .flatMap((model) => {
      const record = asRecord(model);
      return record ? [record] : [];
    })
    .map((model) => ({
      id: String(model.id ?? model.slug ?? model.model ?? model.name),
      defaultEffort: normalizeReasoningEffort(
        model.defaultReasoningEffort ??
          model.default_reasoning_effort ??
          model.default_effort,
      ),
      name: normalizeModelName(model),
      raw: model,
      supportedEfforts: normalizeSupportedEfforts(model),
    }));
}

function normalizeModelName(model: Record<string, unknown>): string | undefined {
  const display = model.displayName ?? model.display_name ?? model.name;
  if (typeof display === "string" && display.trim()) return display;
  const id = model.model ?? model.id;
  return typeof id === "string" && id.trim() ? id : undefined;
}

function normalizeSupportedEfforts(
  model: Record<string, unknown>,
): AgentModel["supportedEfforts"] {
  const efforts = model.supportedReasoningEfforts ?? model.supported_reasoning_efforts;
  if (!Array.isArray(efforts)) return undefined;
  const normalized = efforts
    .map((effort) => {
      if (typeof effort === "string") return effort;
      const record = asRecord(effort);
      if (!record) return undefined;
      return normalizeReasoningEffort(record.reasoningEffort ?? record.reasoning_effort);
    })
    .filter(
      (effort: unknown): effort is string =>
        typeof effort === "string" && effort.length > 0,
    );
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeReasoningEffort(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeThread(raw: unknown): AgentThread {
  const record = asRecord(raw) ?? {};
  return {
    ephemeral: Boolean(record.ephemeral),
    id: String(record.id ?? record.threadId ?? record.thread_id),
    name: stringValue(record.name) ?? stringValue(record.title),
    path: stringValue(record.path),
    raw,
  };
}

function normalizeThreadStatus(value: unknown): string {
  if (typeof value === "string") return value;
  const type = asRecord(value)?.type;
  if (type === "active") return "running";
  if (type === "idle") return "loaded";
  return typeof type === "string" ? type : "notLoaded";
}

function normalizeTurn(raw: unknown, threadId: string): AgentTurn {
  const record = asRecord(raw) ?? {};
  return {
    id: String(record.id ?? record.turnId ?? record.turn_id),
    raw,
    status: stringValue(record.status),
    threadId,
  };
}

function normalizeItem(
  raw: unknown,
  context: unknown,
  defaultStatus: AgentItemState["status"] = "inProgress",
): AgentItemState {
  const record = asRecord(raw) ?? {};
  const contextRecord = asRecord(context) ?? {};
  const kind =
    record.kind ?? record.type ?? record.itemType ?? record.item_type ?? "unknown";
  return {
    id: String(record.id ?? record.itemId ?? record.item_id),
    kind: String(kind),
    raw,
    status:
      record.status === "failed"
        ? "failed"
        : record.status === "completed"
          ? "completed"
          : defaultStatus,
    text: itemText(record),
    threadId: String(
      record.threadId ??
        record.thread_id ??
        contextRecord.threadId ??
        contextRecord.thread_id,
    ),
    turnId: String(
      record.turnId ?? record.turn_id ?? contextRecord.turnId ?? contextRecord.turn_id,
    ),
  };
}

function itemText(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.text === "string") return raw.text;
  if (typeof raw.message === "string") return raw.message;
  if (Array.isArray(raw.summary)) return raw.summary.filter(isNonEmptyString).join("\n");
  if (Array.isArray(raw.content)) {
    return raw.content
      .map((part: unknown) => {
        if (typeof part === "string") return part;
        const record = asRecord(part);
        return typeof record?.text === "string" ? record.text : undefined;
      })
      .filter(isNonEmptyString)
      .join("\n");
  }
  if (typeof raw.command === "string") return raw.command;
  return undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function deltaEvent(
  type: "item/agentMessage/delta" | "item/reasoning/summaryTextDelta",
  params: Record<string, unknown>,
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

function isServerRequestMethod(method: string): boolean {
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

function joinSummaryDetails(
  summary: unknown,
  details: unknown,
  fallback: string,
): string {
  const summaryText = stringValue(summary) ?? fallback;
  const detailsText = stringValue(details);
  return detailsText ? `${summaryText} ${detailsText}` : summaryText;
}

function accountStatus(account: unknown): "unauthenticated" | "authenticated" {
  if (account == null) return "unauthenticated";
  const record = asRecord(account);
  if (record && "authMethod" in record && record.authMethod == null) {
    return "unauthenticated";
  }
  return "authenticated";
}

function decodeDelta(delta: unknown): string {
  if (typeof delta !== "string") return "";
  return delta;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function requestIdValue(value: unknown): string | number {
  return typeof value === "string" || typeof value === "number" ? value : "";
}

function optionalStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}
