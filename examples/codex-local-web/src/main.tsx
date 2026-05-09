import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const transport = useMemo(
    () =>
      createCodexWebSocketTransport({
        initialize: {
          clientInfo: {
            name: "agent_ui_codex_local_web",
            title: "Agent UI Codex Local Web",
            version: "0.0.0",
          },
        },
        reconnect: {
          initialDelayMs: 500,
          maxAttempts: 5,
          maxDelayMs: 5000,
        },
        url: `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/agent-ui/ws`,
      }),
    [],
  );

  return (
    <AgentProvider transport={transport}>
      <main className="agent-ui-local-app">
        <AgentChat />
      </main>
    </AgentProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
