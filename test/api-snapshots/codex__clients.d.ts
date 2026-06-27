import { RequestId, AgentError, AgentRequestOptions, AgentTransport } from '@nyosegawa/agent-ui-core';
import { AppsListParams, HooksListParams, ModelListParams, SkillsConfigWriteParams, SkillsListParams, ThreadForkParams, ThreadInjectItemsParams, ThreadListParams, ThreadLoadedListParams, ThreadMetadataUpdateParams, ThreadResumeParams, ThreadStartParams, TurnStartParams, TurnSteerParams } from './request-<chunk>.js';
import { T as ThreadId, R as RealtimeVoice, A as AbsolutePathBuf, J as JsonValue, U as UserInput, M as MessagePhase, L as LegacyAppPathString, a as ReasoningEffort, b as TurnItemsView, c as ThreadHistoryMode, d as ThreadSource, e as ModeKind, C as CodexStableMethod, f as CancelLoginAccountResponse, g as LoginAccountResponse, h as LogoutAccountResponse, G as GetAccountRateLimitsResponse, i as GetAccountTokenUsageResponse, j as GetAccountResponse, k as AppsListResponse, H as HooksListResponse, I as InitializeResponse, l as ModelListResponse, S as SkillsConfigWriteResponse, m as SkillsListResponse, n as ThreadArchiveResponse, o as ThreadCompactStartResponse, p as ThreadForkResponse, q as ThreadInjectItemsResponse, r as ThreadListResponse, s as ThreadLoadedListResponse, t as ThreadMetadataUpdateResponse, u as ThreadSetNameResponse, v as ThreadReadResponse, w as ThreadResumeResponse, x as ThreadRollbackResponse, y as ThreadStartResponse, z as ThreadUnarchiveResponse, B as ThreadUnsubscribeResponse, D as TurnInterruptResponse, E as TurnStartResponse, F as TurnSteerResponse, K as CodexExperimentalMethod, N as CodexExperimentalMethodParams } from './method-params-<chunk>.js';
import { k as StableProductizedMethod, E as ExperimentalAvailableMethod, C as CodexInitializeOptions } from './protocol-<chunk>.js';
import { U as UserInput$1 } from './UserInput-<chunk>.js';
import './InitializeParams-<chunk>.js';

type AgentPath = string;

type SubAgentSource = "review" | "compact" | {
    "thread_spawn": {
        parent_thread_id: ThreadId;
        depth: number;
        agent_path: AgentPath | null;
        agent_nickname: string | null;
        agent_role: string | null;
    };
} | "memory_consolidation" | {
    "other": string;
};

type FuzzyFileSearchSessionStartResponse = Record<string, never>;

type FuzzyFileSearchSessionStopResponse = Record<string, never>;

type FuzzyFileSearchSessionUpdateResponse = Record<string, never>;

type RealtimeVoicesList = {
    v1: Array<RealtimeVoice>;
    v2: Array<RealtimeVoice>;
    defaultV1: RealtimeVoice;
    defaultV2: RealtimeVoice;
};

type NonSteerableTurnKind = "review" | "compact";

/**
 * This translation layer make sure that we expose codex error code in camel case.
 *
 * When an upstream HTTP status is available (for example, from the Responses API or a provider),
 * it is forwarded in `httpStatusCode` on the relevant `codexErrorInfo` variant.
 */
type CodexErrorInfo = "contextWindowExceeded" | "sessionBudgetExceeded" | "usageLimitExceeded" | "serverOverloaded" | "cyberPolicy" | {
    "httpConnectionFailed": {
        httpStatusCode: number | null;
    };
} | {
    "responseStreamConnectionFailed": {
        httpStatusCode: number | null;
    };
} | "internalServerError" | "unauthorized" | "badRequest" | "threadRollbackFailed" | "sandboxError" | {
    "responseStreamDisconnected": {
        httpStatusCode: number | null;
    };
} | {
    "responseTooManyFailedAttempts": {
        httpStatusCode: number | null;
    };
} | {
    "activeTurnNotSteerable": {
        turnKind: NonSteerableTurnKind;
    };
} | "other";

type TurnError = {
    message: string;
    codexErrorInfo: CodexErrorInfo | null;
    additionalDetails: string | null;
};

type PatchChangeKind = {
    "type": "add";
} | {
    "type": "delete";
} | {
    "type": "update";
    move_path: string | null;
};

type FileUpdateChange = {
    path: string;
    kind: PatchChangeKind;
    diff: string;
};

type CollabAgentStatus = "pendingInit" | "running" | "interrupted" | "completed" | "errored" | "shutdown" | "notFound";

type CollabAgentState = {
    status: CollabAgentStatus;
    message: string | null;
};

type CollabAgentTool = "spawnAgent" | "sendInput" | "resumeAgent" | "wait" | "closeAgent";

type CollabAgentToolCallStatus = "inProgress" | "completed" | "failed";

type CommandAction = {
    "type": "read";
    command: string;
    name: string;
    path: AbsolutePathBuf;
} | {
    "type": "listFiles";
    command: string;
    path: string | null;
} | {
    "type": "search";
    command: string;
    query: string | null;
    path: string | null;
} | {
    "type": "unknown";
    command: string;
};

type CommandExecutionSource = "agent" | "userShell" | "unifiedExecStartup" | "unifiedExecInteraction";

type CommandExecutionStatus = "inProgress" | "completed" | "failed" | "declined";

type DynamicToolCallOutputContentItem = {
    "type": "inputText";
    text: string;
} | {
    "type": "inputImage";
    imageUrl: string;
};

type DynamicToolCallStatus = "inProgress" | "completed" | "failed";

type HookPromptFragment = {
    text: string;
    hookRunId: string;
};

type McpToolCallAppContext = {
    connectorId: string;
    linkId: string | null;
    resourceUri: string | null;
    appName: string | null;
    templateId: string | null;
    actionName: string | null;
};

type McpToolCallError = {
    message: string;
};

type McpToolCallResult = {
    content: Array<JsonValue>;
    structuredContent: JsonValue | null;
    _meta: JsonValue | null;
};

type McpToolCallStatus = "inProgress" | "completed" | "failed";

type MemoryCitationEntry = {
    path: string;
    lineStart: number;
    lineEnd: number;
    note: string;
};

type MemoryCitation = {
    entries: Array<MemoryCitationEntry>;
    threadIds: Array<string>;
};

type PatchApplyStatus = "inProgress" | "completed" | "failed" | "declined";

type SubAgentActivityKind = "started" | "interacted" | "interrupted";

type WebSearchAction = {
    "type": "search";
    query: string | null;
    queries: Array<string> | null;
} | {
    "type": "openPage";
    url: string | null;
} | {
    "type": "findInPage";
    url: string | null;
    pattern: string | null;
} | {
    "type": "other";
};

type ThreadItem = {
    "type": "userMessage";
    id: string;
    clientId: string | null;
    content: Array<UserInput>;
} | {
    "type": "hookPrompt";
    id: string;
    fragments: Array<HookPromptFragment>;
} | {
    "type": "agentMessage";
    id: string;
    text: string;
    phase: MessagePhase | null;
    memoryCitation: MemoryCitation | null;
} | {
    "type": "plan";
    id: string;
    text: string;
} | {
    "type": "reasoning";
    id: string;
    summary: Array<string>;
    content: Array<string>;
} | {
    "type": "commandExecution";
    id: string;
    /**
     * The command to be executed.
     */
    command: string;
    /**
     * The command's working directory.
     */
    cwd: LegacyAppPathString;
    /**
     * Identifier for the underlying PTY process (when available).
     */
    processId: string | null;
    source: CommandExecutionSource;
    status: CommandExecutionStatus;
    /**
     * A best-effort parsing of the command to understand the action(s) it will perform.
     * This returns a list of CommandAction objects because a single shell command may
     * be composed of many commands piped together.
     */
    commandActions: Array<CommandAction>;
    /**
     * The command's output, aggregated from stdout and stderr.
     */
    aggregatedOutput: string | null;
    /**
     * The command's exit code.
     */
    exitCode: number | null;
    /**
     * The duration of the command execution in milliseconds.
     */
    durationMs: number | null;
} | {
    "type": "fileChange";
    id: string;
    changes: Array<FileUpdateChange>;
    status: PatchApplyStatus;
} | {
    "type": "mcpToolCall";
    id: string;
    server: string;
    tool: string;
    status: McpToolCallStatus;
    arguments: JsonValue;
    appContext: McpToolCallAppContext | null;
    /**
     * Deprecated: use `appContext.resourceUri` instead.
     */
    mcpAppResourceUri?: string;
    pluginId: string | null;
    result: McpToolCallResult | null;
    error: McpToolCallError | null;
    /**
     * The duration of the MCP tool call in milliseconds.
     */
    durationMs: number | null;
} | {
    "type": "dynamicToolCall";
    id: string;
    namespace: string | null;
    tool: string;
    arguments: JsonValue;
    status: DynamicToolCallStatus;
    contentItems: Array<DynamicToolCallOutputContentItem> | null;
    success: boolean | null;
    /**
     * The duration of the dynamic tool call in milliseconds.
     */
    durationMs: number | null;
} | {
    "type": "collabAgentToolCall";
    /**
     * Unique identifier for this collab tool call.
     */
    id: string;
    /**
     * Name of the collab tool that was invoked.
     */
    tool: CollabAgentTool;
    /**
     * Current status of the collab tool call.
     */
    status: CollabAgentToolCallStatus;
    /**
     * Thread ID of the agent issuing the collab request.
     */
    senderThreadId: string;
    /**
     * Thread ID of the receiving agent, when applicable. In case of spawn operation,
     * this corresponds to the newly spawned agent.
     */
    receiverThreadIds: Array<string>;
    /**
     * Prompt text sent as part of the collab tool call, when available.
     */
    prompt: string | null;
    /**
     * Model requested for the spawned agent, when applicable.
     */
    model: string | null;
    /**
     * Reasoning effort requested for the spawned agent, when applicable.
     */
    reasoningEffort: ReasoningEffort | null;
    /**
     * Last known status of the target agents, when available.
     */
    agentsStates: {
        [key in string]?: CollabAgentState;
    };
} | {
    "type": "subAgentActivity";
    id: string;
    kind: SubAgentActivityKind;
    agentThreadId: string;
    agentPath: string;
} | {
    "type": "webSearch";
    id: string;
    query: string;
    action: WebSearchAction | null;
} | {
    "type": "imageView";
    id: string;
    path: LegacyAppPathString;
} | {
    "type": "sleep";
    id: string;
    durationMs: number;
} | {
    "type": "imageGeneration";
    id: string;
    status: string;
    revisedPrompt: string | null;
    result: string;
    savedPath?: AbsolutePathBuf;
} | {
    "type": "enteredReviewMode";
    id: string;
    review: string;
} | {
    "type": "exitedReviewMode";
    id: string;
    review: string;
} | {
    "type": "contextCompaction";
    id: string;
};

type RemoteControlConnectionStatus = "disabled" | "connecting" | "connected" | "errored";

type GitInfo = {
    sha: string | null;
    branch: string | null;
    originUrl: string | null;
};

type SessionSource = "cli" | "vscode" | "exec" | "appServer" | {
    "custom": string;
} | {
    "subAgent": SubAgentSource;
} | "unknown";

/**
 * Extra app-server data for a thread.
 */
type ThreadExtra = Record<string, never>;

type ThreadActiveFlag = "waitingOnApproval" | "waitingOnUserInput";

type ThreadStatus = {
    "type": "notLoaded";
} | {
    "type": "idle";
} | {
    "type": "systemError";
} | {
    "type": "active";
    activeFlags: Array<ThreadActiveFlag>;
};

type TurnStatus = "completed" | "interrupted" | "failed" | "inProgress";

type Turn = {
    /**
     * Identifier for this turn. Codex-generated turn IDs are UUIDv7.
     */
    id: string;
    /**
     * Thread items currently included in this turn payload.
     */
    items: Array<ThreadItem>;
    /**
     * Describes how much of `items` has been loaded for this turn.
     */
    itemsView: TurnItemsView;
    status: TurnStatus;
    /**
     * Only populated when the Turn's status is failed.
     */
    error: TurnError | null;
    /**
     * Unix timestamp (in seconds) when the turn started.
     */
    startedAt: number | null;
    /**
     * Unix timestamp (in seconds) when the turn completed.
     */
    completedAt: number | null;
    /**
     * Duration between turn start and completion in milliseconds, if known.
     */
    durationMs: number | null;
};

type Thread = {
    /**
     * Identifier for this thread. Codex-generated thread IDs are UUIDv7.
     */
    id: string;
    /**
     * Optional implementation-specific thread data.
     */
    extra: ThreadExtra | null;
    /**
     * Session id shared by threads that belong to the same session tree.
     */
    sessionId: string;
    /**
     * Source thread id when this thread was created by forking another thread.
     */
    forkedFromId: string | null;
    /**
     * The ID of the parent thread. This will only be set if this thread is a subagent.
     */
    parentThreadId: string | null;
    /**
     * Usually the first user message in the thread, if available.
     */
    preview: string;
    /**
     * Whether the thread is ephemeral and should not be materialized on disk.
     */
    ephemeral: boolean;
    /**
     * Persisted thread history contract selected when this thread was created.
     */
    historyMode: ThreadHistoryMode;
    /**
     * Model provider used for this thread (for example, 'openai').
     */
    modelProvider: string;
    /**
     * Unix timestamp (in seconds) when the thread was created.
     */
    createdAt: number;
    /**
     * Unix timestamp (in seconds) when the thread was last updated.
     */
    updatedAt: number;
    /**
     * Unix timestamp (in seconds) used for thread recency ordering.
     */
    recencyAt: number | null;
    /**
     * Current runtime status for the thread.
     */
    status: ThreadStatus;
    /**
     * [UNSTABLE] Path to the thread on disk.
     */
    path: string | null;
    /**
     * Working directory captured for the thread.
     */
    cwd: AbsolutePathBuf;
    /**
     * Version of the CLI that created the thread.
     */
    cliVersion: string;
    /**
     * Origin of the thread (CLI, VSCode, codex exec, codex app-server, etc.).
     */
    source: SessionSource;
    /**
     * Optional analytics source classification for this thread.
     */
    threadSource: ThreadSource | null;
    /**
     * Optional random unique nickname assigned to an AgentControl-spawned sub-agent.
     */
    agentNickname: string | null;
    /**
     * Optional role (agent_role) assigned to an AgentControl-spawned sub-agent.
     */
    agentRole: string | null;
    /**
     * Optional Git metadata captured when the thread was created.
     */
    gitInfo: GitInfo | null;
    /**
     * Optional user-facing thread title.
     */
    name: string | null;
    /**
     * Only populated on `thread/resume`, `thread/rollback`, `thread/fork`, and `thread/read`
     * (when `includeTurns` is true) responses.
     * For all other responses and notifications returning a Thread,
     * the turns field will be an empty list.
     */
    turns: Array<Turn>;
};

/**
 * EXPERIMENTAL - collaboration mode preset metadata for clients.
 */
type CollaborationModeMask = {
    name: string;
    mode: ModeKind | null;
    model: string | null;
    reasoning_effort: ReasoningEffort | null | null;
};

/**
 * EXPERIMENTAL - collaboration mode presets response.
 */
type CollaborationModeListResponse = {
    data: Array<CollaborationModeMask>;
};

type EnvironmentAddResponse = Record<string, never>;

type MemoryResetResponse = Record<string, never>;

/**
 * Empty success response for `process/kill`.
 */
type ProcessKillResponse = Record<string, never>;

/**
 * Empty success response for `process/resizePty`.
 */
type ProcessResizePtyResponse = Record<string, never>;

/**
 * Successful response for `process/spawn`.
 */
type ProcessSpawnResponse = Record<string, never>;

/**
 * Empty success response for `process/writeStdin`.
 */
type ProcessWriteStdinResponse = Record<string, never>;

type RemoteControlClient = {
    clientId: string;
    displayName: string | null;
    deviceType: string | null;
    platform: string | null;
    osVersion: string | null;
    deviceModel: string | null;
    appVersion: string | null;
    lastSeenAt: bigint | null;
};

type RemoteControlClientsListResponse = {
    data: Array<RemoteControlClient>;
    nextCursor: string | null;
};

type RemoteControlClientsRevokeResponse = Record<string, never>;

type RemoteControlDisableResponse = {
    status: RemoteControlConnectionStatus;
    serverName: string;
    installationId: string;
    environmentId: string | null;
};

type RemoteControlEnableResponse = {
    status: RemoteControlConnectionStatus;
    serverName: string;
    installationId: string;
    environmentId: string | null;
};

type RemoteControlPairingStartResponse = {
    pairingCode: string;
    manualPairingCode: string | null;
    environmentId: string;
    expiresAt: bigint;
};

type RemoteControlPairingStatusResponse = {
    claimed: boolean;
};

type RemoteControlStatusReadResponse = {
    status: RemoteControlConnectionStatus;
    serverName: string;
    installationId: string;
    environmentId: string | null;
};

type ThreadBackgroundTerminal = {
    itemId: string;
    processId: string;
    command: string;
    cwd: AbsolutePathBuf;
    osPid: number | null;
    cpuPercent: number | null;
    rssKb: bigint | null;
};

type ThreadBackgroundTerminalsCleanResponse = Record<string, never>;

type ThreadBackgroundTerminalsListResponse = {
    data: Array<ThreadBackgroundTerminal>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * If None, there are no more items to return.
     */
    nextCursor: string | null;
};

type ThreadBackgroundTerminalsTerminateResponse = {
    terminated: boolean;
};

/**
 * Response for `thread/decrement_elicitation`.
 */
type ThreadDecrementElicitationResponse = {
    /**
     * Current out-of-band elicitation count after the decrement.
     */
    count: bigint;
    /**
     * Whether timeout accounting remains paused after applying the decrement.
     */
    paused: boolean;
};

/**
 * Response for `thread/increment_elicitation`.
 */
type ThreadIncrementElicitationResponse = {
    /**
     * Current out-of-band elicitation count after the increment.
     */
    count: bigint;
    /**
     * Whether timeout accounting is paused after applying the increment.
     */
    paused: boolean;
};

type ThreadItemsListResponse = {
    data: Array<ThreadItem>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * if None, there are no more items to return.
     */
    nextCursor: string | null;
    /**
     * Opaque cursor to pass as `cursor` when reversing `sortDirection`.
     * This is only populated when the page contains at least one item.
     */
    backwardsCursor: string | null;
};

type ThreadMemoryModeSetResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for appending realtime audio input.
 */
type ThreadRealtimeAppendAudioResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for appending realtime speech.
 */
type ThreadRealtimeAppendSpeechResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for appending realtime text input.
 */
type ThreadRealtimeAppendTextResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for listing supported realtime voices.
 */
type ThreadRealtimeListVoicesResponse = {
    voices: RealtimeVoicesList;
};

/**
 * EXPERIMENTAL - response for starting thread realtime.
 */
type ThreadRealtimeStartResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for stopping thread realtime.
 */
type ThreadRealtimeStopResponse = Record<string, never>;

type ThreadSearchResult = {
    thread: Thread;
    snippet: string;
};

type ThreadSearchResponse = {
    data: Array<ThreadSearchResult>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * if None, there are no more items to return.
     */
    nextCursor: string | null;
    /**
     * Opaque cursor to pass as `cursor` when reversing `sortDirection`.
     * This is only populated when the page contains at least one thread.
     * Use it with the opposite `sortDirection`; for timestamp sorts it anchors
     * at the start of the page timestamp so same-second updates are not skipped.
     */
    backwardsCursor: string | null;
};

type ThreadSettingsUpdateResponse = Record<string, never>;

type ThreadTurnsListResponse = {
    data: Array<Turn>;
    /**
     * Opaque cursor to pass to the next call to continue after the last turn.
     * if None, there are no more turns to return.
     */
    nextCursor: string | null;
    /**
     * Opaque cursor to pass as `cursor` when reversing `sortDirection`.
     * This is only populated when the page contains at least one turn.
     * Use it with the opposite `sortDirection` to include the anchor turn again
     * and catch updates to that turn.
     */
    backwardsCursor: string | null;
};

interface StableMethodResultMap {
    "account/login/cancel": CancelLoginAccountResponse;
    "account/login/start": LoginAccountResponse;
    "account/logout": LogoutAccountResponse;
    "account/rateLimits/read": GetAccountRateLimitsResponse;
    "account/usage/read": GetAccountTokenUsageResponse;
    "account/read": GetAccountResponse;
    "app/list": AppsListResponse;
    "hooks/list": HooksListResponse;
    "initialize": InitializeResponse;
    "model/list": ModelListResponse;
    "skills/config/write": SkillsConfigWriteResponse;
    "skills/list": SkillsListResponse;
    "thread/archive": ThreadArchiveResponse;
    "thread/compact/start": ThreadCompactStartResponse;
    "thread/fork": ThreadForkResponse;
    "thread/inject_items": ThreadInjectItemsResponse;
    "thread/list": ThreadListResponse;
    "thread/loaded/list": ThreadLoadedListResponse;
    "thread/metadata/update": ThreadMetadataUpdateResponse;
    "thread/name/set": ThreadSetNameResponse;
    "thread/read": ThreadReadResponse;
    "thread/resume": ThreadResumeResponse;
    "thread/rollback": ThreadRollbackResponse;
    "thread/start": ThreadStartResponse;
    "thread/unarchive": ThreadUnarchiveResponse;
    "thread/unsubscribe": ThreadUnsubscribeResponse;
    "turn/interrupt": TurnInterruptResponse;
    "turn/start": TurnStartResponse;
    "turn/steer": TurnSteerResponse;
}
interface ExperimentalMethodResultMap {
    "collaborationMode/list": CollaborationModeListResponse;
    "environment/add": EnvironmentAddResponse;
    "fuzzyFileSearch/sessionStart": FuzzyFileSearchSessionStartResponse;
    "fuzzyFileSearch/sessionStop": FuzzyFileSearchSessionStopResponse;
    "fuzzyFileSearch/sessionUpdate": FuzzyFileSearchSessionUpdateResponse;
    "memory/reset": MemoryResetResponse;
    "process/kill": ProcessKillResponse;
    "process/resizePty": ProcessResizePtyResponse;
    "process/spawn": ProcessSpawnResponse;
    "process/writeStdin": ProcessWriteStdinResponse;
    "remoteControl/disable": RemoteControlDisableResponse;
    "remoteControl/enable": RemoteControlEnableResponse;
    "remoteControl/client/list": RemoteControlClientsListResponse;
    "remoteControl/client/revoke": RemoteControlClientsRevokeResponse;
    "remoteControl/pairing/start": RemoteControlPairingStartResponse;
    "remoteControl/pairing/status": RemoteControlPairingStatusResponse;
    "remoteControl/status/read": RemoteControlStatusReadResponse;
    "thread/backgroundTerminals/clean": ThreadBackgroundTerminalsCleanResponse;
    "thread/backgroundTerminals/list": ThreadBackgroundTerminalsListResponse;
    "thread/backgroundTerminals/terminate": ThreadBackgroundTerminalsTerminateResponse;
    "thread/decrement_elicitation": ThreadDecrementElicitationResponse;
    "thread/increment_elicitation": ThreadIncrementElicitationResponse;
    "thread/items/list": ThreadItemsListResponse;
    "thread/memoryMode/set": ThreadMemoryModeSetResponse;
    "thread/realtime/appendAudio": ThreadRealtimeAppendAudioResponse;
    "thread/realtime/appendSpeech": ThreadRealtimeAppendSpeechResponse;
    "thread/realtime/appendText": ThreadRealtimeAppendTextResponse;
    "thread/realtime/listVoices": ThreadRealtimeListVoicesResponse;
    "thread/realtime/start": ThreadRealtimeStartResponse;
    "thread/realtime/stop": ThreadRealtimeStopResponse;
    "thread/search": ThreadSearchResponse;
    "thread/settings/update": ThreadSettingsUpdateResponse;
    "thread/turns/list": ThreadTurnsListResponse;
}
type AssertNever<T extends never> = T;
type StableMethodResultMapCoverage = AssertNever<Exclude<StableProductizedMethod, keyof StableMethodResultMap> | Exclude<keyof StableMethodResultMap, StableProductizedMethod>>;
type ExperimentalMethodResultMapCoverage = AssertNever<Exclude<ExperimentalAvailableMethod, keyof ExperimentalMethodResultMap> | Exclude<keyof ExperimentalMethodResultMap, ExperimentalAvailableMethod>>;
type CodexStableMethodResult<TMethod extends CodexStableMethod> = [
    StableMethodResultMapCoverage
] extends [never] ? TMethod extends keyof StableMethodResultMap ? StableMethodResultMap[TMethod] : unknown : never;
type CodexExperimentalMethodResult<TMethod extends CodexExperimentalMethod> = [
    ExperimentalMethodResultMapCoverage
] extends [never] ? TMethod extends keyof ExperimentalMethodResultMap ? ExperimentalMethodResultMap[TMethod] : unknown : never;

interface CodexClientsOptions {
    experimental?: boolean;
}
type CodexThreadForkOptions = Omit<ThreadForkParams, "threadId">;
type CodexThreadMetadataUpdateOptions = Omit<ThreadMetadataUpdateParams, "threadId">;
type CodexThreadResumeOptions = Omit<ThreadResumeParams, "threadId">;
type CodexTurnStartOptions = {
    input: string | UserInput$1[];
    threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">;
type CodexTurnSteerOptions = {
    input: string | UserInput$1[];
} & Omit<TurnSteerParams, "input">;
interface CodexConnectionClient {
    initialize(options: CodexInitializeOptions, requestOptions?: AgentRequestOptions): Promise<CodexStableMethodResult<"initialize">>;
    initialized(): void;
}
interface CodexAccountClient {
    cancelLogin(loginId: string): Promise<CodexStableMethodResult<"account/login/cancel">>;
    loginDeviceCode(): Promise<CodexStableMethodResult<"account/login/start">>;
    logout(): Promise<CodexStableMethodResult<"account/logout">>;
    read(refreshToken?: boolean): Promise<CodexStableMethodResult<"account/read">>;
    rateLimitsRead(): Promise<CodexStableMethodResult<"account/rateLimits/read">>;
    usageRead(): Promise<CodexStableMethodResult<"account/usage/read">>;
}
interface CodexAppsClient {
    list(params?: AppsListParams): Promise<CodexStableMethodResult<"app/list">>;
}
interface CodexHooksClient {
    list(params?: HooksListParams): Promise<CodexStableMethodResult<"hooks/list">>;
}
interface CodexSkillsClient {
    configWrite(params: SkillsConfigWriteParams): Promise<CodexStableMethodResult<"skills/config/write">>;
    list(params?: SkillsListParams): Promise<CodexStableMethodResult<"skills/list">>;
}
interface CodexThreadsClient {
    archive(threadId: string): Promise<CodexStableMethodResult<"thread/archive">>;
    compactStart(threadId: string): Promise<CodexStableMethodResult<"thread/compact/start">>;
    fork(threadId: string, params?: CodexThreadForkOptions): Promise<CodexStableMethodResult<"thread/fork">>;
    injectItems(threadId: string, items: ThreadInjectItemsParams["items"]): Promise<CodexStableMethodResult<"thread/inject_items">>;
    list(params?: ThreadListParams): Promise<CodexStableMethodResult<"thread/list">>;
    loadedList(params?: ThreadLoadedListParams): Promise<CodexStableMethodResult<"thread/loaded/list">>;
    metadataUpdate(threadId: string, params?: CodexThreadMetadataUpdateOptions): Promise<CodexStableMethodResult<"thread/metadata/update">>;
    read(threadId: string, includeTurns?: boolean): Promise<CodexStableMethodResult<"thread/read">>;
    resume(threadId: string, params?: CodexThreadResumeOptions): Promise<CodexStableMethodResult<"thread/resume">>;
    rollback(threadId: string, numTurns: number): Promise<CodexStableMethodResult<"thread/rollback">>;
    setName(threadId: string, name: string): Promise<CodexStableMethodResult<"thread/name/set">>;
    start(params?: ThreadStartParams): Promise<CodexStableMethodResult<"thread/start">>;
    unarchive(threadId: string): Promise<CodexStableMethodResult<"thread/unarchive">>;
    unsubscribe(threadId: string): Promise<CodexStableMethodResult<"thread/unsubscribe">>;
}
interface CodexTurnsClient {
    interrupt(threadId: string, turnId: string): Promise<CodexStableMethodResult<"turn/interrupt">>;
    start(params: CodexTurnStartOptions): Promise<CodexStableMethodResult<"turn/start">>;
    steer(params: CodexTurnSteerOptions): Promise<CodexStableMethodResult<"turn/steer">>;
}
interface CodexApprovalsClient {
    reject(requestId: RequestId, error: AgentError): Promise<void>;
    respond(requestId: RequestId, result: unknown): Promise<void>;
}
interface CodexModelsClient {
    list(params?: ModelListParams): Promise<CodexStableMethodResult<"model/list">>;
}
interface CodexClients {
    account: CodexAccountClient;
    apps: CodexAppsClient;
    approvals: CodexApprovalsClient;
    connection: CodexConnectionClient;
    hooks: CodexHooksClient;
    models: CodexModelsClient;
    requestExperimental<TMethod extends ExperimentalAvailableMethod>(method: TMethod, params: CodexExperimentalMethodParams<TMethod>): Promise<CodexExperimentalMethodResult<TMethod>>;
    requestRaw<TParams = unknown, TResult = unknown>(method: string, params?: TParams): Promise<TResult>;
    skills: CodexSkillsClient;
    threads: CodexThreadsClient;
    turns: CodexTurnsClient;
}
declare function createCodexClients(transport: AgentTransport, options?: CodexClientsOptions): CodexClients;

export { type CodexAccountClient, type CodexApprovalsClient, type CodexAppsClient, type CodexClients, type CodexClientsOptions, type CodexConnectionClient, type CodexHooksClient, type CodexModelsClient, type CodexSkillsClient, type CodexThreadForkOptions, type CodexThreadMetadataUpdateOptions, type CodexThreadResumeOptions, type CodexThreadsClient, type CodexTurnStartOptions, type CodexTurnSteerOptions, type CodexTurnsClient, createCodexClients };
