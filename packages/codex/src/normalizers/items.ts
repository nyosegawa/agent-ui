import type { AgentEvent } from "@nyosegawa/agent-ui-core";
import { decodeBase64Delta, decodeDelta, normalizeItem } from "./shared";

export function normalizeItemNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
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
          delta:
            method === "command/exec/outputDelta"
              ? decodeBase64Delta(params.deltaBase64)
              : decodeDelta(params.delta ?? params.data ?? params.chunk ?? ""),
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
          patch: params.changes ?? params.patch ?? params.diff ?? params,
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    default:
      return undefined;
  }
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
