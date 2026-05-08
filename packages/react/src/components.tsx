import type {
  AgentItemState,
  PendingServerRequest,
  ThreadState,
  TurnState,
} from "@nyosegawa/agent-ui-core";
import type React from "react";
import {
  useAgentApprovals,
  useAgentAuth,
  useAgentComposer,
  useAgentModels,
  useAgentThreadHistory,
  useAgentThreadReader,
  useAgentRunSettings,
  useAgentThread,
  useAgentThreads,
  useAgentUsage,
} from "./hooks";
import { normalizeUsageWindows } from "./usage";
import { useEffect, useMemo, useState } from "react";

export interface AgentChatSlots {
  renderApproval?: (approval: PendingServerRequest) => React.ReactNode;
  renderItem?: (item: AgentItemState, turn: TurnState) => React.ReactNode;
}

export interface AgentChatProps {
  className?: string;
  slots?: AgentChatSlots;
}

export function AgentChat({ className, slots }: AgentChatProps = {}) {
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
        <AgentUsage />
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
            <AgentRunControls />
            <AgentComposer threadId={threadId} />
          </>
        ) : (
          <div className="aui-empty">
            <button className="aui-button" onClick={() => void startThread()}>
              Start thread
            </button>
          </div>
        )}
      </div>
    </section>
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

export function AgentRunControls() {
  const { models, refreshModels } = useAgentModels();
  const {
    executionModes,
    runSettings,
    setEffort,
    setExecutionMode,
    setModelId,
    supportedEfforts,
  } = useAgentRunSettings();

  useEffect(() => {
    if (models.length === 0) void refreshModels().catch(() => undefined);
  }, [models.length, refreshModels]);

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
              {model.name ?? model.id}
            </option>
          ))}
        </select>
      </label>
      <label className="aui-field">
        <span>Effort</span>
        <select
          aria-label="Effort"
          onChange={(event) => setEffort(event.currentTarget.value)}
          value={runSettings.effort ?? ""}
        >
          <option value="">Model default</option>
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
  const { approvals, approve, reject } = useAgentApprovals(threadId);
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
              onReject={() => void reject(approval.id)}
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
          Reject
        </button>
      </div>
    </article>
  );
}

export function AgentDiffViewer({ patch }: { patch: unknown }) {
  return (
    <pre className="aui-diff">
      {typeof patch === "string" ? patch : JSON.stringify(patch, null, 2)}
    </pre>
  );
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
  return (
    <header className="aui-status">
      <div className="aui-brand">
        <strong>Agent UI</strong>
        <span>{account.status}</span>
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
      {account.status !== "authenticated" ? (
        <button className="aui-button" onClick={() => void login()} type="button">
          Login
        </button>
      ) : null}
    </header>
  );
}

export function AgentUsage() {
  const { rateLimits, refreshUsage } = useAgentUsage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const windows = useMemo(() => normalizeUsageWindows(rateLimits), [rateLimits]);
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
  const history = useAgentThreadHistory();
  const { readThread } = useAgentThreadReader();
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <aside className="aui-sidebar">
      <div className="aui-sidebar-title">Threads</div>
      <form
        className="aui-history-controls"
        onSubmit={(event) => {
          event.preventDefault();
          void history.listThreads({ searchTerm });
        }}
      >
        <input
          aria-label="Search history"
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          placeholder="Search history"
          type="search"
          value={searchTerm}
        />
        <button className="aui-button aui-button-secondary" disabled={history.isLoading} type="submit">
          {history.isLoading ? "Loading" : "Load"}
        </button>
      </form>
      {history.error ? <p className="aui-sidebar-error">{history.error.message}</p> : null}
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
  if (approval.kind === "fileChangeApproval") return { decision: "approved" };
  return { decision: "approved" };
}
