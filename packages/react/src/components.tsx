import type {
  AgentItemState,
  AgentThread,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import {
  useAgentApprovals,
  useAgentAuth,
  useAgentBootstrap,
  useAgentComposer,
  useAgentModels,
  useAgentThreadHistory,
  useAgentThreadActions,
  useAgentThreadReader,
  useAgentRunSettings,
  useAgentTurn,
  useAgentThread,
  useAgentThreads,
  useAgentUsage,
  useAgentSkills,
  useAgentApps,
} from "./hooks";
import { AgentDiffViewer } from "./diff-viewer";
import {
  mentionInput,
  type CodexUserInput,
} from "./codex-request-params";
import {
  IconAdd,
  IconAlert,
  IconApp,
  IconBlock,
  IconCheck,
  IconChevronDown,
  IconClose,
  IconCpu,
  IconFolder,
  IconGauge,
  IconHistory,
  IconImage,
  IconMoreVertical,
  IconPaperclip,
  IconPlugin,
  IconRefresh,
  IconSearch,
  IconSend,
  IconShield,
  IconSpark,
  IconStop,
  buttonClass,
} from "./components-internal";
import { useAgentContext } from "./provider";
import { rawThreadId } from "./thread-history";
import { AgentMessageList } from "./timeline";
import { normalizeUsageWindows } from "./usage";
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

function compactPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 2) return path;
  return `.../${parts.slice(-2).join("/")}`;
}

function useCompactLayout(): boolean {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(max-width: 640px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isCompact;
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
export function AgentApprovalQueue({
  renderApproval,
  threadId,
}: {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  threadId?: string;
}) {
  const { approvals, approve } = useAgentApprovals(threadId);
  const [expandedId, setExpandedId] = useState<string | undefined>();
  if (approvals.length === 0) return null;
  if (renderApproval) {
    return (
      <section className="aui-approvals" aria-label="Pending approvals">
        {approvals.map((approval) => (
          <div key={String(approval.id)}>{renderApproval(approval)}</div>
        ))}
      </section>
    );
  }
  const expanded =
    approvals.find((approval) => String(approval.id) === expandedId) ?? approvals[0]!;
  const others = approvals.filter((approval) => approval.id !== expanded.id);
  return (
    <section
      className="aui-approvals"
      aria-label="Pending approvals"
      data-count={approvals.length}
    >
      {approvals.length > 1 ? (
        <p className="aui-approvals-count" role="status">
          {approvals.length} decisions need your review
        </p>
      ) : null}
      <ApprovalCard
        approval={expanded}
        onApprove={() =>
          deferAction(() => void approve(expanded.id, approvalResult(expanded)))
        }
        onApproveForSession={() =>
          deferAction(() =>
            void approve(expanded.id, approvalSessionResult(expanded)),
          )
        }
        onReject={() =>
          deferAction(() =>
            void approve(expanded.id, declineApprovalResult(expanded)),
          )
        }
      />
      {others.length > 0 ? (
        <ul className="aui-approval-more" aria-label="Other pending approvals">
          {others.map((approval) => {
            const payload = isRecord(approval.payload) ? approval.payload : {};
            const risk = approvalRisk(approval.kind, payload);
            return (
              <li key={String(approval.id)}>
                <button
                  aria-label={`Review ${approvalRequestLabel(approval.kind)} ${String(
                    approval.id,
                  )}`}
                  className="aui-approval-compact"
                  data-risk={risk}
                  onClick={() => setExpandedId(String(approval.id))}
                  type="button"
                >
                  <span className="aui-approval-compact-icon" aria-hidden="true">
                    <IconShield size={14} />
                  </span>
                  <span className="aui-approval-compact-body">
                    <strong>{approvalTitle(approval.kind)}</strong>
                    <small>{approvalSubtitle(approval.kind, payload)}</small>
                  </span>
                  <span className="aui-approval-risk" data-risk={risk}>
                    {riskLabel(risk)}
                  </span>
                  <span className="aui-approval-compact-cta" aria-hidden="true">
                    Review
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

export const AgentApprovalPrompt = AgentApprovalQueue;

function ApprovalCard({
  approval,
  onApprove,
  onApproveForSession,
  onReject,
}: {
  approval: PendingServerRequest;
  onApprove: () => void;
  onApproveForSession: () => void;
  onReject: () => void;
}) {
  const payload = isRecord(approval.payload) ? approval.payload : {};
  const requestLabel = approvalRequestLabel(approval.kind);
  const risk = approvalRisk(approval.kind, payload);
  return (
    <article
      aria-labelledby={`aui-approval-title-${String(approval.id)}`}
      className="aui-approval"
      data-kind={approval.kind}
      data-risk={risk}
    >
      <header className="aui-approval-header">
        <span className="aui-approval-icon" aria-hidden="true" data-risk={risk}>
          <IconShield size={18} />
        </span>
        <div className="aui-approval-title">
          <strong id={`aui-approval-title-${String(approval.id)}`}>
            {approvalTitle(approval.kind)}
          </strong>
          <small>{approvalSubtitle(approval.kind, payload)}</small>
        </div>
        <span className="aui-approval-risk" data-risk={risk}>
          {riskLabel(risk)} risk
        </span>
      </header>
      <ApprovalSummary approval={approval} payload={payload} />
      <footer className="aui-approval-actions">
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)}`}
          className={buttonClass("primary", { size: "md" })}
          onClick={onApprove}
          type="button"
        >
          <IconCheck size={14} />
          <span>Approve</span>
        </button>
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)} for session`}
          className={buttonClass("secondary", { size: "md" })}
          onClick={onApproveForSession}
          type="button"
        >
          Approve for session
        </button>
        <button
          aria-label={`Decline ${requestLabel} ${String(approval.id)}`}
          className={buttonClass("danger", { size: "md" })}
          onClick={onReject}
          type="button"
        >
          <IconBlock size={14} />
          <span>Decline</span>
        </button>
      </footer>
    </article>
  );
}

type ApprovalRisk = "high" | "medium" | "low";

function approvalRisk(kind: string, payload: Record<string, unknown>): ApprovalRisk {
  if (kind === "fileChangeApproval" || kind === "legacyPatchApproval") return "medium";
  if (kind === "commandApproval" || kind === "legacyExecApproval") {
    const sandbox =
      typeof payload.sandbox === "string" ? payload.sandbox : payload.sandboxPolicy;
    if (typeof sandbox === "string" && /none|disable|no-sandbox/i.test(sandbox)) {
      return "high";
    }
    const command = typeof payload.command === "string" ? payload.command : "";
    if (/\brm\b\s+-rf|sudo|curl\s.*sh|chmod\s+777/i.test(command)) return "high";
    return "medium";
  }
  if (kind === "dynamicTool" || kind === "permissionsApproval") return "medium";
  if (kind === "userInput" || kind === "mcpElicitation") return "low";
  return "low";
}

function riskLabel(risk: ApprovalRisk): string {
  switch (risk) {
    case "high":
      return "High";
    case "medium":
      return "Med";
    default:
      return "Low";
  }
}

function approvalSubtitle(kind: string, payload: Record<string, unknown>): string {
  const reason = stringField(payload, "reason");
  if (reason) return reason;
  switch (kind) {
    case "fileChangeApproval":
    case "legacyPatchApproval":
      return "Codex wants to apply file changes to your workspace.";
    case "commandApproval":
    case "legacyExecApproval":
      return "Codex wants to run a shell command in your workspace.";
    case "dynamicTool":
      return "Codex wants to call a host-registered dynamic tool.";
    case "permissionsApproval":
      return "Codex wants to use an additional permission.";
    case "userInput":
      return "Codex needs a free-form answer to continue.";
    case "mcpElicitation":
      return "An MCP server needs additional input to continue.";
    case "authRefresh":
      return "Codex wants to refresh its credentials.";
    case "attestation":
      return "Codex wants to generate a runtime attestation.";
    default:
      return `Codex is requesting a ${kind} decision.`;
  }
}

function ApprovalSummary({
  approval,
  payload,
}: {
  approval: PendingServerRequest;
  payload: Record<string, unknown>;
}) {
  if (approval.kind === "fileChangeApproval") {
    return <FileChangeApprovalSummary payload={payload} />;
  }
  if (approval.kind === "commandApproval" || approval.kind === "legacyExecApproval") {
    return <CommandApprovalSummary payload={payload} />;
  }
  if (approval.kind === "userInput" || approval.kind === "mcpElicitation") {
    return <UserInputApprovalSummary payload={payload} />;
  }
  if (approval.kind === "dynamicTool") {
    return <DynamicToolApprovalSummary payload={payload} />;
  }
  if (approval.kind === "permissionsApproval") {
    return <PermissionsApprovalSummary payload={payload} />;
  }
  return <GenericApprovalSummary kind={approval.kind} payload={payload} />;
}

function approvalTitle(kind: string): string {
  switch (kind) {
    case "fileChangeApproval":
    case "legacyPatchApproval":
      return "Review file changes";
    case "commandApproval":
    case "legacyExecApproval":
      return "Approve command";
    case "userInput":
      return "User input requested";
    case "mcpElicitation":
      return "MCP input requested";
    case "dynamicTool":
      return "Approve dynamic tool";
    case "permissionsApproval":
      return "Approve permissions";
    case "authRefresh":
      return "Refresh authentication";
    case "attestation":
      return "Generate attestation";
    default:
      return "Review request";
  }
}

function approvalRequestLabel(kind: string): string {
  if (kind === "commandApproval") return "command request";
  if (kind === "fileChangeApproval") return "file-change request";
  return `${kind.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()} request`;
}

function CommandApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const command =
    stringField(payload, "command") ?? stringField(payload, "cmd") ?? "Command";
  const cwd = stringField(payload, "cwd") ?? stringField(payload, "workingDirectory");
  const policy = stringField(payload, "approvalPolicy");
  const sandbox =
    stringField(payload, "sandbox") ?? stringField(payload, "sandboxPolicy");
  return (
    <div className="aui-approval-summary">
      <pre className="aui-command-line">
        <code>$ {command}</code>
      </pre>
      <MetadataGrid
        rows={[
          ["Working directory", cwd],
          ["Sandbox", sandbox],
          ["Approval policy", policy],
        ]}
      />
    </div>
  );
}

function FileChangeApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const path = stringField(payload, "path");
  const summary = stringField(payload, "summary") ?? stringField(payload, "description");
  const patch = payload.patch ?? payload.diff ?? payload.fileChanges;
  return (
    <div className="aui-approval-summary">
      {path ? (
        <div className="aui-approval-filepath">
          <IconPaperclip size={12} />
          <code>{path}</code>
        </div>
      ) : null}
      {summary ? <p className="aui-approval-copy">{summary}</p> : null}
      {patch ? <AgentDiffViewer patch={patch} /> : null}
      {!path && !summary && !patch ? (
        <p className="aui-approval-copy">
          Review the file-change request before deciding.
        </p>
      ) : null}
    </div>
  );
}

function UserInputApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const prompt =
    stringField(payload, "prompt") ??
    stringField(payload, "question") ??
    stringField(payload, "message") ??
    "The agent is asking for user input.";
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">{prompt}</p>
      <MetadataGrid rows={[["Item", stringField(payload, "itemId")]]} />
    </div>
  );
}

function DynamicToolApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  const namespace = stringField(payload, "namespace");
  const tool = stringField(payload, "tool") ?? stringField(payload, "name") ?? "tool";
  return (
    <div className="aui-approval-summary">
      <MetadataGrid
        rows={[
          ["Namespace", namespace],
          ["Tool", tool],
          ["Item", stringField(payload, "itemId")],
        ]}
      />
      {payload.arguments ? (
        <pre className="aui-approval-json">
          {JSON.stringify(payload.arguments, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function PermissionsApprovalSummary({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">
        Review the requested permission before allowing the agent to continue.
      </p>
      <pre className="aui-approval-json">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

function GenericApprovalSummary({
  kind,
  payload,
}: {
  kind: string;
  payload: Record<string, unknown>;
}) {
  return (
    <div className="aui-approval-summary">
      <p className="aui-approval-copy">Review {kind} before deciding.</p>
      <pre className="aui-approval-json">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}

function MetadataGrid({ rows }: { rows: Array<[string, string | undefined]> }) {
  const visibleRows = rows.filter(([, value]) => value);
  if (visibleRows.length === 0) return null;
  return (
    <dl className="aui-metadata-grid">
      {visibleRows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function AgentStatusBar({
  onOpenThreads,
}: {
  onOpenThreads?: () => void;
} = {}) {
  const { state } = useAgentContext();
  const { account, cancelLogin, login } = useAgentAuth();
  const accountLabel = accountLabelText(account.account);
  const statusText =
    account.status === "unknown"
      ? state.connection.status === "connected"
        ? "checking account"
        : "connecting"
      : account.status;
  return (
    <header className="aui-status">
      {onOpenThreads ? (
        <button
          aria-label="Open thread history"
          className="aui-threads-trigger"
          onClick={onOpenThreads}
          title="Threads"
          type="button"
        >
          <IconHistory size={16} />
          <span>Threads</span>
        </button>
      ) : null}
      <div className="aui-brand">
        <strong>Agent UI</strong>
        <span>{accountLabel ? `${statusText} · ${accountLabel}` : statusText}</span>
      </div>
      {account.login ? (
        <div className="aui-login-code" role="status">
          {account.login.verificationUrl ? (
            <a href={account.login.verificationUrl} rel="noreferrer" target="_blank">
              Open device login
            </a>
          ) : null}
          {account.login.userCode ? <code>{account.login.userCode}</code> : null}
          {account.login.loginId ? (
            <button
              className={buttonClass("secondary", { size: "sm" })}
              onClick={() => void cancelLogin()}
              type="button"
            >
              Cancel login
            </button>
          ) : null}
        </div>
      ) : null}
      {account.status === "unknown" ? (
        <button
          className={buttonClass("secondary", { size: "sm" })}
          disabled
          type="button"
        >
          {state.connection.status === "connected" ? "Checking" : "Connecting"}
        </button>
      ) : null}
      {account.status === "unauthenticated" ? (
        <button
          className={buttonClass("primary", { size: "sm" })}
          onClick={() => void login()}
          type="button"
        >
          Login
        </button>
      ) : null}
    </header>
  );
}

function accountLabelText(
  account: Record<string, unknown> | undefined,
): string | undefined {
  if (!account) return undefined;
  const email = typeof account.email === "string" ? account.email : undefined;
  const planType = typeof account.planType === "string" ? account.planType : undefined;
  if (email && planType) return `${email} (${planType})`;
  return email ?? planType;
}

export function AgentDiagnosticsPanel({
  bootstrap,
}: {
  bootstrap: ReturnType<typeof useAgentBootstrap>;
}) {
  const { state } = useAgentContext();
  const messages = [
    ...bootstrap.errors.map((error) => error.message),
    ...state.errors.map((error) => error.message),
    ...state.configWarnings.map((warning) => warning.message),
  ].filter((message) => message && !isSuppressedDiagnostic(message));
  if (bootstrap.isBootstrapping && messages.length === 0) {
    return (
      <section className="aui-diagnostics" aria-label="Diagnostics">
        <span>Syncing account, models, and usage.</span>
      </section>
    );
  }
  if (messages.length === 0) return null;
  const title = diagnosticsTitle(messages);
  return (
    <details className="aui-diagnostics aui-diagnostics-details" aria-label="Diagnostics">
      <summary>
        <span>{title}</span>
        <small>
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </small>
      </summary>
      <div>
        {messages.slice(-8).map((message, index) => (
          <span key={`${message}-${index}`}>{message}</span>
        ))}
      </div>
    </details>
  );
}

export const AgentDiagnostics = AgentDiagnosticsPanel;

type AgentStatusSeverity = "info" | "warning" | "critical";

interface AgentStatusNotice {
  id: string;
  kind: string;
  message: string;
  severity: AgentStatusSeverity;
  title: string;
}

export function AgentStatusSummary() {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners);
  if (notices.length === 0) return null;
  const criticalCount = notices.filter((notice) => notice.severity === "critical").length;
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  return (
    <section className="aui-status-summary" aria-label="Status summary">
      <strong>Status</strong>
      <span>{statusSummary(notices.length, warningCount, criticalCount)}</span>
    </section>
  );
}

export function AgentStatusDetails({ includeCritical = false }: { includeCritical?: boolean }) {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners)
    .filter((notice) => includeCritical || notice.severity !== "critical")
    .slice(-6);
  if (notices.length === 0) return null;
  return (
    <section className="aui-status-banners" aria-label="Status details">
      <details>
        <summary>
          <strong>Details</strong>
          <span>{statusDetailsSummary(notices)}</span>
        </summary>
        <div className="aui-status-banner-list">
          {notices.map((notice) => (
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
    </section>
  );
}

export const AgentStatusDrawer = AgentStatusDetails;
export const AgentStatusBanners = AgentStatusDetails;

export function AgentCriticalNoticeList() {
  const { state } = useAgentContext();
  const notices = normalizedStatusNotices(state.diagnostics.banners).filter(
    (notice) => notice.severity === "critical",
  );
  if (notices.length === 0) return null;
  return (
    <section className="aui-critical-banners" aria-label="Critical status">
      {notices.slice(-2).map((notice) => (
        <article
          className="aui-critical-banner"
          data-kind={notice.kind}
          data-severity={notice.severity}
          key={notice.id}
        >
          <strong>{notice.title}</strong>
          <span>{notice.message}</span>
        </article>
      ))}
    </section>
  );
}

function normalizedStatusNotices(
  banners: Array<{ id: string; kind: string; message: string }>,
): AgentStatusNotice[] {
  return banners.map((banner) => ({
    id: banner.id,
    kind: banner.kind,
    message: banner.message,
    severity: statusSeverity(banner.kind, banner.message),
    title: statusBannerTitle(banner.kind),
  }));
}

function statusSeverity(kind: string, message: string): AgentStatusSeverity {
  if (kind === "rateLimit") return rateLimitSeverity(message);
  if (kind === "configWarning" || kind === "deprecationNotice") return "warning";
  if (/failed|blocked|danger|requires action|needs action/i.test(message)) {
    return "critical";
  }
  return "info";
}

function rateLimitSeverity(message: string): AgentStatusSeverity {
  if (/below (the )?warning threshold|normal|available|ready/i.test(message)) {
    return "info";
  }
  if (
    /exceeded|blocked|at (the )?limit|reached|0\s*remaining|100\s*%|99\s*%|98\s*%|97\s*%|96\s*%|95\s*%/i.test(
      message,
    )
  ) {
    return "critical";
  }
  if (/warning|near|approach|80\s*%|85\s*%|90\s*%|91\s*%|92\s*%|93\s*%|94\s*%/i.test(message)) {
    return "warning";
  }
  return "info";
}

function statusSummary(total: number, warningCount: number, criticalCount: number): string {
  if (criticalCount > 0) {
    return `${criticalCount} critical · ${warningCount} warning · ${total} total`;
  }
  if (warningCount > 0) {
    return `${warningCount} warning · ${total} total`;
  }
  return `${total} background ${total === 1 ? "notice" : "notices"}`;
}

function statusDetailsSummary(notices: AgentStatusNotice[]): string {
  const warningCount = notices.filter((notice) => notice.severity === "warning").length;
  if (warningCount > 0) return `${warningCount} warning · ${notices.length} notices`;
  return `${notices.length} background ${notices.length === 1 ? "notice" : "notices"}`;
}

export interface AgentUsageProps {
  autoRefresh?: boolean;
}

export function AgentUsagePanel({ autoRefresh = true }: AgentUsageProps = {}) {
  const { state } = useAgentContext();
  const { rateLimits, refreshUsage } = useAgentUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didAutoRefresh = useRef(false);
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
  const compactLayout = useCompactLayout();
  useEffect(() => {
    if (
      autoRefresh &&
      state.connection.status === "connected" &&
      !didAutoRefresh.current
    ) {
      didAutoRefresh.current = true;
      void refreshUsage().catch(() => undefined);
    }
  }, [autoRefresh, refreshUsage, state.connection.status]);
  const refreshButton = (
    <button
      aria-label="Refresh"
      className={buttonClass("ghost", { size: "sm" })}
      disabled={isRefreshing}
      onClick={() => {
        setIsRefreshing(true);
        void refreshUsage().finally(() => setIsRefreshing(false));
      }}
      title="Refresh usage"
      type="button"
    >
      <IconRefresh size={12} />
      <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
    </button>
  );
  const usageBody =
    windows.length > 0 ? (
      <div className="aui-usage-grid">
        {windows.map((window) => (
          <div className="aui-usage-window" key={window.id}>
            <div className="aui-usage-row">
              <span>{window.label}</span>
              <strong>{window.valueLabel}</strong>
            </div>
            <AgentRateLimitBar label={window.label} percent={window.percent} />
            {window.resetLabel ? <small>{window.resetLabel}</small> : null}
          </div>
        ))}
      </div>
    ) : (
      <p className="aui-usage-empty">Usage limits are available after account sync.</p>
    );
  if (compactLayout) {
    return (
      <section className="aui-usage aui-usage-compact" aria-label="Usage limits">
        <details>
          <summary>
            <strong>Usage</strong>
            <small>{usageSummary(windows)}</small>
          </summary>
          <div className="aui-usage-compact-body">
            <div className="aui-usage-header">{refreshButton}</div>
            {usageBody}
          </div>
        </details>
      </section>
    );
  }
  return (
    <section className="aui-usage" aria-label="Usage limits">
      <div className="aui-usage-header">
        <strong>Usage</strong>
        {refreshButton}
      </div>
      {usageBody}
    </section>
  );
}

export const AgentUsage = AgentUsagePanel;

export function AgentUsageSummary() {
  const { rateLimits } = useAgentUsage();
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
  return (
    <section className="aui-usage-summary" aria-label="Usage summary">
      <strong>Usage</strong>
      <span>{usageSummary(windows)}</span>
    </section>
  );
}

export function AgentRateLimitBar({
  label,
  percent,
}: {
  label: string;
  percent: number;
}) {
  return (
    <div
      aria-label={`${label} usage`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(percent)}
      className="aui-meter"
      role="progressbar"
    >
      <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

export function AgentTokenUsageBar({
  inputTokens = 0,
  outputTokens = 0,
  totalTokens = inputTokens + outputTokens,
}: {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}) {
  const inputPercent = totalTokens > 0 ? (inputTokens / totalTokens) * 100 : 0;
  const outputPercent = totalTokens > 0 ? (outputTokens / totalTokens) * 100 : 0;
  return (
    <div className="aui-token-usage" aria-label="Token usage">
      <div className="aui-usage-row">
        <span>Tokens</span>
        <strong>{totalTokens.toLocaleString()}</strong>
      </div>
      <div className="aui-meter aui-token-meter">
        <span data-kind="input" style={{ width: `${Math.max(0, inputPercent)}%` }} />
        <span data-kind="output" style={{ width: `${Math.max(0, outputPercent)}%` }} />
      </div>
      <small>
        {inputTokens.toLocaleString()} input · {outputTokens.toLocaleString()} output
      </small>
    </div>
  );
}

export function AgentSkillsPanel({ cwd }: { cwd?: string }) {
  const { refreshSkills, setSkillEnabled, skills } = useAgentSkills(cwd);
  return (
    <section className="aui-skills-panel" aria-label="Skills">
      <div className="aui-usage-header">
        <strong>Skills</strong>
        <button
          aria-label="Refresh"
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshSkills().catch(() => undefined)}
          title="Refresh skills"
          type="button"
        >
          <IconRefresh size={12} />
          <span>Refresh</span>
        </button>
      </div>
      {skills.length > 0 ? (
        <ul className="aui-plain-list">
          {skills.map((skill) => (
            <li key={`${skill.path ?? ""}:${skill.name}`}>
              <span>{skill.name}</span>
              <button
                className={buttonClass("subtle", { size: "sm" })}
                onClick={() =>
                  void setSkillEnabled({
                    enabled: skill.enabled === false,
                    ...(skill.path ? { path: skill.path } : { name: skill.name }),
                  }).catch(() => undefined)
                }
                type="button"
              >
                {skill.enabled === false ? "Enable" : "Disable"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">Skills are available after refresh.</p>
      )}
    </section>
  );
}

export function AgentAppsPanel({ threadId }: { threadId?: string }) {
  const { apps, loadMoreApps, nextCursor, refreshApps } = useAgentApps(threadId);
  return (
    <section className="aui-apps-panel" aria-label="Apps">
      <div className="aui-usage-header">
        <strong>Apps</strong>
        <button
          aria-label="Refresh"
          className={buttonClass("ghost", { size: "sm" })}
          onClick={() => void refreshApps().catch(() => undefined)}
          title="Refresh apps"
          type="button"
        >
          <IconRefresh size={12} />
          <span>Refresh</span>
        </button>
      </div>
      {apps.length > 0 ? (
        <ul className="aui-plain-list">
          {apps.map((app) => (
            <li key={app.id}>
              <span>{app.name ?? app.id}</span>
              {app.installed === false ? <small>not installed</small> : null}
              {app.needsAuth ? <small>auth needed</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="aui-usage-empty">Apps are available after refresh.</p>
      )}
      {nextCursor ? (
        <button
          className={buttonClass("subtle", { size: "sm" })}
          onClick={() => void loadMoreApps()?.catch(() => undefined)}
          type="button"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}

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

function usageSummary(windows: ReturnType<typeof normalizeUsageWindows>): string {
  if (windows.length === 0) return "sync pending";
  return windows
    .slice(0, 3)
    .map((window) => `${window.label} ${window.valueLabel}`)
    .join(" · ");
}

export function ThreadList({
  activeThreadId,
  footer,
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  footer?: React.ReactNode;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  return (
    <nav className="aui-thread-list" aria-label="Threads">
      {threads.map((thread) => {
        const meta = threadListMeta(thread);
        return (
          <button
            aria-current={thread.thread.id === activeThreadId ? "page" : undefined}
            className="aui-thread-list-item"
            data-status={thread.status}
            key={thread.thread.id}
            onClick={() => onSelectThread?.(thread.thread.id)}
            type="button"
          >
            <span className="aui-thread-list-name">
              {thread.thread.name ?? thread.thread.id}
            </span>
            <span className="aui-thread-list-meta">
              <span
                aria-hidden="true"
                className="aui-thread-list-dot"
                data-status={thread.status}
              />
              <small>{meta}</small>
            </span>
          </button>
        );
      })}
      {footer}
    </nav>
  );
}

function threadListMeta(thread: ThreadState): string {
  const parts = [
    formatThreadStatus(thread.status, { hasTurns: thread.orderedTurnIds.length > 0 }),
  ];
  const updated = rawThreadDate(thread.thread.raw, [
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "modified_at",
    "createdAt",
    "created_at",
  ]);
  if (updated) parts.push(updated);
  if (thread.thread.path && isUserFacingPath(thread.thread.path)) {
    parts.push(compactPath(thread.thread.path));
  }
  return parts.join(" · ");
}

function rawThreadDate(raw: unknown, keys: string[]): string | undefined {
  if (!isRecord(raw)) return undefined;
  for (const key of keys) {
    const value = raw[key];
    const date =
      typeof value === "number"
        ? new Date(value > 10_000_000_000 ? value : value * 1000)
        : typeof value === "string"
          ? new Date(value)
          : undefined;
    if (date && Number.isFinite(date.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    }
  }
  return undefined;
}

function formatThreadStatus(
  status: string,
  options: { hasTurns?: boolean } = {},
): string {
  switch (status) {
    case "notLoaded":
      return "Stored";
    case "loaded":
      return options.hasTurns ? "Preview" : "Ready";
    case "ready":
      return "Ready";
    case "running":
      return "Running";
    case "waitingForInput":
      return "Needs approval";
    case "complete":
    case "completed":
      return "Complete";
    case "error":
      return "Failed";
    default:
      return status
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}

function threadSubtitle(thread: AgentThread): string {
  if (thread.path && isUserFacingPath(thread.path)) return thread.path;
  if (thread.ephemeral) return "Ephemeral Codex session";
  return "Codex session";
}

function isUserFacingPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  if (normalized.endsWith(".jsonl")) return false;
  if (normalized.includes("/rollout-")) return false;
  return true;
}

export function ThreadSidebar({
  activeThreadId,
  collapsed = false,
  onCollapsedChange,
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  const compact = useCompactLayout();
  const { cursor, error, isLoading, listThreads } = useAgentThreadHistory();
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [visibleThreadIds, setVisibleThreadIds] = useState<string[] | undefined>();
  const didAutoLoad = useRef(false);
  const searchTouched = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleThreads = useMemo(() => {
    if (!visibleThreadIds) return threads;
    const byId = new Map(threads.map((thread) => [thread.thread.id, thread]));
    return visibleThreadIds.flatMap((threadId) => {
      const thread = byId.get(threadId);
      return thread ? [thread] : [];
    });
  }, [threads, visibleThreadIds]);
  const loadThreadPage = useCallback(
    async (
      params: {
        activateFirst?: boolean;
        append?: boolean;
        cursor?: string | null;
        searchTerm?: string;
      } = {},
    ) => {
      const response = await listThreads({
        cursor: params.cursor,
        limit: 25,
        searchTerm: params.searchTerm,
      });
      const rawThreads = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.threads)
          ? response.threads
          : [];
      const threadIds = rawThreads.flatMap((rawThread: Record<string, unknown>) => {
        const threadId = rawThreadId(rawThread);
        return threadId ? [threadId] : [];
      });
      setVisibleThreadIds((current) => {
        if (!params.append) return threadIds;
        return Array.from(new Set([...(current ?? []), ...threadIds]));
      });
      setNextCursor(responseCursor(response));
      setHasLoaded(true);
      const firstThreadId = threadIds[0];
      if (params.activateFirst && firstThreadId && !state.activeThreadId) {
        readThread(firstThreadId, { activate: true, includeTurns: true }).catch(() => {
          onSelectThread?.(firstThreadId);
        });
      }
      return response;
    },
    [listThreads, onSelectThread, readThread, state.activeThreadId],
  );
  const loadNextThreadPage = useCallback(() => {
    const pageCursor = nextCursor ?? cursor ?? null;
    if (!pageCursor || isLoading) return;
    void loadThreadPage({
      append: true,
      cursor: pageCursor,
      searchTerm,
    }).catch(() => undefined);
  }, [cursor, isLoading, loadThreadPage, nextCursor, searchTerm]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !(nextCursor ?? cursor)) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNextThreadPage();
      },
      { root: sentinel.closest(".aui-thread-list"), rootMargin: "160px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadNextThreadPage, nextCursor]);
  useEffect(() => {
    if (
      state.connection.status === "connected" &&
      threads.length === 0 &&
      !isLoading &&
      !didAutoLoad.current
    ) {
      didAutoLoad.current = true;
      void loadThreadPage({ activateFirst: true }).catch(() => {
        setHasLoaded(true);
      });
    }
  }, [isLoading, loadThreadPage, state.connection.status, threads.length]);
  // Debounced search: typing auto-filters history without a separate Load
  // button. The leading render and the initial auto-load are skipped so the
  // first page is fetched exactly once.
  useEffect(() => {
    if (!searchTouched.current) return;
    const handle = setTimeout(() => {
      void loadThreadPage({ searchTerm }).catch(() => undefined);
    }, 320);
    return () => clearTimeout(handle);
  }, [loadThreadPage, searchTerm]);

  const selectThread = useCallback(
    (threadId: string) => {
      if (compact) onCollapsedChange?.(true);
      void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
        onSelectThread?.(threadId);
      });
    },
    [compact, onCollapsedChange, onSelectThread, readThread],
  );

  // On mobile a collapsed sidebar is a closed drawer with no inline chrome —
  // the open trigger lives in the chat header instead.
  if (collapsed && compact) return null;
  if (collapsed) {
    return (
      <aside className="aui-sidebar aui-sidebar-collapsed" data-collapsed="true">
        <button
          aria-label="Expand history"
          className={buttonClass("ghost", { iconOnly: true })}
          onClick={() => onCollapsedChange?.(false)}
          title="Expand history"
          type="button"
        >
          <IconHistory size={16} />
        </button>
      </aside>
    );
  }
  return (
    <aside className="aui-sidebar" data-collapsed="false">
      <div className="aui-sidebar-header">
        <div className="aui-sidebar-title">Threads</div>
        <button
          aria-label={compact ? "Close history" : "Collapse history"}
          className={buttonClass("ghost", { iconOnly: true, size: "sm" })}
          onClick={() => onCollapsedChange?.(true)}
          title={compact ? "Close history" : "Collapse history"}
          type="button"
        >
          <IconClose size={14} />
        </button>
      </div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          void loadThreadPage({ searchTerm }).catch(() => undefined);
        }}
        role="search"
      >
        <div className="aui-input-shell aui-input-with-icon">
          <IconSearch size={14} />
          <input
            aria-label="Search history"
            className="aui-text-input"
            onChange={(event) => {
              searchTouched.current = true;
              setSearchTerm(event.currentTarget.value);
            }}
            placeholder="Search threads"
            type="search"
            value={searchTerm}
          />
          {isLoading ? (
            <span
              aria-hidden="true"
              className="aui-history-spinner"
              data-testid="history-loading"
            />
          ) : null}
        </div>
      </form>
      <div className="aui-history-feedback" aria-live="polite">
        {error ? <p className="aui-sidebar-error">{error.message}</p> : null}
        {!isLoading && hasLoaded && visibleThreads.length === 0 ? (
          <p className="aui-sidebar-status">No threads found.</p>
        ) : null}
        {hasLoaded && visibleThreads.length > 0 ? (
          <p className="aui-sidebar-status">
            {visibleThreads.length} {visibleThreads.length === 1 ? "thread" : "threads"}{" "}
            loaded
            {(nextCursor ?? cursor) ? " · more available" : " · all loaded"}
          </p>
        ) : null}
      </div>
      <ThreadList
        activeThreadId={activeThreadId}
        footer={
          nextCursor ?? cursor ? (
            <div className="aui-thread-list-sentinel" ref={sentinelRef}>
              <button
                className={buttonClass("subtle", { size: "sm" })}
                disabled={isLoading}
                onClick={loadNextThreadPage}
                type="button"
              >
                {isLoading ? "Loading" : "Load more"}
              </button>
            </div>
          ) : null
        }
        onSelectThread={selectThread}
        threads={visibleThreads}
      />
    </aside>
  );
}

export const AgentThreadSidebar = ThreadSidebar;

function responseCursor(response: Record<string, unknown> | undefined): string | null {
  if (!response) return null;
  return stringField(response, "nextCursor") ?? stringField(response, "next_cursor") ?? null;
}

function approvalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "accept" };
  if (approval.kind === "commandApproval") return { decision: "accept" };
  return { decision: "accept" };
}

function approvalSessionResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "acceptForSession" };
  if (approval.kind === "commandApproval") return { decision: "acceptForSession" };
  return { decision: "acceptForSession" };
}

function declineApprovalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "decline" };
  if (approval.kind === "commandApproval") return { decision: "decline" };
  return { decision: "decline" };
}

function deferAction(action: () => void | Promise<unknown>) {
  setTimeout(() => {
    void action();
  }, 0);
}

function diagnosticsTitle(messages: string[]): string {
  const pluginWarnings = messages.filter((message) =>
    message.includes("codex_core_plugins::manifest"),
  ).length;
  if (pluginWarnings === messages.length) return "Plugin manifest warnings";
  if (pluginWarnings > 0) return "Diagnostics and plugin warnings";
  return "Diagnostics";
}

function statusBannerTitle(kind: string): string {
  switch (kind) {
    case "modelReroute":
      return "Model rerouted";
    case "deprecationNotice":
      return "Deprecation notice";
    case "configWarning":
      return "Config warning";
    case "accountStatus":
      return "Account";
    case "mcpOAuth":
      return "MCP OAuth";
    case "rateLimit":
      return "Rate limit";
    default:
      return "Status";
  }
}

function isSuppressedDiagnostic(message: string): boolean {
  return (
    (message.includes("codex_core_plugins::manifest") &&
      message.includes("ignoring interface.defaultPrompt")) ||
    (message.includes("codex_core_skills::loader") &&
      (message.includes("ignoring interface.icon_small") ||
        message.includes("ignoring interface.icon_large")))
  );
}
