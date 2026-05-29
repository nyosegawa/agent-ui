import type {
  AgentSessionState,
  ItemId,
  PendingServerRequest,
  ThreadId,
  TurnId,
} from "./state";

export function selectActiveThread(state: AgentSessionState) {
  const threadId = state.threadRegistry.activeThreadId;
  return threadId ? state.threads[threadId] : undefined;
}

export function selectThread(state: AgentSessionState, threadId: ThreadId) {
  return state.threads[threadId];
}

export function selectOrderedTurns(state: AgentSessionState, threadId: ThreadId) {
  const thread = selectThread(state, threadId);
  return thread?.orderedTurnIds.map((turnId) => thread.turns[turnId]).filter(Boolean) ?? [];
}

export function selectTurn(
  state: AgentSessionState,
  threadId: ThreadId,
  turnId: TurnId,
) {
  return selectThread(state, threadId)?.turns[turnId];
}

export function selectLatestRunningTurnId(
  state: AgentSessionState,
  threadId: ThreadId,
) {
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

export function selectLatestRunningTurn(
  state: AgentSessionState,
  threadId: ThreadId,
) {
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
  const registry = state.threadRegistry;
  const orderedIds = [
    registry.activeThreadId,
    ...[...registry.liveThreadIds].reverse(),
    ...[...registry.previewThreadIds].reverse(),
    ...[...registry.loadedThreadIds].reverse(),
    ...[...registry.coldThreadIds].reverse(),
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

const approvalRequestKinds = new Set<PendingServerRequest["kind"]>([
  "commandApproval",
  "fileChangeApproval",
  "legacyExecApproval",
  "legacyPatchApproval",
]);

export function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId) {
  return selectServerRequestQueue(state, threadId).filter((request) =>
    approvalRequestKinds.has(request.kind),
  );
}

export function selectServerRequestQueue(state: AgentSessionState, threadId?: ThreadId) {
  return state.serverRequestQueue.order
    .map((id) => state.serverRequestQueue.byId[id])
    .filter(
      (request): request is PendingServerRequest =>
        request != null && (threadId == null || request.threadId === threadId),
    );
}

export function selectApps(state: AgentSessionState, threadId?: ThreadId) {
  const appScope = threadId ?? "";
  return state.apps.byScope[appScope] ?? {
    apps: threadId ? [] : state.apps.apps,
    nextCursor: threadId ? null : state.apps.nextCursor,
    threadId,
  };
}

export function selectDiagnostics(state: AgentSessionState) {
  return state.diagnostics;
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

export function selectUsage(state: AgentSessionState) {
  return state.usage;
}

export function selectAccountRateLimits(state: AgentSessionState) {
  return state.usage.accountRateLimits;
}

export function selectHostMetrics(state: AgentSessionState) {
  return state.usage.hostMetrics;
}

export function selectThreadRegistry(state: AgentSessionState) {
  return state.threadRegistry;
}

export function selectRunSettings(state: AgentSessionState) {
  return state.runSettings;
}
