import type { AgentEvent } from "./events";
import type {
  AgentItemState,
  AgentItemBlock,
  AgentSessionState,
  AgentThread,
  AgentTurn,
  AgentItemBlockKind,
  ThreadId,
  ThreadRegistryStatus,
  ThreadState,
  TurnState,
} from "./state";
import { createInitialAgentState } from "./state";

export function agentReducer(
  state: AgentSessionState = createInitialAgentState(),
  event: AgentEvent,
): AgentSessionState {
  switch (event.type) {
    case "connection/connecting":
      return { ...state, connection: { status: "connecting" } };
    case "connection/connected":
      return { ...state, connection: { status: "connected" } };
    case "connection/closed":
      return {
        ...state,
        connection: { status: "closed", reason: event.reason },
        pendingServerRequests: {},
        serverRequestQueue: { byId: {}, order: [] },
      };
    case "connection/error":
      return {
        ...state,
        connection: { status: "error", error: event.error },
        errors: [...state.errors, event.error],
      };
    case "account/updated":
      return {
        ...state,
        account: {
          ...state.account,
          account: recordOrUndefined(event.account),
          status:
            event.status ?? (event.account == null ? "unauthenticated" : "authenticated"),
        },
      };
    case "account/login/deviceCodeStarted":
      return {
        ...state,
        account: {
          ...state.account,
          login: {
            expiresAt: event.expiresAt,
            loginId: event.loginId,
            requestId: event.requestId,
            userCode: event.userCode,
            verificationUrl: event.verificationUrl,
          },
          status: "authenticating",
        },
      };
    case "account/login/completed":
      return {
        ...state,
        account: {
          account: recordOrUndefined(event.account) ?? state.account.account,
          status: event.success === false ? "unauthenticated" : "authenticated",
        },
      };
    case "account/rateLimits/updated":
      return {
        ...state,
        account: {
          ...state.account,
          rateLimits: event.rateLimits,
        },
        usage: {
          ...state.usage,
          accountRateLimits: event.rateLimits,
        },
      };
    case "usage/hostMetrics/updated":
      return {
        ...state,
        usage: { ...state.usage, hostMetrics: event.metrics },
      };
    case "skills/updated":
      return {
        ...state,
        skills: {
          ...state.skills,
          byCwd: { ...state.skills.byCwd, [event.cwd]: event.skills },
        },
      };
    case "apps/updated":
      return {
        ...state,
        apps: updateAppsState(state.apps, event),
      };
    case "hooks/updated":
      return {
        ...state,
        hooks: {
          ...state.hooks,
          byCwd: { ...state.hooks.byCwd, [event.cwd]: event.hooks },
        },
      };
    case "models/updated":
      return {
        ...state,
        models: {
          models: event.models,
          selectedModelId: event.selectedModelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.selectedModelId ? { modelId: event.selectedModelId } : {}),
        },
      };
    case "runSettings/updated":
      return {
        ...state,
        models: {
          ...state.models,
          selectedModelId: event.modelId ?? state.models.selectedModelId,
        },
        runSettings: {
          ...state.runSettings,
          ...(event.executionMode ? { executionMode: event.executionMode } : {}),
          ...(event.modelId !== undefined ? { modelId: event.modelId || undefined } : {}),
          ...(event.effort !== undefined ? { effort: event.effort || undefined } : {}),
          ...(event.cwd !== undefined ? { cwd: event.cwd || undefined } : {}),
        },
      };
    case "thread/upserted":
    case "thread/started": {
      const threadState = upsertThread(state, event.thread);
      const stalePreviewStatus =
        state.threads[event.thread.id] &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(threadState.status);
      const status = stalePreviewStatus
        ? threadState.status
        : (event.status ?? threadState.status);
      const turns = { ...threadState.turns };
      const orderedTurnIds = [...threadState.orderedTurnIds];
      for (const turn of event.turns ?? []) {
        if (!orderedTurnIds.includes(turn.id)) orderedTurnIds.push(turn.id);
        turns[turn.id] = turns[turn.id] ?? createTurnState(turn, event.thread.id);
      }
      return {
        ...state,
        activeThreadId:
          event.type === "thread/started" ? event.thread.id : state.activeThreadId,
        threadRegistry: updateThreadRegistry(
          state.threadRegistry,
          event.thread.id,
          classifyThreadRegistryStatus(status, event.turns),
          event.type === "thread/started" ? event.thread.id : state.threadRegistry.activeThreadId,
        ),
        threads: {
          ...state.threads,
          [event.thread.id]: {
            ...threadState,
            orderedTurnIds,
            registryStatus: classifyThreadRegistryStatus(status, event.turns),
            status,
            turns,
          },
        },
      };
    }
    case "thread/status/changed": {
      const currentStatus = state.threads[event.threadId]?.status;
      const status =
        currentStatus &&
        isPreviewThreadStatus(event.status) &&
        preservesAgainstPreviewSnapshot(currentStatus)
          ? currentStatus
          : event.status;
      return updateThread(
        {
          ...state,
          threadRegistry: updateThreadRegistry(
            state.threadRegistry,
            event.threadId,
            classifyThreadRegistryStatus(status),
          ),
        },
        event.threadId,
        (thread) => ({
          ...thread,
          registryStatus: classifyThreadRegistryStatus(status),
          status,
        }),
      );
    }
    case "thread/name/updated":
      return updateThread(state, event.threadId, (thread) => ({
        ...thread,
        thread: { ...thread.thread, name: event.name },
      }));
    case "thread/tokenUsage/updated":
      return updateThread(state, event.threadId, (thread) => ({
        ...thread,
        tokenUsage: event.tokenUsage,
      }));
    case "thread/active/set":
      return {
        ...state,
        activeThreadId: event.threadId,
        threadRegistry: { ...state.threadRegistry, activeThreadId: event.threadId },
      };
    case "turn/started":
      return updateThread(state, event.threadId, (thread) =>
        upsertTurn(thread, event.turn, "running"),
      );
    case "turn/completed":
      return updateThread(state, event.threadId, (thread) => {
        const completedStatus =
          (thread.status === "ready" || isPreviewThreadStatus(thread.status)) &&
          isCompletedTurnStatus(event.turn.status)
            ? thread.status
            : (event.turn.status ?? "complete");
        const next = upsertTurn(thread, event.turn, completedStatus);
        const turn =
          next.turns[event.turn.id] ?? createTurnState(event.turn, event.threadId);
        const items = { ...turn.items };
        const itemOrder = [...turn.itemOrder];
        for (const item of event.items ?? []) {
          items[item.id] = item;
          if (!itemOrder.includes(item.id)) itemOrder.push(item.id);
        }
        return {
          ...next,
          turns: {
            ...next.turns,
            [event.turn.id]: {
              ...turn,
              itemOrder,
              items,
              turn: event.turn,
            },
          },
        };
      });
    case "turn/plan/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        plan: {
          explanation: event.explanation,
          plan: event.plan,
          raw: event.raw,
        },
      }));
    case "turn/diff/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        diff: {
          diff: event.diff,
          raw: event.raw,
        },
      }));
    case "item/started":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    case "item/agentMessage/delta":
    case "item/reasoning/summaryTextDelta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        streamingTextByItemId: appendById(
          turn.streamingTextByItemId,
          event.itemId,
          event.delta,
        ),
      }));
    case "item/commandOutput/delta":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        commandOutputByItemId: appendById(
          turn.commandOutputByItemId,
          event.itemId,
          event.delta,
        ),
      }));
    case "item/filePatch/updated":
      return updateTurn(state, event.threadId, event.turnId, (turn) => ({
        ...turn,
        itemOrder: ensureItemOrder(turn.itemOrder, event.itemId),
        filePatchByItemId: { ...turn.filePatchByItemId, [event.itemId]: event.patch },
      }));
    case "item/completed":
      return updateTurn(state, event.threadId, event.turnId, (turn) =>
        upsertItem(turn, event.item),
      );
    case "serverRequest/created":
      return updateThread(
        {
          ...state,
          pendingServerRequests: {
            ...state.pendingServerRequests,
            [String(event.request.id)]: event.request,
          },
          serverRequestQueue: enqueueServerRequest(
            state.serverRequestQueue,
            event.request,
          ),
        },
        event.request.threadId ?? "",
        (thread) => ({ ...thread, status: "waitingForInput" }),
      );
    case "serverRequest/resolved": {
      const requestId = String(event.requestId);
      const request = state.pendingServerRequests[requestId];
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[requestId];
      const nextState = {
        ...state,
        pendingServerRequests,
        serverRequestQueue: dequeueServerRequest(state.serverRequestQueue, requestId),
      };
      if (
        !request?.threadId ||
        hasPendingThreadRequest(pendingServerRequests, request.threadId)
      ) {
        return nextState;
      }
      return updateThread(nextState, request.threadId, (thread) =>
        thread.status === "waitingForInput" ? { ...thread, status: "running" } : thread,
      );
    }
    case "serverRequest/rejected": {
      const requestId = String(event.requestId);
      const request = state.pendingServerRequests[requestId];
      const pendingServerRequests = { ...state.pendingServerRequests };
      delete pendingServerRequests[requestId];
      const nextState = {
        ...state,
        errors: event.error ? [...state.errors, event.error] : state.errors,
        diagnostics: event.error
          ? { ...state.diagnostics, errors: [...state.diagnostics.errors, event.error] }
          : state.diagnostics,
        pendingServerRequests,
        serverRequestQueue: dequeueServerRequest(state.serverRequestQueue, requestId),
      };
      if (
        !request?.threadId ||
        hasPendingThreadRequest(pendingServerRequests, request.threadId)
      ) {
        return nextState;
      }
      return updateThread(nextState, request.threadId, (thread) =>
        thread.status === "waitingForInput" ? { ...thread, status: "running" } : thread,
      );
    }
    case "status/banner/added":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          banners: upsertById(state.diagnostics.banners, event.banner),
        },
      };
    case "status/banner/removed":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          banners: state.diagnostics.banners.filter((banner) => banner.id !== event.id),
        },
      };
    case "notification/received":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          protocolNotifications: [
            ...state.diagnostics.protocolNotifications,
            event.notification,
          ],
        },
      };
    case "warning/added":
      return {
        ...state,
        configWarnings: [...state.configWarnings, event.warning],
        diagnostics: {
          ...state.diagnostics,
          warnings: [...state.diagnostics.warnings, event.warning],
        },
      };
    case "error/added":
      return {
        ...state,
        diagnostics: {
          ...state.diagnostics,
          errors: [...state.diagnostics.errors, event.error],
        },
        errors: [...state.errors, event.error],
      };
    default:
      return assertNever(event);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled event: ${JSON.stringify(value)}`);
}

function updateAppsState(
  current: AgentSessionState["apps"],
  event: Extract<AgentEvent, { type: "apps/updated" }>,
): AgentSessionState["apps"] {
  const scope = event.threadId ?? "";
  const nextScopeState = {
    apps: event.apps,
    nextCursor: event.nextCursor,
    threadId: event.threadId,
  };
  const next = {
    ...current,
    byScope: {
      ...current.byScope,
      [scope]: nextScopeState,
    },
  };
  if (!event.threadId) {
    next.apps = event.apps;
    next.nextCursor = event.nextCursor;
  }
  return next;
}

function upsertThread(state: AgentSessionState, thread: AgentThread): ThreadState {
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

function updateThread(
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

function hasPendingThreadRequest(
  requests: AgentSessionState["pendingServerRequests"],
  threadId: ThreadId,
): boolean {
  return Object.values(requests).some((request) => request.threadId === threadId);
}

function recordOrUndefined(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState {
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

function upsertTurn(
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

function updateTurn(
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

function upsertItem(turn: TurnState, item: AgentItemState): TurnState {
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

function appendById(
  values: Record<string, string>,
  id: string,
  delta: string,
): Record<string, string> {
  return { ...values, [id]: `${values[id] ?? ""}${delta}` };
}

function ensureItemOrder(itemOrder: string[], itemId: string): string[] {
  return itemOrder.includes(itemId) ? itemOrder : [...itemOrder, itemId];
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

function classifyThreadRegistryStatus(
  status?: string,
  turns?: readonly AgentTurn[],
): ThreadRegistryStatus {
  if (status === "notLoaded") return turns?.length ? "preview" : "cold";
  if (status === "running" || status === "waitingForInput") return "live";
  return "loaded";
}

function isPreviewThreadStatus(status?: string): boolean {
  return status === "notLoaded" || status === "loaded";
}

function preservesAgainstPreviewSnapshot(status?: string): boolean {
  return Boolean(status) && !isPreviewThreadStatus(status);
}

function isCompletedTurnStatus(status?: string): boolean {
  return status === "complete" || status === "completed";
}

function updateThreadRegistry(
  registry: AgentSessionState["threadRegistry"],
  threadId: ThreadId,
  status: ThreadRegistryStatus,
  activeThreadId = registry.activeThreadId,
): AgentSessionState["threadRegistry"] {
  const remove = (ids: ThreadId[]) => ids.filter((id) => id !== threadId);
  const add = (ids: ThreadId[]) => (ids.includes(threadId) ? ids : [...ids, threadId]);
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

function enqueueServerRequest(
  queue: AgentSessionState["serverRequestQueue"],
  request: AgentSessionState["serverRequestQueue"]["byId"][string],
): AgentSessionState["serverRequestQueue"] {
  const id = String(request.id);
  return {
    byId: { ...queue.byId, [id]: request },
    order: queue.order.includes(id) ? queue.order : [...queue.order, id],
  };
}

function dequeueServerRequest(
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

function upsertById<T extends { id: string }>(values: T[], value: T): T[] {
  const index = values.findIndex((current) => current.id === value.id);
  if (index === -1) return [...values, value];
  const next = [...values];
  next[index] = value;
  return next;
}
