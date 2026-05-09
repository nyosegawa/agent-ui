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
