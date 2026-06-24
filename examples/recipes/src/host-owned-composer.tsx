import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentProvider } from "@nyosegawa/agent-ui-react";
import { AgentMessageList } from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentComposerController,
  useAgentThreadController,
} from "@nyosegawa/agent-ui-react/headless";

function HostOwnedComposer() {
  const thread = useAgentThreadController();
  const composer = useAgentComposerController(thread.threadId);

  return (
    <main>
      <section aria-label="Transcript">
        {thread.threadId ? <AgentMessageList threadId={thread.threadId} /> : null}
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
