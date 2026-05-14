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
  AgentChat,
  AgentProvider,
  AgentWorkspace,
  createSkillAppRegistry,
  useSkillAppPanel,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { useMemo, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import demoFixture from "../../../fixtures/app-server/demo-session.json";

declare global {
  interface Window {
    __agentUiLocalReactViteRoot?: Root;
  }
}

function DemoApp() {
  if (window.location.pathname === "/qa") return <VisualQaIndex />;
  if (window.location.pathname === "/skill-app") return <SkillAppWorkspaceDemo />;
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
    description: "Skill app panel open, update, feedback, and close flow.",
    href: "/skill-app",
    title: "Skill app workspace",
  },
];

function VisualQaIndex() {
  return (
    <main
      style={{
        background: "#f6f7f9",
        color: "#14171f",
        font: "14px/1.5 system-ui, sans-serif",
        minHeight: "100vh",
        padding: "32px 18px",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 860 }}>
        <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Agent UI visual QA states</h1>
        <p style={{ color: "#667085", margin: "0 0 20px" }}>
          Deterministic fixture states for browser review. The real product path remains
          examples/codex-local-web.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {visualQaStates.map((state) => (
            <a
              href={state.href}
              key={state.href}
              style={{
                background: "#ffffff",
                border: "1px solid #d7dde6",
                borderRadius: 8,
                color: "inherit",
                display: "grid",
                gap: 4,
                padding: 14,
                textDecoration: "none",
              }}
            >
              <strong>{state.title}</strong>
              <span style={{ color: "#667085" }}>{state.description}</span>
              <code style={{ color: "#0f766e" }}>{state.href}</code>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

function SkillAppWorkspaceDemo() {
  const registry = useMemo(
    () =>
      createSkillAppRegistry([
        {
          description: "Browser verification workspace panel.",
          entry: "local://browser-verification",
          id: "browser-verification",
          mode: "panel",
          title: "Browser verification",
        },
      ]),
    [],
  );
  const panel = useSkillAppPanel();
  const [feedback, setFeedback] = useState("No feedback requested");
  const manifest = registry.get("browser-verification");
  const initialState = useMemo(() => createKitchenInitialState(), []);
  const transport = useMemo(() => createDemoTransport("kitchen"), []);

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main style={{ margin: "28px auto", maxWidth: 1280 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            onClick={() =>
              panel.openPanel({
                mode: "panel",
                payload: { checkedUrl: "http://127.0.0.1:5174/" },
                target: manifest?.id,
              })
            }
            type="button"
          >
            Open skill app panel
          </button>
          <button
            onClick={() =>
              panel.updatePanel({
                payload: { checkedUrl: "http://127.0.0.1:5174/?state=kitchen" },
              })
            }
            type="button"
          >
            Update panel
          </button>
          <button
            onClick={() => setFeedback("Agent requested browser verification feedback")}
            type="button"
          >
            Request feedback
          </button>
          <button onClick={panel.closePanel} type="button">
            Close panel
          </button>
        </div>
        <AgentWorkspace
          panel={
            panel.panel.open ? (
              <section aria-label="Skill app panel content">
                <h2>{manifest?.title}</h2>
                <p>{manifest?.description}</p>
                <pre>{JSON.stringify(panel.panel.payload ?? {}, null, 2)}</pre>
                <output>{feedback}</output>
              </section>
            ) : null
          }
          panelMode={panel.panel.mode}
          sidebar={false}
          usage={false}
        />
      </main>
    </AgentProvider>
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
        prompt: "Choose the deployment target for this worker pane.",
      },
      threadId: "thread-kitchen",
    },
    "approval-tool-kitchen": {
      id: "approval-tool-kitchen",
      kind: "dynamicTool",
      payload: {
        tool: "open_skill_app",
        arguments: { panel: "browser-verification" },
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
