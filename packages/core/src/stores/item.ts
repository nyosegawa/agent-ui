import type {
  AgentItemBlock,
  AgentItemBlockKind,
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
  upsert(turn: TurnState, item: AgentItemState): TurnState;
}

export const itemStore: ItemStore = {
  appendCommandOutput,
  appendStreamingText,
  createItemBlock,
  updateFilePatch,
  upsert: upsertItem,
};

export function upsertItem(turn: TurnState, item: AgentItemState): TurnState {
  return {
    ...turn,
    blocksByItemId: {
      ...turn.blocksByItemId,
      [item.id]: createItemBlock(item),
    },
    itemOrder: ensureItemOrder(turn.itemOrder, item.id),
    items: {
      ...turn.items,
      [item.id]: item,
    },
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
  const raw = isRecord(item.raw) ? item.raw : {};
  const kind = blockKindForItemKind(item.kind);
  const base: AgentItemBlock = {
    id: item.id,
    kind,
    raw: item.raw,
    status: item.status,
    text: item.text,
  };
  if (kind === "thinking") {
    return {
      ...base,
      content: textParts(raw.content) ?? item.text,
      summary: textParts(raw.summary) ?? item.text,
    };
  }
  if (kind === "commandExecution") {
    return {
      ...base,
      command: stringValue(raw.command) ?? arrayText(raw.command) ?? item.text,
      cwd: stringValue(raw.cwd),
      durationMs: numberValue(raw.durationMs ?? raw.duration_ms),
      exitCode: numberValue(raw.exitCode ?? raw.exit_code),
    };
  }
  if (kind === "fileChange") {
    return {
      ...base,
      changes: Array.isArray(raw.changes) ? raw.changes : undefined,
    };
  }
  if (kind === "toolCall" || kind === "mcpToolCall") {
    return {
      ...base,
      arguments: raw.arguments ?? raw.args,
      durationMs: numberValue(raw.durationMs ?? raw.duration_ms),
      error: raw.error,
      result: raw.result ?? raw.contentItems ?? raw.content_items,
      server: stringValue(raw.server),
      tool: stringValue(raw.tool ?? raw.name) ?? item.text,
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
      metadata: raw,
      tool: stringValue(raw.tool) ?? item.text,
      toolType: "collab",
    };
  }
  if (kind === "webSearch") {
    return { ...base, query: stringValue(raw.query) ?? item.text };
  }
  if (kind === "image") {
    return { ...base, path: stringValue(raw.path ?? raw.savedPath ?? raw.saved_path) };
  }
  if (kind === "systemInfo") {
    return {
      ...base,
      metadata: raw,
      subtype: systemSubtype(item.kind),
      text: item.text ?? systemText(item.kind, raw),
    };
  }
  return base;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
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

function systemText(kind: string, raw: Record<string, unknown>): string {
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
