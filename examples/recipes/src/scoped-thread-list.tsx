import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentProvider } from "@nyosegawa/agent-ui-react";
import { AgentThreadView } from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentThreadController,
  useAgentThreadListController,
} from "@nyosegawa/agent-ui-react/headless";

const projectCwd = "/Users/example/project";

function ScopedThreadList() {
  const threadController = useAgentThreadController();
  const threadList = useAgentThreadListController({
    cwd: projectCwd,
    key: "project-history",
    kind: "history",
  });
  const refresh = () => {
    void threadList.refresh();
  };
  const loadNextPage = () => {
    void threadList.loadNextPage();
  };
  const resume = (threadId: string) => {
    void threadList.resumeThread(threadId, {
      cwd: projectCwd,
    });
  };

  return (
    <main>
      <aside aria-label="Project threads">
        <input
          aria-label="Search project history"
          onChange={(event) => threadList.setSearchTerm(event.currentTarget.value)}
          value={threadList.searchTerm}
        />
        <button disabled={threadList.isLoading} onClick={refresh} type="button">
          Refresh
        </button>
        {threadList.threads.map((entry) => (
          <button
            key={entry.id}
            onClick={() => resume(entry.id)}
            type="button"
          >
            {entry.title}
          </button>
        ))}
        {threadList.nextCursor ? (
          <button
            disabled={threadList.isLoading}
            onClick={loadNextPage}
            type="button"
          >
            Load more
          </button>
        ) : null}
        {threadList.error ? <p role="status">{threadList.error.message}</p> : null}
      </aside>
      <AgentThreadView threadId={threadController.threadId} />
    </main>
  );
}

export function ScopedThreadListExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <ScopedThreadList />
    </AgentProvider>
  );
}
