import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _nyosegawa_agent_ui_core from '@nyosegawa/agent-ui-core';
import { AgentEvent, AgentSessionState, AgentTransport, ReasoningEffort, AgentApp, AgentModel, ThreadId, RequestId, AgentError, ExecutionModeId, ThreadState, AgentThreadScope, AgentThreadCollection, AgentThreadView as AgentThreadView$1, PendingServerRequest, AgentItemBlock, AgentItemState, AgentItemBlockKind, ThreadTokenUsage, AgentThread, TurnState } from '@nyosegawa/agent-ui-core';
import React$1, { PropsWithChildren, Dispatch, SetStateAction } from 'react';

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

type AgentUserInput = AgentTextInput | AgentImageInput | AgentLocalImageInput | AgentSkillInput | AgentMentionInput | AgentUnknownUserInput;
interface AgentTextInput {
    text: string;
    text_elements?: unknown[];
    type: "text";
}
interface AgentImageInput {
    image_url: string;
    type: "image";
}
interface AgentLocalImageInput {
    path: string;
    type: "localImage";
}
interface AgentSkillInput {
    name: string;
    path: string;
    type: "skill";
}
interface AgentMentionInput {
    name: string;
    path: string;
    type: "mention";
}
interface AgentUnknownUserInput {
    type: string;
    [key: string]: unknown;
}

declare function useAgentAccount(): {
    account: _nyosegawa_agent_ui_core.AccountState;
    cancelLogin: () => Promise<void>;
    login: () => Promise<{
        loginId: string | undefined;
        userCode: string | undefined;
        verificationUrl: string | undefined;
    }>;
    logout: () => Promise<void>;
    readAccount: () => Promise<{
        authenticated: boolean;
    }>;
};
interface AgentBootstrapState {
    errors: Error[];
    isBootstrapping: boolean;
    status: "idle" | "loading" | "ready" | "error";
}
declare function useAgentBootstrap(): AgentBootstrapState;

type AgentJsonValue = null | boolean | number | string | AgentJsonValue[] | {
    [key: string]: AgentJsonValue | undefined;
};
type AgentApprovalPolicy = "untrusted" | "on-failure" | "on-request" | "never" | {
    granular: {
        mcp_elicitations: boolean;
        request_permissions: boolean;
        rules: boolean;
        sandbox_approval: boolean;
        skill_approval: boolean;
    };
};
type AgentApprovalsReviewer = "user" | "auto_review" | "guardian_subagent";
type AgentReasoningSummary = "auto" | "concise" | "detailed" | "none";
type AgentPersonality = "none" | "friendly" | "pragmatic";
type AgentSandboxMode = "read-only" | "workspace-write" | "danger-full-access";
type AgentThreadSource = "user" | "subagent" | "memory_consolidation";
type AgentThreadStartSource = "startup" | "clear";
type AgentThreadSortKey = "created_at" | "updated_at";
type AgentSortDirection = "asc" | "desc";
type AgentThreadSourceKind = "cli" | "vscode" | "exec" | "appServer" | "subAgent" | "subAgentReview" | "subAgentCompact" | "subAgentThreadSpawn" | "subAgentOther" | "unknown";
type AgentSandboxPolicy = {
    type: "dangerFullAccess";
} | {
    networkAccess: boolean;
    type: "readOnly";
} | {
    networkAccess: "restricted" | "enabled";
    type: "externalSandbox";
} | {
    excludeSlashTmp: boolean;
    excludeTmpdirEnvVar: boolean;
    networkAccess: boolean;
    type: "workspaceWrite";
    writableRoots: string[];
};
interface AgentThreadConfigOptions {
    approvalPolicy?: AgentApprovalPolicy | null;
    approvalsReviewer?: AgentApprovalsReviewer | null;
    baseInstructions?: string | null;
    config?: {
        [key: string]: AgentJsonValue | undefined;
    } | null;
    cwd?: string | null;
    developerInstructions?: string | null;
    model?: string | null;
    modelProvider?: string | null;
    personality?: AgentPersonality | null;
    serviceTier?: string | null;
}
interface ThreadStartOptions extends AgentThreadConfigOptions {
    ephemeral?: boolean | null;
    sandbox?: AgentSandboxMode | null;
    sessionStartSource?: AgentThreadStartSource | null;
    threadSource?: AgentThreadSource | null;
}
interface ThreadResumeOptions extends AgentThreadConfigOptions {
    sandbox?: AgentSandboxMode | null;
}
interface ThreadForkOptions extends AgentThreadConfigOptions {
    ephemeral?: boolean;
    sandbox?: AgentSandboxMode | null;
    threadSource?: AgentThreadSource | null;
}
interface ThreadHistoryParams {
    archived?: boolean | null;
    cursor?: string | null;
    cwd?: string | string[] | null;
    limit?: number | null;
    modelProviders?: string[] | null;
    searchTerm?: string | null;
    sortDirection?: AgentSortDirection | null;
    sortKey?: AgentThreadSortKey | null;
    sourceKinds?: AgentThreadSourceKind[] | null;
    useStateDbOnly?: boolean;
}
interface TurnStartOptions {
    approvalPolicy?: AgentApprovalPolicy | null;
    approvalsReviewer?: AgentApprovalsReviewer | null;
    cwd?: string | null;
    effort?: ReasoningEffort | null;
    model?: string | null;
    outputSchema?: AgentJsonValue | null;
    personality?: AgentPersonality | null;
    sandboxPolicy?: AgentSandboxPolicy | null;
    serviceTier?: string | null;
    summary?: AgentReasoningSummary | null;
}
interface AgentAppsRefreshOptions {
    cursor?: string | null;
    forceRefetch?: boolean;
    limit?: number | null;
    threadId?: string | null;
}
interface AgentSkillsRefreshOptions {
    cwds?: string[];
    forceReload?: boolean;
}
interface AgentSkillConfigWriteOptions {
    enabled: boolean;
    name?: string | null;
    path?: string | null;
}
interface AgentHooksRefreshOptions {
    cwds?: string[];
}

declare function useAgentApps(threadId?: string): {
    apps: AgentApp[];
    loadMoreApps: () => Promise<{
        apps: AgentApp[];
        nextCursor: string | null;
    } | undefined>;
    nextCursor: string | null | undefined;
    refreshApps: (params?: AgentAppsRefreshOptions) => Promise<{
        apps: AgentApp[];
        nextCursor: string | null;
    }>;
};

declare function useAgentSkills(cwd?: string): {
    refreshSkills: (params?: AgentSkillsRefreshOptions) => Promise<{
        cwd: string;
        skills: {
            enabled: boolean | undefined;
            name: string;
            path: string | undefined;
        }[];
    }[]>;
    setSkillEnabled: (params: AgentSkillConfigWriteOptions) => Promise<void>;
    skills: _nyosegawa_agent_ui_core.AgentSkill[];
};
declare function useAgentHooks(cwd?: string): {
    hooks: _nyosegawa_agent_ui_core.AgentHook[];
    refreshHooks: (params?: AgentHooksRefreshOptions) => Promise<{
        cwd: string;
        hooks: {
            cwd: string;
            enabled: boolean | undefined;
            id: string;
            name: string | undefined;
        }[];
    }[]>;
};

declare function useAgentDiagnostics(): {
    auditDiagnostics: _nyosegawa_agent_ui_core.DiagnosticsState;
    banners: _nyosegawa_agent_ui_core.StatusBannerState[];
    developerDiagnostics: _nyosegawa_agent_ui_core.DiagnosticsState;
    diagnostics: _nyosegawa_agent_ui_core.DiagnosticsState;
    errors: _nyosegawa_agent_ui_core.AgentError[];
    protocolNotifications: _nyosegawa_agent_ui_core.ProtocolNotificationState[];
    userDiagnostics: _nyosegawa_agent_ui_core.DiagnosticsState;
    warnings: _nyosegawa_agent_ui_core.WarningState[];
};

declare function useAgentModels(): {
    models: AgentModel[];
    refreshModels: () => Promise<AgentModel[]>;
};

declare function useAgentApprovals(threadId?: ThreadId): {
    approvals: _nyosegawa_agent_ui_core.PendingServerRequest[];
    approve: (requestId: RequestId, result?: unknown) => Promise<void>;
    reject: (requestId: RequestId, message?: string) => Promise<void>;
};
declare function useAgentServerRequests(threadId?: ThreadId): {
    requests: _nyosegawa_agent_ui_core.PendingServerRequest[];
    respond: (requestId: RequestId, result: unknown) => Promise<void>;
    reject: (requestId: RequestId, error: AgentError | string) => Promise<void>;
};

interface QueuedFollowUp {
    attachments: QueuedFollowUpAttachment[];
    expectedTurnId?: string;
    id: string;
    input: AgentUserInput[];
    text: string;
    threadId: ThreadId;
}
interface QueuedFollowUpAttachment {
    displayName?: string;
    extension?: string;
    id: string;
    input?: AgentUserInput | AgentUserInput[];
    kind: "image" | "file" | "app" | "plugin";
    label: string;
    previewUrl?: string;
    previewUrlRevoke?: boolean;
    redactedPath?: string;
    sizeLabel?: string;
    value: string;
}

interface AgentComposerController {
    activeTurnId?: string;
    canSubmit: boolean;
    cancelFailedPendingMessage: (operationId: string) => void;
    disabledReason?: AgentComposerDisabledReason;
    editQueuedFollowUp: (id: string) => QueuedFollowUp | undefined;
    error?: string;
    failedPendingMessages: AgentComposerFailedPendingMessage[];
    followUpErrors: Record<string, string>;
    isInterrupting: boolean;
    isRunning: boolean;
    isSubmitting: boolean;
    queuedFollowUps: QueuedFollowUp[];
    removeQueuedFollowUp: (id: string) => void;
    retryFailedPendingMessage: (operationId: string) => Promise<void>;
    sendQueuedFollowUp: (id: string) => Promise<void>;
    sendingFollowUpIds: string[];
    setError: Dispatch<SetStateAction<string | undefined>>;
    setValue: Dispatch<SetStateAction<string>>;
    steerNow: (items?: AgentUserInput[]) => Promise<void>;
    stop: () => Promise<void>;
    submit: (items?: AgentUserInput[], options?: {
        attachments?: QueuedFollowUpAttachment[];
    }) => Promise<string | undefined>;
    submitMode: AgentComposerSubmitMode;
    value: string;
}
type AgentComposerDisabledReason = "empty" | "interrupting" | "submitting";
interface AgentComposerFailedPendingMessage {
    error?: string;
    operationId: string;
    threadId: string;
}
type AgentComposerSubmitMode = "queue" | "send" | "stop";

declare function useAgentComposer(threadId?: ThreadId): AgentComposerController;
declare function useAgentComposerController(threadId?: ThreadId): AgentComposerController;

interface AgentExecutionMode {
    id: ExecutionModeId;
    label: string;
    description: string;
    turnParams: TurnStartOptions;
}
declare const AGENT_EXECUTION_MODES: AgentExecutionMode[];
declare function useAgentRunSettings(): {
    executionModes: AgentExecutionMode[];
    models: AgentModel[];
    runSettings: _nyosegawa_agent_ui_core.RunSettingsState;
    selectedModel: AgentModel | undefined;
    setCwd: (cwd: string) => void;
    setEffort: (effort: ReasoningEffort) => void;
    setExecutionMode: (executionMode: ExecutionModeId) => void;
    setModelId: (modelId: string) => void;
    supportedEfforts: string[];
};

interface AgentThreadStartResult {
    threadId: ThreadId;
}
interface AgentThreadResumeResult {
    threadId: ThreadId;
}
interface AgentThreadReadResult {
    threadId: ThreadId;
}
interface AgentThreadForkResult {
    threadId: ThreadId;
}
interface AgentThreadHistoryResult {
    nextCursor: string | null;
    threadIds: ThreadId[];
}
declare function useAgentThread(threadId?: ThreadId): {
    resumeThread: (id: ThreadId, params?: ThreadResumeOptions) => Promise<{
        threadId: string;
    }>;
    startThread: (params?: ThreadStartOptions) => Promise<{
        threadId: string;
    }>;
    thread: ThreadState | undefined;
    threadId: string | undefined;
    turns: (_nyosegawa_agent_ui_core.TurnState | undefined)[];
};
declare const useAgentThreadController: typeof useAgentThread;
declare function useAgentThreadActions(threadId?: ThreadId): {
    archiveThread: () => Promise<void>;
    compactThread: () => Promise<void>;
    forkThread: (params?: ThreadForkOptions) => Promise<{
        threadId: string;
    }>;
    renameThread: (name: string) => Promise<void>;
    rollbackThread: (numTurns?: number) => Promise<void>;
    threadId: string | undefined;
    unarchiveThread: () => Promise<void>;
};
declare function useAgentThreads(): {
    activeThreadId: string | undefined;
    setActiveThread: (threadId?: ThreadId) => void;
    threads: ThreadState[];
};
declare function useAgentThreadHistory(): {
    cursor: string | null | undefined;
    error: Error | undefined;
    isLoading: boolean;
    listThreads: (params?: ThreadHistoryParams) => Promise<{
        nextCursor: string | null;
        threadIds: string[];
    }>;
    threads: ThreadState[];
};
declare function useAgentThreadReader(): {
    readThread: (threadId: ThreadId, options?: {
        activate?: boolean;
        includeTurns?: boolean;
    }) => Promise<{
        threadId: string;
    }>;
};

interface AgentThreadListController {
    activateThread: (threadId: ThreadId) => Promise<ThreadId>;
    collection?: AgentThreadCollection;
    error?: AgentError;
    hasLoaded: boolean;
    invalidate: () => void;
    isLoading: boolean;
    listThreads: (params?: AgentThreadListRequest) => Promise<AgentThreadListResult>;
    loadNextPage: () => Promise<AgentThreadListResult | undefined>;
    nextCursor: string | null;
    previewThread: (threadId: ThreadId) => Promise<void>;
    refresh: () => Promise<AgentThreadListResult>;
    resumeThread: (threadId: ThreadId, params?: ThreadResumeOptions) => Promise<ThreadId>;
    scope: AgentThreadScope;
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
    threads: AgentThreadView$1[];
}
interface AgentThreadListRequest extends ThreadHistoryParams {
    append?: boolean;
}
interface AgentThreadListResult extends AgentThreadHistorySyncedEvent {
    stale: boolean;
}
interface AgentThreadListControllerOptions {
    onHistorySynced?: (event: AgentThreadHistorySyncedEvent) => void;
}
interface AgentThreadHistorySyncedEvent {
    append: boolean;
    nextCursor: string | null;
    scope: AgentThreadScope;
    searchTerm?: string;
    syncedAt: number;
    threadIds: ThreadId[];
}
declare function useAgentThreadListController(scope?: AgentThreadScope, options?: AgentThreadListControllerOptions): AgentThreadListController;

declare function useAgentTurn(threadId?: ThreadId): {
    interruptTurn: (turnId: string) => Promise<void>;
    startTurn: (input: string | AgentUserInput[], params?: TurnStartOptions) => Promise<void>;
    steerTurn: (expectedTurnId: string, input: string | AgentUserInput[]) => Promise<void>;
};
declare const useAgentTurnController: typeof useAgentTurn;

interface AgentTranscriptScrollControllerOptions {
    hiddenItemCount?: number;
    onShowEarlierItems?: () => void;
    pendingApprovalSelector?: string;
    scrollContainerRef?: React$1.RefObject<HTMLElement | null>;
    scrollKey?: string | number;
    threadId: string;
    turnCount: number;
}
interface AgentTranscriptScrollController {
    canShowEarlierItems: boolean;
    handleScroll(): void;
    jumpToLatest(): void;
    jumpToPendingApproval(): void;
    scrollContainerRef: React$1.RefObject<HTMLElement | null>;
    showEarlierItems(): void;
    showJumpLatest: boolean;
    showJumpApproval: boolean;
}
declare function useAgentTranscriptScrollController({ hiddenItemCount, onShowEarlierItems, pendingApprovalSelector, scrollContainerRef, scrollKey, threadId, turnCount, }: AgentTranscriptScrollControllerOptions): AgentTranscriptScrollController;

interface ApprovalAnchors {
    afterTurn: PendingServerRequest[];
    byItemId: Record<string, PendingServerRequest[]>;
    renderApprovalAnchor: (approval: PendingServerRequest) => React$1.ReactNode;
}
interface TranscriptApprovalAnchors {
    requests: PendingServerRequest[];
    renderApprovalAnchor: (approval: PendingServerRequest) => React$1.ReactNode;
}

type AgentTranscriptDensityMode = "default" | "compact" | "verbose" | "critical-only";
interface AgentTranscriptDensityConfig {
    default?: AgentTranscriptDensityMode;
    byBlockKind?: Partial<Record<AgentItemBlockKind, AgentTranscriptDensityMode>>;
}
type AgentTranscriptDensity = AgentTranscriptDensityMode | AgentTranscriptDensityConfig;
interface AgentTranscriptPendingState {
    status: "failed" | "inProgress";
}
type AgentTranscriptBlock = AgentItemBlock;
type AgentTranscriptItem = AgentItemState;
interface AgentTranscriptEntry {
    approvals: PendingServerRequest[];
    block: AgentTranscriptBlock;
    dataKind: string;
    density: AgentTranscriptDensityMode;
    displayStatus: string;
    id: string;
    item?: AgentTranscriptItem;
    itemId: string;
    key: string;
    pending?: AgentTranscriptPendingState;
    role: "assistant" | "command" | "system" | "tool" | "user";
    status: AgentItemState["status"] | "streaming";
    text?: string;
    turnId: string;
}
interface AgentTranscriptControllerOptions {
    approvalAnchors?: TranscriptApprovalAnchors;
    density?: AgentTranscriptDensity;
}
interface AgentTranscriptController {
    density: AgentTranscriptDensityMode;
    entries: AgentTranscriptEntry[];
    entriesByTurnId: Map<string, AgentTranscriptEntry[]>;
    hiddenItemCount: number;
    showEarlierItems(): void;
    visibleItemCount: number;
}
declare function useAgentTranscriptController(threadId?: ThreadId, options?: AgentTranscriptControllerOptions): AgentTranscriptController;

declare function useAgentUsage(): {
    rateLimits: unknown;
    refreshUsage: () => Promise<void>;
};

type AgentLocale = "en" | "ja" | "ko" | "zh-CN" | "es" | "fr";
declare const agentLocales: AgentLocale[];
interface AgentI18nDictionary {
    "account.authenticated": string;
    "account.authenticating": string;
    "account.checking": string;
    "account.connecting": string;
    "account.cancelLogin": string;
    "account.details": string;
    "account.email": string;
    "account.login": string;
    "account.logout": string;
    "account.openDeviceLogin": string;
    "account.openMenu": string;
    "account.plan": string;
    "account.status": string;
    "account.unauthenticated": string;
    "approval.action.approve": string;
    "approval.action.approveAria": string;
    "approval.action.approveForSession": string;
    "approval.action.approveForSessionAria": string;
    "approval.action.decline": string;
    "approval.action.declineAria": string;
    "approval.action.review": string;
    "approval.action.reviewAria": string;
    "approval.aria.otherPending": string;
    "approval.aria.pending": string;
    "approval.aria.pendingOne": string;
    "approval.count": string;
    "approval.kind.attestation": string;
    "approval.kind.authRefresh": string;
    "approval.kind.command": string;
    "approval.kind.dynamicTool": string;
    "approval.kind.fileChange": string;
    "approval.kind.generic": string;
    "approval.kind.mcpInput": string;
    "approval.kind.permissions": string;
    "approval.kind.userInput": string;
    "approval.meta.approvalPolicy": string;
    "approval.meta.item": string;
    "approval.meta.namespace": string;
    "approval.meta.sandbox": string;
    "approval.meta.tool": string;
    "approval.meta.workingDirectory": string;
    "approval.request.command": string;
    "approval.request.fileChange": string;
    "approval.request.generic": string;
    "approval.risk.high": string;
    "approval.risk.low": string;
    "approval.risk.medium": string;
    "approval.riskSuffix": string;
    "approval.summary.command": string;
    "approval.summary.default": string;
    "approval.summary.dynamicTool": string;
    "approval.summary.fileChange": string;
    "approval.summary.mcpInput": string;
    "approval.summary.permissions": string;
    "approval.summary.userInput": string;
    "aria.actions": string;
    "aria.agentContext": string;
    "aria.changedFiles": string;
    "aria.codeMirrorPatchViewer": string;
    "aria.commandOutput": string;
    "aria.completedTask": string;
    "aria.composerAttachments": string;
    "aria.contextUsage": string;
    "aria.contextUsageDetails": string;
    "aria.criticalStatus": string;
    "aria.diffPreview": string;
    "aria.dismissThreadHistory": string;
    "aria.message": string;
    "aria.messageComposer": string;
    "aria.openTask": string;
    "aria.patchContent": string;
    "aria.pendingAttachments": string;
    "aria.runSettings": string;
    "aria.statusDetails": string;
    "aria.statusSummary": string;
    "aria.threadStartContext": string;
    "aria.threads": string;
    "aria.tokenUsage": string;
    "aria.usageLimits": string;
    "aria.usageSummary": string;
    "apps.authNeeded": string;
    "apps.disabled": string;
    "apps.empty": string;
    "apps.label": string;
    "apps.loadMore": string;
    "apps.notInstalled": string;
    "apps.unavailable": string;
    "common.cancel": string;
    "common.close": string;
    "common.closeMenu": string;
    "common.collapse": string;
    "common.default": string;
    "common.details": string;
    "common.disable": string;
    "common.enable": string;
    "common.expand": string;
    "common.file": string;
    "common.files": string;
    "common.loading": string;
    "common.message": string;
    "common.messages": string;
    "common.notice": string;
    "common.notices": string;
    "common.open": string;
    "common.refresh": string;
    "common.refreshing": string;
    "common.serverDefault": string;
    "common.syncPending": string;
    "common.unknown": string;
    "composer.addFollowUp": string;
    "composer.attachFile": string;
    "composer.attachFiles": string;
    "composer.attachedFollowUp": string;
    "composer.attachmentRejected": string;
    "composer.attachmentRejectedMany": string;
    "composer.attachmentRejectedOne": string;
    "composer.cannotAcceptFollowUp": string;
    "composer.couldNotSendAdditional": string;
    "composer.couldNotStart": string;
    "composer.couldNotStop": string;
    "composer.enterToSend": string;
    "composer.followUpNoActiveTurn": string;
    "composer.followUpTurnChanged": string;
    "composer.followUpTurnChangedRefresh": string;
    "composer.app": string;
    "composer.mentionApp": string;
    "composer.mentionPlugin": string;
    "composer.plugin": string;
    "composer.placeholder": string;
    "composer.previewOnlyReason": string;
    "composer.removeAttachment": string;
    "composer.resolveApprovalReason": string;
    "composer.send": string;
    "composer.sendMessage": string;
    "composer.stopCurrentTurn": string;
    "context.cachedInput": string;
    "context.compactionNotice": string;
    "context.contextWindow": string;
    "context.input": string;
    "context.lastTurn": string;
    "context.output": string;
    "context.reasoning": string;
    "context.title": string;
    "context.used": string;
    "diagnostics.label": string;
    "diagnostics.messageCount": string;
    "diagnostics.pluginManifestWarnings": string;
    "diagnostics.syncing": string;
    "diagnostics.withPluginWarnings": string;
    "firstRun.authenticating.body": string;
    "firstRun.authenticating.title": string;
    "firstRun.bridgeError.body": string;
    "firstRun.bridgeError.title": string;
    "firstRun.connect.body": string;
    "firstRun.connect.cta": string;
    "firstRun.connect.title": string;
    "firstRun.error": string;
    "firstRun.form": string;
    "firstRun.placeholder": string;
    "firstRun.preparing.body": string;
    "firstRun.preparing.cta": string;
    "firstRun.preparing.title": string;
    "firstRun.startThread": string;
    "followUp.attachments": string;
    "followUp.attachmentsMany": string;
    "followUp.attachmentsOne": string;
    "followUp.earlier": string;
    "followUp.earlierMany": string;
    "followUp.earlierOne": string;
    "followUp.earlierQueued": string;
    "followUp.edit": string;
    "followUp.queued": string;
    "followUp.queuedAttachments": string;
    "followUp.remove": string;
    "followUp.sendNow": string;
    "locale.en": string;
    "locale.es": string;
    "locale.fr": string;
    "locale.ja": string;
    "locale.ko": string;
    "locale.label": string;
    "locale.zh-CN": string;
    "markdown.completedTask": string;
    "markdown.openTask": string;
    "run.clearWorkingDirectory": string;
    "run.cwd.noRecent": string;
    "run.cwd.openFolder": string;
    "run.cwd.openFolderAction": string;
    "run.cwd.prompt": string;
    "run.cwd.recent": string;
    "run.cwd.selectFolder": string;
    "run.cwd.serverDefault": string;
    "run.defaultEffort": string;
    "run.defaultModel": string;
    "run.effort": string;
    "run.effort.high": string;
    "run.effort.low": string;
    "run.effort.medium": string;
    "run.effort.minimal": string;
    "run.effort.veryHigh": string;
    "run.executionMode": string;
    "run.mode": string;
    "run.mode.auto.description": string;
    "run.mode.auto.label": string;
    "run.mode.full-access.description": string;
    "run.mode.full-access.label": string;
    "run.mode.read-only.description": string;
    "run.mode.read-only.label": string;
    "run.mode.review.description": string;
    "run.mode.review.label": string;
    "run.model": string;
    "run.modelAndEffort": string;
    "run.modelDefault": string;
    "run.noSelectableEffort": string;
    "run.serverDefault": string;
    "run.workingDirectory": string;
    "skills.empty": string;
    "skills.label": string;
    "status.account": string;
    "status.backgroundNotice": string;
    "status.configWarning": string;
    "status.critical": string;
    "status.deprecationNotice": string;
    "status.failed": string;
    "status.mcpOAuth": string;
    "status.modelReroute": string;
    "status.rateLimit": string;
    "status.title": string;
    "status.total": string;
    "status.warning": string;
    "theme.dark": string;
    "theme.label": string;
    "theme.light": string;
    "theme.system": string;
    "thread.action.archive": string;
    "thread.action.compact": string;
    "thread.action.fork": string;
    "thread.action.rename": string;
    "thread.action.rollback": string;
    "thread.action.unarchive": string;
    "thread.closeHistory": string;
    "thread.codexSession": string;
    "thread.collapseHistory": string;
    "thread.empty": string;
    "thread.ephemeralSession": string;
    "thread.expandHistory": string;
    "thread.history": string;
    "thread.namePrompt": string;
    "thread.new": string;
    "thread.noThreadsFound": string;
    "thread.openHistory": string;
    "thread.search": string;
    "thread.searchHistory": string;
    "thread.status.complete": string;
    "thread.status.failed": string;
    "thread.status.needsApproval": string;
    "thread.status.preview": string;
    "thread.status.ready": string;
    "thread.status.running": string;
    "thread.status.stored": string;
    "thread.threadCount": string;
    "thread.untitled": string;
    "timeline.agentTool": string;
    "timeline.arguments": string;
    "timeline.argumentsPreview": string;
    "timeline.assistant": string;
    "timeline.collab": string;
    "timeline.collabTool": string;
    "timeline.command": string;
    "timeline.compaction": string;
    "timeline.diff": string;
    "timeline.earlierHidden": string;
    "timeline.error": string;
    "timeline.exitCode": string;
    "timeline.file": string;
    "timeline.fileChange": string;
    "timeline.fileChanges": string;
    "timeline.files": string;
    "timeline.filesChanged": string;
    "timeline.from": string;
    "timeline.image": string;
    "timeline.imageGenerated": string;
    "timeline.localMediaUnavailable": string;
    "timeline.item": string;
    "timeline.items": string;
    "timeline.jumpToPendingApproval": string;
    "timeline.jumpToLatest": string;
    "timeline.lines": string;
    "timeline.mcpTool": string;
    "timeline.noPatch": string;
    "timeline.noTerminalOutput": string;
    "timeline.output": string;
    "timeline.plan": string;
    "timeline.reasoning": string;
    "timeline.result": string;
    "timeline.resultCaptured": string;
    "timeline.resultItems": string;
    "timeline.search": string;
    "timeline.showEarlier": string;
    "timeline.system": string;
    "timeline.terminal": string;
    "timeline.thinking": string;
    "timeline.thread": string;
    "timeline.to": string;
    "timeline.tool": string;
    "timeline.toolCall": string;
    "timeline.unknownTool": string;
    "timeline.webSearch": string;
    "timeline.you": string;
    "usage.empty": string;
    "usage.inputOutput": string;
    "usage.label": string;
    "usage.limits": string;
    "usage.meterLabel": string;
    "usage.namedWindow": string;
    "usage.resetAt": string;
    "usage.hourWindow": string;
    "usage.tokens": string;
    "usage.title": string;
    "usage.weeklyWindow": string;
}
type AgentI18nKey = keyof AgentI18nDictionary;
type AgentI18nMessages = Partial<AgentI18nDictionary>;
interface AgentI18nValue {
    locale: AgentLocale;
    t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string;
}
interface AgentI18nProviderProps extends PropsWithChildren {
    locale?: AgentLocale | string;
    messages?: AgentI18nMessages;
}

declare function AgentI18nProvider({ children, locale, messages, }: AgentI18nProviderProps): react_jsx_runtime.JSX.Element;
declare function useAgentI18n(): AgentI18nValue;

declare function interpolate(template: string, vars: Record<string, string | number> | undefined): string;
declare function interpolationVariables(template: string): string[];

declare const agentI18nDictionaries: Record<AgentLocale, AgentI18nDictionary>;

declare function normalizeAgentLocale(locale?: AgentLocale | string): AgentLocale;

type AgentResourceKind = "image" | "file" | "app" | "plugin" | "url" | "unavailable";
interface AgentResolvedResourceBase {
    displayName?: string;
    id?: string;
    input?: AgentUserInput | AgentUserInput[];
    mimeType?: string;
    name?: string;
    path?: string;
    previewUrl?: string;
    redactedPath?: string;
    reason?: string;
    sizeBytes?: number;
    url?: string;
}
interface AgentResolvedUrlResource extends AgentResolvedResourceBase {
    kind: "url";
}
interface AgentUnavailableResource extends AgentResolvedResourceBase {
    kind: "unavailable";
}
type AgentResolvedResource = AgentResolvedUrlResource | AgentUnavailableResource;
interface AgentFileResourceRequest {
    file: File;
    kind: Extract<AgentResourceKind, "image" | "file">;
    source: "file";
}
interface AgentLocalMediaResourceRequest {
    item?: AgentItemState;
    path: string;
    source: "local-media";
}
type AgentResourceRequest = AgentFileResourceRequest | AgentLocalMediaResourceRequest;
type AgentResourceResolution = AgentResolvedResource | null | undefined;
type AgentResourceResolver = (request: AgentResourceRequest) => AgentResourceResolution | Promise<AgentResourceResolution>;
declare function agentResourceUrl(resource: AgentResolvedResourceBase | null | undefined): string | undefined;
declare function agentResourceDisplayName(resource: AgentResolvedResourceBase | null | undefined, fallback?: string): string | undefined;

type ComposerAttachmentKind = Extract<AgentResourceKind, "image" | "file" | "app" | "plugin">;
type AgentLocalAttachmentKind = Extract<AgentResourceKind, "image" | "file">;
interface AgentResolvedLocalAttachment extends AgentResolvedResourceBase {
    input: AgentUserInput | AgentUserInput[];
}
type AgentLocalAttachmentResolver = (file: File, kind: AgentLocalAttachmentKind) => AgentResolvedLocalAttachment | null | undefined | Promise<AgentResolvedLocalAttachment | null | undefined>;
type AgentMentionAttachmentKind = Extract<ComposerAttachmentKind, "app" | "plugin">;
interface AgentComposerMentionAttachment {
    id?: string;
    input?: AgentUserInput;
    label: string;
    value: string;
}
type AgentComposerMentionResolver = () => AgentComposerMentionAttachment | null | undefined | Promise<AgentComposerMentionAttachment | null | undefined>;

interface AgentComposerSubmitButtonProps {
    canSubmit: boolean;
    className?: string;
    iconSize?: number;
    isStopAction: boolean;
    label?: string;
    title?: string;
}
declare function AgentComposerSubmitButton({ canSubmit, className, iconSize, isStopAction, label, title, }: AgentComposerSubmitButtonProps): react_jsx_runtime.JSX.Element;

type AgentAttachmentChipKind = Extract<AgentResourceKind, "image" | "file" | "app" | "plugin">;
interface AgentAttachmentChip {
    extension?: string;
    id: string;
    kind: AgentAttachmentChipKind;
    label: string;
    previewFailed?: boolean;
    previewUrl?: string;
    sizeLabel?: string;
}
interface AgentAttachmentChipsProps {
    attachments: readonly AgentAttachmentChip[];
    onPreviewFailed?: (id: string) => void;
    onRemove?: (id: string) => void;
}
declare function AgentAttachmentChips({ attachments, onPreviewFailed, onRemove, }: AgentAttachmentChipsProps): react_jsx_runtime.JSX.Element | null;
interface AgentComposerInputProps extends React$1.TextareaHTMLAttributes<HTMLTextAreaElement> {
    shortcutHintId?: string;
}
declare const AgentComposerInput: React$1.ForwardRefExoticComponent<AgentComposerInputProps & React$1.RefAttributes<HTMLTextAreaElement>>;
interface AgentComposerToolbarProps {
    className?: string;
    end?: React$1.ReactNode;
    start?: React$1.ReactNode;
}
declare function AgentComposerToolbar({ className, end, start, }: AgentComposerToolbarProps): react_jsx_runtime.JSX.Element;
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

type AgentWorkingDirectoryResolver = () => Promise<string | null | undefined> | string | null | undefined;
/**
 * Compact working-directory selector for the start screen. cwd is a
 * thread-start setting, so it sits beneath the starter composer as a context
 * pill rather than inside the composer toolbar.
 */
declare function AgentStarterCwd({ onRequestWorkingDirectory, }: {
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
}): react_jsx_runtime.JSX.Element;

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
/**
 * Mode / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here; cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
declare function ComposerRunSettings(): react_jsx_runtime.JSX.Element;

declare function AgentFirstRun({ onRequestWorkingDirectory, onStartThread, }: {
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
    onStartThread: (prompt?: string) => Promise<void> | void;
}): react_jsx_runtime.JSX.Element;
interface AgentStartComposerProps {
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
    onStartThread: (prompt?: string) => Promise<void> | void;
}
declare function AgentStartComposer({ onRequestWorkingDirectory, onStartThread, }: AgentStartComposerProps): react_jsx_runtime.JSX.Element;

declare function ThreadList({ activeThreadId, footer, onSelectThread, threads, }: {
    activeThreadId?: string;
    footer?: React.ReactNode;
    onSelectThread?: (threadId: string) => void;
    threads: AgentThreadView$1[];
}): react_jsx_runtime.JSX.Element;
declare function formatThreadStatus(status: string, options?: {
    hasTurns?: boolean;
    t?: (key: AgentI18nKey) => string;
}): string;
declare function threadSubtitle(thread: AgentThread, t?: (key: AgentI18nKey) => string): string;
declare function isUserFacingPath(path: string): boolean;
declare function AgentThreadSidebar({ activeThreadId, collapsed, onCreateThread, onCollapsedChange, onSelectThread, threads, }: {
    activeThreadId?: string;
    collapsed?: boolean;
    onCreateThread?: () => void;
    onCollapsedChange?: (collapsed: boolean) => void;
    onSelectThread?: (threadId: string) => void;
    threads: AgentThreadView$1[];
}): react_jsx_runtime.JSX.Element | null;

type AgentTheme = "light" | "dark" | "system";
interface AgentThemeToggleProps {
    "aria-label"?: string;
    disabled?: boolean;
    onChange: (theme: AgentTheme) => void;
    value: AgentTheme;
}
declare function AgentThemeToggle({ "aria-label": ariaLabel, disabled, onChange, value, }: AgentThemeToggleProps): react_jsx_runtime.JSX.Element;

interface AgentThreadUrlRoutingOptions {
    basePath?: string;
    homePath?: string;
}

type AgentLocalMediaUrlResolver = (path: string, item: AgentItemState | undefined) => AgentResourceResolution;
declare function AgentContentBlockView({ block, item, output, patch, resolveLocalMediaUrl, }: {
    block: AgentItemBlock;
    item?: AgentItemState;
    output?: string;
    patch?: unknown;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
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

declare function AgentMessageList({ footer, approvalAnchors, components, renderItem, density, resolveLocalMediaUrl, scrollKey, thread, }: {
    /**
     * Trailing transcript content rendered as the final scroll-area item.
     * The default thread view uses it to keep the pending-approval surface
     * inside the transcript instead of in a separate scroll pane.
     */
    footer?: React$1.ReactNode;
    approvalAnchors?: TranscriptApprovalAnchors;
    components?: AgentComponents;
    density?: AgentTranscriptDensity;
    renderItem?: (item: AgentItemState, turn: TurnState, Default: React$1.ComponentType<AgentItemDefaultProps>) => React$1.ReactNode;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
    scrollKey?: string | number;
    thread: ThreadState;
}): react_jsx_runtime.JSX.Element;
declare const AgentTranscript: typeof AgentMessageList;
declare function AgentTurn({ approvals, components, entries, renderItem, resolveLocalMediaUrl, threadStatus, turn, }: {
    approvals?: ApprovalAnchors;
    components?: AgentComponents;
    entries?: AgentTranscriptEntry[];
    renderItem?: (item: AgentItemState, turn: TurnState, Default: React$1.ComponentType<AgentItemDefaultProps>) => React$1.ReactNode;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    threadStatus: ThreadState["status"];
    turn: TurnState;
}): react_jsx_runtime.JSX.Element;

interface AgentApprovalComponentProps {
    approval: PendingServerRequest;
    Default: React$1.ComponentType<AgentApprovalDefaultProps>;
}
interface AgentApprovalDefaultProps {
    approval: PendingServerRequest;
}
interface AgentItemComponentProps {
    Default: React$1.ComponentType<AgentItemDefaultProps>;
    item: AgentItemState;
    turn: TurnState;
}
interface AgentItemDefaultProps {
    item: AgentItemState;
    turn: TurnState;
}
interface AgentShellComponentProps extends AgentShellProps {
    Default: React$1.ComponentType<AgentShellProps>;
}
interface AgentSidebarComponentProps extends React$1.ComponentProps<typeof AgentThreadSidebar> {
    Default: React$1.ComponentType<React$1.ComponentProps<typeof AgentThreadSidebar>>;
}
interface AgentEmptyStateComponentProps extends React$1.ComponentProps<typeof AgentFirstRun> {
    Default: React$1.ComponentType<React$1.ComponentProps<typeof AgentFirstRun>>;
}
interface AgentComposerPanelComponentProps extends AgentComposerPanelProps {
    Default: React$1.ComponentType<AgentComposerPanelProps>;
}
interface AgentBlockDefaultProps {
    block: AgentTranscriptBlock;
    item?: AgentTranscriptItem;
}
interface AgentBlockComponentProps extends AgentBlockDefaultProps {
    Default: React$1.ComponentType<AgentBlockDefaultProps>;
}
interface AgentComponents {
    Approval?: React$1.ComponentType<AgentApprovalComponentProps>;
    ComposerPanel?: React$1.ComponentType<AgentComposerPanelComponentProps>;
    EmptyState?: React$1.ComponentType<AgentEmptyStateComponentProps>;
    Item?: React$1.ComponentType<AgentItemComponentProps>;
    Shell?: React$1.ComponentType<AgentShellComponentProps>;
    Sidebar?: React$1.ComponentType<AgentSidebarComponentProps>;
    blocks?: Partial<Record<AgentTranscriptBlock["kind"], React$1.ComponentType<AgentBlockComponentProps>>>;
}
declare const defaultAgentComponents: {
    ComposerPanel: typeof AgentComposerPanel;
    EmptyState: typeof AgentFirstRun;
    Shell: typeof AgentShell;
    Sidebar: typeof AgentThreadSidebar;
};
interface AgentChatProps {
    className?: string;
    components?: AgentComponents;
    diagnostics?: boolean;
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestWorkingDirectory?: AgentWorkingDirectoryResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    sidebar?: boolean;
    statusBarEnd?: React$1.ReactNode;
    theme?: AgentTheme;
    locale?: AgentLocale | string;
    messages?: AgentI18nMessages;
    threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
    usage?: boolean;
}
declare function AgentChat({ className, components, diagnostics, onRequestAppMention, onRequestWorkingDirectory, onRequestPluginMention, resolveLocalAttachment, resolveLocalMediaUrl, sidebar, statusBarEnd, theme, locale, messages, threadUrlRouting, usage, }?: AgentChatProps): react_jsx_runtime.JSX.Element;
interface AgentShellProps extends React$1.HTMLAttributes<HTMLElement> {
    sidebar?: React$1.ReactNode;
    theme?: AgentTheme;
}
declare function AgentShell({ children, className, sidebar, theme, ...props }: AgentShellProps): react_jsx_runtime.JSX.Element;

interface AgentThreadViewProps {
    components?: AgentComponents;
    onRequestAppMention?: AgentComposerMentionResolver;
    onRequestPluginMention?: AgentComposerMentionResolver;
    renderApproval?: (approval: PendingServerRequest) => React$1.ReactNode;
    renderItem?: React$1.ComponentProps<typeof AgentMessageList>["renderItem"];
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    threadId?: string;
}
declare function AgentThreadView({ components, onRequestAppMention, onRequestPluginMention, renderApproval, renderItem, resolveLocalAttachment, resolveLocalMediaUrl, threadId, }: AgentThreadViewProps): react_jsx_runtime.JSX.Element | null;
declare function AgentThreadSurface({ children, className, }: {
    children: React$1.ReactNode;
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
declare function AgentThreadTimeline({ components, renderApproval, renderItem, resolveLocalMediaUrl, thread, threadId, }: {
    components?: AgentComponents;
    renderApproval?: (approval: PendingServerRequest) => React$1.ReactNode;
    renderItem?: React$1.ComponentProps<typeof AgentMessageList>["renderItem"];
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    thread: ThreadState;
    threadId?: string;
}): react_jsx_runtime.JSX.Element;

declare function AgentContextUsageIndicator({ tokenUsage, }: {
    tokenUsage?: ThreadTokenUsage;
}): react_jsx_runtime.JSX.Element | null;

declare function AgentApprovalQueue({ approvals: approvalsProp, renderApproval, threadId, }: {
    approvals?: PendingServerRequest[];
    renderApproval?: (approval: PendingServerRequest) => React$1.ReactNode;
    threadId?: string;
}): react_jsx_runtime.JSX.Element | null;

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

declare function AgentStatusBar({ end, onNavigateHome, onOpenThreads, }?: {
    end?: React$1.ReactNode;
    onNavigateHome?: () => void;
    onOpenThreads?: () => void;
}): react_jsx_runtime.JSX.Element;
declare function AgentDiagnosticsPanel({ bootstrap, }: {
    bootstrap: ReturnType<typeof useAgentBootstrap>;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentStatusSummary(): react_jsx_runtime.JSX.Element | null;
declare function AgentStatusDetails({ includeCritical }: {
    includeCritical?: boolean;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentCriticalNoticeList(): react_jsx_runtime.JSX.Element | null;

interface AgentWorkspaceProps extends AgentChatProps {
    panel?: React$1.ReactNode;
    panelClassName?: string;
}
declare function AgentWorkspace({ panel, panelClassName, ...chatProps }: AgentWorkspaceProps): react_jsx_runtime.JSX.Element;

interface AgentLocaleSelectProps {
    "aria-label"?: string;
    disabled?: boolean;
    onChange: (locale: AgentLocale) => void;
    value: AgentLocale;
}
declare function AgentLocaleSelect({ "aria-label": ariaLabel, disabled, onChange, value, }: AgentLocaleSelectProps): react_jsx_runtime.JSX.Element;

declare function AgentDiffViewer({ patch }: {
    patch: unknown;
}): react_jsx_runtime.JSX.Element;

declare const DEFAULT_TRANSCRIPT_ITEM_LIMIT = 48;
declare const TRANSCRIPT_ITEM_INCREMENT = 48;
declare function transcriptItemIds(turn: TurnState): string[];
declare function visibleTranscriptWindow(thread: ThreadState, visibleItemLimit: number, options?: {
    pinnedItemIdsByTurnId?: Map<string, string[]>;
}): {
    itemIdsByTurnId: Map<string, string[]>;
    totalItemCount: number;
    visibleItemCount: number;
};

interface UsageWindow {
    id: string;
    label: string;
    percent: number;
    resetLabel?: string;
    valueLabel: string;
}
type UsageTranslator = (key: AgentI18nKey, vars?: Record<string, string | number>) => string;
declare function normalizeUsageWindows(rateLimits: unknown, t?: UsageTranslator): UsageWindow[];

export { AGENT_EXECUTION_MODES, type AgentApprovalComponentProps, type AgentApprovalDefaultProps, type AgentApprovalPolicy, AgentApprovalQueue, type AgentApprovalsReviewer, AgentAppsPanel, type AgentAppsRefreshOptions, type AgentAttachmentChip, type AgentAttachmentChipKind, AgentAttachmentChips, type AgentAttachmentChipsProps, type AgentBlockComponentProps, type AgentBlockDefaultProps, type AgentBootstrapState, AgentChat, type AgentChatProps, AgentCommandItem, AgentCommandOutputItem, type AgentComponents, AgentComposer, type AgentComposerController, type AgentComposerDisabledReason, type AgentComposerFailedPendingMessage, AgentComposerInput, type AgentComposerInputProps, type AgentComposerMentionAttachment, type AgentComposerMentionResolver, AgentComposerPanel, type AgentComposerPanelComponentProps, type AgentComposerPanelProps, type AgentComposerProps, AgentComposerSubmitButton, type AgentComposerSubmitButtonProps, type AgentComposerSubmitMode, AgentComposerToolbar, type AgentComposerToolbarProps, AgentContentBlockView, AgentContextUsageIndicator, type AgentContextValue, AgentCriticalNoticeList, AgentDiagnosticsPanel, AgentDiffItem, AgentDiffViewer, type AgentEmptyStateComponentProps, type AgentExecutionMode, AgentFileChangeItem, type AgentFileResourceRequest, AgentFirstRun, type AgentHooksRefreshOptions, type AgentI18nDictionary, type AgentI18nKey, type AgentI18nMessages, AgentI18nProvider, type AgentI18nProviderProps, type AgentI18nValue, type AgentImageInput, type AgentItemComponentProps, type AgentItemDefaultProps, type AgentJsonValue, type AgentLocalAttachmentKind, type AgentLocalAttachmentResolver, type AgentLocalImageInput, type AgentLocalMediaResourceRequest, type AgentLocalMediaUrlResolver, type AgentLocale, AgentLocaleSelect, type AgentLocaleSelectProps, type AgentMentionAttachmentKind, type AgentMentionInput, AgentMessageItem, AgentMessageList, type AgentPersonality, AgentProvider, type AgentProviderProps, AgentRateLimitBar, AgentReasoningItem, type AgentReasoningSummary, type AgentResolvedLocalAttachment, type AgentResolvedResource, type AgentResolvedResourceBase, type AgentResolvedUrlResource, type AgentResourceKind, type AgentResourceRequest, type AgentResourceResolution, type AgentResourceResolver, AgentRunControls, type AgentRunControlsProps, AgentRunSettingsPanel, type AgentRunSettingsPanelProps, type AgentSandboxMode, type AgentSandboxPolicy, AgentShell, type AgentShellComponentProps, type AgentShellProps, type AgentSidebarComponentProps, type AgentSkillConfigWriteOptions, type AgentSkillInput, AgentSkillsPanel, type AgentSkillsRefreshOptions, type AgentSortDirection, AgentStartComposer, type AgentStartComposerProps, AgentStarterCwd, AgentStatusBar, AgentStatusDetails, AgentStatusSummary, type AgentTextInput, type AgentTheme, AgentThemeToggle, type AgentThemeToggleProps, type AgentThreadConfigOptions, type AgentThreadForkResult, AgentThreadHeader, type AgentThreadHistoryResult, type AgentThreadHistorySyncedEvent, type AgentThreadListController, type AgentThreadListControllerOptions, type AgentThreadListRequest, type AgentThreadReadResult, type AgentThreadResumeResult, AgentThreadSidebar, type AgentThreadSortKey, type AgentThreadSource, type AgentThreadSourceKind, type AgentThreadStartResult, type AgentThreadStartSource, AgentThreadSurface, AgentThreadTimeline, AgentThreadView, type AgentThreadViewProps, AgentTokenUsageBar, AgentToolCallItem, AgentTranscript, type AgentTranscriptBlock, type AgentTranscriptController, type AgentTranscriptControllerOptions, type AgentTranscriptDensity, type AgentTranscriptDensityConfig, type AgentTranscriptDensityMode, type AgentTranscriptEntry, type AgentTranscriptItem, type AgentTranscriptPendingState, type AgentTranscriptScrollController, type AgentTranscriptScrollControllerOptions, AgentTurn, type AgentUnavailableResource, type AgentUnknownUserInput, AgentUsagePanel, type AgentUsageProps, AgentUsageSummary, type AgentUserInput, type AgentWorkingDirectoryResolver, AgentWorkspace, type AgentWorkspaceProps, ComposerRunSettings, DEFAULT_TRANSCRIPT_ITEM_LIMIT, type QueuedFollowUp, type QueuedFollowUpAttachment, TRANSCRIPT_ITEM_INCREMENT, type ThreadForkOptions, type ThreadHistoryParams, ThreadList, type ThreadResumeOptions, type ThreadStartOptions, type TranscriptApprovalAnchors, type TurnStartOptions, type UsageWindow, agentI18nDictionaries, agentLocales, agentResourceDisplayName, agentResourceUrl, defaultAgentComponents, formatThreadStatus, interpolate, interpolationVariables, isUserFacingPath, normalizeAgentLocale, normalizeUsageWindows, threadSubtitle, transcriptItemIds, useAgentAccount, useAgentAction, useAgentApprovals, useAgentApps, useAgentBootstrap, useAgentComposer, useAgentComposerController, useAgentContext, useAgentDiagnostics, useAgentHooks, useAgentI18n, useAgentModels, useAgentRunSettings, useAgentServerRequests, useAgentSkills, useAgentThread, useAgentThreadActions, useAgentThreadController, useAgentThreadHistory, useAgentThreadListController, useAgentThreadReader, useAgentThreads, useAgentTranscriptController, useAgentTranscriptScrollController, useAgentTurn, useAgentTurnController, useAgentUsage, visibleTranscriptWindow };
