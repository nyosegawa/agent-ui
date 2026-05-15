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
  AgentComposer,
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
  localImageInput,
  normalizeUsageWindows,
  useAgentApprovals,
  useAgentBootstrap,
  useAgentThread,
  useAgentUsage,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/style.css";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

function ComponentCloseupGallery() {
  return (
    <section
      aria-label="Component close-ups"
      className="aui-fixture-gallery-group"
      data-testid="component-closeups"
      id="component-closeups"
    >
      <header className="aui-fixture-gallery-group-header">
        <h2>Component close-ups</h2>
        <span>Direct primitive renders · no iframe</span>
      </header>
      <div className="aui-closeup-grid">
        <CloseupComposer />
        <CloseupComposerFocused />
        <CloseupComposerDisabled />
        <CloseupComposerMobile />
        <CloseupApprovalCommand />
        <CloseupApprovalUserInput />
        <CloseupCommandBlock />
        <CloseupDiffBlock />
        <CloseupSidebarSearch />
        <CloseupUsageChips />
        <CloseupUsagePanel />
        <CloseupButtonStates />
        <CloseupInputStates />
      </div>
    </section>
  );
}

function CriticalInteractionStates() {
  return (
    <section
      aria-label="Critical interaction states"
      className="aui-fixture-gallery-group"
      data-testid="critical-states"
      id="critical-states"
    >
      <header className="aui-fixture-gallery-group-header">
        <h2>Critical interaction states</h2>
        <span>Live primitives · no iframe</span>
      </header>
      <div className="aui-closeup-grid">
        <CloseupApprovalQueue />
        <CloseupComposerWithMentions />
        <CloseupBannerStack />
      </div>
    </section>
  );
}

function CloseupFrame({
  title,
  caption,
  children,
  tone,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  tone?: "panel" | "dark" | "mobile";
}) {
  return (
    <article className="aui-closeup" data-testid={`closeup:${title}`}>
      <header className="aui-closeup-header">
        <strong>{title}</strong>
        <span>{caption}</span>
      </header>
      <div className="aui-closeup-stage" data-tone={tone ?? "panel"}>
        {children}
      </div>
    </article>
  );
}

function CloseupComposerProvider({ children }: { children: ReactNode }) {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.account = {
      account: { email: "fixture@example.com", planType: "pro" },
      rateLimits: demoRateLimits(),
      status: "authenticated",
    };
    state.models = { models: demoModels(), selectedModelId: "fixture-demo-model" };
    state.activeThreadId = "thread-closeup";
    state.threadRegistry.activeThreadId = "thread-closeup";
    state.threadRegistry.liveThreadIds = ["thread-closeup"];
    state.threads["thread-closeup"] = {
      orderedTurnIds: [],
      registryStatus: "live",
      status: "loaded",
      thread: {
        id: "thread-closeup",
        name: "Composer close-up",
        path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      },
      turns: {},
    };
    return state;
  }, []);
  return (
    <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
      {children}
    </AgentProvider>
  );
}

const sampleAppMention = () => ({
  label: "Browser",
  value: "app://browser",
});

const sampleAppMentionAlt = () => ({
  label: "Drive",
  value: "app://drive",
});

const samplePluginMention = () => ({
  label: "Browser tools",
  value: "plugin://browser-tools",
});

function FocusFirstTextarea() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const textarea = containerRef.current?.parentElement?.querySelector(
      "textarea.aui-composer-input",
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(
      textarea,
      "Apply the renderer audit findings and verify the diff.",
    );
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus({ preventScroll: true });
  }, []);
  return (
    <div
      data-focus-first="true"
      ref={containerRef}
      style={{ height: 1, width: "100%" }}
    />
  );
}

function CloseupComposer() {
  return (
    <CloseupFrame
      title="Composer · normal"
      caption="Textarea, inline icon toolbar, primary send."
    >
      <CloseupComposerProvider>
        <AgentComposer
          onRequestAppMention={sampleAppMention}
          onRequestPluginMention={samplePluginMention}
          resolveLocalAttachment={(file) =>
            localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
          }
          threadId="thread-closeup"
        />
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupComposerFocused() {
  return (
    <CloseupFrame
      title="Composer · focused"
      caption="Real composer focus ring, hint visible, prefilled body."
    >
      <CloseupComposerProvider>
        <div style={{ position: "relative" }}>
          <FocusFirstTextarea />
          <AgentComposer
            onRequestAppMention={sampleAppMention}
            onRequestPluginMention={samplePluginMention}
            resolveLocalAttachment={(file) =>
              localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
            }
            threadId="thread-closeup"
          />
        </div>
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupComposerDisabled() {
  const initialState = useMemo(() => {
    const state = createKitchenInitialState();
    return state;
  }, []);
  return (
    <CloseupFrame
      title="Composer · approval pending"
      caption="Disabled state with surfaced reason, send greyed out."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentComposer
          disabled
          disabledReason="Resolve the pending approval before sending another message."
          onRequestAppMention={sampleAppMention}
          onRequestPluginMention={samplePluginMention}
          placeholder="Waiting on approval"
          threadId="thread-kitchen"
        />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupComposerMobile() {
  return (
    <CloseupFrame
      title="Composer · mobile"
      caption="Hint hides, tap targets stay reachable at 360px."
      tone="mobile"
    >
      <CloseupComposerProvider>
        <AgentComposer
          onRequestAppMention={sampleAppMention}
          onRequestPluginMention={samplePluginMention}
          resolveLocalAttachment={(file) =>
            localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
          }
          threadId="thread-closeup"
        />
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupComposerWithMentions() {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.activeThreadId = "thread-mentions";
    state.threadRegistry.activeThreadId = "thread-mentions";
    state.threadRegistry.liveThreadIds = ["thread-mentions"];
    state.threads["thread-mentions"] = {
      orderedTurnIds: [],
      registryStatus: "live",
      status: "loaded",
      thread: { id: "thread-mentions", name: "Mentions composer" },
      turns: {},
    };
    return state;
  }, []);
  const appCalled = useRef(0);
  return (
    <CloseupFrame
      title="Composer · App + Plugin mentions"
      caption="Host-provided resolver chips. Click App / Plugin to add more."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentComposer
          onRequestAppMention={() => {
            appCalled.current += 1;
            return appCalled.current % 2 === 1 ? sampleAppMention() : sampleAppMentionAlt();
          }}
          onRequestPluginMention={samplePluginMention}
          resolveLocalAttachment={(file) =>
            localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
          }
          threadId="thread-mentions"
        />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupApprovalQueue() {
  const initialState = useMemo(() => createKitchenInitialState(), []);
  return (
    <CloseupFrame
      title="Approval queue · 3 pending"
      caption="Command, user input, and dynamic tool requests stacked."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-kitchen" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupBannerStack() {
  const initialState = useMemo(() => createKitchenInitialState(), []);
  return (
    <CloseupFrame
      title="Status banners · severity stack"
      caption="Critical / warning / info notices, normalized."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: 10 }}>
          <AgentStatusSummary />
          <AgentStatusDetails />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupUsagePanel() {
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
    <CloseupFrame
      title="Usage panel"
      caption="Standalone rate-limit windows, no chat chrome."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentUsagePanel autoRefresh={false} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupApprovalCommand() {
  const initialState = useMemo(
    () => createSingleApprovalState("approval-command-kitchen"),
    [],
  );
  return (
    <CloseupFrame
      title="Approval · command"
      caption="High-contrast Approve, danger Decline, scope outline."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-kitchen" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupApprovalUserInput() {
  const initialState = useMemo(
    () => createSingleApprovalState("approval-input-kitchen"),
    [],
  );
  return (
    <CloseupFrame
      title="Approval · user input"
      caption="Low risk, neutral framing, three explicit decisions."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-kitchen" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupCommandBlock() {
  const initialState = useMemo(() => createKitchenInitialState(), []);
  return (
    <CloseupFrame
      title="Command block"
      caption="Expandable terminal output with exit code and duration."
      tone="dark"
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <CloseupCommandStage />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupCommandStage() {
  return (
    <details className="aui-transcript-card aui-command-card" data-status="completed" open>
      <summary>
        <span className="aui-terminal-label">Command</span>
        <span className="aui-command-title">bun run test:e2e:playwright</span>
        <span className="aui-command-meta">exit 0 · 8.4s</span>
        <span className="aui-command-preview">
          /Users/sakasegawa/src/github.com/nyosegawa/agent-ui
        </span>
      </summary>
      <pre className="aui-command-output">9 passed{"\n"}</pre>
    </details>
  );
}

function createSingleApprovalState(id: string): AgentSessionState {
  const state = createKitchenInitialState();
  const request = state.pendingServerRequests[id];
  if (!request) return state;
  state.pendingServerRequests = { [id]: request };
  state.serverRequestQueue = {
    byId: state.pendingServerRequests,
    order: [id],
  };
  return state;
}

function CloseupDiffBlock() {
  return (
    <CloseupFrame
      title="Diff / file change"
      caption="Add/delete chips, mono path, dark surface."
      tone="dark"
    >
      <div className="aui-diff">
        <div className="aui-diff-header">
          <strong>2 files changed</strong>
          <span className="aui-diff-stat aui-diff-stat-add">+42</span>
          <span className="aui-diff-stat aui-diff-stat-remove">−7</span>
        </div>
        <ul className="aui-diff-files">
          <li>
            <span>packages/react/src/components.tsx</span>
            <em>+34 / −5</em>
          </li>
          <li>
            <span>packages/react/src/style.css</span>
            <em>+8 / −2</em>
          </li>
        </ul>
        <pre className="aui-diff-source">{`@@ composer rebuild\n- <textarea className="aui-composer-input" />\n+ <textarea className="aui-composer-input" />\n+ <Toolbar />\n`}</pre>
      </div>
    </CloseupFrame>
  );
}

function CloseupSidebarSearch() {
  return (
    <CloseupFrame
      title="Sidebar search + threads"
      caption="Icon-prefix search, status dot, selected row."
    >
      <div style={{ display: "grid", gap: 12 }}>
        <form className="aui-history-controls" onSubmit={(event) => event.preventDefault()}>
          <div className="aui-input-shell aui-input-with-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              aria-label="Search history"
              className="aui-text-input"
              defaultValue="render"
              placeholder="Search history"
              type="search"
            />
          </div>
          <button aria-label="Load" className="aui-btn aui-btn-secondary aui-btn-sm" type="submit">
            Load
          </button>
        </form>
        <nav aria-label="Threads" className="aui-thread-list">
          <button
            aria-current="page"
            className="aui-thread-list-item"
            data-status="running"
            type="button"
          >
            <span className="aui-thread-list-name">Renderer audit thread</span>
            <span className="aui-thread-list-meta">
              <span aria-hidden="true" className="aui-thread-list-dot" data-status="running" />
              <small>Running · packages/react</small>
            </span>
          </button>
          <button className="aui-thread-list-item" data-status="waitingForInput" type="button">
            <span className="aui-thread-list-name">Approve diff for protocol drift</span>
            <span className="aui-thread-list-meta">
              <span aria-hidden="true" className="aui-thread-list-dot" data-status="waitingForInput" />
              <small>Needs approval · packages/codex</small>
            </span>
          </button>
          <button className="aui-thread-list-item" data-status="complete" type="button">
            <span className="aui-thread-list-name">Stored verification session</span>
            <span className="aui-thread-list-meta">
              <span aria-hidden="true" className="aui-thread-list-dot" data-status="complete" />
              <small>Complete · 8h ago</small>
            </span>
          </button>
        </nav>
      </div>
    </CloseupFrame>
  );
}

function CloseupUsageChips() {
  return (
    <CloseupFrame
      title="Usage / status chips"
      caption="Pill-shape summaries used in secondary chrome."
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div className="aui-status-summary" aria-label="Status summary">
          <strong>Status</strong>
          <span data-severity="info">2 background notices</span>
        </div>
        <div className="aui-usage-summary" aria-label="Usage summary">
          <strong>Usage</strong>
          <span>5h 12%</span>
        </div>
        <span className="aui-status-pill" data-status="running">
          <span className="aui-status-pill-dot" aria-hidden="true" />
          Running
        </span>
        <span className="aui-status-pill" data-status="waitingForInput">
          <span className="aui-status-pill-dot" aria-hidden="true" />
          Needs approval
        </span>
        <span className="aui-status-pill" data-status="error">
          <span className="aui-status-pill-dot" aria-hidden="true" />
          Failed
        </span>
      </div>
    </CloseupFrame>
  );
}

function CloseupButtonStates() {
  return (
    <CloseupFrame
      title="Button system"
      caption="primary / secondary / ghost / danger / subtle."
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div className="aui-closeup-row">
          <button className="aui-btn aui-btn-primary" type="button">
            Approve
          </button>
          <button className="aui-btn aui-btn-secondary" type="button">
            Approve for session
          </button>
          <button className="aui-btn aui-btn-danger" type="button">
            Decline
          </button>
          <button className="aui-btn aui-btn-ghost" type="button">
            Cancel
          </button>
          <button className="aui-btn aui-btn-subtle" type="button">
            Load more
          </button>
        </div>
        <div className="aui-closeup-row">
          <button className="aui-btn aui-btn-primary aui-btn-sm" type="button">
            Send
          </button>
          <button className="aui-btn aui-btn-secondary aui-btn-sm" type="button">
            Load
          </button>
          <button className="aui-btn aui-btn-ghost aui-btn-sm" type="button">
            Resume
          </button>
          <button aria-label="More" className="aui-btn aui-btn-ghost aui-btn-icon-only aui-btn-sm" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
        <div className="aui-closeup-row">
          <button className="aui-btn aui-btn-primary aui-btn-lg" type="button">
            Start thread
          </button>
          <button className="aui-btn aui-btn-secondary aui-btn-lg" type="button">
            Open device login
          </button>
          <button className="aui-btn aui-btn-primary" disabled type="button">
            Sending…
          </button>
        </div>
      </div>
    </CloseupFrame>
  );
}

function CloseupInputStates() {
  return (
    <CloseupFrame
      title="Inputs · selects · segmented"
      caption="Unified shells, focus ring, no browser defaults."
    >
      <div style={{ display: "grid", gap: 10 }}>
        <label className="aui-field">
          <span>Working directory</span>
          <div className="aui-input-shell aui-input-with-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
            <input
              aria-label="Working directory"
              className="aui-text-input"
              defaultValue="/Users/sakasegawa/src/github.com/nyosegawa/agent-ui"
              type="text"
            />
          </div>
        </label>
        <label className="aui-field">
          <span>Model</span>
          <select aria-label="Model" className="aui-select" defaultValue="fixture-demo-model">
            <option value="fixture-demo-model">Fixture Model (fixture-demo-model)</option>
            <option value="other">Other model</option>
          </select>
        </label>
        <fieldset className="aui-mode-group">
          <legend>Execution mode</legend>
          <div className="aui-segmented" role="tablist">
            <button aria-pressed="true" className="aui-segment" type="button">
              auto
            </button>
            <button aria-pressed="false" className="aui-segment" type="button">
              workspace-write
            </button>
            <button aria-pressed="false" className="aui-segment" type="button">
              read-only
            </button>
            <button aria-pressed="false" className="aui-segment" type="button">
              danger
            </button>
          </div>
        </fieldset>
      </div>
    </CloseupFrame>
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
                  packages/react/src/components.tsx · running
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
