import type {
  AgentItemBlock,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import {
  commandTextForItem,
  displayText,
  isRecord,
  numberValue,
  stringValue,
} from "./formatters";

export function blockForTranscriptItem(
  turn: TurnState,
  itemId: string,
  block: AgentItemBlock | undefined,
): AgentItemBlock {
  if (block) return block;
  const item = turn.items[itemId];
  const raw = isRecord(item?.raw) ? item.raw : {};
  const activityKind = activityKindForId(turn, itemId);
  if (activityKind === "commandExecution") {
    return {
      command: commandTextForItem(item) ?? displayText(item?.text) ?? itemId,
      id: itemId,
      kind: "commandExecution",
      status: item?.status,
    };
  }
  if (activityKind === "fileChange") {
    return {
      changes: Array.isArray(raw.changes) ? raw.changes : undefined,
      id: itemId,
      kind: "fileChange",
      status: item?.status,
      text: displayText(item?.text),
    };
  }
  if (item?.kind === "mcpToolCall") {
    return {
      arguments: raw.arguments ?? raw.args,
      durationMs: numberValue(raw.durationMs ?? raw.duration_ms),
      error: raw.error,
      id: itemId,
      kind: "mcpToolCall",
      raw: item.raw,
      result: raw.result ?? raw.contentItems ?? raw.content_items,
      server: stringValue(raw.server),
      status: item.status,
      text: displayText(item.text),
      tool: stringValue(raw.tool ?? raw.name) ?? displayText(item.text),
      toolType: "mcp",
    };
  }
  if (
    item?.kind === "toolCall" ||
    item?.kind === "dynamicTool" ||
    item?.kind === "dynamicToolCall"
  ) {
    return {
      arguments: raw.arguments ?? raw.args,
      durationMs: numberValue(raw.durationMs ?? raw.duration_ms),
      error: raw.error,
      id: itemId,
      kind: "toolCall",
      raw: item.raw,
      result: raw.result ?? raw.contentItems ?? raw.content_items,
      server: stringValue(raw.server),
      status: item.status,
      text: displayText(item.text),
      tool: stringValue(raw.tool ?? raw.name) ?? displayText(item.text),
      toolType:
        item.kind === "dynamicTool" || item.kind === "dynamicToolCall"
          ? "dynamic"
          : "generic",
    };
  }
  return {
    id: itemId,
    kind: "text",
    text: displayText(item?.text ?? turn.streamingTextByItemId[itemId]) ?? "",
  };
}

function activityKindForId(
  turn: TurnState,
  itemId: string,
): "commandExecution" | "fileChange" | undefined {
  const kind = turn.items[itemId]?.kind;
  if (kind === "commandExecution" || kind === "fileChange") return kind;
  if (itemId in turn.commandOutputByItemId) return "commandExecution";
  if (itemId in turn.filePatchByItemId) return "fileChange";
  return undefined;
}
