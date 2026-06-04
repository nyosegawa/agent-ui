import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentDiagnosticsPanel,
  AgentProvider,
  AgentStatusSummary,
  useAgentBootstrap,
} from "@nyosegawa/agent-ui-react";

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
