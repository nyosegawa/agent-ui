import type {
  AgentItemState,
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
    <section className={["aui-shell", className].filter(Boolean).join(" ")} data-testid="agent-chat">
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
                <p>{thread.thread.path ?? thread.thread.id}</p>
              </div>
              <AgentThreadActions status={thread.status} threadId={threadId} />
            </div>
            <AgentMessageList renderItem={slots?.renderItem} thread={thread} />
            <AgentWorkLog thread={thread} />
            <AgentDiffPanel thread={thread} />
            <AgentApprovalPrompt renderApproval={slots?.renderApproval} threadId={threadId} />
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
    <button className="aui-button" onClick={onStartThread} type="button">
      Start thread
    </button>
  );
}

function AgentThreadActions({ status, threadId }: { status: string; threadId?: string }) {
  const { resumeThread, startThread } = useAgentThread(threadId);
  const canResume = threadId && (status === "notLoaded" || status === "loaded");
  return (
    <div className="aui-thread-actions">
      <span className="aui-status-pill" data-status={status}>
        {status}
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
  const visibleItems = turn.itemOrder
    .map((itemId) => {
      const item = turn.items[itemId];
      return {
        id: itemId,
        item,
        text: item?.text ?? turn.streamingTextByItemId[itemId],
      };
    })
    .map((entry) => ({ ...entry, text: displayText(entry.text) }))
    .filter((entry) => {
      if (!entry.text?.trim()) return false;
      if (entry.item && isWorklogOnlyItem(entry.item)) return false;
      return true;
    });
  return (
    <li className="aui-turn">
      {visibleItems.map(({ id, item, text }) => {
        if (!text) return null;
        if (item && renderItem) return <div key={id}>{renderItem(item, turn)}</div>;
        const kind = item?.kind ?? "stream";
        const status = displayItemStatus(item?.status ?? "streaming", threadStatus);
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
    </li>
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
  if (status === "inProgress" && (threadStatus === "complete" || threadStatus === "completed")) {
    return "completed";
  }
  return status;
}

export function AgentWorkLog({ thread }: { thread: ThreadState }) {
  const outputs = thread.orderedTurnIds.flatMap((turnId) => {
    const turn = thread.turns[turnId];
    return turn
      ? Object.entries(turn.commandOutputByItemId)
          .map(([itemId, output]) => ({
            command: commandTextForItem(turn.items[itemId]),
            itemId,
            output: output.trimEnd(),
            status: turn.items[itemId]?.status,
          }))
          .filter((entry) => entry.output.trim().length > 0)
      : [];
  });
  if (outputs.length === 0) return null;
  const visibleOutputs = outputs.slice(-50);
  const hiddenCount = outputs.length - visibleOutputs.length;
  return (
    <section className="aui-worklog" aria-label="Command output">
      <header className="aui-section-header">
        <strong>Command output</strong>
        <span>
          {hiddenCount > 0 ? `Latest ${visibleOutputs.length} of ` : ""}
          {outputs.length} {outputs.length === 1 ? "entry" : "entries"}
        </span>
      </header>
      {hiddenCount > 0 ? (
        <p className="aui-worklog-note">
          Older terminal output is hidden in this history view to keep the session readable.
        </p>
      ) : null}
      {visibleOutputs.map((entry, index) => (
        <details className="aui-command-card" key={entry.itemId} open={outputs.length <= 2}>
          <summary>
            <span className="aui-terminal-label">terminal</span>
            <span className="aui-command-title">
              {entry.command ?? `Command ${hiddenCount + index + 1}`}
            </span>
            <span className="aui-command-meta">
              {entry.status ?? "completed"} · {lineCount(entry.output)} lines
            </span>
          </summary>
          <pre className="aui-command-output">{entry.output}</pre>
        </details>
      ))}
    </section>
  );
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
        <strong>{approval.kind === "fileChangeApproval" ? "Review file changes" : "Approve command"}</strong>
        <span>request {String(approval.id)}</span>
      </div>
      {"command" in payload ? (
        <code className="aui-command-line">{String(payload.command)}</code>
      ) : null}
      {"path" in payload ? <div className="aui-file-path">{String(payload.path)}</div> : null}
      <pre>{JSON.stringify(approval.payload, null, 2)}</pre>
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

export function AgentDiffViewer({ patch }: { patch: unknown }) {
  const normalized = normalizePatch(patch);
  return (
    <div className="aui-diff">
      <div className="aui-diff-header">
        <strong>{formatCount(normalized.files.length, "file")}</strong>
        <span className="aui-diff-stat aui-diff-stat-add">+{normalized.stats.additions}</span>
        <span className="aui-diff-stat aui-diff-stat-remove">-{normalized.stats.removals}</span>
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
      <div aria-label="CodeMirror patch viewer" className="aui-codemirror-diff" ref={ref} />
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
    if (className) builder.add(line.from, line.from, Decoration.line({ class: className }));
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
  if (typeof patch === "string") return buildNormalizedPatch(patch, parseUnifiedDiffFiles(patch));
  if (Array.isArray(patch)) {
    const changes = normalizeChangeArray(patch);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
  }
  if (isRecord(patch)) {
    const changes = normalizeChangeArray(patch.changes);
    if (changes.length > 0) return buildNormalizedPatch(changesToText(changes), changes);
    const fileChanges = normalizeFileChanges(patch.fileChanges);
    if (fileChanges.length > 0) return buildNormalizedPatch(changesToText(fileChanges), fileChanges);
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

function normalizeChangeArray(value: unknown): Array<{ diff: string; kind: string; path: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((change) => {
    if (!isRecord(change) || typeof change.path !== "string") return [];
    const diff = typeof change.diff === "string" ? change.diff : "";
    const kind = typeof change.kind === "string" ? change.kind : "update";
    return [{ diff, kind, path: change.path }];
  });
}

function normalizeFileChanges(value: unknown): Array<{ diff: string; kind: string; path: string }> {
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([path, change]) => {
    if (!isRecord(change) || typeof change.type !== "string") return [];
    if (change.type === "update") {
      const movePath = typeof change.move_path === "string" ? ` -> ${change.move_path}` : "";
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
  return text
    .split("\n")
    .flatMap((line) => {
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

export function AgentDiffPanel({ thread }: { thread: ThreadState }) {
  const patches = thread.orderedTurnIds.flatMap((turnId) => {
    const turn = thread.turns[turnId];
    return turn ? Object.entries(turn.filePatchByItemId) : [];
  });
  if (patches.length === 0) return null;
  return (
    <section className="aui-diff-panel" aria-label="Diff preview">
      {patches.map(([itemId, patch]) => (
        <AgentDiffViewer key={itemId} patch={patch} />
      ))}
    </section>
  );
}

export function AgentStatusBar() {
  const { account, cancelLogin, login } = useAgentAuth();
  const accountLabel = accountLabelText(account.account);
  return (
    <header className="aui-status">
      <div className="aui-brand">
        <strong>Agent UI</strong>
        <span>{accountLabel ? `${account.status} · ${accountLabel}` : account.status}</span>
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
          Checking
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

function accountLabelText(account: Record<string, unknown> | undefined): string | undefined {
  if (!account) return undefined;
  const email = typeof account.email === "string" ? account.email : undefined;
  const planType = typeof account.planType === "string" ? account.planType : undefined;
  if (email && planType) return `${email} (${planType})`;
  return email ?? planType;
}

function AgentDiagnostics({ bootstrap }: { bootstrap: ReturnType<typeof useAgentBootstrap> }) {
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
        <small>{messages.length} {messages.length === 1 ? "message" : "messages"}</small>
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
    if (autoRefresh && state.connection.status === "connected" && !didAutoRefresh.current) {
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
                <span style={{ width: `${Math.min(100, Math.max(0, window.percent))}%` }} />
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
          <small>{thread.status}</small>
        </button>
      ))}
    </nav>
  );
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
  const { error, isLoading, listThreads } = useAgentThreadHistory();
  const { state } = useAgentContext();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
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
    async (params: { searchTerm?: string } = {}) => {
      const response = await listThreads({ limit: 25, searchTerm: params.searchTerm });
      const rawThreads = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.threads)
          ? response.threads
          : [];
      setVisibleThreadIds(
        rawThreads.map((rawThread: Record<string, unknown>) =>
          String(rawThread.id ?? rawThread.threadId ?? rawThread.thread_id),
        ),
      );
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
        <button className="aui-button aui-button-secondary" disabled={isLoading} type="submit">
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

function isWorklogOnlyItem(item: AgentItemState): boolean {
  return item.kind === "commandExecution" || item.kind === "fileChange";
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

function lineCount(value: string): number {
  if (!value) return 0;
  return value.split(/\r?\n/).length;
}

function messagePreview(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? text;
  const preview = firstLine.trim().replace(/\s+/g, " ");
  return preview.length > 140 ? `${preview.slice(0, 137)}...` : preview;
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
    message.includes("codex_core_plugins::manifest") &&
    message.includes("ignoring interface.defaultPrompt")
  );
}
