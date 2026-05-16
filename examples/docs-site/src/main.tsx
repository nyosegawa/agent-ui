import {
  FakeAgentTransport,
  runEventFixture,
  type FixtureStep,
} from "@nyosegawa/agent-ui-core";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
import { useMemo } from "react";
import { createRoot } from "react-dom/client";
import demoFixture from "../../../fixtures/app-server/demo-session.json";
import "./style.css";

const sections = [
  {
    body: "Protocol-neutral reducer, selectors, fake transport, and fixture runner. It has no React or child-process dependency.",
    title: "@nyosegawa/agent-ui-core",
  },
  {
    body: "Codex App Server stdio/websocket transports, JSON-RPC-lite framing, device-code helpers, schema metadata, and normalizers.",
    title: "@nyosegawa/agent-ui-codex",
  },
  {
    body: "AgentProvider, headless hooks, run controls, usage, history, approvals, inline activity, and CodeMirror diff preview.",
    title: "@nyosegawa/agent-ui-react",
  },
  {
    body: "Node bridge helpers for local process lifecycle, Next route handlers, Express middleware, and token redaction.",
    title: "@nyosegawa/agent-ui-server",
  },
];

function DocsSite() {
  const initialState = useMemo(() => runEventFixture(demoFixture as FixtureStep[]), []);
  const transport = useMemo(() => new FakeAgentTransport(), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="docs-shell">
        <aside className="docs-nav" aria-label="Documentation">
          <strong>Agent UI</strong>
          <a href="#packages">Packages</a>
          <a href="#integration">Integration</a>
          <a href="#security">Security</a>
          <a href="#demo">Demo</a>
        </aside>
        <div className="docs-main">
          <section className="docs-intro">
            <div>
              <p className="docs-kicker">Local-first Codex App Server UI</p>
              <h1>Embeddable agent interface for web hosts</h1>
            </div>
            <p>
              Agent UI packages provide a stable React surface over Codex App Server
              without moving process management or credentials into the browser.
            </p>
          </section>

          <section className="docs-grid" id="packages" aria-label="Packages">
            {sections.map((section) => (
              <article className="docs-card" key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </section>

          <section className="docs-band" id="integration">
            <h2>Integration Path</h2>
            <ol>
              <li>
                Start `codex app-server --listen stdio://` from the server package bridge.
              </li>
              <li>Connect React with `AgentProvider` and a host-owned transport.</li>
              <li>Render `AgentChat` or compose headless hooks into a custom layout.</li>
              <li>Keep command and file approvals explicit in the chat surface.</li>
            </ol>
          </section>

          <section className="docs-band" id="security">
            <h2>Security Defaults</h2>
            <ul>
              <li>Browser packages never spawn child processes.</li>
              <li>Raw ChatGPT tokens and API keys never enter React state.</li>
              <li>
                Remote WebSocket endpoints are host-authenticated and same-origin by
                default.
              </li>
              <li>
                Multi-user deployments require per-user process, credential, and workspace
                isolation.
              </li>
            </ul>
          </section>

          <section className="docs-demo" id="demo">
            <div className="docs-demo-header">
              <h2>Fixture-backed Demo</h2>
              <p>
                Run controls, usage windows, persisted history, approvals, command output,
                and diff preview are rendered from the same package exports hosts use.
              </p>
            </div>
            <AgentChat />
          </section>
        </div>
      </main>
    </AgentProvider>
  );
}

createRoot(document.getElementById("root")!).render(<DocsSite />);
