import { A as AgentEvent, a as AgentThreadSummaryView, b as AgentThreadView, T as ThreadId, S as ScopedAppsState, D as DiagnosticsState, c as AgentError, W as WarningState, d as AgentDiagnosticAudience, e as AgentApprovalView, f as AgentOperationView, P as ProtocolNotificationState, R as RunSettingsState, g as AgentServerRequestSummary, h as StatusBannerState, i as AgentThreadScope, j as AgentThreadCollection, k as AgentThreadExecutionState, l as AgentThreadRuntimeView, m as AgentThreadTranscriptView, U as UsageState } from './fake-transport-<chunk>.js';
export { n as AccountEvent, o as AccountState, p as AgentApp, q as AgentDiagnosticReasonCode, r as AgentHook, s as AgentItemBlockResource, t as AgentItemBlockResourceKind, u as AgentItemMetadata, v as AgentItemState, w as AgentModel, x as AgentOperationStatus, y as AgentPendingThreadState, z as AgentRequestOptions, B as AgentRunPolicyId, C as AgentSkill, E as AgentThread, F as AgentThreadActiveFlag, G as AgentThreadCollectionStatus, H as AgentThreadLastTurnResult, I as AgentThreadMetadata, J as AgentThreadResumeDiagnosticReasonCode, K as AgentThreadRuntimeState, L as AgentThreadRuntimeStatus, M as AgentThreadWaitingReason, N as AgentTransport, O as AgentTransportEvent, Q as AgentTurn, V as AgentTurnItemsView, X as AgentTurnMetadata, Y as AgentTurnResult, Z as AppsEvent, _ as AppsState, $ as ConnectionEvent, a0 as ConnectionState, a1 as DeviceCodeLoginState, a2 as DiagnosticsEvent, a3 as FakeAgentTransport, a4 as FakeAgentTransportOptions, a5 as FakeTransportRequest, a6 as HooksEvent, a7 as HooksState, a8 as ItemEvent, a9 as ItemId, aa as ModelState, ab as ModelsEvent, ac as ReasoningEffort, ad as RequestId, ae as RequestIdKey, af as RunSettingsEvent, ag as ServerRequestEvent, ah as SkillsEvent, ai as SkillsState, aj as StatusBannerKind, ak as ThreadEvent, al as ThreadStatus, am as ThreadTokenUsage, an as TokenUsageBreakdown, ao as TurnDiffState, ap as TurnEvent, aq as TurnId, ar as TurnPlanState, as as UsageEvent, at as requestIdKey } from './fake-transport-<chunk>.js';

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
declare function selectRunSettings(state: AgentSessionState): RunSettingsState;

export { AGENT_RETENTION_POLICY, AgentApprovalView, AgentDiagnosticAudience, AgentError, AgentEvent, AgentOperationView, AgentServerRequestSummary, type AgentSessionState, AgentThreadCollection, AgentThreadExecutionState, AgentThreadRuntimeView, AgentThreadScope, AgentThreadSummaryView, AgentThreadTranscriptView, AgentThreadView, DiagnosticsState, ProtocolNotificationState, RunSettingsState, ScopedAppsState, StatusBannerState, ThreadId, UsageState, WarningState, agentReducer, createInitialAgentState, selectAccountRateLimits, selectActiveThreadSummaryView, selectActiveThreadView, selectApps, selectAuditDiagnostics, selectDeveloperDiagnostics, selectDiagnosticErrors, selectDiagnosticWarnings, selectDiagnostics, selectDiagnosticsForAudience, selectHostMetrics, selectPendingApprovalViews, selectPendingOperations, selectProtocolNotifications, selectRunSettings, selectServerRequestSummaries, selectStatusBanners, selectThreadCollection, selectThreadExecutionState, selectThreadRuntimeView, selectThreadSummaryView, selectThreadTranscriptView, selectThreadView, selectUsage, selectUserDiagnostics };
