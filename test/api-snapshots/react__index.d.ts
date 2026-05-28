import * as react_jsx_runtime from 'react/jsx-runtime';
import * as _nyosegawa_agent_ui_core from '@nyosegawa/agent-ui-core';
import { AgentEvent, AgentSessionState, AgentTransport, AgentApp, AgentModel, ThreadId, RequestId, ExecutionModeId, ReasoningEffort, ThreadState, ThreadTokenUsage, PendingServerRequest, AgentItemState, TurnState, AgentThread, AgentItemBlock } from '@nyosegawa/agent-ui-core';
import * as React$1 from 'react';
import React__default, { PropsWithChildren } from 'react';
import { AppsListParams, HooksListParams, SkillsListParams, SkillsConfigWriteParams, TurnStartParams, ThreadListParams, ThreadResumeParams, ThreadStartParams, ThreadForkParams } from '@nyosegawa/agent-ui-codex/stable-types';

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

interface QueuedFollowUp {
    attachments: QueuedFollowUpAttachment[];
    expectedTurnId?: string;
    id: string;
    input: AgentUserInput[];
    text: string;
    threadId: ThreadId;
}
interface QueuedFollowUpAttachment {
    extension?: string;
    id: string;
    input?: AgentUserInput | AgentUserInput[];
    kind: "image" | "file" | "app" | "plugin";
    label: string;
    previewUrl?: string;
    sizeLabel?: string;
    value: string;
}

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
    steerNow: (items?: AgentUserInput[]) => Promise<void>;
    stop: () => Promise<void>;
    submit: (items?: AgentUserInput[], options?: {
        attachments?: QueuedFollowUpAttachment[];
    }) => Promise<string | undefined>;
    value: string;
};

type AgentComposerController = ReturnType<typeof useAgentComposer>;

type TurnStartOptions = Partial<Omit<TurnStartParams, "input" | "threadId">>;
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

type ThreadForkOptions = Omit<ThreadForkParams, "threadId">;
type ThreadResumeOptions = Omit<ThreadResumeParams, "threadId">;
declare function useAgentThread(threadId?: ThreadId): {
    resumeThread: (id: ThreadId, params?: ThreadResumeOptions) => Promise<unknown>;
    startThread: (params?: ThreadStartParams) => Promise<unknown>;
    startThreadWithInput: (input: string | AgentUserInput[], params?: ThreadStartParams) => Promise<unknown>;
    thread: ThreadState | undefined;
    threadId: string | undefined;
    turns: (_nyosegawa_agent_ui_core.TurnState | undefined)[];
};
declare const useAgentThreadController: typeof useAgentThread;
declare function useAgentThreadActions(threadId?: ThreadId): {
    archiveThread: () => Promise<unknown>;
    compactThread: () => Promise<unknown>;
    forkThread: (params?: ThreadForkOptions) => Promise<unknown>;
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
type ThreadHistoryParams = ThreadListParams;
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
    startTurn: (input: string | AgentUserInput[], params?: TurnStartOptions) => Promise<unknown>;
    steerTurn: (expectedTurnId: string, input: string | AgentUserInput[]) => Promise<unknown>;
};
declare const useAgentTurnController: typeof useAgentTurn;

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
    "apps.empty": string;
    "apps.label": string;
    "apps.loadMore": string;
    "apps.notInstalled": string;
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
    "followUp.earlier": string;
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
    "timeline.item": string;
    "timeline.items": string;
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

type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";
type AgentLocalAttachmentKind = Extract<ComposerAttachmentKind, "image" | "file">;
type AgentLocalAttachmentResolver = (file: File, kind: AgentLocalAttachmentKind) => AgentUserInput | AgentUserInput[] | null | undefined | Promise<AgentUserInput | AgentUserInput[] | null | undefined>;
type AgentMentionAttachmentKind = Extract<ComposerAttachmentKind, "app" | "plugin">;
interface AgentComposerMentionAttachment {
    id?: string;
    input?: AgentUserInput;
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

type AgentTheme = "light" | "dark" | "system";
interface AgentThemeToggleProps {
    "aria-label"?: string;
    disabled?: boolean;
    onChange: (theme: AgentTheme) => void;
    value: AgentTheme;
}
declare function AgentThemeToggle({ "aria-label": ariaLabel, disabled, onChange, value, }: AgentThemeToggleProps): react_jsx_runtime.JSX.Element;

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
    statusBarEnd?: React__default.ReactNode;
    theme?: AgentTheme;
    locale?: AgentLocale | string;
    messages?: AgentI18nMessages;
    threadUrlRouting?: boolean | AgentThreadUrlRoutingOptions;
    usage?: boolean;
}
interface AgentThreadUrlRoutingOptions {
    basePath?: string;
    homePath?: string;
}
declare function AgentChat({ className, diagnostics, onRequestAppMention, onRequestWorkingDirectory, onRequestPluginMention, resolveLocalAttachment, sidebar, slots, statusBarEnd, theme, locale, messages, threadUrlRouting, usage, }?: AgentChatProps): react_jsx_runtime.JSX.Element;
interface AgentShellProps extends React__default.HTMLAttributes<HTMLElement> {
    sidebar?: React__default.ReactNode;
    theme?: AgentTheme;
}
declare function AgentShell({ children, className, sidebar, theme, ...props }: AgentShellProps): react_jsx_runtime.JSX.Element;

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
    end?: React__default.ReactNode;
    onNavigateHome?: () => void;
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
    raw?: unknown;
    severity?: AgentStatusSeverity;
}>): AgentStatusNotice[];
declare function statusSummary(total: number, warningCount: number, criticalCount: number, t?: (key: AgentI18nKey, vars?: Record<string, string | number>) => string): string;

declare function ThreadList({ activeThreadId, footer, onSelectThread, threads, }: {
    activeThreadId?: string;
    footer?: React.ReactNode;
    onSelectThread?: (threadId: string) => void;
    threads: ThreadState[];
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
    threads: ThreadState[];
}): react_jsx_runtime.JSX.Element | null;

interface AgentWorkspaceProps extends AgentChatProps {
    panel?: React__default.ReactNode;
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
type UsageTranslator = (key: AgentI18nKey, vars?: Record<string, string | number>) => string;
declare function normalizeUsageWindows(rateLimits: unknown, t?: UsageTranslator): UsageWindow[];

export { AGENT_EXECUTION_MODES, AgentApprovalQueue, AgentAppsPanel, type AgentBootstrapState, AgentChat, type AgentChatProps, type AgentChatSlots, AgentCommandItem, AgentCommandOutputItem, AgentComposer, type AgentComposerController, type AgentComposerMentionAttachment, type AgentComposerMentionResolver, AgentComposerPanel, type AgentComposerPanelProps, type AgentComposerProps, AgentContentBlockView, AgentContextUsageIndicator, type AgentContextValue, AgentCriticalNoticeList, AgentDiagnosticsPanel, AgentDiffItem, AgentDiffViewer, type AgentExecutionMode, AgentFileChangeItem, AgentFirstRun, type AgentI18nDictionary, type AgentI18nKey, type AgentI18nMessages, AgentI18nProvider, type AgentI18nProviderProps, type AgentI18nValue, type AgentImageInput, type AgentLocalAttachmentKind, type AgentLocalAttachmentResolver, type AgentLocalImageInput, type AgentLocale, AgentLocaleSelect, type AgentLocaleSelectProps, type AgentMentionAttachmentKind, type AgentMentionInput, AgentMessageItem, AgentMessageList, AgentProvider, type AgentProviderProps, AgentRateLimitBar, AgentReasoningItem, AgentRunControls, type AgentRunControlsProps, AgentRunSettingsPanel, type AgentRunSettingsPanelProps, AgentShell, type AgentShellProps, type AgentSkillInput, AgentSkillsPanel, AgentStarterCwd, AgentStatusBar, AgentStatusDetails, AgentStatusSummary, type AgentTextInput, type AgentTheme, AgentThemeToggle, type AgentThemeToggleProps, AgentThreadHeader, AgentThreadSidebar, AgentThreadSurface, AgentThreadTimeline, type AgentThreadUrlRoutingOptions, AgentThreadView, type AgentThreadViewProps, AgentTokenUsageBar, AgentToolCallItem, AgentTranscript, AgentTurn, type AgentUnknownUserInput, AgentUsagePanel, type AgentUsageProps, AgentUsageSummary, type AgentUserInput, type AgentWorkingDirectoryResolver, AgentWorkspace, type AgentWorkspaceProps, ComposerRunSettings, DEFAULT_TRANSCRIPT_ITEM_LIMIT, type QueuedFollowUp, type QueuedFollowUpAttachment, TRANSCRIPT_ITEM_INCREMENT, type ThreadHistoryParams, ThreadList, type TranscriptApprovalAnchors, type UsageWindow, agentI18nDictionaries, agentLocales, formatThreadStatus, interpolate, interpolationVariables, isUserFacingPath, normalizeAgentLocale, normalizeUsageWindows, normalizedStatusNotices, rawThreadId, statusSummary, threadProjectPath, threadSnapshotEvents, threadSubtitle, threadUpsertEvent, transcriptItemIds, useAgentAction, useAgentApprovals, useAgentApps, useAgentAuth, useAgentBootstrap, useAgentComposer, useAgentContext, useAgentHooks, useAgentI18n, useAgentModels, useAgentRunSettings, useAgentServerRequests, useAgentSkills, useAgentThread, useAgentThreadActions, useAgentThreadController, useAgentThreadHistory, useAgentThreadReader, useAgentThreads, useAgentTurn, useAgentTurnController, useAgentUsage, visibleTranscriptWindow };
