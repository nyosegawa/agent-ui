import type {
  AgentDiagnosticAudience,
  AgentError,
  AgentApprovalView,
  AgentServerRequestSummary,
  AgentSessionState,
  AgentTranscriptBlockView,
  AgentThreadExecutionState,
  AgentThreadCollection,
  AgentThreadScope,
  AgentThreadSummaryView,
  AgentThreadTranscriptView,
  AgentThreadRuntimeView,
  AgentThreadView,
  DiagnosticsState,
  ItemId,
  PendingServerRequest,
  ProtocolNotificationState,
  StatusBannerState,
  ThreadId,
  TurnId,
  WarningState,
} from "./state";
import { threadLifecycleStore } from "./stores/thread-lifecycle";
import { summarizeServerRequest } from "./stores/thread-runtime";

export function selectActiveThread(state: AgentSessionState) {
  const threadId = threadLifecycleStore.activeThreadId(state.threadLifecycle);
  return threadId ? state.threads[threadId] : undefined;
}

export function selectThread(state: AgentSessionState, threadId: ThreadId) {
  return state.threads[canonicalThreadId(state, threadId)];
}

export function selectOrderedTurns(state: AgentSessionState, threadId: ThreadId) {
  const thread = selectThread(state, threadId);
  return (
    thread?.orderedTurnIds.map((turnId) => thread.turns[turnId]).filter(Boolean) ?? []
  );
}

export function selectTurn(state: AgentSessionState, threadId: ThreadId, turnId: TurnId) {
  return selectThread(state, threadId)?.turns[turnId];
}

export function selectLatestRunningTurnId(state: AgentSessionState, threadId: ThreadId) {
  const thread = selectThread(state, threadId);
  if (!thread) return undefined;
  return [...thread.orderedTurnIds].reverse().find((turnId) => {
    const status = thread.turns[turnId]?.turn.status;
    return (
      status === "running" ||
      status === "inProgress" ||
      (thread.status === "running" && status !== "completed" && status !== "interrupted")
    );
  });
}

export function selectLatestRunningTurn(state: AgentSessionState, threadId: ThreadId) {
  const turnId = selectLatestRunningTurnId(state, threadId);
  return turnId ? selectTurn(state, threadId, turnId) : undefined;
}

export function selectTurnItem(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: TurnId,
  itemId: ItemId,
) {
  return selectTurn(state, threadId, turnId)?.items[itemId];
}

export function selectOrderedItems(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: TurnId,
) {
  const turn = selectTurn(state, threadId, turnId);
  return turn?.itemOrder.map((itemId) => turn.items[itemId]).filter(Boolean) ?? [];
}

export function selectItemBlock(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: TurnId,
  itemId: ItemId,
) {
  return selectTurn(state, threadId, turnId)?.blocksByItemId[itemId];
}

export function selectOrderedThreads(state: AgentSessionState) {
  const lifecycle = state.threadLifecycle;
  const orderedIds = [
    ...(lifecycle.collections[lifecycle.defaultCollectionKey]?.ids ?? []),
    ...Object.keys(state.threads),
  ];
  const seen = new Set<ThreadId>();
  return orderedIds.flatMap((threadId) => {
    if (!threadId || seen.has(threadId)) return [];
    seen.add(threadId);
    const thread = state.threads[threadId];
    return thread ? [thread] : [];
  });
}

export function selectThreadCollection(
  state: AgentSessionState,
  scope: AgentThreadScope | string = state.threadLifecycle.defaultCollectionKey,
): AgentThreadCollection | undefined {
  return state.threadLifecycle.collections[threadLifecycleStore.collectionKey(scope)];
}

export function selectOrderedCollectionThreads(
  state: AgentSessionState,
  scope: AgentThreadScope | string = state.threadLifecycle.defaultCollectionKey,
) {
  const collection = selectThreadCollection(state, scope);
  const seen = new Set<ThreadId>();
  return (
    collection?.ids.flatMap((threadId) => {
      const canonicalId = canonicalThreadId(state, threadId);
      if (seen.has(canonicalId)) return [];
      seen.add(canonicalId);
      const thread = state.threads[canonicalId];
      return thread ? [thread] : [];
    }) ?? []
  );
}

export function selectPendingOperations(state: AgentSessionState, threadId?: ThreadId) {
  const canonicalFilterId = threadId ? canonicalThreadId(state, threadId) : undefined;
  return Object.values(state.threadLifecycle.operations).filter(
    (operation) =>
      operation.status === "pending" &&
      (canonicalFilterId == null ||
        (operation.threadId != null &&
          canonicalThreadId(state, operation.threadId) === canonicalFilterId)),
  );
}

export function selectThreadView(
  state: AgentSessionState,
  threadId: ThreadId,
): AgentThreadView | undefined {
  const thread = selectThread(state, threadId);
  if (!thread) return undefined;
  const operations = Object.values(thread.operations ?? {});
  const pending = operations.find((operation) => operation.status === "pending");
  return {
    cwd: thread.metadata.cwd,
    error:
      thread.activity === "failed"
        ? operations.find((operation) => operation.error)?.error
        : undefined,
    id: thread.id,
    isActive: selectActiveThread(state)?.id === thread.id,
    isArchived: thread.availability === "archived",
    isPreview: thread.availability === "preview",
    isRunning: thread.activity === "running",
    lastActivityAt: thread.metadata.lastActivityAt,
    needsInput: thread.activity === "waitingForInput",
    pending: pending
      ? {
          error: pending.error,
          operationId: pending.id,
          status: pending.status,
        }
      : undefined,
    subtitle: thread.metadata.cwd,
    title: thread.metadata.title ?? thread.thread.name ?? thread.thread.id,
  };
}

export function selectActiveThreadView(state: AgentSessionState) {
  const thread = selectActiveThread(state);
  return thread ? selectThreadView(state, thread.id) : undefined;
}

export function selectThreadRuntimeView(
  state: AgentSessionState,
  threadId: ThreadId,
): AgentThreadRuntimeView | undefined {
  const thread = selectThread(state, threadId);
  if (!thread) return undefined;
  const activeFlags =
    thread.runtime.status.type === "active" ? thread.runtime.status.activeFlags : [];
  const requestSummaries = selectServerRequestSummaries(state, thread.id);
  const visibleRequestSummaries = requestSummaries.filter((request) => request.visible);
  return {
    activeFlags,
    activeTurnId: thread.runtime.activeTurnId,
    isRunning: thread.activity === "running",
    lastTurn: thread.runtime.lastTurn,
    needsInput: thread.activity === "waitingForInput",
    status: thread.runtime.status.type,
    waitingReasons: unique(
      visibleRequestSummaries.map((request) => request.waitingReason),
    ),
  };
}

export function selectThreadExecutionState(
  state: AgentSessionState,
  threadId: ThreadId,
): AgentThreadExecutionState | undefined {
  const runtime = selectThreadRuntimeView(state, threadId);
  if (!runtime) return undefined;
  const thread = selectThread(state, threadId);
  return {
    runtime,
    serverRequests: thread ? selectServerRequestSummaries(state, thread.id) : [],
  };
}

export function selectThreadSummaryView(
  state: AgentSessionState,
  threadId: ThreadId,
): AgentThreadSummaryView | undefined {
  const view = selectThreadView(state, threadId);
  const execution = selectThreadExecutionState(state, threadId);
  return view && execution ? { ...view, execution } : undefined;
}

export function selectActiveThreadSummaryView(state: AgentSessionState) {
  const thread = selectActiveThread(state);
  return thread ? selectThreadSummaryView(state, thread.id) : undefined;
}

export function selectThreadTranscriptView(
  state: AgentSessionState,
  threadId: ThreadId,
): AgentThreadTranscriptView | undefined {
  const thread = selectThread(state, threadId);
  if (!thread) return undefined;
  return {
    threadId: thread.id,
    turns: selectOrderedTurns(state, thread.id).flatMap((turn) => {
      if (!turn) return [];
      return [
        {
          blocks: turn.itemOrder.flatMap((itemId) => {
            const block = turn.blocksByItemId[itemId];
            return block ? [transcriptBlockView(block)] : [];
          }),
          id: turn.turn.id,
          itemIds: turn.itemOrder,
          ...(turn.turn.status ? { status: turn.turn.status } : {}),
        },
      ];
    }),
  };
}

const approvalRequestKinds = new Set<PendingServerRequest["kind"]>([
  "commandApproval",
  "fileChangeApproval",
]);

export function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId) {
  return selectServerRequestQueue(state, threadId).filter((request) =>
    approvalRequestKinds.has(request.kind),
  );
}

export function selectPendingApprovalViews(
  state: AgentSessionState,
  threadId?: ThreadId,
): AgentApprovalView[] {
  return selectPendingApprovals(state, threadId).map((request) => ({
    ...(request.itemId ? { itemId: request.itemId } : {}),
    kind: request.kind as AgentApprovalView["kind"],
    requestId: request.id,
    ...(request.threadId ? { threadId: request.threadId } : {}),
    ...(request.turnId ? { turnId: request.turnId } : {}),
  }));
}

export function selectServerRequestQueue(state: AgentSessionState, threadId?: ThreadId) {
  const canonicalFilterId = threadId ? canonicalThreadId(state, threadId) : undefined;
  return state.serverRequestQueue.order
    .map((id) => state.serverRequestQueue.byId[id])
    .filter(
      (request): request is PendingServerRequest =>
        request != null &&
        (canonicalFilterId == null ||
          (request.threadId != null &&
            canonicalThreadId(state, request.threadId) === canonicalFilterId)),
    );
}

export function selectServerRequestSummaries(
  state: AgentSessionState,
  threadId?: ThreadId,
): AgentServerRequestSummary[] {
  return selectServerRequestQueue(state, threadId).map(summarizeServerRequest);
}

export function selectApps(state: AgentSessionState, threadId?: ThreadId) {
  const appScope = threadId ?? "";
  return (
    state.apps.byScope[appScope] ?? {
      apps: threadId ? [] : state.apps.apps,
      nextCursor: threadId ? null : state.apps.nextCursor,
      threadId,
    }
  );
}

export function selectDiagnostics(state: AgentSessionState) {
  return state.diagnostics;
}

export function selectDiagnosticsForAudience(
  state: AgentSessionState,
  audience: AgentDiagnosticAudience,
): DiagnosticsState {
  return {
    banners: state.diagnostics.banners.filter((banner) =>
      hasDiagnosticAudience(banner, audience, ["user"]),
    ),
    errors: state.diagnostics.errors.filter((error) =>
      hasDiagnosticAudience(error, audience, ["user"]),
    ),
    protocolNotifications: state.diagnostics.protocolNotifications.filter(
      (notification) =>
        hasDiagnosticAudience(notification, audience, ["developer", "audit"]),
    ),
    warnings: state.diagnostics.warnings.filter((warning) =>
      hasDiagnosticAudience(warning, audience, ["user"]),
    ),
  };
}

export function selectUserDiagnostics(state: AgentSessionState) {
  return selectDiagnosticsForAudience(state, "user");
}

export function selectDeveloperDiagnostics(state: AgentSessionState) {
  return selectDiagnosticsForAudience(state, "developer");
}

export function selectAuditDiagnostics(state: AgentSessionState) {
  return selectDiagnosticsForAudience(state, "audit");
}

export function selectStatusBanners(state: AgentSessionState) {
  return state.diagnostics.banners;
}

export function selectDiagnosticWarnings(state: AgentSessionState) {
  return state.diagnostics.warnings;
}

export function selectDiagnosticErrors(state: AgentSessionState) {
  return state.diagnostics.errors;
}

export function selectProtocolNotifications(state: AgentSessionState) {
  return state.diagnostics.protocolNotifications;
}

function hasDiagnosticAudience(
  value: AgentError | ProtocolNotificationState | StatusBannerState | WarningState,
  audience: AgentDiagnosticAudience,
  fallback: readonly AgentDiagnosticAudience[],
): boolean {
  return (value.audience ?? fallback).includes(audience);
}

export function selectUsage(state: AgentSessionState) {
  return state.usage;
}

export function selectAccountRateLimits(state: AgentSessionState) {
  return state.usage.accountRateLimits;
}

export function selectHostMetrics(state: AgentSessionState) {
  return state.usage.hostMetrics;
}

export function selectThreadLifecycle(state: AgentSessionState) {
  return state.threadLifecycle;
}

export function selectRunSettings(state: AgentSessionState) {
  return state.runSettings;
}

function canonicalThreadId(state: AgentSessionState, threadId: ThreadId): ThreadId {
  let current = threadId;
  const seen = new Set<ThreadId>();
  while (state.threadLifecycle.aliasById[current] && !seen.has(current)) {
    seen.add(current);
    current = state.threadLifecycle.aliasById[current]!;
  }
  return current;
}

function unique<T>(values: readonly T[]): T[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function transcriptBlockView(block: AgentTranscriptBlockView): AgentTranscriptBlockView {
  return {
    ...(block.command !== undefined ? { command: block.command } : {}),
    ...(block.content !== undefined ? { content: block.content } : {}),
    ...(block.cwd !== undefined ? { cwd: block.cwd } : {}),
    ...(block.durationMs != null ? { durationMs: block.durationMs } : {}),
    ...(block.exitCode != null ? { exitCode: block.exitCode } : {}),
    id: block.id,
    kind: block.kind,
    ...(block.output !== undefined ? { output: block.output } : {}),
    ...(block.path !== undefined ? { path: block.path } : {}),
    ...(block.query !== undefined ? { query: block.query } : {}),
    ...(block.resource !== undefined ? { resource: block.resource } : {}),
    ...(block.server !== undefined ? { server: block.server } : {}),
    ...(block.status !== undefined ? { status: block.status } : {}),
    ...(block.subtype !== undefined ? { subtype: block.subtype } : {}),
    ...(block.summary !== undefined ? { summary: block.summary } : {}),
    ...(block.text !== undefined ? { text: block.text } : {}),
    ...(block.tool !== undefined ? { tool: block.tool } : {}),
    ...(block.toolType !== undefined ? { toolType: block.toolType } : {}),
  };
}
