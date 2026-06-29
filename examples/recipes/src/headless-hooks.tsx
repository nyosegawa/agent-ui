import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentComposerPanel,
  AgentThreadTimeline,
} from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentThreadController,
  useAgentThreadListController,
} from "@nyosegawa/agent-ui-react/headless";

function HeadlessThreadView() {
  const threadController = useAgentThreadController();
  const history = useAgentThreadListController({ kind: "history", key: "recipe" });

  return (
    <main>
      <aside aria-label="Thread history">
        <button onClick={() => void history.refresh()} type="button">
          Refresh
        </button>
        {history.threads.map((entry) => (
          <button
            key={entry.id}
            onClick={() => void history.resumeThread(entry.id)}
            type="button"
          >
            {entry.title || entry.subtitle || entry.id}
          </button>
        ))}
        {history.nextCursor ? (
          <button onClick={() => void history.loadNextPage()} type="button">
            More
          </button>
        ) : null}
        <button onClick={() => void threadController.startThread()} type="button">
          New thread
        </button>
      </aside>
      <section aria-label="Active thread">
        <h1>
          {threadController.thread?.metadata.title ??
            threadController.thread?.thread.name ??
            "No thread"}
        </h1>
        {threadController.threadId ? (
          <>
            <AgentThreadTimeline threadId={threadController.threadId} />
            {threadController.thread ? (
              <AgentComposerPanel
                thread={threadController.thread}
                threadId={threadController.threadId}
              />
            ) : null}
          </>
        ) : null}
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
