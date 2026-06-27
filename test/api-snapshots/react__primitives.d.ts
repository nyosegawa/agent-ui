import { f as AgentLocale } from './normalize-<chunk>.js';
export { k as AgentFileResourceRequest, A as AgentI18nDictionary, a as AgentI18nKey, b as AgentI18nMessages, c as AgentI18nProvider, d as AgentI18nProviderProps, e as AgentI18nValue, l as AgentImageInput, m as AgentLocalImageInput, o as AgentLocalMediaResourceRequest, p as AgentMentionInput, q as AgentResolvedResource, r as AgentResolvedResourceBase, s as AgentResolvedUrlResource, t as AgentResourceKind, v as AgentResourceRequest, w as AgentResourceResolution, x as AgentResourceResolver, y as AgentSkillInput, z as AgentTextInput, B as AgentUnavailableResource, C as AgentUnknownUserInput, D as AgentUserInput, E as TranscriptApprovalAnchors, g as agentI18nDictionaries, h as agentLocales, F as agentResourceDisplayName, G as agentResourceUrl, i as interpolate, j as interpolationVariables, n as normalizeAgentLocale, u as useAgentI18n } from './normalize-<chunk>.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { s as AgentAttachmentChip, t as AgentAttachmentChipKind, u as AgentAttachmentChips, v as AgentAttachmentChipsProps, w as AgentCommandItem, x as AgentCommandOutputItem, y as AgentComposer, z as AgentComposerInput, B as AgentComposerInputProps, C as AgentComposerIntegration, D as AgentComposerIntegrationAttachment, E as AgentComposerIntegrationResolver, F as AgentComposerPanel, G as AgentComposerPanelProps, H as AgentComposerProps, I as AgentComposerToolbar, J as AgentComposerToolbarProps, K as AgentContentBlockView, L as AgentCriticalNoticeList, M as AgentDiagnosticsPanel, N as AgentDiffItem, O as AgentFileChangeItem, P as AgentFirstRun, Q as AgentLocalAttachmentKind, R as AgentLocalAttachmentResolver, S as AgentLocalMediaUrlResolver, T as AgentMessageItem, U as AgentMessageList, V as AgentReasoningItem, W as AgentResolvedLocalAttachment, X as AgentShell, Y as AgentShellProps, Z as AgentStartComposer, _ as AgentStartComposerProps, $ as AgentStarterCwd, a0 as AgentStatusBar, a1 as AgentStatusBarProps, a2 as AgentStatusDetails, a3 as AgentStatusSummary, a4 as AgentTheme, a5 as AgentThemeToggle, a6 as AgentThemeToggleProps, a7 as AgentThreadHeader, p as AgentThreadHeaderEnd, q as AgentThreadHeaderEndContext, a8 as AgentThreadHeaderProps, a9 as AgentThreadSidebar, aa as AgentThreadSurface, ab as AgentThreadTimeline, ac as AgentThreadView, ad as AgentThreadViewProps, ae as AgentToolCallItem, af as AgentTranscript, ag as AgentTurn, ah as AgentWorkingDirectoryResolver, ai as ThreadList, aj as formatThreadStatus, ak as isUserFacingPath, al as threadSubtitle } from './chat-<chunk>.js';
export { U as UsageWindow, n as normalizeUsageWindows } from './usage-<chunk>.js';
import { PendingServerRequest, ThreadTokenUsage } from '@nyosegawa/agent-ui-core';
import React from 'react';

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

export { AgentApprovalQueue, AgentAppsPanel, AgentComposerSubmitButton, type AgentComposerSubmitButtonProps, AgentContextUsageIndicator, AgentDiffViewer, AgentLocale, AgentLocaleSelect, type AgentLocaleSelectProps, AgentRateLimitBar, AgentRunControls, type AgentRunControlsProps, AgentSkillsPanel, AgentTokenUsageBar, AgentUsagePanel, type AgentUsageProps, AgentUsageSummary, ComposerRunControls };
