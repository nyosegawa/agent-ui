import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentMessageList,
  AgentProvider,
  useAgentComposerController,
  useAgentThreadController,
} from "@nyosegawa/agent-ui-react";

function HostOwnedComposer() {
  const thread = useAgentThreadController();
  const composer = useAgentComposerController(thread.threadId);

  return (
    <main>
      <section aria-label="Transcript">
        {thread.thread ? <AgentMessageList thread={thread.thread} /> : null}
      </section>
      <footer>
        <textarea
          aria-label="Message"
          disabled={!thread.thread}
          onChange={(event) => composer.setValue(event.currentTarget.value)}
          value={composer.value}
        />
        <div role="toolbar" aria-label="Composer controls">
          <button
            disabled={!thread.thread || !composer.canSubmit}
            onClick={() => void composer.submit()}
            type="button"
          >
            Send from host toolbar
          </button>
          {composer.isRunning ? (
            <button onClick={() => void composer.stop()} type="button">
              Stop
            </button>
          ) : null}
        </div>
      </footer>
    </main>
  );
}

export function HostOwnedComposerExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <HostOwnedComposer />
    </AgentProvider>
  );
}
