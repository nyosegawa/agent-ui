import type { PendingServerRequest, ThreadState, TurnState } from "@nyosegawa/agent-ui-core";
import { useAgentApprovals, useAgentAuth, useAgentComposer, useAgentThread } from "./hooks";

export function AgentChat() {
  const { thread, threadId, startThread } = useAgentThread();
  return (
    <section className="aui-chat" data-testid="agent-chat">
      <AgentStatusBar />
      {thread ? (
        <>
          <AgentMessageList thread={thread} />
          <AgentWorkLog thread={thread} />
          <AgentApprovalPrompt threadId={threadId} />
          <AgentComposer threadId={threadId} />
        </>
      ) : (
        <button className="aui-button" onClick={() => void startThread()}>
          Start thread
        </button>
      )}
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

export function AgentMessageList({ thread }: { thread: ThreadState }) {
  return (
    <ol className="aui-message-list">
      {thread.orderedTurnIds.map((turnId) => {
        const turn = thread.turns[turnId];
        return turn ? <AgentTurnView key={turnId} turn={turn} /> : null;
      })}
    </ol>
  );
}

function AgentTurnView({ turn }: { turn: TurnState }) {
  return (
    <li className="aui-turn">
      {turn.itemOrder.map((itemId) => {
        const item = turn.items[itemId];
        const text = item?.text ?? turn.streamingTextByItemId[itemId];
        if (!item && !text) return null;
        return (
          <article className="aui-message" data-kind={item?.kind ?? "stream"} key={itemId}>
            {text}
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
          {output}
        </pre>
      ))}
    </section>
  );
}

export function AgentApprovalPrompt({ threadId }: { threadId?: string }) {
  const { approvals, approve, reject } = useAgentApprovals(threadId);
  if (approvals.length === 0) return null;
  return (
    <section className="aui-approvals" aria-label="Pending approvals">
      {approvals.map((approval) => (
        <ApprovalCard
          approval={approval}
          key={String(approval.id)}
          onApprove={() => void approve(approval.id)}
          onReject={() => void reject(approval.id)}
        />
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
  return (
    <article className="aui-approval">
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
  return <pre className="aui-diff">{typeof patch === "string" ? patch : JSON.stringify(patch, null, 2)}</pre>;
}

export function AgentStatusBar() {
  const { account, login } = useAgentAuth();
  return (
    <header className="aui-status">
      <span>{account.status}</span>
      {account.status !== "authenticated" ? (
        <button className="aui-button" onClick={() => void login()} type="button">
          Login
        </button>
      ) : null}
    </header>
  );
}

export function ThreadList({ threads }: { threads: ThreadState[] }) {
  return (
    <nav className="aui-thread-list" aria-label="Threads">
      {threads.map((thread) => (
        <button className="aui-thread-list-item" key={thread.thread.id} type="button">
          {thread.thread.name ?? thread.thread.id}
        </button>
      ))}
    </nav>
  );
}

export function ThreadSidebar({ threads }: { threads: ThreadState[] }) {
  return (
    <aside className="aui-sidebar">
      <ThreadList threads={threads} />
    </aside>
  );
}
