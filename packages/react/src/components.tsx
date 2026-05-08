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
  useAgentThread,
  useAgentThreads,
} from "./hooks";

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
        {thread ? (
          <>
            <div className="aui-thread-header">
              <div>
                <h1>{thread.thread.name ?? "Untitled thread"}</h1>
                <p>{thread.thread.path ?? thread.thread.id}</p>
              </div>
              <span className="aui-status-pill" data-status={thread.status}>
                {thread.status}
              </span>
            </div>
            <AgentMessageList renderItem={slots?.renderItem} thread={thread} />
            <AgentWorkLog thread={thread} />
            <AgentDiffPanel thread={thread} />
            <AgentApprovalPrompt renderApproval={slots?.renderApproval} threadId={threadId} />
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
      {account.status !== "authenticated" ? (
        <button className="aui-button" onClick={() => void login()} type="button">
          Login
        </button>
      ) : null}
    </header>
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
  return (
    <aside className="aui-sidebar">
      <div className="aui-sidebar-title">Threads</div>
      <ThreadList
        activeThreadId={activeThreadId}
        onSelectThread={onSelectThread}
        threads={threads}
      />
    </aside>
  );
}

function approvalResult(approval: PendingServerRequest) {
  if (approval.kind === "fileChangeApproval") return { decision: "approved" };
  return { decision: "approved" };
}
