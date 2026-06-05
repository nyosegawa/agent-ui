import type {
  AgentItemBlock,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import {
  commandTextForItem,
  displayText,
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
  const metadata = item?.metadata ?? {};
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
      changes: Array.isArray(metadata.changes) ? metadata.changes : undefined,
      id: itemId,
      kind: "fileChange",
      status: item?.status,
      text: displayText(item?.text),
    };
  }
  if (item?.kind === "mcpToolCall") {
    return {
      arguments: metadata.arguments,
      durationMs: numberValue(metadata.durationMs),
      error: metadata.error,
      id: itemId,
      kind: "mcpToolCall",
      result: metadata.result,
      server: stringValue(metadata.server),
      status: item.status,
      text: displayText(item.text),
      tool: stringValue(metadata.tool ?? metadata.name) ?? displayText(item.text),
      toolType: "mcp",
    };
  }
  if (
    item?.kind === "toolCall" ||
    item?.kind === "dynamicTool" ||
    item?.kind === "dynamicToolCall"
  ) {
    return {
      arguments: metadata.arguments,
      durationMs: numberValue(metadata.durationMs),
      error: metadata.error,
      id: itemId,
      kind: "toolCall",
      result: metadata.result,
      server: stringValue(metadata.server),
      status: item.status,
      text: displayText(item.text),
      tool: stringValue(metadata.tool ?? metadata.name) ?? displayText(item.text),
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
