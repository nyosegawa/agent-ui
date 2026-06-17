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

interface SupportTicket {
  account: string;
  assistantBrief: string;
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
  threadId: string;
  userPrompt: string;
}

const supportTickets: SupportTicket[] = [
  {
    account: "Northstar Logistics",
    assistantBrief:
      "Likely cause: a billing export filter mismatch. Draft reply: prepare a corrected CSV, verify the row count, and keep raw invoice IDs in the host helpdesk record.",
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
    threadId: "thread-support-sup-2048",
    userPrompt: "Summarize SUP-2048 and prepare a support-safe reply draft.",
  },
  {
    account: "Atlas Health",
    assistantBrief:
      "Likely cause: reconnect state is replaying stale macro cache entries. Draft reply: acknowledge the duplicate suggestions and say support is comparing reconnect logs with cache updates.",
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
    threadId: "thread-support-sup-2051",
    userPrompt: "Summarize SUP-2051 without exposing patient or CRM fields.",
  },
  {
    account: "Cedar Retail",
    assistantBrief:
      "The EU catalog sync completed overnight. Draft reply: confirm the successful sync and note that the host dashboard lag is being checked separately.",
    auditTrail: [
      "Customer tier read from host billing system",
      "Helpdesk timeline retained in the CRM record",
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
    threadId: "thread-support-sup-2054",
    userPrompt: "Confirm the catalog sync status and keep order details out of the response.",
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
          <span className="aui-support-kicker">Support operations</span>
          <h1>Support console</h1>
          <p>
            A support workspace embeds Codex assistance beside selected ticket
            context. Queue state, tenant data, reply review, CRM links, PII
            policy, and audit logging stay under the team's controls.
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
                <span>CRM record</span>
              </div>
              <div className="aui-support-thread">
                <p>
                  <strong>{selectedTicket.customer}</strong>
                  <span>{selectedTicket.lastMessage}</span>
                </p>
                <p className="aui-support-note">
                  <strong>Support note</strong>
                  <span>
                    Codex can help draft investigation steps, while this timeline,
                    customer identity, and retention policy stay in the helpdesk.
                  </span>
                </p>
              </div>
            </section>

            <div className="aui-support-review-stack">
              <section aria-label="Reply review" className="aui-support-panel">
                <div className="aui-support-section-header">
                  <strong>Reply review</strong>
                  <span>{replySentCount === 1 ? "1 reply sent" : `${replySentCount} replies sent`}</span>
                </div>
                <p className="aui-support-reply">{selectedTicket.replyDraft}</p>
                <button className="aui-support-primary-action" onClick={onSendReply} type="button">
                  Send reviewed reply
                </button>
              </section>

              <section aria-label="Audit trail" className="aui-support-panel">
                <div className="aui-support-section-header">
                  <strong>Audit trail</strong>
                  <span>retained</span>
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

        <aside aria-label="Support assistant" className="aui-support-agent">
          <div className="aui-support-agent-header">
            <div>
              <span className="aui-support-kicker">Codex assistant</span>
              <h2>Investigation assistant</h2>
            </div>
            <span>{selectedTicket.id}</span>
          </div>
          <div className="aui-support-agent-chat">
            <AgentThreadView threadId={selectedTicket.threadId} />
          </div>
          <div className="aui-support-agent-context">
            <section aria-label="Agent status" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Status details</strong>
                <span>session</span>
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
                <span>2 connected</span>
              </div>
              <AgentAppsPanel threadId={selectedTicket.threadId} />
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
    onRequest(request, transport) {
      if (request.method === "account/read") {
        return { account: { email: "support-ops@example.com", planType: "pro" } };
      }
      if (request.method === "model/list") return { data: supportConsoleModels() };
      if (request.method === "account/rateLimits/read") return supportConsoleRateLimits();
      if (request.method === "thread/list") {
        return {
          data: supportTickets.map((ticket) => ({
            id: ticket.threadId,
            name: `${ticket.id} investigation`,
            preview: ticket.assistantBrief,
            status: { type: "loaded" },
          })),
          nextCursor: null,
        };
      }
      if (request.method === "turn/start") {
        const params = request.params as { input?: unknown; threadId?: string } | undefined;
        const threadId = params?.threadId ?? supportTickets[0]!.threadId;
        const ticket =
          supportTickets.find((candidate) => candidate.threadId === threadId) ??
          supportTickets[0]!;
        const turnId = `turn-support-follow-up-${request.id}`;
        const userItemId = `item-support-follow-up-user-${request.id}`;
        const agentItemId = `item-support-follow-up-agent-${request.id}`;
        const text = requestInputText(params);
        transport.push({
          event: {
            threadId,
            turn: { id: turnId, status: "running", threadId },
            type: "turn/started",
          },
          type: "event",
        });
        transport.push({
          event: {
            items: [
              {
                id: userItemId,
                kind: "userMessage",
                status: "completed",
                text,
                threadId,
                turnId,
              },
              {
                id: agentItemId,
                kind: "agentMessage",
                status: "completed",
                text: `Safe reply workflow updated for ${ticket.id}: customer data stays in the helpdesk, and the reviewed summary is ready for the next agent handoff.`,
                threadId,
                turnId,
              },
            ],
            threadId,
            turn: { id: turnId, status: "completed", threadId },
            type: "turn/completed",
          },
          type: "event",
        });
        return { turnId };
      }
      if (request.method === "app/list") {
        return { data: supportConsoleApps(), nextCursor: null };
      }
      return {};
    },
  });
}

function createSupportConsoleInitialState(): AgentSessionState {
  const state = createInitialAgentState();
  state.account = {
    account: { email: "support-ops@example.com", planType: "pro" },
    status: "authenticated",
  };
  state.usage.accountRateLimits = supportConsoleRateLimits();
  state.models = { models: supportConsoleModels(), selectedModelId: "support-assistant" };
  state.threadLifecycle.activeThreadId = supportTickets[0]!.threadId;
  state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = [
    ...supportTickets.map((ticket) => ticket.threadId),
  ];
  for (const ticket of supportTickets) {
    const turnId = `turn-${ticket.threadId}`;
    state.threads[ticket.threadId] = {
    activity: "idle",
    availability: "available",
    id: ticket.threadId,
    metadata: {
      title: `${ticket.id} investigation`,
    },
    operations: {},
    orderedTurnIds: [turnId],
    status: "ready",
    storage: "unknown",
    thread: {
      id: ticket.threadId,
      name: `${ticket.id} investigation`,
    },
    tokenUsage: {
      inputTokens: 1450,
      modelContextWindow: 10000,
      outputTokens: 420,
      totalTokens: 1870,
    },
    turns: {
      [turnId]: {
        blocksByItemId: {},
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: [`item-support-user-${ticket.id}`, `item-support-agent-${ticket.id}`],
        items: {
          [`item-support-agent-${ticket.id}`]: {
            id: `item-support-agent-${ticket.id}`,
            kind: "agentMessage",
            status: "completed",
            text: ticket.assistantBrief,
            threadId: ticket.threadId,
            turnId,
          },
          [`item-support-user-${ticket.id}`]: {
            id: `item-support-user-${ticket.id}`,
            kind: "userMessage",
            status: "completed",
            text: ticket.userPrompt,
            threadId: ticket.threadId,
            turnId,
          },
        },
        streamingTextByItemId: {},
        turn: { id: turnId, status: "completed", threadId: ticket.threadId },
      },
    },
	  };
    state.apps.byScope[ticket.threadId] = {
      apps: supportConsoleApps(),
      nextCursor: null,
      threadId: ticket.threadId,
    };
  }
  return state;
}

function supportConsoleApps() {
  return [
    {
      accessible: true,
      enabled: true,
      id: "salesforce",
      installUrl: "app://salesforce",
      name: "Salesforce",
    },
    {
      accessible: true,
      enabled: false,
      id: "linear",
      installUrl: "app://linear",
      name: "Linear",
    },
  ];
}

function supportConsoleModels() {
  return [
    {
      defaultReasoningEffort: "medium",
      displayName: "Support assistant",
      id: "support-assistant",
      name: "Support assistant",
      supportedReasoningEfforts: ["medium", "high"],
    },
  ];
}

function supportConsoleRateLimits() {
  return {
    rateLimits: {
      limitName: "Support assistant",
      primary: {
        resetsAt: "2026-07-09T12:00:00.000Z",
        usedPercent: 12,
        windowDurationMins: 300,
      },
      secondary: {
        resetsAt: "2026-07-12T12:00:00.000Z",
        usedPercent: 34,
        windowDurationMins: 10080,
      },
    },
  };
}

function requestInputText(params: { input?: unknown } | undefined): string {
  const input = params?.input;
  if (typeof input === "string") return input;
  if (!Array.isArray(input)) return "";
  return input
    .map((item) =>
      item && typeof item === "object" && "text" in item
        ? String((item as { text?: unknown }).text ?? "")
        : "",
    )
    .filter(Boolean)
    .join("\n");
}
