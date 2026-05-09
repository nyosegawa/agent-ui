import { FakeAgentTransport, runEventFixture, type FixtureStep } from "@nyosegawa/agent-ui-core";
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
  const initialState = useMemo(() => runEventFixture(demoFixture as FixtureStep[]), []);
  const transport = useMemo(
    () =>
      new FakeAgentTransport({
        onRequest(request) {
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
        },
      }),
    [],
  );

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
          Fixture-backed package smoke. Run examples/codex-local-web for the real local Codex app.
        </div>
        <AgentChat />
      </main>
    </AgentProvider>
  );
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
