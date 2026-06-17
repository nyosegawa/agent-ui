import {
  createInitialAgentState,
  FakeAgentTransport,
  type AgentSessionState,
} from "@nyosegawa/agent-ui-core";
import {
  AgentAppsPanel,
  AgentDiagnosticsPanel,
  AgentProvider,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentThreadView,
  AgentUsageSummary,
  useAgentBootstrap,
} from "@nyosegawa/agent-ui-react";
import { useMemo, useState } from "react";
import { fixtureModels, fixtureRateLimits } from "../fixtures/demo-state";

interface SupportTicket {
  account: string;
  auditTrail: string[];
  customer: string;
  id: string;
  lastMessage: string;
  owner: string;
  piiPolicy: string;
  priority: "urgent" | "high" | "normal";
  productArea: string;
  replyDraft: string;
  status: "waiting" | "investigating" | "ready";
  subject: string;
  tenant: string;
}

const supportThreadId = "thread-support-console";
const supportTurnId = "turn-support-console";

const supportTickets: SupportTicket[] = [
  {
    account: "Northstar Logistics",
    auditTrail: [
      "PII fields redacted before Codex context",
      "CRM case SF-2091 linked by host workflow",
      "Reply draft requires support lead review",
    ],
    customer: "Ari Kim",
    id: "SUP-2048",
    lastMessage: "The export job finished but the invoice CSV is missing three rows.",
    owner: "Mika",
    piiPolicy: "Redact emails, phone numbers, and invoice IDs before sending context.",
    priority: "urgent",
    productArea: "Billing exports",
    replyDraft:
      "We found the export filter mismatch and are preparing a corrected CSV for review.",
    status: "investigating",
    subject: "Invoice export dropped rows",
    tenant: "workspace-northstar",
  },
  {
    account: "Atlas Health",
    auditTrail: [
      "Workspace limited to support-readonly scope",
      "No attachments shared with Codex",
      "Escalation linked to incident INC-118",
    ],
    customer: "Nora Patel",
    id: "SUP-2051",
    lastMessage: "Agents see duplicate macro suggestions after reconnecting.",
    owner: "Jon",
    piiPolicy: "Share symptom summary only; patient fields stay in the CRM.",
    priority: "high",
    productArea: "Agent workspace",
    replyDraft:
      "We are comparing reconnect events with macro cache updates before suggesting a workaround.",
    status: "waiting",
    subject: "Duplicate macros after reconnect",
    tenant: "workspace-atlas-health",
  },
  {
    account: "Cedar Retail",
    auditTrail: [
      "Customer tier read from host billing system",
      "Helpdesk timeline retained outside Agent UI",
      "Codex output marked as internal note until reviewed",
    ],
    customer: "Eli Morgan",
    id: "SUP-2054",
    lastMessage: "Can we confirm whether the EU catalog sync ran last night?",
    owner: "Rin",
    piiPolicy: "Catalog IDs are allowed; customer order details are not.",
    priority: "normal",
    productArea: "Catalog sync",
    replyDraft:
      "The EU sync completed at 02:14 UTC; we are checking why the dashboard lagged.",
    status: "ready",
    subject: "Catalog sync confirmation",
    tenant: "workspace-cedar-retail",
  },
];

export function SupportConsoleExample() {
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0]!.id);
  const [replySentCount, setReplySentCount] = useState(0);
  const selectedTicket =
    supportTickets.find((ticket) => ticket.id === selectedTicketId) ??
    supportTickets[0]!;
  const transport = useMemo(() => createSupportConsoleTransport(), []);
  const initialState = useMemo(() => createSupportConsoleInitialState(), []);

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <SupportConsoleShell
        onSelectTicket={setSelectedTicketId}
        onSendReply={() => setReplySentCount((count) => count + 1)}
        replySentCount={replySentCount}
        selectedTicket={selectedTicket}
        selectedTicketId={selectedTicketId}
      />
    </AgentProvider>
  );
}

function SupportConsoleShell({
  onSelectTicket,
  onSendReply,
  replySentCount,
  selectedTicket,
  selectedTicketId,
}: {
  onSelectTicket: (ticketId: string) => void;
  onSendReply: () => void;
  replySentCount: number;
  selectedTicket: SupportTicket;
  selectedTicketId: string;
}) {
  const bootstrap = useAgentBootstrap();
  return (
    <main className="aui-support-console" data-aui-theme="light">
      <header className="aui-support-console-header">
        <div>
          <span className="aui-support-kicker">Fixture route · support SaaS</span>
          <h1>Support console</h1>
          <p>
            A host-owned inquiry desk embeds Agent UI beside deterministic ticket
            context. The host owns queue state, tenant data, reply review, CRM
            links, PII policy, and audit logging.
          </p>
        </div>
        <div className="aui-support-header-status">
          <AgentStatusSummary />
          <AgentUsageSummary />
        </div>
      </header>

      <div className="aui-support-console-grid" data-testid="support-console-shell">
        <aside aria-label="Ticket queue" className="aui-support-queue">
          <div className="aui-support-section-header">
            <strong>Ticket queue</strong>
            <span>{supportTickets.length} open</span>
          </div>
          <div className="aui-support-ticket-list">
            {supportTickets.map((ticket) => (
              <button
                aria-pressed={ticket.id === selectedTicketId}
                className="aui-support-ticket"
                data-priority={ticket.priority}
                key={ticket.id}
                onClick={() => onSelectTicket(ticket.id)}
                type="button"
              >
                <span className="aui-support-ticket-row">
                  <strong>{ticket.id}</strong>
                  <span>{ticket.priority}</span>
                </span>
                <span className="aui-support-ticket-subject">{ticket.subject}</span>
                <span className="aui-support-ticket-meta">
                  {ticket.account} · {ticket.status}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section aria-label="Selected inquiry" className="aui-support-case">
          <header className="aui-support-case-header">
            <div>
              <span className="aui-support-kicker">{selectedTicket.id}</span>
              <h2>{selectedTicket.subject}</h2>
              <p>{selectedTicket.lastMessage}</p>
            </div>
            <span className="aui-support-state" data-state={selectedTicket.status}>
              {selectedTicket.status}
            </span>
          </header>

          <dl className="aui-support-case-grid">
            <HostFact label="Customer" value={selectedTicket.customer} />
            <HostFact label="Account" value={selectedTicket.account} />
            <HostFact label="Tenant" value={selectedTicket.tenant} />
            <HostFact label="Owner" value={selectedTicket.owner} />
            <HostFact label="Product area" value={selectedTicket.productArea} />
            <HostFact label="PII policy" value={selectedTicket.piiPolicy} />
          </dl>

          <div className="aui-support-workflow-grid">
            <section aria-label="Conversation detail" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Case detail</strong>
                <span>host CRM data</span>
              </div>
              <div className="aui-support-thread">
                <p>
                  <strong>{selectedTicket.customer}</strong>
                  <span>{selectedTicket.lastMessage}</span>
                </p>
                <p>
                  <strong>Support note</strong>
                  <span>
                    Agent UI can help draft investigation steps, but this timeline,
                    customer identity, and retention policy stay in the helpdesk.
                  </span>
                </p>
              </div>
            </section>

            <div className="aui-support-review-stack">
              <section aria-label="Reply review" className="aui-support-panel">
                <div className="aui-support-section-header">
                  <strong>Reply review</strong>
                  <span>{replySentCount} sent in fixture</span>
                </div>
                <p className="aui-support-reply">{selectedTicket.replyDraft}</p>
                <button className="aui-support-primary-action" onClick={onSendReply} type="button">
                  Send reviewed reply
                </button>
              </section>

              <section aria-label="Audit trail" className="aui-support-panel">
                <div className="aui-support-section-header">
                  <strong>Audit trail</strong>
                  <span>host retained</span>
                </div>
                <ul className="aui-support-audit-list">
                  {selectedTicket.auditTrail.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </section>

        <aside aria-label="Agent assistant pane" className="aui-support-agent">
          <div className="aui-support-agent-header">
            <div>
              <span className="aui-support-kicker">Agent UI owned</span>
              <h2>Assistant pane</h2>
            </div>
            <span>{selectedTicket.id}</span>
          </div>
          <div className="aui-support-agent-chat">
            <AgentThreadView threadId={supportThreadId} />
          </div>
          <div className="aui-support-agent-context">
            <section aria-label="Agent status" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Status details</strong>
                <span>scoped</span>
              </div>
              <AgentStatusDetails />
            </section>
            <section aria-label="Agent diagnostics" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Diagnostics</strong>
                <span>redacted</span>
              </div>
              <AgentDiagnosticsPanel bootstrap={bootstrap} />
            </section>
            <section aria-label="Helpdesk connectors" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Connectors</strong>
                <span>app/list</span>
              </div>
              <AgentAppsPanel threadId={supportThreadId} />
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}

function HostFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="aui-support-fact" data-wide={label === "PII policy" ? "true" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function createSupportConsoleTransport() {
  return new FakeAgentTransport({
    onRequest(request) {
      if (request.method === "account/read") {
        return { account: { email: "fixture@example.com", planType: "pro" } };
      }
      if (request.method === "model/list") return { data: fixtureModels() };
      if (request.method === "account/rateLimits/read") return fixtureRateLimits();
      if (request.method === "thread/list") {
        return {
          data: [
            {
              id: supportThreadId,
              name: "Invoice export investigation",
              preview: "Summarize evidence and draft a support-safe reply.",
              status: { type: "loaded" },
            },
          ],
          nextCursor: null,
        };
      }
      if (request.method === "app/list") {
        return {
          data: [
            {
              id: "salesforce",
              installUrl: "app://salesforce",
              isAccessible: true,
              isEnabled: true,
              name: "Salesforce",
            },
            {
              id: "linear",
              installUrl: "app://linear",
              isAccessible: true,
              isEnabled: false,
              name: "Linear",
            },
          ],
          nextCursor: null,
        };
      }
      return {};
    },
  });
}

function createSupportConsoleInitialState(): AgentSessionState {
  const state = createInitialAgentState();
  state.account = {
    account: { email: "fixture@example.com", planType: "pro" },
    status: "authenticated",
  };
  state.usage.accountRateLimits = fixtureRateLimits();
  state.models = { models: fixtureModels(), selectedModelId: "fixture-demo-model" };
  state.threadLifecycle.activeThreadId = supportThreadId;
  state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = [
    supportThreadId,
  ];
  state.threads[supportThreadId] = {
    activity: "idle",
    availability: "available",
    id: supportThreadId,
    metadata: {
      cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      title: "Invoice export investigation",
    },
    operations: {},
    orderedTurnIds: [supportTurnId],
    status: "ready",
    storage: "unknown",
    thread: {
      id: supportThreadId,
      name: "Invoice export investigation",
      path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    },
    tokenUsage: {
      inputTokens: 1450,
      modelContextWindow: 10000,
      outputTokens: 420,
      totalTokens: 1870,
    },
    turns: {
      [supportTurnId]: {
        blocksByItemId: {},
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: ["item-support-user", "item-support-agent-summary"],
        items: {
          "item-support-agent-summary": {
            id: "item-support-agent-summary",
            kind: "agentMessage",
            status: "completed",
            text:
              "Likely cause: a billing export filter mismatch. Draft reply: we are preparing a corrected CSV and will confirm the row count before sending it back. Customer identifiers and invoice IDs should stay in the host helpdesk record.",
            threadId: supportThreadId,
            turnId: supportTurnId,
          },
          "item-support-user": {
            id: "item-support-user",
            kind: "userMessage",
            status: "completed",
            text:
              "Summarize SUP-2048 and prepare a support-safe reply draft.",
            threadId: supportThreadId,
            turnId: supportTurnId,
          },
        },
        streamingTextByItemId: {},
        turn: { id: supportTurnId, status: "completed", threadId: supportThreadId },
      },
    },
  };
  return state;
}
