import type { AgentEvent, AgentTurn } from "@nyosegawa/agent-ui-core";
import {
  asRecord,
  itemsViewValue,
  normalizeItem,
  normalizeThread,
  normalizeThreadStatus,
  normalizeTurn,
  numberValue,
  optionalStringValue,
} from "./shared";

export type ThreadTurnsListSortDirection = "asc" | "desc";

export interface NormalizeTurnsPageOptions {
  threadId: string;
  itemsView?: AgentTurn["itemsView"];
  sortDirection?: ThreadTurnsListSortDirection;
}

export interface NormalizedTurnsPage {
  events: AgentEvent[];
  itemsView?: AgentTurn["itemsView"];
  sortDirection: ThreadTurnsListSortDirection;
  turns: AgentTurn[];
}

export interface NormalizedThreadTurnsListResponse extends NormalizedTurnsPage {
  backwardsCursor: string | null;
  nextCursor: string | null;
}

export interface NormalizeThreadResumeResponseOptions extends NormalizeTurnsPageOptions {
  activate?: boolean;
}

export interface NormalizedThreadResumeResponse {
  events: AgentEvent[];
  initialTurnsPage?: NormalizedThreadTurnsListResponse;
}

export function normalizeThreadNotification(
  method: string,
  params: Record<string, unknown>,
): AgentEvent[] | undefined {
  switch (method) {
    case "thread/started": {
      const thread = normalizeThread(params.thread ?? params);
      const threadRecord = asRecord(params.thread);
      return [
        {
          type: "thread/started",
          status: normalizeThreadStatus(params.status ?? threadRecord?.status),
          thread,
          turns: Array.isArray(params.turns)
            ? params.turns.map((turn) => normalizeTurn(turn, thread.id))
            : undefined,
        },
      ];
    }
    case "thread/status/changed":
      return [
        {
          type: "thread/status/changed",
          status: normalizeThreadStatus(params.status),
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/archived":
      return [
        {
          type: "thread/status/changed",
          status: "archived",
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/unarchived":
      return [
        {
          type: "thread/status/changed",
          status: "loaded",
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/closed":
      return [
        {
          type: "thread/status/changed",
          status: "closed",
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/name/updated":
      return [
        {
          type: "thread/name/updated",
          name: String(params.threadName ?? params.thread_name ?? params.name ?? ""),
          threadId: String(params.threadId ?? params.thread_id),
        },
      ];
    case "thread/tokenUsage/updated":
      return [normalizeTokenUsage(params)];
    case "turn/diff/updated":
      return [
        {
          type: "turn/diff/updated",
          diff: params.diff ?? params,
          raw: params,
          threadId: String(params.threadId ?? params.thread_id ?? ""),
          turnId: String(params.turnId ?? params.turn_id ?? ""),
        },
      ];
    default:
      return undefined;
  }
}

export function normalizeThreadReadResponse(
  response: unknown,
  options: { activate?: boolean } = {},
): AgentEvent[] {
  const rawThread = threadReadThread(response);
  if (!rawThreadId(rawThread)) throw new Error("thread/read response is missing a thread id");

  const thread = normalizeThread(rawThread);
  const rawTurns = Array.isArray(rawThread.turns) ? rawThread.turns : undefined;
  const turns = rawTurns?.map((turn) => normalizeTurn(turn, thread.id)) ?? [];
  const status = snapshotStatus(rawThread.status, rawTurns?.length ?? 0);
  const events: AgentEvent[] = [
    {
      status,
      thread,
      snapshot: true,
      ...(rawTurns ? { turns } : {}),
      type: options.activate === false ? "thread/upserted" : "thread/started",
    },
  ];

  events.push(...normalizeTurnSnapshotEvents(rawTurns ?? [], { threadId: thread.id }));

  events.push({
    status,
    snapshot: true,
    threadId: thread.id,
    type: "thread/status/changed",
  });

  return events;
}

export function normalizeThreadTurnsListResponse(
  response: unknown,
  options: NormalizeTurnsPageOptions,
): NormalizedThreadTurnsListResponse {
  const record = asRecord(response) ?? {};
  const sortDirection =
    sortDirectionValue(record.sortDirection ?? record.sort_direction ?? options.sortDirection) ??
    "desc";
  const itemsView = itemsViewValue(record.itemsView ?? record.items_view) ?? options.itemsView;
  const page = normalizeTurnsPage(turnsListData(response), {
    ...options,
    itemsView,
    sortDirection,
  });
  return {
    ...page,
    backwardsCursor: cursorValue(record.backwardsCursor ?? record.backwards_cursor),
    nextCursor: cursorValue(record.nextCursor ?? record.next_cursor),
  };
}

export function normalizeThreadResumeResponse(
  response: unknown,
  options: Partial<NormalizeThreadResumeResponseOptions> = {},
): NormalizedThreadResumeResponse {
  const rawThread = threadReadThread(response);
  const threadId = rawThreadId(rawThread);
  if (!threadId) throw new Error("thread/resume response is missing a thread id");

  const readEvents = normalizeThreadReadResponse(response, {
    activate: options.activate,
  });
  const events = isIdleThreadStatus(rawThread.status)
    ? readEvents.map((event) => markResumedIdleReady(event, threadId))
    : readEvents;
  const initialTurnsPageRecord = initialTurnsPage(response);
  if (!initialTurnsPageRecord) return { events };

  const page = normalizeThreadTurnsListResponse(initialTurnsPageRecord, {
    itemsView: options.itemsView,
    sortDirection: options.sortDirection,
    threadId,
  });
  return {
    events: [...events, ...page.events],
    initialTurnsPage: page,
  };
}

export function normalizeTurnsPage(
  rawTurns: readonly unknown[],
  options: NormalizeTurnsPageOptions,
): NormalizedTurnsPage {
  const sortDirection = options.sortDirection ?? "desc";
  const orderedRawTurns = sortDirection === "desc" ? [...rawTurns].reverse() : [...rawTurns];
  const turns = orderedRawTurns.map((rawTurn) =>
    normalizeTurnWithItemsView(rawTurn, options.threadId, options.itemsView),
  );
  return {
    events: [
      {
        snapshot: true,
        thread: { id: options.threadId },
        turns,
        type: "thread/upserted",
      },
      ...normalizeTurnSnapshotEvents(orderedRawTurns, options),
    ],
    itemsView: options.itemsView,
    sortDirection,
    turns,
  };
}

function normalizeTokenUsage(params: Record<string, unknown>): AgentEvent {
  const tokenUsage = asRecord(params.tokenUsage);
  const totalUsage = asRecord(tokenUsage?.total) ?? tokenUsage;
  const lastUsage = asRecord(tokenUsage?.last);
  return {
    type: "thread/tokenUsage/updated",
    threadId: String(params.threadId ?? params.thread_id),
    tokenUsage: {
      cachedInputTokens:
        numberValue(totalUsage?.cachedInputTokens) ??
        numberValue(totalUsage?.cached_input_tokens) ??
        numberValue(params.cachedInputTokens),
      inputTokens:
        numberValue(totalUsage?.inputTokens) ??
        numberValue(totalUsage?.input_tokens) ??
        numberValue(params.inputTokens),
      last: lastUsage
        ? {
            cachedInputTokens:
              numberValue(lastUsage.cachedInputTokens) ??
              numberValue(lastUsage.cached_input_tokens),
            inputTokens:
              numberValue(lastUsage.inputTokens) ??
              numberValue(lastUsage.input_tokens),
            outputTokens:
              numberValue(lastUsage.outputTokens) ??
              numberValue(lastUsage.output_tokens),
            reasoningOutputTokens:
              numberValue(lastUsage.reasoningOutputTokens) ??
              numberValue(lastUsage.reasoning_output_tokens),
            totalTokens:
              numberValue(lastUsage.totalTokens) ?? numberValue(lastUsage.total_tokens),
          }
        : undefined,
      modelContextWindow:
        numberValue(tokenUsage?.modelContextWindow) ??
        numberValue(tokenUsage?.model_context_window) ??
        numberValue(params.modelContextWindow),
      outputTokens:
        numberValue(totalUsage?.outputTokens) ??
        numberValue(totalUsage?.output_tokens) ??
        numberValue(params.outputTokens),
      reasoningOutputTokens:
        numberValue(totalUsage?.reasoningOutputTokens) ??
        numberValue(totalUsage?.reasoning_output_tokens) ??
        numberValue(params.reasoningOutputTokens),
      totalTokens:
        numberValue(totalUsage?.totalTokens) ??
        numberValue(totalUsage?.total_tokens) ??
        numberValue(params.totalTokens),
      turnId: optionalStringValue(params.turnId ?? params.turn_id),
      raw: params,
    },
  };
}

function normalizeTurnSnapshotEvents(
  rawTurns: readonly unknown[],
  options: Pick<NormalizeTurnsPageOptions, "itemsView" | "threadId">,
): AgentEvent[] {
  const events: AgentEvent[] = [];
  for (const rawTurn of rawTurns) {
    const turn = normalizeTurnWithItemsView(rawTurn, options.threadId, options.itemsView);
    const rawTurnRecord = asRecord(rawTurn);
    const items = Array.isArray(rawTurnRecord?.items) ? rawTurnRecord.items : [];
    const itemStatus = turn.status === "completed" ? "completed" : undefined;
    events.push({
      items: items.map((item) =>
        itemStatus
          ? normalizeItem(item, { threadId: options.threadId, turnId: turn.id }, itemStatus)
          : normalizeItem(item, { threadId: options.threadId, turnId: turn.id }),
      ),
      snapshot: true,
      threadId: options.threadId,
      turn,
      type: "turn/completed",
    });

    for (const item of items) {
      const record = asRecord(item);
      if (!record) continue;
      const itemId = String(record.id ?? record.itemId ?? record.item_id);
      if (
        record.type === "commandExecution" &&
        typeof record.aggregatedOutput === "string"
      ) {
        events.push({
          delta: record.aggregatedOutput,
          itemId,
          threadId: options.threadId,
          turnId: turn.id,
          type: "item/commandOutput/delta",
        });
      }
      if (record.type === "fileChange") {
        events.push({
          itemId,
          patch: record.changes ?? record,
          threadId: options.threadId,
          turnId: turn.id,
          type: "item/filePatch/updated",
        });
      }
    }
  }
  return events;
}

function normalizeTurnWithItemsView(
  rawTurn: unknown,
  threadId: string,
  fallbackItemsView?: AgentTurn["itemsView"],
): AgentTurn {
  const turn = normalizeTurn(rawTurn, threadId);
  return turn.itemsView === undefined && fallbackItemsView !== undefined
    ? { ...turn, itemsView: fallbackItemsView }
    : turn;
}

function isIdleThreadStatus(value: unknown): boolean {
  if (typeof value === "string") return value === "idle";
  return asRecord(value)?.type === "idle";
}

function markResumedIdleReady(event: AgentEvent, threadId: string): AgentEvent {
  if (
    (event.type === "thread/started" || event.type === "thread/upserted") &&
    event.thread.id === threadId &&
    event.status === "loaded"
  ) {
    return { ...event, status: "ready" };
  }
  if (
    event.type === "thread/status/changed" &&
    event.threadId === threadId &&
    event.status === "loaded"
  ) {
    return { ...event, status: "ready" };
  }
  return event;
}

function turnsListData(response: unknown): unknown[] {
  const record = asRecord(response);
  if (Array.isArray(record?.data)) return record.data;
  if (Array.isArray(record?.turns)) return record.turns;
  return [];
}

function initialTurnsPage(response: unknown): Record<string, unknown> | undefined {
  const record = asRecord(response);
  return asRecord(record?.initialTurnsPage ?? record?.initial_turns_page);
}

function sortDirectionValue(value: unknown): ThreadTurnsListSortDirection | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function cursorValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function threadReadThread(response: unknown): Record<string, unknown> {
  const responseRecord = asRecord(response);
  const thread = asRecord(responseRecord?.thread) ?? responseRecord;
  return thread ?? {};
}

function rawThreadId(rawThread: Record<string, unknown>): string | undefined {
  const value = rawThread.id ?? rawThread.threadId ?? rawThread.thread_id;
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function snapshotStatus(value: unknown, turnCount: number): string {
  const status = normalizeThreadStatus(value);
  return status === "notLoaded" && turnCount > 0 ? "loaded" : status;
}
