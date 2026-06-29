import {
  selectAccountRateLimits as selectInternalAccountRateLimits,
  selectActiveThreadSummaryView as selectInternalActiveThreadSummaryView,
  selectActiveThreadView as selectInternalActiveThreadView,
  selectApps as selectInternalApps,
  selectAuditDiagnostics as selectInternalAuditDiagnostics,
  selectDeveloperDiagnostics as selectInternalDeveloperDiagnostics,
  selectDiagnosticErrors as selectInternalDiagnosticErrors,
  selectDiagnosticWarnings as selectInternalDiagnosticWarnings,
  selectDiagnostics as selectInternalDiagnostics,
  selectDiagnosticsForAudience as selectInternalDiagnosticsForAudience,
  selectHostMetrics as selectInternalHostMetrics,
  selectPendingApprovalViews as selectInternalPendingApprovalViews,
  selectPendingOperations as selectInternalPendingOperations,
  selectProtocolNotifications as selectInternalProtocolNotifications,
  selectRunSettings as selectInternalRunSettings,
  selectServerRequestSummaries as selectInternalServerRequestSummaries,
  selectStatusBanners as selectInternalStatusBanners,
  selectThreadCollection as selectInternalThreadCollection,
  selectThreadExecutionState as selectInternalThreadExecutionState,
  selectThreadRuntimeView as selectInternalThreadRuntimeView,
  selectThreadSummaryView as selectInternalThreadSummaryView,
  selectThreadTranscriptView as selectInternalThreadTranscriptView,
  selectThreadView as selectInternalThreadView,
  selectUsage as selectInternalUsage,
  selectUserDiagnostics as selectInternalUserDiagnostics,
} from "./selectors";
import type {
  AgentDiagnosticAudience,
  AgentThreadScope,
  ThreadId,
} from "./state";
import {
  internalAgentSessionState,
  type AgentSessionState,
} from "./public-state";

export function selectThreadView(state: AgentSessionState, threadId: ThreadId) {
  return selectInternalThreadView(internalAgentSessionState(state), threadId);
}

export function selectActiveThreadView(state: AgentSessionState) {
  return selectInternalActiveThreadView(internalAgentSessionState(state));
}

export function selectThreadRuntimeView(state: AgentSessionState, threadId: ThreadId) {
  return selectInternalThreadRuntimeView(internalAgentSessionState(state), threadId);
}

export function selectThreadExecutionState(state: AgentSessionState, threadId: ThreadId) {
  return selectInternalThreadExecutionState(internalAgentSessionState(state), threadId);
}

export function selectThreadSummaryView(state: AgentSessionState, threadId: ThreadId) {
  return selectInternalThreadSummaryView(internalAgentSessionState(state), threadId);
}

export function selectActiveThreadSummaryView(state: AgentSessionState) {
  return selectInternalActiveThreadSummaryView(internalAgentSessionState(state));
}

export function selectThreadTranscriptView(state: AgentSessionState, threadId: ThreadId) {
  return selectInternalThreadTranscriptView(internalAgentSessionState(state), threadId);
}

export function selectPendingOperations(state: AgentSessionState, threadId?: ThreadId) {
  return selectInternalPendingOperations(internalAgentSessionState(state), threadId);
}

export function selectPendingApprovalViews(state: AgentSessionState, threadId?: ThreadId) {
  return selectInternalPendingApprovalViews(internalAgentSessionState(state), threadId);
}

export function selectServerRequestSummaries(state: AgentSessionState, threadId?: ThreadId) {
  return selectInternalServerRequestSummaries(internalAgentSessionState(state), threadId);
}

export function selectApps(
  state: AgentSessionState,
  threadId?: ThreadId,
) {
  return selectInternalApps(internalAgentSessionState(state), threadId);
}

export function selectDiagnostics(state: AgentSessionState) {
  return selectInternalDiagnostics(internalAgentSessionState(state));
}

export function selectDiagnosticsForAudience(
  state: AgentSessionState,
  audience: AgentDiagnosticAudience,
) {
  return selectInternalDiagnosticsForAudience(internalAgentSessionState(state), audience);
}

export function selectUserDiagnostics(state: AgentSessionState) {
  return selectInternalUserDiagnostics(internalAgentSessionState(state));
}

export function selectDeveloperDiagnostics(state: AgentSessionState) {
  return selectInternalDeveloperDiagnostics(internalAgentSessionState(state));
}

export function selectAuditDiagnostics(state: AgentSessionState) {
  return selectInternalAuditDiagnostics(internalAgentSessionState(state));
}

export function selectStatusBanners(state: AgentSessionState) {
  return selectInternalStatusBanners(internalAgentSessionState(state));
}

export function selectDiagnosticWarnings(state: AgentSessionState) {
  return selectInternalDiagnosticWarnings(internalAgentSessionState(state));
}

export function selectDiagnosticErrors(state: AgentSessionState) {
  return selectInternalDiagnosticErrors(internalAgentSessionState(state));
}

export function selectProtocolNotifications(state: AgentSessionState) {
  return selectInternalProtocolNotifications(internalAgentSessionState(state));
}

export function selectUsage(state: AgentSessionState) {
  return selectInternalUsage(internalAgentSessionState(state));
}

export function selectAccountRateLimits(state: AgentSessionState) {
  return selectInternalAccountRateLimits(internalAgentSessionState(state));
}

export function selectHostMetrics(state: AgentSessionState) {
  return selectInternalHostMetrics(internalAgentSessionState(state));
}

export function selectThreadCollection(
  state: AgentSessionState,
  scope?: AgentThreadScope | string,
) {
  return selectInternalThreadCollection(internalAgentSessionState(state), scope);
}

export function selectRunSettings(state: AgentSessionState) {
  return selectInternalRunSettings(internalAgentSessionState(state));
}
