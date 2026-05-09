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
import { useEffect, useMemo, useRef, useState } from "react";

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
  const { account, login } = useAgentAuth();
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
  return (
    <button className="aui-button" onClick={onStartThread} type="button">
      Start thread
    </button>
  );
}

function AgentThreadActions({ status, threadId }: { status: string; threadId?: string }) {
  const { resumeThread } = useAgentThread(threadId);
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
  return (
    <ol className="aui-message-list">
      {thread.orderedTurnIds.map((turnId) => {
        const turn = thread.turns[turnId];
        return turn ? <AgentTurnView key={turnId} renderItem={renderItem} turn={turn} /> : null;
      })}
    </ol>
  );
}

function AgentTurnView({
  renderItem,
  turn,
}: {
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
  turn: TurnState;
}) {
  return (
    <li className="aui-turn">
      {turn.itemOrder.map((itemId) => {
        const item = turn.items[itemId];
        const text = item?.text ?? turn.streamingTextByItemId[itemId];
        if (!item && !text) return null;
        if (item && renderItem) return <div key={itemId}>{renderItem(item, turn)}</div>;
        return (
          <article className="aui-message" data-kind={item?.kind ?? "stream"} key={itemId}>
            <div className="aui-message-meta">
              <span>{item?.kind ?? "stream"}</span>
              <span>{item?.status ?? "streaming"}</span>
            </div>
            <div className="aui-message-body">{text}</div>
          </article>
        );
      })}
    </li>
  );
}

export function AgentWorkLog({ thread }: { thread: ThreadState }) {
  const outputs = thread.orderedTurnIds.flatMap((turnId) => {
    const turn = thread.turns[turnId];
    return turn ? Object.entries(turn.commandOutputByItemId) : [];
  });
  if (outputs.length === 0) return null;
  return (
    <section className="aui-worklog" aria-label="Command output">
      {outputs.map(([itemId, output]) => (
        <pre className="aui-command-output" key={itemId}>
          <span className="aui-terminal-label">terminal</span>
          {output}
        </pre>
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
  onReject,
}: {
  approval: PendingServerRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  const payload = approval.payload as Record<string, unknown>;
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
        <button className="aui-button" onClick={onApprove} type="button">
          Approve
        </button>
        <button className="aui-button aui-button-secondary" onClick={onReject} type="button">
          Decline
        </button>
      </div>
    </article>
  );
}

export function AgentDiffViewer({ patch }: { patch: unknown }) {
  const text = stringifyPatch(patch);
  return (
    <div className="aui-diff">
      <CodeMirrorDiff text={text} />
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

function stringifyPatch(patch: unknown) {
  return typeof patch === "string" ? patch : JSON.stringify(patch, null, 2);
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
  const { account, login } = useAgentAuth();
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
  ].filter(Boolean);
  if (bootstrap.isBootstrapping && messages.length === 0) {
    return (
      <section className="aui-diagnostics" aria-label="Diagnostics">
        <span>Syncing account, models, and usage.</span>
      </section>
    );
  }
  if (messages.length === 0) return null;
  return (
    <section className="aui-diagnostics" aria-label="Diagnostics">
      {messages.slice(-4).map((message, index) => (
        <span key={`${message}-${index}`}>{message}</span>
      ))}
    </section>
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
  const didAutoLoad = useRef(false);
  useEffect(() => {
    if (
      state.connection.status === "connected" &&
      threads.length === 0 &&
      !isLoading &&
      !didAutoLoad.current
    ) {
      didAutoLoad.current = true;
      void listThreads({ limit: 25 }).catch(() => undefined);
    }
  }, [isLoading, listThreads, state.connection.status, threads.length]);
  return (
    <aside className="aui-sidebar">
      <div className="aui-sidebar-title">Threads</div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          void listThreads({ searchTerm });
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
      <ThreadList
        activeThreadId={activeThreadId}
        onSelectThread={(threadId) => {
          void readThread(threadId, { activate: true, includeTurns: true }).catch(() => {
            onSelectThread?.(threadId);
          });
        }}
        threads={threads}
      />
    </aside>
  );
}

function approvalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "accept" };
  if (approval.kind === "commandApproval") return { decision: "accept" };
  return { decision: "accept" };
}

function declineApprovalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "decline" };
  if (approval.kind === "commandApproval") return { decision: "decline" };
  return { decision: "decline" };
}
