type RequestId = string | number;
type ThreadId = string;
type TurnId = string;
type ItemId = string;
interface AgentError {
    audience?: readonly AgentDiagnosticAudience[];
    code?: number;
    message: string;
    data?: unknown;
}
type AgentDiagnosticAudience = "user" | "developer" | "audit";

interface AccountState {
    status: "unknown" | "unauthenticated" | "authenticating" | "authenticated";
    account?: Record<string, unknown>;
    login?: DeviceCodeLoginState;
}
interface DeviceCodeLoginState {
    loginId?: string;
    requestId?: RequestId;
    userCode?: string;
    verificationUrl?: string;
    expiresAt?: string;
}

interface AgentApp {
    accessible?: boolean;
    branding?: unknown;
    description?: string;
    enabled?: boolean;
    id: string;
    installUrl?: string;
    labels?: unknown;
    logoUrl?: string;
    logoUrlDark?: string;
    logos?: unknown;
    distributionChannel?: string;
    appMetadata?: unknown;
    metadata?: unknown;
    name?: string;
    pluginDisplayNames?: unknown;
    uri?: string;
}
interface AppsState {
    apps: AgentApp[];
    byScope: Record<string, ScopedAppsState>;
    nextCursor?: string | null;
}
interface ScopedAppsState {
    apps: AgentApp[];
    nextCursor?: string | null;
    threadId?: ThreadId;
}

type ConnectionState = {
    status: "idle";
} | {
    status: "connecting";
} | {
    status: "connected";
} | {
    status: "closed";
    reason?: string;
} | {
    status: "error";
    error: AgentError;
};

type AgentThreadResumeDiagnosticReasonCode = "canonical_thread_id_mismatch" | "resume_response_missing_thread_id" | "resume_response_normalization_failed";
type AgentDiagnosticReasonCode = AgentThreadResumeDiagnosticReasonCode;
interface WarningState {
    audience?: readonly AgentDiagnosticAudience[];
    id: string;
    message: string;
    raw?: unknown;
    reasonCode?: AgentDiagnosticReasonCode;
    requestedThreadId?: ThreadId;
    threadId?: ThreadId;
}
type StatusBannerKind = "modelReroute" | "deprecationNotice" | "configWarning" | "accountStatus" | "mcpOAuth" | "rateLimit" | "system";
interface StatusBannerState {
    audience?: readonly AgentDiagnosticAudience[];
    id: string;
    kind: StatusBannerKind;
    message: string;
    raw?: unknown;
    severity?: "info" | "warning" | "critical";
}
interface DiagnosticsState {
    banners: StatusBannerState[];
    errors: AgentError[];
    protocolNotifications: ProtocolNotificationState[];
    warnings: WarningState[];
}
interface ProtocolNotificationState {
    audience?: readonly AgentDiagnosticAudience[];
    id: string;
    method: string;
    params?: unknown;
}

interface AgentHook {
    id: string;
    name?: string;
    cwd?: string;
    enabled?: boolean;
}
interface HooksState {
    byCwd: Record<string, AgentHook[]>;
}

interface ModelState {
    models: AgentModel[];
    selectedModelId?: string;
}
interface AgentModel {
    id: string;
    name?: string;
    defaultEffort?: ReasoningEffort;
    isDefault?: boolean;
    supportedEfforts?: ReasoningEffort[];
}
type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | string;

type ExecutionModeId = "review" | "auto" | "read-only" | "full-access" | string;
interface RunSettingsState {
    executionMode: ExecutionModeId;
    modelId?: string;
    effort?: ReasoningEffort;
    cwd?: string;
}

type RequestIdKey = `${"number" | "string"}:${string}`;
declare function requestIdKey(requestId: RequestId): RequestIdKey;

type PendingServerRequestKind = "attestation" | "authRefresh" | "commandApproval" | "dynamicTool" | "fileChangeApproval" | "mcpElicitation" | "permissionsApproval" | "userInput" | "unknown";
interface PendingServerRequest {
    id: RequestId;
    kind: PendingServerRequestKind;
    threadId?: ThreadId;
    turnId?: TurnId;
    itemId?: ItemId;
    payload: unknown;
}
interface ServerRequestQueueState {
    byId: Record<RequestIdKey, PendingServerRequest>;
    order: RequestIdKey[];
}

interface AgentSkill {
    name: string;
    path?: string;
    cwd?: string;
    enabled?: boolean;
}
interface SkillsState {
    byCwd: Record<string, AgentSkill[]>;
}

interface AgentItemState {
    id: ItemId;
    turnId: TurnId;
    threadId: ThreadId;
    kind: string;
    status: "inProgress" | "completed" | "failed";
    text?: string;
    metadata?: AgentItemMetadata;
}
interface AgentItemMetadata {
    arguments?: unknown;
    changes?: unknown[];
    clientUserMessageId?: string;
    command?: string;
    content?: string;
    cwd?: string;
    displayName?: string;
    durationMs?: number;
    error?: unknown;
    exitCode?: number;
    fileName?: string;
    imageUrl?: string;
    message?: string;
    mimeType?: string;
    name?: string;
    optimistic?: boolean;
    operationId?: string;
    retrying?: boolean;
    path?: string;
    previewUrl?: string;
    query?: string;
    redactedPath?: string;
    result?: unknown;
    review?: string;
    server?: string;
    serverItemId?: string;
    summary?: string;
    tool?: string;
    url?: string;
}
type AgentItemBlockKind = "text" | "thinking" | "plan" | "commandExecution" | "fileChange" | "toolCall" | "mcpToolCall" | "collabToolCall" | "webSearch" | "image" | "systemInfo" | "unknown";
type AgentItemBlockResourceKind = "image" | "video" | "file" | "local-media";
interface AgentItemBlockResource {
    displayName?: string;
    kind?: AgentItemBlockResourceKind;
    mimeType?: string;
    path?: string;
    previewUrl?: string;
    redactedPath?: string;
    url?: string;
}
interface AgentItemBlock {
    id: ItemId;
    kind: AgentItemBlockKind;
    status?: AgentItemState["status"];
    text?: string;
    summary?: string;
    content?: string;
    command?: string;
    cwd?: string;
    output?: string;
    exitCode?: number;
    durationMs?: number;
    changes?: unknown[];
    tool?: string;
    toolType?: "mcp" | "dynamic" | "generic" | "collab";
    server?: string;
    arguments?: unknown;
    result?: unknown;
    error?: unknown;
    query?: string;
    path?: string;
    resource?: AgentItemBlockResource;
    subtype?: "review_mode" | "compaction" | "unknown_item" | "error" | "status" | string;
    metadata?: Record<string, unknown>;
}

interface AgentTurn {
    id: TurnId;
    threadId: ThreadId;
    itemsView?: AgentTurnItemsView;
    status?: string;
    metadata?: AgentTurnMetadata;
}
interface AgentTurnMetadata {
    optimistic?: boolean;
    operationId?: string;
}
type AgentTurnItemsView = "notLoaded" | "summary" | "full";
interface TurnState {
    turn: AgentTurn;
    itemOrder: ItemId[];
    items: Record<ItemId, AgentItemState>;
    blocksByItemId: Record<ItemId, AgentItemBlock>;
    streamingTextByItemId: Record<ItemId, string>;
    commandOutputByItemId: Record<ItemId, string>;
    filePatchByItemId: Record<ItemId, unknown>;
    plan?: TurnPlanState;
    diff?: TurnDiffState;
}
interface TurnPlanState {
    explanation?: string | null;
    plan: unknown;
}
interface TurnDiffState {
    diff: unknown;
}

interface AgentThread {
    id: ThreadId;
    name?: string;
    path?: string | null;
    ephemeral?: boolean;
    metadata?: AgentThreadMetadata;
}
interface AgentThreadMetadata {
    optimistic?: boolean;
    operationId?: string;
}
type ThreadStatus = "notLoaded" | "loaded" | "ready" | "running" | "waitingForInput" | "complete" | "completed" | "interrupted" | "error" | "failed" | "archived" | "closed" | "systemError";
type AgentThreadActiveFlag = "waitingOnApproval" | "waitingOnUserInput";
type AgentThreadRuntimeStatus = {
    type: "notLoaded";
} | {
    type: "idle";
} | {
    type: "systemError";
} | {
    activeFlags: AgentThreadActiveFlag[];
    type: "active";
};
type AgentTurnResult = "completed" | "error" | "failed" | "interrupted" | "unknown";
interface AgentThreadLastTurnResult {
    result: AgentTurnResult;
    status?: string;
    turnId: TurnId;
}
interface AgentThreadRuntimeState {
    activeTurnId?: TurnId;
    lastTurn?: AgentThreadLastTurnResult;
    status: AgentThreadRuntimeStatus;
}
interface ThreadTokenUsage {
    cachedInputTokens?: number;
    inputTokens?: number;
    last?: TokenUsageBreakdown;
    modelContextWindow?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
    turnId?: TurnId;
}
interface TokenUsageBreakdown {
    cachedInputTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
}
type AgentOperationStatus = "pending" | "running" | "succeeded" | "failed" | "cancelled";
interface AgentPendingThreadState {
    operationId: string;
    status: AgentOperationStatus;
    error?: AgentError;
}
interface AgentOperationView {
    id: string;
    kind: string;
    status: AgentOperationStatus;
    error?: AgentError;
    threadId?: ThreadId;
}
interface AgentThreadView {
    id: ThreadId;
    title: string;
    subtitle?: string;
    cwd?: string;
    isActive: boolean;
    isArchived: boolean;
    isPreview: boolean;
    isRunning: boolean;
    needsInput: boolean;
    lastActivityAt?: number;
    pending?: AgentPendingThreadState;
    error?: AgentError;
}
type AgentThreadWaitingReason = "approval" | "attestation" | "authRefresh" | "mcpElicitation" | "permission" | "unknown" | "userInput";
interface AgentThreadRuntimeView {
    activeFlags: AgentThreadActiveFlag[];
    activeTurnId?: TurnId;
    isRunning: boolean;
    lastTurn?: AgentThreadLastTurnResult;
    needsInput: boolean;
    status: AgentThreadRuntimeStatus["type"];
    waitingReasons: AgentThreadWaitingReason[];
}
interface AgentServerRequestSummary {
    id: RequestId;
    itemId?: ItemId;
    kind: PendingServerRequestKind;
    threadId?: ThreadId;
    turnId?: TurnId;
    visible: boolean;
    waitingReason: AgentThreadWaitingReason;
}
interface AgentThreadExecutionState {
    runtime: AgentThreadRuntimeView;
    serverRequests: AgentServerRequestSummary[];
}
interface AgentThreadSummaryView extends AgentThreadView {
    execution: AgentThreadExecutionState;
}
type AgentTranscriptBlockView = Pick<AgentItemBlock, "command" | "content" | "cwd" | "durationMs" | "exitCode" | "id" | "kind" | "output" | "path" | "query" | "resource" | "server" | "status" | "subtype" | "summary" | "text" | "tool" | "toolType">;
interface AgentTranscriptTurnView {
    blocks: AgentTranscriptBlockView[];
    id: TurnId;
    itemIds: ItemId[];
    status?: string;
}
interface AgentThreadTranscriptView {
    threadId: ThreadId;
    turns: AgentTranscriptTurnView[];
}
interface AgentApprovalView {
    itemId?: ItemId;
    kind: "commandApproval" | "fileChangeApproval";
    requestId: RequestId;
    threadId?: ThreadId;
    turnId?: TurnId;
}
interface ThreadState {
    id: ThreadId;
    canonicalId?: ThreadId;
    activity: "idle" | "running" | "waitingForInput" | "failed";
    availability: "available" | "preview" | "archived" | "closed";
    storage: "unknown" | "stored" | "ephemeral";
    metadata: {
        cwd?: string;
        lastActivityAt?: number;
        title?: string;
    };
    operations: Record<string, AgentOperationView>;
    thread: AgentThread;
    runtime: AgentThreadRuntimeState;
    turns: Record<TurnId, TurnState>;
    orderedTurnIds: TurnId[];
    tokenUsage?: ThreadTokenUsage;
    status: ThreadStatus;
}
type AgentThreadScope = {
    kind: "all";
    key?: string;
} | {
    kind: "history";
    key?: string;
    archived?: boolean;
    cwd?: string;
    searchTerm?: string;
} | {
    kind: "custom";
    key: string;
    label?: string;
};
type AgentThreadCollectionStatus = "idle" | "loading" | "ready" | "error";
interface AgentThreadCollection {
    key: string;
    scope: AgentThreadScope;
    ids: ThreadId[];
    nextCursor: string | null;
    status: AgentThreadCollectionStatus;
    error?: AgentError;
    syncedAt?: number;
}
interface ThreadLifecycleState {
    activeThreadId?: ThreadId;
    aliasById: Record<ThreadId, ThreadId>;
    collections: Record<string, AgentThreadCollection>;
    defaultCollectionKey: string;
    operations: Record<string, AgentOperationView>;
}

interface UsageState {
    accountRateLimits?: unknown;
    hostMetrics?: unknown;
}

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

type AccountEvent = {
    type: "account/updated";
    status?: "unauthenticated" | "authenticated";
    account?: unknown;
} | {
    type: "account/rateLimits/updated";
    rateLimits: unknown;
} | {
    type: "account/login/deviceCodeStarted";
    loginId?: string;
    requestId?: RequestId;
    userCode?: string;
    verificationUrl?: string;
    expiresAt?: string;
} | {
    type: "account/login/completed";
    account?: unknown;
    error?: string | null;
    loginId?: string | null;
    success?: boolean;
};

type AppsEvent = {
    type: "apps/updated";
    apps: AgentApp[];
    nextCursor?: string | null;
    threadId?: ThreadId;
};

type ConnectionEvent = {
    type: "connection/connecting";
} | {
    type: "connection/connected";
} | {
    type: "connection/closed";
    reason?: string;
} | {
    type: "connection/error";
    error: AgentError;
};

type DiagnosticsEvent = {
    type: "status/banner/added";
    banner: StatusBannerState;
} | {
    type: "status/banner/removed";
    id: string;
} | {
    type: "notification/received";
    notification: ProtocolNotificationState;
} | {
    type: "warning/added";
    warning: WarningState;
} | {
    type: "error/added";
    error: AgentError;
};

type HooksEvent = {
    type: "hooks/updated";
    cwd: string;
    hooks: AgentHook[];
};

type ItemEvent = {
    type: "item/started";
    threadId: ThreadId;
    turnId: TurnId;
    item: AgentItemState;
} | {
    type: "item/agentMessage/delta";
    threadId: ThreadId;
    turnId: TurnId;
    itemId: ItemId;
    delta: string;
} | {
    type: "item/reasoning/summaryTextDelta";
    threadId: ThreadId;
    turnId: TurnId;
    itemId: ItemId;
    delta: string;
} | {
    type: "item/commandOutput/delta";
    threadId: ThreadId;
    turnId: TurnId;
    itemId: ItemId;
    delta: string;
} | {
    type: "item/filePatch/updated";
    threadId: ThreadId;
    turnId: TurnId;
    itemId: ItemId;
    patch: unknown;
} | {
    type: "item/failed";
    threadId: ThreadId;
    turnId: TurnId;
    itemId: ItemId;
    error?: AgentError;
} | {
    type: "item/completed";
    threadId: ThreadId;
    turnId: TurnId;
    item: AgentItemState;
};

type ModelsEvent = {
    type: "models/updated";
    models: AgentModel[];
    selectedModelId?: string;
};

type RunSettingsEvent = {
    type: "runSettings/updated";
    executionMode?: ExecutionModeId;
    modelId?: string;
    effort?: ReasoningEffort;
    cwd?: string;
};

type ServerRequestEvent = {
    type: "serverRequest/created";
    request: PendingServerRequest;
} | {
    type: "serverRequest/resolved";
    requestId: RequestId;
} | {
    type: "serverRequest/rejected";
    requestId: RequestId;
    error?: AgentError;
};

type SkillsEvent = {
    type: "skills/updated";
    cwd: string;
    skills: AgentSkill[];
};

type ThreadEvent = {
    type: "thread/upserted";
    thread: AgentThread;
    runtimeStatus?: AgentThreadRuntimeStatus;
    status?: ThreadStatus;
    turns?: AgentTurn[];
    snapshot?: boolean;
} | {
    type: "thread/started";
    thread: AgentThread;
    runtimeStatus?: AgentThreadRuntimeStatus;
    status?: ThreadStatus;
    turns?: AgentTurn[];
    snapshot?: boolean;
} | {
    type: "thread/status/changed";
    threadId: ThreadId;
    runtimeStatus?: AgentThreadRuntimeStatus;
    status: ThreadStatus;
    snapshot?: boolean;
} | {
    type: "thread/name/updated";
    threadId: ThreadId;
    name: string;
} | {
    type: "thread/tokenUsage/updated";
    threadId: ThreadId;
    tokenUsage: ThreadTokenUsage;
} | {
    type: "thread/active/set";
    threadId?: ThreadId;
} | {
    type: "thread/optimistic/created";
    operation: AgentOperationView;
    runtimeStatus?: AgentThreadRuntimeStatus;
    thread: AgentThread;
    status?: ThreadStatus;
    turns?: AgentTurn[];
} | {
    type: "thread/reconciled";
    canonicalThreadId: ThreadId;
    threadId: ThreadId;
} | {
    type: "thread/optimistic/rolledBack";
    operationId?: string;
    threadId: ThreadId;
} | {
    type: "thread/collection/refreshStarted";
    scope: AgentThreadScope;
} | {
    type: "thread/collection/pageReceived";
    ids: ThreadId[];
    nextCursor?: string | null;
    replace?: boolean;
    scope: AgentThreadScope;
    syncedAt?: number;
} | {
    type: "thread/collection/synced";
    nextCursor?: string | null;
    scope: AgentThreadScope;
    syncedAt?: number;
} | {
    type: "thread/collection/failed";
    error: AgentError;
    scope: AgentThreadScope;
} | {
    type: "thread/operation/updated";
    operation: AgentOperationView;
};

type TurnEvent = {
    type: "turn/started";
    threadId: ThreadId;
    turn: AgentTurn;
} | {
    type: "turn/completed";
    threadId: ThreadId;
    turn: AgentTurn;
    items?: AgentItemState[];
    snapshot?: boolean;
} | {
    type: "turn/plan/updated";
    threadId: ThreadId;
    turnId: TurnId;
    explanation?: string | null;
    plan: unknown;
} | {
    type: "turn/diff/updated";
    threadId: ThreadId;
    turnId: TurnId;
    diff: unknown;
};

type UsageEvent = {
    type: "usage/hostMetrics/updated";
    metrics: unknown;
};

type AgentEvent = ConnectionEvent | AccountEvent | UsageEvent | SkillsEvent | AppsEvent | HooksEvent | ModelsEvent | RunSettingsEvent | ThreadEvent | TurnEvent | ItemEvent | ServerRequestEvent | DiagnosticsEvent;
interface AgentTransportEvent {
    type: "event" | "request" | "response" | "error" | "stderr" | "raw";
    event?: AgentEvent;
    request?: PendingServerRequest;
    requestId?: RequestId;
    payload?: unknown;
    error?: AgentError;
    message?: string;
}

interface AgentTransport {
    readonly events: AsyncIterable<AgentTransportEvent>;
    close(): Promise<void>;
    connect(): Promise<void>;
    notify(method: string, params?: unknown): void;
    reject(requestId: RequestId, error: AgentError): Promise<void>;
    request<TParams = unknown, TResult = unknown>(method: string, params?: TParams, options?: AgentRequestOptions): Promise<TResult>;
    respond(requestId: RequestId, result: unknown): Promise<void>;
}
interface AgentRequestOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    trace?: unknown;
}

interface FakeTransportRequest {
    id: RequestId;
    method: string;
    options?: AgentRequestOptions;
    params?: unknown;
}
interface FakeAgentTransportOptions {
    onRequest?: (request: FakeTransportRequest, transport: FakeAgentTransport) => unknown;
}
declare class FakeAgentTransport implements AgentTransport {
    #private;
    readonly requests: FakeTransportRequest[];
    readonly notifications: Array<{
        method: string;
        params?: unknown;
    }>;
    readonly responses: Map<string, unknown>;
    readonly rejections: Map<string, AgentError>;
    constructor(options?: FakeAgentTransportOptions);
    get events(): AsyncIterable<AgentTransportEvent>;
    connect(): Promise<void>;
    close(): Promise<void>;
    request<TParams = unknown, TResult = unknown>(method: string, params?: TParams, options?: AgentRequestOptions): Promise<TResult>;
    notify(method: string, params?: unknown): void;
    respond(requestId: RequestId, result: unknown): Promise<void>;
    reject(requestId: RequestId, error: AgentError): Promise<void>;
    push(event: AgentTransportEvent): void;
}

interface FixtureStep {
    name?: string;
    event: AgentEvent;
}
declare function runEventFixture(steps: FixtureStep[], initialState?: AgentSessionState): AgentSessionState;

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

export { AGENT_RETENTION_POLICY, type AccountEvent, type AccountState, type AgentApp, type AgentApprovalView, type AgentDiagnosticAudience, type AgentDiagnosticReasonCode, type AgentError, type AgentEvent, type AgentHook, type AgentItemBlock, type AgentItemBlockKind, type AgentItemBlockResource, type AgentItemBlockResourceKind, type AgentItemMetadata, type AgentItemState, type AgentModel, type AgentOperationStatus, type AgentOperationView, type AgentPendingThreadState, type AgentRequestOptions, type AgentServerRequestSummary, type AgentSessionState, type AgentSkill, type AgentThread, type AgentThreadActiveFlag, type AgentThreadCollection, type AgentThreadCollectionStatus, type AgentThreadExecutionState, type AgentThreadLastTurnResult, type AgentThreadMetadata, type AgentThreadResumeDiagnosticReasonCode, type AgentThreadRuntimeState, type AgentThreadRuntimeStatus, type AgentThreadRuntimeView, type AgentThreadScope, type AgentThreadSummaryView, type AgentThreadTranscriptView, type AgentThreadView, type AgentThreadWaitingReason, type AgentTranscriptBlockView, type AgentTranscriptTurnView, type AgentTransport, type AgentTransportEvent, type AgentTurn, type AgentTurnItemsView, type AgentTurnMetadata, type AgentTurnResult, type AppsEvent, type AppsState, type ConnectionEvent, type ConnectionState, type DeviceCodeLoginState, type DiagnosticsEvent, type DiagnosticsState, type ExecutionModeId, FakeAgentTransport, type FakeAgentTransportOptions, type FakeTransportRequest, type FixtureStep, type HooksEvent, type HooksState, type ItemEvent, type ItemId, type ModelState, type ModelsEvent, type PendingServerRequest, type PendingServerRequestKind, type ProtocolNotificationState, type ReasoningEffort, type RequestId, type RequestIdKey, type RunSettingsEvent, type RunSettingsState, type ScopedAppsState, type ServerRequestEvent, type ServerRequestQueueState, type SkillsEvent, type SkillsState, type StatusBannerKind, type StatusBannerState, type ThreadEvent, type ThreadId, type ThreadLifecycleState, type ThreadState, type ThreadStatus, type ThreadTokenUsage, type TokenUsageBreakdown, type TurnDiffState, type TurnEvent, type TurnId, type TurnPlanState, type TurnState, type UsageEvent, type UsageState, type WarningState, agentReducer, createInitialAgentState, requestIdKey, runEventFixture, selectAccountRateLimits, selectActiveThread, selectActiveThreadSummaryView, selectActiveThreadView, selectApps, selectAuditDiagnostics, selectDeveloperDiagnostics, selectDiagnosticErrors, selectDiagnosticWarnings, selectDiagnostics, selectDiagnosticsForAudience, selectHostMetrics, selectItemBlock, selectLatestRunningTurn, selectLatestRunningTurnId, selectOrderedCollectionThreads, selectOrderedItems, selectOrderedThreads, selectOrderedTurns, selectPendingApprovalViews, selectPendingApprovals, selectPendingOperations, selectProtocolNotifications, selectRunSettings, selectServerRequestQueue, selectServerRequestSummaries, selectStatusBanners, selectThread, selectThreadCollection, selectThreadExecutionState, selectThreadLifecycle, selectThreadRuntimeView, selectThreadSummaryView, selectThreadTranscriptView, selectThreadView, selectTurn, selectTurnItem, selectUsage, selectUserDiagnostics };
