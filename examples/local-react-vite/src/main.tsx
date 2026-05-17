import {
  createInitialAgentState,
  FakeAgentTransport,
} from "@nyosegawa/agent-ui-core";
import {
  AgentAppsPanel,
  AgentChat,
  AgentComposerPanel,
  AgentCriticalNoticeList,
  AgentDiagnosticsPanel,
  AgentProvider,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadTimeline,
  AgentThreadView,
  AgentUsagePanel,
  AgentUsageSummary,
  normalizeUsageWindows,
  useAgentApprovals,
  useAgentBootstrap,
  useAgentThread,
  useAgentUsage,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
import { useMemo, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import "./styles/closeups.css";
import "./styles/fixture-gallery.css";
import "./styles/host-recipe.css";
import "./styles/usage-only.css";
import {
  ComponentCloseupGallery,
  CriticalInteractionStates,
} from "./closeups/ComponentCloseupGallery";
import { FixturePreview } from "./closeups/FixturePreview";
import {
  createDemoInitialState,
  createDemoTransport,
  createRichTranscriptInitialState,
  demoRateLimits,
} from "./fixtures/demo-state";
import {
  fixtureGroupLabels,
  groupFixtures,
  visualQaStates,
  type DemoScenario,
} from "./fixtures/gallery";

declare global {
  interface Window {
    __agentUiLocalReactViteRoot?: Root;
  }
}

function DemoApp() {
  if (window.location.pathname === "/app-connectors") return <AppConnectorsExample />;
  if (window.location.pathname === "/fixture-gallery") return <VisualQaIndex />;
  if (window.location.pathname === "/host-workflow-recipe") return <HostWorkflowRecipe />;
  if (window.location.pathname === "/qa") return <VisualQaIndex />;
  if (window.location.pathname === "/scoped-thread-pane") return <ScopedThreadPaneExample />;
  if (window.location.pathname === "/usage-only") return <UsageOnlyExample />;
  return <AgentDemo />;
}

function AgentDemo() {
  const demoState = useMemo(() => demoScenarioFromLocation(), []);
  const initialState = useMemo(() => createDemoInitialState(demoState), [demoState]);
  const transport = useMemo(() => createDemoTransport(demoState), [demoState]);

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main">
        <AgentChat diagnostics usage />
      </main>
    </AgentProvider>
  );
}

function VisualQaIndex() {
  const grouped = useMemo(() => groupFixtures(visualQaStates), []);
  return (
    <main className="aui-fixture-gallery">
      <div className="aui-fixture-gallery-header">
        <div>
          <h1>Agent UI visual QA</h1>
          <p>
            Primitive close-ups come first so each interactive component can be
            inspected without scrolling past iframes. Lifecycle and preset surfaces
            follow underneath for full-page comparison.
          </p>
        </div>
        <div className="aui-fixture-gallery-actions">
          <a href="#component-closeups">Component close-ups</a>
          <a href="#critical-states">Critical states</a>
          <a href="#preset-surfaces">Preset surfaces</a>
          <a href="#full-page-previews">Full-page previews</a>
        </div>
      </div>
      <ComponentCloseupGallery />
      <CriticalInteractionStates />
      {grouped.map(({ group, states }) => (
        <section
          className="aui-fixture-gallery-group"
          id={group === "core" ? "preset-surfaces" : group === "primitives" ? "primitive-compositions" : "full-page-previews"}
          key={group}
        >
          <header className="aui-fixture-gallery-group-header">
            <h2>{fixtureGroupLabels[group]}</h2>
            <span>{states.length} preview{states.length === 1 ? "" : "s"}</span>
          </header>
          <div className="aui-fixture-gallery-grid">
            {states.map((state) => (
              <FixturePreview state={state} key={state.href} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}


function ScopedThreadPaneExample() {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.activeThreadId = "thread-active";
    state.threads["thread-active"] = {
      orderedTurnIds: [],
      registryStatus: "live",
      status: "loaded",
      thread: { id: "thread-active", name: "Active host thread" },
      turns: {},
    };
    state.threads["thread-fixed"] = {
      orderedTurnIds: ["turn-fixed"],
      registryStatus: "live",
      status: "complete",
      thread: { id: "thread-fixed", name: "Scoped thread pane" },
      turns: {
        "turn-fixed": {
          blocksByItemId: {},
          commandOutputByItemId: {},
          filePatchByItemId: {},
          itemOrder: ["item-fixed"],
          items: {
            "item-fixed": {
              id: "item-fixed",
              kind: "agentMessage",
              status: "completed",
              text: "This pane stays locked to thread-fixed.",
              threadId: "thread-fixed",
              turnId: "turn-fixed",
            },
          },
          streamingTextByItemId: {},
          turn: { id: "turn-fixed", threadId: "thread-fixed" },
        },
      },
    };
    return state;
  }, []);
  return (
    <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
      <ExampleFrame title="Scoped thread pane">
        <AgentThreadView threadId="thread-fixed" />
      </ExampleFrame>
    </AgentProvider>
  );
}

function UsageOnlyExample() {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.account = {
      account: { email: "fixture@example.com", planType: "pro" },
      rateLimits: demoRateLimits(),
      status: "authenticated",
    };
    return state;
  }, []);
  return (
    <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
      <main className="aui-usage-only" aria-label="Usage primitive demo">
        <header className="aui-usage-only-header">
          <div>
            <span className="aui-usage-only-kicker">Primitive · usage</span>
            <h1>Drop the Codex usage primitive into any host surface</h1>
            <p>
              <code>AgentUsagePanel</code> and <code>AgentUsageSummary</code> are
              pure render-only Codex App Server primitives. They consume the same
              account / rateLimits state as the full chat preset, so a host can
              place them anywhere — a sidebar rail slot, a settings page, a
              dashboard widget, or inline next to a thread title — without
              adopting the rest of <code>AgentChat</code>.
            </p>
          </div>
          <AgentUsageSummary />
        </header>

        <section
          aria-label="Compact rail slot"
          className="aui-usage-only-section"
          data-variant="rail"
        >
          <header>
            <h2>Compact rail slot</h2>
            <p>
              The same primitive used inside the secondary rail of{" "}
              <code>AgentChat</code>. Mobile auto-collapses into a{" "}
              <code>&lt;details&gt;</code> summary; desktop stays expanded. This is
              the surface a host shell embeds beside its own conversation column.
            </p>
          </header>
          <div className="aui-usage-only-rail">
            <AgentUsagePanel autoRefresh={false} />
          </div>
        </section>

        <section
          aria-label="Standalone quota panel"
          className="aui-usage-only-section"
          data-variant="card"
        >
          <header>
            <h2>Standalone quota panel</h2>
            <p>
              Bordered card variant for settings, billing pages, or onboarding —
              renders without any chat shell. Pair it with the inline summary
              for header chrome.
            </p>
          </header>
          <div className="aui-usage-only-card-row">
            <AgentUsagePanel autoRefresh={false} />
            <AgentUsageSummary />
          </div>
        </section>

        <section
          aria-label="Dashboard widget grid"
          className="aui-usage-only-section"
          data-variant="dashboard"
        >
          <header>
            <h2>Dashboard widget</h2>
            <p>
              Rate-limit windows project naturally onto a dashboard tile so a
              host can publish Codex usage alongside CI, deploy, or telemetry
              widgets. Same primitive, different shell.
            </p>
          </header>
          <div className="aui-usage-only-dashboard">
            <UsageDashboardCard
              caption="Resets every 5 hours · throttled at 100%"
              title="Five-hour window"
              valueFn={(windows) => windows[0]?.valueLabel ?? "sync pending"}
            />
            <UsageDashboardCard
              caption="Resets every 7 days · throttled at 100%"
              title="Weekly window"
              valueFn={(windows) => windows[1]?.valueLabel ?? "sync pending"}
            />
            <div className="aui-usage-only-dashboard-card aui-usage-only-dashboard-card--full">
              <strong>Live rate limits</strong>
              <AgentUsagePanel autoRefresh={false} />
            </div>
          </div>
        </section>

        <section
          aria-label="Inline thread chrome"
          className="aui-usage-only-section"
          data-variant="inline"
        >
          <header>
            <h2>Inline thread chrome</h2>
            <p>
              The chip-shaped <code>AgentUsageSummary</code> sits next to the
              thread title; the full <code>AgentUsagePanel</code> can drop in a
              row below for hosts that want both surfaces.
            </p>
          </header>
          <div className="aui-usage-only-inline">
            <header className="aui-usage-only-inline-thread">
              <div>
                <strong>verify-codex-local-build</strong>
                <small>
                  packages/react/src/components/composer.tsx · running
                </small>
              </div>
              <AgentUsageSummary />
            </header>
            <AgentUsagePanel autoRefresh={false} />
          </div>
        </section>
      </main>
    </AgentProvider>
  );
}

function UsageDashboardCard({
  caption,
  title,
  valueFn,
}: {
  caption: string;
  title: string;
  valueFn: (windows: ReturnType<typeof normalizeUsageWindows>) => string;
}) {
  const { rateLimits } = useAgentUsage();
  const windows = normalizeUsageWindows(rateLimits);
  return (
    <div className="aui-usage-only-dashboard-card">
      <strong>{title}</strong>
      <span className="aui-usage-only-dashboard-card-value">{valueFn(windows)}</span>
      <small>{caption}</small>
    </div>
  );
}

function AppConnectorsExample() {
  const transport = useMemo(
    () =>
      new FakeAgentTransport({
        onRequest(request) {
          if (request.method === "app/list") {
            return {
              data: [
                {
                  id: "browser",
                  installUrl: "app://browser",
                  isAccessible: true,
                  isEnabled: true,
                  name: "Browser",
                },
                {
                  id: "drive",
                  installUrl: "app://drive",
                  isAccessible: false,
                  isEnabled: false,
                  name: "Drive",
                },
              ],
              nextCursor: null,
            };
          }
          return {};
        },
      }),
    [],
  );
  return (
    <AgentProvider transport={transport}>
      <ExampleFrame title="App connectors">
        <AgentAppsPanel threadId="thread-connectors" />
      </ExampleFrame>
    </AgentProvider>
  );
}

function HostWorkflowRecipe() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createDemoTransport("rich-transcript"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <HostWorkflowComposition />
    </AgentProvider>
  );
}

function HostWorkflowComposition() {
  const bootstrap = useAgentBootstrap();
  const { thread, threadId } = useAgentThread();
  if (!thread) return null;
  const turnCount = thread.orderedTurnIds.length;
  return (
    <main className="aui-host-recipe">
      <div className="aui-host-recipe-shell">
        <header className="aui-host-recipe-header">
          <div>
            <h1>Verify Codex local build</h1>
            <p>
              External host surface composed entirely from Agent UI primitives — no
              AgentChat preset wrapping. The thread surface, status rail, usage panel,
              and host workflow context are independent React regions, each placed by
              the host into its own product chrome.
            </p>
          </div>
          <div className="aui-host-recipe-meta">
            <span className="aui-host-recipe-meta-kicker">Selected thread</span>
            <span className="aui-host-recipe-meta-thread">
              {thread.thread.name ?? thread.thread.id}
            </span>
            <span className="aui-host-recipe-meta-status">
              {turnCount} turn{turnCount === 1 ? "" : "s"} · status {thread.status}
            </span>
          </div>
        </header>
        <section
          className="aui-host-composition"
          aria-label="Host primitive composition"
        >
          <div className="aui-host-thread">
            <AgentThreadSurface>
              <AgentThreadHeader thread={thread} threadId={threadId} />
              <AgentCriticalNoticeList />
              <AgentThreadTimeline thread={thread} threadId={threadId} />
              <AgentComposerPanel thread={thread} threadId={threadId} />
            </AgentThreadSurface>
          </div>
          <aside
            className="aui-host-context"
            aria-label="Host workflow context"
          >
            <div className="aui-host-context-strip">
              <AgentStatusSummary />
              <AgentUsageSummary />
            </div>
            <HostWorkflowPanel />
            <AgentStatusDetails />
            <AgentDiagnosticsPanel bootstrap={bootstrap} />
          </aside>
        </section>
      </div>
    </main>
  );
}

function HostWorkflowPanel() {
  const { thread } = useAgentThread();
  const { approvals } = useAgentApprovals(thread?.thread.id);
  const { rateLimits } = useAgentUsage();
  const windows = normalizeUsageWindows(rateLimits);
  const latestTurn = thread?.orderedTurnIds.at(-1)
    ? thread.turns[thread.orderedTurnIds.at(-1)!]
    : undefined;
  const blocks = latestTurn
    ? latestTurn.itemOrder
        .map((itemId) => latestTurn.blocksByItemId[itemId])
        .filter((block) => block !== undefined)
    : [];
  const plan = blocks.find((block) => block.kind === "plan");
  const changedFiles = blocks
    .filter((block) => block.kind === "fileChange")
    .flatMap((block) => (Array.isArray(block.changes) ? block.changes : []))
    .map((change) =>
      change && typeof change === "object" && "path" in change
        ? {
            kind:
              typeof (change as Record<string, unknown>).kind === "string"
                ? String((change as Record<string, unknown>).kind)
                : "update",
            path: String((change as Record<string, unknown>).path),
          }
        : { kind: "update", path: "unknown" },
    );
  const commands = blocks.filter((block) => block.kind === "commandExecution");
  const verificationCommand = commands.find((block) =>
    typeof block.command === "string"
      ? block.command.includes("test")
      : false,
  );
  const checks: ReadonlyArray<readonly [string, boolean]> = [
    ["Thread selected", Boolean(thread)],
    ["Plan visible", Boolean(plan)],
    ["Approvals routed", approvals.length > 0],
    ["Verification command captured", commands.length > 0],
  ] as const;
  const completeChecks = checks.filter(([, done]) => done).length;
  const planText = plan?.text ?? plan?.content ?? "";
  return (
    <section className="aui-host-block" aria-label="Host-owned panel">
      <header className="aui-host-block-header">
        <strong>Host workflow context</strong>
        <span>{thread?.thread.name ?? "no thread"}</span>
      </header>
      <div className="aui-host-block-body">
        <dl className="aui-host-stat-row" aria-label="Current thread summary">
          <div>
            <dt>Turns</dt>
            <dd>{thread?.orderedTurnIds.length ?? 0}</dd>
          </div>
          <div>
            <dt>Requests</dt>
            <dd>{approvals.length}</dd>
          </div>
          <div>
            <dt>Commands</dt>
            <dd>{commands.length}</dd>
          </div>
        </dl>
      </div>
      <header className="aui-host-block-header">
        <strong>Validation status</strong>
        <small>
          {completeChecks}/{checks.length} ready
        </small>
      </header>
      <div className="aui-host-block-body">
        <ul className="aui-host-checks">
          {checks.map(([label, complete]) => (
            <li data-complete={complete ? "true" : "false"} key={label}>
              <span className="aui-host-check-mark">{complete ? "✓" : "○"}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <header className="aui-host-block-header">
        <strong>Pending requests</strong>
        <small>
          {approvals.length} active
        </small>
      </header>
      <div className="aui-host-block-body">
        {approvals.length === 0 ? (
          <p className="aui-host-empty">No pending Codex requests in this thread.</p>
        ) : (
          <ul className="aui-host-pending">
            {approvals.map((approval) => (
              <li key={String(approval.id)}>
                <span className="aui-host-pending-kind">{approval.kind}</span>
                <span className="aui-host-pending-title">
                  {hostApprovalTitle(approval.kind)}
                </span>
                <span className="aui-host-pending-detail">{String(approval.id)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <header className="aui-host-block-header">
        <strong>Plan and context</strong>
        <small>
          {changedFiles.length} file{changedFiles.length === 1 ? "" : "s"}
        </small>
      </header>
      <div className="aui-host-block-body">
        {planText.trim() ? (
          <pre className="aui-host-plan-code">{planText.trim()}</pre>
        ) : (
          <p className="aui-host-empty">No active plan block in this turn.</p>
        )}
        {changedFiles.length > 0 ? (
          <ul className="aui-host-files">
            {changedFiles.map(({ kind, path }) => (
              <li data-kind={kind} key={`${kind}:${path}`}>
                <span>{shortKind(kind)}</span>
                <code>{path}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <header className="aui-host-block-header">
        <strong>Usage windows</strong>
        <small>
          {windows.length} active
        </small>
      </header>
      <div className="aui-host-block-body">
        <AgentUsagePanel autoRefresh={false} />
      </div>
      <div className="aui-host-block-actions">
        <span>
          {verificationCommand?.command
            ? `Verification target: ${String(verificationCommand.command)}`
            : "Host actions are deferred until the verification command is captured."}
        </span>
        <button
          className="aui-btn aui-btn-secondary aui-btn-sm"
          disabled={!verificationCommand || approvals.length > 0}
          type="button"
        >
          Continue selected thread
        </button>
      </div>
    </section>
  );
}

function ExampleFrame({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <main style={{ margin: "28px auto", maxWidth: 1180, padding: "0 18px" }}>
      <h1
        style={{
          font: "650 22px/1.2 system-ui, sans-serif",
          letterSpacing: "-0.015em",
          margin: "0 0 14px",
        }}
      >
        {title}
      </h1>
      {children}
    </main>
  );
}

function demoScenarioFromLocation(): DemoScenario {
  if (window.location.pathname === "/rich-transcript") return "rich-transcript";
  const state = new URLSearchParams(window.location.search).get("state");
  if (
    state === "empty" ||
    state === "unauth" ||
    state === "bridge-error"
  ) {
    return state;
  }
  return "default";
}


function hostApprovalTitle(kind: string): string {
  switch (kind) {
    case "commandApproval":
      return "Approve command";
    case "fileChangeApproval":
      return "Review file change";
    case "userInput":
      return "Provide user input";
    case "mcpElicitation":
      return "Provide MCP input";
    case "dynamicTool":
      return "Approve dynamic tool";
    default:
      return kind;
  }
}

function shortKind(kind: string): string {
  switch (kind) {
    case "add":
    case "added":
    case "create":
    case "created":
      return "add";
    case "delete":
    case "deleted":
    case "remove":
    case "removed":
      return "del";
    case "rename":
    case "renamed":
      return "ren";
    default:
      return "mod";
  }
}


const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element");

const root = window.__agentUiLocalReactViteRoot ?? createRoot(rootElement);
window.__agentUiLocalReactViteRoot = root;
root.render(<DemoApp />);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    root.unmount();
    window.__agentUiLocalReactViteRoot = undefined;
  });
}
