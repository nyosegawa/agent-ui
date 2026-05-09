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
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { useMemo } from "react";
import { createRoot, type Root } from "react-dom/client";
import demoFixture from "../../../fixtures/app-server/demo-session.json";

declare global {
  interface Window {
    __agentUiLocalReactViteRoot?: Root;
  }
}

function DemoApp() {
  if (window.location.pathname === "/qa") return <VisualQaIndex />;
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

function demoStateFromUrl(): DemoState {
  const state = new URLSearchParams(window.location.search).get("state");
  if (state === "empty" || state === "unauth" || state === "bridge-error") {
    return state;
  }
  return "default";
}

function createDemoInitialState(demoState: DemoState): AgentSessionState {
  if (demoState === "default") return runEventFixture(demoFixture as FixtureStep[]);
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

function createDemoTransport(demoState: DemoState): AgentTransport {
  if (demoState === "bridge-error") return new FailingTransport();
  return new FakeAgentTransport({
    onRequest(request) {
      return handleDemoRequest(request, demoState);
    },
  });
}

function handleDemoRequest(request: FakeTransportRequest, demoState: DemoState) {
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
