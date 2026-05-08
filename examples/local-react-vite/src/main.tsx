import { FakeAgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const transport = new FakeAgentTransport();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AgentProvider transport={transport}>
      <main style={{ margin: "40px auto", maxWidth: 900 }}>
        <AgentChat />
      </main>
    </AgentProvider>
  </StrictMode>,
);
