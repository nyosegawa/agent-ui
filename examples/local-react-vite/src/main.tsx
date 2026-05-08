import { FakeAgentTransport, runEventFixture, type FixtureStep } from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import demoFixture from "../../../fixtures/app-server/demo-session.json";

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
          return {};
        },
      }),
    [],
  );

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main style={{ margin: "28px auto", maxWidth: 1180 }}>
        <AgentChat />
      </main>
    </AgentProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <DemoApp />,
);
