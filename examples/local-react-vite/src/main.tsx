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
      <main style={{ margin: "28px auto", maxWidth: 1180 }}>
        <div
          style={{
            background: "#fff8eb",
            border: "1px solid #f4c16d",
            borderRadius: 6,
            color: "#7a4b00",
            font: "13px/1.5 system-ui, sans-serif",
            marginBottom: 12,
            padding: "10px 12px",
          }}
        >
          Fixture-backed package smoke. Run examples/codex-local-web for the real local
          Codex app.
        </div>
        <AgentChat />
      </main>
    </AgentProvider>
  );
}

type DemoState = "default" | "empty" | "unauth" | "bridge-error";
type KitchenDemoState = DemoState | "kitchen";

const visualQaStates: Array<{
  description: string;
  href: string;
  title: string;
}> = [
  {
    description:
      "Fixture-backed streaming, approvals, diff, usage, and stored thread preview.",
    href: "/",
    title: "Default fixture conversation",
  },
  {
    description: "Authenticated account with no stored Codex threads.",
    href: "/?state=empty",
    title: "Empty authenticated workspace",
  },
  {
    description: "First-run device-code login without stale usage data.",
    href: "/?state=unauth",
    title: "Unauthenticated first run",
  },
  {
    description: "Connection failure with diagnostics and no misleading start action.",
    href: "/?state=bridge-error",
    title: "Bridge error",
  },
  {
    description:
      "Kitchen-derived block renderers, status banners, token usage, and rich approval cards.",
    href: "/?state=kitchen",
    title: "Kitchen-quality Codex UX",
  },
  {
    description: "One fixed thread rendered without following active sidebar selection.",
    href: "/scoped-thread-pane",
    title: "Scoped thread pane",
  },
  {
    description: "Account/rate-limit usage rendered with no chat, composer, or sidebar.",
    href: "/usage-only",
    title: "Usage-only panel",
  },
  {
    description: "Codex Apps/connectors metadata from app/list.",
    href: "/app-connectors",
    title: "App connectors",
  },
  {
    description: "Host-owned side panel composed through generic AgentWorkspace slots.",
    href: "/host-workflow-recipe",
    title: "Host workflow recipe",
  },
];

function VisualQaIndex() {
  return (
    <main className="aui-fixture-gallery">
      <div className="aui-fixture-gallery-header">
        <div>
          <h1>Agent UI visual QA states</h1>
          <p>
            Fixture-backed previews for desktop and mobile review. These frames make
            hierarchy, overflow, banner density, usage placement, and host-slot
            composition comparable without switching routes manually.
          </p>
        </div>
        <div className="aui-fixture-gallery-actions">
          <a href="/">Open default</a>
          <a href="/?state=kitchen">Open kitchen</a>
          <a href="/host-workflow-recipe">Open host workflow</a>
        </div>
      </div>
      <div className="aui-fixture-gallery-grid">
        {visualQaStates.map((state) => (
          <FixturePreview state={state} key={state.href} />
        ))}
      </div>
    </main>
  );
}

function FixturePreview({
  state,
}: {
  state: (typeof visualQaStates)[number];
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState<Record<string, boolean>>({});
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
          <figure data-size={size} key={`${state.href}:${size}`}>
            <figcaption>{size === "desktop" ? "Desktop" : "Mobile"}</figcaption>
            <div className="aui-fixture-frame-shell">
              {!loadedFrames[size] ? <span>Loading {size} preview</span> : null}
              <iframe
                key={`${state.href}:${size}:${reloadKey}`}
                onLoad={() =>
                  setLoadedFrames((current) => ({ ...current, [size]: true }))
                }
                src={state.href}
                title={`${state.title} ${size}`}
              />
            </div>
          </figure>
        ))}
      </div>
    </article>
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
      <ExampleFrame title="Host workflow recipe">
        <HostWorkflowComposition />
      </ExampleFrame>
    </AgentProvider>
  );
}

function HostWorkflowComposition() {
  const bootstrap = useAgentBootstrap();
  const { thread, threadId } = useAgentThread();
  if (!thread) return null;
  return (
    <section className="aui-host-composition" aria-label="Host primitive composition">
      <div className="aui-host-thread">
        <AgentThreadSurface>
          <AgentThreadHeader thread={thread} threadId={threadId} />
          <AgentCriticalNoticeList />
          <AgentThreadTimeline thread={thread} />
          <AgentApprovalQueue threadId={threadId} />
          <AgentComposerPanel thread={thread} threadId={threadId} />
        </AgentThreadSurface>
      </div>
      <aside className="aui-host-context" aria-label="Host workflow context">
        <div className="aui-host-context-strip">
          <AgentStatusSummary />
          <AgentUsageSummary />
        </div>
        <HostWorkflowPanel />
        <AgentStatusDetails />
        <AgentDiagnosticsPanel bootstrap={bootstrap} />
      </aside>
    </section>
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
        ? String(change.path)
        : "unknown",
    );
  const commands = blocks.filter((block) => block.kind === "commandExecution");
  const checks = [
    ["Thread selected", Boolean(thread)],
    ["Plan visible", Boolean(plan)],
    ["Approvals routed", approvals.length > 0],
    ["Verification command captured", commands.length > 0],
  ] as const;
  return (
    <section className="aui-host-workflow" aria-label="Host-owned panel">
      <header>
        <span>Host workflow context</span>
        <strong>{thread?.thread.name ?? "No thread selected"}</strong>
      </header>
      <section className="aui-host-overview" aria-label="Current thread summary">
        <dl className="aui-host-metrics">
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
      </section>
      <section className="aui-host-section" aria-label="Workflow status">
        <div className="aui-host-section-header">
          <strong>Validation status</strong>
          <span>ready for review</span>
        </div>
        <ul className="aui-host-checklist">
          {checks.map(([label, complete]) => (
            <li data-complete={complete ? "true" : "false"} key={label}>
              <span>{complete ? "Done" : "Open"}</span>
              <strong>{label}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="aui-host-section" aria-label="Pending requests">
        <div className="aui-host-section-header">
          <strong>Pending requests</strong>
          <span>{approvals.length} active</span>
        </div>
        <ul className="aui-host-list">
          {approvals.map((approval) => (
            <li key={String(approval.id)}>
              <span>{approval.kind}</span>
              <strong>{String(approval.id)}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="aui-host-section" aria-label="Plan and context">
        <div className="aui-host-section-header">
          <strong>Plan and context</strong>
          <span>{changedFiles.length} files</span>
        </div>
        <pre>{plan?.text ?? plan?.content ?? "No active plan block."}</pre>
        <ul className="aui-host-files">
          {changedFiles.map((path) => (
            <li key={path}>{path}</li>
          ))}
        </ul>
      </section>
      <section className="aui-host-section" aria-label="Usage details">
        <div className="aui-host-section-header">
          <strong>Usage windows</strong>
          <span>{windows.length} active</span>
        </div>
        <AgentUsagePanel autoRefresh={false} />
      </section>
      <div className="aui-host-actions">
        <span>Host actions are intentionally demo-only in this fixture.</span>
        <button className="aui-button aui-button-secondary" disabled type="button">
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
    <main style={{ margin: "28px auto", maxWidth: 1180 }}>
      <h1 style={{ font: "600 22px/1.2 system-ui, sans-serif", margin: "0 0 12px" }}>
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
