import { b as AgentRunPolicy } from './provider-<chunk>.js';
export { c as AGENT_FULL_ACCESS_RUN_POLICY, d as AgentContextValue, A as AgentProvider, a as AgentProviderProps, D as DEFAULT_AGENT_RUN_POLICIES, e as agentRunPolicyTurnOptions, f as effectiveAgentRunPolicies, r as resolvedAgentRunPolicyId, u as useAgentAction, g as useAgentContext } from './provider-<chunk>.js';
import { V as AgentAppsRefreshOptions, W as AgentHooksRefreshOptions, X as AgentSkillsRefreshOptions, Y as AgentSkillConfigWriteOptions, U as ThreadStartOptions, T as TurnStartOptions, r as AgentApprovalRequest, Z as AgentApprovalDecision, K as AgentUserInput, _ as ThreadForkOptions, $ as ThreadResumeOptions, a0 as ThreadHistoryParams } from './resources-vUp7jMQ0.js';
export { a1 as AgentApprovalPolicy, a2 as AgentApprovalsReviewer, a3 as AgentBootstrapState, s as AgentFileResourceRequest, A as AgentI18nDictionary, a as AgentI18nKey, b as AgentI18nMessages, c as AgentI18nProvider, d as AgentI18nProviderProps, e as AgentI18nValue, t as AgentImageInput, a4 as AgentJsonValue, v as AgentLocalImageInput, w as AgentLocalMediaResourceRequest, f as AgentLocale, x as AgentMentionInput, a5 as AgentPersonality, a6 as AgentReasoningSummary, y as AgentResolvedResource, z as AgentResolvedResourceBase, B as AgentResolvedUrlResource, C as AgentResourceKind, D as AgentResourceRequest, E as AgentResourceResolution, F as AgentResourceResolver, a7 as AgentSandboxMode, a8 as AgentSandboxPolicy, G as AgentSkillInput, a9 as AgentSortDirection, H as AgentTextInput, aa as AgentThreadConfigOptions, ab as AgentThreadSortKey, ac as AgentThreadSource, ad as AgentThreadSourceKind, ae as AgentThreadStartSource, P as AgentTranscriptBlock, af as AgentTranscriptCategory, ag as AgentTranscriptController, ah as AgentTranscriptControllerOptions, g as AgentTranscriptDisplay, h as AgentTranscriptDisplayDensity, i as AgentTranscriptDisplayPolicy, j as AgentTranscriptDisplayPreset, k as AgentTranscriptDisplayRule, l as AgentTranscriptDisplayVisibility, Q as AgentTranscriptEntry, O as AgentTranscriptItem, ai as AgentTranscriptPendingState, I as AgentUnavailableResource, J as AgentUnknownUserInput, m as agentI18nDictionaries, n as agentLocales, M as agentResourceDisplayName, N as agentResourceUrl, o as interpolate, p as interpolationVariables, q as normalizeAgentLocale, aj as useAgentAccount, S as useAgentBootstrap, u as useAgentI18n, ak as useAgentTranscriptController } from './resources-vUp7jMQ0.js';
import * as _nyosegawa_agent_ui_core from '@nyosegawa/agent-ui-core';
import { AgentApp, ThreadId, ThreadStatus, AgentThreadWaitingReason, AgentModel, RequestId, AgentError, ReasoningEffort, AgentRunPolicyId, AgentThreadView, AgentThreadTranscriptView, AgentThreadScope, AgentThreadCollection } from '@nyosegawa/agent-ui-core';
export { AgentRunPolicyId } from '@nyosegawa/agent-ui-core';
import React, { Dispatch, SetStateAction } from 'react';
export { U as UsageWindow, n as normalizeUsageWindows } from './usage-<chunk>.js';
import 'react/jsx-runtime';

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

interface AgentThreadStartResult {
    threadId: ThreadId;
}
interface AgentThreadStartWithInputResult {
    operationId: string;
    optimisticTurnId: string;
    threadId: ThreadId;
    turnId: string;
    userMessageId: string;
}
interface AgentThreadStartWithInputOptions {
    threadOptions?: ThreadStartOptions;
    turnOptions?: TurnStartOptions;
}
interface AgentThreadResumeResult {
    activeTurnId?: string;
    activity?: AgentThreadActivity;
    requestedThreadId?: ThreadId;
    runSettings?: AgentThreadResumeRunSettings;
    status?: ThreadStatus;
    threadId: ThreadId;
    waitingReasons?: AgentThreadWaitingReason[];
}
type AgentThreadActivity = "failed" | "idle" | "running" | "waitingForInput";
type AgentThreadResumeDiagnosticReasonCode = "canonical_thread_id_mismatch" | "resume_response_missing_thread_id" | "resume_response_normalization_failed";
interface AgentThreadResumeRunSettings {
    cwd?: string;
    effort?: string;
    modelId?: string;
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

interface AgentDirectThreadOpenResult {
    readThreadId: ThreadId;
    resume: AgentThreadResumeResult;
    threadId: ThreadId;
}
interface AgentDirectThreadController {
    openThread: (threadId: ThreadId) => Promise<AgentDirectThreadOpenResult>;
    previewThread: (threadId: ThreadId) => Promise<ThreadId>;
}
declare function useAgentDirectThreadController(): AgentDirectThreadController;

declare function useAgentModels(): {
    models: AgentModel[];
    refreshModels: () => Promise<AgentModel[]>;
};

declare function useAgentApprovals(threadId?: ThreadId): {
    approvals: AgentApprovalRequest[];
    approve: (requestId: RequestId, decision?: AgentApprovalDecision) => Promise<void>;
    reject: (requestId: RequestId, message?: string) => Promise<void>;
};
declare function useAgentServerRequests(threadId?: ThreadId): {
    requests: _nyosegawa_agent_ui_core.AgentServerRequestSummary[];
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
    input: AgentUserInput | AgentUserInput[];
    kind: "image" | "file" | "integration";
    label: string;
    previewUrl?: string;
    previewUrlRevoke?: boolean;
    redactedPath?: string;
    sizeLabel?: string;
    value?: string;
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
    sendMessage: (input: string | AgentUserInput[], options?: AgentComposerSendMessageOptions) => Promise<AgentComposerSendMessageResult>;
    sendQueuedFollowUp: (id: string) => Promise<void>;
    sendingFollowUpIds: string[];
    setError: Dispatch<SetStateAction<string | undefined>>;
    setValue: Dispatch<SetStateAction<string>>;
    startThreadWithInput: (input: string | AgentUserInput[], options?: AgentThreadStartWithInputOptions) => Promise<AgentThreadStartWithInputResult>;
    steerNow: (items?: AgentUserInput[]) => Promise<void>;
    stop: () => Promise<void>;
    submit: (items?: AgentUserInput[], options?: {
        attachments?: QueuedFollowUpAttachment[];
    }) => Promise<string | undefined>;
    submitMode: AgentComposerSubmitMode;
    threadId?: string;
    value: string;
}
interface AgentChatController extends AgentComposerController {
}
type AgentComposerDisabledReason = "approval" | "empty" | "interrupting" | "submitting";
type AgentComposerBlockedReason = AgentThreadWaitingReason;
interface AgentComposerFailedPendingMessage {
    error?: string;
    operationId: string;
    retryable: boolean;
    threadId: string;
}
type AgentComposerSubmitMode = "send" | "stop";
interface AgentComposerSendMessageOptions extends AgentThreadStartWithInputOptions {
    queuedAttachments?: QueuedFollowUpAttachment[];
}
type AgentComposerSendMessageResult = ({
    type: "started";
} & AgentThreadStartWithInputResult) | {
    threadId: string;
    type: "sent";
} | {
    queuedFollowUpId: string;
    threadId: string;
    type: "queued";
} | {
    reason: AgentComposerBlockedReason;
    threadId?: string;
    type: "blocked";
};

declare function useAgentComposerController(threadId?: ThreadId): AgentComposerController;
declare function useAgentChatController(threadId?: ThreadId): AgentChatController;

declare function useAgentRunSettings(): {
    models: AgentModel[];
    policies: readonly AgentRunPolicy[];
    runSettings: _nyosegawa_agent_ui_core.RunSettingsState;
    selectedModel: AgentModel | undefined;
    selectedPolicy: AgentRunPolicy | undefined;
    setEffort: (effort: ReasoningEffort) => void;
    setModelId: (modelId: string) => void;
    setPolicyId: (policyId: AgentRunPolicyId) => void;
    supportedEfforts: string[];
};

interface AgentThreadController {
    resumeThread: (id: ThreadId, params?: ThreadResumeOptions) => Promise<AgentThreadResumeResult>;
    startThread: (params?: ThreadStartOptions) => Promise<AgentThreadStartResult>;
    thread?: AgentThreadView;
    threadId?: ThreadId;
    transcript?: AgentThreadTranscriptView;
}
interface AgentThreadsController {
    activeThreadId?: ThreadId;
    setActiveThread: (threadId?: ThreadId) => void;
    threads: AgentThreadView[];
}
interface AgentThreadHistoryController {
    cursor: string | null | undefined;
    error?: Error;
    isLoading: boolean;
    listThreads: (params?: ThreadHistoryParams) => Promise<AgentThreadHistoryResult>;
    threads: AgentThreadView[];
}
declare function useAgentThreadController(threadId?: ThreadId): AgentThreadController;
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
declare function useAgentThreads(): AgentThreadsController;
declare function useAgentThreadHistory(): AgentThreadHistoryController;
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
    resumeThreadWithResult: (threadId: ThreadId, params?: ThreadResumeOptions) => Promise<AgentThreadResumeResult>;
    scope: AgentThreadScope;
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
    threads: AgentThreadView[];
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

interface AgentTurnController {
    interruptTurn: (turnId: string) => Promise<void>;
    startTurn: (input: string | AgentUserInput[], params?: TurnStartOptions) => Promise<void>;
    steerTurn: (expectedTurnId: string, input: string | AgentUserInput[]) => Promise<void>;
}
declare function useAgentTurnController(threadId?: ThreadId): AgentTurnController;

interface AgentTranscriptScrollControllerOptions {
    hiddenItemCount?: number;
    onShowEarlierItems?: () => void;
    pendingApprovalSelector?: string;
    scrollContainerRef?: React.RefObject<HTMLElement | null>;
    scrollKey?: string | number;
    threadId: string;
    turnCount: number;
}
interface AgentTranscriptScrollController {
    canShowEarlierItems: boolean;
    handleScroll(): void;
    jumpToLatest(): void;
    jumpToPendingApproval(): void;
    scrollContainerRef: React.RefObject<HTMLElement | null>;
    showEarlierItems(): void;
    showJumpLatest: boolean;
    showJumpApproval: boolean;
}
declare function useAgentTranscriptScrollController({ hiddenItemCount, onShowEarlierItems, pendingApprovalSelector, scrollContainerRef, scrollKey, threadId, turnCount, }: AgentTranscriptScrollControllerOptions): AgentTranscriptScrollController;

declare function useAgentUsage(): {
    rateLimits: unknown;
    refreshUsage: () => Promise<void>;
};

export { AgentApprovalDecision, AgentApprovalRequest, AgentAppsRefreshOptions, type AgentChatController, type AgentComposerBlockedReason, type AgentComposerController, type AgentComposerDisabledReason, type AgentComposerFailedPendingMessage, type AgentComposerSendMessageOptions, type AgentComposerSendMessageResult, type AgentComposerSubmitMode, type AgentDirectThreadController, type AgentDirectThreadOpenResult, AgentHooksRefreshOptions, AgentRunPolicy, AgentSkillConfigWriteOptions, AgentSkillsRefreshOptions, type AgentThreadForkResult, type AgentThreadHistoryResult, type AgentThreadHistorySyncedEvent, type AgentThreadListController, type AgentThreadListControllerOptions, type AgentThreadListRequest, type AgentThreadReadResult, type AgentThreadResumeDiagnosticReasonCode, type AgentThreadResumeResult, type AgentThreadResumeRunSettings, type AgentThreadStartResult, type AgentThreadStartWithInputOptions, type AgentThreadStartWithInputResult, type AgentTranscriptScrollController, type AgentTranscriptScrollControllerOptions, AgentUserInput, type QueuedFollowUp, type QueuedFollowUpAttachment, ThreadForkOptions, ThreadHistoryParams, ThreadResumeOptions, ThreadStartOptions, TurnStartOptions, useAgentApprovals, useAgentApps, useAgentChatController, useAgentComposerController, useAgentDiagnostics, useAgentDirectThreadController, useAgentHooks, useAgentModels, useAgentRunSettings, useAgentServerRequests, useAgentSkills, useAgentThreadActions, useAgentThreadController, useAgentThreadHistory, useAgentThreadListController, useAgentThreadReader, useAgentThreads, useAgentTranscriptScrollController, useAgentTurnController, useAgentUsage };
