import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _nyosegawa_agent_ui_core from '@nyosegawa/agent-ui-core';
import { AgentEvent, AgentSessionState, AgentTransport, ThreadId, ExecutionModeId, RequestId, AgentApp, AgentModel, ReasoningEffort as ReasoningEffort$1, ThreadState, ThreadTokenUsage, PendingServerRequest, AgentItemState, TurnState, AgentThread, AgentItemBlock } from '@nyosegawa/agent-ui-core';
import * as React$1 from 'react';
import React__default, { PropsWithChildren } from 'react';

interface AgentContextValue {
    dispatch: (event: AgentEvent) => void;
    state: AgentSessionState;
    transport: AgentTransport;
}
interface AgentProviderProps extends PropsWithChildren {
    initialState?: AgentSessionState;
    transport: AgentTransport;
}
declare function AgentProvider({ children, initialState, transport }: AgentProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgentContext(): AgentContextValue;
declare function useAgentAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>): (...args: TArgs) => Promise<TResult>;

/**
 * A path that is guaranteed to be absolute and normalized (though it is not
 * guaranteed to be canonicalized or exist on the filesystem).
 *
 * IMPORTANT: When deserializing an `AbsolutePathBuf`, a base path must be set
 * using [AbsolutePathBufGuard::new]. If no base path is set, the
 * deserialization will fail unless the path being deserialized is already
 * absolute.
 */
type AbsolutePathBuf = string;

type JsonValue = number | string | boolean | Array<JsonValue> | {
    [key in string]?: JsonValue;
} | null;

/**
 * Configures who approval requests are routed to for review. Examples
 * include sandbox escapes, blocked network access, MCP approval prompts, and
 * ARC escalations. Defaults to `user`. `auto_review` uses a carefully
 * prompted subagent to gather relevant context and apply a risk-based
 * decision framework before approving or denying the request.
 */
type ApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";

/**
 * EXPERIMENTAL - list available apps/connectors.
 */
type AppsListParams = {
    /**
     * Opaque pagination cursor returned by a previous call.
     */
    cursor?: string | null;
    /**
     * Optional page size; defaults to a reasonable server-side value.
     */
    limit?: number | null;
    /**
     * Optional thread id used to evaluate app feature gating from that thread's config.
     */
    threadId?: string | null;
    /**
     * When true, bypass app caches and fetch the latest data from sources.
     */
    forceRefetch?: boolean;
};

type AskForApproval = "untrusted" | "on-failure" | "on-request" | {
    "granular": {
        sandbox_approval: boolean;
        rules: boolean;
        skill_approval: boolean;
        request_permissions: boolean;
        mcp_elicitations: boolean;
    };
} | "never";

type ByteRange = {
    start: number;
    end: number;
};

type CancelLoginAccountParams = {
    loginId: string;
};

/**
 * See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#get-started-with-reasoning
 */
type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

type NetworkAccess = "restricted" | "enabled";

type SandboxPolicy = {
    "type": "dangerFullAccess";
} | {
    "type": "readOnly";
    networkAccess: boolean;
} | {
    "type": "externalSandbox";
    networkAccess: NetworkAccess;
} | {
    "type": "workspaceWrite";
    writableRoots: Array<AbsolutePathBuf>;
    networkAccess: boolean;
    excludeTmpdirEnvVar: boolean;
    excludeSlashTmp: boolean;
};

/**
 * A summary of the reasoning performed by the model. This can be useful for
 * debugging and understanding the model's reasoning process.
 * See https://platform.openai.com/docs/guides/reasoning?api-mode=responses#reasoning-summaries
 */
type ReasoningSummary = "auto" | "concise" | "detailed" | "none";

type SandboxMode = "read-only" | "workspace-write" | "danger-full-access";

type GetAccountParams = {
    /**
     * When `true`, requests a proactive token refresh before returning.
     *
     * In managed auth mode this triggers the normal refresh-token flow. In
     * external auth mode this flag is ignored. Clients should refresh tokens
     * themselves and call `account/login/start` with `chatgptAuthTokens`.
     */
    refreshToken: boolean;
};

type HooksListParams = {
    /**
     * When empty, defaults to the current session working directory.
     */
    cwds?: Array<string>;
};

type TextElement = {
    /**
     * Byte range in the parent `text` buffer that this element occupies.
     */
    byteRange: ByteRange;
    /**
     * Optional human-readable placeholder for the element, displayed in the UI.
     */
    placeholder: string | null;
};

type UserInput = {
    "type": "text";
    text: string;
    /**
     * UI-defined spans within `text` used to render or persist special elements.
     */
    text_elements: Array<TextElement>;
} | {
    "type": "image";
    url: string;
} | {
    "type": "localImage";
    path: string;
} | {
    "type": "skill";
    name: string;
    path: string;
} | {
    "type": "mention";
    name: string;
    path: string;
};

type LoginAccountParams = {
    "type": "apiKey";
    apiKey: string;
} | {
    "type": "chatgpt";
    codexStreamlinedLogin?: boolean;
} | {
    "type": "chatgptDeviceCode";
} | {
    "type": "chatgptAuthTokens";
    /**
     * Access token (JWT) supplied by the client.
     * This token is used for backend API requests and email extraction.
     */
    accessToken: string;
    /**
     * Workspace/account identifier supplied by the client.
     */
    chatgptAccountId: string;
    /**
     * Optional plan type supplied by the client.
     *
     * When `null`, Codex attempts to derive the plan type from access-token
     * claims. If unavailable, the plan defaults to `unknown`.
     */
    chatgptPlanType?: string | null;
};

type ModelListParams = {
    /**
     * Opaque pagination cursor returned by a previous call.
     */
    cursor?: string | null;
    /**
     * Optional page size; defaults to a reasonable server-side value.
     */
    limit?: number | null;
    /**
     * When true, include models that are hidden from the default picker list.
     */
    includeHidden?: boolean | null;
};

type SkillsConfigWriteParams = {
    /**
     * Path-based selector.
     */
    path?: AbsolutePathBuf | null;
    /**
     * Name-based selector.
     */
    name?: string | null;
    enabled: boolean;
};

type SkillsListParams = {
    /**
     * When empty, defaults to the current session working directory.
     */
    cwds?: Array<string>;
    /**
     * When true, bypass the skills cache and re-scan skills from disk.
     */
    forceReload?: boolean;
};

type SortDirection = "asc" | "desc";

type ThreadSource = "user" | "subagent" | "memory_consolidation";

type ThreadArchiveParams = {
    threadId: string;
};

type ThreadCompactStartParams = {
    threadId: string;
};

/**
 * There are two ways to fork a thread:
 * 1. By thread_id: load the thread from disk by thread_id and fork it into a new thread.
 * 2. By path: load the thread from disk by path and fork it into a new thread.
 *
 * If using path, the thread_id param will be ignored.
 *
 * Prefer using thread_id whenever possible.
 */
type ThreadForkParams = {
    threadId: string; /**
     * Configuration overrides for the forked thread, if any.
     */
    model?: string | null;
    modelProvider?: string | null;
    serviceTier?: string | null | null;
    cwd?: string | null;
    approvalPolicy?: AskForApproval | null; /**
     * Override where approval requests are routed for review on this thread
     * and subsequent turns.
     */
    approvalsReviewer?: ApprovalsReviewer | null;
    sandbox?: SandboxMode | null;
    config?: {
        [key in string]?: JsonValue;
    } | null;
    baseInstructions?: string | null;
    developerInstructions?: string | null;
    ephemeral?: boolean; /**
     * Optional client-supplied analytics source classification for this forked thread.
     */
    threadSource?: ThreadSource | null;
};

type ThreadInjectItemsParams = {
    threadId: string;
    /**
     * Raw Responses API items to append to the thread's model-visible history.
     */
    items: Array<JsonValue>;
};

type ThreadSortKey = "created_at" | "updated_at";

type ThreadSourceKind = "cli" | "vscode" | "exec" | "appServer" | "subAgent" | "subAgentReview" | "subAgentCompact" | "subAgentThreadSpawn" | "subAgentOther" | "unknown";

type ThreadListParams = {
    /**
     * Opaque pagination cursor returned by a previous call.
     */
    cursor?: string | null;
    /**
     * Optional page size; defaults to a reasonable server-side value.
     */
    limit?: number | null;
    /**
     * Optional sort key; defaults to created_at.
     */
    sortKey?: ThreadSortKey | null;
    /**
     * Optional sort direction; defaults to descending (newest first).
     */
    sortDirection?: SortDirection | null;
    /**
     * Optional provider filter; when set, only sessions recorded under these
     * providers are returned. When present but empty, includes all providers.
     */
    modelProviders?: Array<string> | null;
    /**
     * Optional source filter; when set, only sessions from these source kinds
     * are returned. When omitted or empty, defaults to interactive sources.
     */
    sourceKinds?: Array<ThreadSourceKind> | null;
    /**
     * Optional archived filter; when set to true, only archived threads are returned.
     * If false or null, only non-archived threads are returned.
     */
    archived?: boolean | null;
    /**
     * Optional cwd filter or filters; when set, only threads whose session cwd
     * exactly matches one of these paths are returned.
     */
    cwd?: string | Array<string> | null;
    /**
     * If true, return from the state DB without scanning JSONL rollouts to
     * repair thread metadata. Omitted or false preserves scan-and-repair
     * behavior.
     */
    useStateDbOnly?: boolean;
    /**
     * Optional substring filter for the extracted thread title.
     */
    searchTerm?: string | null;
};

type ThreadLoadedListParams = {
    /**
     * Opaque pagination cursor returned by a previous call.
     */
    cursor?: string | null;
    /**
     * Optional page size; defaults to no limit.
     */
    limit?: number | null;
};

type ThreadMetadataGitInfoUpdateParams = {
    /**
     * Omit to leave the stored commit unchanged, set to `null` to clear it,
     * or provide a non-empty string to replace it.
     */
    sha?: string | null;
    /**
     * Omit to leave the stored branch unchanged, set to `null` to clear it,
     * or provide a non-empty string to replace it.
     */
    branch?: string | null;
    /**
     * Omit to leave the stored origin URL unchanged, set to `null` to clear it,
     * or provide a non-empty string to replace it.
     */
    originUrl?: string | null;
};

type ThreadMetadataUpdateParams = {
    threadId: string;
    /**
     * Patch the stored Git metadata for this thread.
     * Omit a field to leave it unchanged, set it to `null` to clear it, or
     * provide a string to replace the stored value.
     */
    gitInfo?: ThreadMetadataGitInfoUpdateParams | null;
};

type ThreadReadParams = {
    threadId: string;
    /**
     * When true, include turns and their items from rollout history.
     */
    includeTurns: boolean;
};

type Personality = "none" | "friendly" | "pragmatic";

/**
 * There are three ways to resume a thread:
 * 1. By thread_id: load the thread from disk by thread_id and resume it.
 * 2. By history: instantiate the thread from memory and resume it.
 * 3. By path: load the thread from disk by path and resume it.
 *
 * The precedence is: history > path > thread_id.
 * If using history or path, the thread_id param will be ignored.
 *
 * Prefer using thread_id whenever possible.
 */
type ThreadResumeParams = {
    threadId: string; /**
     * Configuration overrides for the resumed thread, if any.
     */
    model?: string | null;
    modelProvider?: string | null;
    serviceTier?: string | null | null;
    cwd?: string | null;
    approvalPolicy?: AskForApproval | null; /**
     * Override where approval requests are routed for review on this thread
     * and subsequent turns.
     */
    approvalsReviewer?: ApprovalsReviewer | null;
    sandbox?: SandboxMode | null;
    config?: {
        [key in string]?: JsonValue;
    } | null;
    baseInstructions?: string | null;
    developerInstructions?: string | null;
    personality?: Personality | null;
};

type ThreadRollbackParams = {
    threadId: string;
    /**
     * The number of turns to drop from the end of the thread. Must be >= 1.
     *
     * This only modifies the thread's history and does not revert local file changes
     * that have been made by the agent. Clients are responsible for reverting these changes.
     */
    numTurns: number;
};

type ThreadSetNameParams = {
    threadId: string;
    name: string;
};

type ThreadStartSource = "startup" | "clear";

type ThreadStartParams = {
    model?: string | null;
    modelProvider?: string | null;
    serviceTier?: string | null | null;
    cwd?: string | null;
    approvalPolicy?: AskForApproval | null; /**
     * Override where approval requests are routed for review on this thread
     * and subsequent turns.
     */
    approvalsReviewer?: ApprovalsReviewer | null;
    sandbox?: SandboxMode | null;
    config?: {
        [key in string]?: JsonValue;
    } | null;
    serviceName?: string | null;
    baseInstructions?: string | null;
    developerInstructions?: string | null;
    personality?: Personality | null;
    ephemeral?: boolean | null;
    sessionStartSource?: ThreadStartSource | null; /**
     * Optional client-supplied analytics source classification for this thread.
     */
    threadSource?: ThreadSource | null;
};

type ThreadUnarchiveParams = {
    threadId: string;
};

type ThreadUnsubscribeParams = {
    threadId: string;
};

type TurnInterruptParams = {
    threadId: string;
    turnId: string;
};

type TurnStartParams = {
    threadId: string;
    input: Array<UserInput>; /**
     * Override the working directory for this turn and subsequent turns.
     */
    cwd?: string | null; /**
     * Override the approval policy for this turn and subsequent turns.
     */
    approvalPolicy?: AskForApproval | null; /**
     * Override where approval requests are routed for review on this turn and
     * subsequent turns.
     */
    approvalsReviewer?: ApprovalsReviewer | null; /**
     * Override the sandbox policy for this turn and subsequent turns.
     */
    sandboxPolicy?: SandboxPolicy | null; /**
     * Override the model for this turn and subsequent turns.
     */
    model?: string | null; /**
     * Override the service tier for this turn and subsequent turns.
     */
    serviceTier?: string | null | null; /**
     * Override the reasoning effort for this turn and subsequent turns.
     */
    effort?: ReasoningEffort | null; /**
     * Override the reasoning summary for this turn and subsequent turns.
     */
    summary?: ReasoningSummary | null; /**
     * Override the personality for this turn and subsequent turns.
     */
    personality?: Personality | null; /**
     * Optional JSON Schema used to constrain the final assistant message for
     * this turn.
     */
    outputSchema?: JsonValue | null;
};

type TurnSteerParams = {
    threadId: string;
    input: Array<UserInput>; /**
     * Required active turn id precondition. The request fails when it does not
     * match the currently active turn.
     */
    expectedTurnId: string;
};

type CodexUserInput = UserInput;
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
    input: string | UserInput[];
    threadId: string;
} & Omit<TurnStartParams, "input" | "threadId">): TurnStartParams;
declare function turnSteerParams(options: {
    expectedTurnId: string;
    input: string | UserInput[];
    threadId: string;
}): TurnSteerParams;
declare function skillInput(name: string, path: string): UserInput;
declare function mentionInput(name: string, path: string): UserInput;
declare function localImageInput(path: string): UserInput;
declare function imageInput(url: string): UserInput;
declare function textInput(text: string): UserInput;
declare function agentBrowserSkillInput(path: string): UserInput;
declare function agentBrowserVerificationInput({ prompt, skillName, skillPath, }: AgentBrowserVerificationInputOptions): UserInput[];
declare function turnInterruptParams(threadId: string, turnId: string): TurnInterruptParams;
declare function skillsListParams(params?: SkillsListParams): SkillsListParams;
declare function skillsConfigWriteParams(params: SkillsConfigWriteParams): SkillsConfigWriteParams;
declare function hooksListParams(params?: HooksListParams): HooksListParams;
declare function appsListParams(params?: AppsListParams): AppsListParams;

interface QueuedFollowUp {
    attachments: QueuedFollowUpAttachment[];
    expectedTurnId?: string;
    id: string;
    input: CodexUserInput[];
    text: string;
    threadId: ThreadId;
}
interface QueuedFollowUpAttachment {
    extension?: string;
    id: string;
    input?: CodexUserInput | CodexUserInput[];
    kind: "image" | "file" | "app" | "plugin";
    label: string;
    previewUrl?: string;
    sizeLabel?: string;
    value: string;
}

interface AgentExecutionMode {
    id: ExecutionModeId;
    label: string;
    description: string;
    turnParams: Record<string, unknown>;
}
declare const AGENT_EXECUTION_MODES: AgentExecutionMode[];
declare function useAgentThread(threadId?: ThreadId): {
    resumeThread: (id: ThreadId, params?: Record<string, unknown>) => Promise<unknown>;
    startThread: (params?: Record<string, unknown>) => Promise<unknown>;
    startThreadWithInput: (input: string | CodexUserInput[], params?: Record<string, unknown>) => Promise<unknown>;
    thread: ThreadState | undefined;
    threadId: string | undefined;
    turns: (_nyosegawa_agent_ui_core.TurnState | undefined)[];
};
declare const useAgentThreadController: typeof useAgentThread;
declare function useAgentThreadActions(threadId?: ThreadId): {
    archiveThread: () => Promise<unknown>;
    compactThread: () => Promise<unknown>;
    forkThread: (params?: Omit<ThreadForkParams, "threadId">) => Promise<unknown>;
    renameThread: (name: string) => Promise<unknown>;
    rollbackThread: (numTurns?: number) => Promise<unknown>;
    threadId: string | undefined;
    unarchiveThread: () => Promise<unknown>;
};
declare function useAgentThreads(): {
    activeThreadId: string | undefined;
    setActiveThread: (threadId?: ThreadId) => void;
    threads: ThreadState[];
};
interface ThreadHistoryParams {
    cursor?: string | null;
    limit?: number;
    searchTerm?: string;
}
declare function useAgentThreadHistory(): {
    cursor: string | null | undefined;
    error: Error | undefined;
    isLoading: boolean;
    listThreads: (params?: ThreadHistoryParams) => Promise<Record<string, unknown>>;
    threads: ThreadState[];
};
declare function useAgentThreadReader(): {
    readThread: (threadId: ThreadId, options?: {
        activate?: boolean;
        includeTurns?: boolean;
    }) => Promise<unknown>;
};
declare function useAgentTurn(threadId?: ThreadId): {
    interruptTurn: (turnId: string) => Promise<unknown>;
    startTurn: (input: string | CodexUserInput[], params?: Record<string, unknown>) => Promise<unknown>;
    steerTurn: (expectedTurnId: string, input: string | CodexUserInput[]) => Promise<unknown>;
};
declare const useAgentTurnController: typeof useAgentTurn;
declare function useAgentApprovals(threadId?: ThreadId): {
    approvals: _nyosegawa_agent_ui_core.PendingServerRequest[];
    approve: (requestId: RequestId, result?: unknown) => Promise<void>;
    reject: (requestId: RequestId, message?: string) => Promise<void>;
};
declare function useAgentServerRequests(threadId?: ThreadId): {
    requests: (_nyosegawa_agent_ui_core.PendingServerRequest | undefined)[];
    approvals: _nyosegawa_agent_ui_core.PendingServerRequest[];
    approve: (requestId: RequestId, result?: unknown) => Promise<void>;
    reject: (requestId: RequestId, message?: string) => Promise<void>;
};
declare function useAgentComposer(threadId?: ThreadId): {
    activeTurnId: string | undefined;
    editQueuedFollowUp: (id: string) => QueuedFollowUp | undefined;
    error: string | undefined;
    followUpErrors: Record<string, string>;
    isInterrupting: boolean;
    isRunning: boolean;
    isSubmitting: boolean;
    queuedFollowUps: QueuedFollowUp[];
    removeQueuedFollowUp: (id: string) => void;
    sendQueuedFollowUp: (id: string) => Promise<void>;
    sendingFollowUpIds: string[];
    setError: React$1.Dispatch<React$1.SetStateAction<string | undefined>>;
    setValue: React$1.Dispatch<React$1.SetStateAction<string>>;
    steerNow: (items?: CodexUserInput[]) => Promise<void>;
    stop: () => Promise<void>;
    submit: (items?: CodexUserInput[], options?: {
        attachments?: QueuedFollowUpAttachment[];
    }) => Promise<string | undefined>;
    value: string;
};

type AgentComposerController = ReturnType<typeof useAgentComposer>;
declare function useAgentRunSettings(): {
    executionModes: AgentExecutionMode[];
    models: AgentModel[];
    runSettings: _nyosegawa_agent_ui_core.RunSettingsState;
    selectedModel: AgentModel | undefined;
    setCwd: (cwd: string) => void;
    setEffort: (effort: ReasoningEffort$1) => void;
    setExecutionMode: (executionMode: ExecutionModeId) => void;
    setModelId: (modelId: string) => void;
    supportedEfforts: string[];
};
declare function useAgentAuth(): {
    account: _nyosegawa_agent_ui_core.AccountState;
    cancelLogin: () => Promise<void>;
    login: () => Promise<{
        loginId: string | undefined;
        userCode: string | undefined;
        verificationUrl: string | undefined;
    }>;
    logout: () => Promise<unknown>;
    readAccount: () => Promise<unknown>;
};
interface AgentBootstrapState {
    errors: Error[];
    isBootstrapping: boolean;
    status: "idle" | "loading" | "ready" | "error";
}
declare function useAgentBootstrap(): AgentBootstrapState;
declare function useAgentUsage(): {
    rateLimits: unknown;
    refreshUsage: () => Promise<unknown>;
};
declare function useAgentSkills(cwd?: string): {
    refreshSkills: (params?: SkillsListParams) => Promise<{
        cwd: string;
        skills: {
            enabled: boolean | undefined;
            name: string;
            path: string | undefined;
            raw: any;
        }[];
    }[]>;
    setSkillEnabled: (params: SkillsConfigWriteParams) => Promise<unknown>;
    skills: _nyosegawa_agent_ui_core.AgentSkill[];
};
declare function useAgentHooks(cwd?: string): {
    hooks: _nyosegawa_agent_ui_core.AgentHook[];
    refreshHooks: (params?: HooksListParams) => Promise<{
        cwd: string;
        hooks: {
            enabled: boolean | undefined;
            id: string;
            name: string | undefined;
            raw: any;
        }[];
    }[]>;
};
declare function useAgentApps(threadId?: string): {
    apps: AgentApp[];
    loadMoreApps: () => Promise<{
        apps: AgentApp[];
        nextCursor: string | null;
    } | undefined>;
    nextCursor: string | null | undefined;
    refreshApps: (params?: AppsListParams) => Promise<{
        apps: AgentApp[];
        nextCursor: string | null;
    }>;
};
declare function useAgentModels(): {
    models: AgentModel[];
    refreshModels: () => Promise<AgentModel[]>;
};

type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";
type AgentLocalAttachmentKind = Extract<ComposerAttachmentKind, "image" | "file">;
type AgentLocalAttachmentResolver = (file: File, kind: AgentLocalAttachmentKind) => CodexUserInput | CodexUserInput[] | null | undefined | Promise<CodexUserInput | CodexUserInput[] | null | undefined>;
type AgentMentionAttachmentKind = Extract<ComposerAttachmentKind, "app" | "plugin">;
interface AgentComposerMentionAttachment {
    id?: string;
    input?: CodexUserInput;
    label: string;
    value: string;
}
type AgentComposerMentionResolver = () => AgentComposerMentionAttachment | null | undefined | Promise<AgentComposerMentionAttachment | null | undefined>;

declare function AgentComposer(props: AgentComposerProps): react_jsx_runtime.JSX.Element;
interface AgentComposerProps {
    disabled?: boolean;
    disabledReason?: string;
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    placeholder?: string;
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    tokenUsage?: ThreadTokenUsage;
    threadId?: string;
}
interface AgentComposerPanelProps {
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    thread: ThreadState;
    threadId?: string;
}
declare function AgentComposerPanel({ onRequestAppMention, onRequestPluginMention, resolveLocalAttachment, thread, threadId, }: AgentComposerPanelProps): react_jsx_runtime.JSX.Element;

interface AgentRunControlsProps {
    autoRefresh?: boolean;
    /**
     * "compact" renders an inline, dense form intended to sit inside another
     * surface. "panel" renders the full-width labeled settings form used by the
     * empty-state and fixture gallery close-up.
     */
    variant?: "compact" | "panel";
}
declare function AgentRunControls({ autoRefresh, variant, }?: AgentRunControlsProps): react_jsx_runtime.JSX.Element;
interface AgentRunSettingsPanelProps {
    autoRefresh?: boolean;
}
declare function AgentRunSettingsPanel({ autoRefresh, }?: AgentRunSettingsPanelProps): react_jsx_runtime.JSX.Element;
type AgentWorkingDirectoryResolver = () => Promise<string | null | undefined> | string | null | undefined;
/**
 * Compact working-directory selector for the start screen. cwd is a
 * thread-start setting, so it sits beneath the starter composer as a context
 * pill rather than inside the composer toolbar.
 */
declare function AgentStarterCwd({ onRequestWorkingDirectory, }: {
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
}): react_jsx_runtime.JSX.Element;
/**
 * Mode / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here; cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
declare function ComposerRunSettings(): react_jsx_runtime.JSX.Element;

interface AgentChatSlots {
    renderApproval?: (approval: PendingServerRequest) => React__default.ReactNode;
    renderItem?: (item: AgentItemState, turn: TurnState) => React__default.ReactNode;
}
interface AgentChatProps {
    className?: string;
    diagnostics?: boolean;
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    sidebar?: boolean;
    slots?: AgentChatSlots;
    threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
    usage?: boolean;
}
interface AgentThreadUrlRoutingOptions {
    basePath?: string;
}
declare function AgentChat({ className, diagnostics, onRequestAppMention, onRequestWorkingDirectory, onRequestPluginMention, resolveLocalAttachment, sidebar, slots, threadUrlRouting, usage, }?: AgentChatProps): react_jsx_runtime.JSX.Element;
interface AgentShellProps extends React__default.HTMLAttributes<HTMLElement> {
    sidebar?: React__default.ReactNode;
}
declare function AgentShell({ children, className, sidebar, ...props }: AgentShellProps): react_jsx_runtime.JSX.Element;

interface AgentThreadViewProps {
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    renderApproval?: (approval: PendingServerRequest) => React__default.ReactNode;
    renderItem?: (item: AgentItemState, turn: TurnState) => React__default.ReactNode;
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    threadId?: string;
}
declare function AgentThreadView({ onRequestAppMention, onRequestPluginMention, renderApproval, renderItem, resolveLocalAttachment, threadId, }: AgentThreadViewProps): react_jsx_runtime.JSX.Element | null;
declare function AgentThreadSurface({ children, className, }: {
    children: React__default.ReactNode;
    className?: string;
}): react_jsx_runtime.JSX.Element;
declare function AgentThreadHeader({ thread, threadId, }: {
    thread: ThreadState;
    threadId?: string;
}): react_jsx_runtime.JSX.Element;
/**
 * Renders the thread transcript. When a `threadId` is supplied, pending
 * approvals with upstream item or turn metadata are anchored immediately after
 * that transcript context. Metadata-free approvals fall back to the transcript
 * tail so they stay in the scroll area, not a separate pane above the composer.
 */
declare function AgentThreadTimeline({ renderApproval, renderItem, thread, threadId, }: {
    renderApproval?: (approval: PendingServerRequest) => React__default.ReactNode;
    renderItem?: (item: AgentItemState, turn: TurnState) => React__default.ReactNode;
    thread: ThreadState;
    threadId?: string;
}): react_jsx_runtime.JSX.Element;

declare function AgentFirstRun({ onRequestWorkingDirectory, onStartThread, }: {
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
    onStartThread: (prompt?: string) => Promise<void> | void;
}): react_jsx_runtime.JSX.Element;

declare function AgentContextUsageIndicator({ tokenUsage, }: {
    tokenUsage?: ThreadTokenUsage;
}): react_jsx_runtime.JSX.Element | null;

declare function AgentApprovalQueue({ approvals: approvalsProp, renderApproval, threadId, }: {
    approvals?: PendingServerRequest[];
    renderApproval?: (approval: PendingServerRequest) => React__default.ReactNode;
    threadId?: string;
}): react_jsx_runtime.JSX.Element | null;

declare function AgentStatusBar({ onOpenThreads, }?: {
    onOpenThreads?: () => void;
}): react_jsx_runtime.JSX.Element;
declare function AgentDiagnosticsPanel({ bootstrap, }: {
    bootstrap: ReturnType<typeof useAgentBootstrap>;
}): react_jsx_runtime.JSX.Element | null;
type AgentStatusSeverity = "info" | "warning" | "critical";
interface AgentStatusNotice {
    id: string;
    kind: string;
    message: string;
    severity: AgentStatusSeverity;
    title: string;
}
declare function AgentStatusSummary(): react_jsx_runtime.JSX.Element | null;
declare function AgentStatusDetails({ includeCritical }: {
    includeCritical?: boolean;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentCriticalNoticeList(): react_jsx_runtime.JSX.Element | null;
declare function normalizedStatusNotices(banners: Array<{
    id: string;
    kind: string;
    message: string;
}>): AgentStatusNotice[];
declare function statusSummary(total: number, warningCount: number, criticalCount: number): string;
interface AgentUsageProps {
    autoRefresh?: boolean;
}
declare function AgentUsagePanel({ autoRefresh }?: AgentUsageProps): react_jsx_runtime.JSX.Element;
declare function AgentUsageSummary(): react_jsx_runtime.JSX.Element;
declare function AgentRateLimitBar({ label, percent, }: {
    label: string;
    percent: number;
}): react_jsx_runtime.JSX.Element;
declare function AgentTokenUsageBar({ inputTokens, outputTokens, totalTokens, }: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
}): react_jsx_runtime.JSX.Element;
declare function AgentSkillsPanel({ cwd }: {
    cwd?: string;
}): react_jsx_runtime.JSX.Element;
declare function AgentAppsPanel({ threadId }: {
    threadId?: string;
}): react_jsx_runtime.JSX.Element;

declare function ThreadList({ activeThreadId, footer, onSelectThread, threads, }: {
    activeThreadId?: string;
    footer?: React.ReactNode;
    onSelectThread?: (threadId: string) => void;
    threads: ThreadState[];
}): react_jsx_runtime.JSX.Element;
declare function formatThreadStatus(status: string, options?: {
    hasTurns?: boolean;
}): string;
declare function threadSubtitle(thread: AgentThread): string;
declare function isUserFacingPath(path: string): boolean;
declare function AgentThreadSidebar({ activeThreadId, collapsed, onCollapsedChange, onSelectThread, threads, }: {
    activeThreadId?: string;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    onSelectThread?: (threadId: string) => void;
    threads: ThreadState[];
}): react_jsx_runtime.JSX.Element | null;

interface AgentWorkspaceProps extends AgentChatProps {
    panel?: React__default.ReactNode;
    panelClassName?: string;
}
declare function AgentWorkspace({ panel, panelClassName, ...chatProps }: AgentWorkspaceProps): react_jsx_runtime.JSX.Element;

declare function AgentDiffViewer({ patch }: {
    patch: unknown;
}): react_jsx_runtime.JSX.Element;

declare function AgentMessageList({ footer, approvalAnchors, renderItem, scrollKey, thread, }: {
    /**
     * Trailing transcript content rendered as the final scroll-area item.
     * The default thread view uses it to keep the pending-approval surface
     * inside the transcript instead of in a separate scroll pane.
     */
    footer?: React__default.ReactNode;
    approvalAnchors?: TranscriptApprovalAnchors;
    renderItem?: (item: AgentItemState, turn: TurnState) => React__default.ReactNode;
    /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
    scrollKey?: string | number;
    thread: ThreadState;
}): react_jsx_runtime.JSX.Element;
declare const AgentTranscript: typeof AgentMessageList;
declare function AgentTurn({ approvals, renderItem, threadStatus, turn, visibleItemIds, }: {
    approvals?: ApprovalAnchors;
    renderItem?: (item: AgentItemState, turn: TurnState) => React__default.ReactNode;
    threadStatus: ThreadState["status"];
    turn: TurnState;
    visibleItemIds?: string[];
}): react_jsx_runtime.JSX.Element;
interface ApprovalAnchors {
    afterTurn: PendingServerRequest[];
    byItemId: Record<string, PendingServerRequest[]>;
    renderApprovalAnchor: (approval: PendingServerRequest) => React__default.ReactNode;
}
interface TranscriptApprovalAnchors {
    requests: PendingServerRequest[];
    renderApprovalAnchor: (approval: PendingServerRequest) => React__default.ReactNode;
}
declare function AgentContentBlockView({ block, output, patch, }: {
    block: AgentItemBlock;
    output?: string;
    patch?: unknown;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentCommandItem({ block, item, itemId, output, }: {
    block?: AgentItemBlock;
    item?: AgentItemState;
    itemId?: string;
    output?: string;
}): react_jsx_runtime.JSX.Element;
declare function AgentFileChangeItem({ block, item, patch, }: {
    block?: AgentItemBlock;
    item?: AgentItemState;
    patch?: unknown;
}): react_jsx_runtime.JSX.Element;
declare function AgentReasoningItem({ block }: {
    block: AgentItemBlock;
}): react_jsx_runtime.JSX.Element;
declare function AgentToolCallItem({ block }: {
    block: AgentItemBlock;
}): react_jsx_runtime.JSX.Element;
declare function AgentMessageItem({ text }: {
    text: string;
}): react_jsx_runtime.JSX.Element;
declare const AgentCommandOutputItem: typeof AgentCommandItem;
declare const AgentDiffItem: typeof AgentFileChangeItem;

declare const DEFAULT_TRANSCRIPT_ITEM_LIMIT = 48;
declare const TRANSCRIPT_ITEM_INCREMENT = 48;
declare function transcriptItemIds(turn: TurnState): string[];
declare function visibleTranscriptWindow(thread: ThreadState, visibleItemLimit: number): {
    itemIdsByTurnId: Map<string, string[]>;
    totalItemCount: number;
    visibleItemCount: number;
};

declare function threadUpsertEvent(rawThread: Record<string, unknown>): AgentEvent;
declare function threadSnapshotEvents(rawThread: Record<string, unknown>, activate: boolean): AgentEvent[];
declare function rawThreadId(rawThread: Record<string, unknown>): string | undefined;
declare function threadProjectPath(rawThread: Record<string, unknown>): string | undefined;

interface UsageWindow {
    id: string;
    label: string;
    percent: number;
    resetLabel?: string;
    valueLabel: string;
}
declare function normalizeUsageWindows(rateLimits: unknown): UsageWindow[];

export { AGENT_EXECUTION_MODES, AgentApprovalQueue, AgentAppsPanel, type AgentBootstrapState, AgentChat, type AgentChatProps, type AgentChatSlots, AgentCommandItem, AgentCommandOutputItem, AgentComposer, type AgentComposerController, type AgentComposerMentionAttachment, type AgentComposerMentionResolver, AgentComposerPanel, type AgentComposerPanelProps, type AgentComposerProps, AgentContentBlockView, AgentContextUsageIndicator, type AgentContextValue, AgentCriticalNoticeList, AgentDiagnosticsPanel, AgentDiffItem, AgentDiffViewer, type AgentExecutionMode, AgentFileChangeItem, AgentFirstRun, type AgentLocalAttachmentKind, type AgentLocalAttachmentResolver, type AgentMentionAttachmentKind, AgentMessageItem, AgentMessageList, AgentProvider, type AgentProviderProps, AgentRateLimitBar, AgentReasoningItem, AgentRunControls, type AgentRunControlsProps, AgentRunSettingsPanel, type AgentRunSettingsPanelProps, AgentShell, type AgentShellProps, AgentSkillsPanel, AgentStarterCwd, AgentStatusBar, AgentStatusDetails, AgentStatusSummary, AgentThreadHeader, AgentThreadSidebar, AgentThreadSurface, AgentThreadTimeline, type AgentThreadUrlRoutingOptions, AgentThreadView, type AgentThreadViewProps, AgentTokenUsageBar, AgentToolCallItem, AgentTranscript, AgentTurn, AgentUsagePanel, type AgentUsageProps, AgentUsageSummary, type AgentWorkingDirectoryResolver, AgentWorkspace, type AgentWorkspaceProps, type AppsListParams, type CancelLoginAccountParams, type CodexUserInput, ComposerRunSettings, DEFAULT_TRANSCRIPT_ITEM_LIMIT, type GetAccountParams, type HooksListParams, type LoginAccountParams, type ModelListParams, type QueuedFollowUp, type QueuedFollowUpAttachment, type SkillsConfigWriteParams, type SkillsListParams, TRANSCRIPT_ITEM_INCREMENT, type ThreadArchiveParams, type ThreadCompactStartParams, type ThreadForkParams, type ThreadHistoryParams, type ThreadInjectItemsParams, ThreadList, type ThreadListParams, type ThreadLoadedListParams, type ThreadMetadataUpdateParams, type ThreadReadParams, type ThreadResumeParams, type ThreadRollbackParams, type ThreadSetNameParams, type ThreadStartParams, type ThreadUnarchiveParams, type ThreadUnsubscribeParams, type TranscriptApprovalAnchors, type TurnInterruptParams, type TurnStartParams, type TurnSteerParams, type UsageWindow, accountReadParams, agentBrowserSkillInput, agentBrowserVerificationInput, apiKeyLoginParams, appsListParams, authTokensLoginParams, cancelLoginParams, chatgptLoginParams, deviceCodeLoginParams, disabledProductMethods, formatThreadStatus, hooksListParams, imageInput, isUserFacingPath, localImageInput, mentionInput, modelListParams, normalizeUsageWindows, normalizedStatusNotices, rawThreadId, skillInput, skillsConfigWriteParams, skillsListParams, statusSummary, textInput, threadArchiveParams, threadCompactStartParams, threadForkParams, threadInjectItemsParams, threadListParams, threadLoadedListParams, threadMetadataUpdateParams, threadProjectPath, threadReadParams, threadResumeParams, threadRollbackParams, threadSetNameParams, threadSnapshotEvents, threadStartParams, threadSubtitle, threadUnarchiveParams, threadUnsubscribeParams, threadUpsertEvent, transcriptItemIds, turnInterruptParams, turnStartParams, turnSteerParams, useAgentAction, useAgentApprovals, useAgentApps, useAgentAuth, useAgentBootstrap, useAgentComposer, useAgentContext, useAgentHooks, useAgentModels, useAgentRunSettings, useAgentServerRequests, useAgentSkills, useAgentThread, useAgentThreadActions, useAgentThreadController, useAgentThreadHistory, useAgentThreadReader, useAgentThreads, useAgentTurn, useAgentTurnController, useAgentUsage, visibleTranscriptWindow };
