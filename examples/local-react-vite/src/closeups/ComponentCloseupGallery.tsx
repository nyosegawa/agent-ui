import {
  selectThreadSummaryView,
  createInitialAgentState,
  FakeAgentTransport,
  type AgentSessionState,
  type AgentThreadView as AgentThreadListView,
  type PendingServerRequest,
} from "@nyosegawa/agent-ui-core/internal";
import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import {
  AgentChat,
  AgentProvider,
} from "@nyosegawa/agent-ui-react";
import {
  AgentApprovalQueue,
  AgentAppsPanel,
  AgentAttachmentChips,
  AgentCommandItem,
  AgentComposer,
  AgentComposerPanel,
  AgentComposerSubmitButton,
  AgentContentBlockView,
  AgentContextUsageIndicator,
  AgentCriticalNoticeList,
  AgentDiagnosticsPanel,
  AgentDiffViewer,
  AgentFileChangeItem,
  AgentFirstRun,
  AgentLocaleSelect,
  AgentMessageItem,
  AgentMessageList,
  AgentRateLimitBar,
  AgentReasoningItem,
  AgentRunControls,
  AgentSkillsPanel,
  AgentShell,
  AgentStarterCwd,
  AgentStartComposer,
  AgentStatusBar,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentThemeToggle,
  AgentThreadSidebar,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadTimeline,
  AgentThreadView,
  AgentTokenUsageBar,
  AgentToolCallItem,
  AgentTranscript,
  AgentTurn,
  AgentUsagePanel,
  AgentUsageSummary,
  ComposerRunControls,
  ThreadList,
  type AgentLocale,
} from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentBootstrap,
  useAgentContext,
  type AgentApprovalRequest,
  type AgentTranscriptEntry,
} from "@nyosegawa/agent-ui-react/headless";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createRichTranscriptInitialState,
  fixtureModels,
  fixtureRateLimits,
} from "../fixtures/demo-state";
import { closeupCoverageForTitle } from "./component-closeup-catalog";

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
      className="aui-route-gallery-group"
      data-testid="component-closeups"
      id="component-closeups"
    >
      <header className="aui-route-gallery-group-header">
        <h2>Component close-ups</h2>
        <span>Direct primitive renders · no iframe</span>
      </header>
      <div className="aui-closeup-grid">
        <CloseupComposer />
        <CloseupComposerFocused />
        <CloseupComposerDisabled />
        <CloseupComposerMobile />
        <CloseupComposerPanelInternals />
        <CloseupComposerPastedImage />
        <CloseupComposerAttachments />
        <CloseupComposerSubmitButton />
        <CloseupAttachmentChips />
        <CloseupComposerRunControls />
        <CloseupRunControls />
        <CloseupThreadStartControls />
        <CloseupThreadSurfaceHeader />
        <CloseupThreadView />
        <CloseupThreadTimeline />
        <CloseupSidebarSearch />
        <CloseupThreadList />
        <CloseupApprovalCommand />
        <CloseupApprovalUserInput />
        <CloseupCommandBlock />
        <CloseupCustomCommandBlock />
        <CloseupTranscriptContentBlocks />
        <CloseupDiffBlock />
        <CloseupStatusBarStandalone />
        <CloseupDiagnosticsPanel />
        <CloseupUsageChips />
        <CloseupContextUsageIndicator />
        <CloseupUsagePanel />
        <CloseupAppsAndSkillsPanels />
        <CloseupLocaleThemeControls />
        <CloseupButtonStates />
      </div>
    </section>
  );
}

export function CriticalInteractionStates() {
  return (
    <section
      aria-label="Critical interaction states"
      className="aui-route-gallery-group"
      data-testid="critical-states"
      id="critical-states"
    >
      <header className="aui-route-gallery-group-header">
        <h2>Critical interaction states</h2>
        <span>Live primitives · no iframe</span>
      </header>
      <div className="aui-closeup-grid">
        <CloseupApprovalQueue />
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
    <article
      className="aui-closeup"
      data-covers={closeupCoverageForTitle(title).join(" ")}
      data-testid={`closeup:${title}`}
    >
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
      runtime: { status: { type: "idle" } },
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

function FocusFirstTextarea() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const focusComposer = () => {
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
    };
    const frame = window.requestAnimationFrame(focusComposer);
    return () => window.cancelAnimationFrame(frame);
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
          resolveLocalAttachment={resolvedCloseupImage}
          threadId="thread-closeup"
        />
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupComposerPanelInternals() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const threadId = "thread-rich-transcript";
  const thread = initialState.threads[threadId];
  if (!thread) return null;
  return (
    <CloseupFrame
      title="Composer panel internals"
      caption="Panel, input, toolbar, and submit render as public composer parts."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentComposerPanel thread={thread} threadId={threadId} />
      </AgentProvider>
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

function CloseupComposerSubmitButton() {
  return (
    <CloseupFrame
      title="Composer submit button"
      caption="Send and stop actions keep stable size and label semantics."
    >
      <div className="aui-closeup-row">
        <AgentComposerSubmitButton
          canSubmit
          isStopAction={false}
          label="Send"
          title="Send message"
        />
        <AgentComposerSubmitButton
          canSubmit
          isStopAction
          label="Stop"
          title="Stop turn"
        />
        <AgentComposerSubmitButton
          canSubmit={false}
          isStopAction={false}
          label="Send"
          title="Send disabled"
        />
      </div>
    </CloseupFrame>
  );
}

function CloseupAttachmentChips() {
  return (
    <CloseupFrame
      title="Attachment chips"
      caption="Image, file, and integration chips use the public chip primitive."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentAttachmentChips
          attachments={[
            {
              id: "chip-image",
              kind: "image",
              label: "viewport.png",
              previewUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
            },
            {
              extension: "log",
              id: "chip-file",
              kind: "file",
              label: "trace.log",
              sizeLabel: "14 KB",
            },
            {
              id: "chip-integration",
              kind: "integration",
              label: "Design note",
            },
          ]}
          onRemove={() => undefined}
        />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupComposerRunControls() {
  return (
    <CloseupFrame
      title="Composer run controls · compact"
      caption="Policy and model triggers compact before the toolbar wraps."
    >
      <CloseupComposerProvider>
        <div className="aui-closeup-narrow-composer-settings">
          <AgentComposer threadId="thread-closeup" />
        </div>
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}

function CloseupThreadSurfaceHeader() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  return (
    <CloseupFrame
      title="Thread surface + header"
      caption="Thread shell and header primitives without composer chrome."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <ThreadSurfaceHeaderContent />
      </AgentProvider>
    </CloseupFrame>
  );
}

function ThreadSurfaceHeaderContent() {
  const { state: publicState } = useAgentContext();
  const state = publicState as AgentSessionState;
  const thread = selectThreadSummaryView(state, "thread-rich-transcript");
  if (!thread) return null;
  return (
    <AgentThreadSurface>
      <AgentThreadHeader thread={thread} threadId="thread-rich-transcript" />
    </AgentThreadSurface>
  );
}

function CloseupThreadView() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  return (
    <CloseupFrame
      title="Thread view"
      caption="ThreadView composes header, timeline, approvals, and composer."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentThreadView threadId="thread-rich-transcript" />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupThreadTimeline() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  return (
    <CloseupFrame
      title="Thread timeline"
      caption="Timeline, transcript alias, and standalone turn renderers."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <ThreadTimelineContent />
      </AgentProvider>
    </CloseupFrame>
  );
}

function ThreadTimelineContent() {
  return (
    <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
      <AgentThreadTimeline threadId="thread-rich-transcript" />
      <AgentTranscript threadId="thread-rich-transcript" />
      <AgentTurn entries={sampleTurnEntries()} />
    </div>
  );
}

function sampleTurnEntries(): AgentTranscriptEntry[] {
  return [
    {
      approvals: [],
      block: {
        id: "block-turn-user",
        kind: "text",
        status: "completed",
        text: "Review the maintainer catalog coverage.",
      },
      dataKind: "text",
      density: "default",
      displayStatus: "completed",
      id: "entry-turn-user",
      item: {
        id: "item-turn-user",
        kind: "userMessage",
        status: "completed",
        text: "Review the maintainer catalog coverage.",
        threadId: "thread-rich-transcript",
        turnId: "turn-closeup",
      },
      itemId: "item-turn-user",
      key: "turn-closeup:item-turn-user",
      role: "user",
      status: "completed",
      text: "Review the maintainer catalog coverage.",
      turnId: "turn-closeup",
    },
    {
      approvals: [],
      block: {
        id: "block-turn-agent",
        kind: "text",
        status: "completed",
        text: "The catalog now maps visual primitives to live close-ups.",
      },
      dataKind: "text",
      density: "default",
      displayStatus: "completed",
      id: "entry-turn-agent",
      item: {
        id: "item-turn-agent",
        kind: "agentMessage",
        status: "completed",
        text: "The catalog now maps visual primitives to live close-ups.",
        threadId: "thread-rich-transcript",
        turnId: "turn-closeup",
      },
      itemId: "item-turn-agent",
      key: "turn-closeup:item-turn-agent",
      role: "assistant",
      status: "completed",
      text: "The catalog now maps visual primitives to live close-ups.",
      turnId: "turn-closeup",
    },
  ];
}

function CloseupRunControls() {
  return (
    <CloseupFrame
      title="Run policy and model controls"
      caption="Policy and model controls are separate from thread-start cwd."
    >
      <CloseupComposerProvider>
        <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
          <AgentRunControls />
          <ComposerRunControls />
        </div>
      </CloseupComposerProvider>
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
        <AgentProvider transport={new FakeAgentTransport()}>
          <AgentShell>
            <AgentThreadSurface>
              <AgentThreadHeader
                thread={{
                  cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
                  displayStatus: "ready",
                  execution: {
                    runtime: {
                      activeFlags: [],
                      isRunning: false,
                      needsInput: false,
                      status: "idle",
                      waitingReasons: [],
                    },
                    serverRequests: [],
                  },
                  id: "thread-mobile-shell",
                  isActive: true,
                  isArchived: false,
                  isPreview: false,
                  isRunning: false,
                  needsInput: false,
                  title: "Mobile shell",
                  waitingReasons: [],
                }}
                threadId="thread-mobile-shell"
              />
              <p className="aui-transcript-empty">Transcript and composer stay first.</p>
              <AgentComposer threadId="thread-mobile-shell" />
            </AgentThreadSurface>
          </AgentShell>
        </AgentProvider>
      </div>
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
        <AgentFirstRun onStartThread={() => undefined} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupStartComposer() {
  const initialState = useMemo(() => createEmptyAuthenticatedState(), []);
  return (
    <CloseupFrame
      title="Start composer"
      caption="Standalone first-message primitive with run controls."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <AgentStartComposer onStartThread={() => undefined} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupSidebarDrawerSearch() {
  const initialState = useMemo(() => createSidebarDrawerState(), []);
  const transport = useMemo(() => createSidebarThreadsTransport(), []);
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
        <AgentMessageList threadId={thread.thread.id} />
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
        <AgentMessageList threadId={thread.thread.id} />
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

function createSidebarThreadsTransport() {
  return new FakeAgentTransport({
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
  });
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
      runtime: { status: { type: "idle" } },
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
    runtime: { status: { type: "idle" } },
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
    runtime: {
      activeTurnId: "pending-turn-closeup",
      status: { activeFlags: [], type: "active" },
    },
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
            metadata: {
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

function createPanelsState(): AgentSessionState {
  const state = createEmptyAuthenticatedState();
  state.apps.apps = [
    {
      accessible: true,
      enabled: true,
      id: "app://browser",
      name: "Browser",
    },
    {
      accessible: false,
      enabled: false,
      id: "app://figma",
      name: "Figma",
    },
  ];
  state.apps.nextCursor = "next";
  state.skills.byCwd["/Users/sakasegawa/src/github.com/nyosegawa/agent-ui"] = [
    {
      cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      enabled: true,
      name: "browser-qa",
      path: ".agents/skills/browser-qa",
    },
    {
      cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      enabled: false,
      name: "example-authoring",
      path: ".agents/skills/example-authoring",
    },
  ];
  state.diagnostics.banners = [
    {
      audience: ["user"],
      id: "banner-critical",
      kind: "configWarning",
      message: "Bridge token expires soon.",
      severity: "critical",
    },
    {
      audience: ["user"],
      id: "banner-warning",
      kind: "rateLimit",
      message: "Usage is above the review threshold.",
      severity: "warning",
    },
  ];
  state.diagnostics.warnings = [
    {
      audience: ["user"],
      id: "warning-closeup",
      message: "Fixture bridge reported a recoverable warning.",
    },
  ];
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
          <AgentCriticalNoticeList />
          <AgentStatusSummary />
          <AgentStatusDetails />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupDiagnosticsPanel() {
  const initialState = useMemo(() => createPanelsState(), []);
  return (
    <CloseupFrame
      title="Diagnostics panel"
      caption="Bootstrap and user diagnostics remain secondary chrome."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <DiagnosticsPanelContent />
      </AgentProvider>
    </CloseupFrame>
  );
}

function DiagnosticsPanelContent() {
  const bootstrap = useAgentBootstrap();
  return <AgentDiagnosticsPanel bootstrap={bootstrap} />;
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

function CloseupAppsAndSkillsPanels() {
  const initialState = useMemo(() => createPanelsState(), []);
  return (
    <CloseupFrame
      title="Apps and skills panels"
      caption="Codex app metadata and skill controls render as UI primitives; hosts own registry and execution policy."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
          <AgentAppsPanel />
          <AgentSkillsPanel cwd="/Users/sakasegawa/src/github.com/nyosegawa/agent-ui" />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupLocaleThemeControls() {
  const [locale, setLocale] = useState<AgentLocale>("en");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  return (
    <CloseupFrame
      title="Locale and theme controls"
      caption="Settings primitives remain compact in tool chrome."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <div className="aui-closeup-row">
          <AgentLocaleSelect value={locale} onChange={setLocale} />
          <AgentThemeToggle value={theme} onChange={setTheme} />
        </div>
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
  const request: AgentApprovalRequest = {
    canDecide: false,
    details: [],
    id: "approval-input-rich-transcript",
    kind: "userInput",
    prompt: "Choose the verification target for this thread.",
    risk: "low",
    threadId: "thread-rich-transcript",
  };
  return (
    <CloseupFrame
      title="Approval · user input"
      caption="Passive host request context without default decision actions."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentApprovalQueue approvals={[request]} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupCommandBlock() {
  const block: React.ComponentProps<typeof AgentCommandItem>["block"] = {
    command: "bun run test:e2e:fixtures",
    durationMs: 8400,
    exitCode: 0,
    id: "block-command-closeup",
    kind: "commandExecution",
    output: "9 passed\n",
    status: "completed",
  };
  return (
    <CloseupFrame
      title="Command block"
      caption="Expandable terminal output with exit code and duration."
      tone="dark"
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <AgentCommandItem block={block} />
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupTranscriptContentBlocks() {
  const thinkingBlock: React.ComponentProps<typeof AgentReasoningItem>["block"] = {
    content: "Evaluate renderer contracts before changing exports.",
    id: "block-thinking-closeup",
    kind: "thinking",
    status: "completed",
    summary: "Renderer contract audit",
  };
  const toolBlock: React.ComponentProps<typeof AgentToolCallItem>["block"] = {
    argumentsText: '{\n  "route": "/maintainer-gallery"\n}',
    durationMs: 820,
    id: "block-tool-closeup",
    kind: "toolCall",
    resultText: '{\n  "status": "ok"\n}',
    status: "completed",
    tool: "browser.snapshot",
    toolType: "generic",
  };
  const textBlock: React.ComponentProps<typeof AgentContentBlockView>["block"] = {
    id: "block-text-closeup",
    kind: "text",
    status: "completed",
    text: "Component catalog now covers the public visual primitives.",
  };
  return (
    <CloseupFrame
      title="Transcript content blocks"
      caption="Reasoning, tool call, and message primitives via content block view."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
          <AgentContentBlockView block={thinkingBlock} />
          <AgentContentBlockView block={toolBlock} />
          <AgentContentBlockView block={textBlock} />
          <AgentReasoningItem block={thinkingBlock} />
          <AgentToolCallItem block={toolBlock} />
          <AgentMessageItem text="Standalone message item renderer." />
        </div>
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
  const approvalView: AgentApprovalRequest = {
    canDecide: true,
    command: "bun run test:e2e:playwright",
    cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
    details: [
      {
        label: "workingDirectory",
        value: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
      },
    ],
    id: "approval-command-custom-renderer",
    itemId: "item-command",
    kind: "commandApproval",
    reason: "Verify the host command renderer replacement.",
    risk: "medium",
    threadId: "thread-rich-transcript",
    turnId: "turn-rich-transcript",
  };
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
            requests: [approvalView],
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
          threadId={thread.thread.id}
        />
      </AgentProvider>
    </CloseupFrame>
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
  const patch = `diff --git a/react-components/composer.tsx b/react-components/composer.tsx
@@ composer rebuild
- <textarea className="aui-composer-input" />
+ <textarea className="aui-composer-input" />
+ <Toolbar />
`;
  const block: React.ComponentProps<typeof AgentFileChangeItem>["block"] = {
    files: [
      {
        kind: "update",
        path: "react-components/composer.tsx",
      },
    ],
    id: "block-file-change-closeup",
    kind: "fileChange",
    status: "completed",
  };
  return (
    <CloseupFrame
      title="Diff / file change"
      caption="Diff viewer and file-change item render real public primitives."
      tone="dark"
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: "var(--aui-space-250)" }}>
          <AgentDiffViewer patch={patch} />
          <AgentFileChangeItem block={block} patch={patch} />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupSidebarSearch() {
  const initialState = useMemo(() => createSidebarDrawerState(), []);
  const transport = useMemo(() => createSidebarThreadsTransport(), []);
  return (
    <CloseupFrame
      title="Sidebar search"
      caption="Real history sidebar primitive with search and selected row."
    >
      <AgentProvider initialState={initialState} transport={transport}>
        <div className="aui-closeup-sidebar-stage">
          <AgentThreadSidebar activeThreadId="thread-side-select" />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupThreadList() {
  const threadListItems: AgentThreadListView[] = sidebarDrawerThreads().map(
    (thread, index) => ({
      cwd: thread.path,
      displayStatus: index === 0 ? "waitingForInput" : "ready",
      id: thread.id,
      isActive: index === 0,
      isArchived: false,
      isPreview: false,
      isRunning: false,
      needsInput: index === 0,
      subtitle: thread.path,
      title: thread.name,
      waitingReasons: index === 0 ? ["approval"] : [],
    }),
  );
  return (
    <CloseupFrame
      title="Thread list"
      caption="Standalone thread rows stay visible without sidebar clipping."
    >
      <AgentProvider transport={new FakeAgentTransport()}>
        <div className="aui-closeup-thread-list-stage">
          <ThreadList
            activeThreadId="thread-side-select"
            threads={threadListItems}
          />
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupUsageChips() {
  const initialState = useMemo(() => createPanelsState(), []);
  return (
    <CloseupFrame
      title="Usage / status chips"
      caption="Pill-shape summaries used in secondary chrome."
    >
      <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
        <div style={{ display: "grid", gap: "var(--aui-space-200)" }}>
          <AgentUsageSummary />
          <AgentRateLimitBar label="5h" percent={12} />
          <AgentTokenUsageBar inputTokens={1200} outputTokens={420} />
          <span className="aui-status-pill" data-status="running">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Running
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs approval
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs permission
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs input
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs MCP input
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs authentication
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs attestation
          </span>
          <span className="aui-status-pill" data-status="waitingForInput">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Needs attention
          </span>
          <span className="aui-status-pill" data-status="error">
            <span className="aui-status-pill-dot" aria-hidden="true" />
            Failed
          </span>
        </div>
      </AgentProvider>
    </CloseupFrame>
  );
}

function CloseupContextUsageIndicator() {
  return (
    <CloseupFrame
      title="Context usage indicator"
      caption="Token pressure bar remains compact beside transcript chrome."
    >
      <AgentContextUsageIndicator
        tokenUsage={{
          inputTokens: 48000,
          outputTokens: 12000,
          totalTokens: 60000,
        }}
      />
    </CloseupFrame>
  );
}

function CloseupStatusBarStandalone() {
  return (
    <CloseupFrame
      title="Status bar · standalone"
      caption="Root primitive outside AgentChat with responsive account controls."
    >
      <CloseupComposerProvider>
        <div
          className="aui-closeup-status-standalone"
          style={{ maxWidth: 360, width: "100%" }}
        >
          <AgentStatusBar end={<AgentStatusSummary />} />
        </div>
      </CloseupComposerProvider>
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

function CloseupThreadStartControls() {
  return (
    <CloseupFrame
      title="Thread-start controls"
      caption="Thread start keeps cwd separate from policy and model controls."
    >
      <CloseupComposerProvider>
        <AgentRunControls />
        <AgentStarterCwd />
      </CloseupComposerProvider>
    </CloseupFrame>
  );
}
