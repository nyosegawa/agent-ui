import {
  createInitialAgentState,
  FakeAgentTransport,
  type AgentSessionState,
  type PendingServerRequest,
} from "@nyosegawa/agent-ui-core";
import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import {
  AgentChat,
  AgentApprovalQueue,
  AgentComposer,
  AgentMessageList,
  AgentProvider,
  AgentStartComposer,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentUsagePanel,
} from "@nyosegawa/agent-ui-react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  createRichTranscriptInitialState,
  fixtureModels,
  fixtureRateLimits,
} from "../fixtures/demo-state";

function resolvedCloseupImage(file: File) {
  const path = `/tmp/agent-ui-closeup/${file.name}`;
  return {
    displayName: file.name,
    input: localImageInput(path),
    path,
  };
}

function resolvedCloseupFile(file: File) {
  const path = `/tmp/agent-ui-closeup/${file.name}`;
  return {
    displayName: file.name,
    input: textInput(`Attached file: ${path}`),
    path,
  };
}

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
        <CloseupCustomCommandBlock />
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
        <CloseupEmptyStateMobile />
        <CloseupStartComposer />
        <CloseupSidebarDrawerSearch />
        <CloseupLocalMediaFallback />
        <CloseupOptimisticPendingMessage />
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
      status: "authenticated",
    };
    state.usage.accountRateLimits = fixtureRateLimits();
    state.models = { models: fixtureModels(), selectedModelId: "fixture-demo-model" };
    state.threadLifecycle.activeThreadId = "thread-closeup";
    state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = ["thread-closeup"];
    state.threads["thread-closeup"] = {
      activity: "idle",
      availability: "available",
      id: "thread-closeup",
      metadata: {
        cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
        title: "Composer close-up",
      },
      operations: {},
      orderedTurnIds: [],
      status: "loaded",
      storage: "unknown",
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
          resolveLocalAttachment={resolvedCloseupImage}
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
            resolveLocalAttachment={resolvedCloseupImage}
            threadId="thread-closeup"
          />
        </div>
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupComposerDisabled() {
  const initialState = useMemo(() => {
    const state = createRichTranscriptInitialState();
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
          threadId="thread-rich-transcript"
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
          resolveLocalAttachment={resolvedCloseupImage}
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
            resolveLocalAttachment={resolvedCloseupImage}
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
              kind === "image" ? resolvedCloseupImage(file) : resolvedCloseupFile(file)
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
        <iframe src="/rich-transcript" title="Mobile chat shell" />
      </div>
    </CloseupFrame>
  );
}

function CloseupComposerWithMentions() {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.threadLifecycle.activeThreadId = "thread-mentions";
    state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = ["thread-mentions"];
    state.threads["thread-mentions"] = {
      activity: "idle",
      availability: "available",
      id: "thread-mentions",
      metadata: { title: "Mentions composer" },
      operations: {},
      orderedTurnIds: [],
      status: "loaded",
      storage: "unknown",
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
          resolveLocalAttachment={resolvedCloseupImage}
          threadId="thread-mentions"
        />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupEmptyStateMobile() {
  const initialState = useMemo(() => createEmptyAuthenticatedState(), []);
  return (
    <CloseupFrame
      title="Empty state · mobile"
      caption="No active thread; first-run composer remains reachable."
      tone="mobile"
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentChat sidebar={false} usage={false} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupStartComposer() {
  const initialState = useMemo(() => createEmptyAuthenticatedState(), []);
  return (
    <CloseupFrame
      title="Start composer"
      caption="Standalone first-message primitive with run settings."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentStartComposer onStartThread={() => undefined} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupSidebarDrawerSearch() {
  const initialState = useMemo(() => createSidebarDrawerState(), []);
  const transport = useMemo(
    () =>
      new FakeAgentTransport({
        onRequest(request) {
          if (request.method === "thread/list") {
            const searchTerm =
              typeof request.params === "object" &&
              request.params &&
              "searchTerm" in request.params &&
              typeof request.params.searchTerm === "string"
                ? request.params.searchTerm.toLowerCase()
                : "";
            const data = sidebarDrawerThreads()
              .filter(
                (thread) =>
                  !searchTerm || thread.name?.toLowerCase().includes(searchTerm),
              )
              .map(({ id, name, path }) => ({
                id,
                name,
                path,
                status: { type: "idle" },
                turns: [],
              }));
            return { data };
          }
          if (request.method === "thread/read") {
            return {
              thread: {
                id: "thread-side-select",
                name: "Renderer audit",
                path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
                status: { type: "idle" },
                turns: [
                  {
                    id: "turn-side-select",
                    items: [
                      {
                        id: "item-side-select-agent",
                        text: "Renderer audit selected from the mobile drawer.",
                        type: "agentMessage",
                      },
                    ],
                    status: "completed",
                  },
                ],
              },
            };
          }
          return {};
        },
      }),
    [],
  );
  return (
    <CloseupFrame
      title="Sidebar drawer search/select"
      caption="Mobile drawer opens history, filters, and selects a thread."
      tone="mobile"
    >
      <AgentProvider initialState={initialState} transport={transport}>
        <AgentChat usage={false} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupLocalMediaFallback() {
  const initialState = useMemo(() => createLocalMediaFallbackState(), []);
  const thread = initialState.threads["thread-local-media-closeup"];
  if (!thread) return null;
  return (
    <CloseupFrame
      title="Local media fallback card"
      caption="Missing host media URL renders a card, never a filesystem src."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList thread={thread} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupOptimisticPendingMessage() {
  const initialState = useMemo(() => createOptimisticPendingState(), []);
  const thread = initialState.threads["pending-thread-closeup"];
  if (!thread) return null;
  return (
    <CloseupFrame
      title="Optimistic pending message"
      caption="Public pending transcript state before server reconciliation."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList thread={thread} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupApprovalQueue() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  return (
    <CloseupFrame
      title="Approval queue · 3 pending"
      caption="Command, user input, and dynamic tool requests stacked."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-rich-transcript" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function createEmptyAuthenticatedState(): AgentSessionState {
  const state = createInitialAgentState();
  state.account = {
    account: { email: "fixture@example.com", planType: "pro" },
    status: "authenticated",
  };
  state.usage.accountRateLimits = fixtureRateLimits();
  state.models = { models: fixtureModels(), selectedModelId: "fixture-demo-model" };
  return state;
}

function sidebarDrawerThreads() {
  return [
    {
      id: "thread-side-closeup",
      name: "Close-up review",
      path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    },
    {
      id: "thread-side-select",
      name: "Renderer audit",
      path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    },
  ];
}

function createSidebarDrawerState(): AgentSessionState {
  const state = createEmptyAuthenticatedState();
  state.threadLifecycle.activeThreadId = "thread-side-closeup";
  state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids =
    sidebarDrawerThreads().map((thread) => thread.id);
  for (const thread of sidebarDrawerThreads()) {
    const selected = thread.id === "thread-side-select";
    state.threads[thread.id] = {
      activity: "idle",
      availability: "available",
      id: thread.id,
      metadata: { cwd: thread.path, title: thread.name },
      operations: {},
      orderedTurnIds: selected ? ["turn-side-select"] : [],
      status: "loaded",
      storage: "unknown",
      thread,
      turns: selected
        ? {
            "turn-side-select": {
              blocksByItemId: {
                "item-side-select-agent": {
                  id: "item-side-select-agent",
                  kind: "text",
                  status: "completed",
                  text: "Renderer audit selected from the mobile drawer.",
                },
              },
              commandOutputByItemId: {},
              filePatchByItemId: {},
              itemOrder: ["item-side-select-agent"],
              items: {
                "item-side-select-agent": {
                  id: "item-side-select-agent",
                  kind: "agentMessage",
                  status: "completed",
                  text: "Renderer audit selected from the mobile drawer.",
                  threadId: "thread-side-select",
                  turnId: "turn-side-select",
                },
              },
              streamingTextByItemId: {},
              turn: {
                id: "turn-side-select",
                status: "completed",
                threadId: "thread-side-select",
              },
            },
          }
        : {},
    };
  }
  return state;
}

function createLocalMediaFallbackState(): AgentSessionState {
  const state = createEmptyAuthenticatedState();
  state.threadLifecycle.activeThreadId = "thread-local-media-closeup";
  state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = [
    "thread-local-media-closeup",
  ];
  state.threads["thread-local-media-closeup"] = {
    activity: "idle",
    availability: "available",
    id: "thread-local-media-closeup",
    metadata: { title: "Local media fallback" },
    operations: {},
    orderedTurnIds: ["turn-local-media-closeup"],
    status: "loaded",
    storage: "unknown",
    thread: { id: "thread-local-media-closeup", name: "Local media fallback" },
    turns: {
      "turn-local-media-closeup": {
        blocksByItemId: {
          "item-local-media": {
            id: "item-local-media",
            kind: "image",
            path: "/tmp/agent-ui-closeups/private-screenshot.png",
            status: "completed",
          },
        },
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: ["item-local-media"],
        items: {
          "item-local-media": {
            id: "item-local-media",
            kind: "imageView",
            status: "completed",
            threadId: "thread-local-media-closeup",
            turnId: "turn-local-media-closeup",
          },
        },
        streamingTextByItemId: {},
        turn: {
          id: "turn-local-media-closeup",
          status: "completed",
          threadId: "thread-local-media-closeup",
        },
      },
    },
  };
  return state;
}

function createOptimisticPendingState(): AgentSessionState {
  const state = createEmptyAuthenticatedState();
  state.threadLifecycle.activeThreadId = "pending-thread-closeup";
  state.threadLifecycle.collections[state.threadLifecycle.defaultCollectionKey]!.ids = [
    "pending-thread-closeup",
  ];
  state.threadLifecycle.operations["pending-operation-closeup"] = {
    id: "pending-operation-closeup",
    kind: "firstMessage",
    status: "pending",
    threadId: "pending-thread-closeup",
  };
  state.threads["pending-thread-closeup"] = {
    activity: "running",
    availability: "available",
    id: "pending-thread-closeup",
    metadata: {
      title: "Pending first message",
    },
    operations: {},
    orderedTurnIds: ["pending-turn-closeup"],
    status: "running",
    storage: "unknown",
    thread: {
      id: "pending-thread-closeup",
      name: "Pending first message",
      ephemeral: true,
    },
    turns: {
      "pending-turn-closeup": {
        blocksByItemId: {
          "pending-user-message-closeup": {
            id: "pending-user-message-closeup",
            kind: "text",
            status: "inProgress",
            text: "Start the renderer audit and keep the first message visible.",
          },
        },
        commandOutputByItemId: {},
        filePatchByItemId: {},
        itemOrder: ["pending-user-message-closeup"],
        items: {
          "pending-user-message-closeup": {
            id: "pending-user-message-closeup",
            kind: "userMessage",
            raw: {
              clientUserMessageId: "pending-user-message-closeup",
              optimistic: true,
              operationId: "pending-operation-closeup",
            },
            status: "inProgress",
            text: "Start the renderer audit and keep the first message visible.",
            threadId: "pending-thread-closeup",
            turnId: "pending-turn-closeup",
          },
        },
        streamingTextByItemId: {},
        turn: {
          id: "pending-turn-closeup",
          status: "running",
          threadId: "pending-thread-closeup",
        },
      },
    },
  };
  return state;
}

function CloseupBannerStack() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  return (
    <CloseupFrame
      title="Status banners · severity stack"
      caption="Critical / warning / info notices, normalized."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
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
      status: "authenticated",
    };
    state.usage.accountRateLimits = fixtureRateLimits();
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
    () => createSingleApprovalState("approval-command-rich-transcript"),
    [],
  );
  return (
    <CloseupFrame
      title="Approval · command"
      caption="High-contrast Approve, danger Decline, scope outline."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentApprovalQueue threadId="thread-rich-transcript" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupApprovalUserInput() {
  const request = useMemo(
    () =>
      createRichTranscriptInitialState().serverRequestQueue.byId[
        "string:approval-input-rich-transcript"
      ] as PendingServerRequest | undefined,
    [],
  );
  return (
    <CloseupFrame
      title="Approval · user input"
      caption="Passive host request context without default decision actions."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentApprovalQueue approvals={request ? [request] : []} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupCommandBlock() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
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

function CloseupCustomCommandBlock() {
  const initialState = useMemo(() => createCustomCommandRendererState(), []);
  const thread = initialState.threads["thread-rich-transcript"];
  const approval = initialState.serverRequestQueue.byId[
    "string:approval-command-custom-renderer"
  ];
  if (!thread || !approval) return null;
  return (
    <CloseupFrame
      title="Custom command block"
      caption="Host renderer wraps the default command block; approval stays anchored."
      tone="dark"
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentMessageList
          approvalAnchors={{
            renderApprovalAnchor: (request) => <AgentApprovalQueue approvals={[request]} />,
            requests: [approval],
          }}
          components={{
            blocks: {
              commandExecution: ({ block, item, Default }) => (
                <div
                  className="aui-host-command-renderer"
                  data-testid="custom-command-renderer"
                >
                  <strong>Host command renderer</strong>
                  <Default block={block} item={item} />
                </div>
              ),
            },
          }}
          thread={thread}
        />
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

function createCustomCommandRendererState(): AgentSessionState {
  const state = createRichTranscriptInitialState();
  const requestKey = "string:approval-command-custom-renderer" as const;
  const request: PendingServerRequest = {
    id: "approval-command-custom-renderer",
    itemId: "item-command",
    kind: "commandApproval",
    payload: {
      command: "bun run test:e2e:playwright",
      cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      reason: "Verify the host command renderer replacement.",
    },
    threadId: "thread-rich-transcript",
    turnId: "turn-rich-transcript",
  };
  state.serverRequestQueue = {
    byId: { [requestKey]: request },
    order: [requestKey],
  };
  return state;
}

function createSingleApprovalState(id: string): AgentSessionState {
  const state = createRichTranscriptInitialState();
  const requestKey = `string:${id}` as const;
  const request = state.serverRequestQueue.byId[requestKey];
  if (!request) return state;
  state.serverRequestQueue = {
    byId: { [requestKey]: request },
    order: [requestKey],
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
            <span>packages/react/src/components/composer.tsx</span>
            <em>+34 / −5</em>
          </li>
          <li>
            <span>packages/react/src/styles/transcript-blocks.css</span>
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
      <div style={{ display: "grid", gap: "var(--aui-space-300)" }}>
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
      <div style={{ display: "grid", gap: "var(--aui-space-200)" }}>
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
      <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
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
            Continue
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
      <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
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
