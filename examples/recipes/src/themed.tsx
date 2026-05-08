import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import "./themed.css";

export function ThemedExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat className="agent-ui-compact-theme" />
    </AgentProvider>
  );
}
