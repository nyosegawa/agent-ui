import type {
  AgentItemBlock,
  AgentItemBlockKind,
  AgentItemState,
  AgentSessionState,
  AgentThread,
  AgentTurn,
  ThreadId,
  ThreadRegistryStatus,
  ThreadState,
  TurnState,
} from "../state";
import {
  AGENT_RETENTION_POLICY,
  boundedRecordEntry,
  boundedStringAppend,
  boundedUniqueAppend,
} from "../retention";

export function updateThread(
  state: AgentSessionState,
  threadId: ThreadId,
  updater: (thread: ThreadState) => ThreadState,
): AgentSessionState {
  const thread = state.threads[threadId];
  if (!thread) return state;
  return {
    ...state,
    threads: {
      ...state.threads,
      [threadId]: updater(thread),
    },
  };
}

export function pruneThreadSnapshots(state: AgentSessionState): AgentSessionState {
  const retainedThreadIds = new Set<ThreadId>([
    ...state.threadRegistry.coldThreadIds,
    ...state.threadRegistry.previewThreadIds,
    ...state.threadRegistry.liveThreadIds,
    ...state.threadRegistry.loadedThreadIds,
  ]);
  if (state.activeThreadId) retainedThreadIds.add(state.activeThreadId);
  if (state.threadRegistry.activeThreadId) {
    retainedThreadIds.add(state.threadRegistry.activeThreadId);
  }
  for (const request of Object.values(state.pendingServerRequests)) {
    if (request.threadId) retainedThreadIds.add(request.threadId);
  }

  let changed = false;
  const threads: AgentSessionState["threads"] = {};
  for (const [threadId, thread] of Object.entries(state.threads)) {
    if (retainedThreadIds.has(threadId)) {
      threads[threadId] = thread;
      continue;
    }
    if (thread.registryStatus === "live") {
      threads[threadId] = thread;
      retainedThreadIds.add(threadId);
      continue;
    }
    changed = true;
  }
  return changed ? { ...state, threads } : state;
}

export function hasPendingThreadRequest(
  requests: AgentSessionState["pendingServerRequests"],
  threadId: ThreadId,
): boolean {
  return Object.values(requests).some((request) => request.threadId === threadId);
}

export function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export function createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState {
  return {
    blocksByItemId: {},
    commandOutputByItemId: {},
    filePatchByItemId: {},
    itemOrder: [],
    items: {},
    streamingTextByItemId: {},
    turn: { ...turn, threadId },
  };
}

export function upsertTurn(
  thread: ThreadState,
  turn: AgentTurn,
  threadStatus: ThreadState["status"],
): ThreadState {
  const orderedTurnIds = thread.orderedTurnIds.includes(turn.id)
    ? thread.orderedTurnIds
    : [...thread.orderedTurnIds, turn.id];
  return {
    ...thread,
    orderedTurnIds,
    status: threadStatus,
    turns: {
      ...thread.turns,
      [turn.id]: {
        ...(thread.turns[turn.id] ?? createTurnState(turn, thread.thread.id)),
        turn,
      },
    },
  };
}

export function updateTurn(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: string,
  updater: (turn: TurnState) => TurnState,
): AgentSessionState {
  return updateThread(state, threadId, (thread) => {
    const turn =
      thread.turns[turnId] ??
      createTurnState({ id: turnId, threadId, status: "running" }, threadId);
    return {
      ...thread,
      orderedTurnIds: thread.orderedTurnIds.includes(turnId)
        ? thread.orderedTurnIds
        : [...thread.orderedTurnIds, turnId],
      turns: {
        ...thread.turns,
        [turnId]: updater(turn),
      },
    };
  });
}

export function upsertItem(turn: TurnState, item: AgentItemState): TurnState {
  return {
    ...turn,
    blocksByItemId: {
      ...turn.blocksByItemId,
      [item.id]: itemBlockForItem(item),
    },
    itemOrder: turn.itemOrder.includes(item.id)
      ? turn.itemOrder
      : [...turn.itemOrder, item.id],
    items: {
      ...turn.items,
      [item.id]: item,
    },
  };
}

export function appendById(
  values: Record<string, string>,
  id: string,
  delta: string,
  maxChars?: number,
): Record<string, string> {
  return {
    ...values,
    [id]:
      maxChars === undefined
        ? `${values[id] ?? ""}${delta}`
        : boundedStringAppend(values[id], delta, maxChars),
  };
}

export function ensureItemOrder(itemOrder: string[], itemId: string): string[] {
  return itemOrder.includes(itemId) ? itemOrder : [...itemOrder, itemId];
}

export function upsertThread(state: AgentSessionState, thread: AgentThread): ThreadState {
  return (
    state.threads[thread.id] ?? {
      orderedTurnIds: [],
      registryStatus: "loaded",
      status: "loaded",
      thread,
      turns: {},
    }
  );
}

export function classifyThreadRegistryStatus(
  status?: string,
  turns?: readonly AgentTurn[],
): ThreadRegistryStatus {
  if (status === "notLoaded") return turns?.length ? "preview" : "cold";
  if (status === "running" || status === "waitingForInput") return "live";
  return "loaded";
}

export function isPreviewThreadStatus(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}

export function preservesAgainstPreviewSnapshot(status?: string): boolean {
  return Boolean(status) && !isPreviewThreadStatus(status);
}

export function isCompletedTurnStatus(status?: string): boolean {
  return status === "complete" || status === "completed";
}

export function updateThreadRegistry(
  registry: AgentSessionState["threadRegistry"],
  threadId: ThreadId,
  status: ThreadRegistryStatus,
  activeThreadId = registry.activeThreadId,
): AgentSessionState["threadRegistry"] {
  const remove = (ids: ThreadId[]) => ids.filter((id) => id !== threadId);
  const add = (ids: ThreadId[]) =>
    boundedUniqueAppend(ids, threadId, AGENT_RETENTION_POLICY.threadRegistrySnapshotsMax);
  const next = {
    activeThreadId,
    coldThreadIds: remove(registry.coldThreadIds),
    liveThreadIds: remove(registry.liveThreadIds),
    loadedThreadIds: remove(registry.loadedThreadIds),
    previewThreadIds: remove(registry.previewThreadIds),
  };
  if (status === "cold") next.coldThreadIds = add(next.coldThreadIds);
  if (status === "preview") next.previewThreadIds = add(next.previewThreadIds);
  if (status === "live") next.liveThreadIds = add(next.liveThreadIds);
  if (status === "loaded") next.loadedThreadIds = add(next.loadedThreadIds);
  return next;
}

export function enqueueServerRequest(
  queue: AgentSessionState["serverRequestQueue"],
  request: AgentSessionState["serverRequestQueue"]["byId"][string],
): AgentSessionState["serverRequestQueue"] {
  const id = String(request.id);
  return {
    byId: { ...queue.byId, [id]: request },
    order: queue.order.includes(id) ? queue.order : [...queue.order, id],
  };
}

export function dequeueServerRequest(
  queue: AgentSessionState["serverRequestQueue"],
  requestId: string,
): AgentSessionState["serverRequestQueue"] {
  const byId = { ...queue.byId };
  delete byId[requestId];
  return {
    byId,
    order: queue.order.filter((id) => id !== requestId),
  };
}

export function upsertById<T extends { id: string }>(values: T[], value: T): T[] {
  const index = values.findIndex((current) => current.id === value.id);
  if (index === -1) return [...values, value];
  const next = [...values];
  next[index] = value;
  return next;
}

export function withBoundedRecordEntry<T>(
  values: Record<string, T>,
  id: string,
  value: T,
  maxEntries: number,
): Record<string, T> {
  return boundedRecordEntry(values, id, value, maxEntries);
}

function itemBlockForItem(item: AgentItemState): AgentItemBlock {
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
      toolType: kind === "mcpToolCall" ? "mcp" : item.kind === "dynamicToolCall" ? "dynamic" : "generic",
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
  if (kind === "agentMessage" || kind === "assistantMessage" || kind === "userMessage")
    return "text";
  if (kind === "reasoning") return "thinking";
  if (kind === "plan") return "plan";
  if (kind === "commandExecution" || kind === "command") return "commandExecution";
  if (kind === "fileChange" || kind === "patch") return "fileChange";
  if (kind === "toolCall" || kind === "dynamicTool" || kind === "dynamicToolCall")
    return "toolCall";
  if (kind === "mcpToolCall") return "mcpToolCall";
  if (kind === "collabToolCall") return "collabToolCall";
  if (kind === "webSearch") return "webSearch";
  if (kind === "image" || kind === "imageView" || kind === "imageGeneration")
    return "image";
  if (
    kind === "systemInfo" ||
    kind === "system" ||
    kind === "enteredReviewMode" ||
    kind === "exitedReviewMode" ||
    kind === "contextCompaction"
  )
    return "systemInfo";
  return "unknown";
}
