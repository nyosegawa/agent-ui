import { b as AgentAppsRefreshOptions, c as AgentHooksRefreshOptions, d as AgentSkillsRefreshOptions, e as AgentSkillConfigWriteOptions, T as ThreadStartOptions, f as TurnStartOptions, g as AgentRunPolicy, h as ThreadResumeOptions, i as ThreadForkOptions, j as ThreadHistoryParams } from './provider-<chunk>.js';
export { k as AGENT_FULL_ACCESS_RUN_POLICY, l as AgentApprovalPolicy, m as AgentApprovalsReviewer, n as AgentContextValue, o as AgentJsonValue, p as AgentPersonality, A as AgentProvider, a as AgentProviderProps, q as AgentReasoningSummary, r as AgentSandboxMode, s as AgentSandboxPolicy, t as AgentSortDirection, u as AgentThreadConfigOptions, v as AgentThreadSortKey, w as AgentThreadSource, x as AgentThreadSourceKind, y as AgentThreadStartSource, D as DEFAULT_AGENT_RUN_POLICIES, z as agentRunPolicyTurnOptions, B as effectiveAgentRunPolicies, C as resolvedAgentRunPolicyId, E as useAgentAction, F as useAgentContext } from './provider-<chunk>.js';
import { G as AgentUserInput } from './normalize-<chunk>.js';
export { o as AgentFileResourceRequest, A as AgentI18nDictionary, a as AgentI18nKey, b as AgentI18nMessages, c as AgentI18nProvider, d as AgentI18nProviderProps, e as AgentI18nValue, p as AgentImageInput, q as AgentLocalImageInput, r as AgentLocalMediaResourceRequest, f as AgentLocale, s as AgentMentionInput, t as AgentResolvedResource, v as AgentResolvedResourceBase, w as AgentResolvedUrlResource, x as AgentResourceKind, y as AgentResourceRequest, z as AgentResourceResolution, B as AgentResourceResolver, C as AgentSkillInput, D as AgentTextInput, K as AgentTranscriptBlock, L as AgentTranscriptController, M as AgentTranscriptControllerOptions, k as AgentTranscriptDensity, N as AgentTranscriptDensityConfig, O as AgentTranscriptDensityMode, l as AgentTranscriptEntry, J as AgentTranscriptItem, P as AgentTranscriptPendingState, E as AgentUnavailableResource, F as AgentUnknownUserInput, g as agentI18nDictionaries, h as agentLocales, H as agentResourceDisplayName, I as agentResourceUrl, i as interpolate, j as interpolationVariables, n as normalizeAgentLocale, u as useAgentI18n, Q as useAgentTranscriptController } from './normalize-<chunk>.js';
export { A as AgentBootstrapState, U as UsageWindow, n as normalizeUsageWindows, a as useAgentAccount, u as useAgentBootstrap } from './usage-<chunk>.js';
import * as _nyosegawa_agent_ui_core from '@nyosegawa/agent-ui-core';
import { AgentApp, ThreadId, ThreadState, ThreadStatus, AgentModel, RequestId, AgentError, ReasoningEffort, AgentRunPolicyId, AgentThreadScope, AgentThreadCollection, AgentThreadView, TurnState } from '@nyosegawa/agent-ui-core';
export { AgentRunPolicyId, AgentThreadResumeDiagnosticReasonCode } from '@nyosegawa/agent-ui-core';
import React, { Dispatch, SetStateAction } from 'react';
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
    activity?: ThreadState["activity"];
    requestedThreadId?: ThreadId;
    runSettings?: AgentThreadResumeRunSettings;
    status?: ThreadStatus;
    threadId: ThreadId;
}

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
    value: string;
}
type AgentComposerDisabledReason = "approval" | "empty" | "interrupting" | "submitting";
interface AgentComposerFailedPendingMessage {
    error?: string;
    operationId: string;
    threadId: string;
}
type AgentComposerSubmitMode = "queue" | "send" | "stop";

declare function useAgentComposer(threadId?: ThreadId): AgentComposerController;
declare function useAgentComposerController(threadId?: ThreadId): AgentComposerController;

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

declare function useAgentThread(threadId?: ThreadId): {
    resumeThread: (id: ThreadId, params?: ThreadResumeOptions) => Promise<{
        threadId: string;
        runSettings?: AgentThreadResumeRunSettings | undefined;
        requestedThreadId?: string | undefined;
        activity?: "idle" | "failed" | "running" | "waitingForInput" | undefined;
        status?: ThreadStatus | undefined;
        activeTurnId?: string | undefined;
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

export { AgentAppsRefreshOptions, type AgentComposerController, type AgentComposerDisabledReason, type AgentComposerFailedPendingMessage, type AgentComposerSubmitMode, type AgentDirectThreadController, type AgentDirectThreadOpenResult, AgentHooksRefreshOptions, AgentRunPolicy, AgentSkillConfigWriteOptions, AgentSkillsRefreshOptions, type AgentThreadForkResult, type AgentThreadHistoryResult, type AgentThreadHistorySyncedEvent, type AgentThreadListController, type AgentThreadListControllerOptions, type AgentThreadListRequest, type AgentThreadReadResult, type AgentThreadResumeResult, type AgentThreadResumeRunSettings, type AgentThreadStartResult, type AgentThreadStartWithInputOptions, type AgentThreadStartWithInputResult, type AgentTranscriptScrollController, type AgentTranscriptScrollControllerOptions, AgentUserInput, DEFAULT_TRANSCRIPT_ITEM_LIMIT, type QueuedFollowUp, type QueuedFollowUpAttachment, TRANSCRIPT_ITEM_INCREMENT, ThreadForkOptions, ThreadHistoryParams, ThreadResumeOptions, ThreadStartOptions, TurnStartOptions, transcriptItemIds, useAgentApprovals, useAgentApps, useAgentComposer, useAgentComposerController, useAgentDiagnostics, useAgentDirectThreadController, useAgentHooks, useAgentModels, useAgentRunSettings, useAgentServerRequests, useAgentSkills, useAgentThread, useAgentThreadActions, useAgentThreadController, useAgentThreadHistory, useAgentThreadListController, useAgentThreadReader, useAgentThreads, useAgentTranscriptScrollController, useAgentTurn, useAgentTurnController, useAgentUsage, visibleTranscriptWindow };
