import type { AgentItemBlock } from "@nyosegawa/agent-ui-core";
import { formatJson, isRecord } from "./formatters";

export function commandPreview(text: string): string {
  const preview = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!preview) return "";
  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

export function toolPreview(block: AgentItemBlock): string | undefined {
  if (block.status === "failed") return undefined;
  const resultPreview = toolResultPreview(block.result);
  if (resultPreview) return resultPreview;
  const argsPreview = block.status === "inProgress" ? compactJsonPreview(block.arguments) : undefined;
  if (argsPreview) return `args ${argsPreview}`;
  return undefined;
}

function toolResultPreview(value: unknown): string | undefined {
  const record = isRecord(value) ? value : undefined;
  const content = Array.isArray(record?.content) ? record.content : undefined;
  if (content && content.length > 0) {
    const textItem = content.find((item) => isRecord(item) && item.type === "text");
    if (isRecord(textItem) && typeof textItem.text === "string") {
      const preview = compactTextPreview(textItem.text);
      return preview && looksLikeMachinePreview(preview) ? "Result captured" : preview;
    }
    return `${content.length} result ${content.length === 1 ? "item" : "items"}`;
  }
  return value === undefined || value === null ? undefined : "Result captured";
}

function compactJsonPreview(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return compactTextPreview(formatJson(value));
}

function compactTextPreview(value: string): string | undefined {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function looksLikeMachinePreview(value: string): boolean {
  const text = value.trim();
  return (
    text.startsWith("{") ||
    text.startsWith("[") ||
    text.includes("\\n") ||
    text === "true" ||
    text === "false" ||
    text === "null" ||
    text === "undefined" ||
    /^-?\d+(\.\d+)?$/.test(text) ||
    /^[A-Z][A-Za-z]*Error:/.test(text)
  );
}
