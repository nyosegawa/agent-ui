import { N as ThreadId, O as SubAgentSource, P as MessagePhase, Q as RateLimitSnapshot, V as PlanType, W as AppInfo, X as TurnError, Y as ExternalAgentConfigMigrationItemType, Z as FileUpdateChange, _ as AbsolutePathBuf, $ as HookEventName, a0 as HookHandlerType, a1 as HookSource, a2 as ThreadItem, a3 as LegacyAppPathString, a4 as RequestId, a5 as ThreadGoalStatus, a6 as SandboxPolicy, a7 as Thread, a8 as ThreadStatus, a9 as Turn, aa as WindowsSandboxSetupMode, ab as CommandAction, ac as DynamicToolCallOutputContentItem, ad as ExternalAgentConfigMigrationItem, ae as PluginSharePrincipalType, af as PluginShareDiscoverability, ag as SkillInterface, ah as TurnItemsView, ai as Account, aj as AccountTokenUsageDailyBucket, ak as AccountTokenUsageSummary, al as AddCreditsNudgeCreditType, am as AppBranding, an as AppMetadata, ao as AppReview, ap as AppScreenshot, aq as AppsListParams$1, j as AppsListResponse, ar as CancelLoginAccountParams, e as CancelLoginAccountResponse, as as CancelLoginAccountStatus, at as CodexErrorInfo, au as CollabAgentState, av as CollabAgentStatus, aw as CollabAgentTool, ax as CollabAgentToolCallStatus, ay as CommandExecParams, az as CommandExecResizeParams, aA as CommandExecTerminalSize, aB as CommandExecTerminateParams, aC as CommandExecWriteParams, aD as CommandExecutionSource, aE as CommandExecutionStatus, aF as CommandMigration, aG as ConfigBatchWriteParams, aH as ConfigEdit, aI as ConfigReadParams, aJ as ConfigValueWriteParams, aK as ConsumeAccountRateLimitResetCreditParams, aL as CreditsSnapshot, aM as DynamicToolCallStatus, aN as ExperimentalFeatureEnablementSetParams, aO as ExperimentalFeatureListParams, aP as ExternalAgentConfigDetectParams, aQ as ExternalAgentConfigImportParams, aR as FeedbackUploadParams, aS as FsCopyParams, aT as FsCreateDirectoryParams, aU as FsGetMetadataParams, aV as FsReadDirectoryParams, aW as FsReadFileParams, aX as FsRemoveParams, aY as FsUnwatchParams, aZ as FsWatchParams, a_ as FsWriteFileParams, a$ as GetAccountParams, G as GetAccountRateLimitsResponse, i as GetAccountResponse, h as GetAccountTokenUsageResponse, b0 as GitInfo, b1 as HookErrorInfo, b2 as HookMetadata, b3 as HookMigration, b4 as HookPromptFragment, b5 as HookTrustStatus, b6 as HooksListEntry, b7 as HooksListParams$1, H as HooksListResponse, b8 as ListMcpServerStatusParams, b9 as LoginAccountParams, f as LoginAccountResponse, g as LogoutAccountResponse, ba as MarketplaceAddParams, bb as MarketplaceRemoveParams, bc as MarketplaceUpgradeParams, bd as McpResourceReadParams, be as McpServerMigration, bf as McpServerOauthLoginParams, bg as McpServerStatusDetail, bh as McpServerToolCallParams, bi as McpToolCallAppContext, bj as McpToolCallError, bk as McpToolCallResult, bl as McpToolCallStatus, bm as MemoryCitation, bn as MemoryCitationEntry, bo as MergeStrategy, bp as MigrationDetails, bq as Model, br as ModelAvailabilityNux, bs as ModelListParams, k as ModelListResponse, bt as ModelProviderCapabilitiesReadParams, bu as ModelServiceTier, bv as ModelUpgradeInfo, bw as NetworkAccess, bx as NonSteerableTurnKind, by as PatchApplyStatus, bz as PatchChangeKind, bA as PermissionProfileListParams, bB as PluginInstallParams, bC as PluginInstalledParams, bD as PluginListMarketplaceKind, bE as PluginListParams, bF as PluginReadParams, bG as PluginShareCheckoutParams, bH as PluginShareDeleteParams, bI as PluginShareListParams, bJ as PluginShareSaveParams, bK as PluginShareTarget, bL as PluginShareTargetRole, bM as PluginShareUpdateDiscoverability, bN as PluginShareUpdateTargetsParams, bO as PluginSkillReadParams, bP as PluginUninstallParams, bQ as PluginsMigration, bR as RateLimitReachedType, bS as RateLimitResetCreditsSummary, bT as RateLimitWindow, bU as ReasoningEffortOption, bV as ReviewDelivery, bW as ReviewStartParams, bX as ReviewTarget, bY as SendAddCreditsNudgeEmailParams, bZ as SessionMigration, b_ as SessionSource$1, b$ as SkillDependencies, c0 as SkillErrorInfo, c1 as SkillMetadata, c2 as SkillScope, c3 as SkillToolDependency, c4 as SkillsConfigWriteParams$1, S as SkillsConfigWriteResponse, c5 as SkillsExtraRootsSetParams, c6 as SkillsListEntry, c7 as SkillsListParams$1, l as SkillsListResponse, c8 as SpendControlLimitSnapshot, c9 as SubAgentActivityKind, ca as SubagentMigration, cb as ThreadActiveFlag, cc as ThreadApproveGuardianDeniedActionParams, cd as ThreadArchiveParams, m as ThreadArchiveResponse, ce as ThreadCompactStartParams, n as ThreadCompactStartResponse, cf as ThreadDeleteParams, cg as ThreadForkParams$1, o as ThreadForkResponse, ch as ThreadGoalClearParams, ci as ThreadGoalGetParams, cj as ThreadGoalSetParams, ck as ThreadInjectItemsParams, p as ThreadInjectItemsResponse, cl as ThreadListParams$1, q as ThreadListResponse, cm as ThreadLoadedListParams, r as ThreadLoadedListResponse, cn as ThreadMetadataGitInfoUpdateParams, co as ThreadMetadataUpdateParams, s as ThreadMetadataUpdateResponse, cp as ThreadReadParams, u as ThreadReadResponse, cq as ThreadResumeParams$1, v as ThreadResumeResponse, cr as ThreadRollbackParams, w as ThreadRollbackResponse, cs as ThreadSetNameParams, t as ThreadSetNameResponse, ct as ThreadShellCommandParams, cu as ThreadStartParams$1, x as ThreadStartResponse, cv as ThreadUnarchiveParams, y as ThreadUnarchiveResponse, cw as ThreadUnsubscribeParams, z as ThreadUnsubscribeResponse, cx as ThreadUnsubscribeStatus, cy as TurnInterruptParams, B as TurnInterruptResponse, cz as TurnStartParams$1, D as TurnStartResponse, cA as TurnStatus, cB as TurnSteerParams, E as TurnSteerResponse, cC as WebSearchAction$1, cD as WindowsSandboxSetupStartParams, cE as AgentPath, cF as AmazonBedrockCredentialSource, cG as ClientRequest, cH as FuzzyFileSearchParams, cI as GetAuthStatusParams, cJ as GetConversationSummaryParams, cK as GitDiffToRemoteParams, I as InitializeResponse, cL as InputModality, cM as CodexStableMethodParams } from './method-params-<chunk>.js';
export { C as CodexStableMethod } from './method-params-<chunk>.js';
import { C as ClientInfo, a as InitializeCapabilities, I as InitializeParams } from './InitializeParams-<chunk>.js';
import { R as ReasoningEffort, I as ImageDetail, J as JsonValue, A as AskForApproval, a as ApprovalsReviewer, f as ReasoningSummary, P as Personality, S as SandboxMode, b as SortDirection, B as ByteRange, g as TextElement, c as ThreadSortKey, T as ThreadSource, d as ThreadSourceKind, e as ThreadStartSource, U as UserInput } from './UserInput-<chunk>.js';

type AgentMessageInputContent = {
    "type": "input_text";
    text: string;
} | {
    "type": "encrypted_content";
    encrypted_content: string;
};

type FileChange = {
    "type": "add";
    content: string;
} | {
    "type": "delete";
    content: string;
} | {
    "type": "update";
    unified_diff: string;
    move_path: string | null;
};

type ApplyPatchApprovalParams = {
    conversationId: ThreadId;
    /**
     * Use to correlate this with [codex_protocol::protocol::PatchApplyBeginEvent]
     * and [codex_protocol::protocol::PatchApplyEndEvent].
     */
    callId: string;
    fileChanges: {
        [key in string]?: FileChange;
    };
    /**
     * Optional explanatory reason (e.g. request for extra write access).
     */
    reason: string | null;
    /**
     * When set, the agent is asking the user to allow writes under this root
     * for the remainder of the session (unclear if this is honored today).
     */
    grantRoot: string | null;
};

/**
 * Proposed execpolicy change to allow commands starting with this prefix.
 *
 * The `command` tokens form the prefix that would be added as an execpolicy
 * `prefix_rule(..., decision="allow")`, letting the agent bypass approval for
 * commands that start with this token sequence.
 */
type ExecPolicyAmendment$1 = Array<string>;

type NetworkPolicyRuleAction$1 = "allow" | "deny";

type NetworkPolicyAmendment$1 = {
    host: string;
    action: NetworkPolicyRuleAction$1;
};

/**
 * User's decision in response to an ExecApprovalRequest.
 */
type ReviewDecision = "approved" | {
    "approved_execpolicy_amendment": {
        proposed_execpolicy_amendment: ExecPolicyAmendment$1;
    };
} | "approved_for_session" | {
    "network_policy_amendment": {
        network_policy_amendment: NetworkPolicyAmendment$1;
    };
} | "denied" | "timed_out" | "abort";

type ApplyPatchApprovalResponse = {
    decision: ReviewDecision;
};

/**
 * Authentication mode for OpenAI-backed providers.
 */
type AuthMode = "apikey" | "chatgpt" | "chatgptAuthTokens" | "agentIdentity" | "personalAccessToken" | "bedrockApiKey";

/**
 * Selects which part of the active context is charged against
 * `model_auto_compact_token_limit`.
 */
type AutoCompactTokenLimitScope = "total" | "body_after_prefix";

type ClientNotification = {
    "method": "initialized";
};

/**
 * Initial collaboration mode to use when the TUI starts.
 */
type ModeKind = "plan" | "default";

/**
 * Settings for a collaboration mode.
 */
type Settings = {
    model: string;
    reasoning_effort: ReasoningEffort | null;
    developer_instructions: string | null;
};

/**
 * Collaboration mode for a Codex session.
 */
type CollaborationMode = {
    mode: ModeKind;
    settings: Settings;
};

type ContentItem = {
    "type": "input_text";
    text: string;
} | {
    "type": "input_image";
    image_url: string;
    detail?: ImageDetail;
} | {
    "type": "output_text";
    text: string;
};

type ConversationGitInfo = {
    sha: string | null;
    branch: string | null;
    origin_url: string | null;
};

type InternalSessionSource = "memory_consolidation";

type SessionSource = "cli" | "vscode" | "exec" | "mcp" | {
    "custom": string;
} | {
    "internal": InternalSessionSource;
} | {
    "subagent": SubAgentSource;
} | "unknown";

type ConversationSummary = {
    conversationId: ThreadId;
    path: string;
    preview: string;
    timestamp: string | null;
    updatedAt: string | null;
    modelProvider: string;
    cwd: string;
    cliVersion: string;
    source: SessionSource;
    gitInfo: ConversationGitInfo | null;
};

type ConversationTextRole = "user" | "developer" | "assistant";

type ParsedCommand = {
    "type": "read";
    cmd: string;
    name: string;
    /**
     * (Best effort) Path to the file being read by the command. When
     * possible, this is an absolute path, though when relative, it should
     * be resolved against the `cwd`` that will be used to run the command
     * to derive the absolute path.
     */
    path: string;
} | {
    "type": "list_files";
    cmd: string;
    path: string | null;
} | {
    "type": "search";
    cmd: string;
    query: string | null;
    path: string | null;
} | {
    "type": "unknown";
    cmd: string;
};

type ExecCommandApprovalParams = {
    conversationId: ThreadId;
    /**
     * Use to correlate this with [codex_protocol::protocol::ExecCommandBeginEvent]
     * and [codex_protocol::protocol::ExecCommandEndEvent].
     */
    callId: string;
    /**
     * Identifier for this specific approval callback.
     */
    approvalId: string | null;
    command: Array<string>;
    cwd: string;
    reason: string | null;
    parsedCmd: Array<ParsedCommand>;
};

type ExecCommandApprovalResponse = {
    decision: ReviewDecision;
};

type ForcedLoginMethod = "chatgpt" | "api";

/**
 * Responses API compatible content items that can be returned by a tool call.
 * This is a subset of ContentItem with the types we support as function call outputs.
 */
type FunctionCallOutputContentItem = {
    "type": "input_text";
    text: string;
} | {
    "type": "input_image";
    image_url: string;
    detail?: ImageDetail;
} | {
    "type": "encrypted_content";
    encrypted_content: string;
};

type FunctionCallOutputBody = string | Array<FunctionCallOutputContentItem>;

type FuzzyFileSearchMatchType = "file" | "directory";

/**
 * Superset of [`codex_file_search::FileMatch`]
 */
type FuzzyFileSearchResult = {
    root: string;
    path: string;
    match_type: FuzzyFileSearchMatchType;
    file_name: string;
    score: number;
    indices: Array<number> | null;
};

type FuzzyFileSearchResponse = {
    files: Array<FuzzyFileSearchResult>;
};

type FuzzyFileSearchSessionCompletedNotification = {
    sessionId: string;
};

type FuzzyFileSearchSessionUpdatedNotification = {
    sessionId: string;
    query: string;
    files: Array<FuzzyFileSearchResult>;
};

type GetAuthStatusResponse = {
    authMethod: AuthMode | null;
    authToken: string | null;
    requiresOpenaiAuth: boolean | null;
};

type GetConversationSummaryResponse = {
    summary: ConversationSummary;
};

type GitSha = string;

type GitDiffToRemoteResponse = {
    sha: GitSha;
    diff: string;
};

type LocalShellExecAction = {
    command: Array<string>;
    timeout_ms: bigint | null;
    working_directory: string | null;
    env: {
        [key in string]?: string;
    } | null;
    user: string | null;
};

type LocalShellAction = {
    "type": "exec";
} & LocalShellExecAction;

type LocalShellStatus = "completed" | "in_progress" | "incomplete";

/**
 * Presentation metadata advertised by an initialized MCP server.
 */
type McpServerInfo = {
    name: string;
    title: string | null;
    version: string;
    description: string | null;
    icons: Array<JsonValue> | null;
    websiteUrl: string | null;
};

/**
 * Controls whether the model should only spawn sub-agents after an explicit
 * user request or may delegate proactively when doing so would help.
 */
type MultiAgentMode = "explicitRequestOnly" | "proactive";

type RealtimeConversationVersion = "v1" | "v2";

type RealtimeOutputModality = "text" | "audio";

type RealtimeVoice = "alloy" | "arbor" | "ash" | "ballad" | "breeze" | "cedar" | "coral" | "cove" | "echo" | "ember" | "juniper" | "maple" | "marin" | "sage" | "shimmer" | "sol" | "spruce" | "vale" | "verse";

type RealtimeVoicesList = {
    v1: Array<RealtimeVoice>;
    v2: Array<RealtimeVoice>;
    defaultV1: RealtimeVoice;
    defaultV2: RealtimeVoice;
};

type ReasoningItemContent = {
    "type": "reasoning_text";
    text: string;
} | {
    "type": "text";
    text: string;
};

type ReasoningItemReasoningSummary = {
    "type": "summary_text";
    text: string;
};

/**
 * A known resource that the server is capable of reading.
 */
type Resource = {
    annotations?: JsonValue;
    description?: string;
    mimeType?: string;
    name: string;
    size?: number;
    title?: string;
    uri: string;
    icons?: Array<JsonValue>;
    _meta?: JsonValue;
};

/**
 * Contents returned when reading a resource from an MCP server.
 */
type ResourceContent = {
    /**
     * The URI of this resource.
     */
    uri: string;
    mimeType?: string;
    text: string;
    _meta?: JsonValue;
} | {
    /**
     * The URI of this resource.
     */
    uri: string;
    mimeType?: string;
    blob: string;
    _meta?: JsonValue;
};

/**
 * A template description for resources available on the server.
 */
type ResourceTemplate = {
    annotations?: JsonValue;
    uriTemplate: string;
    name: string;
    title?: string;
    description?: string;
    mimeType?: string;
};

type ResponseItemMetadata = {
    turn_id?: string;
    source_call_id?: string;
};

type WebSearchAction = {
    "type": "search";
    query?: string;
    queries?: Array<string>;
} | {
    "type": "open_page";
    url?: string;
} | {
    "type": "find_in_page";
    url?: string;
    pattern?: string;
} | {
    "type": "other";
};

type ResponseItem = {
    "type": "message";
    id?: string;
    role: string;
    content: Array<ContentItem>;
    phase?: MessagePhase;
    metadata?: ResponseItemMetadata;
} | {
    "type": "agent_message";
    id?: string;
    author: string;
    recipient: string;
    content: Array<AgentMessageInputContent>;
    metadata?: ResponseItemMetadata;
} | {
    "type": "reasoning";
    id?: string;
    summary: Array<ReasoningItemReasoningSummary>;
    content?: Array<ReasoningItemContent>;
    encrypted_content: string | null;
    metadata?: ResponseItemMetadata;
} | {
    "type": "local_shell_call";
    /**
     * Legacy id field retained for compatibility with older payloads.
     */
    id?: string;
    /**
     * Set when using the Responses API.
     */
    call_id: string | null;
    status: LocalShellStatus;
    action: LocalShellAction;
    metadata?: ResponseItemMetadata;
} | {
    "type": "function_call";
    id?: string;
    name: string;
    namespace?: string;
    arguments: string;
    call_id: string;
    metadata?: ResponseItemMetadata;
} | {
    "type": "tool_search_call";
    id?: string;
    call_id: string | null;
    status?: string;
    execution: string;
    arguments: unknown;
    metadata?: ResponseItemMetadata;
} | {
    "type": "function_call_output";
    id?: string;
    call_id: string;
    output: FunctionCallOutputBody;
    metadata?: ResponseItemMetadata;
} | {
    "type": "custom_tool_call";
    id?: string;
    status?: string;
    call_id: string;
    name: string;
    input: string;
    metadata?: ResponseItemMetadata;
} | {
    "type": "custom_tool_call_output";
    id?: string;
    call_id: string;
    name?: string;
    output: FunctionCallOutputBody;
    metadata?: ResponseItemMetadata;
} | {
    "type": "tool_search_output";
    id?: string;
    call_id: string | null;
    status: string;
    execution: string;
    tools: unknown[];
    metadata?: ResponseItemMetadata;
} | {
    "type": "web_search_call";
    id?: string;
    status?: string;
    action?: WebSearchAction;
    metadata?: ResponseItemMetadata;
} | {
    "type": "image_generation_call";
    id?: string;
    status: string;
    revised_prompt?: string;
    result: string;
    metadata?: ResponseItemMetadata;
} | {
    "type": "compaction";
    id?: string;
    encrypted_content: string;
    metadata?: ResponseItemMetadata;
} | {
    "type": "compaction_trigger";
    metadata?: ResponseItemMetadata;
} | {
    "type": "context_compaction";
    id?: string;
    encrypted_content?: string;
    metadata?: ResponseItemMetadata;
} | {
    "type": "other";
};

type AccountLoginCompletedNotification = {
    loginId: string | null;
    success: boolean;
    error: string | null;
};

/**
 * Sparse rolling rate-limit update.
 *
 * Clients should merge available values into the most recent `account/rateLimits/read` response
 * or refetch that snapshot. Nullable account metadata may be unavailable in a rolling update and
 * does not clear a previously observed value.
 */
type AccountRateLimitsUpdatedNotification = {
    rateLimits: RateLimitSnapshot;
};

type AccountUpdatedNotification = {
    authMode: AuthMode | null;
    planType: PlanType | null;
};

type AgentMessageDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
};

/**
 * EXPERIMENTAL - notification emitted when the app list changes.
 */
type AppListUpdatedNotification = {
    data: Array<AppInfo>;
};

/**
 * Stream label for `command/exec/outputDelta` notifications.
 */
type CommandExecOutputStream = "stdout" | "stderr";

/**
 * Base64-encoded output chunk emitted for a streaming `command/exec` request.
 *
 * These notifications are connection-scoped. If the originating connection
 * closes, the server terminates the process.
 */
type CommandExecOutputDeltaNotification = {
    /**
     * Client-supplied, connection-scoped `processId` from the original
     * `command/exec` request.
     */
    processId: string;
    /**
     * Output stream for this chunk.
     */
    stream: CommandExecOutputStream;
    /**
     * Base64-encoded output bytes.
     */
    deltaBase64: string;
    /**
     * `true` on the final streamed chunk for a stream when `outputBytesCap`
     * truncated later output on that stream.
     */
    capReached: boolean;
};

type CommandExecutionOutputDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
};

type TextPosition = {
    /**
     * 1-based line number.
     */
    line: number;
    /**
     * 1-based column number (in Unicode scalar values).
     */
    column: number;
};

type TextRange = {
    start: TextPosition;
    end: TextPosition;
};

type ConfigWarningNotification = {
    /**
     * Concise summary of the warning.
     */
    summary: string;
    /**
     * Optional extra guidance or error details.
     */
    details: string | null;
    /**
     * Optional path to the config file that triggered the warning.
     */
    path?: string;
    /**
     * Optional range for the error location inside the config file.
     */
    range?: TextRange;
};

/**
 * Deprecated: Use `ContextCompaction` item type instead.
 */
type ContextCompactedNotification = {
    threadId: string;
    turnId: string;
};

type DeprecationNoticeNotification = {
    /**
     * Concise summary of what is deprecated.
     */
    summary: string;
    /**
     * Optional extra guidance, such as migration steps or rationale.
     */
    details: string | null;
};

type ErrorNotification = {
    error: TurnError;
    willRetry: boolean;
    threadId: string;
    turnId: string;
};

type ExternalAgentConfigImportItemTypeFailure = {
    itemType: ExternalAgentConfigMigrationItemType;
    errorType: string | null;
    failureStage: string;
    message: string;
    cwd: string | null;
    source: string | null;
};

type ExternalAgentConfigImportItemTypeSuccess = {
    itemType: ExternalAgentConfigMigrationItemType;
    cwd: string | null;
    source: string | null;
    target: string | null;
};

type ExternalAgentConfigImportTypeResult = {
    itemType: ExternalAgentConfigMigrationItemType;
    successes: Array<ExternalAgentConfigImportItemTypeSuccess>;
    failures: Array<ExternalAgentConfigImportItemTypeFailure>;
};

type ExternalAgentConfigImportCompletedNotification = {
    importId: string;
    itemTypeResults: Array<ExternalAgentConfigImportTypeResult>;
};

type ExternalAgentConfigImportProgressNotification = {
    importId: string;
    itemTypeResults: Array<ExternalAgentConfigImportTypeResult>;
};

/**
 * Deprecated legacy notification for `apply_patch` textual output.
 *
 * The server no longer emits this notification.
 */
type FileChangeOutputDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
};

type FileChangePatchUpdatedNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    changes: Array<FileUpdateChange>;
};

/**
 * Filesystem watch notification emitted for `fs/watch` subscribers.
 */
type FsChangedNotification = {
    /**
     * Watch identifier previously provided to `fs/watch`.
     */
    watchId: string;
    /**
     * File or directory paths associated with this event.
     */
    changedPaths: Array<AbsolutePathBuf>;
};

type GuardianWarningNotification = {
    /**
     * Thread target for the guardian warning.
     */
    threadId: string;
    /**
     * Concise guardian warning message for the user.
     */
    message: string;
};

type HookExecutionMode = "sync" | "async";

type HookOutputEntryKind = "warning" | "stop" | "feedback" | "context" | "error";

type HookOutputEntry = {
    kind: HookOutputEntryKind;
    text: string;
};

type HookRunStatus = "running" | "completed" | "failed" | "blocked" | "stopped";

type HookScope = "thread" | "turn";

type HookRunSummary = {
    id: string;
    eventName: HookEventName;
    handlerType: HookHandlerType;
    executionMode: HookExecutionMode;
    scope: HookScope;
    sourcePath: AbsolutePathBuf;
    source: HookSource;
    displayOrder: bigint;
    status: HookRunStatus;
    statusMessage: string | null;
    startedAt: bigint;
    completedAt: bigint | null;
    durationMs: bigint | null;
    entries: Array<HookOutputEntry>;
};

type HookCompletedNotification = {
    threadId: string;
    turnId: string | null;
    run: HookRunSummary;
};

type HookStartedNotification = {
    threadId: string;
    turnId: string | null;
    run: HookRunSummary;
};

type ItemCompletedNotification = {
    item: ThreadItem;
    threadId: string;
    turnId: string;
    /**
     * Unix timestamp (in milliseconds) when this item lifecycle completed.
     */
    completedAtMs: number;
};

/**
 * [UNSTABLE] Source that produced a terminal approval auto-review decision.
 */
type AutoReviewDecisionSource = "agent";

/**
 * [UNSTABLE] Lifecycle state for an approval auto-review.
 */
type GuardianApprovalReviewStatus = "inProgress" | "approved" | "denied" | "timedOut" | "aborted";

/**
 * [UNSTABLE] Risk level assigned by approval auto-review.
 */
type GuardianRiskLevel = "low" | "medium" | "high" | "critical";

/**
 * [UNSTABLE] Authorization level assigned by approval auto-review.
 */
type GuardianUserAuthorization = "unknown" | "low" | "medium" | "high";

/**
 * [UNSTABLE] Temporary approval auto-review payload used by
 * `item/autoApprovalReview/*` notifications. This shape is expected to change
 * soon.
 */
type GuardianApprovalReview = {
    status: GuardianApprovalReviewStatus;
    riskLevel: GuardianRiskLevel | null;
    userAuthorization: GuardianUserAuthorization | null;
    rationale: string | null;
};

type GuardianCommandSource = "shell" | "unifiedExec";

type NetworkApprovalProtocol = "http" | "https" | "socks5Tcp" | "socks5Udp";

type FileSystemAccessMode = "read" | "write" | "deny";

type FileSystemSpecialPath = {
    "kind": "root";
} | {
    "kind": "minimal";
} | {
    "kind": "project_roots";
    subpath: string | null;
} | {
    "kind": "tmpdir";
} | {
    "kind": "slash_tmp";
} | {
    "kind": "unknown";
    path: string;
    subpath: string | null;
};

type FileSystemPath = {
    "type": "path";
    path: LegacyAppPathString;
} | {
    "type": "glob_pattern";
    pattern: string;
} | {
    "type": "special";
    value: FileSystemSpecialPath;
};

type FileSystemSandboxEntry = {
    path: FileSystemPath;
    access: FileSystemAccessMode;
};

type AdditionalFileSystemPermissions = {
    /**
     * This will be removed in favor of `entries`.
     */
    read: Array<LegacyAppPathString> | null;
    /**
     * This will be removed in favor of `entries`.
     */
    write: Array<LegacyAppPathString> | null;
    globScanMaxDepth?: number;
    entries?: Array<FileSystemSandboxEntry>;
};

type AdditionalNetworkPermissions = {
    enabled: boolean | null;
};

type RequestPermissionProfile = {
    network: AdditionalNetworkPermissions | null;
    fileSystem: AdditionalFileSystemPermissions | null;
};

type GuardianApprovalReviewAction = {
    "type": "command";
    source: GuardianCommandSource;
    command: string;
    cwd: AbsolutePathBuf;
} | {
    "type": "execve";
    source: GuardianCommandSource;
    program: string;
    argv: Array<string>;
    cwd: AbsolutePathBuf;
} | {
    "type": "applyPatch";
    cwd: AbsolutePathBuf;
    files: Array<AbsolutePathBuf>;
} | {
    "type": "networkAccess";
    target: string;
    host: string;
    protocol: NetworkApprovalProtocol;
    port: number;
} | {
    "type": "mcpToolCall";
    server: string;
    toolName: string;
    connectorId: string | null;
    connectorName: string | null;
    toolTitle: string | null;
} | {
    "type": "requestPermissions";
    reason: string | null;
    permissions: RequestPermissionProfile;
};

/**
 * [UNSTABLE] Temporary notification payload for approval auto-review. This
 * shape is expected to change soon.
 */
type ItemGuardianApprovalReviewCompletedNotification = {
    threadId: string;
    turnId: string;
    /**
     * Unix timestamp (in milliseconds) when this review started.
     */
    startedAtMs: number;
    /**
     * Unix timestamp (in milliseconds) when this review completed.
     */
    completedAtMs: number;
    /**
     * Stable identifier for this review.
     */
    reviewId: string;
    /**
     * Identifier for the reviewed item or tool call when one exists.
     *
     * In most cases, one review maps to one target item. The exceptions are
     * - execve reviews, where a single command may contain multiple execve
     *   calls to review (only possible when using the shell_zsh_fork feature)
     * - network policy reviews, where there is no target item
     *
     * A network call is triggered by a CommandExecution item, so having a
     * target_item_id set to the CommandExecution item would be misleading
     * because the review is about the network call, not the command execution.
     * Therefore, target_item_id is set to None for network policy reviews.
     */
    targetItemId: string | null;
    decisionSource: AutoReviewDecisionSource;
    review: GuardianApprovalReview;
    action: GuardianApprovalReviewAction;
};

/**
 * [UNSTABLE] Temporary notification payload for approval auto-review. This
 * shape is expected to change soon.
 */
type ItemGuardianApprovalReviewStartedNotification = {
    threadId: string;
    turnId: string;
    /**
     * Unix timestamp (in milliseconds) when this review started.
     */
    startedAtMs: number;
    /**
     * Stable identifier for this review.
     */
    reviewId: string;
    /**
     * Identifier for the reviewed item or tool call when one exists.
     *
     * In most cases, one review maps to one target item. The exceptions are
     * - execve reviews, where a single command may contain multiple execve
     *   calls to review (only possible when using the shell_zsh_fork feature)
     * - network policy reviews, where there is no target item
     *
     * A network call is triggered by a CommandExecution item, so having a
     * target_item_id set to the CommandExecution item would be misleading
     * because the review is about the network call, not the command execution.
     * Therefore, target_item_id is set to None for network policy reviews.
     */
    targetItemId: string | null;
    review: GuardianApprovalReview;
    action: GuardianApprovalReviewAction;
};

type ItemStartedNotification = {
    item: ThreadItem;
    threadId: string;
    turnId: string;
    /**
     * Unix timestamp (in milliseconds) when this item lifecycle started.
     */
    startedAtMs: number;
};

type McpServerOauthLoginCompletedNotification = {
    name: string;
    success: boolean;
    error?: string;
};

type McpServerStartupState = "starting" | "ready" | "failed" | "cancelled";

type McpServerStatusUpdatedNotification = {
    threadId: string | null;
    name: string;
    status: McpServerStartupState;
    error: string | null;
};

type McpToolCallProgressNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    message: string;
};

type ModelRerouteReason = "highRiskCyberActivity";

type ModelReroutedNotification = {
    threadId: string;
    turnId: string;
    fromModel: string;
    toModel: string;
    reason: ModelRerouteReason;
};

type ModelVerification = "trustedAccessForCyber";

type ModelVerificationNotification = {
    threadId: string;
    turnId: string;
    verifications: Array<ModelVerification>;
};

/**
 * EXPERIMENTAL - proposed plan streaming deltas for plan items. Clients should
 * not assume concatenated deltas match the completed plan item content.
 */
type PlanDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
};

/**
 * Final process exit notification for `process/spawn`.
 */
type ProcessExitedNotification = {
    /**
     * Client-supplied, connection-scoped `processHandle` from `process/spawn`.
     */
    processHandle: string;
    /**
     * Process exit code.
     */
    exitCode: number;
    /**
     * Buffered stdout capture.
     *
     * Empty when stdout was streamed via `process/outputDelta`.
     */
    stdout: string;
    /**
     * Whether stdout reached `outputBytesCap`.
     *
     * In streaming mode, stdout is empty and cap state is also reported on the
     * final stdout `process/outputDelta` notification.
     */
    stdoutCapReached: boolean;
    /**
     * Buffered stderr capture.
     *
     * Empty when stderr was streamed via `process/outputDelta`.
     */
    stderr: string;
    /**
     * Whether stderr reached `outputBytesCap`.
     *
     * In streaming mode, stderr is empty and cap state is also reported on the
     * final stderr `process/outputDelta` notification.
     */
    stderrCapReached: boolean;
};

/**
 * Stream label for `process/outputDelta` notifications.
 */
type ProcessOutputStream = "stdout" | "stderr";

/**
 * Base64-encoded output chunk emitted for a streaming `process/spawn` request.
 */
type ProcessOutputDeltaNotification = {
    /**
     * Client-supplied, connection-scoped `processHandle` from `process/spawn`.
     */
    processHandle: string;
    /**
     * Output stream this chunk belongs to.
     */
    stream: ProcessOutputStream;
    /**
     * Base64-encoded output bytes.
     */
    deltaBase64: string;
    /**
     * True on the final streamed chunk for this stream when output was
     * truncated by `outputBytesCap`.
     */
    capReached: boolean;
};

type RawResponseItemCompletedNotification = {
    threadId: string;
    turnId: string;
    item: ResponseItem;
};

type ReasoningSummaryPartAddedNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    summaryIndex: number;
};

type ReasoningSummaryTextDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
    summaryIndex: number;
};

type ReasoningTextDeltaNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    delta: string;
    contentIndex: number;
};

type RemoteControlConnectionStatus = "disabled" | "connecting" | "connected" | "errored";

/**
 * Current remote-control connection status and remote identity exposed to clients.
 */
type RemoteControlStatusChangedNotification = {
    status: RemoteControlConnectionStatus;
    serverName: string;
    installationId: string;
    environmentId: string | null;
};

type ServerRequestResolvedNotification = {
    threadId: string;
    requestId: RequestId;
};

/**
 * Notification emitted when watched local skill files change.
 *
 * Treat this as an invalidation signal and re-run `skills/list` with the
 * client's current parameters when refreshed skill metadata is needed.
 */
type SkillsChangedNotification = Record<string, never>;

type TerminalInteractionNotification = {
    threadId: string;
    turnId: string;
    itemId: string;
    processId: string;
    stdin: string;
};

type ThreadArchivedNotification = {
    threadId: string;
};

type ThreadClosedNotification = {
    threadId: string;
};

type ThreadDeletedNotification = {
    threadId: string;
};

type ThreadGoalClearedNotification = {
    threadId: string;
};

type ThreadGoal = {
    threadId: string;
    objective: string;
    status: ThreadGoalStatus;
    tokenBudget: number | null;
    tokensUsed: number;
    timeUsedSeconds: number;
    createdAt: number;
    updatedAt: number;
};

type ThreadGoalUpdatedNotification = {
    threadId: string;
    turnId: string | null;
    goal: ThreadGoal;
};

type ThreadNameUpdatedNotification = {
    threadId: string;
    threadName?: string;
};

/**
 * EXPERIMENTAL - emitted when thread realtime transport closes.
 */
type ThreadRealtimeClosedNotification = {
    threadId: string;
    reason: string | null;
};

/**
 * EXPERIMENTAL - emitted when thread realtime encounters an error.
 */
type ThreadRealtimeErrorNotification = {
    threadId: string;
    message: string;
};

/**
 * EXPERIMENTAL - raw non-audio thread realtime item emitted by the backend.
 */
type ThreadRealtimeItemAddedNotification = {
    threadId: string;
    item: JsonValue;
};

/**
 * EXPERIMENTAL - thread realtime audio chunk.
 */
type ThreadRealtimeAudioChunk = {
    data: string;
    sampleRate: number;
    numChannels: number;
    samplesPerChannel: number | null;
    itemId: string | null;
};

/**
 * EXPERIMENTAL - streamed output audio emitted by thread realtime.
 */
type ThreadRealtimeOutputAudioDeltaNotification = {
    threadId: string;
    audio: ThreadRealtimeAudioChunk;
};

/**
 * EXPERIMENTAL - emitted with the remote SDP for a WebRTC realtime session.
 */
type ThreadRealtimeSdpNotification = {
    threadId: string;
    sdp: string;
};

/**
 * EXPERIMENTAL - emitted when thread realtime startup is accepted.
 */
type ThreadRealtimeStartedNotification = {
    threadId: string;
    realtimeSessionId: string | null;
    version: RealtimeConversationVersion;
};

/**
 * EXPERIMENTAL - flat transcript delta emitted whenever realtime
 * transcript text changes.
 */
type ThreadRealtimeTranscriptDeltaNotification = {
    threadId: string;
    role: string;
    /**
     * Live transcript delta from the realtime event.
     */
    delta: string;
};

/**
 * EXPERIMENTAL - final transcript text emitted when realtime completes
 * a transcript part.
 */
type ThreadRealtimeTranscriptDoneNotification = {
    threadId: string;
    role: string;
    /**
     * Final complete text for the transcript part.
     */
    text: string;
};

type ActivePermissionProfile = {
    /**
     * Identifier from `default_permissions` or the implicit built-in default,
     * such as `:workspace` or a user-defined `[permissions.<id>]` profile.
     */
    id: string;
    /**
     * Parent profile identifier from the selected permissions profile's
     * `extends` setting, when present.
     */
    extends: string | null;
};

type ThreadSettings = {
    cwd: AbsolutePathBuf;
    approvalPolicy: AskForApproval;
    approvalsReviewer: ApprovalsReviewer;
    sandboxPolicy: SandboxPolicy;
    activePermissionProfile: ActivePermissionProfile | null;
    model: string;
    modelProvider: string;
    serviceTier: string | null;
    effort: ReasoningEffort | null;
    summary: ReasoningSummary | null;
    collaborationMode: CollaborationMode;
    personality: Personality | null;
};

type ThreadSettingsUpdatedNotification = {
    threadId: string;
    threadSettings: ThreadSettings;
};

type ThreadStartedNotification = {
    thread: Thread;
};

type ThreadStatusChangedNotification = {
    threadId: string;
    status: ThreadStatus;
};

type TokenUsageBreakdown = {
    totalTokens: number;
    inputTokens: number;
    cachedInputTokens: number;
    outputTokens: number;
    reasoningOutputTokens: number;
};

type ThreadTokenUsage = {
    total: TokenUsageBreakdown;
    last: TokenUsageBreakdown;
    modelContextWindow: number | null;
};

type ThreadTokenUsageUpdatedNotification = {
    threadId: string;
    turnId: string;
    tokenUsage: ThreadTokenUsage;
};

type ThreadUnarchivedNotification = {
    threadId: string;
};

type TurnCompletedNotification = {
    threadId: string;
    turn: Turn;
};

/**
 * Notification that the turn-level unified diff has changed.
 * Contains the latest aggregated diff across all file changes in the turn.
 */
type TurnDiffUpdatedNotification = {
    threadId: string;
    turnId: string;
    diff: string;
};

type TurnModerationMetadataNotification = {
    threadId: string;
    turnId: string;
    metadata: JsonValue;
};

type TurnPlanStepStatus = "pending" | "inProgress" | "completed";

type TurnPlanStep = {
    step: string;
    status: TurnPlanStepStatus;
};

type TurnPlanUpdatedNotification = {
    threadId: string;
    turnId: string;
    explanation: string | null;
    plan: Array<TurnPlanStep>;
};

type TurnStartedNotification = {
    threadId: string;
    turn: Turn;
};

type WarningNotification = {
    /**
     * Optional thread target when the warning applies to a specific thread.
     */
    threadId: string | null;
    /**
     * Concise warning message for the user.
     */
    message: string;
};

type WindowsSandboxSetupCompletedNotification = {
    mode: WindowsSandboxSetupMode;
    success: boolean;
    error: string | null;
};

type WindowsWorldWritableWarningNotification = {
    samplePaths: Array<string>;
    extraCount: number;
    failedScan: boolean;
};

/**
 * Notification sent from the server to the client.
 */
type ServerNotification = {
    "method": "error";
    "params": ErrorNotification;
} | {
    "method": "thread/started";
    "params": ThreadStartedNotification;
} | {
    "method": "thread/status/changed";
    "params": ThreadStatusChangedNotification;
} | {
    "method": "thread/archived";
    "params": ThreadArchivedNotification;
} | {
    "method": "thread/deleted";
    "params": ThreadDeletedNotification;
} | {
    "method": "thread/unarchived";
    "params": ThreadUnarchivedNotification;
} | {
    "method": "thread/closed";
    "params": ThreadClosedNotification;
} | {
    "method": "skills/changed";
    "params": SkillsChangedNotification;
} | {
    "method": "thread/name/updated";
    "params": ThreadNameUpdatedNotification;
} | {
    "method": "thread/goal/updated";
    "params": ThreadGoalUpdatedNotification;
} | {
    "method": "thread/goal/cleared";
    "params": ThreadGoalClearedNotification;
} | {
    "method": "thread/settings/updated";
    "params": ThreadSettingsUpdatedNotification;
} | {
    "method": "thread/tokenUsage/updated";
    "params": ThreadTokenUsageUpdatedNotification;
} | {
    "method": "turn/started";
    "params": TurnStartedNotification;
} | {
    "method": "hook/started";
    "params": HookStartedNotification;
} | {
    "method": "turn/completed";
    "params": TurnCompletedNotification;
} | {
    "method": "hook/completed";
    "params": HookCompletedNotification;
} | {
    "method": "turn/diff/updated";
    "params": TurnDiffUpdatedNotification;
} | {
    "method": "turn/plan/updated";
    "params": TurnPlanUpdatedNotification;
} | {
    "method": "item/started";
    "params": ItemStartedNotification;
} | {
    "method": "item/autoApprovalReview/started";
    "params": ItemGuardianApprovalReviewStartedNotification;
} | {
    "method": "item/autoApprovalReview/completed";
    "params": ItemGuardianApprovalReviewCompletedNotification;
} | {
    "method": "item/completed";
    "params": ItemCompletedNotification;
} | {
    "method": "rawResponseItem/completed";
    "params": RawResponseItemCompletedNotification;
} | {
    "method": "item/agentMessage/delta";
    "params": AgentMessageDeltaNotification;
} | {
    "method": "item/plan/delta";
    "params": PlanDeltaNotification;
} | {
    "method": "command/exec/outputDelta";
    "params": CommandExecOutputDeltaNotification;
} | {
    "method": "process/outputDelta";
    "params": ProcessOutputDeltaNotification;
} | {
    "method": "process/exited";
    "params": ProcessExitedNotification;
} | {
    "method": "item/commandExecution/outputDelta";
    "params": CommandExecutionOutputDeltaNotification;
} | {
    "method": "item/commandExecution/terminalInteraction";
    "params": TerminalInteractionNotification;
} | {
    "method": "item/fileChange/outputDelta";
    "params": FileChangeOutputDeltaNotification;
} | {
    "method": "item/fileChange/patchUpdated";
    "params": FileChangePatchUpdatedNotification;
} | {
    "method": "serverRequest/resolved";
    "params": ServerRequestResolvedNotification;
} | {
    "method": "item/mcpToolCall/progress";
    "params": McpToolCallProgressNotification;
} | {
    "method": "mcpServer/oauthLogin/completed";
    "params": McpServerOauthLoginCompletedNotification;
} | {
    "method": "mcpServer/startupStatus/updated";
    "params": McpServerStatusUpdatedNotification;
} | {
    "method": "account/updated";
    "params": AccountUpdatedNotification;
} | {
    "method": "account/rateLimits/updated";
    "params": AccountRateLimitsUpdatedNotification;
} | {
    "method": "app/list/updated";
    "params": AppListUpdatedNotification;
} | {
    "method": "remoteControl/status/changed";
    "params": RemoteControlStatusChangedNotification;
} | {
    "method": "externalAgentConfig/import/progress";
    "params": ExternalAgentConfigImportProgressNotification;
} | {
    "method": "externalAgentConfig/import/completed";
    "params": ExternalAgentConfigImportCompletedNotification;
} | {
    "method": "fs/changed";
    "params": FsChangedNotification;
} | {
    "method": "item/reasoning/summaryTextDelta";
    "params": ReasoningSummaryTextDeltaNotification;
} | {
    "method": "item/reasoning/summaryPartAdded";
    "params": ReasoningSummaryPartAddedNotification;
} | {
    "method": "item/reasoning/textDelta";
    "params": ReasoningTextDeltaNotification;
} | {
    "method": "thread/compacted";
    "params": ContextCompactedNotification;
} | {
    "method": "model/rerouted";
    "params": ModelReroutedNotification;
} | {
    "method": "model/verification";
    "params": ModelVerificationNotification;
} | {
    "method": "turn/moderationMetadata";
    "params": TurnModerationMetadataNotification;
} | {
    "method": "warning";
    "params": WarningNotification;
} | {
    "method": "guardianWarning";
    "params": GuardianWarningNotification;
} | {
    "method": "deprecationNotice";
    "params": DeprecationNoticeNotification;
} | {
    "method": "configWarning";
    "params": ConfigWarningNotification;
} | {
    "method": "fuzzyFileSearch/sessionUpdated";
    "params": FuzzyFileSearchSessionUpdatedNotification;
} | {
    "method": "fuzzyFileSearch/sessionCompleted";
    "params": FuzzyFileSearchSessionCompletedNotification;
} | {
    "method": "thread/realtime/started";
    "params": ThreadRealtimeStartedNotification;
} | {
    "method": "thread/realtime/itemAdded";
    "params": ThreadRealtimeItemAddedNotification;
} | {
    "method": "thread/realtime/transcript/delta";
    "params": ThreadRealtimeTranscriptDeltaNotification;
} | {
    "method": "thread/realtime/transcript/done";
    "params": ThreadRealtimeTranscriptDoneNotification;
} | {
    "method": "thread/realtime/outputAudio/delta";
    "params": ThreadRealtimeOutputAudioDeltaNotification;
} | {
    "method": "thread/realtime/sdp";
    "params": ThreadRealtimeSdpNotification;
} | {
    "method": "thread/realtime/error";
    "params": ThreadRealtimeErrorNotification;
} | {
    "method": "thread/realtime/closed";
    "params": ThreadRealtimeClosedNotification;
} | {
    "method": "windows/worldWritableWarning";
    "params": WindowsWorldWritableWarningNotification;
} | {
    "method": "windowsSandbox/setupCompleted";
    "params": WindowsSandboxSetupCompletedNotification;
} | {
    "method": "account/login/completed";
    "params": AccountLoginCompletedNotification;
};

type AttestationGenerateParams = Record<string, never>;

type ChatgptAuthTokensRefreshReason = "unauthorized";

type ChatgptAuthTokensRefreshParams = {
    reason: ChatgptAuthTokensRefreshReason;
    /**
     * Workspace/account identifier that Codex was previously using.
     *
     * Clients that manage multiple accounts/workspaces can use this as a hint
     * to refresh the token for the correct workspace.
     *
     * This may be `null` when the prior auth state did not include a workspace
     * identifier (`chatgpt_account_id`).
     */
    previousAccountId?: string | null;
};

type ExecPolicyAmendment = Array<string>;

type NetworkApprovalContext = {
    host: string;
    protocol: NetworkApprovalProtocol;
};

type NetworkPolicyRuleAction = "allow" | "deny";

type NetworkPolicyAmendment = {
    host: string;
    action: NetworkPolicyRuleAction;
};

type CommandExecutionRequestApprovalParams = {
    threadId: string;
    turnId: string;
    itemId: string; /**
     * Unix timestamp (in milliseconds) when this approval request started.
     */
    startedAtMs: number; /**
     * Unique identifier for this specific approval callback.
     *
     * For regular shell/unified_exec approvals, this is null.
     *
     * For zsh-exec-bridge subcommand approvals, multiple callbacks can belong to
     * one parent `itemId`, so `approvalId` is a distinct opaque callback id
     * (a UUID) used to disambiguate routing.
     */
    approvalId?: string | null; /**
     * Environment in which the command will run.
     */
    environmentId: string | null; /**
     * Optional explanatory reason (e.g. request for network access).
     */
    reason?: string | null; /**
     * Optional context for a managed-network approval prompt.
     */
    networkApprovalContext?: NetworkApprovalContext | null; /**
     * The command to be executed.
     */
    command?: string | null; /**
     * The command's working directory.
     */
    cwd?: LegacyAppPathString | null; /**
     * Best-effort parsed command actions for friendly display.
     */
    commandActions?: Array<CommandAction> | null; /**
     * Optional proposed execpolicy amendment to allow similar commands without prompting.
     */
    proposedExecpolicyAmendment?: ExecPolicyAmendment | null; /**
     * Optional proposed network policy amendments (allow/deny host) for future requests.
     */
    proposedNetworkPolicyAmendments?: Array<NetworkPolicyAmendment> | null;
};

type DynamicToolCallParams = {
    threadId: string;
    turnId: string;
    callId: string;
    namespace: string | null;
    tool: string;
    arguments: JsonValue;
};

type FileChangeRequestApprovalParams = {
    threadId: string;
    turnId: string;
    itemId: string;
    /**
     * Unix timestamp (in milliseconds) when this approval request started.
     */
    startedAtMs: number;
    /**
     * Optional explanatory reason (e.g. request for extra write access).
     */
    reason?: string | null;
    /**
     * [UNSTABLE] When set, the agent is asking the user to allow writes under this root
     * for the remainder of the session (unclear if this is honored today).
     */
    grantRoot?: string | null;
};

type McpElicitationObjectType = "object";

type McpElicitationBooleanType = "boolean";

type McpElicitationBooleanSchema = {
    type: McpElicitationBooleanType;
    title?: string;
    description?: string;
    default?: boolean;
};

type McpElicitationStringType = "string";

type McpElicitationLegacyTitledEnumSchema = {
    type: McpElicitationStringType;
    title?: string;
    description?: string;
    enum: Array<string>;
    enumNames?: Array<string>;
    default?: string;
};

type McpElicitationArrayType = "array";

type McpElicitationConstOption = {
    const: string;
    title: string;
};

type McpElicitationTitledEnumItems = {
    anyOf: Array<McpElicitationConstOption>;
};

type McpElicitationTitledMultiSelectEnumSchema = {
    type: McpElicitationArrayType;
    title?: string;
    description?: string;
    minItems?: bigint;
    maxItems?: bigint;
    items: McpElicitationTitledEnumItems;
    default?: Array<string>;
};

type McpElicitationUntitledEnumItems = {
    type: McpElicitationStringType;
    enum: Array<string>;
};

type McpElicitationUntitledMultiSelectEnumSchema = {
    type: McpElicitationArrayType;
    title?: string;
    description?: string;
    minItems?: bigint;
    maxItems?: bigint;
    items: McpElicitationUntitledEnumItems;
    default?: Array<string>;
};

type McpElicitationMultiSelectEnumSchema = McpElicitationUntitledMultiSelectEnumSchema | McpElicitationTitledMultiSelectEnumSchema;

type McpElicitationTitledSingleSelectEnumSchema = {
    type: McpElicitationStringType;
    title?: string;
    description?: string;
    oneOf: Array<McpElicitationConstOption>;
    default?: string;
};

type McpElicitationUntitledSingleSelectEnumSchema = {
    type: McpElicitationStringType;
    title?: string;
    description?: string;
    enum: Array<string>;
    default?: string;
};

type McpElicitationSingleSelectEnumSchema = McpElicitationUntitledSingleSelectEnumSchema | McpElicitationTitledSingleSelectEnumSchema;

type McpElicitationEnumSchema = McpElicitationSingleSelectEnumSchema | McpElicitationMultiSelectEnumSchema | McpElicitationLegacyTitledEnumSchema;

type McpElicitationNumberType = "number" | "integer";

type McpElicitationNumberSchema = {
    type: McpElicitationNumberType;
    title?: string;
    description?: string;
    minimum?: number;
    maximum?: number;
    default?: number;
};

type McpElicitationStringFormat = "email" | "uri" | "date" | "date-time";

type McpElicitationStringSchema = {
    type: McpElicitationStringType;
    title?: string;
    description?: string;
    minLength?: number;
    maxLength?: number;
    format?: McpElicitationStringFormat;
    default?: string;
};

type McpElicitationPrimitiveSchema = McpElicitationEnumSchema | McpElicitationStringSchema | McpElicitationNumberSchema | McpElicitationBooleanSchema;

/**
 * Typed form schema for MCP `elicitation/create` requests.
 *
 * This matches the `requestedSchema` shape from the MCP 2025-11-25
 * `ElicitRequestFormParams` schema.
 */
type McpElicitationSchema = {
    $schema?: string;
    type: McpElicitationObjectType;
    properties: {
        [key in string]?: McpElicitationPrimitiveSchema;
    };
    required?: Array<string>;
};

type McpServerElicitationRequestParams = {
    threadId: string;
    /**
     * Active Codex turn when this elicitation was observed, if app-server could correlate one.
     *
     * This is nullable because MCP models elicitation as a standalone server-to-client request
     * identified by the MCP server request id. It may be triggered during a turn, but turn
     * context is app-server correlation rather than part of the protocol identity of the
     * elicitation itself.
     */
    turnId: string | null;
    serverName: string;
} & ({
    "mode": "form";
    _meta: JsonValue | null;
    message: string;
    requestedSchema: McpElicitationSchema;
} | {
    "mode": "openai/form";
    _meta: JsonValue | null;
    message: string;
    requestedSchema: JsonValue;
} | {
    "mode": "url";
    _meta: JsonValue | null;
    message: string;
    url: string;
    elicitationId: string;
});

type PermissionsRequestApprovalParams = {
    threadId: string;
    turnId: string;
    itemId: string;
    environmentId: string | null;
    /**
     * Unix timestamp (in milliseconds) when this approval request started.
     */
    startedAtMs: number;
    cwd: AbsolutePathBuf;
    reason: string | null;
    permissions: RequestPermissionProfile;
};

/**
 * EXPERIMENTAL. Defines a single selectable option for request_user_input.
 */
type ToolRequestUserInputOption = {
    label: string;
    description: string;
};

/**
 * EXPERIMENTAL. Represents one request_user_input question and its required options.
 */
type ToolRequestUserInputQuestion = {
    id: string;
    header: string;
    question: string;
    isOther: boolean;
    isSecret: boolean;
    options: Array<ToolRequestUserInputOption> | null;
};

/**
 * EXPERIMENTAL. Params sent with a request_user_input event.
 */
type ToolRequestUserInputParams = {
    threadId: string;
    turnId: string;
    itemId: string;
    questions: Array<ToolRequestUserInputQuestion>;
    autoResolutionMs: number | null;
};

/**
 * Request initiated from the server and sent to the client.
 */
type ServerRequest = {
    "method": "item/commandExecution/requestApproval";
    id: RequestId;
    params: CommandExecutionRequestApprovalParams;
} | {
    "method": "item/fileChange/requestApproval";
    id: RequestId;
    params: FileChangeRequestApprovalParams;
} | {
    "method": "item/tool/requestUserInput";
    id: RequestId;
    params: ToolRequestUserInputParams;
} | {
    "method": "mcpServer/elicitation/request";
    id: RequestId;
    params: McpServerElicitationRequestParams;
} | {
    "method": "item/permissions/requestApproval";
    id: RequestId;
    params: PermissionsRequestApprovalParams;
} | {
    "method": "item/tool/call";
    id: RequestId;
    params: DynamicToolCallParams;
} | {
    "method": "account/chatgptAuthTokens/refresh";
    id: RequestId;
    params: ChatgptAuthTokensRefreshParams;
} | {
    "method": "attestation/generate";
    id: RequestId;
    params: AttestationGenerateParams;
} | {
    "method": "applyPatchApproval";
    id: RequestId;
    params: ApplyPatchApprovalParams;
} | {
    "method": "execCommandApproval";
    id: RequestId;
    params: ExecCommandApprovalParams;
};

type ThreadMemoryMode = "enabled" | "disabled";

/**
 * Definition for a tool the client can call.
 */
type Tool = {
    name: string;
    title?: string;
    description?: string;
    inputSchema: JsonValue;
    outputSchema?: JsonValue;
    annotations?: JsonValue;
    icons?: Array<JsonValue>;
    _meta?: JsonValue;
};

/**
 * Controls output length/detail on GPT-5 models via the Responses API.
 * Serialized with lowercase values to match the OpenAI API.
 */
type Verbosity = "low" | "medium" | "high";

type WebSearchContextSize = "low" | "medium" | "high";

type WebSearchLocation = {
    country: string | null;
    region: string | null;
    city: string | null;
    timezone: string | null;
};

type WebSearchMode = "disabled" | "cached" | "indexed" | "live";

type WebSearchToolConfig = {
    context_size: WebSearchContextSize | null;
    allowed_domains: Array<string> | null;
    location: WebSearchLocation | null;
};

type AddCreditsNudgeEmailStatus = "sent" | "cooldown_active";

type AdditionalContextKind = "untrusted" | "application";

type AdditionalContextEntry = {
    value: string;
    kind: AdditionalContextKind;
};

type AdditionalPermissionProfile = {
    /**
     * Partial overlay used for per-command permission requests.
     */
    network: AdditionalNetworkPermissions | null;
    fileSystem: AdditionalFileSystemPermissions | null;
};

type AnalyticsConfig = {
    enabled: boolean | null;
} & ({
    [key in string]?: number | string | boolean | Array<JsonValue> | {
        [key in string]?: JsonValue;
    } | null;
});

/**
 * EXPERIMENTAL - app metadata summary for plugin responses.
 */
type AppSummary = {
    id: string;
    name: string;
    description: string | null;
    installUrl: string | null;
    category: string | null;
};

type AppTemplateUnavailableReason = "NOT_CONFIGURED_FOR_WORKSPACE" | "NO_ACTIVE_WORKSPACE";

type AppTemplateSummary = {
    templateId: string;
    name: string;
    description: string | null;
    category: string | null;
    canonicalConnectorId: string | null;
    logoUrl: string | null;
    logoUrlDark: string | null;
    materializedAppIds: Array<string>;
    reason: AppTemplateUnavailableReason | null;
};

type AppToolApproval = "auto" | "prompt" | "approve";

type AppToolsConfig = {
    [key in string]?: {
        enabled: boolean | null;
        approval_mode: AppToolApproval | null;
    };
};

type AppsDefaultConfig = {
    enabled: boolean;
    approvals_reviewer: ApprovalsReviewer | null;
    destructive_enabled: boolean;
    open_world_enabled: boolean;
    default_tools_approval_mode: AppToolApproval | null;
};

type AppsConfig = {
    _default: AppsDefaultConfig | null;
} & ({
    [key in string]?: {
        enabled: boolean;
        approvals_reviewer: ApprovalsReviewer | null;
        destructive_enabled: boolean | null;
        open_world_enabled: boolean | null;
        default_tools_approval_mode: AppToolApproval | null;
        default_tools_enabled: boolean | null;
        tools: AppToolsConfig | null;
    };
});

type AttestationGenerateResponse = {
    /**
     * Opaque client attestation token.
     */
    token: string;
};

/**
 * Location used to resolve a selected capability root.
 */
type CapabilityRootLocation = {
    "type": "environment";
    environmentId: string;
    path: string;
};

type ChatgptAuthTokensRefreshResponse = {
    accessToken: string;
    chatgptAccountId: string;
    chatgptPlanType: string | null;
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
 * Empty success response for `command/exec/resize`.
 */
type CommandExecResizeResponse = Record<string, never>;

/**
 * Final buffered result for `command/exec`.
 */
type CommandExecResponse = {
    /**
     * Process exit code.
     */
    exitCode: number;
    /**
     * Buffered stdout capture.
     *
     * Empty when stdout was streamed via `command/exec/outputDelta`.
     */
    stdout: string;
    /**
     * Buffered stderr capture.
     *
     * Empty when stderr was streamed via `command/exec/outputDelta`.
     */
    stderr: string;
};

/**
 * Empty success response for `command/exec/terminate`.
 */
type CommandExecTerminateResponse = Record<string, never>;

/**
 * Empty success response for `command/exec/write`.
 */
type CommandExecWriteResponse = Record<string, never>;

type CommandExecutionApprovalDecision = "accept" | "acceptForSession" | {
    "acceptWithExecpolicyAmendment": {
        execpolicy_amendment: ExecPolicyAmendment;
    };
} | {
    "applyNetworkPolicyAmendment": {
        network_policy_amendment: NetworkPolicyAmendment;
    };
} | "decline" | "cancel";

type CommandExecutionRequestApprovalResponse = {
    decision: CommandExecutionApprovalDecision;
};

type ComputerUseRequirements = {
    allowLockedComputerUse: boolean | null;
};

/**
 * Backward-compatible API shape for ChatGPT workspace login restrictions.
 */
type ForcedChatgptWorkspaceIds = string | Array<string>;

type SandboxWorkspaceWrite = {
    writable_roots: Array<string>;
    network_access: boolean;
    exclude_tmpdir_env_var: boolean;
    exclude_slash_tmp: boolean;
};

type ToolsV2 = {
    web_search: WebSearchToolConfig | null;
};

type Config = {
    model: string | null;
    review_model: string | null;
    model_context_window: bigint | null;
    model_auto_compact_token_limit: bigint | null;
    model_auto_compact_token_limit_scope: AutoCompactTokenLimitScope | null;
    model_provider: string | null;
    approval_policy: AskForApproval | null; /**
     * [UNSTABLE] Optional default for where approval requests are routed for
     * review.
     */
    approvals_reviewer: ApprovalsReviewer | null;
    sandbox_mode: SandboxMode | null;
    sandbox_workspace_write: SandboxWorkspaceWrite | null;
    forced_chatgpt_workspace_id: ForcedChatgptWorkspaceIds | null;
    forced_login_method: ForcedLoginMethod | null;
    web_search: WebSearchMode | null;
    tools: ToolsV2 | null;
    instructions: string | null;
    developer_instructions: string | null;
    compact_prompt: string | null;
    model_reasoning_effort: ReasoningEffort | null;
    model_reasoning_summary: ReasoningSummary | null;
    model_verbosity: Verbosity | null;
    service_tier: string | null;
    analytics: AnalyticsConfig | null;
    desktop: {
        [key in string]?: JsonValue;
    } | null;
} & ({
    [key in string]?: number | string | boolean | Array<JsonValue> | {
        [key in string]?: JsonValue;
    } | null;
});

type ConfigLayerSource = {
    "type": "mdm";
    domain: string;
    key: string;
} | {
    "type": "system";
    /**
     * This is the path to the system config.toml file, though it is not
     * guaranteed to exist.
     */
    file: AbsolutePathBuf;
} | {
    "type": "enterpriseManaged";
    /**
     * Stable identifier for the delivered layer.
     */
    id: string;
    /**
     * Admin-facing name for the delivered layer. This is surfaced in
     * diagnostics so users know which cloud layer needs administrator
     * attention.
     */
    name: string;
} | {
    "type": "user";
    /**
     * This is the path to the user's config.toml file, though it is not
     * guaranteed to exist.
     */
    file: AbsolutePathBuf;
    /**
     * Name of the selected profile-v2 config layered on top of the base
     * user config, when this layer represents one.
     */
    profile: string | null;
} | {
    "type": "project";
    dotCodexFolder: AbsolutePathBuf;
} | {
    "type": "sessionFlags";
} | {
    "type": "legacyManagedConfigTomlFromFile";
    file: AbsolutePathBuf;
} | {
    "type": "legacyManagedConfigTomlFromMdm";
};

type ConfigLayer = {
    name: ConfigLayerSource;
    version: string;
    config: JsonValue;
    disabledReason: string | null;
};

type ConfigLayerMetadata = {
    name: ConfigLayerSource;
    version: string;
};

type ConfigReadResponse = {
    config: Config;
    origins: {
        [key in string]?: ConfigLayerMetadata;
    };
    layers: Array<ConfigLayer> | null;
};

type ResidencyRequirement = "us";

type ConfigRequirements = {
    allowedApprovalPolicies: Array<AskForApproval> | null;
    allowedSandboxModes: Array<SandboxMode> | null;
    allowedWindowsSandboxImplementations: Array<WindowsSandboxSetupMode> | null;
    allowedPermissionProfiles: {
        [key in string]?: boolean;
    } | null;
    defaultPermissions: string | null;
    allowedWebSearchModes: Array<WebSearchMode> | null;
    allowManagedHooksOnly: boolean | null;
    allowAppshots: boolean | null;
    allowRemoteControl: boolean | null;
    computerUse: ComputerUseRequirements | null;
    featureRequirements: {
        [key in string]?: boolean;
    } | null;
    enforceResidency: ResidencyRequirement | null;
};

type ConfigRequirementsReadResponse = {
    /**
     * Null if no requirements are configured (e.g. no requirements.toml/MDM entries).
     */
    requirements: ConfigRequirements | null;
};

type OverriddenMetadata = {
    message: string;
    overridingLayer: ConfigLayerMetadata;
    effectiveValue: JsonValue;
};

type WriteStatus = "ok" | "okOverridden";

type ConfigWriteResponse = {
    status: WriteStatus;
    version: string;
    /**
     * Canonical path to the config file that was written.
     */
    filePath: AbsolutePathBuf;
    overriddenMetadata: OverriddenMetadata | null;
};

type ConfiguredHookHandler = {
    "type": "command";
    command: string;
    commandWindows: string | null;
    timeoutSec: bigint | null;
    async: boolean;
    statusMessage: string | null;
} | {
    "type": "prompt";
} | {
    "type": "agent";
};

type ConfiguredHookMatcherGroup = {
    matcher: string | null;
    hooks: Array<ConfiguredHookHandler>;
};

type ConsumeAccountRateLimitResetCreditOutcome = "reset" | "nothingToReset" | "noCredit" | "alreadyRedeemed";

type ConsumeAccountRateLimitResetCreditResponse = {
    outcome: ConsumeAccountRateLimitResetCreditOutcome;
};

type DynamicToolCallResponse = {
    contentItems: Array<DynamicToolCallOutputContentItem>;
    success: boolean;
};

type DynamicToolFunctionSpec = {
    name: string;
    description: string;
    inputSchema: JsonValue;
    deferLoading?: boolean;
};

type DynamicToolNamespaceTool = {
    "type": "function";
} & DynamicToolFunctionSpec;

type DynamicToolNamespaceSpec = {
    name: string;
    description: string;
    tools: Array<DynamicToolNamespaceTool>;
};

type DynamicToolSpec = {
    "type": "function";
} & DynamicToolFunctionSpec | {
    "type": "namespace";
} & DynamicToolNamespaceSpec;

type ExperimentalFeatureStage = "beta" | "underDevelopment" | "stable" | "deprecated" | "removed";

type ExperimentalFeature = {
    /**
     * Stable key used in config.toml and CLI flag toggles.
     */
    name: string;
    /**
     * Lifecycle stage of this feature flag.
     */
    stage: ExperimentalFeatureStage;
    /**
     * User-facing display name shown in the experimental features UI.
     * Null when this feature is not in beta.
     */
    displayName: string | null;
    /**
     * Short summary describing what the feature does.
     * Null when this feature is not in beta.
     */
    description: string | null;
    /**
     * Announcement copy shown to users when the feature is introduced.
     * Null when this feature is not in beta.
     */
    announcement: string | null;
    /**
     * Whether this feature is currently enabled in the loaded config.
     */
    enabled: boolean;
    /**
     * Whether this feature is enabled by default.
     */
    defaultEnabled: boolean;
};

type ExperimentalFeatureEnablementSetResponse = {
    /**
     * Feature enablement entries updated by this request.
     */
    enablement: {
        [key in string]?: boolean;
    };
};

type ExperimentalFeatureListResponse = {
    data: Array<ExperimentalFeature>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * If None, there are no more items to return.
     */
    nextCursor: string | null;
};

type ExternalAgentConfigDetectResponse = {
    items: Array<ExternalAgentConfigMigrationItem>;
};

type ExternalAgentConfigImportHistory = {
    importId: string;
    completedAtMs: bigint;
    successes: Array<ExternalAgentConfigImportItemTypeSuccess>;
    failures: Array<ExternalAgentConfigImportItemTypeFailure>;
};

type ExternalAgentConfigImportHistoriesReadResponse = {
    data: Array<ExternalAgentConfigImportHistory>;
};

type ExternalAgentConfigImportResponse = {
    importId: string;
};

type FeedbackUploadResponse = {
    threadId: string;
};

type FileChangeApprovalDecision = "accept" | "acceptForSession" | "decline" | "cancel";

type FileChangeRequestApprovalResponse = {
    decision: FileChangeApprovalDecision;
};

/**
 * Successful response for `fs/copy`.
 */
type FsCopyResponse = Record<string, never>;

/**
 * Successful response for `fs/createDirectory`.
 */
type FsCreateDirectoryResponse = Record<string, never>;

/**
 * Metadata returned by `fs/getMetadata`.
 */
type FsGetMetadataResponse = {
    /**
     * Whether the path resolves to a directory.
     */
    isDirectory: boolean;
    /**
     * Whether the path resolves to a regular file.
     */
    isFile: boolean;
    /**
     * Whether the path itself is a symbolic link.
     */
    isSymlink: boolean;
    /**
     * File creation time in Unix milliseconds when available, otherwise `0`.
     */
    createdAtMs: number;
    /**
     * File modification time in Unix milliseconds when available, otherwise `0`.
     */
    modifiedAtMs: number;
};

/**
 * A directory entry returned by `fs/readDirectory`.
 */
type FsReadDirectoryEntry = {
    /**
     * Direct child entry name only, not an absolute or relative path.
     */
    fileName: string;
    /**
     * Whether this entry resolves to a directory.
     */
    isDirectory: boolean;
    /**
     * Whether this entry resolves to a regular file.
     */
    isFile: boolean;
};

/**
 * Directory entries returned by `fs/readDirectory`.
 */
type FsReadDirectoryResponse = {
    /**
     * Direct child entries in the requested directory.
     */
    entries: Array<FsReadDirectoryEntry>;
};

/**
 * Base64-encoded file contents returned by `fs/readFile`.
 */
type FsReadFileResponse = {
    /**
     * File contents encoded as base64.
     */
    dataBase64: string;
};

/**
 * Successful response for `fs/remove`.
 */
type FsRemoveResponse = Record<string, never>;

/**
 * Successful response for `fs/unwatch`.
 */
type FsUnwatchResponse = Record<string, never>;

/**
 * Successful response for `fs/watch`.
 */
type FsWatchResponse = {
    /**
     * Canonicalized path associated with the watch.
     */
    path: AbsolutePathBuf;
};

/**
 * Successful response for `fs/writeFile`.
 */
type FsWriteFileResponse = Record<string, never>;

type GrantedPermissionProfile = {
    network?: AdditionalNetworkPermissions;
    fileSystem?: AdditionalFileSystemPermissions;
};

type McpAuthStatus = "unsupported" | "notLoggedIn" | "bearerToken" | "oAuth";

type McpServerStatus = {
    name: string;
    serverInfo: McpServerInfo | null;
    tools: {
        [key in string]?: Tool;
    };
    resources: Array<Resource>;
    resourceTemplates: Array<ResourceTemplate>;
    authStatus: McpAuthStatus;
};

type ListMcpServerStatusResponse = {
    data: Array<McpServerStatus>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * If None, there are no more items to return.
     */
    nextCursor: string | null;
};

type ManagedHooksRequirements = {
    managedDir: string | null;
    windowsManagedDir: string | null;
    PreToolUse: Array<ConfiguredHookMatcherGroup>;
    PermissionRequest: Array<ConfiguredHookMatcherGroup>;
    PostToolUse: Array<ConfiguredHookMatcherGroup>;
    PreCompact: Array<ConfiguredHookMatcherGroup>;
    PostCompact: Array<ConfiguredHookMatcherGroup>;
    SessionStart: Array<ConfiguredHookMatcherGroup>;
    UserPromptSubmit: Array<ConfiguredHookMatcherGroup>;
    SubagentStart: Array<ConfiguredHookMatcherGroup>;
    SubagentStop: Array<ConfiguredHookMatcherGroup>;
    Stop: Array<ConfiguredHookMatcherGroup>;
};

type MarketplaceAddResponse = {
    marketplaceName: string;
    installedRoot: AbsolutePathBuf;
    alreadyAdded: boolean;
};

type MarketplaceInterface = {
    displayName: string | null;
};

type MarketplaceLoadErrorInfo = {
    marketplacePath: AbsolutePathBuf;
    message: string;
};

type MarketplaceRemoveResponse = {
    marketplaceName: string;
    installedRoot: AbsolutePathBuf | null;
};

type MarketplaceUpgradeErrorInfo = {
    marketplaceName: string;
    message: string;
};

type MarketplaceUpgradeResponse = {
    selectedMarketplaces: Array<string>;
    upgradedRoots: Array<AbsolutePathBuf>;
    errors: Array<MarketplaceUpgradeErrorInfo>;
};

type McpResourceReadResponse = {
    contents: Array<ResourceContent>;
};

type McpServerElicitationAction = "accept" | "decline" | "cancel";

type McpServerElicitationRequestResponse = {
    action: McpServerElicitationAction;
    /**
     * Structured user input for accepted elicitations, mirroring RMCP `CreateElicitationResult`.
     *
     * This is nullable because decline/cancel responses have no content.
     */
    content: JsonValue | null;
    /**
     * Optional client metadata for form-mode action handling.
     */
    _meta: JsonValue | null;
};

type McpServerOauthLoginResponse = {
    authorizationUrl: string;
};

type McpServerRefreshResponse = Record<string, never>;

type McpServerToolCallResponse = {
    content: Array<JsonValue>;
    structuredContent?: JsonValue;
    isError?: boolean;
    _meta?: JsonValue;
};

type ModelProviderCapabilitiesReadResponse = {
    namespaceTools: boolean;
    imageGeneration: boolean;
    webSearch: boolean;
};

type NetworkDomainPermission = "allow" | "deny";

type NetworkUnixSocketPermission = "allow" | "deny";

type NetworkRequirements = {
    enabled: boolean | null;
    httpPort: number | null;
    socksPort: number | null;
    allowUpstreamProxy: boolean | null;
    dangerouslyAllowNonLoopbackProxy: boolean | null;
    dangerouslyAllowAllUnixSockets: boolean | null;
    /**
     * Canonical network permission map for `experimental_network`.
     */
    domains: {
        [key in string]?: NetworkDomainPermission;
    } | null;
    /**
     * When true, only managed allowlist entries are respected while managed
     * network enforcement is active.
     */
    managedAllowedDomainsOnly: boolean | null;
    /**
     * Legacy compatibility view derived from `domains`.
     */
    allowedDomains: Array<string> | null;
    /**
     * Legacy compatibility view derived from `domains`.
     */
    deniedDomains: Array<string> | null;
    /**
     * Canonical unix socket permission map for `experimental_network`.
     */
    unixSockets: {
        [key in string]?: NetworkUnixSocketPermission;
    } | null;
    /**
     * Legacy compatibility view derived from `unix_sockets`.
     */
    allowUnixSockets: Array<string> | null;
    allowLocalBinding: boolean | null;
};

type PermissionGrantScope = "turn" | "session";

type PermissionProfileSummary = {
    /**
     * Available permission profile identifier.
     */
    id: string;
    /**
     * Optional user-facing description for display in clients.
     */
    description: string | null;
};

type PermissionProfileListResponse = {
    data: Array<PermissionProfileSummary>;
    /**
     * Opaque cursor to pass to the next call to continue after the last item.
     * If None, there are no more items to return.
     */
    nextCursor: string | null;
};

type PermissionsRequestApprovalResponse = {
    permissions: GrantedPermissionProfile;
    scope: PermissionGrantScope;
    /**
     * Review every subsequent command in this turn before normal sandboxed execution.
     */
    strictAutoReview?: boolean;
};

type PluginAuthPolicy = "ON_INSTALL" | "ON_USE";

type PluginAvailability = "AVAILABLE" | "DISABLED_BY_ADMIN";

type PluginHookSummary = {
    key: string;
    eventName: HookEventName;
};

type PluginInstallPolicy = "NOT_AVAILABLE" | "AVAILABLE" | "INSTALLED_BY_DEFAULT";

type PluginInterface = {
    displayName: string | null;
    shortDescription: string | null;
    longDescription: string | null;
    developerName: string | null;
    category: string | null;
    capabilities: Array<string>;
    websiteUrl: string | null;
    privacyPolicyUrl: string | null;
    termsOfServiceUrl: string | null;
    /**
     * Starter prompts for the plugin. Capped at 3 entries with a maximum of
     * 128 characters per entry.
     */
    defaultPrompt: Array<string> | null;
    brandColor: string | null;
    /**
     * Local composer icon path, resolved from the installed plugin package.
     */
    composerIcon: AbsolutePathBuf | null;
    /**
     * Remote composer icon URL from the plugin catalog.
     */
    composerIconUrl: string | null;
    /**
     * Local logo path, resolved from the installed plugin package.
     */
    logo: AbsolutePathBuf | null;
    /**
     * Remote logo URL from the plugin catalog.
     */
    logoUrl: string | null;
    /**
     * Local screenshot paths, resolved from the installed plugin package.
     */
    screenshots: Array<AbsolutePathBuf>;
    /**
     * Remote screenshot URLs from the plugin catalog.
     */
    screenshotUrls: Array<string>;
};

type PluginSharePrincipalRole = "reader" | "editor" | "owner";

type PluginSharePrincipal = {
    principalType: PluginSharePrincipalType;
    principalId: string;
    role: PluginSharePrincipalRole;
    name: string;
};

type PluginShareContext = {
    remotePluginId: string;
    /**
     * Version of the remote shared plugin release when available.
     */
    remoteVersion: string | null;
    discoverability: PluginShareDiscoverability | null;
    shareUrl: string | null;
    creatorAccountUserId: string | null;
    creatorName: string | null;
    sharePrincipals: Array<PluginSharePrincipal> | null;
};

type PluginSource = {
    "type": "local";
    path: AbsolutePathBuf;
} | {
    "type": "git";
    url: string;
    path: string | null;
    refName: string | null;
    sha: string | null;
} | {
    "type": "remote";
};

type PluginSummary = {
    id: string;
    /**
     * Backend remote plugin identifier when available.
     */
    remotePluginId: string | null;
    /**
     * Version of the locally materialized plugin package when available.
     */
    localVersion: string | null;
    name: string;
    /**
     * Remote sharing context associated with this plugin when available.
     */
    shareContext: PluginShareContext | null;
    source: PluginSource;
    installed: boolean;
    enabled: boolean;
    installPolicy: PluginInstallPolicy;
    authPolicy: PluginAuthPolicy;
    /**
     * Availability state for installing and using the plugin.
     */
    availability: PluginAvailability;
    interface: PluginInterface | null;
    keywords: Array<string>;
};

type SkillSummary = {
    name: string;
    description: string;
    shortDescription: string | null;
    interface: SkillInterface | null;
    path: AbsolutePathBuf | null;
    enabled: boolean;
};

type PluginDetail = {
    marketplaceName: string;
    marketplacePath: AbsolutePathBuf | null;
    summary: PluginSummary;
    shareUrl: string | null;
    description: string | null;
    skills: Array<SkillSummary>;
    hooks: Array<PluginHookSummary>;
    apps: Array<AppSummary>;
    appTemplates: Array<AppTemplateSummary>;
    mcpServers: Array<string>;
};

type PluginInstallResponse = {
    authPolicy: PluginAuthPolicy;
    appsNeedingAuth: Array<AppSummary>;
};

type PluginMarketplaceEntry = {
    name: string;
    /**
     * Local marketplace file path when the marketplace is backed by a local file.
     * Remote-only catalog marketplaces do not have a local path.
     */
    path: AbsolutePathBuf | null;
    interface: MarketplaceInterface | null;
    plugins: Array<PluginSummary>;
};

type PluginInstalledResponse = {
    marketplaces: Array<PluginMarketplaceEntry>;
    marketplaceLoadErrors: Array<MarketplaceLoadErrorInfo>;
};

type PluginListResponse = {
    marketplaces: Array<PluginMarketplaceEntry>;
    marketplaceLoadErrors: Array<MarketplaceLoadErrorInfo>;
    featuredPluginIds: Array<string>;
};

type PluginReadResponse = {
    plugin: PluginDetail;
};

type PluginShareCheckoutResponse = {
    remotePluginId: string;
    pluginId: string;
    pluginName: string;
    pluginPath: AbsolutePathBuf;
    marketplaceName: string;
    marketplacePath: AbsolutePathBuf;
    remoteVersion: string | null;
};

type PluginShareDeleteResponse = Record<string, never>;

type PluginShareListItem = {
    plugin: PluginSummary;
    localPluginPath: AbsolutePathBuf | null;
};

type PluginShareListResponse = {
    data: Array<PluginShareListItem>;
};

type PluginShareSaveResponse = {
    remotePluginId: string;
    shareUrl: string;
};

type PluginShareUpdateTargetsResponse = {
    principals: Array<PluginSharePrincipal>;
    discoverability: PluginShareDiscoverability;
};

type PluginSkillReadResponse = {
    contents: string | null;
};

type PluginUninstallResponse = Record<string, never>;

/**
 * PTY size in character cells for `process/spawn` PTY sessions.
 */
type ProcessTerminalSize = {
    /**
     * Terminal height in character cells.
     */
    rows: number;
    /**
     * Terminal width in character cells.
     */
    cols: number;
};

type RemoteControlDisableParams = {
    ephemeral?: boolean;
};

type RemoteControlEnableParams = {
    ephemeral?: boolean;
};

type ReviewStartResponse = {
    turn: Turn;
    /**
     * Identifies the thread where the review runs.
     *
     * For inline reviews, this is the original thread id.
     * For detached reviews, this is the id of the new review thread.
     */
    reviewThreadId: string;
};

/**
 * A user-selected root that can expose one or more runtime capabilities.
 */
type SelectedCapabilityRoot = {
    /**
     * Stable identifier supplied by the capability selection platform.
     */
    id: string;
    /**
     * Where the selected root can be resolved.
     */
    location: CapabilityRootLocation;
};

type SendAddCreditsNudgeEmailResponse = {
    status: AddCreditsNudgeEmailStatus;
};

type SkillsExtraRootsSetResponse = Record<string, never>;

type ThreadApproveGuardianDeniedActionResponse = Record<string, never>;

type ThreadDeleteResponse = Record<string, never>;

type ThreadGoalClearResponse = {
    cleared: boolean;
};

type ThreadGoalGetResponse = {
    goal: ThreadGoal | null;
};

type ThreadGoalSetResponse = {
    goal: ThreadGoal;
};

/**
 * EXPERIMENTAL - transport used by thread realtime.
 */
type ThreadRealtimeStartTransport = {
    "type": "websocket";
} | {
    "type": "webrtc";
    /**
     * SDP offer generated by a WebRTC RTCPeerConnection after configuring audio and the
     * realtime events data channel.
     */
    sdp: string;
};

type ThreadResumeInitialTurnsPageParams = {
    /**
     * Optional turn page size.
     */
    limit?: number | null;
    /**
     * Optional turn pagination direction; defaults to descending.
     */
    sortDirection?: SortDirection | null;
    /**
     * How much item detail to include for each returned turn; defaults to summary.
     */
    itemsView?: TurnItemsView | null;
};

type ThreadSearchResult = {
    thread: Thread;
    snippet: string;
};

type ThreadShellCommandResponse = Record<string, never>;

/**
 * EXPERIMENTAL. Captures a user's answer to a request_user_input question.
 */
type ToolRequestUserInputAnswer = {
    answers: Array<string>;
};

/**
 * EXPERIMENTAL. Response payload mapping question ids to answers.
 */
type ToolRequestUserInputResponse = {
    answers: {
        [key in string]?: ToolRequestUserInputAnswer;
    };
};

type TurnEnvironmentParams = {
    environmentId: string;
    cwd: LegacyAppPathString;
};

type TurnsPage = {
    data: Array<Turn>;
    nextCursor: string | null;
    backwardsCursor: string | null;
};

type WindowsSandboxReadiness = "ready" | "notConfigured" | "updateRequired";

type WindowsSandboxReadinessResponse = {
    status: WindowsSandboxReadiness;
};

type WindowsSandboxSetupStartResponse = {
    started: boolean;
};

declare const index$1_Account: typeof Account;
type index$1_AccountLoginCompletedNotification = AccountLoginCompletedNotification;
type index$1_AccountRateLimitsUpdatedNotification = AccountRateLimitsUpdatedNotification;
declare const index$1_AccountTokenUsageDailyBucket: typeof AccountTokenUsageDailyBucket;
declare const index$1_AccountTokenUsageSummary: typeof AccountTokenUsageSummary;
type index$1_AccountUpdatedNotification = AccountUpdatedNotification;
type index$1_ActivePermissionProfile = ActivePermissionProfile;
declare const index$1_AddCreditsNudgeCreditType: typeof AddCreditsNudgeCreditType;
type index$1_AddCreditsNudgeEmailStatus = AddCreditsNudgeEmailStatus;
type index$1_AdditionalContextEntry = AdditionalContextEntry;
type index$1_AdditionalContextKind = AdditionalContextKind;
type index$1_AdditionalFileSystemPermissions = AdditionalFileSystemPermissions;
type index$1_AdditionalNetworkPermissions = AdditionalNetworkPermissions;
type index$1_AdditionalPermissionProfile = AdditionalPermissionProfile;
type index$1_AgentMessageDeltaNotification = AgentMessageDeltaNotification;
type index$1_AnalyticsConfig = AnalyticsConfig;
declare const index$1_AppBranding: typeof AppBranding;
declare const index$1_AppInfo: typeof AppInfo;
type index$1_AppListUpdatedNotification = AppListUpdatedNotification;
declare const index$1_AppMetadata: typeof AppMetadata;
declare const index$1_AppReview: typeof AppReview;
declare const index$1_AppScreenshot: typeof AppScreenshot;
type index$1_AppSummary = AppSummary;
type index$1_AppTemplateSummary = AppTemplateSummary;
type index$1_AppTemplateUnavailableReason = AppTemplateUnavailableReason;
type index$1_AppToolApproval = AppToolApproval;
type index$1_AppToolsConfig = AppToolsConfig;
declare const index$1_ApprovalsReviewer: typeof ApprovalsReviewer;
type index$1_AppsConfig = AppsConfig;
type index$1_AppsDefaultConfig = AppsDefaultConfig;
declare const index$1_AppsListResponse: typeof AppsListResponse;
declare const index$1_AskForApproval: typeof AskForApproval;
type index$1_AttestationGenerateParams = AttestationGenerateParams;
type index$1_AttestationGenerateResponse = AttestationGenerateResponse;
type index$1_AutoReviewDecisionSource = AutoReviewDecisionSource;
declare const index$1_ByteRange: typeof ByteRange;
declare const index$1_CancelLoginAccountParams: typeof CancelLoginAccountParams;
declare const index$1_CancelLoginAccountResponse: typeof CancelLoginAccountResponse;
declare const index$1_CancelLoginAccountStatus: typeof CancelLoginAccountStatus;
type index$1_CapabilityRootLocation = CapabilityRootLocation;
type index$1_ChatgptAuthTokensRefreshParams = ChatgptAuthTokensRefreshParams;
type index$1_ChatgptAuthTokensRefreshReason = ChatgptAuthTokensRefreshReason;
type index$1_ChatgptAuthTokensRefreshResponse = ChatgptAuthTokensRefreshResponse;
declare const index$1_CodexErrorInfo: typeof CodexErrorInfo;
declare const index$1_CollabAgentState: typeof CollabAgentState;
declare const index$1_CollabAgentStatus: typeof CollabAgentStatus;
declare const index$1_CollabAgentTool: typeof CollabAgentTool;
declare const index$1_CollabAgentToolCallStatus: typeof CollabAgentToolCallStatus;
type index$1_CollaborationModeMask = CollaborationModeMask;
declare const index$1_CommandAction: typeof CommandAction;
type index$1_CommandExecOutputDeltaNotification = CommandExecOutputDeltaNotification;
type index$1_CommandExecOutputStream = CommandExecOutputStream;
declare const index$1_CommandExecParams: typeof CommandExecParams;
declare const index$1_CommandExecResizeParams: typeof CommandExecResizeParams;
type index$1_CommandExecResizeResponse = CommandExecResizeResponse;
type index$1_CommandExecResponse = CommandExecResponse;
declare const index$1_CommandExecTerminalSize: typeof CommandExecTerminalSize;
declare const index$1_CommandExecTerminateParams: typeof CommandExecTerminateParams;
type index$1_CommandExecTerminateResponse = CommandExecTerminateResponse;
declare const index$1_CommandExecWriteParams: typeof CommandExecWriteParams;
type index$1_CommandExecWriteResponse = CommandExecWriteResponse;
type index$1_CommandExecutionApprovalDecision = CommandExecutionApprovalDecision;
type index$1_CommandExecutionOutputDeltaNotification = CommandExecutionOutputDeltaNotification;
type index$1_CommandExecutionRequestApprovalParams = CommandExecutionRequestApprovalParams;
type index$1_CommandExecutionRequestApprovalResponse = CommandExecutionRequestApprovalResponse;
declare const index$1_CommandExecutionSource: typeof CommandExecutionSource;
declare const index$1_CommandExecutionStatus: typeof CommandExecutionStatus;
declare const index$1_CommandMigration: typeof CommandMigration;
type index$1_ComputerUseRequirements = ComputerUseRequirements;
type index$1_Config = Config;
declare const index$1_ConfigBatchWriteParams: typeof ConfigBatchWriteParams;
declare const index$1_ConfigEdit: typeof ConfigEdit;
type index$1_ConfigLayer = ConfigLayer;
type index$1_ConfigLayerMetadata = ConfigLayerMetadata;
type index$1_ConfigLayerSource = ConfigLayerSource;
declare const index$1_ConfigReadParams: typeof ConfigReadParams;
type index$1_ConfigReadResponse = ConfigReadResponse;
type index$1_ConfigRequirements = ConfigRequirements;
type index$1_ConfigRequirementsReadResponse = ConfigRequirementsReadResponse;
declare const index$1_ConfigValueWriteParams: typeof ConfigValueWriteParams;
type index$1_ConfigWarningNotification = ConfigWarningNotification;
type index$1_ConfigWriteResponse = ConfigWriteResponse;
type index$1_ConfiguredHookHandler = ConfiguredHookHandler;
type index$1_ConfiguredHookMatcherGroup = ConfiguredHookMatcherGroup;
type index$1_ConsumeAccountRateLimitResetCreditOutcome = ConsumeAccountRateLimitResetCreditOutcome;
declare const index$1_ConsumeAccountRateLimitResetCreditParams: typeof ConsumeAccountRateLimitResetCreditParams;
type index$1_ConsumeAccountRateLimitResetCreditResponse = ConsumeAccountRateLimitResetCreditResponse;
type index$1_ContextCompactedNotification = ContextCompactedNotification;
declare const index$1_CreditsSnapshot: typeof CreditsSnapshot;
type index$1_DeprecationNoticeNotification = DeprecationNoticeNotification;
declare const index$1_DynamicToolCallOutputContentItem: typeof DynamicToolCallOutputContentItem;
type index$1_DynamicToolCallParams = DynamicToolCallParams;
type index$1_DynamicToolCallResponse = DynamicToolCallResponse;
declare const index$1_DynamicToolCallStatus: typeof DynamicToolCallStatus;
type index$1_DynamicToolFunctionSpec = DynamicToolFunctionSpec;
type index$1_DynamicToolNamespaceSpec = DynamicToolNamespaceSpec;
type index$1_DynamicToolNamespaceTool = DynamicToolNamespaceTool;
type index$1_DynamicToolSpec = DynamicToolSpec;
type index$1_ErrorNotification = ErrorNotification;
type index$1_ExecPolicyAmendment = ExecPolicyAmendment;
type index$1_ExperimentalFeature = ExperimentalFeature;
declare const index$1_ExperimentalFeatureEnablementSetParams: typeof ExperimentalFeatureEnablementSetParams;
type index$1_ExperimentalFeatureEnablementSetResponse = ExperimentalFeatureEnablementSetResponse;
declare const index$1_ExperimentalFeatureListParams: typeof ExperimentalFeatureListParams;
type index$1_ExperimentalFeatureListResponse = ExperimentalFeatureListResponse;
type index$1_ExperimentalFeatureStage = ExperimentalFeatureStage;
declare const index$1_ExternalAgentConfigDetectParams: typeof ExternalAgentConfigDetectParams;
type index$1_ExternalAgentConfigDetectResponse = ExternalAgentConfigDetectResponse;
type index$1_ExternalAgentConfigImportCompletedNotification = ExternalAgentConfigImportCompletedNotification;
type index$1_ExternalAgentConfigImportHistoriesReadResponse = ExternalAgentConfigImportHistoriesReadResponse;
type index$1_ExternalAgentConfigImportHistory = ExternalAgentConfigImportHistory;
type index$1_ExternalAgentConfigImportItemTypeFailure = ExternalAgentConfigImportItemTypeFailure;
type index$1_ExternalAgentConfigImportItemTypeSuccess = ExternalAgentConfigImportItemTypeSuccess;
declare const index$1_ExternalAgentConfigImportParams: typeof ExternalAgentConfigImportParams;
type index$1_ExternalAgentConfigImportProgressNotification = ExternalAgentConfigImportProgressNotification;
type index$1_ExternalAgentConfigImportResponse = ExternalAgentConfigImportResponse;
type index$1_ExternalAgentConfigImportTypeResult = ExternalAgentConfigImportTypeResult;
declare const index$1_ExternalAgentConfigMigrationItem: typeof ExternalAgentConfigMigrationItem;
declare const index$1_ExternalAgentConfigMigrationItemType: typeof ExternalAgentConfigMigrationItemType;
declare const index$1_FeedbackUploadParams: typeof FeedbackUploadParams;
type index$1_FeedbackUploadResponse = FeedbackUploadResponse;
type index$1_FileChangeApprovalDecision = FileChangeApprovalDecision;
type index$1_FileChangeOutputDeltaNotification = FileChangeOutputDeltaNotification;
type index$1_FileChangePatchUpdatedNotification = FileChangePatchUpdatedNotification;
type index$1_FileChangeRequestApprovalParams = FileChangeRequestApprovalParams;
type index$1_FileChangeRequestApprovalResponse = FileChangeRequestApprovalResponse;
type index$1_FileSystemAccessMode = FileSystemAccessMode;
type index$1_FileSystemPath = FileSystemPath;
type index$1_FileSystemSandboxEntry = FileSystemSandboxEntry;
type index$1_FileSystemSpecialPath = FileSystemSpecialPath;
declare const index$1_FileUpdateChange: typeof FileUpdateChange;
type index$1_ForcedChatgptWorkspaceIds = ForcedChatgptWorkspaceIds;
type index$1_FsChangedNotification = FsChangedNotification;
declare const index$1_FsCopyParams: typeof FsCopyParams;
type index$1_FsCopyResponse = FsCopyResponse;
declare const index$1_FsCreateDirectoryParams: typeof FsCreateDirectoryParams;
type index$1_FsCreateDirectoryResponse = FsCreateDirectoryResponse;
declare const index$1_FsGetMetadataParams: typeof FsGetMetadataParams;
type index$1_FsGetMetadataResponse = FsGetMetadataResponse;
type index$1_FsReadDirectoryEntry = FsReadDirectoryEntry;
declare const index$1_FsReadDirectoryParams: typeof FsReadDirectoryParams;
type index$1_FsReadDirectoryResponse = FsReadDirectoryResponse;
declare const index$1_FsReadFileParams: typeof FsReadFileParams;
type index$1_FsReadFileResponse = FsReadFileResponse;
declare const index$1_FsRemoveParams: typeof FsRemoveParams;
type index$1_FsRemoveResponse = FsRemoveResponse;
declare const index$1_FsUnwatchParams: typeof FsUnwatchParams;
type index$1_FsUnwatchResponse = FsUnwatchResponse;
declare const index$1_FsWatchParams: typeof FsWatchParams;
type index$1_FsWatchResponse = FsWatchResponse;
declare const index$1_FsWriteFileParams: typeof FsWriteFileParams;
type index$1_FsWriteFileResponse = FsWriteFileResponse;
declare const index$1_GetAccountParams: typeof GetAccountParams;
declare const index$1_GetAccountRateLimitsResponse: typeof GetAccountRateLimitsResponse;
declare const index$1_GetAccountResponse: typeof GetAccountResponse;
declare const index$1_GetAccountTokenUsageResponse: typeof GetAccountTokenUsageResponse;
declare const index$1_GitInfo: typeof GitInfo;
type index$1_GrantedPermissionProfile = GrantedPermissionProfile;
type index$1_GuardianApprovalReview = GuardianApprovalReview;
type index$1_GuardianApprovalReviewAction = GuardianApprovalReviewAction;
type index$1_GuardianApprovalReviewStatus = GuardianApprovalReviewStatus;
type index$1_GuardianCommandSource = GuardianCommandSource;
type index$1_GuardianRiskLevel = GuardianRiskLevel;
type index$1_GuardianUserAuthorization = GuardianUserAuthorization;
type index$1_GuardianWarningNotification = GuardianWarningNotification;
type index$1_HookCompletedNotification = HookCompletedNotification;
declare const index$1_HookErrorInfo: typeof HookErrorInfo;
declare const index$1_HookEventName: typeof HookEventName;
type index$1_HookExecutionMode = HookExecutionMode;
declare const index$1_HookHandlerType: typeof HookHandlerType;
declare const index$1_HookMetadata: typeof HookMetadata;
declare const index$1_HookMigration: typeof HookMigration;
type index$1_HookOutputEntry = HookOutputEntry;
type index$1_HookOutputEntryKind = HookOutputEntryKind;
declare const index$1_HookPromptFragment: typeof HookPromptFragment;
type index$1_HookRunStatus = HookRunStatus;
type index$1_HookRunSummary = HookRunSummary;
type index$1_HookScope = HookScope;
declare const index$1_HookSource: typeof HookSource;
type index$1_HookStartedNotification = HookStartedNotification;
declare const index$1_HookTrustStatus: typeof HookTrustStatus;
declare const index$1_HooksListEntry: typeof HooksListEntry;
declare const index$1_HooksListResponse: typeof HooksListResponse;
type index$1_ItemCompletedNotification = ItemCompletedNotification;
type index$1_ItemGuardianApprovalReviewCompletedNotification = ItemGuardianApprovalReviewCompletedNotification;
type index$1_ItemGuardianApprovalReviewStartedNotification = ItemGuardianApprovalReviewStartedNotification;
type index$1_ItemStartedNotification = ItemStartedNotification;
declare const index$1_ListMcpServerStatusParams: typeof ListMcpServerStatusParams;
type index$1_ListMcpServerStatusResponse = ListMcpServerStatusResponse;
declare const index$1_LoginAccountParams: typeof LoginAccountParams;
declare const index$1_LoginAccountResponse: typeof LoginAccountResponse;
declare const index$1_LogoutAccountResponse: typeof LogoutAccountResponse;
type index$1_ManagedHooksRequirements = ManagedHooksRequirements;
declare const index$1_MarketplaceAddParams: typeof MarketplaceAddParams;
type index$1_MarketplaceAddResponse = MarketplaceAddResponse;
type index$1_MarketplaceInterface = MarketplaceInterface;
type index$1_MarketplaceLoadErrorInfo = MarketplaceLoadErrorInfo;
declare const index$1_MarketplaceRemoveParams: typeof MarketplaceRemoveParams;
type index$1_MarketplaceRemoveResponse = MarketplaceRemoveResponse;
type index$1_MarketplaceUpgradeErrorInfo = MarketplaceUpgradeErrorInfo;
declare const index$1_MarketplaceUpgradeParams: typeof MarketplaceUpgradeParams;
type index$1_MarketplaceUpgradeResponse = MarketplaceUpgradeResponse;
type index$1_McpAuthStatus = McpAuthStatus;
type index$1_McpElicitationArrayType = McpElicitationArrayType;
type index$1_McpElicitationBooleanSchema = McpElicitationBooleanSchema;
type index$1_McpElicitationBooleanType = McpElicitationBooleanType;
type index$1_McpElicitationConstOption = McpElicitationConstOption;
type index$1_McpElicitationEnumSchema = McpElicitationEnumSchema;
type index$1_McpElicitationLegacyTitledEnumSchema = McpElicitationLegacyTitledEnumSchema;
type index$1_McpElicitationMultiSelectEnumSchema = McpElicitationMultiSelectEnumSchema;
type index$1_McpElicitationNumberSchema = McpElicitationNumberSchema;
type index$1_McpElicitationNumberType = McpElicitationNumberType;
type index$1_McpElicitationObjectType = McpElicitationObjectType;
type index$1_McpElicitationPrimitiveSchema = McpElicitationPrimitiveSchema;
type index$1_McpElicitationSchema = McpElicitationSchema;
type index$1_McpElicitationSingleSelectEnumSchema = McpElicitationSingleSelectEnumSchema;
type index$1_McpElicitationStringFormat = McpElicitationStringFormat;
type index$1_McpElicitationStringSchema = McpElicitationStringSchema;
type index$1_McpElicitationStringType = McpElicitationStringType;
type index$1_McpElicitationTitledEnumItems = McpElicitationTitledEnumItems;
type index$1_McpElicitationTitledMultiSelectEnumSchema = McpElicitationTitledMultiSelectEnumSchema;
type index$1_McpElicitationTitledSingleSelectEnumSchema = McpElicitationTitledSingleSelectEnumSchema;
type index$1_McpElicitationUntitledEnumItems = McpElicitationUntitledEnumItems;
type index$1_McpElicitationUntitledMultiSelectEnumSchema = McpElicitationUntitledMultiSelectEnumSchema;
type index$1_McpElicitationUntitledSingleSelectEnumSchema = McpElicitationUntitledSingleSelectEnumSchema;
declare const index$1_McpResourceReadParams: typeof McpResourceReadParams;
type index$1_McpResourceReadResponse = McpResourceReadResponse;
type index$1_McpServerElicitationAction = McpServerElicitationAction;
type index$1_McpServerElicitationRequestParams = McpServerElicitationRequestParams;
type index$1_McpServerElicitationRequestResponse = McpServerElicitationRequestResponse;
declare const index$1_McpServerMigration: typeof McpServerMigration;
type index$1_McpServerOauthLoginCompletedNotification = McpServerOauthLoginCompletedNotification;
declare const index$1_McpServerOauthLoginParams: typeof McpServerOauthLoginParams;
type index$1_McpServerOauthLoginResponse = McpServerOauthLoginResponse;
type index$1_McpServerRefreshResponse = McpServerRefreshResponse;
type index$1_McpServerStartupState = McpServerStartupState;
type index$1_McpServerStatus = McpServerStatus;
declare const index$1_McpServerStatusDetail: typeof McpServerStatusDetail;
type index$1_McpServerStatusUpdatedNotification = McpServerStatusUpdatedNotification;
declare const index$1_McpServerToolCallParams: typeof McpServerToolCallParams;
type index$1_McpServerToolCallResponse = McpServerToolCallResponse;
declare const index$1_McpToolCallAppContext: typeof McpToolCallAppContext;
declare const index$1_McpToolCallError: typeof McpToolCallError;
type index$1_McpToolCallProgressNotification = McpToolCallProgressNotification;
declare const index$1_McpToolCallResult: typeof McpToolCallResult;
declare const index$1_McpToolCallStatus: typeof McpToolCallStatus;
declare const index$1_MemoryCitation: typeof MemoryCitation;
declare const index$1_MemoryCitationEntry: typeof MemoryCitationEntry;
declare const index$1_MergeStrategy: typeof MergeStrategy;
declare const index$1_MigrationDetails: typeof MigrationDetails;
declare const index$1_Model: typeof Model;
declare const index$1_ModelAvailabilityNux: typeof ModelAvailabilityNux;
declare const index$1_ModelListParams: typeof ModelListParams;
declare const index$1_ModelListResponse: typeof ModelListResponse;
declare const index$1_ModelProviderCapabilitiesReadParams: typeof ModelProviderCapabilitiesReadParams;
type index$1_ModelProviderCapabilitiesReadResponse = ModelProviderCapabilitiesReadResponse;
type index$1_ModelRerouteReason = ModelRerouteReason;
type index$1_ModelReroutedNotification = ModelReroutedNotification;
declare const index$1_ModelServiceTier: typeof ModelServiceTier;
declare const index$1_ModelUpgradeInfo: typeof ModelUpgradeInfo;
type index$1_ModelVerification = ModelVerification;
type index$1_ModelVerificationNotification = ModelVerificationNotification;
declare const index$1_NetworkAccess: typeof NetworkAccess;
type index$1_NetworkApprovalContext = NetworkApprovalContext;
type index$1_NetworkApprovalProtocol = NetworkApprovalProtocol;
type index$1_NetworkDomainPermission = NetworkDomainPermission;
type index$1_NetworkPolicyAmendment = NetworkPolicyAmendment;
type index$1_NetworkPolicyRuleAction = NetworkPolicyRuleAction;
type index$1_NetworkRequirements = NetworkRequirements;
type index$1_NetworkUnixSocketPermission = NetworkUnixSocketPermission;
declare const index$1_NonSteerableTurnKind: typeof NonSteerableTurnKind;
type index$1_OverriddenMetadata = OverriddenMetadata;
declare const index$1_PatchApplyStatus: typeof PatchApplyStatus;
declare const index$1_PatchChangeKind: typeof PatchChangeKind;
type index$1_PermissionGrantScope = PermissionGrantScope;
declare const index$1_PermissionProfileListParams: typeof PermissionProfileListParams;
type index$1_PermissionProfileListResponse = PermissionProfileListResponse;
type index$1_PermissionProfileSummary = PermissionProfileSummary;
type index$1_PermissionsRequestApprovalParams = PermissionsRequestApprovalParams;
type index$1_PermissionsRequestApprovalResponse = PermissionsRequestApprovalResponse;
type index$1_PlanDeltaNotification = PlanDeltaNotification;
type index$1_PluginAuthPolicy = PluginAuthPolicy;
type index$1_PluginAvailability = PluginAvailability;
type index$1_PluginDetail = PluginDetail;
type index$1_PluginHookSummary = PluginHookSummary;
declare const index$1_PluginInstallParams: typeof PluginInstallParams;
type index$1_PluginInstallPolicy = PluginInstallPolicy;
type index$1_PluginInstallResponse = PluginInstallResponse;
declare const index$1_PluginInstalledParams: typeof PluginInstalledParams;
type index$1_PluginInstalledResponse = PluginInstalledResponse;
type index$1_PluginInterface = PluginInterface;
declare const index$1_PluginListMarketplaceKind: typeof PluginListMarketplaceKind;
declare const index$1_PluginListParams: typeof PluginListParams;
type index$1_PluginListResponse = PluginListResponse;
type index$1_PluginMarketplaceEntry = PluginMarketplaceEntry;
declare const index$1_PluginReadParams: typeof PluginReadParams;
type index$1_PluginReadResponse = PluginReadResponse;
declare const index$1_PluginShareCheckoutParams: typeof PluginShareCheckoutParams;
type index$1_PluginShareCheckoutResponse = PluginShareCheckoutResponse;
type index$1_PluginShareContext = PluginShareContext;
declare const index$1_PluginShareDeleteParams: typeof PluginShareDeleteParams;
type index$1_PluginShareDeleteResponse = PluginShareDeleteResponse;
declare const index$1_PluginShareDiscoverability: typeof PluginShareDiscoverability;
type index$1_PluginShareListItem = PluginShareListItem;
declare const index$1_PluginShareListParams: typeof PluginShareListParams;
type index$1_PluginShareListResponse = PluginShareListResponse;
type index$1_PluginSharePrincipal = PluginSharePrincipal;
type index$1_PluginSharePrincipalRole = PluginSharePrincipalRole;
declare const index$1_PluginSharePrincipalType: typeof PluginSharePrincipalType;
declare const index$1_PluginShareSaveParams: typeof PluginShareSaveParams;
type index$1_PluginShareSaveResponse = PluginShareSaveResponse;
declare const index$1_PluginShareTarget: typeof PluginShareTarget;
declare const index$1_PluginShareTargetRole: typeof PluginShareTargetRole;
declare const index$1_PluginShareUpdateDiscoverability: typeof PluginShareUpdateDiscoverability;
declare const index$1_PluginShareUpdateTargetsParams: typeof PluginShareUpdateTargetsParams;
type index$1_PluginShareUpdateTargetsResponse = PluginShareUpdateTargetsResponse;
declare const index$1_PluginSkillReadParams: typeof PluginSkillReadParams;
type index$1_PluginSkillReadResponse = PluginSkillReadResponse;
type index$1_PluginSource = PluginSource;
type index$1_PluginSummary = PluginSummary;
declare const index$1_PluginUninstallParams: typeof PluginUninstallParams;
type index$1_PluginUninstallResponse = PluginUninstallResponse;
declare const index$1_PluginsMigration: typeof PluginsMigration;
type index$1_ProcessExitedNotification = ProcessExitedNotification;
type index$1_ProcessOutputDeltaNotification = ProcessOutputDeltaNotification;
type index$1_ProcessOutputStream = ProcessOutputStream;
type index$1_ProcessTerminalSize = ProcessTerminalSize;
declare const index$1_RateLimitReachedType: typeof RateLimitReachedType;
declare const index$1_RateLimitResetCreditsSummary: typeof RateLimitResetCreditsSummary;
declare const index$1_RateLimitSnapshot: typeof RateLimitSnapshot;
declare const index$1_RateLimitWindow: typeof RateLimitWindow;
type index$1_RawResponseItemCompletedNotification = RawResponseItemCompletedNotification;
declare const index$1_ReasoningEffortOption: typeof ReasoningEffortOption;
type index$1_ReasoningSummaryPartAddedNotification = ReasoningSummaryPartAddedNotification;
type index$1_ReasoningSummaryTextDeltaNotification = ReasoningSummaryTextDeltaNotification;
type index$1_ReasoningTextDeltaNotification = ReasoningTextDeltaNotification;
type index$1_RemoteControlConnectionStatus = RemoteControlConnectionStatus;
type index$1_RemoteControlDisableParams = RemoteControlDisableParams;
type index$1_RemoteControlEnableParams = RemoteControlEnableParams;
type index$1_RemoteControlStatusChangedNotification = RemoteControlStatusChangedNotification;
type index$1_RequestPermissionProfile = RequestPermissionProfile;
type index$1_ResidencyRequirement = ResidencyRequirement;
declare const index$1_ReviewDelivery: typeof ReviewDelivery;
declare const index$1_ReviewStartParams: typeof ReviewStartParams;
type index$1_ReviewStartResponse = ReviewStartResponse;
declare const index$1_ReviewTarget: typeof ReviewTarget;
declare const index$1_SandboxMode: typeof SandboxMode;
declare const index$1_SandboxPolicy: typeof SandboxPolicy;
type index$1_SandboxWorkspaceWrite = SandboxWorkspaceWrite;
type index$1_SelectedCapabilityRoot = SelectedCapabilityRoot;
declare const index$1_SendAddCreditsNudgeEmailParams: typeof SendAddCreditsNudgeEmailParams;
type index$1_SendAddCreditsNudgeEmailResponse = SendAddCreditsNudgeEmailResponse;
type index$1_ServerRequestResolvedNotification = ServerRequestResolvedNotification;
declare const index$1_SessionMigration: typeof SessionMigration;
declare const index$1_SkillDependencies: typeof SkillDependencies;
declare const index$1_SkillErrorInfo: typeof SkillErrorInfo;
declare const index$1_SkillInterface: typeof SkillInterface;
declare const index$1_SkillMetadata: typeof SkillMetadata;
declare const index$1_SkillScope: typeof SkillScope;
type index$1_SkillSummary = SkillSummary;
declare const index$1_SkillToolDependency: typeof SkillToolDependency;
type index$1_SkillsChangedNotification = SkillsChangedNotification;
declare const index$1_SkillsConfigWriteResponse: typeof SkillsConfigWriteResponse;
declare const index$1_SkillsExtraRootsSetParams: typeof SkillsExtraRootsSetParams;
type index$1_SkillsExtraRootsSetResponse = SkillsExtraRootsSetResponse;
declare const index$1_SkillsListEntry: typeof SkillsListEntry;
declare const index$1_SkillsListResponse: typeof SkillsListResponse;
declare const index$1_SortDirection: typeof SortDirection;
declare const index$1_SpendControlLimitSnapshot: typeof SpendControlLimitSnapshot;
declare const index$1_SubAgentActivityKind: typeof SubAgentActivityKind;
declare const index$1_SubagentMigration: typeof SubagentMigration;
type index$1_TerminalInteractionNotification = TerminalInteractionNotification;
declare const index$1_TextElement: typeof TextElement;
type index$1_TextPosition = TextPosition;
type index$1_TextRange = TextRange;
declare const index$1_Thread: typeof Thread;
declare const index$1_ThreadActiveFlag: typeof ThreadActiveFlag;
declare const index$1_ThreadApproveGuardianDeniedActionParams: typeof ThreadApproveGuardianDeniedActionParams;
type index$1_ThreadApproveGuardianDeniedActionResponse = ThreadApproveGuardianDeniedActionResponse;
declare const index$1_ThreadArchiveParams: typeof ThreadArchiveParams;
declare const index$1_ThreadArchiveResponse: typeof ThreadArchiveResponse;
type index$1_ThreadArchivedNotification = ThreadArchivedNotification;
type index$1_ThreadClosedNotification = ThreadClosedNotification;
declare const index$1_ThreadCompactStartParams: typeof ThreadCompactStartParams;
declare const index$1_ThreadCompactStartResponse: typeof ThreadCompactStartResponse;
declare const index$1_ThreadDeleteParams: typeof ThreadDeleteParams;
type index$1_ThreadDeleteResponse = ThreadDeleteResponse;
type index$1_ThreadDeletedNotification = ThreadDeletedNotification;
declare const index$1_ThreadForkResponse: typeof ThreadForkResponse;
type index$1_ThreadGoal = ThreadGoal;
declare const index$1_ThreadGoalClearParams: typeof ThreadGoalClearParams;
type index$1_ThreadGoalClearResponse = ThreadGoalClearResponse;
type index$1_ThreadGoalClearedNotification = ThreadGoalClearedNotification;
declare const index$1_ThreadGoalGetParams: typeof ThreadGoalGetParams;
type index$1_ThreadGoalGetResponse = ThreadGoalGetResponse;
declare const index$1_ThreadGoalSetParams: typeof ThreadGoalSetParams;
type index$1_ThreadGoalSetResponse = ThreadGoalSetResponse;
declare const index$1_ThreadGoalStatus: typeof ThreadGoalStatus;
type index$1_ThreadGoalUpdatedNotification = ThreadGoalUpdatedNotification;
declare const index$1_ThreadInjectItemsParams: typeof ThreadInjectItemsParams;
declare const index$1_ThreadInjectItemsResponse: typeof ThreadInjectItemsResponse;
declare const index$1_ThreadItem: typeof ThreadItem;
declare const index$1_ThreadListResponse: typeof ThreadListResponse;
declare const index$1_ThreadLoadedListParams: typeof ThreadLoadedListParams;
declare const index$1_ThreadLoadedListResponse: typeof ThreadLoadedListResponse;
declare const index$1_ThreadMetadataGitInfoUpdateParams: typeof ThreadMetadataGitInfoUpdateParams;
declare const index$1_ThreadMetadataUpdateParams: typeof ThreadMetadataUpdateParams;
declare const index$1_ThreadMetadataUpdateResponse: typeof ThreadMetadataUpdateResponse;
type index$1_ThreadNameUpdatedNotification = ThreadNameUpdatedNotification;
declare const index$1_ThreadReadParams: typeof ThreadReadParams;
declare const index$1_ThreadReadResponse: typeof ThreadReadResponse;
type index$1_ThreadRealtimeAudioChunk = ThreadRealtimeAudioChunk;
type index$1_ThreadRealtimeClosedNotification = ThreadRealtimeClosedNotification;
type index$1_ThreadRealtimeErrorNotification = ThreadRealtimeErrorNotification;
type index$1_ThreadRealtimeItemAddedNotification = ThreadRealtimeItemAddedNotification;
type index$1_ThreadRealtimeOutputAudioDeltaNotification = ThreadRealtimeOutputAudioDeltaNotification;
type index$1_ThreadRealtimeSdpNotification = ThreadRealtimeSdpNotification;
type index$1_ThreadRealtimeStartTransport = ThreadRealtimeStartTransport;
type index$1_ThreadRealtimeStartedNotification = ThreadRealtimeStartedNotification;
type index$1_ThreadRealtimeTranscriptDeltaNotification = ThreadRealtimeTranscriptDeltaNotification;
type index$1_ThreadRealtimeTranscriptDoneNotification = ThreadRealtimeTranscriptDoneNotification;
type index$1_ThreadResumeInitialTurnsPageParams = ThreadResumeInitialTurnsPageParams;
declare const index$1_ThreadResumeResponse: typeof ThreadResumeResponse;
declare const index$1_ThreadRollbackParams: typeof ThreadRollbackParams;
declare const index$1_ThreadRollbackResponse: typeof ThreadRollbackResponse;
type index$1_ThreadSearchResult = ThreadSearchResult;
declare const index$1_ThreadSetNameParams: typeof ThreadSetNameParams;
declare const index$1_ThreadSetNameResponse: typeof ThreadSetNameResponse;
type index$1_ThreadSettings = ThreadSettings;
type index$1_ThreadSettingsUpdatedNotification = ThreadSettingsUpdatedNotification;
declare const index$1_ThreadShellCommandParams: typeof ThreadShellCommandParams;
type index$1_ThreadShellCommandResponse = ThreadShellCommandResponse;
declare const index$1_ThreadSortKey: typeof ThreadSortKey;
declare const index$1_ThreadSource: typeof ThreadSource;
declare const index$1_ThreadSourceKind: typeof ThreadSourceKind;
declare const index$1_ThreadStartResponse: typeof ThreadStartResponse;
declare const index$1_ThreadStartSource: typeof ThreadStartSource;
type index$1_ThreadStartedNotification = ThreadStartedNotification;
declare const index$1_ThreadStatus: typeof ThreadStatus;
type index$1_ThreadStatusChangedNotification = ThreadStatusChangedNotification;
type index$1_ThreadTokenUsage = ThreadTokenUsage;
type index$1_ThreadTokenUsageUpdatedNotification = ThreadTokenUsageUpdatedNotification;
declare const index$1_ThreadUnarchiveParams: typeof ThreadUnarchiveParams;
declare const index$1_ThreadUnarchiveResponse: typeof ThreadUnarchiveResponse;
type index$1_ThreadUnarchivedNotification = ThreadUnarchivedNotification;
declare const index$1_ThreadUnsubscribeParams: typeof ThreadUnsubscribeParams;
declare const index$1_ThreadUnsubscribeResponse: typeof ThreadUnsubscribeResponse;
declare const index$1_ThreadUnsubscribeStatus: typeof ThreadUnsubscribeStatus;
type index$1_TokenUsageBreakdown = TokenUsageBreakdown;
type index$1_ToolRequestUserInputAnswer = ToolRequestUserInputAnswer;
type index$1_ToolRequestUserInputOption = ToolRequestUserInputOption;
type index$1_ToolRequestUserInputParams = ToolRequestUserInputParams;
type index$1_ToolRequestUserInputQuestion = ToolRequestUserInputQuestion;
type index$1_ToolRequestUserInputResponse = ToolRequestUserInputResponse;
type index$1_ToolsV2 = ToolsV2;
declare const index$1_Turn: typeof Turn;
type index$1_TurnCompletedNotification = TurnCompletedNotification;
type index$1_TurnDiffUpdatedNotification = TurnDiffUpdatedNotification;
type index$1_TurnEnvironmentParams = TurnEnvironmentParams;
declare const index$1_TurnError: typeof TurnError;
declare const index$1_TurnInterruptParams: typeof TurnInterruptParams;
declare const index$1_TurnInterruptResponse: typeof TurnInterruptResponse;
declare const index$1_TurnItemsView: typeof TurnItemsView;
type index$1_TurnModerationMetadataNotification = TurnModerationMetadataNotification;
type index$1_TurnPlanStep = TurnPlanStep;
type index$1_TurnPlanStepStatus = TurnPlanStepStatus;
type index$1_TurnPlanUpdatedNotification = TurnPlanUpdatedNotification;
declare const index$1_TurnStartResponse: typeof TurnStartResponse;
type index$1_TurnStartedNotification = TurnStartedNotification;
declare const index$1_TurnStatus: typeof TurnStatus;
declare const index$1_TurnSteerParams: typeof TurnSteerParams;
declare const index$1_TurnSteerResponse: typeof TurnSteerResponse;
type index$1_TurnsPage = TurnsPage;
declare const index$1_UserInput: typeof UserInput;
type index$1_WarningNotification = WarningNotification;
type index$1_WindowsSandboxReadiness = WindowsSandboxReadiness;
type index$1_WindowsSandboxReadinessResponse = WindowsSandboxReadinessResponse;
type index$1_WindowsSandboxSetupCompletedNotification = WindowsSandboxSetupCompletedNotification;
declare const index$1_WindowsSandboxSetupMode: typeof WindowsSandboxSetupMode;
declare const index$1_WindowsSandboxSetupStartParams: typeof WindowsSandboxSetupStartParams;
type index$1_WindowsSandboxSetupStartResponse = WindowsSandboxSetupStartResponse;
type index$1_WindowsWorldWritableWarningNotification = WindowsWorldWritableWarningNotification;
type index$1_WriteStatus = WriteStatus;
declare namespace index$1 {
  export { index$1_Account as Account, type index$1_AccountLoginCompletedNotification as AccountLoginCompletedNotification, type index$1_AccountRateLimitsUpdatedNotification as AccountRateLimitsUpdatedNotification, index$1_AccountTokenUsageDailyBucket as AccountTokenUsageDailyBucket, index$1_AccountTokenUsageSummary as AccountTokenUsageSummary, type index$1_AccountUpdatedNotification as AccountUpdatedNotification, type index$1_ActivePermissionProfile as ActivePermissionProfile, index$1_AddCreditsNudgeCreditType as AddCreditsNudgeCreditType, type index$1_AddCreditsNudgeEmailStatus as AddCreditsNudgeEmailStatus, type index$1_AdditionalContextEntry as AdditionalContextEntry, type index$1_AdditionalContextKind as AdditionalContextKind, type index$1_AdditionalFileSystemPermissions as AdditionalFileSystemPermissions, type index$1_AdditionalNetworkPermissions as AdditionalNetworkPermissions, type index$1_AdditionalPermissionProfile as AdditionalPermissionProfile, type index$1_AgentMessageDeltaNotification as AgentMessageDeltaNotification, type index$1_AnalyticsConfig as AnalyticsConfig, index$1_AppBranding as AppBranding, index$1_AppInfo as AppInfo, type index$1_AppListUpdatedNotification as AppListUpdatedNotification, index$1_AppMetadata as AppMetadata, index$1_AppReview as AppReview, index$1_AppScreenshot as AppScreenshot, type index$1_AppSummary as AppSummary, type index$1_AppTemplateSummary as AppTemplateSummary, type index$1_AppTemplateUnavailableReason as AppTemplateUnavailableReason, type index$1_AppToolApproval as AppToolApproval, type index$1_AppToolsConfig as AppToolsConfig, index$1_ApprovalsReviewer as ApprovalsReviewer, type index$1_AppsConfig as AppsConfig, type index$1_AppsDefaultConfig as AppsDefaultConfig, AppsListParams$1 as AppsListParams, index$1_AppsListResponse as AppsListResponse, index$1_AskForApproval as AskForApproval, type index$1_AttestationGenerateParams as AttestationGenerateParams, type index$1_AttestationGenerateResponse as AttestationGenerateResponse, type index$1_AutoReviewDecisionSource as AutoReviewDecisionSource, index$1_ByteRange as ByteRange, index$1_CancelLoginAccountParams as CancelLoginAccountParams, index$1_CancelLoginAccountResponse as CancelLoginAccountResponse, index$1_CancelLoginAccountStatus as CancelLoginAccountStatus, type index$1_CapabilityRootLocation as CapabilityRootLocation, type index$1_ChatgptAuthTokensRefreshParams as ChatgptAuthTokensRefreshParams, type index$1_ChatgptAuthTokensRefreshReason as ChatgptAuthTokensRefreshReason, type index$1_ChatgptAuthTokensRefreshResponse as ChatgptAuthTokensRefreshResponse, index$1_CodexErrorInfo as CodexErrorInfo, index$1_CollabAgentState as CollabAgentState, index$1_CollabAgentStatus as CollabAgentStatus, index$1_CollabAgentTool as CollabAgentTool, index$1_CollabAgentToolCallStatus as CollabAgentToolCallStatus, type index$1_CollaborationModeMask as CollaborationModeMask, index$1_CommandAction as CommandAction, type index$1_CommandExecOutputDeltaNotification as CommandExecOutputDeltaNotification, type index$1_CommandExecOutputStream as CommandExecOutputStream, index$1_CommandExecParams as CommandExecParams, index$1_CommandExecResizeParams as CommandExecResizeParams, type index$1_CommandExecResizeResponse as CommandExecResizeResponse, type index$1_CommandExecResponse as CommandExecResponse, index$1_CommandExecTerminalSize as CommandExecTerminalSize, index$1_CommandExecTerminateParams as CommandExecTerminateParams, type index$1_CommandExecTerminateResponse as CommandExecTerminateResponse, index$1_CommandExecWriteParams as CommandExecWriteParams, type index$1_CommandExecWriteResponse as CommandExecWriteResponse, type index$1_CommandExecutionApprovalDecision as CommandExecutionApprovalDecision, type index$1_CommandExecutionOutputDeltaNotification as CommandExecutionOutputDeltaNotification, type index$1_CommandExecutionRequestApprovalParams as CommandExecutionRequestApprovalParams, type index$1_CommandExecutionRequestApprovalResponse as CommandExecutionRequestApprovalResponse, index$1_CommandExecutionSource as CommandExecutionSource, index$1_CommandExecutionStatus as CommandExecutionStatus, index$1_CommandMigration as CommandMigration, type index$1_ComputerUseRequirements as ComputerUseRequirements, type index$1_Config as Config, index$1_ConfigBatchWriteParams as ConfigBatchWriteParams, index$1_ConfigEdit as ConfigEdit, type index$1_ConfigLayer as ConfigLayer, type index$1_ConfigLayerMetadata as ConfigLayerMetadata, type index$1_ConfigLayerSource as ConfigLayerSource, index$1_ConfigReadParams as ConfigReadParams, type index$1_ConfigReadResponse as ConfigReadResponse, type index$1_ConfigRequirements as ConfigRequirements, type index$1_ConfigRequirementsReadResponse as ConfigRequirementsReadResponse, index$1_ConfigValueWriteParams as ConfigValueWriteParams, type index$1_ConfigWarningNotification as ConfigWarningNotification, type index$1_ConfigWriteResponse as ConfigWriteResponse, type index$1_ConfiguredHookHandler as ConfiguredHookHandler, type index$1_ConfiguredHookMatcherGroup as ConfiguredHookMatcherGroup, type index$1_ConsumeAccountRateLimitResetCreditOutcome as ConsumeAccountRateLimitResetCreditOutcome, index$1_ConsumeAccountRateLimitResetCreditParams as ConsumeAccountRateLimitResetCreditParams, type index$1_ConsumeAccountRateLimitResetCreditResponse as ConsumeAccountRateLimitResetCreditResponse, type index$1_ContextCompactedNotification as ContextCompactedNotification, index$1_CreditsSnapshot as CreditsSnapshot, type index$1_DeprecationNoticeNotification as DeprecationNoticeNotification, index$1_DynamicToolCallOutputContentItem as DynamicToolCallOutputContentItem, type index$1_DynamicToolCallParams as DynamicToolCallParams, type index$1_DynamicToolCallResponse as DynamicToolCallResponse, index$1_DynamicToolCallStatus as DynamicToolCallStatus, type index$1_DynamicToolFunctionSpec as DynamicToolFunctionSpec, type index$1_DynamicToolNamespaceSpec as DynamicToolNamespaceSpec, type index$1_DynamicToolNamespaceTool as DynamicToolNamespaceTool, type index$1_DynamicToolSpec as DynamicToolSpec, type index$1_ErrorNotification as ErrorNotification, type index$1_ExecPolicyAmendment as ExecPolicyAmendment, type index$1_ExperimentalFeature as ExperimentalFeature, index$1_ExperimentalFeatureEnablementSetParams as ExperimentalFeatureEnablementSetParams, type index$1_ExperimentalFeatureEnablementSetResponse as ExperimentalFeatureEnablementSetResponse, index$1_ExperimentalFeatureListParams as ExperimentalFeatureListParams, type index$1_ExperimentalFeatureListResponse as ExperimentalFeatureListResponse, type index$1_ExperimentalFeatureStage as ExperimentalFeatureStage, index$1_ExternalAgentConfigDetectParams as ExternalAgentConfigDetectParams, type index$1_ExternalAgentConfigDetectResponse as ExternalAgentConfigDetectResponse, type index$1_ExternalAgentConfigImportCompletedNotification as ExternalAgentConfigImportCompletedNotification, type index$1_ExternalAgentConfigImportHistoriesReadResponse as ExternalAgentConfigImportHistoriesReadResponse, type index$1_ExternalAgentConfigImportHistory as ExternalAgentConfigImportHistory, type index$1_ExternalAgentConfigImportItemTypeFailure as ExternalAgentConfigImportItemTypeFailure, type index$1_ExternalAgentConfigImportItemTypeSuccess as ExternalAgentConfigImportItemTypeSuccess, index$1_ExternalAgentConfigImportParams as ExternalAgentConfigImportParams, type index$1_ExternalAgentConfigImportProgressNotification as ExternalAgentConfigImportProgressNotification, type index$1_ExternalAgentConfigImportResponse as ExternalAgentConfigImportResponse, type index$1_ExternalAgentConfigImportTypeResult as ExternalAgentConfigImportTypeResult, index$1_ExternalAgentConfigMigrationItem as ExternalAgentConfigMigrationItem, index$1_ExternalAgentConfigMigrationItemType as ExternalAgentConfigMigrationItemType, index$1_FeedbackUploadParams as FeedbackUploadParams, type index$1_FeedbackUploadResponse as FeedbackUploadResponse, type index$1_FileChangeApprovalDecision as FileChangeApprovalDecision, type index$1_FileChangeOutputDeltaNotification as FileChangeOutputDeltaNotification, type index$1_FileChangePatchUpdatedNotification as FileChangePatchUpdatedNotification, type index$1_FileChangeRequestApprovalParams as FileChangeRequestApprovalParams, type index$1_FileChangeRequestApprovalResponse as FileChangeRequestApprovalResponse, type index$1_FileSystemAccessMode as FileSystemAccessMode, type index$1_FileSystemPath as FileSystemPath, type index$1_FileSystemSandboxEntry as FileSystemSandboxEntry, type index$1_FileSystemSpecialPath as FileSystemSpecialPath, index$1_FileUpdateChange as FileUpdateChange, type index$1_ForcedChatgptWorkspaceIds as ForcedChatgptWorkspaceIds, type index$1_FsChangedNotification as FsChangedNotification, index$1_FsCopyParams as FsCopyParams, type index$1_FsCopyResponse as FsCopyResponse, index$1_FsCreateDirectoryParams as FsCreateDirectoryParams, type index$1_FsCreateDirectoryResponse as FsCreateDirectoryResponse, index$1_FsGetMetadataParams as FsGetMetadataParams, type index$1_FsGetMetadataResponse as FsGetMetadataResponse, type index$1_FsReadDirectoryEntry as FsReadDirectoryEntry, index$1_FsReadDirectoryParams as FsReadDirectoryParams, type index$1_FsReadDirectoryResponse as FsReadDirectoryResponse, index$1_FsReadFileParams as FsReadFileParams, type index$1_FsReadFileResponse as FsReadFileResponse, index$1_FsRemoveParams as FsRemoveParams, type index$1_FsRemoveResponse as FsRemoveResponse, index$1_FsUnwatchParams as FsUnwatchParams, type index$1_FsUnwatchResponse as FsUnwatchResponse, index$1_FsWatchParams as FsWatchParams, type index$1_FsWatchResponse as FsWatchResponse, index$1_FsWriteFileParams as FsWriteFileParams, type index$1_FsWriteFileResponse as FsWriteFileResponse, index$1_GetAccountParams as GetAccountParams, index$1_GetAccountRateLimitsResponse as GetAccountRateLimitsResponse, index$1_GetAccountResponse as GetAccountResponse, index$1_GetAccountTokenUsageResponse as GetAccountTokenUsageResponse, index$1_GitInfo as GitInfo, type index$1_GrantedPermissionProfile as GrantedPermissionProfile, type index$1_GuardianApprovalReview as GuardianApprovalReview, type index$1_GuardianApprovalReviewAction as GuardianApprovalReviewAction, type index$1_GuardianApprovalReviewStatus as GuardianApprovalReviewStatus, type index$1_GuardianCommandSource as GuardianCommandSource, type index$1_GuardianRiskLevel as GuardianRiskLevel, type index$1_GuardianUserAuthorization as GuardianUserAuthorization, type index$1_GuardianWarningNotification as GuardianWarningNotification, type index$1_HookCompletedNotification as HookCompletedNotification, index$1_HookErrorInfo as HookErrorInfo, index$1_HookEventName as HookEventName, type index$1_HookExecutionMode as HookExecutionMode, index$1_HookHandlerType as HookHandlerType, index$1_HookMetadata as HookMetadata, index$1_HookMigration as HookMigration, type index$1_HookOutputEntry as HookOutputEntry, type index$1_HookOutputEntryKind as HookOutputEntryKind, index$1_HookPromptFragment as HookPromptFragment, type index$1_HookRunStatus as HookRunStatus, type index$1_HookRunSummary as HookRunSummary, type index$1_HookScope as HookScope, index$1_HookSource as HookSource, type index$1_HookStartedNotification as HookStartedNotification, index$1_HookTrustStatus as HookTrustStatus, index$1_HooksListEntry as HooksListEntry, HooksListParams$1 as HooksListParams, index$1_HooksListResponse as HooksListResponse, type index$1_ItemCompletedNotification as ItemCompletedNotification, type index$1_ItemGuardianApprovalReviewCompletedNotification as ItemGuardianApprovalReviewCompletedNotification, type index$1_ItemGuardianApprovalReviewStartedNotification as ItemGuardianApprovalReviewStartedNotification, type index$1_ItemStartedNotification as ItemStartedNotification, index$1_ListMcpServerStatusParams as ListMcpServerStatusParams, type index$1_ListMcpServerStatusResponse as ListMcpServerStatusResponse, index$1_LoginAccountParams as LoginAccountParams, index$1_LoginAccountResponse as LoginAccountResponse, index$1_LogoutAccountResponse as LogoutAccountResponse, type index$1_ManagedHooksRequirements as ManagedHooksRequirements, index$1_MarketplaceAddParams as MarketplaceAddParams, type index$1_MarketplaceAddResponse as MarketplaceAddResponse, type index$1_MarketplaceInterface as MarketplaceInterface, type index$1_MarketplaceLoadErrorInfo as MarketplaceLoadErrorInfo, index$1_MarketplaceRemoveParams as MarketplaceRemoveParams, type index$1_MarketplaceRemoveResponse as MarketplaceRemoveResponse, type index$1_MarketplaceUpgradeErrorInfo as MarketplaceUpgradeErrorInfo, index$1_MarketplaceUpgradeParams as MarketplaceUpgradeParams, type index$1_MarketplaceUpgradeResponse as MarketplaceUpgradeResponse, type index$1_McpAuthStatus as McpAuthStatus, type index$1_McpElicitationArrayType as McpElicitationArrayType, type index$1_McpElicitationBooleanSchema as McpElicitationBooleanSchema, type index$1_McpElicitationBooleanType as McpElicitationBooleanType, type index$1_McpElicitationConstOption as McpElicitationConstOption, type index$1_McpElicitationEnumSchema as McpElicitationEnumSchema, type index$1_McpElicitationLegacyTitledEnumSchema as McpElicitationLegacyTitledEnumSchema, type index$1_McpElicitationMultiSelectEnumSchema as McpElicitationMultiSelectEnumSchema, type index$1_McpElicitationNumberSchema as McpElicitationNumberSchema, type index$1_McpElicitationNumberType as McpElicitationNumberType, type index$1_McpElicitationObjectType as McpElicitationObjectType, type index$1_McpElicitationPrimitiveSchema as McpElicitationPrimitiveSchema, type index$1_McpElicitationSchema as McpElicitationSchema, type index$1_McpElicitationSingleSelectEnumSchema as McpElicitationSingleSelectEnumSchema, type index$1_McpElicitationStringFormat as McpElicitationStringFormat, type index$1_McpElicitationStringSchema as McpElicitationStringSchema, type index$1_McpElicitationStringType as McpElicitationStringType, type index$1_McpElicitationTitledEnumItems as McpElicitationTitledEnumItems, type index$1_McpElicitationTitledMultiSelectEnumSchema as McpElicitationTitledMultiSelectEnumSchema, type index$1_McpElicitationTitledSingleSelectEnumSchema as McpElicitationTitledSingleSelectEnumSchema, type index$1_McpElicitationUntitledEnumItems as McpElicitationUntitledEnumItems, type index$1_McpElicitationUntitledMultiSelectEnumSchema as McpElicitationUntitledMultiSelectEnumSchema, type index$1_McpElicitationUntitledSingleSelectEnumSchema as McpElicitationUntitledSingleSelectEnumSchema, index$1_McpResourceReadParams as McpResourceReadParams, type index$1_McpResourceReadResponse as McpResourceReadResponse, type index$1_McpServerElicitationAction as McpServerElicitationAction, type index$1_McpServerElicitationRequestParams as McpServerElicitationRequestParams, type index$1_McpServerElicitationRequestResponse as McpServerElicitationRequestResponse, index$1_McpServerMigration as McpServerMigration, type index$1_McpServerOauthLoginCompletedNotification as McpServerOauthLoginCompletedNotification, index$1_McpServerOauthLoginParams as McpServerOauthLoginParams, type index$1_McpServerOauthLoginResponse as McpServerOauthLoginResponse, type index$1_McpServerRefreshResponse as McpServerRefreshResponse, type index$1_McpServerStartupState as McpServerStartupState, type index$1_McpServerStatus as McpServerStatus, index$1_McpServerStatusDetail as McpServerStatusDetail, type index$1_McpServerStatusUpdatedNotification as McpServerStatusUpdatedNotification, index$1_McpServerToolCallParams as McpServerToolCallParams, type index$1_McpServerToolCallResponse as McpServerToolCallResponse, index$1_McpToolCallAppContext as McpToolCallAppContext, index$1_McpToolCallError as McpToolCallError, type index$1_McpToolCallProgressNotification as McpToolCallProgressNotification, index$1_McpToolCallResult as McpToolCallResult, index$1_McpToolCallStatus as McpToolCallStatus, index$1_MemoryCitation as MemoryCitation, index$1_MemoryCitationEntry as MemoryCitationEntry, index$1_MergeStrategy as MergeStrategy, index$1_MigrationDetails as MigrationDetails, index$1_Model as Model, index$1_ModelAvailabilityNux as ModelAvailabilityNux, index$1_ModelListParams as ModelListParams, index$1_ModelListResponse as ModelListResponse, index$1_ModelProviderCapabilitiesReadParams as ModelProviderCapabilitiesReadParams, type index$1_ModelProviderCapabilitiesReadResponse as ModelProviderCapabilitiesReadResponse, type index$1_ModelRerouteReason as ModelRerouteReason, type index$1_ModelReroutedNotification as ModelReroutedNotification, index$1_ModelServiceTier as ModelServiceTier, index$1_ModelUpgradeInfo as ModelUpgradeInfo, type index$1_ModelVerification as ModelVerification, type index$1_ModelVerificationNotification as ModelVerificationNotification, index$1_NetworkAccess as NetworkAccess, type index$1_NetworkApprovalContext as NetworkApprovalContext, type index$1_NetworkApprovalProtocol as NetworkApprovalProtocol, type index$1_NetworkDomainPermission as NetworkDomainPermission, type index$1_NetworkPolicyAmendment as NetworkPolicyAmendment, type index$1_NetworkPolicyRuleAction as NetworkPolicyRuleAction, type index$1_NetworkRequirements as NetworkRequirements, type index$1_NetworkUnixSocketPermission as NetworkUnixSocketPermission, index$1_NonSteerableTurnKind as NonSteerableTurnKind, type index$1_OverriddenMetadata as OverriddenMetadata, index$1_PatchApplyStatus as PatchApplyStatus, index$1_PatchChangeKind as PatchChangeKind, type index$1_PermissionGrantScope as PermissionGrantScope, index$1_PermissionProfileListParams as PermissionProfileListParams, type index$1_PermissionProfileListResponse as PermissionProfileListResponse, type index$1_PermissionProfileSummary as PermissionProfileSummary, type index$1_PermissionsRequestApprovalParams as PermissionsRequestApprovalParams, type index$1_PermissionsRequestApprovalResponse as PermissionsRequestApprovalResponse, type index$1_PlanDeltaNotification as PlanDeltaNotification, type index$1_PluginAuthPolicy as PluginAuthPolicy, type index$1_PluginAvailability as PluginAvailability, type index$1_PluginDetail as PluginDetail, type index$1_PluginHookSummary as PluginHookSummary, index$1_PluginInstallParams as PluginInstallParams, type index$1_PluginInstallPolicy as PluginInstallPolicy, type index$1_PluginInstallResponse as PluginInstallResponse, index$1_PluginInstalledParams as PluginInstalledParams, type index$1_PluginInstalledResponse as PluginInstalledResponse, type index$1_PluginInterface as PluginInterface, index$1_PluginListMarketplaceKind as PluginListMarketplaceKind, index$1_PluginListParams as PluginListParams, type index$1_PluginListResponse as PluginListResponse, type index$1_PluginMarketplaceEntry as PluginMarketplaceEntry, index$1_PluginReadParams as PluginReadParams, type index$1_PluginReadResponse as PluginReadResponse, index$1_PluginShareCheckoutParams as PluginShareCheckoutParams, type index$1_PluginShareCheckoutResponse as PluginShareCheckoutResponse, type index$1_PluginShareContext as PluginShareContext, index$1_PluginShareDeleteParams as PluginShareDeleteParams, type index$1_PluginShareDeleteResponse as PluginShareDeleteResponse, index$1_PluginShareDiscoverability as PluginShareDiscoverability, type index$1_PluginShareListItem as PluginShareListItem, index$1_PluginShareListParams as PluginShareListParams, type index$1_PluginShareListResponse as PluginShareListResponse, type index$1_PluginSharePrincipal as PluginSharePrincipal, type index$1_PluginSharePrincipalRole as PluginSharePrincipalRole, index$1_PluginSharePrincipalType as PluginSharePrincipalType, index$1_PluginShareSaveParams as PluginShareSaveParams, type index$1_PluginShareSaveResponse as PluginShareSaveResponse, index$1_PluginShareTarget as PluginShareTarget, index$1_PluginShareTargetRole as PluginShareTargetRole, index$1_PluginShareUpdateDiscoverability as PluginShareUpdateDiscoverability, index$1_PluginShareUpdateTargetsParams as PluginShareUpdateTargetsParams, type index$1_PluginShareUpdateTargetsResponse as PluginShareUpdateTargetsResponse, index$1_PluginSkillReadParams as PluginSkillReadParams, type index$1_PluginSkillReadResponse as PluginSkillReadResponse, type index$1_PluginSource as PluginSource, type index$1_PluginSummary as PluginSummary, index$1_PluginUninstallParams as PluginUninstallParams, type index$1_PluginUninstallResponse as PluginUninstallResponse, index$1_PluginsMigration as PluginsMigration, type index$1_ProcessExitedNotification as ProcessExitedNotification, type index$1_ProcessOutputDeltaNotification as ProcessOutputDeltaNotification, type index$1_ProcessOutputStream as ProcessOutputStream, type index$1_ProcessTerminalSize as ProcessTerminalSize, index$1_RateLimitReachedType as RateLimitReachedType, index$1_RateLimitResetCreditsSummary as RateLimitResetCreditsSummary, index$1_RateLimitSnapshot as RateLimitSnapshot, index$1_RateLimitWindow as RateLimitWindow, type index$1_RawResponseItemCompletedNotification as RawResponseItemCompletedNotification, index$1_ReasoningEffortOption as ReasoningEffortOption, type index$1_ReasoningSummaryPartAddedNotification as ReasoningSummaryPartAddedNotification, type index$1_ReasoningSummaryTextDeltaNotification as ReasoningSummaryTextDeltaNotification, type index$1_ReasoningTextDeltaNotification as ReasoningTextDeltaNotification, type index$1_RemoteControlConnectionStatus as RemoteControlConnectionStatus, type index$1_RemoteControlDisableParams as RemoteControlDisableParams, type index$1_RemoteControlEnableParams as RemoteControlEnableParams, type index$1_RemoteControlStatusChangedNotification as RemoteControlStatusChangedNotification, type index$1_RequestPermissionProfile as RequestPermissionProfile, type index$1_ResidencyRequirement as ResidencyRequirement, index$1_ReviewDelivery as ReviewDelivery, index$1_ReviewStartParams as ReviewStartParams, type index$1_ReviewStartResponse as ReviewStartResponse, index$1_ReviewTarget as ReviewTarget, index$1_SandboxMode as SandboxMode, index$1_SandboxPolicy as SandboxPolicy, type index$1_SandboxWorkspaceWrite as SandboxWorkspaceWrite, type index$1_SelectedCapabilityRoot as SelectedCapabilityRoot, index$1_SendAddCreditsNudgeEmailParams as SendAddCreditsNudgeEmailParams, type index$1_SendAddCreditsNudgeEmailResponse as SendAddCreditsNudgeEmailResponse, type index$1_ServerRequestResolvedNotification as ServerRequestResolvedNotification, index$1_SessionMigration as SessionMigration, SessionSource$1 as SessionSource, index$1_SkillDependencies as SkillDependencies, index$1_SkillErrorInfo as SkillErrorInfo, index$1_SkillInterface as SkillInterface, index$1_SkillMetadata as SkillMetadata, index$1_SkillScope as SkillScope, type index$1_SkillSummary as SkillSummary, index$1_SkillToolDependency as SkillToolDependency, type index$1_SkillsChangedNotification as SkillsChangedNotification, SkillsConfigWriteParams$1 as SkillsConfigWriteParams, index$1_SkillsConfigWriteResponse as SkillsConfigWriteResponse, index$1_SkillsExtraRootsSetParams as SkillsExtraRootsSetParams, type index$1_SkillsExtraRootsSetResponse as SkillsExtraRootsSetResponse, index$1_SkillsListEntry as SkillsListEntry, SkillsListParams$1 as SkillsListParams, index$1_SkillsListResponse as SkillsListResponse, index$1_SortDirection as SortDirection, index$1_SpendControlLimitSnapshot as SpendControlLimitSnapshot, index$1_SubAgentActivityKind as SubAgentActivityKind, index$1_SubagentMigration as SubagentMigration, type index$1_TerminalInteractionNotification as TerminalInteractionNotification, index$1_TextElement as TextElement, type index$1_TextPosition as TextPosition, type index$1_TextRange as TextRange, index$1_Thread as Thread, index$1_ThreadActiveFlag as ThreadActiveFlag, index$1_ThreadApproveGuardianDeniedActionParams as ThreadApproveGuardianDeniedActionParams, type index$1_ThreadApproveGuardianDeniedActionResponse as ThreadApproveGuardianDeniedActionResponse, index$1_ThreadArchiveParams as ThreadArchiveParams, index$1_ThreadArchiveResponse as ThreadArchiveResponse, type index$1_ThreadArchivedNotification as ThreadArchivedNotification, type index$1_ThreadClosedNotification as ThreadClosedNotification, index$1_ThreadCompactStartParams as ThreadCompactStartParams, index$1_ThreadCompactStartResponse as ThreadCompactStartResponse, index$1_ThreadDeleteParams as ThreadDeleteParams, type index$1_ThreadDeleteResponse as ThreadDeleteResponse, type index$1_ThreadDeletedNotification as ThreadDeletedNotification, ThreadForkParams$1 as ThreadForkParams, index$1_ThreadForkResponse as ThreadForkResponse, type index$1_ThreadGoal as ThreadGoal, index$1_ThreadGoalClearParams as ThreadGoalClearParams, type index$1_ThreadGoalClearResponse as ThreadGoalClearResponse, type index$1_ThreadGoalClearedNotification as ThreadGoalClearedNotification, index$1_ThreadGoalGetParams as ThreadGoalGetParams, type index$1_ThreadGoalGetResponse as ThreadGoalGetResponse, index$1_ThreadGoalSetParams as ThreadGoalSetParams, type index$1_ThreadGoalSetResponse as ThreadGoalSetResponse, index$1_ThreadGoalStatus as ThreadGoalStatus, type index$1_ThreadGoalUpdatedNotification as ThreadGoalUpdatedNotification, index$1_ThreadInjectItemsParams as ThreadInjectItemsParams, index$1_ThreadInjectItemsResponse as ThreadInjectItemsResponse, index$1_ThreadItem as ThreadItem, ThreadListParams$1 as ThreadListParams, index$1_ThreadListResponse as ThreadListResponse, index$1_ThreadLoadedListParams as ThreadLoadedListParams, index$1_ThreadLoadedListResponse as ThreadLoadedListResponse, index$1_ThreadMetadataGitInfoUpdateParams as ThreadMetadataGitInfoUpdateParams, index$1_ThreadMetadataUpdateParams as ThreadMetadataUpdateParams, index$1_ThreadMetadataUpdateResponse as ThreadMetadataUpdateResponse, type index$1_ThreadNameUpdatedNotification as ThreadNameUpdatedNotification, index$1_ThreadReadParams as ThreadReadParams, index$1_ThreadReadResponse as ThreadReadResponse, type index$1_ThreadRealtimeAudioChunk as ThreadRealtimeAudioChunk, type index$1_ThreadRealtimeClosedNotification as ThreadRealtimeClosedNotification, type index$1_ThreadRealtimeErrorNotification as ThreadRealtimeErrorNotification, type index$1_ThreadRealtimeItemAddedNotification as ThreadRealtimeItemAddedNotification, type index$1_ThreadRealtimeOutputAudioDeltaNotification as ThreadRealtimeOutputAudioDeltaNotification, type index$1_ThreadRealtimeSdpNotification as ThreadRealtimeSdpNotification, type index$1_ThreadRealtimeStartTransport as ThreadRealtimeStartTransport, type index$1_ThreadRealtimeStartedNotification as ThreadRealtimeStartedNotification, type index$1_ThreadRealtimeTranscriptDeltaNotification as ThreadRealtimeTranscriptDeltaNotification, type index$1_ThreadRealtimeTranscriptDoneNotification as ThreadRealtimeTranscriptDoneNotification, type index$1_ThreadResumeInitialTurnsPageParams as ThreadResumeInitialTurnsPageParams, ThreadResumeParams$1 as ThreadResumeParams, index$1_ThreadResumeResponse as ThreadResumeResponse, index$1_ThreadRollbackParams as ThreadRollbackParams, index$1_ThreadRollbackResponse as ThreadRollbackResponse, type index$1_ThreadSearchResult as ThreadSearchResult, index$1_ThreadSetNameParams as ThreadSetNameParams, index$1_ThreadSetNameResponse as ThreadSetNameResponse, type index$1_ThreadSettings as ThreadSettings, type index$1_ThreadSettingsUpdatedNotification as ThreadSettingsUpdatedNotification, index$1_ThreadShellCommandParams as ThreadShellCommandParams, type index$1_ThreadShellCommandResponse as ThreadShellCommandResponse, index$1_ThreadSortKey as ThreadSortKey, index$1_ThreadSource as ThreadSource, index$1_ThreadSourceKind as ThreadSourceKind, ThreadStartParams$1 as ThreadStartParams, index$1_ThreadStartResponse as ThreadStartResponse, index$1_ThreadStartSource as ThreadStartSource, type index$1_ThreadStartedNotification as ThreadStartedNotification, index$1_ThreadStatus as ThreadStatus, type index$1_ThreadStatusChangedNotification as ThreadStatusChangedNotification, type index$1_ThreadTokenUsage as ThreadTokenUsage, type index$1_ThreadTokenUsageUpdatedNotification as ThreadTokenUsageUpdatedNotification, index$1_ThreadUnarchiveParams as ThreadUnarchiveParams, index$1_ThreadUnarchiveResponse as ThreadUnarchiveResponse, type index$1_ThreadUnarchivedNotification as ThreadUnarchivedNotification, index$1_ThreadUnsubscribeParams as ThreadUnsubscribeParams, index$1_ThreadUnsubscribeResponse as ThreadUnsubscribeResponse, index$1_ThreadUnsubscribeStatus as ThreadUnsubscribeStatus, type index$1_TokenUsageBreakdown as TokenUsageBreakdown, type index$1_ToolRequestUserInputAnswer as ToolRequestUserInputAnswer, type index$1_ToolRequestUserInputOption as ToolRequestUserInputOption, type index$1_ToolRequestUserInputParams as ToolRequestUserInputParams, type index$1_ToolRequestUserInputQuestion as ToolRequestUserInputQuestion, type index$1_ToolRequestUserInputResponse as ToolRequestUserInputResponse, type index$1_ToolsV2 as ToolsV2, index$1_Turn as Turn, type index$1_TurnCompletedNotification as TurnCompletedNotification, type index$1_TurnDiffUpdatedNotification as TurnDiffUpdatedNotification, type index$1_TurnEnvironmentParams as TurnEnvironmentParams, index$1_TurnError as TurnError, index$1_TurnInterruptParams as TurnInterruptParams, index$1_TurnInterruptResponse as TurnInterruptResponse, index$1_TurnItemsView as TurnItemsView, type index$1_TurnModerationMetadataNotification as TurnModerationMetadataNotification, type index$1_TurnPlanStep as TurnPlanStep, type index$1_TurnPlanStepStatus as TurnPlanStepStatus, type index$1_TurnPlanUpdatedNotification as TurnPlanUpdatedNotification, TurnStartParams$1 as TurnStartParams, index$1_TurnStartResponse as TurnStartResponse, type index$1_TurnStartedNotification as TurnStartedNotification, index$1_TurnStatus as TurnStatus, index$1_TurnSteerParams as TurnSteerParams, index$1_TurnSteerResponse as TurnSteerResponse, type index$1_TurnsPage as TurnsPage, index$1_UserInput as UserInput, type index$1_WarningNotification as WarningNotification, WebSearchAction$1 as WebSearchAction, type index$1_WindowsSandboxReadiness as WindowsSandboxReadiness, type index$1_WindowsSandboxReadinessResponse as WindowsSandboxReadinessResponse, type index$1_WindowsSandboxSetupCompletedNotification as WindowsSandboxSetupCompletedNotification, index$1_WindowsSandboxSetupMode as WindowsSandboxSetupMode, index$1_WindowsSandboxSetupStartParams as WindowsSandboxSetupStartParams, type index$1_WindowsSandboxSetupStartResponse as WindowsSandboxSetupStartResponse, type index$1_WindowsWorldWritableWarningNotification as WindowsWorldWritableWarningNotification, type index$1_WriteStatus as WriteStatus };
}

declare const index_AbsolutePathBuf: typeof AbsolutePathBuf;
type index_AgentMessageInputContent = AgentMessageInputContent;
declare const index_AgentPath: typeof AgentPath;
declare const index_AmazonBedrockCredentialSource: typeof AmazonBedrockCredentialSource;
type index_ApplyPatchApprovalParams = ApplyPatchApprovalParams;
type index_ApplyPatchApprovalResponse = ApplyPatchApprovalResponse;
type index_AuthMode = AuthMode;
type index_AutoCompactTokenLimitScope = AutoCompactTokenLimitScope;
declare const index_ClientInfo: typeof ClientInfo;
type index_ClientNotification = ClientNotification;
declare const index_ClientRequest: typeof ClientRequest;
type index_CollaborationMode = CollaborationMode;
type index_ContentItem = ContentItem;
type index_ConversationGitInfo = ConversationGitInfo;
type index_ConversationSummary = ConversationSummary;
type index_ConversationTextRole = ConversationTextRole;
type index_ExecCommandApprovalParams = ExecCommandApprovalParams;
type index_ExecCommandApprovalResponse = ExecCommandApprovalResponse;
type index_FileChange = FileChange;
type index_ForcedLoginMethod = ForcedLoginMethod;
type index_FunctionCallOutputBody = FunctionCallOutputBody;
type index_FunctionCallOutputContentItem = FunctionCallOutputContentItem;
type index_FuzzyFileSearchMatchType = FuzzyFileSearchMatchType;
declare const index_FuzzyFileSearchParams: typeof FuzzyFileSearchParams;
type index_FuzzyFileSearchResponse = FuzzyFileSearchResponse;
type index_FuzzyFileSearchResult = FuzzyFileSearchResult;
type index_FuzzyFileSearchSessionCompletedNotification = FuzzyFileSearchSessionCompletedNotification;
type index_FuzzyFileSearchSessionUpdatedNotification = FuzzyFileSearchSessionUpdatedNotification;
declare const index_GetAuthStatusParams: typeof GetAuthStatusParams;
type index_GetAuthStatusResponse = GetAuthStatusResponse;
declare const index_GetConversationSummaryParams: typeof GetConversationSummaryParams;
type index_GetConversationSummaryResponse = GetConversationSummaryResponse;
declare const index_GitDiffToRemoteParams: typeof GitDiffToRemoteParams;
type index_GitDiffToRemoteResponse = GitDiffToRemoteResponse;
type index_GitSha = GitSha;
declare const index_ImageDetail: typeof ImageDetail;
declare const index_InitializeCapabilities: typeof InitializeCapabilities;
declare const index_InitializeParams: typeof InitializeParams;
declare const index_InitializeResponse: typeof InitializeResponse;
declare const index_InputModality: typeof InputModality;
type index_InternalSessionSource = InternalSessionSource;
declare const index_LegacyAppPathString: typeof LegacyAppPathString;
type index_LocalShellAction = LocalShellAction;
type index_LocalShellExecAction = LocalShellExecAction;
type index_LocalShellStatus = LocalShellStatus;
type index_McpServerInfo = McpServerInfo;
declare const index_MessagePhase: typeof MessagePhase;
type index_ModeKind = ModeKind;
type index_MultiAgentMode = MultiAgentMode;
type index_ParsedCommand = ParsedCommand;
declare const index_Personality: typeof Personality;
declare const index_PlanType: typeof PlanType;
type index_RealtimeConversationVersion = RealtimeConversationVersion;
type index_RealtimeOutputModality = RealtimeOutputModality;
type index_RealtimeVoice = RealtimeVoice;
type index_RealtimeVoicesList = RealtimeVoicesList;
declare const index_ReasoningEffort: typeof ReasoningEffort;
type index_ReasoningItemContent = ReasoningItemContent;
type index_ReasoningItemReasoningSummary = ReasoningItemReasoningSummary;
declare const index_ReasoningSummary: typeof ReasoningSummary;
declare const index_RequestId: typeof RequestId;
type index_Resource = Resource;
type index_ResourceContent = ResourceContent;
type index_ResourceTemplate = ResourceTemplate;
type index_ResponseItem = ResponseItem;
type index_ResponseItemMetadata = ResponseItemMetadata;
type index_ReviewDecision = ReviewDecision;
type index_ServerNotification = ServerNotification;
type index_ServerRequest = ServerRequest;
type index_SessionSource = SessionSource;
type index_Settings = Settings;
declare const index_SubAgentSource: typeof SubAgentSource;
declare const index_ThreadId: typeof ThreadId;
type index_ThreadMemoryMode = ThreadMemoryMode;
type index_Tool = Tool;
type index_Verbosity = Verbosity;
type index_WebSearchAction = WebSearchAction;
type index_WebSearchContextSize = WebSearchContextSize;
type index_WebSearchLocation = WebSearchLocation;
type index_WebSearchMode = WebSearchMode;
type index_WebSearchToolConfig = WebSearchToolConfig;
declare namespace index {
  export { index_AbsolutePathBuf as AbsolutePathBuf, type index_AgentMessageInputContent as AgentMessageInputContent, index_AgentPath as AgentPath, index_AmazonBedrockCredentialSource as AmazonBedrockCredentialSource, type index_ApplyPatchApprovalParams as ApplyPatchApprovalParams, type index_ApplyPatchApprovalResponse as ApplyPatchApprovalResponse, type index_AuthMode as AuthMode, type index_AutoCompactTokenLimitScope as AutoCompactTokenLimitScope, index_ClientInfo as ClientInfo, type index_ClientNotification as ClientNotification, index_ClientRequest as ClientRequest, type index_CollaborationMode as CollaborationMode, type index_ContentItem as ContentItem, type index_ConversationGitInfo as ConversationGitInfo, type index_ConversationSummary as ConversationSummary, type index_ConversationTextRole as ConversationTextRole, type index_ExecCommandApprovalParams as ExecCommandApprovalParams, type index_ExecCommandApprovalResponse as ExecCommandApprovalResponse, type ExecPolicyAmendment$1 as ExecPolicyAmendment, type index_FileChange as FileChange, type index_ForcedLoginMethod as ForcedLoginMethod, type index_FunctionCallOutputBody as FunctionCallOutputBody, type index_FunctionCallOutputContentItem as FunctionCallOutputContentItem, type index_FuzzyFileSearchMatchType as FuzzyFileSearchMatchType, index_FuzzyFileSearchParams as FuzzyFileSearchParams, type index_FuzzyFileSearchResponse as FuzzyFileSearchResponse, type index_FuzzyFileSearchResult as FuzzyFileSearchResult, type index_FuzzyFileSearchSessionCompletedNotification as FuzzyFileSearchSessionCompletedNotification, type index_FuzzyFileSearchSessionUpdatedNotification as FuzzyFileSearchSessionUpdatedNotification, index_GetAuthStatusParams as GetAuthStatusParams, type index_GetAuthStatusResponse as GetAuthStatusResponse, index_GetConversationSummaryParams as GetConversationSummaryParams, type index_GetConversationSummaryResponse as GetConversationSummaryResponse, index_GitDiffToRemoteParams as GitDiffToRemoteParams, type index_GitDiffToRemoteResponse as GitDiffToRemoteResponse, type index_GitSha as GitSha, index_ImageDetail as ImageDetail, index_InitializeCapabilities as InitializeCapabilities, index_InitializeParams as InitializeParams, index_InitializeResponse as InitializeResponse, index_InputModality as InputModality, type index_InternalSessionSource as InternalSessionSource, index_LegacyAppPathString as LegacyAppPathString, type index_LocalShellAction as LocalShellAction, type index_LocalShellExecAction as LocalShellExecAction, type index_LocalShellStatus as LocalShellStatus, type index_McpServerInfo as McpServerInfo, index_MessagePhase as MessagePhase, type index_ModeKind as ModeKind, type index_MultiAgentMode as MultiAgentMode, type NetworkPolicyAmendment$1 as NetworkPolicyAmendment, type NetworkPolicyRuleAction$1 as NetworkPolicyRuleAction, type index_ParsedCommand as ParsedCommand, index_Personality as Personality, index_PlanType as PlanType, type index_RealtimeConversationVersion as RealtimeConversationVersion, type index_RealtimeOutputModality as RealtimeOutputModality, type index_RealtimeVoice as RealtimeVoice, type index_RealtimeVoicesList as RealtimeVoicesList, index_ReasoningEffort as ReasoningEffort, type index_ReasoningItemContent as ReasoningItemContent, type index_ReasoningItemReasoningSummary as ReasoningItemReasoningSummary, index_ReasoningSummary as ReasoningSummary, index_RequestId as RequestId, type index_Resource as Resource, type index_ResourceContent as ResourceContent, type index_ResourceTemplate as ResourceTemplate, type index_ResponseItem as ResponseItem, type index_ResponseItemMetadata as ResponseItemMetadata, type index_ReviewDecision as ReviewDecision, type index_ServerNotification as ServerNotification, type index_ServerRequest as ServerRequest, type index_SessionSource as SessionSource, type index_Settings as Settings, index_SubAgentSource as SubAgentSource, index_ThreadId as ThreadId, type index_ThreadMemoryMode as ThreadMemoryMode, type index_Tool as Tool, type index_Verbosity as Verbosity, type index_WebSearchAction as WebSearchAction, type index_WebSearchContextSize as WebSearchContextSize, type index_WebSearchLocation as WebSearchLocation, type index_WebSearchMode as WebSearchMode, type index_WebSearchToolConfig as WebSearchToolConfig, index$1 as v2 };
}

type AppsListParams = CodexStableMethodParams<"app/list">;
type HooksListParams = CodexStableMethodParams<"hooks/list">;
type SkillsConfigWriteParams = CodexStableMethodParams<"skills/config/write">;
type SkillsListParams = CodexStableMethodParams<"skills/list">;
type ThreadForkParams = CodexStableMethodParams<"thread/fork">;
type ThreadListParams = CodexStableMethodParams<"thread/list">;
type ThreadResumeParams = CodexStableMethodParams<"thread/resume">;
type ThreadStartParams = CodexStableMethodParams<"thread/start">;
type TurnStartParams = CodexStableMethodParams<"turn/start">;

export { AbsolutePathBuf, type AgentMessageInputContent, AgentPath, AmazonBedrockCredentialSource, type ApplyPatchApprovalParams, type ApplyPatchApprovalResponse, type AppsListParams, type AuthMode, type AutoCompactTokenLimitScope, ClientInfo, type ClientNotification, ClientRequest, index as CodexStable, CodexStableMethodParams, type CollaborationMode, type ContentItem, type ConversationGitInfo, type ConversationSummary, type ConversationTextRole, type ExecCommandApprovalParams, type ExecCommandApprovalResponse, type ExecPolicyAmendment$1 as ExecPolicyAmendment, type FileChange, type ForcedLoginMethod, type FunctionCallOutputBody, type FunctionCallOutputContentItem, type FuzzyFileSearchMatchType, FuzzyFileSearchParams, type FuzzyFileSearchResponse, type FuzzyFileSearchResult, type FuzzyFileSearchSessionCompletedNotification, type FuzzyFileSearchSessionUpdatedNotification, GetAuthStatusParams, type GetAuthStatusResponse, GetConversationSummaryParams, type GetConversationSummaryResponse, GitDiffToRemoteParams, type GitDiffToRemoteResponse, type GitSha, type HooksListParams, ImageDetail, InitializeCapabilities, InitializeParams, InitializeResponse, InputModality, type InternalSessionSource, LegacyAppPathString, type LocalShellAction, type LocalShellExecAction, type LocalShellStatus, type McpServerInfo, MessagePhase, type ModeKind, type MultiAgentMode, type NetworkPolicyAmendment$1 as NetworkPolicyAmendment, type NetworkPolicyRuleAction$1 as NetworkPolicyRuleAction, type ParsedCommand, Personality, PlanType, type RealtimeConversationVersion, type RealtimeOutputModality, type RealtimeVoice, type RealtimeVoicesList, ReasoningEffort, type ReasoningItemContent, type ReasoningItemReasoningSummary, ReasoningSummary, RequestId, type Resource, type ResourceContent, type ResourceTemplate, type ResponseItem, type ResponseItemMetadata, type ReviewDecision, type ServerNotification, type ServerRequest, type SessionSource, type Settings, type SkillsConfigWriteParams, type SkillsListParams, SubAgentSource, type ThreadForkParams, ThreadId, type ThreadListParams, type ThreadMemoryMode, type ThreadResumeParams, type ThreadStartParams, type Tool, type TurnStartParams, UserInput, type Verbosity, type WebSearchAction, type WebSearchContextSize, type WebSearchLocation, type WebSearchMode, type WebSearchToolConfig, index$1 as v2 };
