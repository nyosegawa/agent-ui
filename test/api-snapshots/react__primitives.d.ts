import { r as AgentApprovalRequest, f as AgentLocale } from './resources-vUp7jMQ0.js';
export { s as AgentFileResourceRequest, A as AgentI18nDictionary, a as AgentI18nKey, b as AgentI18nMessages, c as AgentI18nProvider, d as AgentI18nProviderProps, e as AgentI18nValue, t as AgentImageInput, v as AgentLocalImageInput, w as AgentLocalMediaResourceRequest, x as AgentMentionInput, y as AgentResolvedResource, z as AgentResolvedResourceBase, B as AgentResolvedUrlResource, C as AgentResourceKind, D as AgentResourceRequest, E as AgentResourceResolution, F as AgentResourceResolver, G as AgentSkillInput, H as AgentTextInput, I as AgentUnavailableResource, J as AgentUnknownUserInput, K as AgentUserInput, L as TranscriptApprovalAnchors, m as agentI18nDictionaries, n as agentLocales, M as agentResourceDisplayName, N as agentResourceUrl, o as interpolate, p as interpolationVariables, q as normalizeAgentLocale, u as useAgentI18n } from './resources-vUp7jMQ0.js';
import * as react_jsx_runtime from 'react/jsx-runtime';
export { s as AgentAttachmentChip, t as AgentAttachmentChipKind, u as AgentAttachmentChips, v as AgentAttachmentChipsProps, w as AgentCommandItem, x as AgentCommandOutputItem, y as AgentComposer, z as AgentComposerInput, B as AgentComposerInputProps, C as AgentComposerIntegration, D as AgentComposerIntegrationAttachment, E as AgentComposerIntegrationResolver, F as AgentComposerProps, G as AgentComposerToolbar, H as AgentComposerToolbarProps, I as AgentContentBlockView, J as AgentCriticalNoticeList, K as AgentDiagnosticsPanel, L as AgentDiffItem, M as AgentFileChangeItem, N as AgentFirstRun, O as AgentLocalAttachmentKind, P as AgentLocalAttachmentResolver, Q as AgentLocalMediaUrlResolver, R as AgentMessageItem, S as AgentMessageList, T as AgentReasoningItem, U as AgentResolvedLocalAttachment, V as AgentShell, W as AgentShellProps, X as AgentStartComposer, Y as AgentStartComposerProps, Z as AgentStarterCwd, _ as AgentStatusBar, $ as AgentStatusBarProps, a0 as AgentStatusDetails, a1 as AgentStatusSummary, a2 as AgentTheme, a3 as AgentThemeToggle, a4 as AgentThemeToggleProps, a5 as AgentThreadHeader, p as AgentThreadHeaderEnd, q as AgentThreadHeaderEndContext, a6 as AgentThreadHeaderProps, a7 as AgentThreadSidebar, a8 as AgentThreadSurface, a9 as AgentThreadTimeline, aa as AgentThreadView, ab as AgentThreadViewProps, ac as AgentToolCallItem, ad as AgentTranscript, ae as AgentTurn, af as AgentWorkingDirectoryResolver, ag as ThreadList, ah as formatThreadStatus, ai as isUserFacingPath, aj as threadSubtitle } from './chat-<chunk>.js';
export { U as UsageWindow, n as normalizeUsageWindows } from './usage-<chunk>.js';
import React from 'react';
import { ThreadTokenUsage } from '@nyosegawa/agent-ui-core';

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
    approvals?: AgentApprovalRequest[];
    renderApproval?: (approval: AgentApprovalRequest) => React.ReactNode;
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
