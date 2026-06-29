import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  useAgentComposerController,
  useAgentThreadController,
  useAgentThreadHistory,
} from "@nyosegawa/agent-ui-react/headless";

function HeadlessChatController() {
  const history = useAgentThreadHistory();
  const thread = useAgentThreadController();
  const composer = useAgentComposerController(thread.threadId);

  return (
    <main>
      <aside aria-label="Thread history">
        <button onClick={() => void history.listThreads()} type="button">
          Refresh
        </button>
        {history.threads.map((entry) => (
          <button
            key={entry.id}
            onClick={() => thread.resumeThread(entry.id)}
            type="button"
          >
            {entry.title || entry.subtitle || entry.id}
          </button>
        ))}
        <button onClick={() => void thread.startThread()} type="button">
          New thread
        </button>
      </aside>
      <section aria-label="Active thread">
        <h1>{thread.thread?.title || "No thread"}</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void composer.submit();
          }}
        >
          <textarea
            aria-label="Message"
            disabled={!thread.thread}
            onChange={(event) => composer.setValue(event.currentTarget.value)}
            value={composer.value}
          />
          <button disabled={!thread.thread || !composer.canSubmit} type="submit">
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

export function HeadlessChatControllerExample({
  transport,
}: {
  transport: AgentTransport;
}) {
  return (
    <AgentProvider transport={transport}>
      <HeadlessChatController />
    </AgentProvider>
  );
}
