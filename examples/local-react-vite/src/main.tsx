import {
  createInitialAgentState,
  FakeAgentTransport,
  runEventFixture,
  type AgentSessionState,
  type AgentTransport,
  type AgentTransportEvent,
  type FakeTransportRequest,
  type FixtureStep,
} from "@nyosegawa/agent-ui-core";
import {
  AgentAppsPanel,
  AgentApprovalQueue,
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
import "@nyosegawa/agent-ui-react/style.css";
import { useMemo, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import demoFixture from "../../../fixtures/app-server/demo-session.json";

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
  const demoState = useMemo(() => demoStateFromUrl(), []);
  const initialState = useMemo(() => createDemoInitialState(demoState), [demoState]);
  const transport = useMemo(() => createDemoTransport(demoState), [demoState]);

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main">
        <AgentChat />
      </main>
    </AgentProvider>
  );
}

type DemoState = "default" | "empty" | "unauth" | "bridge-error";
type KitchenDemoState = DemoState | "kitchen";

type FixtureGroup = "core" | "states" | "primitives";

interface FixtureState {
  description: string;
  group: FixtureGroup;
  href: string;
  meta: string;
  title: string;
}

const visualQaStates: FixtureState[] = [
  {
    description:
      "Fixture-backed streaming, approvals, diff, usage, and stored thread preview through AgentChat.",
    group: "core",
    href: "/",
    meta: "preset · default fixture",
    title: "Default conversation",
  },
  {
    description:
      "Kitchen-derived block taxonomy, severity-normalized status, rich approvals, plan and tool call.",
    group: "core",
    href: "/?state=kitchen",
    meta: "preset · kitchen fixture",
    title: "Kitchen-quality Codex UX",
  },
  {
    description:
      "Host workflow surface composed from independent thread, status, usage, approval, and composer primitives.",
    group: "primitives",
    href: "/host-workflow-recipe",
    meta: "primitives · host slot",
    title: "Host workflow recipe",
  },
  {
    description:
      "AgentUsagePanel rendered with no chat, composer, sidebar, or status chrome.",
    group: "primitives",
    href: "/usage-only",
    meta: "primitive · usage only",
    title: "Usage-only panel",
  },
  {
    description:
      "AgentThreadView locked to a specific threadId, ignoring active sidebar selection.",
    group: "primitives",
    href: "/scoped-thread-pane",
    meta: "primitive · fixed thread",
    title: "Scoped thread pane",
  },
  {
    description:
      "Codex Apps/connectors metadata from app/list, paginated, with install and auth state.",
    group: "primitives",
    href: "/app-connectors",
    meta: "primitive · app metadata",
    title: "App connectors",
  },
  {
    description: "Authenticated Codex account with no stored threads — first-run after login.",
    group: "states",
    href: "/?state=empty",
    meta: "preset · empty",
    title: "Empty authenticated workspace",
  },
  {
    description:
      "First-run device-code login flow without stale account or usage state.",
    group: "states",
    href: "/?state=unauth",
    meta: "preset · unauthenticated",
    title: "Unauthenticated first run",
  },
  {
    description:
      "Failed local Codex bridge — diagnostics surface the cause and no misleading start action.",
    group: "states",
    href: "/?state=bridge-error",
    meta: "preset · bridge error",
    title: "Bridge error",
  },
];

const fixtureGroupLabels: Record<FixtureGroup, string> = {
  core: "Preset surfaces",
  primitives: "Primitive compositions",
  states: "Lifecycle states",
};

function VisualQaIndex() {
  const grouped = useMemo(() => groupFixtures(visualQaStates), []);
  return (
    <main className="aui-fixture-gallery">
      <div className="aui-fixture-gallery-header">
        <div>
          <h1>Agent UI visual QA states</h1>
          <p>
            Desktop and mobile previews for every Agent UI surface. Compare typography
            density, hierarchy, banner severity, usage placement, and primitive
            composition without switching routes manually.
          </p>
        </div>
        <div className="aui-fixture-gallery-actions">
          <a href="/">Default</a>
          <a href="/?state=kitchen">Kitchen</a>
          <a href="/host-workflow-recipe">Host recipe</a>
        </div>
      </div>
      {grouped.map(({ group, states }) => (
        <section className="aui-fixture-gallery-group" key={group}>
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

function groupFixtures(states: FixtureState[]) {
  const order: FixtureGroup[] = ["core", "primitives", "states"];
  return order.map((group) => ({
    group,
    states: states.filter((state) => state.group === group),
  }));
}

function FixturePreview({ state }: { state: FixtureState }) {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <article className="aui-fixture-preview">
      <header>
        <div>
          <strong>{state.title}</strong>
          <span>{state.description}</span>
        </div>
        <div className="aui-fixture-preview-actions">
          <button onClick={() => setReloadKey((key) => key + 1)} type="button">
            Reload preview
          </button>
          <a aria-label={`${state.title} ${state.href}`} href={state.href}>
            {state.href}
          </a>
        </div>
      </header>
      <div className="aui-fixture-preview-frames">
        {(["desktop", "mobile"] as const).map((size) => (
          <FixturePreviewFrame
            key={`${state.href}:${size}:${reloadKey}`}
            meta={state.meta}
            size={size}
            state={state}
          />
        ))}
      </div>
    </article>
  );
}

function FixturePreviewFrame({
  meta,
  size,
  state,
}: {
  meta: string;
  size: "desktop" | "mobile";
  state: FixtureState;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <figure data-size={size}>
      <figcaption>
        <span>{size === "desktop" ? "Desktop · 1280 × 900" : "Mobile · 390 × 900"}</span>
        <span>{meta}</span>
      </figcaption>
      <div className="aui-fixture-frame-shell">
        {!loaded ? (
          <span className="aui-fixture-frame-status">Loading {size} preview</span>
        ) : null}
        <iframe
          onLoad={() => setLoaded(true)}
          src={state.href}
          title={`${state.title} ${size}`}
        />
      </div>
    </figure>
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
      <ExampleFrame title="Usage only">
        <AgentUsagePanel autoRefresh={false} />
      </ExampleFrame>
    </AgentProvider>
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
  const initialState = useMemo(() => createKitchenInitialState(), []);
  const transport = useMemo(() => createDemoTransport("kitchen"), []);
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
              <AgentThreadTimeline thread={thread} />
              <AgentApprovalQueue threadId={threadId} />
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
          className="aui-button aui-button-secondary"
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

function demoStateFromUrl(): KitchenDemoState {
  const state = new URLSearchParams(window.location.search).get("state");
  if (
    state === "empty" ||
    state === "unauth" ||
    state === "bridge-error" ||
    state === "kitchen"
  ) {
    return state;
  }
  return "default";
}

function createDemoInitialState(demoState: KitchenDemoState): AgentSessionState {
  if (demoState === "default") return runEventFixture(demoFixture as FixtureStep[]);
  if (demoState === "kitchen") return createKitchenInitialState();
  const state = createInitialAgentState();
  if (demoState === "unauth") {
    state.account = { status: "unauthenticated" };
    return state;
  }
  if (demoState === "empty") {
    state.account = {
      account: { email: "fixture@example.com", planType: "pro" },
      rateLimits: demoRateLimits(),
      status: "authenticated",
    };
    state.models = { models: demoModels() };
    return state;
  }
  return state;
}

function createDemoTransport(demoState: KitchenDemoState): AgentTransport {
  if (demoState === "bridge-error") return new FailingTransport();
  return new FakeAgentTransport({
    onRequest(request) {
      return handleDemoRequest(request, demoState);
    },
  });
}

function handleDemoRequest(request: FakeTransportRequest, demoState: KitchenDemoState) {
  if (request.method === "account/read") {
    return demoState === "unauth"
      ? {}
      : { account: { email: "fixture@example.com", planType: "pro" } };
  }
  if (request.method === "account/login/start") {
    return {
      loginId: "fixture-login-1",
      userCode: "ABCD-EFGH",
      verificationUrl: "https://chatgpt.com/activate",
    };
  }
  if (request.method === "account/login/cancel") return { status: "cancelled" };
  if (request.method === "model/list") return { data: demoModels() };
  if (request.method === "account/rateLimits/read") return demoRateLimits();
  if (request.method === "thread/start") {
    return {
      thread: {
        id: `thread-local-${request.id}`,
        name: "New local thread",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      },
    };
  }
  if (request.method === "thread/list") {
    if (demoState === "empty" || demoState === "unauth") return { data: [] };
    return {
      data: [
        {
          id: "thread-history-demo",
          name: "Stored session",
          preview: "Review a stored session",
          status: { type: "notLoaded" },
          turns: [],
        },
      ],
    };
  }
  if (request.method === "thread/read") {
    return {
      thread: {
        id: "thread-history-demo",
        name: "Stored session",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        status: { type: "notLoaded" },
        turns: [
          {
            id: "turn-history-demo",
            items: [
              {
                content: [{ text: "Show me a stored session.", type: "text" }],
                id: "item-history-user",
                type: "userMessage",
              },
              {
                id: "item-history-agent",
                text: "Stored session history can be read before resuming.",
                type: "agentMessage",
              },
            ],
            status: "completed",
          },
        ],
      },
    };
  }
  if (request.method === "thread/resume") {
    return {
      thread: {
        id: "thread-history-demo",
        name: "Stored session",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        status: { type: "idle" },
        turns: [],
      },
    };
  }
  return {};
}

function createKitchenInitialState(): AgentSessionState {
  const state = createInitialAgentState();
  state.account = {
    account: { email: "fixture@example.com", planType: "pro" },
    rateLimits: demoRateLimits(),
    status: "authenticated",
  };
  state.models = { models: demoModels(), selectedModelId: "fixture-demo-model" };
  state.activeThreadId = "thread-kitchen";
  state.threadRegistry.activeThreadId = "thread-kitchen";
  state.threadRegistry.liveThreadIds = ["thread-kitchen"];
  state.diagnostics.banners = [
    {
      id: "banner-model-reroute",
      kind: "modelReroute",
      message: "Model rerouted from fixture-heavy-model to fixture-demo-model.",
    },
    {
      id: "banner-deprecation",
      kind: "deprecationNotice",
      message: "A deprecated host field was ignored by the stable adapter.",
    },
    {
      id: "banner-config",
      kind: "configWarning",
      message: "Config warning normalized without leaking raw bridge output.",
    },
    {
      id: "banner-account",
      kind: "accountStatus",
      message: "Account and model metadata are ready.",
    },
    {
      id: "banner-mcp",
      kind: "mcpOAuth",
      message: "MCP OAuth completed for the github app.",
    },
    {
      id: "banner-rate",
      kind: "rateLimit",
      message: "Weekly rate-limit usage is below the warning threshold.",
    },
  ];
  state.pendingServerRequests = {
    "approval-command-kitchen": {
      id: "approval-command-kitchen",
      kind: "commandApproval",
      payload: {
        command: "bun run test:e2e:playwright",
        cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        reason: "Verify responsive Codex UI layout.",
      },
      threadId: "thread-kitchen",
    },
    "approval-input-kitchen": {
      id: "approval-input-kitchen",
      kind: "userInput",
      payload: {
        prompt: "Choose the verification target for this thread.",
      },
      threadId: "thread-kitchen",
    },
    "approval-tool-kitchen": {
      id: "approval-tool-kitchen",
      kind: "dynamicTool",
      payload: {
        tool: "browser_verification_snapshot",
        arguments: { url: "http://127.0.0.1:5174/?state=kitchen" },
      },
      threadId: "thread-kitchen",
    },
  };
  state.serverRequestQueue = {
    byId: state.pendingServerRequests,
    order: [
      "approval-command-kitchen",
      "approval-input-kitchen",
      "approval-tool-kitchen",
    ],
  };
  state.threads["thread-kitchen"] = {
    orderedTurnIds: ["turn-kitchen"],
    registryStatus: "live",
    status: "waitingForInput",
    thread: {
      id: "thread-kitchen",
      name: "Kitchen-quality Codex UX",
      path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    },
    tokenUsage: { inputTokens: 4200, outputTokens: 1600, totalTokens: 5800 },
    turns: {
      "turn-kitchen": {
        blocksByItemId: {
          "item-thinking": {
            id: "item-thinking",
            kind: "thinking",
            status: "completed",
            summary: "Reviewing protocol-shaped UI surfaces before rendering.",
          },
          "item-plan": {
            id: "item-plan",
            kind: "plan",
            status: "completed",
            text: "- Normalize state\n- Render rich blocks\n- Verify browser layout",
          },
          "item-command": {
            command: "bun run test:e2e:playwright",
            cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
            durationMs: 8420,
            exitCode: 0,
            id: "item-command",
            kind: "commandExecution",
            output: "9 passed\n",
            status: "completed",
          },
          "item-file": {
            changes: [
              { kind: "update", path: "packages/react/src/timeline.tsx" },
              { kind: "update", path: "docs/testing.md" },
            ],
            id: "item-file",
            kind: "fileChange",
            status: "completed",
            text: "Renderer and verification docs updated.",
          },
          "item-tool": {
            arguments: { interactive: true },
            id: "item-tool",
            kind: "mcpToolCall",
            result: { refs: 42 },
            server: "agent-browser",
            status: "completed",
            tool: "snapshot",
            toolType: "mcp",
          },
          "item-web": {
            id: "item-web",
            kind: "webSearch",
            query: "Codex App Server generated protocol",
            status: "completed",
          },
          "item-image": {
            id: "item-image",
            kind: "image",
            path: "/tmp/agent-ui-kitchen-check.png",
            status: "completed",
          },
          "item-system": {
            id: "item-system",
            kind: "systemInfo",
            status: "completed",
            subtype: "compaction",
            text: "Context compaction preserved active vNext milestone state.",
          },
        },
        commandOutputByItemId: {
          "item-command": "9 passed\n",
        },
        filePatchByItemId: {},
        itemOrder: [
          "item-user",
          "item-thinking",
          "item-plan",
          "item-command",
          "item-file",
          "item-tool",
          "item-web",
          "item-image",
          "item-system",
          "item-agent",
        ],
        items: {
          "item-agent": {
            id: "item-agent",
            kind: "agentMessage",
            status: "completed",
            text: "Kitchen-derived renderers are visible in one deterministic fixture.",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-command": {
            id: "item-command",
            kind: "commandExecution",
            status: "completed",
            text: "bun run test:e2e:playwright",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-file": {
            id: "item-file",
            kind: "fileChange",
            status: "completed",
            text: "Renderer and verification docs updated.",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-image": {
            id: "item-image",
            kind: "imageView",
            status: "completed",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-plan": {
            id: "item-plan",
            kind: "plan",
            status: "completed",
            text: "- Normalize state\n- Render rich blocks\n- Verify browser layout",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-system": {
            id: "item-system",
            kind: "contextCompaction",
            status: "completed",
            text: "Context compaction preserved active vNext milestone state.",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-thinking": {
            id: "item-thinking",
            kind: "reasoning",
            status: "completed",
            text: "Reviewing protocol-shaped UI surfaces before rendering.",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-tool": {
            id: "item-tool",
            kind: "mcpToolCall",
            status: "completed",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-user": {
            id: "item-user",
            kind: "userMessage",
            status: "completed",
            text: "Port the agent-kitchen UX ideas into Agent UI vNext.",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
          "item-web": {
            id: "item-web",
            kind: "webSearch",
            status: "completed",
            threadId: "thread-kitchen",
            turnId: "turn-kitchen",
          },
        },
        streamingTextByItemId: {},
        turn: { id: "turn-kitchen", status: "completed", threadId: "thread-kitchen" },
      },
    },
  };
  return state;
}

function demoModels() {
  return [
    {
      defaultReasoningEffort: "medium",
      displayName: "Fixture Model",
      id: "fixture-demo-model",
      supportedReasoningEfforts: ["medium", "high"],
    },
  ];
}

function demoRateLimits() {
  return {
    rateLimits: {
      limitName: "fixture-demo-model",
      primary: {
        resetsAt: "2026-05-09T12:00:00.000Z",
        usedPercent: 12,
        windowDurationMins: 300,
      },
      secondary: {
        resetsAt: "2026-05-12T12:00:00.000Z",
        usedPercent: 34,
        windowDurationMins: 10080,
      },
    },
  };
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

class FailingTransport implements AgentTransport {
  get events(): AsyncIterable<AgentTransportEvent> {
    return {
      [Symbol.asyncIterator]() {
        return {
          next: () => new Promise<IteratorResult<AgentTransportEvent>>(() => undefined),
        };
      },
    };
  }

  async connect(): Promise<void> {
    throw new Error("Fixture bridge failed before connecting to Codex App Server.");
  }

  async close(): Promise<void> {}

  notify(): void {}

  async request<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
  ): Promise<TResult> {
    void method;
    void params;
    throw new Error("Fixture bridge is not connected.");
  }

  async respond(): Promise<void> {
    throw new Error("Fixture bridge is not connected.");
  }

  async reject(): Promise<void> {
    throw new Error("Fixture bridge is not connected.");
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
