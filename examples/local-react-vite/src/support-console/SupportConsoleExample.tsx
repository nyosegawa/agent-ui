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
  AgentThreadView,
  useAgentBootstrap,
} from "@nyosegawa/agent-ui-react";
import { useMemo, useState } from "react";

interface SupportTicket {
  account: string;
  assistantBrief: string;
  auditTrail: string[];
  channel: string;
  customer: string;
  id: string;
  impact: string;
  internalNote: string;
  lastMessage: string;
  nextAction: string;
  owner: string;
  policyChecks: string[];
  piiPolicy: string;
  priority: "urgent" | "high" | "normal";
  priorityLabel: string;
  productArea: string;
  replyDraft: string;
  risk: string;
  sla: string;
  status: "waiting" | "investigating" | "ready";
  statusLabel: string;
  subject: string;
  tier: string;
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
    channel: "Email",
    customer: "Ari Kim",
    id: "SUP-2048",
    impact: "Invoice exports are missing billable rows for a priority account.",
    internalNote:
      "Billing export job EXP-4417 and the CRM case remain in the helpdesk. The assistant receives only the redacted issue summary and approved investigation notes.",
    lastMessage: "The export job finished but the invoice CSV is missing three rows.",
    nextAction: "Verify corrected CSV row count",
    owner: "Mika",
    policyChecks: ["PII redacted", "CRM linked", "Lead review"],
    piiPolicy: "Redact emails, phone numbers, and invoice IDs before sending context.",
    priority: "urgent",
    priorityLabel: "Urgent",
    productArea: "Billing exports",
    replyDraft:
      "We found the export filter mismatch and are preparing a corrected CSV for review.",
    risk: "Billing data mismatch",
    sla: "42 min remaining",
    status: "investigating",
    statusLabel: "Lead review",
    subject: "Invoice export dropped rows",
    tier: "Enterprise",
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
    channel: "In-app chat",
    customer: "Nora Patel",
    id: "SUP-2051",
    impact: "Support agents may send duplicate macro guidance after reconnect.",
    internalNote:
      "Reconnect logs and incident INC-118 stay in the helpdesk. Codex receives the symptom pattern, cache timing, and approved support-safe summary only.",
    lastMessage: "Agents see duplicate macro suggestions after reconnecting.",
    nextAction: "Compare reconnect logs",
    owner: "Jon",
    policyChecks: ["PHI withheld", "Incident linked", "Readonly scope"],
    piiPolicy: "Share symptom summary only; patient fields stay in the CRM.",
    priority: "high",
    priorityLabel: "High",
    productArea: "Agent workspace",
    replyDraft:
      "We are comparing reconnect events with macro cache updates before suggesting a workaround.",
    risk: "Agent productivity regression",
    sla: "2h 10m remaining",
    status: "waiting",
    statusLabel: "Needs evidence",
    subject: "Duplicate macros after reconnect",
    tier: "Healthcare",
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
    channel: "Email",
    customer: "Eli Morgan",
    id: "SUP-2054",
    impact: "Customer needs a clear confirmation before regional catalog review.",
    internalNote:
      "Catalog sync metadata is safe to summarize. Order details and regional customer records remain in the host dashboard.",
    lastMessage: "Can we confirm whether the EU catalog sync ran last night?",
    nextAction: "Send confirmation",
    owner: "Rin",
    policyChecks: ["Order data withheld", "Tier verified", "Internal note"],
    piiPolicy: "Catalog IDs are allowed; customer order details are not.",
    priority: "normal",
    priorityLabel: "Normal",
    productArea: "Catalog sync",
    replyDraft:
      "The EU sync completed at 02:14 UTC; we are checking why the dashboard lagged.",
    risk: "Low risk confirmation",
    sla: "Next business day",
    status: "ready",
    statusLabel: "Ready to send",
    subject: "Catalog sync confirmation",
    tier: "Business",
    threadId: "thread-support-sup-2054",
    userPrompt: "Confirm the catalog sync status and keep order details out of the response.",
  },
];

export function SupportConsoleExample() {
  const [selectedTicketId, setSelectedTicketId] = useState(supportTickets[0]!.id);
  const [queueFilter, setQueueFilter] = useState<"all" | SupportTicket["priority"]>(
    "all",
  );
  const [replySentCounts, setReplySentCounts] = useState<Record<string, number>>({});
  const visibleTickets =
    queueFilter === "all"
      ? supportTickets
      : supportTickets.filter((ticket) => ticket.priority === queueFilter);
  const selectedTicket =
    supportTickets.find((ticket) => ticket.id === selectedTicketId) ??
    supportTickets[0]!;
  const handleSelectQueueFilter = (nextFilter: "all" | SupportTicket["priority"]) => {
    setQueueFilter(nextFilter);
    const nextVisibleTickets =
      nextFilter === "all"
        ? supportTickets
        : supportTickets.filter((ticket) => ticket.priority === nextFilter);
    if (!nextVisibleTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(nextVisibleTickets[0]?.id ?? supportTickets[0]!.id);
    }
  };
  const transport = useMemo(() => createSupportConsoleTransport(), []);
  const initialState = useMemo(() => createSupportConsoleInitialState(), []);
  const replySentCount = replySentCounts[selectedTicket.id] ?? 0;

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <SupportConsoleShell
        onSelectTicket={setSelectedTicketId}
        onSelectQueueFilter={handleSelectQueueFilter}
        onSendReply={() =>
          setReplySentCounts((counts) => ({
            ...counts,
            [selectedTicket.id]: (counts[selectedTicket.id] ?? 0) + 1,
          }))
        }
        replySentCount={replySentCount}
        queueFilter={queueFilter}
        selectedTicket={selectedTicket}
        selectedTicketId={selectedTicketId}
        visibleTickets={visibleTickets}
      />
    </AgentProvider>
  );
}

function SupportConsoleShell({
  onSelectTicket,
  onSelectQueueFilter,
  onSendReply,
  replySentCount,
  queueFilter,
  selectedTicket,
  selectedTicketId,
  visibleTickets,
}: {
  onSelectTicket: (ticketId: string) => void;
  onSelectQueueFilter: (filter: "all" | SupportTicket["priority"]) => void;
  onSendReply: () => void;
  replySentCount: number;
  queueFilter: "all" | SupportTicket["priority"];
  selectedTicket: SupportTicket;
  selectedTicketId: string;
  visibleTickets: SupportTicket[];
}) {
  const bootstrap = useAgentBootstrap();
  const workflowSteps = reviewWorkflowSteps(selectedTicket.status);
  return (
    <main className="aui-support-console" data-aui-theme="light">
      <header className="aui-support-console-header">
        <div>
          <span className="aui-support-kicker">Support operations</span>
          <h1>Support reply desk</h1>
          <p>
            Triage priority cases, review redaction, and send approved customer
            replies from a host-owned support workspace with Codex embedded where
            it helps.
          </p>
          <div aria-label="Review workflow" className="aui-support-workflow-steps">
            {workflowSteps.map((step) => (
              <span data-state={step.state} key={step.label}>
                {step.label}
              </span>
            ))}
          </div>
        </div>
        <div className="aui-support-header-status">
          <div className="aui-support-header-metric">
            <span>Queue</span>
            <strong>{supportTickets.length} open</strong>
          </div>
          <div className="aui-support-header-metric">
            <span>SLA</span>
            <strong>{selectedTicket.sla}</strong>
          </div>
          <div className="aui-support-header-metric">
            <span>Approval</span>
            <strong>{selectedTicket.statusLabel}</strong>
          </div>
          <div className="aui-support-header-metric">
            <span>Risk</span>
            <strong>{selectedTicket.risk}</strong>
          </div>
        </div>
      </header>

      <div className="aui-support-console-grid" data-testid="support-console-shell">
        <aside aria-label="Ticket queue" className="aui-support-queue">
          <div className="aui-support-section-header">
            <strong>Ticket queue</strong>
            <span>{visibleTickets.length} shown</span>
          </div>
          <div aria-label="Queue filters" className="aui-support-filter-row">
            <button
              aria-pressed={queueFilter === "all"}
              onClick={() => onSelectQueueFilter("all")}
              type="button"
            >
              All
            </button>
            <button
              aria-pressed={queueFilter === "urgent"}
              onClick={() => onSelectQueueFilter("urgent")}
              type="button"
            >
              Urgent
            </button>
            <button
              aria-pressed={queueFilter === "high"}
              onClick={() => onSelectQueueFilter("high")}
              type="button"
            >
              High
            </button>
            <button
              aria-pressed={queueFilter === "normal"}
              onClick={() => onSelectQueueFilter("normal")}
              type="button"
            >
              Normal
            </button>
          </div>
          <div className="aui-support-ticket-list">
            {visibleTickets.map((ticket) => (
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
                  <span>{ticket.priorityLabel}</span>
                </span>
                <span className="aui-support-ticket-subject">{ticket.subject}</span>
                <span className="aui-support-ticket-meta">
                  {ticket.owner} · {ticket.sla}
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
              {selectedTicket.statusLabel}
            </span>
          </header>

          <section aria-label="Case readiness" className="aui-support-readiness">
            <div>
              <span className="aui-support-kicker">Customer impact</span>
              <strong>{selectedTicket.impact}</strong>
            </div>
            <div>
              <span className="aui-support-kicker">Review status</span>
              <strong>{selectedTicket.statusLabel}</strong>
            </div>
            <div>
              <span className="aui-support-kicker">SLA</span>
              <strong>{selectedTicket.sla}</strong>
            </div>
          </section>

          <dl className="aui-support-summary-grid">
            <HostFact label="Customer" value={selectedTicket.customer} />
            <HostFact label="Account" value={selectedTicket.account} />
            <HostFact label="Owner" value={selectedTicket.owner} />
            <HostFact label="Channel" value={selectedTicket.channel} />
            <HostFact label="Tier" value={selectedTicket.tier} />
            <HostFact label="Product" value={selectedTicket.productArea} />
          </dl>

          <section aria-label="Response plan" className="aui-support-response-plan">
            <div>
              <span className="aui-support-kicker">Next action</span>
              <strong>{selectedTicket.nextAction}</strong>
            </div>
            <div>
              <span className="aui-support-kicker">PII policy</span>
              <strong>{selectedTicket.piiPolicy}</strong>
            </div>
          </section>

          <div className="aui-support-workflow-grid">
            <div className="aui-support-review-stack">
              <section aria-label="Reply review" className="aui-support-panel">
                <div className="aui-support-section-header">
                  <strong>Reply review</strong>
                  <span>{replySentCount === 1 ? "1 reply sent" : `${replySentCount} replies sent`}</span>
                </div>
                <div aria-label="Policy checks" className="aui-support-check-row">
                  {selectedTicket.policyChecks.map((check) => (
                    <span key={check}>{check}</span>
                  ))}
                </div>
                <div className="aui-support-reply-box">
                  <span>Reviewed customer response</span>
                  <p className="aui-support-reply">{selectedTicket.replyDraft}</p>
                </div>
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

            <section aria-label="Conversation detail" className="aui-support-panel">
              <div className="aui-support-section-header">
                <strong>Case timeline</strong>
                <span>CRM record</span>
              </div>
              <div className="aui-support-thread">
                <p>
                  <strong>{selectedTicket.customer}</strong>
                  <span>{selectedTicket.lastMessage}</span>
                </p>
                <p className="aui-support-note">
                  <strong>Internal note</strong>
                  <span>
                    {selectedTicket.internalNote}
                  </span>
                </p>
              </div>
            </section>
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
            <details aria-label="Agent status" className="aui-support-disclosure">
              <summary>
                <strong>Status details</strong>
                <span>session</span>
              </summary>
              <AgentStatusDetails />
            </details>
            <details aria-label="Agent diagnostics" className="aui-support-disclosure">
              <summary>
                <strong>Diagnostics</strong>
                <span>redacted</span>
              </summary>
              <AgentDiagnosticsPanel bootstrap={bootstrap} />
            </details>
            <details aria-label="Codex apps" className="aui-support-disclosure">
              <summary>
                <strong>Codex apps</strong>
                <span>available</span>
              </summary>
              <AgentAppsPanel threadId={selectedTicket.threadId} />
            </details>
          </div>
        </aside>
      </div>
    </main>
  );
}

function HostFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="aui-support-fact">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function reviewWorkflowSteps(status: SupportTicket["status"]) {
  const currentIndexByStatus: Record<SupportTicket["status"], number> = {
    investigating: 2,
    ready: 3,
    waiting: 1,
  };
  const currentIndex = currentIndexByStatus[status];
  return ["Review", "Evidence", "Lead approval", "Send"].map((label, index) => ({
    label,
    state:
      index < currentIndex ? "complete" : index === currentIndex ? "current" : undefined,
  }));
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
