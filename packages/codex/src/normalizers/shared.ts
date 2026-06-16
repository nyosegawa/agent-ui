import type {
  AgentItemMetadata,
  AgentItemState,
  AgentThread,
  AgentTurn,
  ThreadStatus,
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
    name:
      stringValue(record.name) ??
      stringValue(record.title) ??
      stringValue(record.preview),
    path: threadProjectPath(record),
  };
}

export function normalizeThreadStatus(value: unknown): ThreadStatus {
  if (typeof value === "string") return threadStatusValue(value);
  const record = asRecord(value);
  const type = record?.type;
  if (type === "active" && record) {
    const flags = activeFlags(record);
    return flags.includes("waitingOnUserInput") || flags.includes("waitingOnApproval")
      ? "waitingForInput"
      : "running";
  }
  if (type === "idle") return "loaded";
  if (type === "systemError") return "systemError";
  if (type === "notLoaded") return "notLoaded";
  return "notLoaded";
}

function activeFlags(record: Record<string, unknown>): string[] {
  return Array.isArray(record.activeFlags)
    ? record.activeFlags.filter((flag): flag is string => typeof flag === "string")
    : [];
}

function threadStatusValue(value: string): ThreadStatus {
  switch (value) {
    case "notLoaded":
    case "loaded":
    case "ready":
    case "running":
    case "waitingForInput":
    case "complete":
    case "completed":
    case "interrupted":
    case "error":
    case "failed":
    case "archived":
    case "closed":
    case "systemError":
      return value;
    default:
      return "loaded";
  }
}

export function normalizeTurn(raw: unknown, threadId: string): AgentTurn {
  const record = asRecord(raw) ?? {};
  return {
    id: String(record.id ?? record.turnId ?? record.turn_id),
    itemsView: itemsViewValue(record.itemsView ?? record.items_view),
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
    metadata: itemMetadata(record),
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

function itemMetadata(raw: Record<string, unknown>): AgentItemMetadata | undefined {
  const metadata: AgentItemMetadata = {};
  copyString(metadata, "clientUserMessageId", raw.clientUserMessageId ?? raw.clientId ?? raw.client_id);
  copyString(metadata, "command", raw.command);
  copyString(metadata, "content", textParts(raw.content));
  copyString(metadata, "cwd", raw.cwd);
  copyString(metadata, "displayName", raw.displayName ?? raw.display_name);
  copyNumber(metadata, "durationMs", raw.durationMs ?? raw.duration_ms);
  metadata.error = raw.error;
  copyNumber(metadata, "exitCode", raw.exitCode ?? raw.exit_code);
  copyString(metadata, "fileName", raw.fileName ?? raw.file_name ?? raw.filename);
  copyString(metadata, "imageUrl", raw.imageUrl ?? raw.image_url);
  copyString(metadata, "mimeType", raw.mimeType ?? raw.mime_type);
  copyString(metadata, "name", raw.name);
  copyString(metadata, "path", raw.path ?? raw.savedPath ?? raw.saved_path);
  copyString(metadata, "previewUrl", raw.previewUrl ?? raw.preview_url);
  copyString(metadata, "query", raw.query);
  copyString(metadata, "redactedPath", raw.redactedPath ?? raw.redacted_path);
  metadata.result = raw.result ?? raw.contentItems ?? raw.content_items;
  copyString(metadata, "review", raw.review);
  copyString(metadata, "server", raw.server);
  copyString(metadata, "summary", textParts(raw.summary));
  copyString(metadata, "tool", raw.tool);
  copyString(metadata, "url", raw.url);
  metadata.arguments = raw.arguments ?? raw.args;
  if (Array.isArray(raw.changes)) metadata.changes = raw.changes;
  return Object.values(metadata).some((value) => value !== undefined) ? metadata : undefined;
}

function textParts(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  const text = value
    .map((part) => {
      if (typeof part === "string") return part;
      const record = asRecord(part);
      return typeof record?.text === "string" ? record.text : undefined;
    })
    .filter(isNonEmptyString)
    .join("");
  return text || undefined;
}

function copyString<T extends keyof AgentItemMetadata>(
  metadata: AgentItemMetadata,
  key: T,
  value: unknown,
) {
  const text = stringValue(value);
  if (text) {
    (metadata[key] as string | undefined) = text;
  }
}

function copyNumber<T extends keyof AgentItemMetadata>(
  metadata: AgentItemMetadata,
  key: T,
  value: unknown,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    (metadata[key] as number | undefined) = value;
  }
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

export function decodeBase64Delta(delta: unknown): string {
  if (typeof delta !== "string") return "";
  const buffer = (
    globalThis as {
      Buffer?: { from(input: string, encoding: "base64"): { toString(encoding: "utf8"): string } };
    }
  ).Buffer;
  if (buffer) {
    return buffer.from(delta, "base64").toString("utf8");
  }
  const binary = globalThis.atob?.(delta);
  if (!binary) return "";
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

export function itemsViewValue(value: unknown): AgentTurn["itemsView"] {
  return value === "notLoaded" || value === "summary" || value === "full"
    ? value
    : undefined;
}

export function requestIdValue(value: unknown): string | number {
  return typeof value === "string" || typeof value === "number" ? value : "";
}

export function optionalStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function threadProjectPath(rawThread: Record<string, unknown>): string | undefined {
  const cwd =
    stringValue(rawThread.cwd) ??
    stringValue(rawThread.workingDirectory) ??
    stringValue(rawThread.working_directory);
  if (cwd) return cwd;
  const path = stringValue(rawThread.path);
  return path && !isInternalCodexSessionPath(path) ? path : undefined;
}

function isInternalCodexSessionPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return normalized.includes("/.codex/sessions/") || normalized.endsWith(".jsonl");
}
