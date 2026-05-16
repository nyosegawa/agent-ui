import {
  createInitialAgentState,
  FakeAgentTransport,
  type AgentSessionState,
} from "@nyosegawa/agent-ui-core";
import {
  AgentApprovalQueue,
  AgentComposer,
  AgentProvider,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentUsagePanel,
  localImageInput,
} from "@nyosegawa/agent-ui-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  createKitchenInitialState,
  demoModels,
  demoRateLimits,
} from "../fixtures/demo-state";

export function ComponentCloseupGallery() {
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
        <CloseupComposerPastedImage />
        <CloseupComposerAttachments />
        <CloseupModeMenu />
        <CloseupModelEffortMenu />
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

export function CriticalInteractionStates() {
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
        <CloseupMobileChatShell />
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

/**
 * Seeds composer attachment chips by dispatching a real paste event with a
 * DataTransfer payload — the same path a user takes — so the close-up shows
 * genuine attachment state instead of hand-written markup.
 */
function SeedComposerAttachments({
  files,
}: {
  files: { name: string; type: string }[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const textarea = ref.current?.parentElement?.querySelector<HTMLTextAreaElement>(
      "textarea.aui-composer-input",
    );
    if (!textarea || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(new File(["fixture"], file.name, { type: file.type }));
    }
    textarea.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      }),
    );
  }, [files]);
  return <div ref={ref} style={{ height: 0, width: "100%" }} />;
}

function CloseupComposerPastedImage() {
  return (
    <CloseupFrame
      title="Composer · pasted image"
      caption="Clipboard image becomes a removable attachment chip."
    >
      <CloseupComposerProvider>
        <div style={{ position: "relative" }}>
          <SeedComposerAttachments
            files={[{ name: "ui-review.png", type: "image/png" }]}
          />
          <AgentComposer
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

function CloseupComposerAttachments() {
  return (
    <CloseupFrame
      title="Composer · multiple attachments"
      caption="Image and file chips wrap above the textarea."
    >
      <CloseupComposerProvider>
        <div style={{ position: "relative" }}>
          <SeedComposerAttachments
            files={[
              { name: "screenshot.png", type: "image/png" },
              { name: "diagram.png", type: "image/png" },
              { name: "trace.log", type: "text/plain" },
            ]}
          />
          <AgentComposer
            resolveLocalAttachment={(file, kind) =>
              kind === "image"
                ? localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
                : localImageInput(`/tmp/agent-ui-closeup/${file.name}`)
            }
            threadId="thread-closeup"
          />
        </div>
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function StaticMenuPanel({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="aui-menu-panel"
      role="menu"
      style={{ position: "static", width: "100%" }}
    >
      <header className="aui-menu-panel-header">
        <strong>{ariaLabel}</strong>
      </header>
      <div className="aui-menu-panel-body">{children}</div>
    </div>
  );
}

function StaticMenuItem({
  label,
  description,
  selected,
}: {
  label: string;
  description?: string;
  selected?: boolean;
}) {
  return (
    <div
      className="aui-menu-item"
      data-selected={selected ? "true" : undefined}
      role="menuitemradio"
      aria-checked={selected ? "true" : "false"}
    >
      <span className="aui-menu-item-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 4.4-3.4 8-8 9-4.6-1-8-4.6-8-9V6l8-3z"/></svg>
      </span>
      <span className="aui-menu-item-body">
        <span className="aui-menu-item-label">{label}</span>
        {description ? <span className="aui-menu-item-desc">{description}</span> : null}
      </span>
      <span className="aui-menu-item-check" aria-hidden="true">
        {selected ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
        ) : null}
      </span>
    </div>
  );
}

function CloseupModeMenu() {
  return (
    <CloseupFrame
      title="Mode menu · open"
      caption="Execution mode picker with icon, label, and selected check."
    >
      <StaticMenuPanel ariaLabel="Execution mode">
        <StaticMenuItem
          label="Review"
          description="Ask before commands or file changes that need review."
          selected
        />
        <StaticMenuItem
          label="Auto"
          description="Run in the workspace and ask only after a command fails."
        />
        <StaticMenuItem
          label="Read-only"
          description="Read files and plan changes without writing to the workspace."
        />
        <StaticMenuItem
          label="Full access"
          description="Allow full local access for trusted one-off work."
        />
      </StaticMenuPanel>
    </CloseupFrame>
  );
}

function CloseupModelEffortMenu() {
  return (
    <CloseupFrame
      title="Model / effort menu · open"
      caption="Model and effort share one compact menu with sections."
    >
      <StaticMenuPanel ariaLabel="Model and effort">
        <div className="aui-menu-section" role="group" aria-label="Model">
          <span className="aui-menu-section-label">Model</span>
          <StaticMenuItem label="Server default" />
          <StaticMenuItem label="GPT-5.5 (gpt-5.5-codex)" selected />
          <StaticMenuItem label="GPT-5.4 (gpt-5.4-codex)" />
        </div>
        <div className="aui-menu-section" role="group" aria-label="Effort">
          <span className="aui-menu-section-label">Effort</span>
          <StaticMenuItem label="Low" />
          <StaticMenuItem label="Medium" selected />
          <StaticMenuItem label="High" />
          <StaticMenuItem label="Very high" />
        </div>
      </StaticMenuPanel>
    </CloseupFrame>
  );
}

function CloseupMobileChatShell() {
  return (
    <CloseupFrame
      title="Mobile chat shell"
      caption="Chat + composer first; history opens from the Threads drawer."
      tone="mobile"
    >
      <div className="aui-closeup-mobile-shell">
        <iframe src="/?state=kitchen" title="Mobile chat shell" />
      </div>
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
        <form
          className="aui-history-controls"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <div className="aui-input-shell aui-input-with-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              aria-label="Search history"
              className="aui-text-input"
              defaultValue="render"
              placeholder="Search threads"
              type="search"
            />
            <span aria-hidden="true" className="aui-history-spinner" />
          </div>
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
