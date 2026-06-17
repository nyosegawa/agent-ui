import type { AgentTransport } from "@nyosegawa/agent-ui-core";
import {
  AgentDiagnosticsPanel,
  AgentProvider,
  AgentStatusSummary,
  AgentThreadView,
  AgentUsageSummary,
  useAgentBootstrap,
} from "@nyosegawa/agent-ui-react";

interface SupportConsoleTicket {
  customerName: string;
  id: string;
  piiPolicy: string;
  replyDraft: string;
  status: "waiting" | "investigating" | "ready";
  subject: string;
  tenantId: string;
  threadId: string;
}

function SupportConsole({ ticket }: { ticket: SupportConsoleTicket }) {
  const bootstrap = useAgentBootstrap();
  return (
    <main aria-label="Support console">
      <section aria-label="Host-owned case context">
        <h1>{ticket.subject}</h1>
        <dl>
          <div>
            <dt>Customer</dt>
            <dd>{ticket.customerName}</dd>
          </div>
          <div>
            <dt>Tenant</dt>
            <dd>{ticket.tenantId}</dd>
          </div>
          <div>
            <dt>PII policy</dt>
            <dd>{ticket.piiPolicy}</dd>
          </div>
        </dl>
        <form
          aria-label="Host reply review"
          onSubmit={(event) => {
            event.preventDefault();
            // Send reviewed replies through the host helpdesk, not Agent UI.
          }}
        >
          <textarea aria-label="Reply draft" defaultValue={ticket.replyDraft} />
          <button type="submit">Send reviewed reply</button>
        </form>
      </section>

      <aside aria-label="Agent-owned assistance">
        <AgentStatusSummary />
        <AgentUsageSummary />
        <AgentThreadView threadId={ticket.threadId} />
        <AgentDiagnosticsPanel bootstrap={bootstrap} />
      </aside>
    </main>
  );
}

export function SupportConsoleExample({
  ticket,
  transport,
}: {
  ticket: SupportConsoleTicket;
  transport: AgentTransport;
}) {
  return (
    <AgentProvider transport={transport}>
      <SupportConsole ticket={ticket} />
    </AgentProvider>
  );
}
