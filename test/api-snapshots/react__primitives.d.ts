import { T as TranscriptApprovalAnchors, k as AgentTranscriptDensity, l as AgentTranscriptEntry, m as ApprovalAnchors, f as AgentLocale } from './normalize-<chunk>.js';
export { o as AgentFileResourceRequest, A as AgentI18nDictionary, a as AgentI18nKey, b as AgentI18nMessages, c as AgentI18nProvider, d as AgentI18nProviderProps, e as AgentI18nValue, p as AgentImageInput, q as AgentLocalImageInput, r as AgentLocalMediaResourceRequest, s as AgentMentionInput, t as AgentResolvedResource, v as AgentResolvedResourceBase, w as AgentResolvedUrlResource, x as AgentResourceKind, y as AgentResourceRequest, z as AgentResourceResolution, B as AgentResourceResolver, C as AgentSkillInput, D as AgentTextInput, E as AgentUnavailableResource, F as AgentUnknownUserInput, G as AgentUserInput, g as agentI18nDictionaries, h as agentLocales, H as agentResourceDisplayName, I as agentResourceUrl, i as interpolate, j as interpolationVariables, n as normalizeAgentLocale, u as useAgentI18n } from './normalize-<chunk>.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { b as AgentComponents, c as AgentItemDefaultProps, e as AgentLocalMediaUrlResolver, f as AgentComposerIntegration, g as AgentLocalAttachmentResolver } from './chat-<chunk>.js';
export { h as AgentAttachmentChip, i as AgentAttachmentChipKind, j as AgentAttachmentChips, k as AgentAttachmentChipsProps, l as AgentCommandItem, m as AgentCommandOutputItem, n as AgentComposer, o as AgentComposerInput, p as AgentComposerInputProps, q as AgentComposerIntegrationAttachment, r as AgentComposerIntegrationResolver, s as AgentComposerPanel, t as AgentComposerPanelProps, u as AgentComposerProps, v as AgentComposerToolbar, w as AgentComposerToolbarProps, x as AgentContentBlockView, y as AgentDiffItem, z as AgentFileChangeItem, B as AgentFirstRun, C as AgentLocalAttachmentKind, D as AgentMessageItem, E as AgentReasoningItem, F as AgentResolvedLocalAttachment, G as AgentShell, H as AgentShellProps, I as AgentStartComposer, J as AgentStartComposerProps, K as AgentStarterCwd, L as AgentTheme, M as AgentThemeToggle, N as AgentThemeToggleProps, O as AgentThreadSidebar, P as AgentToolCallItem, Q as AgentWorkingDirectoryResolver, T as ThreadList, R as formatThreadStatus, S as isUserFacingPath, U as threadSubtitle } from './chat-<chunk>.js';
import { u as useAgentBootstrap } from './usage-<chunk>.js';
export { U as UsageWindow, n as normalizeUsageWindows } from './usage-<chunk>.js';
import { PendingServerRequest, ThreadTokenUsage, AgentThreadSummaryView, AgentThreadTranscriptView } from '@nyosegawa/agent-ui-core';

interface AgentComposerSubmitButtonProps {
    canSubmit: boolean;
    className?: string;
    iconSize?: number;
    isStopAction: boolean;
    label?: string;
    title?: string;
}
declare function AgentComposerSubmitButton({ canSubmit, className, iconSize, isStopAction, label, title, }: AgentComposerSubmitButtonProps): react_jsx_runtime.JSX.Element;

interface AgentRunControlsProps {
    autoRefresh?: boolean;
    variant?: "compact" | "panel";
}
declare function AgentRunControls({ autoRefresh, variant, }?: AgentRunControlsProps): react_jsx_runtime.JSX.Element;
/**
 * Policy / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here; cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
declare function ComposerRunControls(): react_jsx_runtime.JSX.Element;

declare function AgentMessageList({ footer, approvalAnchors, components, renderItem, density, resolveLocalMediaUrl, scrollKey, threadId, }: {
    /**
     * Trailing transcript content rendered as the final scroll-area item.
     * The default thread view uses it to keep the pending-approval surface
     * inside the transcript instead of in a separate scroll pane.
     */
    footer?: React.ReactNode;
    approvalAnchors?: TranscriptApprovalAnchors;
    components?: AgentComponents;
    density?: AgentTranscriptDensity;
    renderItem?: (entry: AgentTranscriptEntry, Default: React.ComponentType<AgentItemDefaultProps>) => React.ReactNode;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    /** Changing this value scrolls the transcript to its end (e.g. a new approval). */
    scrollKey?: string | number;
    threadId: string;
}): react_jsx_runtime.JSX.Element;
declare const AgentTranscript: typeof AgentMessageList;
declare function AgentTurn({ approvals, components, entries, renderItem, resolveLocalMediaUrl, }: {
    approvals?: ApprovalAnchors;
    components?: AgentComponents;
    entries?: AgentTranscriptEntry[];
    renderItem?: (entry: AgentTranscriptEntry, Default: React.ComponentType<AgentItemDefaultProps>) => React.ReactNode;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
}): react_jsx_runtime.JSX.Element;

declare function AgentDiffViewer({ patch }: {
    patch: unknown;
}): react_jsx_runtime.JSX.Element;

declare function AgentApprovalQueue({ approvals: approvalsProp, renderApproval, threadId, }: {
    approvals?: PendingServerRequest[];
    renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
    threadId?: string;
}): react_jsx_runtime.JSX.Element | null;

declare function AgentContextUsageIndicator({ tokenUsage, }: {
    tokenUsage?: ThreadTokenUsage;
}): react_jsx_runtime.JSX.Element | null;

interface AgentLocaleSelectProps {
    "aria-label"?: string;
    disabled?: boolean;
    onChange: (locale: AgentLocale) => void;
    value: AgentLocale;
}
declare function AgentLocaleSelect({ "aria-label": ariaLabel, disabled, onChange, value, }: AgentLocaleSelectProps): react_jsx_runtime.JSX.Element;

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
    end?: React.ReactNode;
    onNavigateHome?: () => void;
    onOpenThreads?: () => void;
}): react_jsx_runtime.JSX.Element;
declare function AgentDiagnosticsPanel({ bootstrap, }: {
    bootstrap: ReturnType<typeof useAgentBootstrap>;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentStatusSummary(): react_jsx_runtime.JSX.Element | null;
declare function AgentStatusDetails({ includeCritical, }: {
    includeCritical?: boolean;
}): react_jsx_runtime.JSX.Element | null;
declare function AgentCriticalNoticeList(): react_jsx_runtime.JSX.Element | null;

interface AgentThreadViewProps {
    composerIntegrations?: readonly AgentComposerIntegration[];
    components?: AgentComponents;
    renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
    renderItem?: React.ComponentProps<typeof AgentMessageList>["renderItem"];
    resolveLocalAttachment?: AgentLocalAttachmentResolver;
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    threadId?: string;
}
declare function AgentThreadView({ composerIntegrations, components, renderApproval, renderItem, resolveLocalAttachment, resolveLocalMediaUrl, threadId, }: AgentThreadViewProps): react_jsx_runtime.JSX.Element | null;
declare function AgentThreadSurface({ children, className, }: {
    children: React.ReactNode;
    className?: string;
}): react_jsx_runtime.JSX.Element;
declare function AgentThreadHeader({ thread, threadId, transcript, }: {
    thread: AgentThreadSummaryView;
    threadId?: string;
    transcript?: AgentThreadTranscriptView;
}): react_jsx_runtime.JSX.Element;
/**
 * Renders the thread transcript. When a `threadId` is supplied, pending
 * approvals with upstream item or turn metadata are anchored immediately after
 * that transcript context. Metadata-free approvals fall back to the transcript
 * tail so they stay in the scroll area, not a separate pane above the composer.
 */
declare function AgentThreadTimeline({ components, renderApproval, renderItem, resolveLocalMediaUrl, threadId, }: {
    components?: AgentComponents;
    renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
    renderItem?: React.ComponentProps<typeof AgentMessageList>["renderItem"];
    resolveLocalMediaUrl?: AgentLocalMediaUrlResolver;
    threadId?: string;
}): react_jsx_runtime.JSX.Element | null;

export { AgentApprovalQueue, AgentAppsPanel, AgentComposerIntegration, AgentComposerSubmitButton, type AgentComposerSubmitButtonProps, AgentContextUsageIndicator, AgentCriticalNoticeList, AgentDiagnosticsPanel, AgentDiffViewer, AgentLocalAttachmentResolver, AgentLocalMediaUrlResolver, AgentLocale, AgentLocaleSelect, type AgentLocaleSelectProps, AgentMessageList, AgentRateLimitBar, AgentRunControls, type AgentRunControlsProps, AgentSkillsPanel, AgentStatusBar, AgentStatusDetails, AgentStatusSummary, AgentThreadHeader, AgentThreadSurface, AgentThreadTimeline, AgentThreadView, type AgentThreadViewProps, AgentTokenUsageBar, AgentTranscript, AgentTurn, AgentUsagePanel, type AgentUsageProps, AgentUsageSummary, ComposerRunControls, TranscriptApprovalAnchors };
