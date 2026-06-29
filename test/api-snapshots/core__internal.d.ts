import { a4 as ConnectionState, o as AccountState, a2 as AppsState, D as DiagnosticsState, ab as HooksState, T as ThreadId, ay as ThreadState, az as ThreadLifecycleState, aA as ServerRequestQueueState, ae as ModelState, R as RunSettingsState, am as SkillsState, U as UsageState, A as AgentEvent, a as AgentThreadSummaryView, b as AgentThreadView, S as ScopedAppsState, c as AgentError, W as WarningState, d as AgentDiagnosticAudience, au as TurnId, ad as ItemId, aB as AgentItemBlock, aC as TurnState, e as AgentThreadScope, aD as AgentItemState, f as AgentApprovalView, aE as PendingServerRequest, g as AgentOperationView, P as ProtocolNotificationState, h as AgentServerRequestSummary, i as StatusBannerState, j as AgentThreadCollection, k as AgentThreadExecutionState, l as AgentThreadRuntimeView, m as AgentThreadTranscriptView } from './fake-transport-<chunk>.js';
export { n as AccountEvent, p as AgentApp, q as AgentChangedFileView, r as AgentDiagnosticReasonCode, s as AgentEventItem, t as AgentEventItemMetadata, u as AgentHook, aF as AgentItemBlockKind, v as AgentItemBlockResource, w as AgentItemBlockResourceKind, aG as AgentItemMetadata, x as AgentModel, y as AgentOperationStatus, z as AgentPendingThreadState, B as AgentRequestOptions, C as AgentRunPolicyId, E as AgentServerRequest, F as AgentSkill, G as AgentThread, H as AgentThreadActiveFlag, I as AgentThreadCollectionStatus, J as AgentThreadLastTurnResult, K as AgentThreadMetadata, L as AgentThreadResumeDiagnosticReasonCode, M as AgentThreadRuntimeState, N as AgentThreadRuntimeStatus, O as AgentThreadWaitingReason, Q as AgentTranscriptBlockView, V as AgentTranscriptTurnView, X as AgentTransport, Y as AgentTransportEvent, Z as AgentTurn, _ as AgentTurnItemsView, $ as AgentTurnMetadata, a0 as AgentTurnResult, a1 as AppsEvent, a3 as ConnectionEvent, a5 as DeviceCodeLoginState, a6 as DiagnosticsEvent, a7 as FakeAgentTransport, a8 as FakeAgentTransportOptions, a9 as FakeTransportRequest, aa as HooksEvent, ac as ItemEvent, af as ModelsEvent, aH as PendingServerRequestKind, ag as ReasoningEffort, ah as RequestId, ai as RequestIdKey, aj as RunSettingsEvent, ak as ServerRequestEvent, al as SkillsEvent, an as StatusBannerKind, ao as ThreadEvent, ap as ThreadStatus, aq as ThreadTokenUsage, ar as TokenUsageBreakdown, as as TurnDiffState, at as TurnEvent, av as TurnPlanState, aw as UsageEvent, ax as requestIdKey } from './fake-transport-<chunk>.js';

interface AgentSessionState {
    connection: ConnectionState;
    account: AccountState;
    apps: AppsState;
    diagnostics: DiagnosticsState;
    hooks: HooksState;
    threads: Record<ThreadId, ThreadState>;
    threadLifecycle: ThreadLifecycleState;
    serverRequestQueue: ServerRequestQueueState;
    models: ModelState;
    runSettings: RunSettingsState;
    skills: SkillsState;
    usage: UsageState;
}
declare function createInitialAgentState(): AgentSessionState;

interface FixtureStep {
    name?: string;
    event: AgentEvent;
}
declare function runEventFixture(steps: FixtureStep[], initialState?: AgentSessionState): AgentSessionState;

declare function agentReducer(state: AgentSessionState | undefined, event: AgentEvent): AgentSessionState;

declare function selectActiveThread(state: AgentSessionState): ThreadState | undefined;
declare function selectThread(state: AgentSessionState, threadId: ThreadId): ThreadState | undefined;
declare function selectOrderedTurns(state: AgentSessionState, threadId: ThreadId): (TurnState | undefined)[];
declare function selectTurn(state: AgentSessionState, threadId: ThreadId, turnId: TurnId): TurnState | undefined;
declare function selectLatestRunningTurnId(state: AgentSessionState, threadId: ThreadId): string | undefined;
declare function selectLatestRunningTurn(state: AgentSessionState, threadId: ThreadId): TurnState | undefined;
declare function selectTurnItem(state: AgentSessionState, threadId: ThreadId, turnId: TurnId, itemId: ItemId): AgentItemState | undefined;
declare function selectOrderedItems(state: AgentSessionState, threadId: ThreadId, turnId: TurnId): (AgentItemState | undefined)[];
declare function selectItemBlock(state: AgentSessionState, threadId: ThreadId, turnId: TurnId, itemId: ItemId): AgentItemBlock | undefined;
declare function selectOrderedThreads(state: AgentSessionState): ThreadState[];
declare function selectThreadCollection(state: AgentSessionState, scope?: AgentThreadScope | string): AgentThreadCollection | undefined;
declare function selectOrderedCollectionThreads(state: AgentSessionState, scope?: AgentThreadScope | string): ThreadState[];
declare function selectPendingOperations(state: AgentSessionState, threadId?: ThreadId): AgentOperationView[];
declare function selectThreadView(state: AgentSessionState, threadId: ThreadId): AgentThreadView | undefined;
declare function selectActiveThreadView(state: AgentSessionState): AgentThreadView | undefined;
declare function selectThreadRuntimeView(state: AgentSessionState, threadId: ThreadId): AgentThreadRuntimeView | undefined;
declare function selectThreadExecutionState(state: AgentSessionState, threadId: ThreadId): AgentThreadExecutionState | undefined;
declare function selectThreadSummaryView(state: AgentSessionState, threadId: ThreadId): AgentThreadSummaryView | undefined;
declare function selectActiveThreadSummaryView(state: AgentSessionState): AgentThreadSummaryView | undefined;
declare function selectThreadTranscriptView(state: AgentSessionState, threadId: ThreadId): AgentThreadTranscriptView | undefined;
declare function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId): PendingServerRequest[];
declare function selectPendingApprovalViews(state: AgentSessionState, threadId?: ThreadId): AgentApprovalView[];
declare function selectServerRequestQueue(state: AgentSessionState, threadId?: ThreadId): PendingServerRequest[];
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
declare function selectThreadLifecycle(state: AgentSessionState): ThreadLifecycleState;
declare function selectRunSettings(state: AgentSessionState): RunSettingsState;

export { AccountState, AgentApprovalView, AgentDiagnosticAudience, AgentError, AgentEvent, AgentItemBlock, AgentItemState, AgentOperationView, AgentServerRequestSummary, type AgentSessionState, AgentThreadCollection, AgentThreadExecutionState, AgentThreadRuntimeView, AgentThreadScope, AgentThreadSummaryView, AgentThreadTranscriptView, AgentThreadView, AppsState, ConnectionState, DiagnosticsState, type FixtureStep, HooksState, ItemId, ModelState, PendingServerRequest, ProtocolNotificationState, RunSettingsState, ScopedAppsState, ServerRequestQueueState, SkillsState, StatusBannerState, ThreadId, ThreadLifecycleState, ThreadState, TurnId, TurnState, UsageState, WarningState, agentReducer, createInitialAgentState, runEventFixture, selectAccountRateLimits, selectActiveThread, selectActiveThreadSummaryView, selectActiveThreadView, selectApps, selectAuditDiagnostics, selectDeveloperDiagnostics, selectDiagnosticErrors, selectDiagnosticWarnings, selectDiagnostics, selectDiagnosticsForAudience, selectHostMetrics, selectItemBlock, selectLatestRunningTurn, selectLatestRunningTurnId, selectOrderedCollectionThreads, selectOrderedItems, selectOrderedThreads, selectOrderedTurns, selectPendingApprovalViews, selectPendingApprovals, selectPendingOperations, selectProtocolNotifications, selectRunSettings, selectServerRequestQueue, selectServerRequestSummaries, selectStatusBanners, selectThread, selectThreadCollection, selectThreadExecutionState, selectThreadLifecycle, selectThreadRuntimeView, selectThreadSummaryView, selectThreadTranscriptView, selectThreadView, selectTurn, selectTurnItem, selectUsage, selectUserDiagnostics };
