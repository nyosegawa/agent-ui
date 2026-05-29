type RequestId = string | number;
type ThreadId = string;
type TurnId = string;
type ItemId = string;
interface AgentError {
    code?: number;
    message: string;
    data?: unknown;
}

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
    id: string;
    name?: string;
    uri?: string;
    installed?: boolean;
    needsAuth?: boolean;
    raw?: unknown;
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

interface WarningState {
    id: string;
    message: string;
    raw?: unknown;
}
type StatusBannerKind = "modelReroute" | "deprecationNotice" | "configWarning" | "accountStatus" | "mcpOAuth" | "rateLimit" | "system";
interface StatusBannerState {
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
    id: string;
    method: string;
    params?: unknown;
}

interface AgentHook {
    id: string;
    name?: string;
    cwd?: string;
    enabled?: boolean;
    raw?: unknown;
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
    supportedEfforts?: ReasoningEffort[];
    raw?: unknown;
}
type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | string;

type ExecutionModeId = "review" | "auto" | "read-only" | "full-access" | string;
interface RunSettingsState {
    executionMode: ExecutionModeId;
    modelId?: string;
    effort?: ReasoningEffort;
    cwd?: string;
}

type PendingServerRequestKind = "attestation" | "authRefresh" | "commandApproval" | "dynamicTool" | "fileChangeApproval" | "legacyExecApproval" | "legacyPatchApproval" | "mcpElicitation" | "permissionsApproval" | "userInput" | "unknown";
interface PendingServerRequest {
    id: RequestId;
    kind: PendingServerRequestKind;
    threadId?: ThreadId;
    turnId?: TurnId;
    itemId?: ItemId;
    payload: unknown;
}
interface ServerRequestQueueState {
    byId: Record<string, PendingServerRequest>;
    order: string[];
}

interface AgentSkill {
    name: string;
    path?: string;
    cwd?: string;
    enabled?: boolean;
    raw?: unknown;
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
    raw?: unknown;
}
type AgentItemBlockKind = "text" | "thinking" | "plan" | "commandExecution" | "fileChange" | "toolCall" | "mcpToolCall" | "collabToolCall" | "webSearch" | "image" | "systemInfo" | "unknown";
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
    subtype?: "review_mode" | "compaction" | "unknown_item" | "error" | "status" | string;
    metadata?: Record<string, unknown>;
    raw?: unknown;
}

interface AgentTurn {
    id: TurnId;
    threadId: ThreadId;
    itemsView?: AgentTurnItemsView;
    status?: string;
    raw?: unknown;
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
    raw?: unknown;
}
interface TurnDiffState {
    diff: unknown;
    raw?: unknown;
}

interface AgentThread {
    id: ThreadId;
    name?: string;
    path?: string | null;
    ephemeral?: boolean;
    raw?: unknown;
}
type ThreadStatus = "notLoaded" | "loaded" | "running" | "waitingForInput" | "complete" | "error" | string;
interface ThreadTokenUsage {
    cachedInputTokens?: number;
    inputTokens?: number;
    last?: TokenUsageBreakdown;
    modelContextWindow?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
    turnId?: TurnId;
    raw?: unknown;
}
interface TokenUsageBreakdown {
    cachedInputTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
    reasoningOutputTokens?: number;
    totalTokens?: number;
}
interface ThreadState {
    thread: AgentThread;
    turns: Record<TurnId, TurnState>;
    orderedTurnIds: TurnId[];
    tokenUsage?: ThreadTokenUsage;
    status: ThreadStatus;
    registryStatus: ThreadRegistryStatus;
}
type ThreadRegistryStatus = "cold" | "preview" | "live" | "loaded";
interface ThreadRegistryState {
    activeThreadId?: ThreadId;
    coldThreadIds: ThreadId[];
    previewThreadIds: ThreadId[];
    liveThreadIds: ThreadId[];
    loadedThreadIds: ThreadId[];
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
    threadRegistry: ThreadRegistryState;
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
    status?: ThreadStatus;
    turns?: AgentTurn[];
    snapshot?: boolean;
} | {
    type: "thread/started";
    thread: AgentThread;
    status?: ThreadStatus;
    turns?: AgentTurn[];
    snapshot?: boolean;
} | {
    type: "thread/status/changed";
    threadId: ThreadId;
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
    raw?: unknown;
} | {
    type: "turn/diff/updated";
    threadId: ThreadId;
    turnId: TurnId;
    diff: unknown;
    raw?: unknown;
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
    readonly threadRegistrySnapshotsMax: 200;
    readonly warningsMax: 50;
};
declare function boundedAppend<T>(items: readonly T[], item: T, max: number): T[];
declare function boundedStringAppend(current: string | undefined, delta: string, maxChars: number): string;
declare function boundedRecordEntry<T>(record: Record<string, T>, key: string, value: T, maxEntries: number): Record<string, T>;
declare function boundedUniqueAppend<T>(items: readonly T[], item: T, max: number): T[];

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
declare function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId): PendingServerRequest[];
declare function selectServerRequestQueue(state: AgentSessionState, threadId?: ThreadId): PendingServerRequest[];
declare function selectApps(state: AgentSessionState, threadId?: ThreadId): ScopedAppsState;
declare function selectDiagnostics(state: AgentSessionState): DiagnosticsState;
declare function selectStatusBanners(state: AgentSessionState): StatusBannerState[];
declare function selectDiagnosticWarnings(state: AgentSessionState): WarningState[];
declare function selectDiagnosticErrors(state: AgentSessionState): AgentError[];
declare function selectProtocolNotifications(state: AgentSessionState): ProtocolNotificationState[];
declare function selectUsage(state: AgentSessionState): UsageState;
declare function selectAccountRateLimits(state: AgentSessionState): unknown;
declare function selectHostMetrics(state: AgentSessionState): unknown;
declare function selectThreadRegistry(state: AgentSessionState): ThreadRegistryState;
declare function selectRunSettings(state: AgentSessionState): RunSettingsState;

interface AppsStore {
    createInitialState(): AppsState;
    reduce(state: AppsState, event: AppsEvent): AppsState;
}
declare const appsStore: AppsStore;
declare function createInitialAppsState(): AppsState;
declare function reduceAppsState(current: AppsState, event: AppsEvent): AppsState;
declare function updateAppsState(current: AppsState, event: AppsEvent): AppsState;

interface ConnectionStore {
    createInitialState(): ConnectionState;
    reduce(state: ConnectionState, event: ConnectionEvent): ConnectionState;
}
declare const connectionStore: ConnectionStore;
declare function createInitialConnectionState(): ConnectionState;
declare function reduceConnectionState(state: ConnectionState, event: ConnectionEvent): ConnectionState;

interface DiagnosticsStore {
    addError(state: DiagnosticsState, error: AgentError): DiagnosticsState;
    addWarning(state: DiagnosticsState, warning: WarningState): DiagnosticsState;
    createInitialState(): DiagnosticsState;
    recordNotification(state: DiagnosticsState, notification: ProtocolNotificationState): DiagnosticsState;
    reduce(state: DiagnosticsState, event: DiagnosticsEvent): DiagnosticsState;
    removeBanner(state: DiagnosticsState, id: string): DiagnosticsState;
    upsertBanner(state: DiagnosticsState, banner: StatusBannerState): DiagnosticsState;
}
declare const diagnosticsStore: DiagnosticsStore;
declare function createInitialDiagnosticsState(): DiagnosticsState;
declare function reduceDiagnosticsState(state: DiagnosticsState, event: DiagnosticsEvent): DiagnosticsState;
declare function upsertStatusBanner(state: DiagnosticsState, banner: StatusBannerState): DiagnosticsState;
declare function removeStatusBanner(state: DiagnosticsState, id: string): DiagnosticsState;
declare function recordProtocolNotification(state: DiagnosticsState, notification: ProtocolNotificationState): DiagnosticsState;
declare function addDiagnosticWarning(state: DiagnosticsState, warning: WarningState): DiagnosticsState;
declare function addDiagnosticError(state: DiagnosticsState, error: AgentError): DiagnosticsState;

interface ItemStore {
    appendCommandOutput(turn: TurnState, itemId: ItemId, delta: string, maxChars: number): TurnState;
    appendStreamingText(turn: TurnState, itemId: ItemId, delta: string): TurnState;
    createItemBlock(item: AgentItemState): AgentItemBlock;
    updateFilePatch(turn: TurnState, itemId: ItemId, patch: unknown, maxEntries: number): TurnState;
    upsert(turn: TurnState, item: AgentItemState): TurnState;
}
declare const itemStore: ItemStore;
declare function upsertItem(turn: TurnState, item: AgentItemState): TurnState;
declare function appendStreamingText(turn: TurnState, itemId: ItemId, delta: string): TurnState;
declare function appendCommandOutput(turn: TurnState, itemId: ItemId, delta: string, maxChars: number): TurnState;
declare function updateFilePatch(turn: TurnState, itemId: ItemId, patch: unknown, maxEntries: number): TurnState;
declare function createItemBlock(item: AgentItemState): AgentItemBlock;

type PendingServerRequestState = Record<string, PendingServerRequest>;
interface ServerRequestStore {
    createInitialPendingState(): PendingServerRequestState;
    createInitialQueueState(): ServerRequestQueueState;
    dequeue(queue: ServerRequestQueueState, requestId: string): ServerRequestQueueState;
    enqueue(queue: ServerRequestQueueState, request: PendingServerRequest): ServerRequestQueueState;
    hasPendingThreadRequest(requests: PendingServerRequestState, threadId: ThreadId): boolean;
}
declare const serverRequestStore: ServerRequestStore;
declare function createInitialPendingServerRequestState(): PendingServerRequestState;
declare function createInitialServerRequestQueueState(): ServerRequestQueueState;
declare function hasPendingThreadRequest(requests: PendingServerRequestState, threadId: ThreadId): boolean;
declare function enqueueServerRequest(queue: ServerRequestQueueState, request: PendingServerRequest): ServerRequestQueueState;
declare function dequeueServerRequest(queue: ServerRequestQueueState, requestId: string): ServerRequestQueueState;

type ThreadEntityState = Record<ThreadId, ThreadState>;
interface ThreadEntityStore {
    createInitialState(): ThreadEntityState;
    createThreadState(thread: AgentThread): ThreadState;
    getOrCreate(threads: ThreadEntityState, thread: AgentThread): ThreadState;
    setStatus(state: AgentSessionState, threadId: ThreadId, status: ThreadStatus, options?: {
        onlyIf?: ThreadStatus;
    }): AgentSessionState;
    update(state: AgentSessionState, threadId: ThreadId, updater: (thread: ThreadState) => ThreadState): AgentSessionState;
    pruneSnapshots(state: AgentSessionState): AgentSessionState;
}
declare const threadEntityStore: ThreadEntityStore;
declare function createInitialThreadEntityState(): ThreadEntityState;
declare function createThreadState(thread: AgentThread): ThreadState;
declare function getOrCreateThreadState(threads: ThreadEntityState, thread: AgentThread): ThreadState;
declare function updateThreadEntity(state: AgentSessionState, threadId: ThreadId, updater: (thread: ThreadState) => ThreadState): AgentSessionState;
declare function setThreadStatus(state: AgentSessionState, threadId: ThreadId, status: ThreadStatus, options?: {
    onlyIf?: ThreadStatus;
}): AgentSessionState;
declare function pruneThreadSnapshots(state: AgentSessionState): AgentSessionState;

interface ThreadIndexStore {
    createInitialState(): ThreadRegistryState;
    classifyStatus(status?: string, turns?: readonly AgentTurn[]): ThreadRegistryStatus;
    upsert(registry: ThreadRegistryState, threadId: ThreadId, status: ThreadRegistryStatus, activeThreadId?: ThreadId): ThreadRegistryState;
}
declare const threadIndexStore: ThreadIndexStore;
declare function createInitialThreadRegistryState(): ThreadRegistryState;
declare function classifyThreadRegistryStatus(status?: string, turns?: readonly AgentTurn[]): ThreadRegistryStatus;
declare function upsertThreadRegistryEntry(registry: ThreadRegistryState, threadId: ThreadId, status: ThreadRegistryStatus, activeThreadId?: string | undefined): ThreadRegistryState;

interface TurnStore {
    createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState;
    upsert(thread: ThreadState, turn: AgentTurn, threadStatus: ThreadState["status"]): ThreadState;
    update(state: AgentSessionState, threadId: ThreadId, turnId: TurnId, updater: (turn: TurnState) => TurnState): AgentSessionState;
}
declare const turnStore: TurnStore;
declare function createTurnState(turn: AgentTurn, threadId: ThreadId): TurnState;
declare function upsertTurn(thread: ThreadState, turn: AgentTurn, threadStatus: ThreadState["status"]): ThreadState;
declare function updateTurn(state: AgentSessionState, threadId: ThreadId, turnId: TurnId, updater: (turn: TurnState) => TurnState): AgentSessionState;

interface UsageStore {
    createInitialState(): UsageState;
    reduce(state: UsageState, event: UsageEvent): UsageState;
    setAccountRateLimits(state: UsageState, accountRateLimits: unknown): UsageState;
    setHostMetrics(state: UsageState, hostMetrics: unknown): UsageState;
}
declare const usageStore: UsageStore;
declare function createInitialUsageState(): UsageState;
declare function reduceUsageState(state: UsageState, event: UsageEvent): UsageState;
declare function updateHostMetrics(state: UsageState, hostMetrics: unknown): UsageState;
declare function updateAccountRateLimits(state: UsageState, accountRateLimits: unknown): UsageState;

export { AGENT_RETENTION_POLICY, type AccountEvent, type AccountState, type AgentApp, type AgentError, type AgentEvent, type AgentHook, type AgentItemBlock, type AgentItemBlockKind, type AgentItemState, type AgentModel, type AgentRequestOptions, type AgentSessionState, type AgentSkill, type AgentThread, type AgentTransport, type AgentTransportEvent, type AgentTurn, type AgentTurnItemsView, type AppsEvent, type AppsState, type AppsStore, type ConnectionEvent, type ConnectionState, type ConnectionStore, type DeviceCodeLoginState, type DiagnosticsEvent, type DiagnosticsState, type DiagnosticsStore, type ExecutionModeId, FakeAgentTransport, type FakeAgentTransportOptions, type FakeTransportRequest, type FixtureStep, type HooksEvent, type HooksState, type ItemEvent, type ItemId, type ItemStore, type ModelState, type ModelsEvent, type PendingServerRequest, type PendingServerRequestKind, type PendingServerRequestState, type ProtocolNotificationState, type ReasoningEffort, type RequestId, type RunSettingsEvent, type RunSettingsState, type ScopedAppsState, type ServerRequestEvent, type ServerRequestQueueState, type ServerRequestStore, type SkillsEvent, type SkillsState, type StatusBannerKind, type StatusBannerState, type ThreadEntityState, type ThreadEntityStore, type ThreadEvent, type ThreadId, type ThreadIndexStore, type ThreadRegistryState, type ThreadRegistryStatus, type ThreadState, type ThreadStatus, type ThreadTokenUsage, type TokenUsageBreakdown, type TurnDiffState, type TurnEvent, type TurnId, type TurnPlanState, type TurnState, type TurnStore, type UsageEvent, type UsageState, type UsageStore, type WarningState, addDiagnosticError, addDiagnosticWarning, agentReducer, appendCommandOutput, appendStreamingText, appsStore, boundedAppend, boundedRecordEntry, boundedStringAppend, boundedUniqueAppend, classifyThreadRegistryStatus, connectionStore, createInitialAgentState, createInitialAppsState, createInitialConnectionState, createInitialDiagnosticsState, createInitialPendingServerRequestState, createInitialServerRequestQueueState, createInitialThreadEntityState, createInitialThreadRegistryState, createInitialUsageState, createItemBlock, createThreadState, createTurnState, dequeueServerRequest, diagnosticsStore, enqueueServerRequest, getOrCreateThreadState, hasPendingThreadRequest, itemStore, pruneThreadSnapshots, recordProtocolNotification, reduceAppsState, reduceConnectionState, reduceDiagnosticsState, reduceUsageState, removeStatusBanner, runEventFixture, selectAccountRateLimits, selectActiveThread, selectApps, selectDiagnosticErrors, selectDiagnosticWarnings, selectDiagnostics, selectHostMetrics, selectItemBlock, selectLatestRunningTurn, selectLatestRunningTurnId, selectOrderedItems, selectOrderedThreads, selectOrderedTurns, selectPendingApprovals, selectProtocolNotifications, selectRunSettings, selectServerRequestQueue, selectStatusBanners, selectThread, selectThreadRegistry, selectTurn, selectTurnItem, selectUsage, serverRequestStore, setThreadStatus, threadEntityStore, threadIndexStore, turnStore, updateAccountRateLimits, updateAppsState, updateFilePatch, updateHostMetrics, updateThreadEntity, updateTurn, upsertItem, upsertStatusBanner, upsertThreadRegistryEntry, upsertTurn, usageStore };
