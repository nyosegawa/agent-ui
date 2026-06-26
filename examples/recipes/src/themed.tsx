import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentChat,
  AgentProvider,
} from "@nyosegawa/agent-ui-react";
import {
  AgentThemeToggle,
  type AgentTheme,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";
import { useState } from "react";
import "./themed.css";

export function ThemedExample({ transport }: { transport: AgentTransport }) {
  const [theme, setTheme] = useState<AgentTheme>("system");

  return (
    <AgentProvider transport={transport}>
      <section className="agent-ui-compact-theme" data-aui-theme={theme}>
        <div className="agent-ui-compact-theme-toolbar">
          <AgentThemeToggle value={theme} onChange={setTheme} />
        </div>
        <AgentChat />
      </section>
    </AgentProvider>
  );
}
