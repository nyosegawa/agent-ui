import type {
  AgentItemState,
  AgentThread,
  AgentTurn,
} from "@nyosegawa/agent-ui-core";

export interface MethodMessage {
  id?: string | number;
  method: string;
  params?: unknown;
}

export function normalizeThread(raw: unknown): AgentThread {
  const record = asRecord(raw) ?? {};
  return {
    ephemeral: Boolean(record.ephemeral),
    id: String(record.id ?? record.threadId ?? record.thread_id),
    name: stringValue(record.name) ?? stringValue(record.title),
    path: stringValue(record.path),
    raw,
  };
}

export function normalizeThreadStatus(value: unknown): string {
  if (typeof value === "string") return value;
  const type = asRecord(value)?.type;
  if (type === "active") return "running";
  if (type === "idle") return "loaded";
  return typeof type === "string" ? type : "notLoaded";
}

export function normalizeTurn(raw: unknown, threadId: string): AgentTurn {
  const record = asRecord(raw) ?? {};
  return {
    id: String(record.id ?? record.turnId ?? record.turn_id),
    raw,
    status: stringValue(record.status),
    threadId,
  };
}

export function normalizeItem(
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

export function decodeDelta(delta: unknown): string {
  if (typeof delta !== "string") return "";
  return delta;
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function numberValue(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

export function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function requestIdValue(value: unknown): string | number {
  return typeof value === "string" || typeof value === "number" ? value : "";
}

export function optionalStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}
