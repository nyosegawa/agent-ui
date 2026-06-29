import { A as AgentEvent, a as AgentThreadSummaryView, b as AgentThreadView, T as ThreadId, S as ScopedAppsState, D as DiagnosticsState, c as AgentError, W as WarningState, d as AgentDiagnosticAudience, e as AgentThreadScope, f as AgentApprovalView, g as AgentOperationView, P as ProtocolNotificationState, R as RunSettingsState, h as AgentServerRequestSummary, i as StatusBannerState, j as AgentThreadCollection, k as AgentThreadExecutionState, l as AgentThreadRuntimeView, m as AgentThreadTranscriptView, U as UsageState } from './fake-transport-<chunk>.js';
export { n as AccountEvent, o as AccountState, p as AgentApp, q as AgentChangedFileView, r as AgentDiagnosticReasonCode, s as AgentEventItem, t as AgentEventItemMetadata, u as AgentHook, v as AgentItemBlockResource, w as AgentItemBlockResourceKind, x as AgentModel, y as AgentOperationStatus, z as AgentPendingThreadState, B as AgentRequestOptions, C as AgentRunPolicyId, E as AgentServerRequest, F as AgentSkill, G as AgentThread, H as AgentThreadActiveFlag, I as AgentThreadCollectionStatus, J as AgentThreadLastTurnResult, K as AgentThreadMetadata, L as AgentThreadResumeDiagnosticReasonCode, M as AgentThreadRuntimeState, N as AgentThreadRuntimeStatus, O as AgentThreadWaitingReason, Q as AgentTranscriptBlockView, V as AgentTranscriptTurnView, X as AgentTransport, Y as AgentTransportEvent, Z as AgentTurn, _ as AgentTurnItemsView, $ as AgentTurnMetadata, a0 as AgentTurnResult, a1 as AppsEvent, a2 as AppsState, a3 as ConnectionEvent, a4 as ConnectionState, a5 as DeviceCodeLoginState, a6 as DiagnosticsEvent, a7 as FakeAgentTransport, a8 as FakeAgentTransportOptions, a9 as FakeTransportRequest, aa as HooksEvent, ab as HooksState, ac as ItemEvent, ad as ItemId, ae as ModelState, af as ModelsEvent, ag as ReasoningEffort, ah as RequestId, ai as RequestIdKey, aj as RunSettingsEvent, ak as ServerRequestEvent, al as SkillsEvent, am as SkillsState, an as StatusBannerKind, ao as ThreadEvent, ap as ThreadStatus, aq as ThreadTokenUsage, ar as TokenUsageBreakdown, as as TurnDiffState, at as TurnEvent, au as TurnId, av as TurnPlanState, aw as UsageEvent, ax as requestIdKey } from './fake-transport-<chunk>.js';

type AgentSessionState = unknown;
declare function createInitialAgentState(): AgentSessionState;

declare function agentReducer(state: AgentSessionState | undefined, event: AgentEvent): AgentSessionState;

declare const AGENT_RETENTION_POLICY: {
    readonly appScopesMax: 200;
    readonly commandOutputMaxChars: 128000;
    readonly diagnosticsErrorsMax: 50;
    readonly filePatchesPerTurnMax: 40;
    readonly hooksCwdEntriesMax: 50;
    readonly protocolNotificationsMax: 100;
    readonly skillsCwdEntriesMax: 50;
    readonly statusBannersMax: 20;
    readonly threadCollectionEntriesMax: 200;
    readonly warningsMax: 50;
};

declare function selectThreadView(state: AgentSessionState, threadId: ThreadId): AgentThreadView | undefined;
declare function selectActiveThreadView(state: AgentSessionState): AgentThreadView | undefined;
declare function selectThreadRuntimeView(state: AgentSessionState, threadId: ThreadId): AgentThreadRuntimeView | undefined;
declare function selectThreadExecutionState(state: AgentSessionState, threadId: ThreadId): AgentThreadExecutionState | undefined;
declare function selectThreadSummaryView(state: AgentSessionState, threadId: ThreadId): AgentThreadSummaryView | undefined;
declare function selectActiveThreadSummaryView(state: AgentSessionState): AgentThreadSummaryView | undefined;
declare function selectThreadTranscriptView(state: AgentSessionState, threadId: ThreadId): AgentThreadTranscriptView | undefined;
declare function selectPendingOperations(state: AgentSessionState, threadId?: ThreadId): AgentOperationView[];
declare function selectPendingApprovalViews(state: AgentSessionState, threadId?: ThreadId): AgentApprovalView[];
declare function selectServerRequestSummaries(state: AgentSessionState, threadId?: ThreadId): AgentServerRequestSummary[];
declare function selectApps(state: AgentSessionState, threadId?: ThreadId): ScopedAppsState;
declare function selectDiagnostics(state: AgentSessionState): DiagnosticsState;
declare function selectDiagnosticsForAudience(state: AgentSessionState, audience: AgentDiagnosticAudience): DiagnosticsState;
declare function selectUserDiagnostics(state: AgentSessionState): DiagnosticsState;
declare function selectDeveloperDiagnostics(state: AgentSessionState): DiagnosticsState;
declare function selectAuditDiagnostics(state: AgentSessionState): DiagnosticsState;
declare function selectStatusBanners(state: AgentSessionState): StatusBannerState[];
declare function selectDiagnosticWarnings(state: AgentSessionState): WarningState[];
declare function selectDiagnosticErrors(state: AgentSessionState): AgentError[];
declare function selectProtocolNotifications(state: AgentSessionState): ProtocolNotificationState[];
declare function selectUsage(state: AgentSessionState): UsageState;
declare function selectAccountRateLimits(state: AgentSessionState): unknown;
declare function selectHostMetrics(state: AgentSessionState): unknown;
declare function selectThreadCollection(state: AgentSessionState, scope?: AgentThreadScope | string): AgentThreadCollection | undefined;
declare function selectOrderedCollectionThreads(state: AgentSessionState, scope?: AgentThreadScope | string): AgentThreadView[];
declare function selectRunSettings(state: AgentSessionState): RunSettingsState;

export { AGENT_RETENTION_POLICY, AgentApprovalView, AgentDiagnosticAudience, AgentError, AgentEvent, AgentOperationView, AgentServerRequestSummary, type AgentSessionState, AgentThreadCollection, AgentThreadExecutionState, AgentThreadRuntimeView, AgentThreadScope, AgentThreadSummaryView, AgentThreadTranscriptView, AgentThreadView, DiagnosticsState, ProtocolNotificationState, RunSettingsState, ScopedAppsState, StatusBannerState, ThreadId, UsageState, WarningState, agentReducer, createInitialAgentState, selectAccountRateLimits, selectActiveThreadSummaryView, selectActiveThreadView, selectApps, selectAuditDiagnostics, selectDeveloperDiagnostics, selectDiagnosticErrors, selectDiagnosticWarnings, selectDiagnostics, selectDiagnosticsForAudience, selectHostMetrics, selectOrderedCollectionThreads, selectPendingApprovalViews, selectPendingOperations, selectProtocolNotifications, selectRunSettings, selectServerRequestSummaries, selectStatusBanners, selectThreadCollection, selectThreadExecutionState, selectThreadRuntimeView, selectThreadSummaryView, selectThreadTranscriptView, selectThreadView, selectUsage, selectUserDiagnostics };
