type RequestId = string | number;
type ThreadId = string;
type TurnId = string;
type ItemId = string;
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
interface AgentError {
    code?: number;
    message: string;
    data?: unknown;
}
interface AccountState {
    status: "unknown" | "unauthenticated" | "authenticating" | "authenticated";
    account?: Record<string, unknown>;
    login?: DeviceCodeLoginState;
    rateLimits?: unknown;
}
interface DeviceCodeLoginState {
    loginId?: string;
    requestId?: RequestId;
    userCode?: string;
    verificationUrl?: string;
    expiresAt?: string;
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
interface AgentTurn {
    id: TurnId;
    threadId: ThreadId;
    status?: string;
    raw?: unknown;
}
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
interface UsageState {
    accountRateLimits?: unknown;
    hostMetrics?: unknown;
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
interface AgentSessionState {
    connection: ConnectionState;
    account: AccountState;
    apps: AppsState;
    diagnostics: DiagnosticsState;
    hooks: HooksState;
    threads: Record<ThreadId, ThreadState>;
    threadRegistry: ThreadRegistryState;
    activeThreadId?: ThreadId;
    pendingServerRequests: Record<string, PendingServerRequest>;
    serverRequestQueue: ServerRequestQueueState;
    models: ModelState;
    runSettings: RunSettingsState;
    skills: SkillsState;
    usage: UsageState;
    configWarnings: WarningState[];
    errors: AgentError[];
}
declare function createInitialAgentState(): AgentSessionState;

type AgentEvent = {
    type: "connection/connecting";
} | {
    type: "connection/connected";
} | {
    type: "connection/closed";
    reason?: string;
} | {
    type: "connection/error";
    error: AgentError;
} | {
    type: "account/updated";
    status?: "unauthenticated" | "authenticated";
    account?: unknown;
} | {
    type: "account/rateLimits/updated";
    rateLimits: unknown;
} | {
    type: "usage/hostMetrics/updated";
    metrics: unknown;
} | {
    type: "skills/updated";
    cwd: string;
    skills: AgentSkill[];
} | {
    type: "apps/updated";
    apps: AgentApp[];
    nextCursor?: string | null;
    threadId?: ThreadId;
} | {
    type: "hooks/updated";
    cwd: string;
    hooks: AgentHook[];
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
} | {
    type: "models/updated";
    models: AgentModel[];
    selectedModelId?: string;
} | {
    type: "runSettings/updated";
    executionMode?: ExecutionModeId;
    modelId?: string;
    effort?: ReasoningEffort;
    cwd?: string;
} | {
    type: "thread/upserted";
    thread: AgentThread;
    status?: ThreadStatus;
    turns?: AgentTurn[];
} | {
    type: "thread/started";
    thread: AgentThread;
    status?: ThreadStatus;
    turns?: AgentTurn[];
} | {
    type: "thread/status/changed";
    threadId: ThreadId;
    status: ThreadStatus;
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
    type: "turn/started";
    threadId: ThreadId;
    turn: AgentTurn;
} | {
    type: "turn/completed";
    threadId: ThreadId;
    turn: AgentTurn;
    items?: AgentItemState[];
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
} | {
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
} | {
    type: "serverRequest/created";
    request: PendingServerRequest;
} | {
    type: "serverRequest/resolved";
    requestId: RequestId;
} | {
    type: "serverRequest/rejected";
    requestId: RequestId;
    error?: AgentError;
} | {
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

type OpenAIAgentsAdapterChunk = string | AgentEvent | AgentTransportEvent;
interface OpenAIAgentsRunContext {
    input: unknown;
    params?: Record<string, unknown>;
    threadId: ThreadId;
    turnId: TurnId;
}
interface OpenAIAgentsAdapterOptions {
    createItemId?: (context: OpenAIAgentsRunContext) => string;
    createThreadId?: () => ThreadId;
    createTurnId?: (threadId: ThreadId) => TurnId;
    run: (context: OpenAIAgentsRunContext) => AsyncIterable<OpenAIAgentsAdapterChunk> | Iterable<OpenAIAgentsAdapterChunk> | Promise<string | OpenAIAgentsAdapterChunk[]> | string | OpenAIAgentsAdapterChunk[];
}
declare function createOpenAIAgentsSdkTransportAdapter(options: OpenAIAgentsAdapterOptions): AgentTransport;

declare function agentReducer(state: AgentSessionState | undefined, event: AgentEvent): AgentSessionState;

declare const AGENT_RETENTION_POLICY: {
    readonly commandOutputMaxChars: 128000;
    readonly diagnosticsErrorsMax: 50;
    readonly filePatchesPerTurnMax: 40;
    readonly protocolNotificationsMax: 100;
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
declare function selectOrderedThreads(state: AgentSessionState): ThreadState[];
declare function selectPendingApprovals(state: AgentSessionState, threadId?: ThreadId): PendingServerRequest[];
declare function selectServerRequestQueue(state: AgentSessionState, threadId?: ThreadId): (PendingServerRequest | undefined)[];
declare function selectUsage(state: AgentSessionState): UsageState;
declare function selectThreadRegistry(state: AgentSessionState): ThreadRegistryState;
declare function selectRunSettings(state: AgentSessionState): RunSettingsState;

export { AGENT_RETENTION_POLICY, type AccountState, type AgentApp, type AgentError, type AgentEvent, type AgentHook, type AgentItemBlock, type AgentItemBlockKind, type AgentItemState, type AgentModel, type AgentRequestOptions, type AgentSessionState, type AgentSkill, type AgentThread, type AgentTransport, type AgentTransportEvent, type AgentTurn, type AppsState, type ConnectionState, type DeviceCodeLoginState, type DiagnosticsState, type ExecutionModeId, FakeAgentTransport, type FakeAgentTransportOptions, type FakeTransportRequest, type FixtureStep, type HooksState, type ItemId, type ModelState, type OpenAIAgentsAdapterChunk, type OpenAIAgentsAdapterOptions, type OpenAIAgentsRunContext, type PendingServerRequest, type PendingServerRequestKind, type ProtocolNotificationState, type ReasoningEffort, type RequestId, type RunSettingsState, type ScopedAppsState, type ServerRequestQueueState, type SkillsState, type StatusBannerKind, type StatusBannerState, type ThreadId, type ThreadRegistryState, type ThreadRegistryStatus, type ThreadState, type ThreadStatus, type ThreadTokenUsage, type TokenUsageBreakdown, type TurnDiffState, type TurnId, type TurnPlanState, type TurnState, type UsageState, type WarningState, agentReducer, boundedAppend, boundedRecordEntry, boundedStringAppend, boundedUniqueAppend, createInitialAgentState, createOpenAIAgentsSdkTransportAdapter, runEventFixture, selectActiveThread, selectOrderedThreads, selectOrderedTurns, selectPendingApprovals, selectRunSettings, selectServerRequestQueue, selectThread, selectThreadRegistry, selectUsage };
