import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import {
  asRecord,
  normalizeThread,
  normalizeThreadStatus,
  normalizeTurn,
  numberValue,
  optionalStringValue,
} from "./shared";

export function normalizeThreadNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
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
          name: String(params.threadName ?? params.thread_name ?? params.name ?? ""),
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/tokenUsage/updated":
      return [normalizeTokenUsage(params)];
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
    default:
      return undefined;
  }
}

function normalizeTokenUsage(params: Record<string, unknown>): AgentEvent {
  const tokenUsage = asRecord(params.tokenUsage);
  const totalUsage = asRecord(tokenUsage?.total) ?? tokenUsage;
  const lastUsage = asRecord(tokenUsage?.last);
  return {
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
              numberValue(lastUsage.totalTokens) ?? numberValue(lastUsage.total_tokens),
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
      turnId: optionalStringValue(params.turnId ?? params.turn_id),
      raw: params,
    },
  };
}
