import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

export type AgentLocale = "en" | "ja" | "ko" | "zh-CN" | "es" | "fr";

export const agentLocales: AgentLocale[] = ["en", "ja", "ko", "zh-CN", "es", "fr"];

export type AgentI18nKey =
  | "account.authenticated"
  | "account.authenticating"
  | "account.checking"
  | "account.connecting"
  | "account.cancelLogin"
  | "account.login"
  | "account.openDeviceLogin"
  | "account.unauthenticated"
  | "approval.action.approve"
  | "approval.action.approveForSession"
  | "approval.action.decline"
  | "approval.action.review"
  | "approval.aria.otherPending"
  | "approval.aria.pending"
  | "approval.aria.pendingOne"
  | "approval.count"
  | "approval.kind.attestation"
  | "approval.kind.authRefresh"
  | "approval.kind.command"
  | "approval.kind.dynamicTool"
  | "approval.kind.fileChange"
  | "approval.kind.generic"
  | "approval.kind.mcpInput"
  | "approval.kind.permissions"
  | "approval.kind.userInput"
  | "approval.meta.approvalPolicy"
  | "approval.meta.item"
  | "approval.meta.namespace"
  | "approval.meta.sandbox"
  | "approval.meta.tool"
  | "approval.meta.workingDirectory"
  | "approval.request.command"
  | "approval.request.fileChange"
  | "approval.request.generic"
  | "approval.risk.high"
  | "approval.risk.low"
  | "approval.risk.medium"
  | "approval.riskSuffix"
  | "approval.summary.command"
  | "approval.summary.default"
  | "approval.summary.dynamicTool"
  | "approval.summary.fileChange"
  | "approval.summary.mcpInput"
  | "approval.summary.permissions"
  | "approval.summary.userInput"
  | "aria.actions"
  | "aria.agentContext"
  | "aria.changedFiles"
  | "aria.codeMirrorPatchViewer"
  | "aria.commandOutput"
  | "aria.completedTask"
  | "aria.composerAttachments"
  | "aria.contextUsage"
  | "aria.contextUsageDetails"
  | "aria.criticalStatus"
  | "aria.diffPreview"
  | "aria.dismissThreadHistory"
  | "aria.message"
  | "aria.messageComposer"
  | "aria.openTask"
  | "aria.pendingAttachments"
  | "aria.runSettings"
  | "aria.statusDetails"
  | "aria.statusSummary"
  | "aria.threadStartContext"
  | "aria.threads"
  | "aria.tokenUsage"
  | "aria.usageLimits"
  | "aria.usageSummary"
  | "apps.authNeeded"
  | "apps.empty"
  | "apps.label"
  | "apps.loadMore"
  | "apps.notInstalled"
  | "common.cancel"
  | "common.close"
  | "common.closeMenu"
  | "common.collapse"
  | "common.default"
  | "common.details"
  | "common.disable"
  | "common.enable"
  | "common.expand"
  | "common.loading"
  | "common.allLoaded"
  | "common.moreAvailable"
  | "common.open"
  | "common.refresh"
  | "common.refreshing"
  | "common.serverDefault"
  | "common.syncPending"
  | "common.unknown"
  | "composer.addFollowUp"
  | "composer.attachFile"
  | "composer.attachFiles"
  | "composer.attachedFollowUp"
  | "composer.attachmentRejected"
  | "composer.cannotAcceptFollowUp"
  | "composer.couldNotSendAdditional"
  | "composer.couldNotStart"
  | "composer.couldNotStop"
  | "composer.enterToSend"
  | "composer.followUpNoActiveTurn"
  | "composer.followUpTurnChanged"
  | "composer.app"
  | "composer.mentionApp"
  | "composer.mentionPlugin"
  | "composer.plugin"
  | "composer.placeholder"
  | "composer.previewOnlyReason"
  | "composer.removeAttachment"
  | "composer.resolveApprovalReason"
  | "composer.send"
  | "composer.sendMessage"
  | "composer.stopCurrentTurn"
  | "context.cachedInput"
  | "context.compactionNotice"
  | "context.contextWindow"
  | "context.input"
  | "context.lastTurn"
  | "context.output"
  | "context.reasoning"
  | "context.title"
  | "context.used"
  | "diagnostics.label"
  | "diagnostics.messageCount"
  | "diagnostics.pluginManifestWarnings"
  | "diagnostics.syncing"
  | "diagnostics.withPluginWarnings"
  | "firstRun.authenticating.body"
  | "firstRun.authenticating.title"
  | "firstRun.bridgeError.body"
  | "firstRun.bridgeError.title"
  | "firstRun.connect.body"
  | "firstRun.connect.cta"
  | "firstRun.connect.title"
  | "firstRun.error"
  | "firstRun.form"
  | "firstRun.placeholder"
  | "firstRun.preparing.body"
  | "firstRun.preparing.cta"
  | "firstRun.preparing.title"
  | "firstRun.startThread"
  | "followUp.attachments"
  | "followUp.earlier"
  | "followUp.earlierQueued"
  | "followUp.edit"
  | "followUp.queued"
  | "followUp.queuedAttachments"
  | "followUp.remove"
  | "followUp.sendNow"
  | "locale.en"
  | "locale.es"
  | "locale.fr"
  | "locale.ja"
  | "locale.ko"
  | "locale.label"
  | "locale.zh-CN"
  | "markdown.completedTask"
  | "markdown.openTask"
  | "run.clearWorkingDirectory"
  | "run.cwd.noRecent"
  | "run.cwd.openFolder"
  | "run.cwd.openFolderAction"
  | "run.cwd.prompt"
  | "run.cwd.recent"
  | "run.cwd.selectFolder"
  | "run.cwd.serverDefault"
  | "run.defaultEffort"
  | "run.defaultModel"
  | "run.effort"
  | "run.effort.high"
  | "run.effort.low"
  | "run.effort.medium"
  | "run.effort.minimal"
  | "run.effort.veryHigh"
  | "run.executionMode"
  | "run.mode"
  | "run.mode.auto.description"
  | "run.mode.auto.label"
  | "run.mode.full-access.description"
  | "run.mode.full-access.label"
  | "run.mode.read-only.description"
  | "run.mode.read-only.label"
  | "run.mode.review.description"
  | "run.mode.review.label"
  | "run.model"
  | "run.modelAndEffort"
  | "run.modelDefault"
  | "run.noSelectableEffort"
  | "run.serverDefault"
  | "run.workingDirectory"
  | "skills.empty"
  | "skills.label"
  | "status.account"
  | "status.backgroundNotice"
  | "status.configWarning"
  | "status.critical"
  | "status.deprecationNotice"
  | "status.failed"
  | "status.mcpOAuth"
  | "status.modelReroute"
  | "status.rateLimit"
  | "status.title"
  | "status.total"
  | "status.warning"
  | "theme.dark"
  | "theme.label"
  | "theme.light"
  | "theme.system"
  | "thread.action.archive"
  | "thread.action.compact"
  | "thread.action.fork"
  | "thread.action.rename"
  | "thread.action.rollback"
  | "thread.action.unarchive"
  | "thread.closeHistory"
  | "thread.codexSession"
  | "thread.collapseHistory"
  | "thread.empty"
  | "thread.ephemeralSession"
  | "thread.expandHistory"
  | "thread.history"
  | "thread.loaded"
  | "thread.moreAvailable"
  | "thread.namePrompt"
  | "thread.new"
  | "thread.noThreadsFound"
  | "thread.openHistory"
  | "thread.resume"
  | "thread.resumeFailed"
  | "thread.search"
  | "thread.searchHistory"
  | "thread.status.complete"
  | "thread.status.failed"
  | "thread.status.needsApproval"
  | "thread.status.preview"
  | "thread.status.ready"
  | "thread.status.running"
  | "thread.status.stored"
  | "thread.threadCount"
  | "thread.untitled"
  | "timeline.agentTool"
  | "timeline.arguments"
  | "timeline.assistant"
  | "timeline.collab"
  | "timeline.collabTool"
  | "timeline.command"
  | "timeline.compaction"
  | "timeline.diff"
  | "timeline.error"
  | "timeline.file"
  | "timeline.fileChange"
  | "timeline.fileChanges"
  | "timeline.from"
  | "timeline.image"
  | "timeline.imageGenerated"
  | "timeline.item"
  | "timeline.items"
  | "timeline.jumpToLatest"
  | "timeline.lines"
  | "timeline.mcpTool"
  | "timeline.noPatch"
  | "timeline.noTerminalOutput"
  | "timeline.output"
  | "timeline.plan"
  | "timeline.reasoning"
  | "timeline.result"
  | "timeline.search"
  | "timeline.showEarlier"
  | "timeline.system"
  | "timeline.terminal"
  | "timeline.thinking"
  | "timeline.thread"
  | "timeline.to"
  | "timeline.tool"
  | "timeline.toolCall"
  | "timeline.unknownTool"
  | "timeline.webSearch"
  | "timeline.you"
  | "usage.empty"
  | "usage.inputOutput"
  | "usage.label"
  | "usage.limits"
  | "usage.tokens"
  | "usage.title";

export type AgentI18nMessages = Partial<Record<AgentI18nKey, string>>;

type AgentI18nDictionary = Record<AgentI18nKey, string>;

export interface AgentI18nValue {
  locale: AgentLocale;
  t: (key: AgentI18nKey, vars?: Record<string, string | number>) => string;
}

export interface AgentI18nProviderProps extends PropsWithChildren {
  locale?: AgentLocale | string;
  messages?: AgentI18nMessages;
}

const AgentI18nContext = createContext<AgentI18nValue | null>(null);

export function AgentI18nProvider({
  children,
  locale,
  messages,
}: AgentI18nProviderProps) {
  const normalizedLocale = normalizeAgentLocale(locale);
  const value = useMemo<AgentI18nValue>(() => {
    const dictionary = {
      ...agentI18nDictionaries.en,
      ...agentI18nDictionaries[normalizedLocale],
      ...messages,
    };
    return {
      locale: normalizedLocale,
      t: (key, vars) => interpolate(dictionary[key] ?? agentI18nDictionaries.en[key], vars),
    };
  }, [messages, normalizedLocale]);
  return (
    <AgentI18nContext.Provider value={value}>{children}</AgentI18nContext.Provider>
  );
}

export function useAgentI18n(): AgentI18nValue {
  return useContext(AgentI18nContext) ?? defaultI18n;
}

export function normalizeAgentLocale(locale?: AgentLocale | string): AgentLocale {
  const candidate =
    locale ??
    (typeof navigator !== "undefined" && typeof navigator.language === "string"
      ? navigator.language
      : "en");
  const normalized = candidate.toLowerCase();
  if (normalized === "zh" || normalized === "zh-cn" || normalized.startsWith("zh-hans")) {
    return "zh-CN";
  }
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("fr")) return "fr";
  return "en";
}

function interpolate(
  template: string,
  vars: Record<string, string | number> | undefined,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match,
  );
}

const en: AgentI18nDictionary = {
  "account.authenticated": "authenticated",
  "account.authenticating": "authenticating",
  "account.checking": "checking account",
  "account.connecting": "connecting",
  "account.cancelLogin": "Cancel login",
  "account.login": "Login",
  "account.openDeviceLogin": "Open device login",
  "account.unauthenticated": "unauthenticated",
  "approval.action.approve": "Approve",
  "approval.action.approveForSession": "Approve for session",
  "approval.action.decline": "Decline",
  "approval.action.review": "Review",
  "approval.aria.otherPending": "Other pending approvals",
  "approval.aria.pending": "Pending approvals",
  "approval.aria.pendingOne": "Pending approval {id}",
  "approval.count": "{count} decisions need your review",
  "approval.kind.attestation": "Generate attestation",
  "approval.kind.authRefresh": "Refresh authentication",
  "approval.kind.command": "Approve command",
  "approval.kind.dynamicTool": "Approve dynamic tool",
  "approval.kind.fileChange": "Review file changes",
  "approval.kind.generic": "Review request",
  "approval.kind.mcpInput": "MCP input requested",
  "approval.kind.permissions": "Approve permissions",
  "approval.kind.userInput": "User input requested",
  "approval.meta.approvalPolicy": "Approval policy",
  "approval.meta.item": "Item",
  "approval.meta.namespace": "Namespace",
  "approval.meta.sandbox": "Sandbox",
  "approval.meta.tool": "Tool",
  "approval.meta.workingDirectory": "Working directory",
  "approval.request.command": "command request",
  "approval.request.fileChange": "file-change request",
  "approval.request.generic": "{kind} request",
  "approval.risk.high": "High",
  "approval.risk.low": "Low",
  "approval.risk.medium": "Med",
  "approval.riskSuffix": "risk",
  "approval.summary.command": "Codex wants to run a shell command in your workspace.",
  "approval.summary.default": "Codex is requesting a {kind} decision.",
  "approval.summary.dynamicTool": "Codex wants to call a host-registered dynamic tool.",
  "approval.summary.fileChange": "Codex wants to apply file changes to your workspace.",
  "approval.summary.mcpInput": "An MCP server needs additional input to continue.",
  "approval.summary.permissions": "Review the requested permission before allowing the agent to continue.",
  "approval.summary.userInput": "Codex needs a free-form answer to continue.",
  "aria.actions": "Actions",
  "aria.agentContext": "Agent context",
  "aria.changedFiles": "Changed files",
  "aria.codeMirrorPatchViewer": "CodeMirror patch viewer",
  "aria.commandOutput": "Command output",
  "aria.completedTask": "Completed task",
  "aria.composerAttachments": "Composer attachments",
  "aria.contextUsage": "Context usage",
  "aria.contextUsageDetails": "Context usage details",
  "aria.criticalStatus": "Critical status",
  "aria.diffPreview": "Diff preview",
  "aria.dismissThreadHistory": "Dismiss thread history",
  "aria.message": "Message",
  "aria.messageComposer": "Message composer",
  "aria.openTask": "Open task",
  "aria.pendingAttachments": "Pending attachments",
  "aria.runSettings": "Run settings",
  "aria.statusDetails": "Status details",
  "aria.statusSummary": "Status summary",
  "aria.threadStartContext": "Thread start context",
  "aria.threads": "Threads",
  "aria.tokenUsage": "Token usage",
  "aria.usageLimits": "Usage limits",
  "aria.usageSummary": "Usage summary",
  "apps.authNeeded": "auth needed",
  "apps.empty": "Apps are available after refresh.",
  "apps.label": "Apps",
  "apps.loadMore": "Load more",
  "apps.notInstalled": "not installed",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.closeMenu": "Close menu",
  "common.collapse": "Collapse",
  "common.default": "Default",
  "common.details": "Details",
  "common.disable": "Disable",
  "common.enable": "Enable",
  "common.expand": "Expand",
  "common.loading": "Loading",
  "common.allLoaded": "all loaded",
  "common.moreAvailable": "more available",
  "common.open": "Open",
  "common.refresh": "Refresh",
  "common.refreshing": "Refreshing...",
  "common.serverDefault": "Server default",
  "common.syncPending": "sync pending",
  "common.unknown": "unknown",
  "composer.addFollowUp": "Add a follow-up...",
  "composer.attachFile": "Attach file",
  "composer.attachFiles": "Attach files",
  "composer.attachedFollowUp": "Attached follow-up",
  "composer.attachmentRejected": "{count} {file} could not be attached for this Codex thread.",
  "composer.cannotAcceptFollowUp": "This active turn cannot accept additional instructions. Wait for it to finish, then send a new message.",
  "composer.couldNotSendAdditional": "Could not send additional instructions: {message}",
  "composer.couldNotStart": "Could not start the turn: {message}",
  "composer.couldNotStop": "Could not stop the turn: {message}",
  "composer.enterToSend": "Enter to send",
  "composer.followUpNoActiveTurn": "There is no active turn to steer. Wait for the thread state to refresh, then send a new message.",
  "composer.followUpTurnChanged": "The active turn changed before this instruction was sent. The queued follow-up was not sent.",
  "composer.app": "App",
  "composer.mentionApp": "Mention an app",
  "composer.mentionPlugin": "Mention a plugin",
  "composer.plugin": "Plugin",
  "composer.placeholder": "Ask Codex to work in this thread",
  "composer.previewOnlyReason": "Resume this stored thread before sending a new message.",
  "composer.removeAttachment": "Remove {label}",
  "composer.resolveApprovalReason": "Resolve the pending approval before sending another message.",
  "composer.send": "Send",
  "composer.sendMessage": "Send message",
  "composer.stopCurrentTurn": "Stop current turn",
  "context.cachedInput": "Cached input",
  "context.compactionNotice": "Codex may automatically compact context as a thread approaches its window.",
  "context.contextWindow": "Context window",
  "context.input": "Input",
  "context.lastTurn": "Last turn",
  "context.output": "Output",
  "context.reasoning": "Reasoning",
  "context.title": "Context usage",
  "context.used": "Used",
  "diagnostics.label": "Diagnostics",
  "diagnostics.messageCount": "{count} {label}",
  "diagnostics.pluginManifestWarnings": "Plugin manifest warnings",
  "diagnostics.syncing": "Syncing account, models, and usage.",
  "diagnostics.withPluginWarnings": "Diagnostics and plugin warnings",
  "firstRun.authenticating.body": "Open the device login link and enter the code shown in the status bar.",
  "firstRun.authenticating.title": "Complete Codex login",
  "firstRun.bridgeError.body": "Check diagnostics, restart the local bridge, then reconnect before starting a thread.",
  "firstRun.bridgeError.title": "Codex bridge unavailable",
  "firstRun.connect.body": "Sign in with ChatGPT device code before starting a real local thread.",
  "firstRun.connect.cta": "Start device-code login",
  "firstRun.connect.title": "Connect Codex",
  "firstRun.error": "Could not start thread: {message}",
  "firstRun.form": "Start a Codex thread",
  "firstRun.placeholder": "Ask Codex what to work on",
  "firstRun.preparing.body": "Connecting to the local bridge and checking account state.",
  "firstRun.preparing.cta": "Syncing",
  "firstRun.preparing.title": "Preparing Codex",
  "firstRun.startThread": "Start thread",
  "followUp.attachments": "{count} {label}",
  "followUp.earlier": "{count} earlier {label} kept for this thread",
  "followUp.earlierQueued": "Earlier queued follow-ups",
  "followUp.edit": "Edit",
  "followUp.queued": "Queued follow-ups",
  "followUp.queuedAttachments": "Queued attachments",
  "followUp.remove": "Remove",
  "followUp.sendNow": "Send now",
  "locale.en": "English",
  "locale.es": "Spanish",
  "locale.fr": "French",
  "locale.ja": "Japanese",
  "locale.ko": "Korean",
  "locale.label": "Language",
  "locale.zh-CN": "Chinese",
  "markdown.completedTask": "Completed task",
  "markdown.openTask": "Open task",
  "run.clearWorkingDirectory": "Clear working directory",
  "run.cwd.noRecent": "No recent folders",
  "run.cwd.openFolder": "Open folder...",
  "run.cwd.openFolderAction": "Open folder",
  "run.cwd.prompt": "Working directory",
  "run.cwd.recent": "Recent",
  "run.cwd.selectFolder": "Select folder",
  "run.cwd.serverDefault": "Server default cwd",
  "run.defaultEffort": "Default effort",
  "run.defaultModel": "Default model",
  "run.effort": "Effort",
  "run.effort.high": "High",
  "run.effort.low": "Low",
  "run.effort.medium": "Medium",
  "run.effort.minimal": "Minimal",
  "run.effort.veryHigh": "Very high",
  "run.executionMode": "Execution mode",
  "run.mode": "Mode",
  "run.mode.auto.description": "Run in the workspace and ask only after a command fails.",
  "run.mode.auto.label": "Auto",
  "run.mode.full-access.description": "Allow full local access for trusted one-off work.",
  "run.mode.full-access.label": "Full access",
  "run.mode.read-only.description": "Read files and plan changes without writing to the workspace.",
  "run.mode.read-only.label": "Read-only",
  "run.mode.review.description": "Ask before commands or file changes that need review.",
  "run.mode.review.label": "Review",
  "run.model": "Model",
  "run.modelAndEffort": "Model and effort",
  "run.modelDefault": "Model default",
  "run.noSelectableEffort": "This model exposes no selectable effort.",
  "run.serverDefault": "Server default",
  "run.workingDirectory": "Working directory",
  "skills.empty": "Skills are available after refresh.",
  "skills.label": "Skills",
  "status.account": "Account",
  "status.backgroundNotice": "{count} background {label}",
  "status.configWarning": "Config warning",
  "status.critical": "critical",
  "status.deprecationNotice": "Deprecation notice",
  "status.failed": "Failed",
  "status.mcpOAuth": "MCP OAuth",
  "status.modelReroute": "Model rerouted",
  "status.rateLimit": "Rate limit",
  "status.title": "Status",
  "status.total": "total",
  "status.warning": "warning",
  "theme.dark": "Dark",
  "theme.label": "Theme",
  "theme.light": "Light",
  "theme.system": "System",
  "thread.action.archive": "Archive",
  "thread.action.compact": "Compact",
  "thread.action.fork": "Fork",
  "thread.action.rename": "Rename",
  "thread.action.rollback": "Rollback",
  "thread.action.unarchive": "Unarchive",
  "thread.closeHistory": "Close history",
  "thread.codexSession": "Codex session",
  "thread.collapseHistory": "Collapse history",
  "thread.empty": "No threads found.",
  "thread.ephemeralSession": "Ephemeral Codex session",
  "thread.expandHistory": "Expand history",
  "thread.history": "Threads",
  "thread.loaded": "{count} {label} loaded",
  "thread.moreAvailable": "more available",
  "thread.namePrompt": "Thread name",
  "thread.new": "New thread",
  "thread.noThreadsFound": "No threads found.",
  "thread.openHistory": "Open thread history",
  "thread.resume": "Resume",
  "thread.resumeFailed": "Resume failed: {message}",
  "thread.search": "Search threads",
  "thread.searchHistory": "Search history",
  "thread.status.complete": "Complete",
  "thread.status.failed": "Failed",
  "thread.status.needsApproval": "Needs approval",
  "thread.status.preview": "Preview",
  "thread.status.ready": "Ready",
  "thread.status.running": "Running",
  "thread.status.stored": "Stored",
  "thread.threadCount": "{count} {label}",
  "thread.untitled": "Untitled thread",
  "timeline.agentTool": "agent tool",
  "timeline.arguments": "Arguments",
  "timeline.assistant": "Assistant",
  "timeline.collab": "Collab",
  "timeline.collabTool": "Collab tool",
  "timeline.command": "Command",
  "timeline.compaction": "Compaction",
  "timeline.diff": "diff",
  "timeline.error": "Error",
  "timeline.file": "file",
  "timeline.fileChange": "File change",
  "timeline.fileChanges": "File changes",
  "timeline.from": "From",
  "timeline.image": "Image",
  "timeline.imageGenerated": "Image generated",
  "timeline.item": "item",
  "timeline.items": "items",
  "timeline.jumpToLatest": "Jump to latest",
  "timeline.lines": "lines",
  "timeline.mcpTool": "MCP tool",
  "timeline.noPatch": "No patch payload captured.",
  "timeline.noTerminalOutput": "No terminal output captured.",
  "timeline.output": "Output",
  "timeline.plan": "Plan",
  "timeline.reasoning": "Reasoning",
  "timeline.result": "Result",
  "timeline.search": "Search",
  "timeline.showEarlier": "Show earlier items",
  "timeline.system": "System",
  "timeline.terminal": "terminal",
  "timeline.thinking": "Thinking",
  "timeline.thread": "Thread",
  "timeline.to": "To",
  "timeline.tool": "Tool",
  "timeline.toolCall": "Tool call",
  "timeline.unknownTool": "unknown tool",
  "timeline.webSearch": "Web search",
  "timeline.you": "You",
  "usage.empty": "Usage limits are available after account sync.",
  "usage.inputOutput": "{input} input · {output} output",
  "usage.label": "Usage",
  "usage.limits": "Usage limits",
  "usage.tokens": "Tokens",
  "usage.title": "Usage",
};

function translated(base: AgentI18nDictionary, overrides: AgentI18nMessages): AgentI18nDictionary {
  return { ...base, ...overrides };
}

const ja = translated(en, {
  "account.authenticated": "認証済み",
  "account.authenticating": "認証中",
  "account.checking": "アカウント確認中",
  "account.connecting": "接続中",
  "account.login": "ログイン",
  "account.openDeviceLogin": "デバイスログインを開く",
  "account.unauthenticated": "未認証",
  "approval.action.approve": "承認",
  "approval.action.approveForSession": "このセッションで承認",
  "approval.action.decline": "却下",
  "approval.action.review": "確認",
  "approval.count": "{count} 件の判断が必要です",
  "approval.kind.command": "コマンドを承認",
  "approval.kind.fileChange": "ファイル変更を確認",
  "approval.kind.userInput": "入力が必要です",
  "approval.risk.high": "高",
  "approval.risk.low": "低",
  "approval.risk.medium": "中",
  "approval.riskSuffix": "リスク",
  "aria.agentContext": "エージェントコンテキスト",
  "aria.message": "メッセージ",
  "apps.label": "アプリ",
  "common.cancel": "キャンセル",
  "common.close": "閉じる",
  "common.closeMenu": "メニューを閉じる",
  "common.details": "詳細",
  "common.refresh": "更新",
  "common.refreshing": "更新中...",
  "common.serverDefault": "サーバーデフォルト",
  "composer.addFollowUp": "フォローアップを追加...",
  "composer.attachFile": "ファイルを添付",
  "composer.enterToSend": "Enter で送信",
  "composer.app": "アプリ",
  "composer.placeholder": "このスレッドで Codex に作業を依頼",
  "composer.plugin": "プラグイン",
  "composer.send": "送信",
  "composer.sendMessage": "メッセージを送信",
  "composer.stopCurrentTurn": "現在のターンを停止",
  "context.title": "コンテキスト使用量",
  "firstRun.form": "Codex スレッドを開始",
  "firstRun.placeholder": "Codex に作業内容を依頼",
  "firstRun.startThread": "スレッドを開始",
  "locale.en": "英語",
  "locale.es": "スペイン語",
  "locale.fr": "フランス語",
  "locale.ja": "日本語",
  "locale.ko": "韓国語",
  "locale.label": "言語",
  "locale.zh-CN": "中国語",
  "run.cwd.openFolder": "フォルダを開く...",
  "run.cwd.recent": "最近",
  "run.cwd.selectFolder": "フォルダを選択",
  "run.effort": "推論",
  "run.executionMode": "実行モード",
  "run.mode.auto.label": "自動",
  "run.mode.full-access.label": "フルアクセス",
  "run.mode.read-only.label": "読み取り専用",
  "run.mode.review.label": "確認",
  "run.model": "モデル",
  "run.modelAndEffort": "モデルと推論",
  "run.workingDirectory": "作業ディレクトリ",
  "skills.label": "スキル",
  "status.title": "ステータス",
  "theme.dark": "ダーク",
  "theme.label": "テーマ",
  "theme.light": "ライト",
  "theme.system": "システム",
  "thread.history": "スレッド",
  "thread.new": "新規スレッド",
  "thread.openHistory": "スレッド履歴を開く",
  "thread.search": "スレッドを検索",
  "thread.untitled": "無題のスレッド",
  "timeline.assistant": "アシスタント",
  "timeline.command": "コマンド",
  "timeline.plan": "計画",
  "timeline.reasoning": "推論",
  "timeline.you": "あなた",
  "usage.label": "使用量",
  "usage.tokens": "トークン",
});

const ko = translated(en, {
  "account.login": "로그인",
  "approval.action.approve": "승인",
  "approval.action.decline": "거부",
  "approval.action.review": "검토",
  "apps.label": "앱",
  "common.cancel": "취소",
  "common.close": "닫기",
  "common.closeMenu": "메뉴 닫기",
  "common.details": "세부 정보",
  "common.refresh": "새로고침",
  "composer.addFollowUp": "후속 지시 추가...",
  "composer.attachFile": "파일 첨부",
  "composer.enterToSend": "Enter로 보내기",
  "composer.app": "앱",
  "composer.placeholder": "이 스레드에서 Codex에 작업 요청",
  "composer.plugin": "플러그인",
  "composer.send": "보내기",
  "composer.sendMessage": "메시지 보내기",
  "composer.stopCurrentTurn": "현재 턴 중지",
  "context.title": "컨텍스트 사용량",
  "firstRun.form": "Codex 스레드 시작",
  "firstRun.placeholder": "Codex에게 작업 요청",
  "firstRun.startThread": "스레드 시작",
  "locale.en": "영어",
  "locale.es": "스페인어",
  "locale.fr": "프랑스어",
  "locale.ja": "일본어",
  "locale.ko": "한국어",
  "locale.label": "언어",
  "locale.zh-CN": "중국어",
  "run.cwd.openFolder": "폴더 열기...",
  "run.cwd.recent": "최근",
  "run.cwd.selectFolder": "폴더 선택",
  "run.effort": "추론",
  "run.executionMode": "실행 모드",
  "run.mode.auto.label": "자동",
  "run.mode.full-access.label": "전체 접근",
  "run.mode.read-only.label": "읽기 전용",
  "run.mode.review.label": "검토",
  "run.model": "모델",
  "run.modelAndEffort": "모델 및 추론",
  "run.workingDirectory": "작업 디렉터리",
  "skills.label": "스킬",
  "theme.dark": "다크",
  "theme.label": "테마",
  "theme.light": "라이트",
  "theme.system": "시스템",
  "thread.history": "스레드",
  "thread.new": "새 스레드",
  "thread.search": "스레드 검색",
  "timeline.assistant": "어시스턴트",
  "timeline.command": "명령",
  "timeline.plan": "계획",
  "timeline.reasoning": "추론",
  "timeline.you": "나",
  "usage.label": "사용량",
  "usage.tokens": "토큰",
});

const zhCN = translated(en, {
  "account.login": "登录",
  "approval.action.approve": "批准",
  "approval.action.decline": "拒绝",
  "approval.action.review": "查看",
  "apps.label": "应用",
  "common.cancel": "取消",
  "common.close": "关闭",
  "common.closeMenu": "关闭菜单",
  "common.details": "详情",
  "common.refresh": "刷新",
  "composer.addFollowUp": "添加后续请求...",
  "composer.attachFile": "附加文件",
  "composer.enterToSend": "按 Enter 发送",
  "composer.app": "应用",
  "composer.placeholder": "让 Codex 在此线程中工作",
  "composer.plugin": "插件",
  "composer.send": "发送",
  "composer.sendMessage": "发送消息",
  "composer.stopCurrentTurn": "停止当前轮次",
  "context.title": "上下文使用量",
  "firstRun.form": "开始 Codex 线程",
  "firstRun.placeholder": "告诉 Codex 要做什么",
  "firstRun.startThread": "开始线程",
  "locale.en": "英语",
  "locale.es": "西班牙语",
  "locale.fr": "法语",
  "locale.ja": "日语",
  "locale.ko": "韩语",
  "locale.label": "语言",
  "locale.zh-CN": "中文",
  "run.cwd.openFolder": "打开文件夹...",
  "run.cwd.recent": "最近",
  "run.cwd.selectFolder": "选择文件夹",
  "run.effort": "推理",
  "run.executionMode": "执行模式",
  "run.mode.auto.label": "自动",
  "run.mode.full-access.label": "完全访问",
  "run.mode.read-only.label": "只读",
  "run.mode.review.label": "审核",
  "run.model": "模型",
  "run.modelAndEffort": "模型和推理",
  "run.workingDirectory": "工作目录",
  "skills.label": "技能",
  "theme.dark": "深色",
  "theme.label": "主题",
  "theme.light": "浅色",
  "theme.system": "系统",
  "thread.history": "线程",
  "thread.new": "新线程",
  "thread.search": "搜索线程",
  "timeline.assistant": "助手",
  "timeline.command": "命令",
  "timeline.plan": "计划",
  "timeline.reasoning": "推理",
  "timeline.you": "你",
  "usage.label": "用量",
  "usage.tokens": "令牌",
});

const es = translated(en, {
  "account.login": "Iniciar sesión",
  "approval.action.approve": "Aprobar",
  "approval.action.decline": "Rechazar",
  "approval.action.review": "Revisar",
  "apps.label": "Aplicaciones",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.closeMenu": "Cerrar menú",
  "common.details": "Detalles",
  "common.refresh": "Actualizar",
  "composer.addFollowUp": "Agregar seguimiento...",
  "composer.attachFile": "Adjuntar archivo",
  "composer.enterToSend": "Enter para enviar",
  "composer.app": "App",
  "composer.placeholder": "Pide a Codex que trabaje en este hilo",
  "composer.plugin": "Plugin",
  "composer.send": "Enviar",
  "composer.sendMessage": "Enviar mensaje",
  "composer.stopCurrentTurn": "Detener turno actual",
  "context.title": "Uso de contexto",
  "firstRun.form": "Iniciar un hilo de Codex",
  "firstRun.placeholder": "Pide a Codex qué hacer",
  "firstRun.startThread": "Iniciar hilo",
  "locale.en": "Inglés",
  "locale.es": "Español",
  "locale.fr": "Francés",
  "locale.ja": "Japonés",
  "locale.ko": "Coreano",
  "locale.label": "Idioma",
  "locale.zh-CN": "Chino",
  "run.cwd.openFolder": "Abrir carpeta...",
  "run.cwd.recent": "Recientes",
  "run.cwd.selectFolder": "Seleccionar carpeta",
  "run.effort": "Razonamiento",
  "run.executionMode": "Modo de ejecución",
  "run.mode.auto.label": "Auto",
  "run.mode.full-access.label": "Acceso completo",
  "run.mode.read-only.label": "Solo lectura",
  "run.mode.review.label": "Revisión",
  "run.model": "Modelo",
  "run.modelAndEffort": "Modelo y razonamiento",
  "run.workingDirectory": "Directorio de trabajo",
  "skills.label": "Habilidades",
  "theme.dark": "Oscuro",
  "theme.label": "Tema",
  "theme.light": "Claro",
  "theme.system": "Sistema",
  "thread.history": "Hilos",
  "thread.new": "Nuevo hilo",
  "thread.search": "Buscar hilos",
  "timeline.assistant": "Asistente",
  "timeline.command": "Comando",
  "timeline.plan": "Plan",
  "timeline.reasoning": "Razonamiento",
  "timeline.you": "Tú",
  "usage.label": "Uso",
  "usage.tokens": "Tokens",
});

const fr = translated(en, {
  "account.login": "Connexion",
  "approval.action.approve": "Approuver",
  "approval.action.decline": "Refuser",
  "approval.action.review": "Examiner",
  "apps.label": "Apps",
  "common.cancel": "Annuler",
  "common.close": "Fermer",
  "common.closeMenu": "Fermer le menu",
  "common.details": "Détails",
  "common.refresh": "Actualiser",
  "composer.addFollowUp": "Ajouter un suivi...",
  "composer.attachFile": "Joindre un fichier",
  "composer.enterToSend": "Entrée pour envoyer",
  "composer.app": "App",
  "composer.placeholder": "Demander à Codex de travailler dans ce fil",
  "composer.plugin": "Plugin",
  "composer.send": "Envoyer",
  "composer.sendMessage": "Envoyer le message",
  "composer.stopCurrentTurn": "Arrêter le tour actuel",
  "context.title": "Utilisation du contexte",
  "firstRun.form": "Démarrer un fil Codex",
  "firstRun.placeholder": "Demander à Codex quoi faire",
  "firstRun.startThread": "Démarrer le fil",
  "locale.en": "Anglais",
  "locale.es": "Espagnol",
  "locale.fr": "Français",
  "locale.ja": "Japonais",
  "locale.ko": "Coréen",
  "locale.label": "Langue",
  "locale.zh-CN": "Chinois",
  "run.cwd.openFolder": "Ouvrir un dossier...",
  "run.cwd.recent": "Récents",
  "run.cwd.selectFolder": "Sélectionner un dossier",
  "run.effort": "Raisonnement",
  "run.executionMode": "Mode d'exécution",
  "run.mode.auto.label": "Auto",
  "run.mode.full-access.label": "Accès complet",
  "run.mode.read-only.label": "Lecture seule",
  "run.mode.review.label": "Revue",
  "run.model": "Modèle",
  "run.modelAndEffort": "Modèle et raisonnement",
  "run.workingDirectory": "Dossier de travail",
  "skills.label": "Compétences",
  "theme.dark": "Sombre",
  "theme.label": "Thème",
  "theme.light": "Clair",
  "theme.system": "Système",
  "thread.history": "Fils",
  "thread.new": "Nouveau fil",
  "thread.search": "Rechercher des fils",
  "timeline.assistant": "Assistant",
  "timeline.command": "Commande",
  "timeline.plan": "Plan",
  "timeline.reasoning": "Raisonnement",
  "timeline.you": "Vous",
  "usage.label": "Utilisation",
  "usage.tokens": "Jetons",
});

export const agentI18nDictionaries: Record<AgentLocale, AgentI18nDictionary> = {
  en,
  es,
  fr,
  ja,
  ko,
  "zh-CN": zhCN,
};

const defaultI18n: AgentI18nValue = {
  locale: "en",
  t: (key, vars) => interpolate(agentI18nDictionaries.en[key], vars),
};
