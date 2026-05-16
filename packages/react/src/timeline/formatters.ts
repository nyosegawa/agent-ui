import type { ThreadState } from "@nyosegawa/agent-ui-core";

export function displayText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const text = value.map(displayText).filter(Boolean).join("\n");
    return text || undefined;
  }
  if (isRecord(value)) {
    if (typeof value.text === "string") return value.text;
    if (typeof value.message === "string") return value.message;
    const json = JSON.stringify(value, null, 2);
    return json === undefined ? undefined : json;
  }
  return String(value);
}

export function displayItemStatus(
  status: string,
  threadStatus: ThreadState["status"],
): string {
  if (status === "inProgress" && isHydratedThreadStatus(threadStatus)) {
    return "completed";
  }
  return status;
}

export function itemLabel(kind: string): string {
  switch (kind) {
    case "userMessage":
      return "You";
    case "agentMessage":
      return "Assistant";
    case "reasoning":
      return "Reasoning";
    case "plan":
      return "Plan";
    case "commandExecution":
      return "Command";
    case "fileChange":
      return "File change";
    case "toolCall":
    case "mcpToolCall":
      return "Tool";
    case "collabToolCall":
      return "Collab";
    case "webSearch":
      return "Web search";
    case "image":
    case "imageView":
      return "Image";
    case "systemInfo":
      return "System";
    case "contextCompaction":
      return "Compaction";
    case "thinking":
      return "Thinking";
    default:
      return kind
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (letter) => letter.toUpperCase());
  }
}

export function commandTextForItem(item: { raw?: unknown; text?: unknown } | undefined): string | undefined {
  const raw = item?.raw;
  if (!isRecord(raw)) return undefined;
  const command = raw.command;
  return typeof command === "string" && command.trim() ? command.trim() : undefined;
}

export function lineCount(value: string): number {
  if (!value) return 0;
  return value.split(/\r?\n/).length;
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(durationMs < 10_000 ? 1 : 0)}s`;
}

export function formatJson(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? "";
}

export function kindLabel(kind: string): string {
  if (kind === "add" || kind === "created") return "+";
  if (kind === "delete" || kind === "deleted") return "-";
  if (kind === "rename" || kind === "renamed") return "R";
  return "M";
}

export function shortId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) : id;
}

export function isVideoPath(path: string): boolean {
  return /\.(mp4|webm|mov|m4v)$/i.test(path);
}

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHydratedThreadStatus(status: ThreadState["status"]): boolean {
  return status === "loaded" || status === "complete" || status === "completed";
}
