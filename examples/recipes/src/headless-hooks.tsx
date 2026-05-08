import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentProvider,
  useAgentApprovals,
  useAgentComposer,
  useAgentThread,
  useAgentThreads,
} from "@nyosegawa/agent-ui-react";

function HeadlessThreadView() {
  const { activeThreadId, setActiveThread, threads } = useAgentThreads();
  const { thread, turns, startThread } = useAgentThread(activeThreadId);
  const composer = useAgentComposer(activeThreadId);
  const { approvals, approve, reject } = useAgentApprovals(activeThreadId);

  return (
    <main>
      <aside>
        {threads.map((entry) => (
          <button key={entry.thread.id} onClick={() => setActiveThread(entry.thread.id)}>
            {entry.thread.name ?? entry.thread.id}
          </button>
        ))}
        <button onClick={() => void startThread()}>New thread</button>
      </aside>
      <section>
        <h1>{thread?.thread.name ?? "No thread"}</h1>
        {turns.map((turn) =>
          turn ? (
            <ol key={turn.turn.id}>
              {turn.itemOrder.map((itemId) => (
                <li key={itemId}>
                  {turn.items[itemId]?.text ?? turn.streamingTextByItemId[itemId]}
                </li>
              ))}
            </ol>
          ) : null,
        )}
        {approvals.map((approval) => (
          <div key={String(approval.id)}>
            <pre>{JSON.stringify(approval.payload, null, 2)}</pre>
            <button onClick={() => void approve(approval.id)}>Approve</button>
            <button onClick={() => void reject(approval.id)}>Reject</button>
          </div>
        ))}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void composer.submit();
          }}
        >
          <input
            aria-label="Message"
            onChange={(event) => composer.setValue(event.currentTarget.value)}
            value={composer.value}
          />
          <button>Send</button>
        </form>
      </section>
    </main>
  );
}

export function HeadlessHooksExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <HeadlessThreadView />
    </AgentProvider>
  );
}
