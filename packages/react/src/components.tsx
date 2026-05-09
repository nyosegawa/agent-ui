import type {
  AgentItemState,
  AgentThread,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import type React from "react";
import {
  useAgentApprovals,
  useAgentAuth,
  useAgentBootstrap,
  useAgentComposer,
  useAgentModels,
  useAgentThreadHistory,
  useAgentThreadReader,
  useAgentRunSettings,
  useAgentThread,
  useAgentThreads,
  useAgentUsage,
} from "./hooks";
import { useAgentContext } from "./provider";
import { normalizeUsageWindows } from "./usage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AgentChatSlots {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
}

export interface AgentChatProps {
  className?: string;
  slots?: AgentChatSlots;
}

export function AgentChat({ className, slots }: AgentChatProps = {}) {
  const bootstrap = useAgentBootstrap();
  const { thread, threadId, startThread } = useAgentThread();
  const { threads, activeThreadId, setActiveThread } = useAgentThreads();
  return (
    <section
      className={["aui-shell", className].filter(Boolean).join(" ")}
      data-testid="agent-chat"
    >
      <ThreadSidebar
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThread}
        threads={threads}
      />
      <div className="aui-chat">
        <AgentStatusBar />
        <AgentDiagnostics bootstrap={bootstrap} />
        <AgentUsage autoRefresh={false} />
        {thread ? (
          <>
            <div className="aui-thread-header">
              <div>
                <h1>{thread.thread.name ?? "Untitled thread"}</h1>
                <p>{threadSubtitle(thread.thread)}</p>
              </div>
              <AgentThreadActions status={thread.status} threadId={threadId} />
            </div>
            <AgentMessageList renderItem={slots?.renderItem} thread={thread} />
            <AgentApprovalPrompt
              renderApproval={slots?.renderApproval}
              threadId={threadId}
            />
            <AgentRunControls autoRefresh={false} />
            <AgentComposer threadId={threadId} />
          </>
        ) : (
          <div className="aui-empty">
            <AgentRunControls autoRefresh={false} />
            <AgentFirstRun onStartThread={() => void startThread()} />
          </div>
        )}
      </div>
    </section>
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
        <button className="aui-button" onClick={() => void login()} type="button">
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
          onClick={() => void cancelLogin()}
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
      <button className="aui-button" onClick={onStartThread} type="button">
        Start thread
      </button>
    </div>
  );
}

function AgentThreadActions({ status, threadId }: { status: string; threadId?: string }) {
  const { resumeThread, startThread } = useAgentThread(threadId);
  const canResume = threadId && (status === "notLoaded" || status === "loaded");
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        {formatThreadStatus(status)}
      </span>
      {canResume ? (
        <button
          className="aui-button aui-button-secondary"
          onClick={() => void resumeThread(threadId, { excludeTurns: true })}
          type="button"
        >
          Resume
        </button>
      ) : null}
      <button
        className="aui-button aui-button-secondary"
        onClick={() => void startThread()}
        type="button"
      >
        New thread
      </button>
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
        <input
          aria-label="Working directory"
          onChange={(event) => setCwd(event.currentTarget.value)}
          placeholder="Server default cwd"
          type="text"
          value={runSettings.cwd ?? ""}
        />
      </label>
    </section>
  );
}

function formatModelOption(model: { id: string; name?: string }): string {
  if (!model.name || model.name === model.id) return model.id;
  return `${model.name} (${model.id})`;
}

export function AgentComposer({ threadId }: { threadId?: string }) {
  const composer = useAgentComposer(threadId);
  return (
    <form
      className="aui-composer"
      onSubmit={(event) => {
        event.preventDefault();
        void composer.submit();
      }}
    >
      <textarea
        aria-label="Message"
        className="aui-composer-input"
        onChange={(event) => composer.setValue(event.currentTarget.value)}
        rows={3}
        value={composer.value}
      />
      <button className="aui-button" type="submit">
        Send
      </button>
    </form>
  );
}

export function AgentMessageList({
  renderItem,
  thread,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  thread: ThreadState;
}) {
  const listRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [thread.thread.id, thread.orderedTurnIds.length]);
  return (
    <ol className="aui-message-list" ref={listRef}>
      {thread.orderedTurnIds.map((turnId) => {
        const turn = thread.turns[turnId];
        return turn ? (
          <AgentTurnView
            key={turnId}
            renderItem={renderItem}
            threadStatus={thread.status}
            turn={turn}
          />
        ) : null;
      })}
    </ol>
  );
}

function AgentTurnView({
  renderItem,
  threadStatus,
  turn,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  threadStatus: ThreadState["status"];
  turn: TurnState;
}) {
  const timelineItemIds = turnTimelineItemIds(turn);
  const activityItemIds = timelineItemIds.filter((itemId) =>
    activityKindForId(turn, itemId),
  );
  const hiddenActivityCount = Math.max(
    0,
    activityItemIds.length - MAX_INLINE_ACTIVITY_ITEMS,
  );
  const visibleActivityItemIds = activityItemIds.slice(hiddenActivityCount);
  const hasConversationText = timelineItemIds.some((id) => {
    if (activityKindForId(turn, id)) return false;
    const item = turn.items[id];
    const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
    return Boolean(text?.trim());
  });
  return (
    <li className="aui-turn">
      {timelineItemIds.map((id) => {
        const item = turn.items[id];
        const text = displayText(item?.text ?? turn.streamingTextByItemId[id]);
        const activityKind = activityKindForId(turn, id);
        if (activityKind) return null;
        if (!text?.trim()) return null;
        if (item && renderItem) return <div key={id}>{renderItem(item, turn)}</div>;
        const messageItem = turn.items[id] as AgentItemState | undefined;
        const kind = messageItem?.kind ?? "stream";
        const status = displayItemStatus(
          messageItem?.status ?? "streaming",
          threadStatus,
        );
        return (
          <article className="aui-message" data-kind={kind} key={id}>
            <div className="aui-message-meta">
              <span>{itemLabel(kind)}</span>
              <span>{status}</span>
            </div>
            <MessageBody text={text} />
          </article>
        );
      })}
      {activityItemIds.length > 0 ? (
        <AgentWorkTrace
          activityItemIds={activityItemIds}
          defaultOpen={!hasConversationText || threadStatus === "running"}
          hiddenActivityCount={hiddenActivityCount}
          itemIds={visibleActivityItemIds}
          turn={turn}
        />
      ) : null}
    </li>
  );
}

const MAX_INLINE_ACTIVITY_ITEMS = 8;

function AgentWorkTrace({
  activityItemIds,
  defaultOpen,
  hiddenActivityCount,
  itemIds,
  turn,
}: {
  activityItemIds: string[];
  defaultOpen: boolean;
  hiddenActivityCount: number;
  itemIds: string[];
  turn: TurnState;
}) {
  const commandCount = activityItemIds.filter(
    (itemId) => activityKindForId(turn, itemId) === "commandExecution",
  ).length;
  const fileChangeCount = activityItemIds.filter(
    (itemId) => activityKindForId(turn, itemId) === "fileChange",
  ).length;
  return (
    <details
      aria-label="Work trace"
      className="aui-work-trace"
      open={defaultOpen ? true : undefined}
    >
      <summary>
        <span>Work trace</span>
        <strong>{activitySummary(commandCount, fileChangeCount)}</strong>
        {hiddenActivityCount > 0 ? (
          <small>{hiddenActivityCount} older steps collapsed</small>
        ) : null}
      </summary>
      <div className="aui-work-trace-list">
        {hiddenActivityCount > 0 ? (
          <ActivityCollapseNotice count={hiddenActivityCount} />
        ) : null}
        {itemIds.map((id) => {
          const item = turn.items[id];
          const activityKind = activityKindForId(turn, id);
          if (!activityKind) return null;
          return (
            <AgentActivityItem
              item={item}
              itemId={id}
              key={id}
              kind={activityKind}
              output={turn.commandOutputByItemId[id]}
              patch={turn.filePatchByItemId[id]}
            />
          );
        })}
      </div>
    </details>
  );
}

function activitySummary(commandCount: number, fileChangeCount: number): string {
  const parts = [];
  if (commandCount > 0) parts.push(formatCount(commandCount, "command"));
  if (fileChangeCount > 0) parts.push(formatCount(fileChangeCount, "file change"));
  return parts.length > 0 ? parts.join(", ") : "No captured work";
}

function ActivityCollapseNotice({ count }: { count: number }) {
  return (
    <div className="aui-activity-collapsed">
      {count} older work {count === 1 ? "step" : "steps"} collapsed in this turn
    </div>
  );
}

function AgentActivityItem({
  item,
  itemId,
  kind,
  output,
  patch,
}: {
  item?: AgentItemState;
  itemId: string;
  kind: "commandExecution" | "fileChange";
  output?: string;
  patch?: unknown;
}) {
  if (kind === "commandExecution") {
    return <AgentCommandActivity item={item} itemId={itemId} output={output} />;
  }
  if (kind === "fileChange") {
    return <AgentFileChangeActivity item={item} patch={patch} />;
  }
  return null;
}

function AgentCommandActivity({
  item,
  itemId,
  output,
}: {
  item?: AgentItemState;
  itemId: string;
  output?: string;
}) {
  const normalizedOutput = output?.trimEnd() ?? "";
  const title = commandTextForItem(item) ?? displayText(item?.text) ?? itemId;
  const status = item?.status ?? "completed";
  return (
    <details aria-label="Command output" className="aui-activity-card aui-command-card">
      <summary>
        <span className="aui-terminal-label">terminal</span>
        <span className="aui-command-title">{title}</span>
        <span className="aui-command-meta">
          {status} · {lineCount(normalizedOutput)} lines
        </span>
        {normalizedOutput ? (
          <span className="aui-command-preview">{commandPreview(normalizedOutput)}</span>
        ) : null}
      </summary>
      {normalizedOutput ? (
        <pre className="aui-command-output">{normalizedOutput}</pre>
      ) : (
        <div className="aui-activity-empty">No terminal output captured.</div>
      )}
    </details>
  );
}

function AgentFileChangeActivity({
  item,
  patch,
}: {
  item?: AgentItemState;
  patch?: unknown;
}) {
  return (
    <details aria-label="Diff preview" className="aui-activity-card aui-file-change-card">
      <summary>
        <span className="aui-terminal-label">diff</span>
        <span className="aui-command-title">
          {displayText(item?.text) ?? "File changes"}
        </span>
        <span className="aui-command-meta">{item?.status ?? "completed"}</span>
      </summary>
      {patch ? (
        <AgentDiffViewer patch={patch} />
      ) : (
        <div className="aui-activity-empty">No patch payload captured.</div>
      )}
    </details>
  );
}

function MessageBody({ text }: { text: string }) {
  const trimmed = text.trim();
  const isLong = trimmed.length > 1800 || trimmed.split(/\r?\n/).length > 18;
  if (!isLong) return <div className="aui-message-body">{trimmed}</div>;
  return (
    <details className="aui-message-body aui-message-body-collapsible">
      <summary>{messagePreview(trimmed)}</summary>
      <div>{trimmed}</div>
    </details>
  );
}

function displayText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    const text = value.map(displayText).filter(Boolean).join("\n");
    return text || undefined;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.message === "string") return record.message;
    const json = JSON.stringify(value, null, 2);
    return json === undefined ? undefined : json;
  }
  return String(value);
}

function displayItemStatus(status: string, threadStatus: ThreadState["status"]): string {
  if (status === "inProgress" && isHydratedThreadStatus(threadStatus)) {
    return "completed";
  }
  return status;
}

function isHydratedThreadStatus(status: ThreadState["status"]): boolean {
  return status === "loaded" || status === "complete" || status === "completed";
}

export function AgentApprovalPrompt({
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
              onApprove={() => void approve(approval.id, approvalResult(approval))}
              onApproveForSession={() =>
                void approve(approval.id, approvalSessionResult(approval))
              }
              onReject={() => void approve(approval.id, declineApprovalResult(approval))}
            />
          )}
        </div>
      ))}
    </section>
  );
}

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
  const payload = approval.payload as Record<string, unknown>;
  const requestLabel =
    approval.kind === "fileChangeApproval" ? "file-change request" : "command request";
  return (
    <article className="aui-approval">
      <div className="aui-approval-header">
        <strong>
          {approval.kind === "fileChangeApproval"
            ? "Review file changes"
            : "Approve command"}
        </strong>
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
  return <CommandApprovalSummary payload={payload} />;
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

export function AgentDiffViewer({ patch }: { patch: unknown }) {
  const normalized = normalizePatch(patch);
  return (
    <div className="aui-diff">
      <div className="aui-diff-header">
        <strong>{formatCount(normalized.files.length, "file")}</strong>
        <span className="aui-diff-stat aui-diff-stat-add">
          +{normalized.stats.additions}
        </span>
        <span className="aui-diff-stat aui-diff-stat-remove">
          -{normalized.stats.removals}
        </span>
      </div>
      {normalized.files.length > 0 ? (
        <ul className="aui-diff-files" aria-label="Changed files">
          {normalized.files.map((file) => (
            <li key={`${file.path}:${file.kind}`}>
              <span>{file.path}</span>
              <em>{file.kind}</em>
            </li>
          ))}
        </ul>
      ) : null}
      <CodeMirrorDiff text={normalized.text} />
    </div>
  );
}

function CodeMirrorDiff({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const view = new EditorView({
      doc: text,
      extensions: [
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        EditorView.decorations.compute(["doc"], diffLineDecorations),
        EditorView.contentAttributes.of({ "aria-label": "Patch content" }),
        diffTheme,
      ],
      parent: ref.current,
    });
    setIsEnhanced(true);
    return () => {
      view.destroy();
      setIsEnhanced(false);
    };
  }, [text]);

  return (
    <>
      <div
        aria-label="CodeMirror patch viewer"
        className="aui-codemirror-diff"
        ref={ref}
      />
      <pre
        aria-hidden={isEnhanced ? "true" : undefined}
        className={isEnhanced ? "aui-diff-source aui-visually-hidden" : "aui-diff-source"}
      >
        {text}
      </pre>
    </>
  );
}

function diffLineDecorations(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const marker = line.text[0];
    const className =
      marker === "+"
        ? "aui-cm-line-add"
        : marker === "-"
          ? "aui-cm-line-remove"
          : marker === "@"
            ? "aui-cm-line-hunk"
            : marker === "d" && line.text.startsWith("diff ")
              ? "aui-cm-line-file"
              : undefined;
    if (className)
      builder.add(line.from, line.from, Decoration.line({ class: className }));
  }
  return builder.finish();
}

const diffTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--aui-code-fg)",
      fontSize: "12px",
    },
    ".cm-content": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      minHeight: "100%",
      padding: "10px 0",
    },
    ".cm-gutters": {
      backgroundColor: "transparent",
      borderRight: "1px solid #344054",
      color: "#98a2b3",
    },
    ".cm-line": {
      padding: "0 10px",
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      lineHeight: "1.5",
    },
    ".aui-cm-line-add": {
      backgroundColor: "rgba(18, 135, 91, 0.22)",
    },
    ".aui-cm-line-file": {
      color: "#d0d5dd",
      fontWeight: "700",
    },
    ".aui-cm-line-hunk": {
      backgroundColor: "rgba(84, 121, 255, 0.22)",
      color: "#b8c7ff",
    },
    ".aui-cm-line-remove": {
      backgroundColor: "rgba(180, 35, 24, 0.24)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    "&.cm-focused": {
      outline: "2px solid #a8ddd2",
      outlineOffset: "-2px",
    },
  },
  { dark: true },
);

type NormalizedPatch = {
  files: Array<{ kind: string; path: string }>;
  stats: { additions: number; removals: number };
  text: string;
};

function normalizePatch(patch: unknown): NormalizedPatch {
  if (typeof patch === "string")
    return buildNormalizedPatch(patch, parseUnifiedDiffFiles(patch));
  if (Array.isArray(patch)) {
    const changes = normalizeChangeArray(patch);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
  }
  if (isRecord(patch)) {
    const changes = normalizeChangeArray(patch.changes);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
    const fileChanges = normalizeFileChanges(patch.fileChanges);
    if (fileChanges.length > 0)
      return buildNormalizedPatch(changesToText(fileChanges), fileChanges);
    if (typeof patch.diff === "string") {
      return buildNormalizedPatch(patch.diff, parseUnifiedDiffFiles(patch.diff));
    }
    if (typeof patch.patch === "string") {
      return buildNormalizedPatch(patch.patch, parseUnifiedDiffFiles(patch.patch));
    }
  }
  const text = JSON.stringify(patch, null, 2);
  return buildNormalizedPatch(text, []);
}

function buildNormalizedPatch(
  text: string,
  files: Array<{ kind: string; path: string }>,
): NormalizedPatch {
  return {
    files: dedupeFiles(files),
    stats: diffStats(text),
    text,
  };
}

function normalizeChangeArray(
  value: unknown,
): Array<{ diff: string; kind: string; path: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((change) => {
    if (!isRecord(change) || typeof change.path !== "string") return [];
    const diff = typeof change.diff === "string" ? change.diff : "";
    const kind = typeof change.kind === "string" ? change.kind : "update";
    return [{ diff, kind, path: change.path }];
  });
}

function normalizeFileChanges(
  value: unknown,
): Array<{ diff: string; kind: string; path: string }> {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([path, change]) => {
    if (!isRecord(change) || typeof change.type !== "string") return [];
    if (change.type === "update") {
      const movePath =
        typeof change.move_path === "string" ? ` -> ${change.move_path}` : "";
      return [
        {
          diff: typeof change.unified_diff === "string" ? change.unified_diff : "",
          kind: movePath ? `move${movePath}` : "update",
          path,
        },
      ];
    }
    const content = typeof change.content === "string" ? change.content : "";
    const prefix = change.type === "delete" ? "-" : "+";
    return [{ diff: contentToDiff(content, prefix), kind: change.type, path }];
  });
}

function changesToText(changes: Array<{ diff: string; kind: string; path: string }>) {
  return changes
    .map((change) => {
      const header = `diff --git a/${change.path} b/${change.path}\n# ${change.kind}`;
      return `${header}\n${change.diff}`.trimEnd();
    })
    .join("\n\n");
}

function contentToDiff(content: string, prefix: "+" | "-") {
  return content
    .split("\n")
    .map((line) => (line.length > 0 ? `${prefix}${line}` : prefix))
    .join("\n");
}

function parseUnifiedDiffFiles(text: string): Array<{ kind: string; path: string }> {
  return text.split("\n").flatMap((line) => {
    const match = /^diff --git a\/(.+) b\/(.+)$/.exec(line);
    if (!match) return [];
    return [{ kind: "update", path: match[2] ?? match[1] ?? "unknown" }];
  });
}

function dedupeFiles(files: Array<{ kind: string; path: string }>) {
  const seen = new Set<string>();
  return files.filter((file) => {
    const key = `${file.path}:${file.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diffStats(text: string) {
  return text.split("\n").reduce(
    (stats, line) => {
      if (line.startsWith("+") && !line.startsWith("+++")) stats.additions += 1;
      if (line.startsWith("-") && !line.startsWith("---")) stats.removals += 1;
      return stats;
    },
    { additions: 0, removals: 0 },
  );
}

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
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

function AgentDiagnostics({
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

export interface AgentUsageProps {
  autoRefresh?: boolean;
}

export function AgentUsage({ autoRefresh = true }: AgentUsageProps = {}) {
  const { state } = useAgentContext();
  const { rateLimits, refreshUsage } = useAgentUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const didAutoRefresh = useRef(false);
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
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
  return (
    <section className="aui-usage" aria-label="Usage limits">
      <div className="aui-usage-header">
        <strong>Usage</strong>
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
      </div>
      {windows.length > 0 ? (
        <div className="aui-usage-grid">
          {windows.map((window) => (
            <div className="aui-usage-window" key={window.id}>
              <div className="aui-usage-row">
                <span>{window.label}</span>
                <strong>{window.valueLabel}</strong>
              </div>
              <div
                aria-label={`${window.label} usage`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(window.percent)}
                className="aui-meter"
                role="progressbar"
              >
                <span
                  style={{ width: `${Math.min(100, Math.max(0, window.percent))}%` }}
                />
              </div>
              {window.resetLabel ? <small>{window.resetLabel}</small> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="aui-usage-empty">Usage limits are available after account sync.</p>
      )}
    </section>
  );
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
  const parts = [formatThreadStatus(thread.status)];
  const updated = rawThreadDate(thread.thread.raw, [
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "modified_at",
    "createdAt",
    "created_at",
  ]);
  if (updated) parts.push(updated);
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

function formatThreadStatus(status: string): string {
  switch (status) {
    case "notLoaded":
      return "Stored";
    case "loaded":
      return "Preview";
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
  onSelectThread,
  threads,
}: {
  activeThreadId?: string;
  onSelectThread?: (threadId: string) => void;
  threads: ThreadState[];
}) {
  const { cursor, error, isLoading, listThreads } = useAgentThreadHistory();
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
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
      params: { append?: boolean; cursor?: string | null; searchTerm?: string } = {},
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
      const threadIds = rawThreads.map((rawThread: Record<string, unknown>) =>
        String(rawThread.id ?? rawThread.threadId ?? rawThread.thread_id),
      );
      setVisibleThreadIds((current) => {
        if (!params.append) return threadIds;
        return Array.from(new Set([...(current ?? []), ...threadIds]));
      });
      setNextCursor(response?.nextCursor ?? response?.next_cursor ?? null);
      setHasLoaded(true);
      return response;
    },
    [listThreads],
  );
  useEffect(() => {
    if (
      state.connection.status === "connected" &&
      threads.length === 0 &&
      !isLoading &&
      !didAutoLoad.current
    ) {
      didAutoLoad.current = true;
      void loadThreadPage().catch(() => {
        setHasLoaded(true);
      });
    }
  }, [isLoading, loadThreadPage, state.connection.status, threads.length]);
  return (
    <aside className="aui-sidebar">
      <div className="aui-sidebar-title">Threads</div>
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
      {error ? <p className="aui-sidebar-error">{error.message}</p> : null}
      {isLoading ? <p className="aui-sidebar-status">Loading threads...</p> : null}
      {!isLoading && hasLoaded && visibleThreads.length === 0 ? (
        <p className="aui-sidebar-status">No threads found.</p>
      ) : null}
      <ThreadList
        activeThreadId={activeThreadId}
        onSelectThread={(threadId) => {
          void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
            onSelectThread?.(threadId);
          });
        }}
        threads={visibleThreads}
      />
      {(nextCursor ?? cursor) ? (
        <button
          className="aui-button aui-button-secondary aui-history-load-more"
          disabled={isLoading}
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
      ) : null}
    </aside>
  );
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

function itemLabel(kind: string): string {
  if (kind === "userMessage") return "You";
  if (kind === "agentMessage") return "Assistant";
  if (kind === "reasoning") return "Reasoning";
  if (kind === "plan") return "Plan";
  return kind;
}

function commandTextForItem(item: AgentItemState | undefined): string | undefined {
  const raw = item?.raw;
  if (!raw || typeof raw !== "object") return undefined;
  const command = (raw as Record<string, unknown>).command;
  return typeof command === "string" && command.trim() ? command.trim() : undefined;
}

function turnTimelineItemIds(turn: TurnState): string[] {
  const ids = new Set(turn.itemOrder);
  for (const itemId of Object.keys(turn.commandOutputByItemId)) ids.add(itemId);
  for (const itemId of Object.keys(turn.filePatchByItemId)) ids.add(itemId);
  return [...ids];
}

function activityKindForId(
  turn: TurnState,
  itemId: string,
): "commandExecution" | "fileChange" | undefined {
  const kind = turn.items[itemId]?.kind;
  if (kind === "commandExecution" || kind === "fileChange") return kind;
  if (itemId in turn.commandOutputByItemId) return "commandExecution";
  if (itemId in turn.filePatchByItemId) return "fileChange";
  return undefined;
}

function lineCount(value: string): number {
  if (!value) return 0;
  return value.split(/\r?\n/).length;
}

function messagePreview(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? text;
  const preview = firstLine.trim().replace(/\s+/g, " ");
  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
}

function commandPreview(text: string): string {
  const preview = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!preview) return "";
  return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview;
}

function diagnosticsTitle(messages: string[]): string {
  const pluginWarnings = messages.filter((message) =>
    message.includes("codex_core_plugins::manifest"),
  ).length;
  if (pluginWarnings === messages.length) return "Plugin manifest warnings";
  if (pluginWarnings > 0) return "Diagnostics and plugin warnings";
  return "Diagnostics";
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
