import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import {
  useAgentApprovals,
  useAgentBootstrap,
  useAgentComposer,
  useAgentModels,
  useAgentThreadActions,
  useAgentRunSettings,
  useAgentTurn,
  useAgentThread,
  useAgentThreads,
  useAgentAuth,
} from "./hooks";
import {
  mentionInput,
  type CodexUserInput,
} from "./codex-request-params";
import {
  IconAdd,
  IconAlert,
  IconApp,
  IconCheck,
  IconChevronDown,
  IconClose,
  IconCpu,
  IconFolder,
  IconGauge,
  IconImage,
  IconMoreVertical,
  IconPaperclip,
  IconPlugin,
  IconSend,
  IconShield,
  IconSpark,
  IconStop,
  buttonClass,
} from "./components-internal";
import { useAgentContext } from "./provider";

import { AgentApprovalQueue } from "./components/approvals";
export { AgentApprovalPrompt, AgentApprovalQueue } from "./components/approvals";
import {
  AgentCriticalNoticeList,
  AgentDiagnosticsPanel,
  AgentStatusBar,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentTokenUsageBar,
  AgentUsagePanel,
} from "./components/status";
export {
  AgentCriticalNoticeList,
  AgentDiagnostics,
  AgentDiagnosticsPanel,
  AgentRateLimitBar,
  AgentStatusBar,
  AgentStatusBanners,
  AgentStatusDetails,
  AgentStatusDrawer,
  AgentStatusSummary,
  AgentTokenUsageBar,
  AgentUsage,
  AgentUsagePanel,
  AgentUsageSummary,
  AgentSkillsPanel,
  AgentAppsPanel,
  type AgentUsageProps,
} from "./components/status";
import { formatThreadStatus, isUserFacingPath, threadSubtitle, ThreadSidebar } from "./components/sidebar";
export { AgentThreadSidebar, ThreadList, ThreadSidebar } from "./components/sidebar";
import { deferAction, useCompactLayout } from "./components/shared";
import { normalizedStatusNotices, statusSummary } from "./components/status";
import { AgentMessageList } from "./timeline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


export interface AgentChatSlots {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
}

export interface AgentChatProps {
  className?: string;
  diagnostics?: boolean;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  sidebar?: boolean;
  slots?: AgentChatSlots;
  usage?: boolean;
}

export function AgentChat({
  className,
  diagnostics = false,
  onRequestAppMention,
  onRequestPluginMention,
  resolveLocalAttachment,
  sidebar = true,
  slots,
  usage = false,
}: AgentChatProps = {}) {
  const bootstrap = useAgentBootstrap();
  const compact = useCompactLayout();
  const { thread, threadId, startThread } = useAgentThread();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
  // Desktop keeps an expand/collapse rail; mobile keeps an off-canvas drawer.
  // Tracking them separately means a viewport change never strands the user
  // with the wrong default.
  const [sidebarOpenDesktop, setSidebarOpenDesktop] = useState(true);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const isSidebarCollapsed = compact ? !sidebarOpenMobile : !sidebarOpenDesktop;
  const setSidebarCollapsed = useCallback(
    (next: boolean) => {
      if (compact) setSidebarOpenMobile(!next);
      else setSidebarOpenDesktop(!next);
    },
    [compact],
  );
  const hasRail = usage || diagnostics;
  const drawerOpen = compact && sidebar && !isSidebarCollapsed;
  return (
    <AgentShell
      className={className}
      data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
      data-sidebar-drawer={drawerOpen ? "open" : "closed"}
      sidebar={
        sidebar ? (
          <ThreadSidebar
            activeThreadId={activeThreadId}
            collapsed={isSidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
            onSelectThread={setActiveThread}
            threads={threads}
          />
        ) : undefined
      }
    >
      {drawerOpen ? (
        <button
          aria-label="Dismiss thread history"
          className="aui-sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
          type="button"
        />
      ) : null}
      <div className="aui-chat">
        <AgentStatusBar
          onOpenThreads={
            sidebar ? () => setSidebarCollapsed(false) : undefined
          }
        />
        <div className="aui-chat-body" data-rail={hasRail ? "visible" : "hidden"}>
          <div className="aui-thread-column">
            {thread ? (
              <AgentThreadView
                onRequestAppMention={onRequestAppMention}
                onRequestPluginMention={onRequestPluginMention}
                renderApproval={slots?.renderApproval}
                renderItem={slots?.renderItem}
                resolveLocalAttachment={resolveLocalAttachment}
                threadId={threadId}
              />
            ) : (
              <div className="aui-empty">
                <AgentFirstRun onStartThread={() => void startThread()} />
              </div>
            )}
          </div>
          {hasRail ? (
            <aside className="aui-chat-rail" aria-label="Agent context">
              <AgentStatusSummary />
              <AgentStatusDetails />
              {usage ? <AgentUsagePanel autoRefresh={false} /> : null}
              {diagnostics ? <AgentDiagnosticsPanel bootstrap={bootstrap} /> : null}
            </aside>
          ) : null}
        </div>
      </div>
    </AgentShell>
  );
}

/**
 * Cohesive secondary-chrome card combining status summary and details so the
 * rail never renders two near-identical status widgets stacked on each other.
 */
export function AgentStatusCard() {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners);
  if (notices.length === 0) return null;
  const criticalCount = notices.filter((notice) => notice.severity === "critical").length;
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  const summary = statusSummary(notices.length, warningCount, criticalCount);
  const detailsNotices = notices.filter((notice) => notice.severity !== "critical");
  return (
    <section className="aui-status-card" aria-label="Status">
      <header className="aui-status-card-header">
        <strong>Status</strong>
        <span data-severity={criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "info"}>
          {summary}
        </span>
      </header>
      {detailsNotices.length > 0 ? (
        <details className="aui-status-card-details">
          <summary>
            <span>Background notices</span>
            <small>{detailsNotices.length}</small>
          </summary>
          <div className="aui-status-card-list">
            {detailsNotices.slice(-6).map((notice) => (
              <article
                className="aui-status-banner"
                data-kind={notice.kind}
                data-severity={notice.severity}
                key={notice.id}
              >
                <strong>{notice.title}</strong>
                <span>{notice.message}</span>
              </article>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

export interface AgentShellProps extends React.HTMLAttributes<HTMLElement> {
  sidebar?: React.ReactNode;
}

export function AgentShell({
  children,
  className,
  sidebar,
  ...props
}: AgentShellProps) {
  return (
    <section
      className={["aui-shell", className].filter(Boolean).join(" ")}
      data-sidebar-present={sidebar ? "true" : "false"}
      data-testid="agent-chat"
      {...props}
    >
      {sidebar}
      {children}
    </section>
  );
}

export interface AgentThreadViewProps {
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  threadId?: string;
}

export function AgentThreadView({
  onRequestAppMention,
  onRequestPluginMention,
  renderApproval,
  renderItem,
  resolveLocalAttachment,
  threadId,
}: AgentThreadViewProps) {
  const { thread, threadId: resolvedThreadId } = useAgentThread(threadId);
  if (!thread) return null;
  return (
    <AgentThreadSurface>
      <AgentThreadHeader thread={thread} threadId={resolvedThreadId} />
      <AgentCriticalNoticeList />
      <AgentThreadTimeline
        renderApproval={renderApproval}
        renderItem={renderItem}
        thread={thread}
        threadId={resolvedThreadId}
      />
      <AgentComposerPanel
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        resolveLocalAttachment={resolveLocalAttachment}
        thread={thread}
        threadId={resolvedThreadId}
      />
    </AgentThreadSurface>
  );
}

export function AgentThreadSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["aui-thread-surface", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function AgentThreadHeader({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  return (
    <div className="aui-thread-header">
      <div className="aui-thread-title">
        <h1>{thread.thread.name ?? "Untitled thread"}</h1>
        <p>{threadSubtitle(thread.thread)}</p>
        {thread.tokenUsage ? <AgentTokenUsageBar {...thread.tokenUsage} /> : null}
      </div>
      <AgentThreadActions thread={thread} threadId={threadId} />
    </div>
  );
}

/**
 * Renders the thread transcript. When a `threadId` is supplied, pending
 * approvals for that thread are appended to the end of the transcript as a
 * pending-decision item — they are part of the scroll area, not a separate
 * pane stacked above the composer.
 */
export function AgentThreadTimeline({
  renderApproval,
  renderItem,
  thread,
  threadId,
}: {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  thread: ThreadState;
  threadId?: string;
}) {
  const approvalThreadId = threadId ?? thread.thread.id;
  const { approvals } = useAgentApprovals(approvalThreadId);
  return (
    <AgentMessageList
      footer={
        approvals.length > 0 ? (
          <AgentApprovalQueue
            renderApproval={renderApproval}
            threadId={approvalThreadId}
          />
        ) : undefined
      }
      renderItem={renderItem}
      scrollKey={approvals.length}
      thread={thread}
    />
  );
}

function AgentFirstRun({ onStartThread }: { onStartThread: () => void }) {
  const { account, cancelLogin, login } = useAgentAuth();
  const { state } = useAgentContext();
  if (state.connection.status === "error" || state.connection.status === "closed") {
    return (
      <div className="aui-first-run">
        <strong>Codex bridge unavailable</strong>
        <p>
          Check diagnostics, restart the local bridge, then reconnect before starting a
          thread.
        </p>
      </div>
    );
  }
  if (state.connection.status === "connecting" || account.status === "unknown") {
    return (
      <div className="aui-first-run">
        <strong>Preparing Codex</strong>
        <p>Connecting to the local bridge and checking account state.</p>
        <button className={buttonClass("secondary")} disabled type="button">
          Syncing
        </button>
      </div>
    );
  }
  if (account.status === "unauthenticated") {
    return (
      <div className="aui-first-run">
        <strong>Connect Codex</strong>
        <p>Sign in with ChatGPT device code before starting a real local thread.</p>
        <button
          className={buttonClass("primary")}
          onClick={() => deferAction(login)}
          type="button"
        >
          Start device-code login
        </button>
      </div>
    );
  }
  if (account.status === "authenticating") {
    return (
      <div className="aui-first-run">
        <strong>Complete Codex login</strong>
        <p>Open the device login link and enter the code shown in the status bar.</p>
        <button
          className={buttonClass("secondary")}
          disabled={!account.login?.loginId}
          onClick={() => deferAction(cancelLogin)}
          type="button"
        >
          Cancel login
        </button>
      </div>
    );
  }
  return (
    <div className="aui-first-run">
      <strong>Start a Codex thread</strong>
      <p>Choose a model, effort, execution mode, and working directory, then start.</p>
      <AgentRunControls autoRefresh={false} variant="panel" />
      <button
        className={buttonClass("primary")}
        onClick={() => deferAction(onStartThread)}
        type="button"
      >
        <IconSpark size={14} />
        <span>Start thread</span>
      </button>
    </div>
  );
}

function AgentThreadActions({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  const { resumeThread, startThread } = useAgentThread(threadId);
  const {
    archiveThread,
    compactThread,
    forkThread,
    renameThread,
    rollbackThread,
    unarchiveThread,
  } = useAgentThreadActions(threadId);
  const { interruptTurn } = useAgentTurn(threadId);
  const status = thread.status;
  const latestTurnId = thread.orderedTurnIds.at(-1);
  const hasTurns = thread.orderedTurnIds.length > 0;
  const canResume = threadId && (status === "notLoaded" || status === "loaded");
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        <span className="aui-status-pill-dot" aria-hidden="true" />
        {formatThreadStatus(status, { hasTurns })}
      </span>
      {canResume ? (
        <button
          className={buttonClass("secondary", { size: "sm" })}
          onClick={() =>
            deferAction(() => void resumeThread(threadId, { excludeTurns: true }))
          }
          type="button"
        >
          Resume
        </button>
      ) : null}
      {status === "running" && latestTurnId ? (
        <button
          className={buttonClass("danger", { size: "sm" })}
          onClick={() => deferAction(() => void interruptTurn(latestTurnId))}
          type="button"
        >
          <IconStop size={12} />
          <span>Stop</span>
        </button>
      ) : null}
      <button
        aria-label="New thread"
        className={buttonClass("ghost", { size: "sm" })}
        onClick={() => deferAction(startThread)}
        title="New thread"
        type="button"
      >
        <IconAdd size={14} />
        <span>New thread</span>
      </button>
      <details className="aui-thread-action-menu">
        <summary aria-label="Actions" title="Thread actions">
          <IconMoreVertical size={16} />
        </summary>
        <div>
          <button
            disabled={!threadId}
            onClick={() => {
              const name = globalThis.prompt?.("Thread name", thread.thread.name ?? "");
              if (name?.trim()) deferAction(() => void renameThread(name.trim()));
            }}
            type="button"
          >
            Rename
          </button>
          <button
            disabled={!threadId}
            onClick={() => deferAction(() => void forkThread())}
            type="button"
          >
            Fork
          </button>
          <button
            disabled={!threadId || status === "archived"}
            onClick={() => deferAction(() => void archiveThread())}
            type="button"
          >
            Archive
          </button>
          <button
            disabled={!threadId || status !== "archived"}
            onClick={() => deferAction(() => void unarchiveThread())}
            type="button"
          >
            Unarchive
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void compactThread())}
            type="button"
          >
            Compact
          </button>
          <button
            disabled={!threadId || !hasTurns}
            onClick={() => deferAction(() => void rollbackThread(1))}
            type="button"
          >
            Rollback
          </button>
        </div>
      </details>
    </div>
  );
}

export interface AgentRunControlsProps {
  autoRefresh?: boolean;
  /**
   * "compact" renders an inline, dense form intended to sit inside another
   * surface (the composer or a host-owned panel). "panel" renders the legacy
   * full-width labeled settings form used by the empty-state and the
   * fixture gallery close-up.
   */
  variant?: "compact" | "panel";
}

export function AgentRunControls({
  autoRefresh = true,
  variant = "panel",
}: AgentRunControlsProps = {}) {
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    executionModes,
    runSettings,
    selectedModel,
    setCwd,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  } = useAgentRunSettings();
  const hasEffortOptions = supportedEfforts.length > 0;
  const cwdOptions = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(state.threads)
            .map((thread) => thread.thread.path)
            .filter((path): path is string => Boolean(path && isUserFacingPath(path))),
        ),
      ).slice(0, 12),
    [state.threads],
  );

  useEffect(() => {
    if (autoRefresh && state.connection.status === "connected" && models.length === 0) {
      void refreshModels().catch(() => undefined);
    }
  }, [autoRefresh, models.length, refreshModels, state.connection.status]);

  return (
    <section
      className={variant === "compact" ? "aui-run-controls-compact" : "aui-run-controls"}
      aria-label="Run settings"
    >
      <fieldset className="aui-mode-group">
        <legend>Execution mode</legend>
        <div className="aui-segmented" role="tablist">
          {executionModes.map((mode) => (
            <button
              aria-pressed={runSettings.executionMode === mode.id}
              className="aui-segment"
              key={mode.id}
              onClick={() => setExecutionMode(mode.id)}
              title={mode.description}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="aui-field">
        <span>Model</span>
        <select
          aria-label="Model"
          className="aui-select"
          onChange={(event) => setModelId(event.currentTarget.value)}
          value={runSettings.modelId ?? ""}
        >
          <option value="">Server default</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {formatModelOption(model)}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field">
        <span>Effort</span>
        <select
          aria-label="Effort"
          className="aui-select"
          disabled={!hasEffortOptions}
          onChange={(event) => setEffort(event.currentTarget.value)}
          value={runSettings.effort ?? ""}
        >
          <option value="">
            {selectedModel && hasEffortOptions ? "Model default" : "Server default"}
          </option>
          {supportedEfforts.map((effort) => (
            <option key={effort} value={effort}>
              {effort}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field aui-field-wide">
        <span>Working directory</span>
        <div className="aui-input-shell aui-input-with-icon">
          <IconFolder size={14} />
          <input
            aria-label="Working directory"
            className="aui-text-input"
            list={cwdOptions.length > 0 ? "aui-cwd-options" : undefined}
            onChange={(event) => setCwd(event.currentTarget.value)}
            placeholder={cwdOptions[0] ?? "Server default cwd"}
            type="text"
            value={runSettings.cwd ?? ""}
          />
          {runSettings.cwd ? (
            <button
              aria-label="Clear working directory"
              className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
              onClick={() => setCwd("")}
              title="Clear working directory"
              type="button"
            >
              <IconClose size={14} />
            </button>
          ) : null}
          {cwdOptions.length > 0 ? (
            <datalist id="aui-cwd-options">
              {cwdOptions.map((cwd) => (
                <option key={cwd} value={cwd} />
              ))}
            </datalist>
          ) : null}
        </div>
      </label>
    </section>
  );
}

export interface AgentRunSettingsPanelProps {
  autoRefresh?: boolean;
}

export function AgentRunSettingsPanel({
  autoRefresh = false,
}: AgentRunSettingsPanelProps = {}) {
  return <AgentRunControls autoRefresh={autoRefresh} variant="compact" />;
}

function formatModelOption(model: { id: string; name?: string }): string {
  if (!model.name || model.name === model.id) return model.id;
  return `${model.name} (${model.id})`;
}

// --- Compact anchored menu --------------------------------------------------
// Used by the composer toolbar for mode / model / effort selection. Opens
// anchored above the trigger on desktop and as a bottom sheet on mobile so the
// menu always lands inside the viewport. Esc, outside click, and arrow-key
// navigation are handled here so each consumer stays declarative.

interface AuiMenuProps {
  ariaLabel: string;
  children: (close: () => void) => React.ReactNode;
  compact: boolean;
  icon?: React.ReactNode;
  label: string;
}

interface MenuAnchor {
  left: number;
  top: number;
}

function AuiMenu({ ariaLabel, children, compact, icon, label }: AuiMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => {
    setOpen((current) => {
      if (current) return false;
      const rect = triggerRef.current?.getBoundingClientRect();
      // Anchor in viewport space so the panel can use fixed positioning and
      // escape the composer's clipped scroll ancestors.
      setAnchor(rect ? { left: rect.left, top: rect.top } : null);
      return true;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        triggerRef.current?.focus();
      }
    };
    const onReflow = () => close();
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled])')
      ?.focus();
  }, [open]);

  const onPanelKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(
        '[role^="menuitem"]:not([disabled])',
      ) ?? [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const delta = event.key === "ArrowDown" ? 1 : -1;
    items[(index + delta + items.length) % items.length]?.focus();
  };

  const panelStyle: React.CSSProperties | undefined =
    compact || !anchor
      ? undefined
      : {
          bottom: `${Math.max(8, (typeof window === "undefined" ? 0 : window.innerHeight) - anchor.top + 8)}px`,
          left: `${Math.max(8, Math.min(anchor.left, (typeof window === "undefined" ? 360 : window.innerWidth) - 296))}px`,
        };

  return (
    <div className="aui-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className="aui-composer-tool"
        data-active={open ? "true" : undefined}
        onClick={toggle}
        ref={triggerRef}
        type="button"
      >
        {icon ? (
          <span className="aui-composer-tool-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="aui-composer-tool-label">{label}</span>
        <IconChevronDown size={13} />
      </button>
      {open ? (
        <>
          <div
            className="aui-menu-backdrop"
            data-compact={compact ? "true" : undefined}
            onClick={close}
          />
          <div
            aria-label={ariaLabel}
            className="aui-menu-panel"
            data-compact={compact ? "true" : undefined}
            onKeyDown={onPanelKeyDown}
            ref={panelRef}
            role="menu"
            style={panelStyle}
          >
            <header className="aui-menu-panel-header">
              <strong>{ariaLabel}</strong>
              <button
                aria-label="Close menu"
                className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                onClick={close}
                type="button"
              >
                <IconClose size={14} />
              </button>
            </header>
            <div className="aui-menu-panel-body">{children(close)}</div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuSection({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div aria-label={label} className="aui-menu-section" role="group">
      <span className="aui-menu-section-label">{label}</span>
      {children}
    </div>
  );
}

function MenuOption({
  description,
  icon,
  label,
  onSelect,
  selected,
}: {
  description?: string;
  icon?: React.ReactNode;
  label: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      aria-checked={selected}
      className="aui-menu-item"
      data-selected={selected ? "true" : undefined}
      onClick={onSelect}
      role="menuitemradio"
      type="button"
    >
      {icon ? (
        <span className="aui-menu-item-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="aui-menu-item-body">
        <span className="aui-menu-item-label">{label}</span>
        {description ? (
          <span className="aui-menu-item-desc">{description}</span>
        ) : null}
      </span>
      <span className="aui-menu-item-check" aria-hidden="true">
        {selected ? <IconCheck size={14} /> : null}
      </span>
    </button>
  );
}

function effortOptionLabel(effort: string): string {
  switch (effort) {
    case "minimal":
      return "Minimal";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "xhigh":
      return "Very high";
    default:
      return effort.charAt(0).toUpperCase() + effort.slice(1);
  }
}

function composerModelLabel(
  selectedModel: { id: string; name?: string } | undefined,
  modelId: string | undefined,
): string {
  if (!modelId && !selectedModel) return "Default model";
  return selectedModel?.name ?? selectedModel?.id ?? modelId ?? "Model";
}

function composerEffortLabel(
  effort: string | undefined,
  hasEfforts: boolean,
): string {
  if (effort) return effortOptionLabel(effort);
  return hasEfforts ? "Auto effort" : "Default effort";
}

/**
 * Mode / model / effort selectors that live directly inside the composer
 * toolbar. Working directory is intentionally absent here — cwd is a
 * thread-start setting and is shown read-only in the thread header for an
 * existing thread.
 */
function ComposerRunSettings() {
  const compact = useCompactLayout();
  const { state } = useAgentContext();
  const { models, refreshModels } = useAgentModels();
  const {
    executionModes,
    runSettings,
    selectedModel,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  } = useAgentRunSettings();
  const didRefresh = useRef(false);

  useEffect(() => {
    if (
      !didRefresh.current &&
      state.connection.status === "connected" &&
      models.length === 0
    ) {
      didRefresh.current = true;
      void refreshModels().catch(() => undefined);
    }
  }, [models.length, refreshModels, state.connection.status]);

  const currentMode =
    executionModes.find((mode) => mode.id === runSettings.executionMode) ??
    executionModes[0];
  const hasEfforts = supportedEfforts.length > 0;

  return (
    <div className="aui-composer-settings">
      <AuiMenu
        ariaLabel="Execution mode"
        compact={compact}
        icon={<IconShield size={14} />}
        label={currentMode?.label ?? "Mode"}
      >
        {(close) =>
          executionModes.map((mode) => (
            <MenuOption
              description={mode.description}
              icon={<IconShield size={14} />}
              key={mode.id}
              label={mode.label}
              onSelect={() => {
                setExecutionMode(mode.id);
                close();
              }}
              selected={currentMode?.id === mode.id}
            />
          ))
        }
      </AuiMenu>
      <AuiMenu
        ariaLabel="Model and effort"
        compact={compact}
        icon={<IconCpu size={14} />}
        label={`${composerModelLabel(selectedModel, runSettings.modelId)} · ${composerEffortLabel(
          runSettings.effort,
          hasEfforts,
        )}`}
      >
        {(close) => (
          <>
            <MenuSection label="Model">
              <MenuOption
                icon={<IconCpu size={14} />}
                label="Server default"
                onSelect={() => {
                  setModelId("");
                  close();
                }}
                selected={!runSettings.modelId}
              />
              {models.map((model) => (
                <MenuOption
                  icon={<IconCpu size={14} />}
                  key={model.id}
                  label={formatModelOption(model)}
                  onSelect={() => {
                    setModelId(model.id);
                    close();
                  }}
                  selected={runSettings.modelId === model.id}
                />
              ))}
            </MenuSection>
            <MenuSection label="Effort">
              {hasEfforts ? (
                <>
                  <MenuOption
                    icon={<IconGauge size={14} />}
                    label={selectedModel ? "Model default" : "Server default"}
                    onSelect={() => {
                      setEffort("");
                      close();
                    }}
                    selected={!runSettings.effort}
                  />
                  {supportedEfforts.map((effort) => (
                    <MenuOption
                      icon={<IconGauge size={14} />}
                      key={effort}
                      label={effortOptionLabel(effort)}
                      onSelect={() => {
                        setEffort(effort);
                        close();
                      }}
                      selected={runSettings.effort === effort}
                    />
                  ))}
                </>
              ) : (
                <p className="aui-menu-empty">
                  This model exposes no selectable effort.
                </p>
              )}
            </MenuSection>
          </>
        )}
      </AuiMenu>
    </div>
  );
}

export function AgentComposer({
  disabled = false,
  disabledReason,
  onRequestAppMention,
  onRequestPluginMention,
  placeholder = "Ask Codex to work in this thread",
  resolveLocalAttachment,
  threadId,
}: AgentComposerProps) {
  const composer = useAgentComposer(threadId);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | undefined>();
  const [isFocused, setFocused] = useState(false);
  const [isDragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((current) => [...current, attachment]);
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }, []);
  const addLocalFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!resolveLocalAttachment) return;
      const list = Array.from(files);
      if (list.length === 0) return;
      let rejected = 0;
      for (const file of list) {
        const kind: AgentLocalAttachmentKind = file.type.startsWith("image/")
          ? "image"
          : "file";
        let input: CodexUserInput | null | undefined;
        try {
          input = await resolveLocalAttachment(file, kind);
        } catch (error) {
          console.warn("AgentComposer attachment resolver failed", error);
          input = null;
        }
        if (!input) {
          rejected += 1;
          continue;
        }
        addAttachment({
          id: `${kind}:${file.name}:${file.size}:${Date.now()}:${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          input,
          kind,
          label: file.name || kind,
          value: file.name,
        });
      }
      setAttachmentError(
        rejected > 0
          ? `${rejected} file${rejected === 1 ? "" : "s"} could not be attached for this Codex thread.`
          : undefined,
      );
    },
    [addAttachment, resolveLocalAttachment],
  );

  // Auto-resize textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [composer.value]);

  const submit = () => {
    if (disabled) return;
    if (!composer.value.trim() && attachments.length === 0) return;
    deferAction(() => composer.submit(attachments.map(composerAttachmentInput)));
    setAttachments([]);
  };

  const isComposing = useRef(false);
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing.current) {
      event.preventDefault();
      submit();
    }
  };

  const canSubmit = !disabled && (composer.value.trim().length > 0 || attachments.length > 0);

  const handleMention = useCallback(
    async (kind: "app" | "plugin") => {
      const resolver = kind === "app" ? onRequestAppMention : onRequestPluginMention;
      if (!resolver) return;
      let result: AgentComposerMentionAttachment | null | undefined;
      try {
        result = await Promise.resolve(resolver());
      } catch (error) {
        console.warn(`AgentComposer ${kind} mention resolver failed`, error);
        return;
      }
      if (!result) return;
      const label = result.label?.trim();
      const value = result.value?.trim();
      if (!label && !value) return;
      const finalLabel = label || value || kind;
      const finalValue = value || label || kind;
      addAttachment({
        id: result.id ?? `${kind}:${finalValue}:${Date.now()}`,
        input: result.input,
        kind,
        label: finalLabel,
        value: finalValue,
      });
    },
    [addAttachment, onRequestAppMention, onRequestPluginMention],
  );

  return (
    <form
      aria-label="Composer attachments"
      className="aui-composer"
      data-disabled={disabled ? "true" : undefined}
      data-focused={isFocused ? "true" : undefined}
      data-drag={isDragOver ? "true" : undefined}
      onDragEnter={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current += 1;
        if (dragCounter.current === 1) setDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          dragCounter.current = 0;
          setDragOver(false);
        }
      }}
      onDragOver={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (!resolveLocalAttachment || disabled) return;
        event.preventDefault();
        dragCounter.current = 0;
        setDragOver(false);
        const files = event.dataTransfer.files;
        if (files && files.length > 0) void addLocalFiles(files);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {disabled && disabledReason ? (
        <div className="aui-composer-notice" role="status">
          <IconShield size={14} />
          <span>{disabledReason}</span>
        </div>
      ) : null}
      {attachmentError ? (
        <div className="aui-composer-notice" data-tone="error" role="alert">
          <IconAlert size={14} />
          <span>{attachmentError}</span>
        </div>
      ) : null}
      {attachments.length > 0 ? (
        <ul className="aui-composer-chips" aria-label="Pending attachments">
          {attachments.map((attachment) => (
            <li className="aui-composer-chip" data-kind={attachment.kind} key={attachment.id}>
              <span className="aui-composer-chip-icon" aria-hidden="true">
                {attachment.kind === "image" ? <IconImage size={14} /> : null}
                {attachment.kind === "file" ? <IconPaperclip size={14} /> : null}
                {attachment.kind === "app" ? <IconApp size={14} /> : null}
                {attachment.kind === "plugin" ? <IconPlugin size={14} /> : null}
              </span>
              <span className="aui-composer-chip-label">{attachment.label}</span>
              <button
                aria-label={`Remove ${attachment.label}`}
                className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
                onClick={() => removeAttachment(attachment.id)}
                type="button"
              >
                <IconClose size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        aria-label="Message"
        className="aui-composer-input"
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onChange={(event) => composer.setValue(event.currentTarget.value)}
        onCompositionEnd={() => {
          isComposing.current = false;
        }}
        onCompositionStart={() => {
          isComposing.current = true;
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        onPaste={(event) => {
          if (disabled) return;
          if (!resolveLocalAttachment || event.clipboardData.files.length === 0) return;
          event.preventDefault();
          void addLocalFiles(event.clipboardData.files);
        }}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={composer.value}
      />
      <div className="aui-composer-toolbar">
        <div className="aui-composer-toolbar-start">
          <div className="aui-composer-toolbar-attach">
          {resolveLocalAttachment ? (
            <>
              <button
                aria-label="Attach file"
                className={buttonClass("ghost", { iconOnly: true })}
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                type="button"
              >
                <IconPaperclip size={16} />
              </button>
              <input
                accept="*"
                hidden
                onChange={(event) => {
                  const files = event.currentTarget.files;
                  if (files) void addLocalFiles(files);
                  event.currentTarget.value = "";
                }}
                ref={fileInputRef}
                type="file"
              />
              <button
                aria-label="Attach image"
                className={buttonClass("ghost", { iconOnly: true })}
                disabled={disabled}
                onClick={() => imageInputRef.current?.click()}
                title="Attach image"
                type="button"
              >
                <IconImage size={16} />
              </button>
              <input
                accept="image/*"
                hidden
                onChange={(event) => {
                  const files = event.currentTarget.files;
                  if (files) void addLocalFiles(files);
                  event.currentTarget.value = "";
                }}
                ref={imageInputRef}
                type="file"
              />
            </>
          ) : null}
          {onRequestAppMention ? (
            <button
              aria-label="App"
              className={buttonClass("ghost", { size: "sm" })}
              disabled={disabled}
              onClick={() => void handleMention("app")}
              title="Mention an app"
              type="button"
            >
              <IconApp size={14} />
              <span>App</span>
            </button>
          ) : null}
          {onRequestPluginMention ? (
            <button
              aria-label="Plugin"
              className={buttonClass("ghost", { size: "sm" })}
              disabled={disabled}
              onClick={() => void handleMention("plugin")}
              title="Mention a plugin"
              type="button"
            >
              <IconPlugin size={14} />
              <span>Plugin</span>
            </button>
          ) : null}
          </div>
          <ComposerRunSettings />
        </div>
        <div className="aui-composer-toolbar-end">
          <span className="aui-composer-hint" aria-hidden="true">
            <kbd>Enter</kbd> to send
          </span>
          <button
            aria-label="Send"
            className={buttonClass("primary", { iconOnly: true, size: "lg" })}
            disabled={!canSubmit}
            title="Send message"
            type="submit"
          >
            <IconSend size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}

type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";

export type AgentLocalAttachmentKind = Extract<ComposerAttachmentKind, "image" | "file">;

export type AgentLocalAttachmentResolver = (
  file: File,
  kind: AgentLocalAttachmentKind,
) => CodexUserInput | null | undefined | Promise<CodexUserInput | null | undefined>;

export type AgentMentionAttachmentKind = Extract<ComposerAttachmentKind, "app" | "plugin">;

export interface AgentComposerMentionAttachment {
  id?: string;
  input?: CodexUserInput;
  label: string;
  value: string;
}

export type AgentComposerMentionResolver = () =>
  | AgentComposerMentionAttachment
  | null
  | undefined
  | Promise<AgentComposerMentionAttachment | null | undefined>;

export interface AgentComposerProps {
  disabled?: boolean;
  disabledReason?: string;
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  placeholder?: string;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  threadId?: string;
}

interface ComposerAttachment {
  id: string;
  input?: CodexUserInput;
  kind: ComposerAttachmentKind;
  label: string;
  value: string;
}

function composerAttachmentInput(attachment: ComposerAttachment): CodexUserInput {
  if (attachment.input) return attachment.input;
  return mentionInput(attachment.label, attachment.value);
}

export interface AgentComposerPanelProps {
  onRequestAppMention?: AgentComposerMentionResolver;
  onRequestPluginMention?: AgentComposerMentionResolver;
  resolveLocalAttachment?: AgentLocalAttachmentResolver;
  thread: ThreadState;
  threadId?: string;
}

export function AgentComposerPanel({
  onRequestAppMention,
  onRequestPluginMention,
  resolveLocalAttachment,
  thread,
  threadId,
}: AgentComposerPanelProps) {
  const isRunning = thread.status === "running";
  const isPreviewOnly = isPreviewOnlyThread(thread);
  const isBlocked = isRunning || thread.status === "waitingForInput" || isPreviewOnly;
  return (
    <section className="aui-compose-panel" aria-label="Message composer">
      <AgentComposer
        disabled={isBlocked}
        disabledReason={composerDisabledReason(thread.status, isPreviewOnly)}
        onRequestAppMention={onRequestAppMention}
        onRequestPluginMention={onRequestPluginMention}
        placeholder={composerPlaceholder(thread.status, isPreviewOnly)}
        resolveLocalAttachment={resolveLocalAttachment}
        threadId={threadId}
      />
    </section>
  );
}

function composerDisabledReason(
  status: ThreadState["status"],
  isPreviewOnly: boolean,
): string | undefined {
  if (isPreviewOnly) return "Resume this stored thread before sending a new message.";
  if (status === "running") return "Codex is working — send is available after the turn.";
  if (status === "waitingForInput") {
    return "Resolve the pending approval before sending another message.";
  }
  return undefined;
}

function isPreviewOnlyThread(thread: ThreadState): boolean {
  return (
    thread.status === "notLoaded" ||
    (thread.status === "loaded" && thread.orderedTurnIds.length > 0)
  );
}

function composerPlaceholder(status: ThreadState["status"], isPreviewOnly = false): string {
  if (isPreviewOnly) return "Stored thread";
  if (status === "running") return "Codex is working";
  if (status === "waitingForInput") return "Waiting on approval";
  return "Ask Codex to work in this thread";
}

/**
 * Pending decision surface rendered as a transcript item by the default thread
 * view. One approval is expanded at a time; any remaining requests collapse
 * into a compact picker so the surface never grows into a large independent
 * scroll pane and the decision actions always stay reachable.
 */
export interface AgentWorkspaceProps extends AgentChatProps {
  panel?: React.ReactNode;
  panelClassName?: string;
}

export function AgentWorkspace({ panel, panelClassName, ...chatProps }: AgentWorkspaceProps) {
  return (
    <section className="aui-workspace">
      <AgentChat {...chatProps} sidebar={chatProps.sidebar ?? true} />
      {panel ? (
        <aside className={["aui-extension-panel", panelClassName].filter(Boolean).join(" ")}>
          {panel}
        </aside>
      ) : null}
    </section>
  );
}

