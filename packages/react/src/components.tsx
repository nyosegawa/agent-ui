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
  localImageInput,
  mentionInput,
  type CodexUserInput,
} from "./codex-request-params";
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
  sidebar?: boolean;
  slots?: AgentChatSlots;
  usage?: boolean;
}

export function AgentChat({
  className,
  diagnostics = true,
  sidebar = true,
  slots,
  usage = true,
}: AgentChatProps = {}) {
  const bootstrap = useAgentBootstrap();
  const { thread, threadId, startThread } = useAgentThread();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <AgentShell
      className={className}
      data-sidebar-collapsed={isSidebarCollapsed ? "true" : "false"}
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
      <div className="aui-chat">
        <AgentStatusBar />
        {diagnostics ? <AgentDiagnosticsPanel bootstrap={bootstrap} /> : null}
        <AgentStatusBanners />
        {usage ? <AgentUsagePanel autoRefresh={false} /> : null}
        {thread ? (
          <AgentThreadView
            renderApproval={slots?.renderApproval}
            renderItem={slots?.renderItem}
            threadId={threadId}
          />
        ) : (
          <div className="aui-empty">
            <AgentRunControls autoRefresh={false} />
            <AgentFirstRun onStartThread={() => void startThread()} />
          </div>
        )}
      </div>
    </AgentShell>
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
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  threadId?: string;
}

export function AgentThreadView({
  renderApproval,
  renderItem,
  threadId,
}: AgentThreadViewProps) {
  const { thread, threadId: resolvedThreadId } = useAgentThread(threadId);
  if (!thread) return null;
  return (
    <>
      <AgentThreadHeader thread={thread} threadId={resolvedThreadId} />
      <AgentThreadTimeline renderItem={renderItem} thread={thread} />
      <AgentApprovalQueue renderApproval={renderApproval} threadId={resolvedThreadId} />
      <AgentComposerPanel thread={thread} threadId={resolvedThreadId} />
    </>
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

export function AgentThreadTimeline({
  renderItem,
  thread,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  thread: ThreadState;
}) {
  return <AgentMessageList renderItem={renderItem} thread={thread} />;
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
        <button className="aui-button aui-button-secondary" disabled type="button">
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
        <button className="aui-button" onClick={() => deferAction(login)} type="button">
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
          className="aui-button aui-button-secondary"
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
      <button className="aui-button" onClick={() => deferAction(onStartThread)} type="button">
        Start thread
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
        {formatThreadStatus(status, { hasTurns })}
      </span>
      {canResume ? (
        <button
          className="aui-button aui-button-secondary"
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
          className="aui-button aui-button-secondary"
          onClick={() => deferAction(() => void interruptTurn(latestTurnId))}
          type="button"
        >
          Stop
        </button>
      ) : null}
      <button
        className="aui-button aui-button-secondary"
        onClick={() => deferAction(startThread)}
        type="button"
      >
        New thread
      </button>
      <details className="aui-thread-action-menu">
        <summary>Actions</summary>
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
}

export function AgentRunControls({ autoRefresh = true }: AgentRunControlsProps = {}) {
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
    <section className="aui-run-controls" aria-label="Run settings">
      <fieldset className="aui-mode-group">
        <legend>Execution mode</legend>
        <div className="aui-segmented">
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
        <div className="aui-cwd-input">
          <input
            aria-label="Working directory"
            list={cwdOptions.length > 0 ? "aui-cwd-options" : undefined}
            onChange={(event) => setCwd(event.currentTarget.value)}
            placeholder={cwdOptions[0] ?? "Server default cwd"}
            type="text"
            value={runSettings.cwd ?? ""}
          />
          {runSettings.cwd ? (
            <button
              aria-label="Clear working directory"
              className="aui-icon-button"
              onClick={() => setCwd("")}
              title="Clear working directory"
              type="button"
            >
              x
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

function formatModelOption(model: { id: string; name?: string }): string {
  if (!model.name || model.name === model.id) return model.id;
  return `${model.name} (${model.id})`;
}

export function AgentComposer({
  disabled = false,
  placeholder = "Ask Codex to work in this thread",
  threadId,
}: {
  disabled?: boolean;
  placeholder?: string;
  threadId?: string;
}) {
  const composer = useAgentComposer(threadId);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((current) => [...current, attachment]);
  }, []);
  const removeAttachment = useCallback((id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }, []);
  return (
    <form
      className="aui-composer"
      onSubmit={(event) => {
        event.preventDefault();
        deferAction(() => composer.submit(attachments.map(composerAttachmentInput)));
        setAttachments([]);
      }}
    >
      <ComposerAttachmentToolbar
        attachments={attachments}
        disabled={disabled}
        onAdd={addAttachment}
        onRemove={removeAttachment}
      />
      <textarea
        aria-label="Message"
        className="aui-composer-input"
        disabled={disabled}
        onChange={(event) => composer.setValue(event.currentTarget.value)}
        onDrop={(event) => {
          if (disabled) return;
          const files = Array.from(event.dataTransfer.files);
          if (files.length === 0) return;
          event.preventDefault();
          for (const file of files) {
            addAttachment({
              id: `${file.name}:${file.size}:${Date.now()}`,
              kind: file.type.startsWith("image/") ? "image" : "file",
              label: file.name,
              value: file.name,
            });
          }
        }}
        onPaste={(event) => {
          if (disabled) return;
          const files = Array.from(event.clipboardData.files);
          for (const file of files) {
            addAttachment({
              id: `${file.name}:${file.size}:${Date.now()}`,
              kind: file.type.startsWith("image/") ? "image" : "file",
              label: file.name || "pasted file",
              value: file.name,
            });
          }
        }}
        placeholder={placeholder}
        rows={3}
        value={composer.value}
      />
      <button className="aui-button" disabled={disabled} type="submit">
        Send
      </button>
    </form>
  );
}

type ComposerAttachmentKind = "image" | "file" | "app" | "plugin";

interface ComposerAttachment {
  id: string;
  kind: ComposerAttachmentKind;
  label: string;
  value: string;
}

function ComposerAttachmentToolbar({
  attachments,
  disabled,
  onAdd,
  onRemove,
}: {
  attachments: ComposerAttachment[];
  disabled: boolean;
  onAdd: (attachment: ComposerAttachment) => void;
  onRemove: (id: string) => void;
}) {
  const addMention = (kind: "app" | "plugin") => {
    const value = globalThis.prompt?.(
      kind === "app" ? "App URI" : "Plugin URI",
      kind === "app" ? "app://" : "plugin://",
    );
    if (!value?.trim()) return;
    onAdd({
      id: `${kind}:${value}:${Date.now()}`,
      kind,
      label: value.trim(),
      value: value.trim(),
    });
  };
  return (
    <div className="aui-attachment-toolbar" aria-label="Composer attachments">
      <label className="aui-attachment-button">
        <span>Image</span>
        <input
          accept="image/*"
          disabled={disabled}
          onChange={(event) => {
            for (const file of Array.from(event.currentTarget.files ?? [])) {
              onAdd({
                id: `image:${file.name}:${file.size}:${Date.now()}`,
                kind: "image",
                label: file.name,
                value: file.name,
              });
            }
            event.currentTarget.value = "";
          }}
          type="file"
        />
      </label>
      <label className="aui-attachment-button">
        <span>File</span>
        <input
          disabled={disabled}
          onChange={(event) => {
            for (const file of Array.from(event.currentTarget.files ?? [])) {
              onAdd({
                id: `file:${file.name}:${file.size}:${Date.now()}`,
                kind: "file",
                label: file.name,
                value: file.name,
              });
            }
            event.currentTarget.value = "";
          }}
          type="file"
        />
      </label>
      <button disabled={disabled} onClick={() => addMention("app")} type="button">
        App
      </button>
      <button disabled={disabled} onClick={() => addMention("plugin")} type="button">
        Plugin
      </button>
      {attachments.length > 0 ? (
        <ul className="aui-attachment-chips">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <span>{attachment.kind}</span>
              <strong>{attachment.label}</strong>
              <button
                aria-label={`Remove ${attachment.label}`}
                onClick={() => onRemove(attachment.id)}
                type="button"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function composerAttachmentInput(attachment: ComposerAttachment): CodexUserInput {
  if (attachment.kind === "image") return localImageInput(attachment.value);
  return mentionInput(attachment.label, attachment.value);
}

export function AgentComposerPanel({
  thread,
  threadId,
}: {
  thread: ThreadState;
  threadId?: string;
}) {
  const isRunning = thread.status === "running";
  const isPreviewOnly = isPreviewOnlyThread(thread);
  const isBlocked = isRunning || thread.status === "waitingForInput" || isPreviewOnly;
  const compactRunSettings = useCompactLayout();
  return (
    <section className="aui-compose-panel" aria-label="Message composer">
      {compactRunSettings ? (
        <details className="aui-run-settings-details">
          <summary>
            <span>Run settings</span>
            <RunSettingsSummary />
          </summary>
          <AgentRunControls autoRefresh={false} />
        </details>
      ) : (
        <AgentRunControls autoRefresh={false} />
      )}
      {isBlocked ? (
        <AgentTurnStopControl isPreviewOnly={isPreviewOnly} thread={thread} />
      ) : null}
      <AgentComposer
        disabled={isBlocked}
        placeholder={composerPlaceholder(thread.status, isPreviewOnly)}
        threadId={threadId}
      />
    </section>
  );
}

function RunSettingsSummary() {
  const { runSettings, selectedModel } = useAgentRunSettings();
  const parts = [
    runSettings.executionMode,
    runSettings.modelId ?? selectedModel?.id ?? "server model",
    runSettings.effort ? `effort ${runSettings.effort}` : "default effort",
    runSettings.cwd ? compactPath(runSettings.cwd) : "server cwd",
  ];
  return <small>{parts.join(" · ")}</small>;
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

function AgentTurnStopControl({
  isPreviewOnly = false,
  thread,
}: {
  isPreviewOnly?: boolean;
  thread: ThreadState;
}) {
  if (
    thread.status !== "running" &&
    thread.status !== "waitingForInput" &&
    !isPreviewOnly
  ) {
    return null;
  }
  return (
    <div className="aui-turn-control">
      <span>
        {isPreviewOnly
          ? "Resume this stored thread before sending a new message."
          : thread.status === "running"
            ? "Codex is working. Stop is available in the thread header."
            : "Resolve the pending approval before sending another message."}
      </span>
    </div>
  );
}

function composerPlaceholder(status: ThreadState["status"], isPreviewOnly = false): string {
  if (isPreviewOnly) return "Resume this stored thread before sending.";
  if (status === "running") return "Codex is working. Stop the turn before sending.";
  if (status === "waitingForInput") return "Resolve the pending approval before sending.";
  return "Ask Codex to work in this thread";
}

export function AgentApprovalQueue({
  renderApproval,
  threadId,
}: {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  threadId?: string;
}) {
  const { approvals, approve } = useAgentApprovals(threadId);
  if (approvals.length === 0) return null;
  return (
    <section className="aui-approvals" aria-label="Pending approvals">
      {approvals.map((approval) => (
        <div key={String(approval.id)}>
          {renderApproval ? (
            renderApproval(approval)
          ) : (
            <ApprovalCard
              approval={approval}
              onApprove={() =>
                deferAction(() => void approve(approval.id, approvalResult(approval)))
              }
              onApproveForSession={() =>
                deferAction(() =>
                  void approve(approval.id, approvalSessionResult(approval)),
                )
              }
              onReject={() =>
                deferAction(() =>
                  void approve(approval.id, declineApprovalResult(approval)),
                )
              }
            />
          )}
        </div>
      ))}
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
  return (
    <article className="aui-approval">
      <div className="aui-approval-header">
        <strong>{approvalTitle(approval.kind)}</strong>
        <span>request {String(approval.id)}</span>
      </div>
      <ApprovalSummary approval={approval} payload={payload} />
      <div className="aui-actions">
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)}`}
          className="aui-button"
          onClick={onApprove}
          type="button"
        >
          Approve
        </button>
        <button
          aria-label={`Approve ${requestLabel} ${String(approval.id)} for session`}
          className="aui-button aui-button-secondary"
          onClick={onApproveForSession}
          type="button"
        >
          Approve session
        </button>
        <button
          aria-label={`Decline ${requestLabel} ${String(approval.id)}`}
          className="aui-button aui-button-secondary"
          onClick={onReject}
          type="button"
        >
          Decline
        </button>
      </div>
    </article>
  );
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
      <code className="aui-command-line">{command}</code>
      <MetadataGrid
        rows={[
          ["Working directory", cwd],
          ["Approval policy", policy],
          ["Sandbox", sandbox],
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
      {path ? <div className="aui-file-path">{path}</div> : null}
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

export function AgentStatusBar() {
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
              className="aui-button aui-button-secondary"
              onClick={() => void cancelLogin()}
              type="button"
            >
              Cancel login
            </button>
          ) : null}
        </div>
      ) : null}
      {account.status === "unknown" ? (
        <button className="aui-button aui-button-secondary" disabled type="button">
          {state.connection.status === "connected" ? "Checking" : "Connecting"}
        </button>
      ) : null}
      {account.status === "unauthenticated" ? (
        <button className="aui-button" onClick={() => void login()} type="button">
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

export function AgentStatusBanners() {
  const { state } = useAgentContext();
  const banners = state.diagnostics.banners.slice(-6);
  if (banners.length === 0) return null;
  return (
    <section className="aui-status-banners" aria-label="Status banners">
      {banners.map((banner) => (
        <article className="aui-status-banner" data-kind={banner.kind} key={banner.id}>
          <strong>{statusBannerTitle(banner.kind)}</strong>
          <span>{banner.message}</span>
        </article>
      ))}
    </section>
  );
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
      className="aui-link-button"
      disabled={isRefreshing}
      onClick={() => {
        setIsRefreshing(true);
        void refreshUsage().finally(() => setIsRefreshing(false));
      }}
      type="button"
    >
      {isRefreshing ? "Refreshing" : "Refresh"}
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
          className="aui-link-button"
          onClick={() => void refreshSkills().catch(() => undefined)}
          type="button"
        >
          Refresh
        </button>
      </div>
      {skills.length > 0 ? (
        <ul className="aui-plain-list">
          {skills.map((skill) => (
            <li key={`${skill.path ?? ""}:${skill.name}`}>
              <span>{skill.name}</span>
              <button
                className="aui-link-button"
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
          className="aui-link-button"
          onClick={() => void refreshApps().catch(() => undefined)}
          type="button"
        >
          Refresh
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
          className="aui-link-button"
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
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  return (
    <nav className="aui-thread-list" aria-label="Threads">
      {threads.map((thread) => (
        <button
          aria-current={thread.thread.id === activeThreadId ? "page" : undefined}
          className="aui-thread-list-item"
          key={thread.thread.id}
          onClick={() => onSelectThread?.(thread.thread.id)}
          type="button"
        >
          <span>{thread.thread.name ?? thread.thread.id}</span>
          <small>{threadListMeta(thread)}</small>
        </button>
      ))}
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
  const { cursor, error, isLoading, listThreads } = useAgentThreadHistory();
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>();
  const [visibleThreadIds, setVisibleThreadIds] = useState<string[] | undefined>();
  const didAutoLoad = useRef(false);
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
  const loadAllThreadPages = useCallback(async () => {
    let pageCursor = nextCursor ?? cursor ?? null;
    if (!pageCursor) return;
    setIsLoadingAll(true);
    try {
      const seenCursors = new Set<string>();
      while (pageCursor && !seenCursors.has(pageCursor)) {
        seenCursors.add(pageCursor);
        const response = await listThreads({
          cursor: pageCursor,
          limit: 25,
          searchTerm,
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
        setVisibleThreadIds((current) =>
          Array.from(new Set([...(current ?? []), ...threadIds])),
        );
        pageCursor = responseCursor(response);
        setNextCursor(pageCursor);
        setHasLoaded(true);
      }
    } finally {
      setIsLoadingAll(false);
    }
  }, [cursor, listThreads, nextCursor, searchTerm]);
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
  if (collapsed) {
    return (
      <aside className="aui-sidebar aui-sidebar-collapsed" data-collapsed="true">
        <button
          aria-label="Expand history"
          className="aui-sidebar-toggle"
          onClick={() => onCollapsedChange?.(false)}
          title="Expand history"
          type="button"
        >
          History
        </button>
      </aside>
    );
  }
  return (
    <aside className="aui-sidebar" data-collapsed="false">
      <div className="aui-sidebar-header">
        <div className="aui-sidebar-title">Threads</div>
        <button
          aria-label="Collapse history"
          className="aui-sidebar-toggle"
          onClick={() => onCollapsedChange?.(true)}
          title="Collapse history"
          type="button"
        >
          Hide
        </button>
      </div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          void loadThreadPage({ searchTerm }).catch(() => undefined);
        }}
      >
        <input
          aria-label="Search history"
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          placeholder="Search history"
          type="search"
          value={searchTerm}
        />
        <button
          className="aui-button aui-button-secondary"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Loading" : "Load"}
        </button>
      </form>
      <div className="aui-history-feedback" aria-live="polite">
        {error ? <p className="aui-sidebar-error">{error.message}</p> : null}
        {isLoading || isLoadingAll ? (
          <p className="aui-sidebar-status">
            {isLoadingAll ? "Loading all threads..." : "Loading threads..."}
          </p>
        ) : null}
        {!isLoading && !isLoadingAll && hasLoaded && visibleThreads.length === 0 ? (
          <p className="aui-sidebar-status">No threads found.</p>
        ) : null}
        {hasLoaded && visibleThreads.length > 0 ? (
          <p className="aui-sidebar-status">
            {visibleThreads.length} {visibleThreads.length === 1 ? "thread" : "threads"}{" "}
            loaded
            {(nextCursor ?? cursor) ? " · more available" : " · all loaded"}
          </p>
        ) : null}
        {(nextCursor ?? cursor) ? (
          <div className="aui-history-pagination">
            <button
              className="aui-button aui-button-secondary aui-history-load-more"
              disabled={isLoading || isLoadingAll}
              onClick={() => {
                void loadThreadPage({
                  append: true,
                  cursor: nextCursor ?? cursor ?? null,
                  searchTerm,
                }).catch(() => undefined);
              }}
              type="button"
            >
              {isLoading ? "Loading" : "Load more"}
            </button>
            <button
              className="aui-button aui-button-secondary aui-history-load-more"
              disabled={isLoading || isLoadingAll}
              onClick={() => {
                void loadAllThreadPages().catch(() => undefined);
              }}
              type="button"
            >
              {isLoadingAll ? "Loading" : "Load all"}
            </button>
          </div>
        ) : null}
      </div>
      <ThreadList
        activeThreadId={activeThreadId}
        onSelectThread={(threadId) => {
          void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
            onSelectThread?.(threadId);
          });
        }}
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
