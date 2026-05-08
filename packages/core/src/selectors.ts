import type { AgentSessionState, ThreadId } from "./state";

export function selectActiveThread(state: AgentSessionState) {
  return state.activeThreadId ? state.threads[state.activeThreadId] : undefined;
}

export function selectThread(state: AgentSessionState, threadId: ThreadId) {
  return state.threads[threadId];
}

export function selectOrderedTurns(state: AgentSessionState, threadId: ThreadId) {
  const thread = selectThread(state, threadId);
  return thread?.orderedTurnIds.map((turnId) => thread.turns[turnId]).filter(Boolean) ?? [];
}

export function selectOrderedThreads(state: AgentSessionState) {
  return Object.values(state.threads);
}

export function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId) {
  return Object.values(state.pendingServerRequests).filter((request) => {
    const approval =
      request.kind === "commandApproval" || request.kind === "fileChangeApproval";
    return approval && (threadId == null || request.threadId === threadId);
  });
}

export function selectRunSettings(state: AgentSessionState) {
  return state.runSettings;
}
