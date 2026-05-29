import { T as ThreadId, R as RealtimeVoice, A as AbsolutePathBuf, J as JsonValue, d as UserInput, M as MessagePhase, e as ReasoningEffort, f as TurnItemsView, g as ThreadSource, h as ModeKind, b as CodexStableMethod, i as CancelLoginAccountResponse, L as LoginAccountResponse, j as LogoutAccountResponse, G as GetAccountRateLimitsResponse, k as GetAccountResponse, l as AppsListResponse, H as HooksListResponse, I as InitializeResponse, m as ModelListResponse, S as SkillsConfigWriteResponse, n as SkillsListResponse, o as ThreadArchiveResponse, p as ThreadCompactStartResponse, q as ThreadForkResponse, r as ThreadInjectItemsResponse, s as ThreadListResponse, t as ThreadLoadedListResponse, u as ThreadMetadataUpdateResponse, v as ThreadSetNameResponse, w as ThreadReadResponse, x as ThreadResumeResponse, y as ThreadRollbackResponse, z as ThreadStartResponse, B as ThreadUnarchiveResponse, D as ThreadUnsubscribeResponse, E as TurnInterruptResponse, F as TurnStartResponse, K as TurnSteerResponse, a as CodexExperimentalMethod, c as CodexStableMethodParams, U as UserInput$1 } from './method-params-Cp7iY5rD.js';
export { C as CodexExperimentalMethodParams } from './method-params-Cp7iY5rD.js';
import './InitializeParams-CDX1c2T9.js';

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
type CodexErrorInfo = "contextWindowExceeded" | "usageLimitExceeded" | "serverOverloaded" | "cyberPolicy" | {
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
    cwd: AbsolutePathBuf;
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
    "type": "webSearch";
    id: string;
    query: string;
    action: WebSearchAction | null;
} | {
    "type": "imageView";
    id: string;
    path: AbsolutePathBuf;
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
    id: string;
    /**
     * Session id shared by threads that belong to the same session tree.
     */
    sessionId: string;
    /**
     * Source thread id when this thread was created by forking another thread.
     */
    forkedFromId: string | null;
    /**
     * Usually the first user message in the thread, if available.
     */
    preview: string;
    /**
     * Whether the thread is ephemeral and should not be materialized on disk.
     */
    ephemeral: boolean;
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

type RemoteControlStatusReadResponse = {
    status: RemoteControlConnectionStatus;
    serverName: string;
    installationId: string;
    environmentId: string | null;
};

type ThreadBackgroundTerminalsCleanResponse = Record<string, never>;

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

type ThreadMemoryModeSetResponse = Record<string, never>;

/**
 * EXPERIMENTAL - response for appending realtime audio input.
 */
type ThreadRealtimeAppendAudioResponse = Record<string, never>;

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
    "remoteControl/status/read": RemoteControlStatusReadResponse;
    "thread/backgroundTerminals/clean": ThreadBackgroundTerminalsCleanResponse;
    "thread/decrement_elicitation": ThreadDecrementElicitationResponse;
    "thread/increment_elicitation": ThreadIncrementElicitationResponse;
    "thread/memoryMode/set": ThreadMemoryModeSetResponse;
    "thread/realtime/appendAudio": ThreadRealtimeAppendAudioResponse;
    "thread/realtime/appendText": ThreadRealtimeAppendTextResponse;
    "thread/realtime/listVoices": ThreadRealtimeListVoicesResponse;
    "thread/realtime/start": ThreadRealtimeStartResponse;
    "thread/realtime/stop": ThreadRealtimeStopResponse;
    "thread/search": ThreadSearchResponse;
    "thread/settings/update": ThreadSettingsUpdateResponse;
    "thread/turns/list": ThreadTurnsListResponse;
}
type CodexStableMethodResult<TMethod extends CodexStableMethod> = TMethod extends keyof StableMethodResultMap ? StableMethodResultMap[TMethod] : unknown;
type CodexExperimentalMethodResult<TMethod extends CodexExperimentalMethod> = TMethod extends keyof ExperimentalMethodResultMap ? ExperimentalMethodResultMap[TMethod] : unknown;

type AppsListParams = CodexStableMethodParams<"app/list">;
type CancelLoginAccountParams = CodexStableMethodParams<"account/login/cancel">;
type GetAccountParams = CodexStableMethodParams<"account/read">;
type HooksListParams = CodexStableMethodParams<"hooks/list">;
type LoginAccountParams = CodexStableMethodParams<"account/login/start">;
type ModelListParams = CodexStableMethodParams<"model/list">;
type SkillsConfigWriteParams = CodexStableMethodParams<"skills/config/write">;
type SkillsListParams = CodexStableMethodParams<"skills/list">;
type ThreadArchiveParams = CodexStableMethodParams<"thread/archive">;
type ThreadCompactStartParams = CodexStableMethodParams<"thread/compact/start">;
type ThreadForkParams = CodexStableMethodParams<"thread/fork">;
type ThreadInjectItemsParams = CodexStableMethodParams<"thread/inject_items">;
type ThreadListParams = CodexStableMethodParams<"thread/list">;
type ThreadLoadedListParams = CodexStableMethodParams<"thread/loaded/list">;
type ThreadMetadataUpdateParams = CodexStableMethodParams<"thread/metadata/update">;
type ThreadReadParams = CodexStableMethodParams<"thread/read">;
type ThreadResumeParams = CodexStableMethodParams<"thread/resume">;
type ThreadRollbackParams = CodexStableMethodParams<"thread/rollback">;
type ThreadSetNameParams = CodexStableMethodParams<"thread/name/set">;
type ThreadStartParams = CodexStableMethodParams<"thread/start">;
type ThreadUnarchiveParams = CodexStableMethodParams<"thread/unarchive">;
type ThreadUnsubscribeParams = CodexStableMethodParams<"thread/unsubscribe">;
type TurnInterruptParams = CodexStableMethodParams<"turn/interrupt">;
type TurnStartParams = CodexStableMethodParams<"turn/start">;
type TurnSteerParams = CodexStableMethodParams<"turn/steer">;
type CodexUserInput = UserInput$1;
interface AgentBrowserVerificationInputOptions {
    prompt: string;
    skillPath: string;
    skillName?: string;
}
declare const disabledProductMethods: readonly ["thread/turns/items/list"];
declare function accountReadParams(refreshToken?: boolean): GetAccountParams;
declare function deviceCodeLoginParams(): LoginAccountParams;
declare function chatgptLoginParams(codexStreamlinedLogin?: boolean): LoginAccountParams;
declare function apiKeyLoginParams(apiKey: string): LoginAccountParams;
declare function authTokensLoginParams(params: {
    accessToken: string;
    chatgptAccountId: string;
    chatgptPlanType?: string | null;
}): LoginAccountParams;
declare function cancelLoginParams(loginId: string): CancelLoginAccountParams;
declare function modelListParams(params?: ModelListParams): ModelListParams;
declare function threadListParams(params?: ThreadListParams): ThreadListParams;
declare function threadLoadedListParams(params?: ThreadLoadedListParams): ThreadLoadedListParams;
declare function threadReadParams(threadId: string, includeTurns?: boolean): ThreadReadParams;
declare function threadResumeParams(threadId: string, params?: Omit<ThreadResumeParams, "threadId">): ThreadResumeParams;
declare function threadStartParams(options?: ThreadStartParams): ThreadStartParams;
declare function threadForkParams(threadId: string, params?: Omit<ThreadForkParams, "threadId">): ThreadForkParams;
declare function threadArchiveParams(threadId: string): ThreadArchiveParams;
declare function threadUnarchiveParams(threadId: string): ThreadUnarchiveParams;
declare function threadSetNameParams(threadId: string, name: string): ThreadSetNameParams;
declare function threadMetadataUpdateParams(threadId: string, params?: Omit<ThreadMetadataUpdateParams, "threadId">): ThreadMetadataUpdateParams;
declare function threadCompactStartParams(threadId: string): ThreadCompactStartParams;
declare function threadRollbackParams(threadId: string, numTurns: number): ThreadRollbackParams;
declare function threadInjectItemsParams(threadId: string, items: ThreadInjectItemsParams["items"]): ThreadInjectItemsParams;
declare function threadUnsubscribeParams(threadId: string): ThreadUnsubscribeParams;
declare function turnStartParams(options: {
    input: string | UserInput$1[];
    threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">): TurnStartParams;
declare function turnSteerParams(options: {
    expectedTurnId: string;
    input: string | UserInput$1[];
    threadId: string;
}): TurnSteerParams;
declare function skillInput(name: string, path: string): UserInput$1;
declare function mentionInput(name: string, path: string): UserInput$1;
declare function localImageInput(path: string): UserInput$1;
declare function imageInput(url: string): UserInput$1;
declare function textInput(text: string): UserInput$1;
declare function agentBrowserSkillInput(path: string): UserInput$1;
declare function agentBrowserVerificationInput({ prompt, skillName, skillPath, }: AgentBrowserVerificationInputOptions): UserInput$1[];
declare function turnInterruptParams(threadId: string, turnId: string): TurnInterruptParams;
declare function skillsListParams(params?: SkillsListParams): SkillsListParams;
declare function skillsConfigWriteParams(params: SkillsConfigWriteParams): SkillsConfigWriteParams;
declare function hooksListParams(params?: HooksListParams): HooksListParams;
declare function appsListParams(params?: AppsListParams): AppsListParams;

export { type AgentBrowserVerificationInputOptions, type AppsListParams, type CancelLoginAccountParams, CodexExperimentalMethod, type CodexExperimentalMethodResult, CodexStableMethod, CodexStableMethodParams, type CodexStableMethodResult, type CodexUserInput, type GetAccountParams, type HooksListParams, type LoginAccountParams, type ModelListParams, type SkillsConfigWriteParams, type SkillsListParams, type ThreadArchiveParams, type ThreadCompactStartParams, type ThreadForkParams, type ThreadInjectItemsParams, type ThreadListParams, type ThreadLoadedListParams, type ThreadMetadataUpdateParams, type ThreadReadParams, type ThreadResumeParams, type ThreadRollbackParams, type ThreadSetNameParams, type ThreadStartParams, type ThreadUnarchiveParams, type ThreadUnsubscribeParams, type TurnInterruptParams, type TurnStartParams, type TurnSteerParams, UserInput$1 as UserInput, accountReadParams, agentBrowserSkillInput, agentBrowserVerificationInput, apiKeyLoginParams, appsListParams, authTokensLoginParams, cancelLoginParams, chatgptLoginParams, deviceCodeLoginParams, disabledProductMethods, hooksListParams, imageInput, localImageInput, mentionInput, modelListParams, skillInput, skillsConfigWriteParams, skillsListParams, textInput, threadArchiveParams, threadCompactStartParams, threadForkParams, threadInjectItemsParams, threadListParams, threadLoadedListParams, threadMetadataUpdateParams, threadReadParams, threadResumeParams, threadRollbackParams, threadSetNameParams, threadStartParams, threadUnarchiveParams, threadUnsubscribeParams, turnInterruptParams, turnStartParams, turnSteerParams };
