import type {
  AgentItemBlock,
  AgentItemBlockKind,
  AgentItemMetadata,
  AgentItemState,
  ItemId,
  TurnState,
} from "../state";
import { boundedStringAppend } from "../retention";

export interface ItemStore {
  appendCommandOutput(
    turn: TurnState,
    itemId: ItemId,
    delta: string,
    maxChars: number,
  ): TurnState;
  appendStreamingText(turn: TurnState, itemId: ItemId, delta: string): TurnState;
  createItemBlock(item: AgentItemState): AgentItemBlock;
  updateFilePatch(
    turn: TurnState,
    itemId: ItemId,
    patch: unknown,
    maxEntries: number,
  ): TurnState;
  updateItemStatus(
    turn: TurnState,
    itemId: ItemId,
    status: AgentItemState["status"],
    options?: { metadata?: AgentItemState["metadata"] },
  ): TurnState;
  upsert(turn: TurnState, item: AgentItemState): TurnState;
}

export const itemStore: ItemStore = {
  appendCommandOutput,
  appendStreamingText,
  createItemBlock,
  updateFilePatch,
  updateItemStatus,
  upsert: upsertItem,
};

export function upsertItem(turn: TurnState, item: AgentItemState): TurnState {
  const reconciledItem = reconcileClientUserMessage(turn, sanitizeItem(item));
  return {
    ...turn,
    blocksByItemId: {
      ...turn.blocksByItemId,
      [reconciledItem.id]: createItemBlock(reconciledItem),
    },
    itemOrder: ensureItemOrder(turn.itemOrder, reconciledItem.id),
    items: {
      ...turn.items,
      [reconciledItem.id]: reconciledItem,
    },
  };
}

export function updateItemStatus(
  turn: TurnState,
  itemId: ItemId,
  status: AgentItemState["status"],
  options: { metadata?: AgentItemState["metadata"] } = {},
): TurnState {
  const item = turn.items[itemId];
  if (!item) return turn;
  const metadata = options.metadata ? { ...item.metadata, ...options.metadata } : item.metadata;
  const nextItem = { ...item, metadata, status };
  return {
    ...turn,
    blocksByItemId: {
      ...turn.blocksByItemId,
      [itemId]: createItemBlock(nextItem),
    },
    items: {
      ...turn.items,
      [itemId]: nextItem,
    },
  };
}

function reconcileClientUserMessage(
  turn: TurnState,
  item: AgentItemState,
): AgentItemState {
  if (item.kind !== "userMessage") return item;
  const clientId = clientUserMessageId(item);
  if (!clientId) return item;
  const existing = Object.values(turn.items).find(
    (candidate) =>
      candidate.kind === "userMessage" &&
      candidate.turnId === item.turnId &&
      candidate.id !== item.id &&
      clientUserMessageId(candidate) === clientId,
  );
  if (!existing) return item;
  return reconcileUserMessageItem(existing, item, clientId);
}

function sanitizeItem(item: AgentItemState): AgentItemState {
  const { raw, ...publicItem } = item as AgentItemState & { raw?: unknown };
  return {
    ...publicItem,
    metadata: mergeMetadata(publicItem.metadata, metadataFromRaw(raw)),
  };
}

function mergeMetadata(
  metadata: AgentItemState["metadata"],
  patch: AgentItemState["metadata"],
): AgentItemState["metadata"] {
  if (!metadata) return patch;
  if (!patch) return metadata;
  return { ...patch, ...metadata };
}

function metadataFromRaw(raw: unknown): AgentItemState["metadata"] {
  if (!isRecord(raw)) return undefined;
  const metadata: NonNullable<AgentItemState["metadata"]> = {};
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
  copyString(metadata, "message", raw.message);
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
  copyBoolean(metadata, "optimistic", raw.optimistic);
  copyString(metadata, "operationId", raw.operationId ?? raw.operation_id);
  copyBoolean(metadata, "retrying", raw.retrying);
  return Object.values(metadata).some((value) => value !== undefined) ? metadata : undefined;
}

function copyString<T extends keyof NonNullable<AgentItemState["metadata"]>>(
  metadata: NonNullable<AgentItemState["metadata"]>,
  key: T,
  value: unknown,
) {
  const text = stringValue(value);
  if (text) {
    (metadata[key] as string | undefined) = text;
  }
}

function copyNumber<T extends keyof NonNullable<AgentItemState["metadata"]>>(
  metadata: NonNullable<AgentItemState["metadata"]>,
  key: T,
  value: unknown,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    (metadata[key] as number | undefined) = value;
  }
}

function copyBoolean<T extends keyof NonNullable<AgentItemState["metadata"]>>(
  metadata: NonNullable<AgentItemState["metadata"]>,
  key: T,
  value: unknown,
) {
  if (typeof value === "boolean") {
    (metadata[key] as boolean | undefined) = value;
  }
}

export function reconcileUserMessageItem(
  existing: AgentItemState,
  incoming: AgentItemState,
  clientId: string,
): AgentItemState {
  return {
    ...existing,
    ...incoming,
    id: existing.id,
    metadata: reconcileUserMessageMetadata(
      existing.metadata,
      incoming.metadata,
      incoming.id,
      clientId,
    ),
    text: incoming.text ?? existing.text,
  };
}

export function clientUserMessageId(item: Pick<AgentItemState, "metadata">): string | undefined {
  const value = item.metadata?.clientUserMessageId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function reconcileUserMessageMetadata(
  existingMetadata: AgentItemState["metadata"],
  incomingMetadata: AgentItemState["metadata"],
  serverItemId: string,
  clientId: string,
): AgentItemState["metadata"] {
  return {
    ...existingMetadata,
    ...incomingMetadata,
    clientUserMessageId: clientId,
    optimistic: false,
    serverItemId,
  };
}

export function appendStreamingText(
  turn: TurnState,
  itemId: ItemId,
  delta: string,
): TurnState {
  return {
    ...turn,
    itemOrder: ensureItemOrder(turn.itemOrder, itemId),
    streamingTextByItemId: appendById(turn.streamingTextByItemId, itemId, delta),
  };
}

export function appendCommandOutput(
  turn: TurnState,
  itemId: ItemId,
  delta: string,
  maxChars: number,
): TurnState {
  return {
    ...turn,
    itemOrder: ensureItemOrder(turn.itemOrder, itemId),
    commandOutputByItemId: appendById(
      turn.commandOutputByItemId,
      itemId,
      delta,
      maxChars,
    ),
  };
}

export function updateFilePatch(
  turn: TurnState,
  itemId: ItemId,
  patch: unknown,
  maxEntries: number,
): TurnState {
  const filePatchByItemId = boundedFilePatchEntries(
    turn.filePatchByItemId,
    itemId,
    patch,
    maxEntries,
  );
  const evictedPatchIds = Object.keys(turn.filePatchByItemId).filter(
    (candidate) => filePatchByItemId[candidate] === undefined,
  );
  const itemOrder = pruneEvictedPatchOnlyIds(
    ensureItemOrder(turn.itemOrder, itemId),
    turn,
    evictedPatchIds,
  );
  return {
    ...turn,
    filePatchByItemId,
    itemOrder,
  };
}

function boundedFilePatchEntries<T>(
  record: Record<ItemId, T>,
  key: ItemId,
  value: T,
  maxEntries: number,
): Record<ItemId, T> {
  const next = { ...record, [key]: value };
  for (const staleKey of Object.keys(next).slice(
    0,
    Math.max(0, Object.keys(next).length - maxEntries),
  )) {
    delete next[staleKey];
  }
  return next;
}

function pruneEvictedPatchOnlyIds(
  itemOrder: ItemId[],
  turn: TurnState,
  evictedPatchIds: ItemId[],
): ItemId[] {
  if (evictedPatchIds.length === 0) return itemOrder;
  const evicted = new Set(evictedPatchIds.filter((itemId) => isPatchOnlyId(turn, itemId)));
  if (evicted.size === 0) return itemOrder;
  return itemOrder.filter((itemId) => !evicted.has(itemId));
}

function isPatchOnlyId(turn: TurnState, itemId: ItemId): boolean {
  return (
    turn.items[itemId] === undefined &&
    turn.blocksByItemId[itemId] === undefined &&
    turn.commandOutputByItemId[itemId] === undefined &&
    turn.streamingTextByItemId[itemId] === undefined
  );
}

function appendById(
  values: Record<ItemId, string>,
  id: ItemId,
  delta: string,
  maxChars?: number,
): Record<ItemId, string> {
  return {
    ...values,
    [id]:
      maxChars === undefined
        ? `${values[id] ?? ""}${delta}`
        : boundedStringAppend(values[id], delta, maxChars),
  };
}

function ensureItemOrder(itemOrder: ItemId[], itemId: ItemId): ItemId[] {
  return itemOrder.includes(itemId) ? itemOrder : [...itemOrder, itemId];
}

export function createItemBlock(item: AgentItemState): AgentItemBlock {
  const metadata = item.metadata ?? {};
  const kind = blockKindForItemKind(item.kind);
  const base: AgentItemBlock = {
    error: item.metadata?.error,
    id: item.id,
    kind,
    status: item.status,
    text: item.text,
  };
  if (kind === "thinking") {
    return {
      ...base,
      content: textParts(metadata.content) ?? item.text,
      summary: textParts(metadata.summary) ?? item.text,
    };
  }
  if (kind === "commandExecution") {
    return {
      ...base,
      command: stringValue(metadata.command) ?? arrayText(metadata.command) ?? item.text,
      cwd: stringValue(metadata.cwd),
      durationMs: numberValue(metadata.durationMs),
      exitCode: numberValue(metadata.exitCode),
    };
  }
  if (kind === "fileChange") {
    return {
      ...base,
      changes: Array.isArray(metadata.changes) ? metadata.changes : undefined,
    };
  }
  if (kind === "toolCall" || kind === "mcpToolCall") {
    return {
      ...base,
      arguments: metadata.arguments,
      durationMs: numberValue(metadata.durationMs),
      error: metadata.error,
      result: metadata.result,
      server: stringValue(metadata.server),
      tool: stringValue(metadata.tool ?? metadata.name) ?? item.text,
      toolType:
        kind === "mcpToolCall"
          ? "mcp"
          : item.kind === "dynamicToolCall"
            ? "dynamic"
            : "generic",
    };
  }
  if (kind === "collabToolCall") {
    return {
      ...base,
      metadata: item.metadata as Record<string, unknown> | undefined,
      tool: stringValue(metadata.tool) ?? item.text,
      toolType: "collab",
    };
  }
  if (kind === "webSearch") {
    return { ...base, query: stringValue(metadata.query) ?? item.text };
  }
  if (kind === "image") {
    const resource = imageResource(metadata);
    return { ...base, path: resource?.path, resource };
  }
  if (kind === "systemInfo") {
    return {
      ...base,
      metadata: item.metadata as Record<string, unknown> | undefined,
      subtype: systemSubtype(item.kind),
      text: item.text ?? systemText(item.kind, metadata),
    };
  }
  return base;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function imageResource(raw: AgentItemMetadata): AgentItemBlock["resource"] {
  const path = stringValue(raw.path);
  const url =
    browserMediaUrl(raw.url) ??
    browserMediaUrl(raw.imageUrl) ??
    browserMediaUrl(raw.result);
  const previewUrl = browserMediaUrl(raw.previewUrl);
  const mimeType = stringValue(raw.mimeType);
  const displayName = stringValue(
    raw.displayName ?? raw.name ?? raw.fileName,
  );
  const redactedPath = stringValue(raw.redactedPath);
  if (!path && !url && !previewUrl && !displayName && !mimeType && !redactedPath) {
    return undefined;
  }
  return {
    displayName,
    kind: path ? "local-media" : mimeType?.startsWith("video/") ? "video" : "image",
    mimeType,
    path,
    previewUrl,
    redactedPath,
    url,
  };
}

function browserMediaUrl(value: unknown): string | undefined {
  const url = stringValue(value);
  if (!url) return undefined;
  return /^(https:|data:|blob:)/.test(url) ? url : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function arrayText(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  const text = value.map((part) => String(part)).join(" ").trim();
  return text || undefined;
}

function textParts(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  const text = value
    .map((part) => {
      if (typeof part === "string") return part;
      if (isRecord(part) && typeof part.text === "string") return part.text;
      return undefined;
    })
    .filter(Boolean)
    .join("");
  return text || undefined;
}

function systemSubtype(kind: string): AgentItemBlock["subtype"] {
  if (kind === "enteredReviewMode" || kind === "exitedReviewMode") return "review_mode";
  if (kind === "contextCompaction") return "compaction";
  if (kind === "error") return "error";
  if (kind === "systemInfo" || kind === "system") return "status";
  return "unknown_item";
}

function systemText(kind: string, raw: AgentItemMetadata): string {
  if (typeof raw.review === "string") return raw.review;
  if (typeof raw.message === "string") return raw.message;
  if (kind === "contextCompaction") return "Context compacted";
  return kind;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function blockKindForItemKind(kind: string): AgentItemBlockKind {
  if (kind === "agentMessage" || kind === "assistantMessage" || kind === "userMessage") {
    return "text";
  }
  if (kind === "reasoning") return "thinking";
  if (kind === "plan") return "plan";
  if (kind === "commandExecution" || kind === "command") return "commandExecution";
  if (kind === "fileChange" || kind === "patch") return "fileChange";
  if (kind === "toolCall" || kind === "dynamicTool" || kind === "dynamicToolCall") {
    return "toolCall";
  }
  if (kind === "mcpToolCall") return "mcpToolCall";
  if (kind === "collabToolCall") return "collabToolCall";
  if (kind === "webSearch") return "webSearch";
  if (kind === "image" || kind === "imageView" || kind === "imageGeneration") {
    return "image";
  }
  if (
    kind === "systemInfo" ||
    kind === "system" ||
    kind === "enteredReviewMode" ||
    kind === "exitedReviewMode" ||
    kind === "contextCompaction"
  ) {
    return "systemInfo";
  }
  return "unknown";
}
