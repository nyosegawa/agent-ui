import { a0 as ConnectionState, o as AccountState, _ as AppsState, D as DiagnosticsState, a7 as HooksState, T as ThreadId, au as ThreadState, av as ThreadLifecycleState, aw as ServerRequestQueueState, aa as ModelState, R as RunSettingsState, ai as SkillsState, U as UsageState, A as AgentEvent, a as AgentThreadSummaryView, b as AgentThreadView, S as ScopedAppsState, c as AgentError, W as WarningState, d as AgentDiagnosticAudience, aq as TurnId, a9 as ItemId, ax as AgentItemBlock, ay as TurnState, i as AgentThreadScope, v as AgentItemState, e as AgentApprovalView, az as PendingServerRequest, f as AgentOperationView, P as ProtocolNotificationState, g as AgentServerRequestSummary, h as StatusBannerState, j as AgentThreadCollection, k as AgentThreadExecutionState, l as AgentThreadRuntimeView, m as AgentThreadTranscriptView } from './fake-transport-<chunk>.js';
export { n as AccountEvent, p as AgentApp, aA as AgentChangedFileView, q as AgentDiagnosticReasonCode, r as AgentHook, aB as AgentItemBlockKind, s as AgentItemBlockResource, t as AgentItemBlockResourceKind, u as AgentItemMetadata, w as AgentModel, x as AgentOperationStatus, y as AgentPendingThreadState, z as AgentRequestOptions, B as AgentRunPolicyId, C as AgentSkill, E as AgentThread, F as AgentThreadActiveFlag, G as AgentThreadCollectionStatus, H as AgentThreadLastTurnResult, I as AgentThreadMetadata, J as AgentThreadResumeDiagnosticReasonCode, K as AgentThreadRuntimeState, L as AgentThreadRuntimeStatus, M as AgentThreadWaitingReason, aC as AgentTranscriptBlockView, aD as AgentTranscriptTurnView, N as AgentTransport, O as AgentTransportEvent, Q as AgentTurn, V as AgentTurnItemsView, X as AgentTurnMetadata, Y as AgentTurnResult, Z as AppsEvent, $ as ConnectionEvent, a1 as DeviceCodeLoginState, a2 as DiagnosticsEvent, a3 as FakeAgentTransport, a4 as FakeAgentTransportOptions, a5 as FakeTransportRequest, a6 as HooksEvent, a8 as ItemEvent, ab as ModelsEvent, aE as PendingServerRequestKind, ac as ReasoningEffort, ad as RequestId, ae as RequestIdKey, af as RunSettingsEvent, ag as ServerRequestEvent, ah as SkillsEvent, aj as StatusBannerKind, ak as ThreadEvent, al as ThreadStatus, am as ThreadTokenUsage, an as TokenUsageBreakdown, ao as TurnDiffState, ap as TurnEvent, ar as TurnPlanState, as as UsageEvent, at as requestIdKey } from './fake-transport-<chunk>.js';

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
