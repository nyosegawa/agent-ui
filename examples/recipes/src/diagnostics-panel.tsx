import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentDiagnosticsPanel,
  AgentStatusSummary,
} from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentBootstrap,
} from "@nyosegawa/agent-ui-react/headless";

function DiagnosticsPanelRecipe() {
  const bootstrap = useAgentBootstrap();

  return (
    <aside aria-label="Agent diagnostics">
      <AgentStatusSummary />
      <AgentDiagnosticsPanel bootstrap={bootstrap} />
    </aside>
  );
}

export function DiagnosticsPanelExample({ transport }: { transport: AgentTransport }) {
  return (
    <AgentProvider transport={transport}>
      <DiagnosticsPanelRecipe />
    </AgentProvider>
  );
}
