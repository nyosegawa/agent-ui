import {
  createInitialAgentState,
  FakeAgentTransport,
  selectOrderedCollectionThreads,
  selectThreadCollection,
  type AgentThreadScope,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import {
  AgentAppsPanel,
  AgentChat,
  AgentDiagnosticsPanel,
  AgentI18nProvider,
  AgentLocaleSelect,
  AgentMessageList,
  AgentProvider,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentThemeToggle,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadView,
  AgentUsagePanel,
  AgentUsageSummary,
  type AgentLocalAttachmentKind,
  type AgentLocale,
  type AgentResolvedLocalAttachment,
  type AgentResolvedResource,
  type AgentTheme,
  normalizeUsageWindows,
  useAgentApprovals,
  useAgentBootstrap,
  useAgentComposerController,
  useAgentContext,
  useAgentThread,
  useAgentThreadListController,
  useAgentUsage,
} from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import "./styles/closeups.css";
import "./styles/fixture-gallery.css";
import "./styles/host-recipe.css";
import "./styles/support-console.css";
import "./styles/usage-only.css";
import {
  ComponentCloseupGallery,
  CriticalInteractionStates,
} from "./closeups/ComponentCloseupGallery";
import { FixturePreview } from "./closeups/FixturePreview";
import {
  createFixtureInitialState,
  createFixtureTransport,
  fixtureModels,
  createRichTranscriptInitialState,
  fixtureRateLimits,
} from "./fixtures/demo-state";
import {
  fixtureGroupLabels,
  groupFixtures,
  visualQaStates,
  type FixtureScenario,
} from "./fixtures/gallery";
import { SupportConsoleExample } from "./support-console/SupportConsoleExample";

declare global {
  interface Window {
    __agentUiLocalReactViteRoot?: Root;
  }
}

function DemoApp() {
  if (window.location.pathname === "/app-connectors") return <AppConnectorsExample />;
  if (window.location.pathname === "/composer-retry") return <ComposerRetryExample />;
  if (window.location.pathname === "/fixture-gallery") return <VisualQaIndex />;
  if (window.location.pathname === "/host-workflow-recipe") return <HostWorkflowRecipe />;
  if (window.location.pathname === "/resource-resolution") {
    return <ResourceResolutionExample />;
  }
  if (window.location.pathname === "/transcript-density") return <TranscriptDensityExample />;
  if (window.location.pathname === "/scoped-thread-lists") {
    return <ScopedThreadListsExample />;
  }
  if (window.location.pathname === "/scoped-thread-pane") return <ScopedThreadPaneExample />;
  if (window.location.pathname === "/support-console") return <SupportConsoleExample />;
  if (window.location.pathname === "/usage-only") return <UsageOnlyExample />;
  return <AgentDemo />;
}

function ComposerRetryExample() {
  const [turnStartCalls, setTurnStartCalls] = useState(0);
  const transport = useMemo(
    () => new ComposerRetryTransport(setTurnStartCalls),
    [],
  );
  return (
    <AgentProvider initialState={createInitialAgentState()} transport={transport}>
      <main className="aui-demo-main" data-aui-theme="light">
        <ExampleFrame title="Composer retry">
          <AgentChat sidebar={false} usage={false} />
          <ComposerRetryProbe turnStartCalls={turnStartCalls} />
        </ExampleFrame>
      </main>
    </AgentProvider>
  );
}

class ComposerRetryTransport extends FakeAgentTransport {
  private turnStartCalls = 0;

  constructor(onTurnStartCallsChange: (calls: number) => void) {
    super({
      onRequest: (request) => {
        if (request.method === "account/read") {
          return { account: { email: "fixture@example.com", planType: "pro" } };
        }
        if (request.method === "model/list") return { data: fixtureModels() };
        if (request.method === "account/rateLimits/read") return fixtureRateLimits();
        if (request.method === "thread/list") return { data: [] };
        if (request.method === "thread/start") {
          return {
            thread: {
              id: "thread-browser-retry",
              name: "Browser retry thread",
              path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
              status: { type: "idle" },
            },
          };
        }
        if (request.method === "turn/start") {
          this.turnStartCalls += 1;
          onTurnStartCallsChange(this.turnStartCalls);
          if (this.turnStartCalls === 1 && requestInputText(request.params) === "browser retry") {
            throw new Error("browser retry failed once");
          }
          return { turnId: `turn-browser-retry-${this.turnStartCalls}` };
        }
        return {};
      },
    });
  }
}

function ComposerRetryProbe({ turnStartCalls }: { turnStartCalls: number }) {
  const composer = useAgentComposerController();
  const failed = composer.failedPendingMessages[0];
  return (
    <section aria-label="Composer retry status" className="aui-host-recipe-panel">
      <p aria-label="failed pending count">
        {composer.failedPendingMessages.length}
      </p>
      <p aria-label="failed pending error">{failed?.error ?? "none"}</p>
      <p aria-label="turn start calls">{turnStartCalls}</p>
      <button
        disabled={!failed}
        onClick={() => {
          if (failed) void composer.retryFailedPendingMessage(failed.operationId);
        }}
        type="button"
      >
        Retry failed first message
      </button>
    </section>
  );
}

function requestInputText(params: unknown): string {
  if (!params || typeof params !== "object") return "";
  const input = (params as { input?: unknown }).input;
  if (typeof input === "string") return input;
  if (!Array.isArray(input)) return "";
  return input
    .map((item) =>
      item && typeof item === "object" && "text" in item
        ? String((item as { text?: unknown }).text ?? "")
        : "",
    )
    .filter(Boolean)
    .join("\n");
}

function ScopedThreadListsExample() {
  return (
    <AgentProvider initialState={createInitialAgentState()} transport={new FakeAgentTransport()}>
      <main className="aui-demo-main" data-aui-theme="light">
        <ExampleFrame title="Scoped thread lists">
          <div className="aui-host-workflow-grid" data-testid="scoped-thread-lists">
            <ScopedThreadListPanel
              label="Left"
              pageThreadId="thread-left-page"
              primaryThreadId="thread-left-alpha"
              scopeKey="history:left-fixture"
            />
            <ScopedThreadListPanel
              label="Right"
              pageThreadId="thread-right-page"
              primaryThreadId="thread-right-beta"
              scopeKey="history:right-fixture"
            />
          </div>
        </ExampleFrame>
      </main>
    </AgentProvider>
  );
}

function ScopedThreadListPanel({
  label,
  pageThreadId,
  primaryThreadId,
  scopeKey,
}: {
  label: string;
  pageThreadId: ThreadId;
  primaryThreadId: ThreadId;
  scopeKey: string;
}) {
  const { dispatch, state } = useAgentContext();
  const [searchTerm, setSearchTerm] = useState(label.toLowerCase());
  const scope: AgentThreadScope = {
    key: scopeKey,
    kind: "history",
    searchTerm: searchTerm || undefined,
  };
  const collection = selectThreadCollection(state, scope);
  const threads = selectOrderedCollectionThreads(state, scope);
  const loadPage = (append = false) => {
    const threadIds = append ? [pageThreadId] : [primaryThreadId];
    const syncedAt = append ? 2 : 1;
    for (const threadId of threadIds) {
      dispatch({
        status: "notLoaded",
        thread: {
          id: threadId,
          name: `${label} ${append ? "page" : searchTerm || "all"} thread`,
        },
        type: "thread/upserted",
      });
    }
    dispatch({
      ids: threadIds,
      nextCursor: append ? null : `${scopeKey}:page-2`,
      replace: !append,
      scope,
      syncedAt,
      type: "thread/collection/pageReceived",
    });
    dispatch({
      nextCursor: append ? null : `${scopeKey}:page-2`,
      scope,
      syncedAt,
      type: "thread/collection/synced",
    });
  };
  return (
    <section aria-label={`${label} scoped list`} className="aui-host-recipe-panel">
      <h2>{label} scope</h2>
      <label>
        <span>Search</span>
        <input
          aria-label={`${label} search`}
          className="aui-text-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />
      </label>
      <div className="aui-host-recipe-actions">
        <button type="button" onClick={() => loadPage(false)}>
          Refresh {label}
        </button>
        <button type="button" onClick={() => loadPage(true)}>
          Load more {label}
        </button>
      </div>
      <p aria-label={`${label} scope metadata`}>
        {collection?.scope.kind === "history" ? collection.scope.searchTerm : ""}
      </p>
      <p aria-label={`${label} cursor`}>{collection?.nextCursor ?? ""}</p>
      <ul aria-label={`${label} threads`}>
        {threads.map((thread) => (
          <li key={thread.thread.id}>
            <button
              type="button"
              onClick={() => dispatch({ threadId: thread.thread.id, type: "thread/active/set" })}
            >
              {thread.thread.name ?? thread.thread.id}
            </button>
          </li>
        ))}
      </ul>
      <p aria-label={`${label} active`}>
        {state.threadLifecycle.activeThreadId === primaryThreadId ||
        state.threadLifecycle.activeThreadId === pageThreadId
          ? state.threadLifecycle.activeThreadId
          : ""}
      </p>
    </section>
  );
}

function AgentDemo() {
  const scenario = useMemo(() => fixtureScenarioFromLocation(), []);
  const [locale, setLocale] = useState<AgentLocale>(() => localeFromLocation());
  const [theme, setTheme] = useState<AgentTheme>(() => themeFromLocation());
  const initialState = useMemo(() => createFixtureInitialState(scenario), [scenario]);
  const transport = useMemo(() => createFixtureTransport(scenario), [scenario]);

  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <AgentChat
            diagnostics
            locale={locale}
            statusBarEnd={
              <div className="aui-demo-toolbar">
                <AgentLocaleSelect value={locale} onChange={setLocale} />
                <AgentThemeToggle value={theme} onChange={setTheme} />
              </div>
            }
            theme={theme}
            usage
          />
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function VisualQaIndex() {
  const grouped = useMemo(() => groupFixtures(visualQaStates), []);
  const theme = themeFromLocation();
  return (
    <main className="aui-fixture-gallery" data-aui-theme={theme}>
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

function themeFromLocation(): AgentTheme {
  const theme = new URLSearchParams(window.location.search).get("theme");
  return theme === "dark" || theme === "system" || theme === "light" ? theme : "light";
}

function localeFromLocation(): AgentLocale {
  const locale = new URLSearchParams(window.location.search).get("locale");
  return locale === "ja" ||
    locale === "ko" ||
    locale === "zh-CN" ||
    locale === "es" ||
    locale === "fr" ||
    locale === "en"
    ? locale
    : "en";
}

function ScopedThreadPaneExample() {
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.threadLifecycle.activeThreadId = "thread-active";
    state.threads["thread-active"] = {
      activity: "idle",
      availability: "available",
      id: "thread-active",
      metadata: { title: "Active host thread" },
      operations: {},
      orderedTurnIds: [],
      status: "loaded",
      storage: "unknown",
      thread: { id: "thread-active", name: "Active host thread" },
      turns: {},
    };
    state.threads["thread-fixed"] = {
      activity: "idle",
      availability: "available",
      id: "thread-fixed",
      metadata: { title: "Scoped thread pane" },
      operations: {},
      orderedTurnIds: ["turn-fixed"],
      status: "complete",
      storage: "unknown",
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
      status: "authenticated",
    };
    state.usage.accountRateLimits = fixtureRateLimits();
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
                  packages/react/src/components/composer.tsx · running
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
  const firstMessageMode =
    new URLSearchParams(window.location.search).get("firstMessage") ===
    "optimistic";
  const [firstMessageStats, setFirstMessageStats] =
    useState<HostFirstMessageStats>({
      threadStartCalls: 0,
      turnStartCalls: 0,
    });
  const firstMessageControls = useMemo(
    () =>
      firstMessageMode
        ? createHostFirstMessageTransport(setFirstMessageStats)
        : null,
    [firstMessageMode],
  );
  const initialState = useMemo(
    () =>
      firstMessageMode
        ? createFixtureInitialState("empty")
        : createHostWorkflowInitialState(),
    [firstMessageMode],
  );
  const fallbackTransport = useMemo(() => createFixtureTransport("host-workflow"), []);
  const transport = firstMessageControls?.transport ?? fallbackTransport;
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <HostWorkflowComposition
        firstMessageControls={firstMessageControls}
        firstMessageStats={firstMessageStats}
      />
    </AgentProvider>
  );
}

interface HostFirstMessageStats {
  threadStartCalls: number;
  turnStartCalls: number;
}

interface HostFirstMessageControls {
  completeThreadStart: () => void;
  transport: FakeAgentTransport;
}

function createHostFirstMessageTransport(
  onStatsChange: (stats: HostFirstMessageStats) => void,
): HostFirstMessageControls {
  let threadStartCalls = 0;
  let turnStartCalls = 0;
  let completeThreadStart:
    | ((result: {
        thread: { id: string; name: string; path: string; status: { type: string } };
      }) => void)
    | undefined;
  const emitStats = () => {
    onStatsChange({ threadStartCalls, turnStartCalls });
  };
  const transport = new FakeAgentTransport({
    onRequest(request) {
      if (request.method === "account/read") {
        return { account: { email: "fixture@example.com", planType: "pro" } };
      }
      if (request.method === "model/list") return { data: fixtureModels() };
      if (request.method === "account/rateLimits/read") return fixtureRateLimits();
      if (request.method === "thread/list") return { data: [] };
      if (request.method === "thread/start") {
        threadStartCalls += 1;
        emitStats();
        return new Promise((resolve) => {
          completeThreadStart = resolve;
        });
      }
      if (request.method === "turn/start") {
        turnStartCalls += 1;
        emitStats();
        return { turnId: `turn-host-first-message-${turnStartCalls}` };
      }
      return {};
    },
  });
  return {
    completeThreadStart: () => {
      completeThreadStart?.({
        thread: {
          id: "thread-host-first-message",
          name: "Host first message thread",
          path: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
          status: { type: "idle" },
        },
      });
    },
    transport,
  };
}

interface HostAttachmentMetadata {
  displayName: string;
  id: string;
  kind: AgentLocalAttachmentKind;
  mimeType: string;
  redactedPath: string;
  sizeBytes: number;
}

const hostAttachmentPreviewUrl =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const hostTranscriptMediaPreviewUrl =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

const hostTranscriptMediaResources = [
  {
    displayName: "fixture-image.png",
    kind: "url",
    path: "/tmp/agent-ui-fixture-rich-transcript.png",
    previewUrl: hostTranscriptMediaPreviewUrl,
    redactedPath: "[agent-ui-local-media]/fixture-image.png",
  },
  {
    displayName: "missing-dashboard.png",
    kind: "unavailable",
    path: "/tmp/agent-ui-fixture-missing-dashboard.png",
    reason: "fixture media intentionally unavailable",
    redactedPath: "[agent-ui-local-media]/missing-dashboard.png",
  },
] as const satisfies ReadonlyArray<
  AgentResolvedResource & { path: string; redactedPath: string }
>;

function createHostWorkflowInitialState() {
  const state = createRichTranscriptInitialState();
  const thread = state.threads["thread-rich-transcript"];
  const turn = thread?.turns["turn-rich-transcript"];
  if (!turn) return state;
  turn.blocksByItemId["item-missing-media"] = {
    id: "item-missing-media",
    kind: "image",
    path: "/tmp/agent-ui-fixture-missing-dashboard.png",
    status: "completed",
  };
  turn.items["item-missing-media"] = {
    id: "item-missing-media",
    kind: "imageView",
    status: "completed",
    threadId: "thread-rich-transcript",
    turnId: "turn-rich-transcript",
  };
  const imageIndex = turn.itemOrder.indexOf("item-image");
  turn.itemOrder.splice(
    imageIndex === -1 ? turn.itemOrder.length : imageIndex + 1,
    0,
    "item-missing-media",
  );
  return state;
}

function TranscriptDensityExample() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  const thread = initialState.threads["thread-rich-transcript"];
  if (!thread) return null;
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main" data-aui-theme="light">
        <ExampleFrame title="Transcript density">
          <AgentThreadSurface>
            <AgentThreadHeader thread={thread} threadId={thread.thread.id} />
            <AgentMessageList
              density={{
                default: "compact",
                byBlockKind: {
                  commandExecution: "verbose",
                  fileChange: "verbose",
                  text: "critical-only",
                },
              }}
              thread={thread}
            />
          </AgentThreadSurface>
        </ExampleFrame>
      </main>
    </AgentProvider>
  );
}

function HostWorkflowComposition({
  firstMessageControls,
  firstMessageStats,
}: {
  firstMessageControls: HostFirstMessageControls | null;
  firstMessageStats: HostFirstMessageStats;
}) {
  const bootstrap = useAgentBootstrap();
  const { thread } = useAgentThread();
  const [hostSheetOpen, setHostSheetOpen] = useState(() =>
    new URLSearchParams(window.location.search).get("hostSheet") === "open",
  );
  const [latestAttachment, setLatestAttachment] =
    useState<HostAttachmentMetadata | null>(null);
  const [workflowGateOpen, setWorkflowGateOpen] = useState(false);
  const resolveHostLocalMediaUrl = useCallback((path: string): AgentResolvedResource => {
    const resource = hostTranscriptMediaResources.find((candidate) => candidate.path === path);
    return (
      resource ?? {
        displayName: path.split(/[\\/]+/).at(-1) ?? "local-media",
        kind: "unavailable",
        redactedPath: "[agent-ui-local-media]/unresolved",
        reason: "host resolver did not recognize this fixture path",
      }
    );
  }, []);
  const resolveHostAttachment = useCallback(
    (
      file: File,
      kind: AgentLocalAttachmentKind,
    ): AgentResolvedLocalAttachment => {
      const safeName = sanitizeFixtureUploadName(file.name || "upload");
      const path = `/agent-ui-fixture-upload/${safeName}`;
      const redactedPath = `[agent-ui-fixture-upload]/${safeName}`;
      const metadata: HostAttachmentMetadata = {
        displayName: file.name || safeName,
        id: `fixture-upload:${safeName}`,
        kind,
        mimeType: file.type || "application/octet-stream",
        redactedPath,
        sizeBytes: file.size,
      };
      setLatestAttachment(metadata);
      return {
        displayName: metadata.displayName,
        id: metadata.id,
        input:
          kind === "image"
            ? localImageInput(path)
            : textInput(`Attached file: ${redactedPath}`),
        mimeType: metadata.mimeType,
        name: metadata.displayName,
        path,
        previewUrl: kind === "image" ? hostAttachmentPreviewUrl : undefined,
        redactedPath,
        sizeBytes: metadata.sizeBytes,
      };
    },
    [],
  );
  const turnCount = thread?.orderedTurnIds.length ?? 0;
  const threadName = thread?.thread.name ?? thread?.thread.id ?? "No thread selected";
  return (
    <main className="aui-host-recipe">
      <div className="aui-host-recipe-shell">
        <header className="aui-host-recipe-header">
          <div>
            <h1>Verify Codex local build</h1>
            <p>
              External host surface embedding the AgentChat preset into product
              chrome. The host owns this header, review sheet, and workflow context;
              Agent UI owns the thread timeline, composer, and history drawer.
            </p>
          </div>
          <div className="aui-host-recipe-meta">
            <span className="aui-host-recipe-meta-kicker">Selected thread</span>
            <span className="aui-host-recipe-meta-thread">
              {threadName}
            </span>
            <span className="aui-host-recipe-meta-status">
              {turnCount} turn{turnCount === 1 ? "" : "s"} · status{" "}
              {thread?.status ?? "idle"}
            </span>
            <button
              className="aui-host-action"
              onClick={() => setHostSheetOpen(true)}
              type="button"
            >
              Open host review
            </button>
          </div>
        </header>
        <section
          className="aui-host-composition"
          aria-label="Host integration reference"
        >
          <div className="aui-host-thread">
            <AgentChat
              diagnostics={false}
              resolveLocalAttachment={resolveHostAttachment}
              resolveLocalMediaUrl={resolveHostLocalMediaUrl}
              sidebar
              usage={false}
            />
          </div>
          <aside
            className="aui-host-context"
            aria-label="Host workflow context"
          >
            <div className="aui-host-context-strip">
              <AgentStatusSummary />
              <AgentUsageSummary />
            </div>
            <HostWorkflowPanel latestAttachment={latestAttachment} />
            <HostWorkflowGatePanel
              open={workflowGateOpen}
              onOpenChange={setWorkflowGateOpen}
            />
            <HostScopedHistoryPanel />
            {firstMessageControls ? (
              <HostFirstMessagePanel
                controls={firstMessageControls}
                stats={firstMessageStats}
              />
            ) : null}
            <AgentStatusDetails />
            <AgentDiagnosticsPanel bootstrap={bootstrap} />
          </aside>
        </section>
      </div>
      {hostSheetOpen ? (
        <HostReviewSheet
          threadName={threadName}
          onClose={() => setHostSheetOpen(false)}
        />
      ) : null}
    </main>
  );
}

function sanitizeFixtureUploadName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^[._-]+/, "") || "upload";
}

function HostReviewSheet({
  onClose,
  threadName,
}: {
  onClose: () => void;
  threadName: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const focusCloseButton = () => closeButtonRef.current?.focus();
    focusCloseButton();
    const handleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        sheetRef.current?.contains(event.target)
      ) {
        return;
      }
      window.requestAnimationFrame(focusCloseButton);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      event.preventDefault();
      event.stopPropagation();
      focusCloseButton();
    };
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
  return (
    <section
      aria-label="Host-owned review sheet"
      className="aui-host-review-sheet"
      ref={sheetRef}
      role="dialog"
    >
      <header>
        <strong>Host-owned review</strong>
        <button
          aria-label="Close host review"
          className="aui-host-action"
          data-variant="ghost"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          Close
        </button>
      </header>
      <p>
        The host places this sheet above Agent UI drawers using public layer
        tokens. Agent UI still owns the timeline, composer, and drawer behavior.
      </p>
      <dl>
        <div>
          <dt>Thread</dt>
          <dd>{threadName}</dd>
        </div>
        <div>
          <dt>Layer</dt>
          <dd>var(--aui-z-sheet)</dd>
        </div>
      </dl>
    </section>
  );
}

function HostFirstMessagePanel({
  controls,
  stats,
}: {
  controls: HostFirstMessageControls;
  stats: HostFirstMessageStats;
}) {
  const { thread } = useAgentThread();
  const pending = thread?.thread.ephemeral === true && stats.turnStartCalls === 0;
  return (
    <section className="aui-host-block" aria-label="Host first-message probe">
      <header className="aui-host-block-header">
        <strong>First-message state</strong>
        <small>{pending ? "optimistic" : "stable"}</small>
      </header>
      <div className="aui-host-block-body">
        <dl className="aui-host-stat-row" aria-label="Host first-message counters">
          <div>
            <dt>thread/start</dt>
            <dd>{stats.threadStartCalls}</dd>
          </div>
          <div>
            <dt>turn/start</dt>
            <dd>{stats.turnStartCalls}</dd>
          </div>
        </dl>
        <p className="aui-host-empty">
          The host observes public thread state while Agent UI owns optimistic
          first-message reconciliation.
        </p>
      </div>
      <div className="aui-host-block-actions">
        <span>{pending ? "Optimistic thread pending" : "Waiting for first message"}</span>
        <button
          className="aui-host-action"
          disabled={stats.threadStartCalls === 0 || stats.turnStartCalls > 0}
          onClick={controls.completeThreadStart}
          type="button"
        >
          Complete host thread start
        </button>
      </div>
    </section>
  );
}

function HostScopedHistoryPanel() {
  const { thread: activeThread } = useAgentThread();
  const [previewThreadId, setPreviewThreadId] = useState<string>("none");
  const scopedHistory = useAgentThreadListController({
    key: "host-workflow-reference",
    kind: "history",
    searchTerm: "host scoped",
  });
  const firstThread = scopedHistory.threads[0];
  const activeThreadId = activeThread?.thread.id ?? "none";
  return (
    <section className="aui-host-block" aria-label="Host scoped history">
      <header className="aui-host-block-header">
        <strong>Scoped history</strong>
        <small>{scopedHistory.isLoading ? "loading" : "ready"}</small>
      </header>
      <div className="aui-host-block-body">
        <dl className="aui-host-stat-row" aria-label="Host scoped history status">
          <div>
            <dt>Threads</dt>
            <dd>{scopedHistory.threads.length}</dd>
          </div>
          <div>
            <dt>Cursor</dt>
            <dd>{scopedHistory.nextCursor ?? "none"}</dd>
          </div>
          <div>
            <dt>Active</dt>
            <dd>{activeThreadId}</dd>
          </div>
        </dl>
        <ul className="aui-host-pending" aria-label="Host scoped history threads">
          {scopedHistory.threads.length === 0 ? (
            <li>
              <span className="aui-host-pending-title">No scoped threads loaded</span>
            </li>
          ) : (
            scopedHistory.threads.map((thread) => (
              <li key={thread.id}>
                <span className="aui-host-pending-kind">history</span>
                <span className="aui-host-pending-title">
                  {thread.title}
                </span>
                <span className="aui-host-pending-detail">{thread.id}</span>
              </li>
            ))
          )}
        </ul>
        <p className="aui-host-empty" aria-label="Host scoped preview state">
          Preview: {previewThreadId}
        </p>
        {previewThreadId !== "none" ? (
          <HostScopedPreview threadId={previewThreadId} />
        ) : null}
      </div>
      <div className="aui-host-block-actions">
        <span>
          {scopedHistory.nextCursor
            ? `Next page: ${scopedHistory.nextCursor}`
            : "No next scoped page"}
        </span>
        <button
          className="aui-host-action"
          onClick={() => {
            void scopedHistory.refresh();
          }}
          type="button"
        >
          Load scoped history
        </button>
        <button
          className="aui-host-action"
          disabled={!scopedHistory.nextCursor}
          onClick={() => {
            void scopedHistory.loadNextPage();
          }}
          type="button"
        >
          Load next scoped page
        </button>
        <button
          className="aui-host-action"
          disabled={!firstThread}
          onClick={() => {
            if (!firstThread) return;
            void scopedHistory.previewThread(firstThread.id).then(() => {
              setPreviewThreadId(firstThread.id);
            });
          }}
          type="button"
        >
          Preview scoped thread
        </button>
      </div>
    </section>
  );
}

function HostScopedPreview({ threadId }: { threadId: string }) {
  const { thread } = useAgentThread(threadId);
  if (!thread) return null;
  return (
    <div aria-label="Host scoped preview transcript">
      <AgentThreadSurface className="aui-host-scoped-preview">
        <AgentThreadHeader thread={thread} threadId={threadId} />
        <AgentMessageList thread={thread} />
      </AgentThreadSurface>
    </div>
  );
}

function HostWorkflowGatePanel({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { thread } = useAgentThread();
  const { approvals } = useAgentApprovals(thread?.thread.id);
  const blocked = !open;
  return (
    <section className="aui-host-block" aria-label="Host workflow gate">
      <header className="aui-host-block-header">
        <strong>Workflow gate</strong>
        <small>{blocked ? "held" : "open"}</small>
      </header>
      <div className="aui-host-block-body">
        <dl className="aui-host-stat-row" aria-label="Host workflow gate status">
          <div>
            <dt>Gate</dt>
            <dd>{open ? "open" : "held"}</dd>
          </div>
          <div>
            <dt>Requests</dt>
            <dd>{approvals.length}</dd>
          </div>
        </dl>
        <p className="aui-host-empty">
          The host owns this release gate. Agent UI still owns the transcript,
          composer, approvals, and thread history surfaces.
        </p>
      </div>
      <div className="aui-host-block-actions">
        <span>
          {blocked
            ? "Host action held until the gate opens."
            : "Host action can continue outside Agent UI."}
        </span>
        <button
          className="aui-host-action"
          onClick={() => onOpenChange(!open)}
          type="button"
        >
          {open ? "Hold workflow gate" : "Open workflow gate"}
        </button>
        <button
          className="aui-host-action"
          disabled={blocked}
          type="button"
        >
          Continue host workflow
        </button>
      </div>
    </section>
  );
}

function HostWorkflowPanel({
  latestAttachment,
}: {
  latestAttachment: HostAttachmentMetadata | null;
}) {
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
        <strong>Local attachment metadata</strong>
        <small>{latestAttachment ? latestAttachment.kind : "waiting"}</small>
      </header>
      <div className="aui-host-block-body">
        {latestAttachment ? (
          <dl className="aui-host-attachment-meta" aria-label="Latest local attachment metadata">
            <div>
              <dt>Name</dt>
              <dd>{latestAttachment.displayName}</dd>
            </div>
            <div>
              <dt>Id</dt>
              <dd>{latestAttachment.id}</dd>
            </div>
            <div>
              <dt>MIME</dt>
              <dd>{latestAttachment.mimeType}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{latestAttachment.sizeBytes} B</dd>
            </div>
            <div>
              <dt>Path</dt>
              <dd>{latestAttachment.redactedPath}</dd>
            </div>
          </dl>
        ) : (
          <p className="aui-host-empty">
            Attach a local file to verify the host resolver returns structured,
            browser-safe metadata.
          </p>
        )}
      </div>
      <header className="aui-host-block-header">
        <strong>Transcript media</strong>
        <small>{hostTranscriptMediaResources.length} resources</small>
      </header>
      <div className="aui-host-block-body">
        <dl className="aui-host-attachment-meta" aria-label="Transcript local media metadata">
          {hostTranscriptMediaResources.map((resource) => (
            <div key={resource.path}>
              <dt>{resource.kind === "url" ? "Preview" : "Fallback"}</dt>
              <dd>
                {resource.displayName} · {resource.redactedPath}
              </dd>
            </div>
          ))}
        </dl>
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
          className="aui-host-action"
          disabled={!verificationCommand || approvals.length > 0}
          type="button"
        >
          Continue selected thread
        </button>
      </div>
    </section>
  );
}

function ResourceResolutionExample() {
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  const thread = initialState.threads["thread-rich-transcript"];
  const previewUrl =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  if (!thread) return null;
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main" data-aui-theme="light">
        <ExampleFrame title="Resource resolution">
          <AgentThreadSurface>
            <AgentThreadHeader thread={thread} threadId={thread.thread.id} />
            <AgentMessageList
              resolveLocalMediaUrl={(path) => ({
                displayName: "fixture-image.png",
                kind: "url",
                previewUrl,
                redactedPath: `[agent-ui-local-media]/${path.split(/[\\/]+/).at(-1) ?? "media"}`,
              })}
              thread={thread}
            />
          </AgentThreadSurface>
        </ExampleFrame>
      </main>
    </AgentProvider>
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
    <main className="aui-example-frame">
      <h1>{title}</h1>
      {children}
    </main>
  );
}

function fixtureScenarioFromLocation(): FixtureScenario {
  if (window.location.pathname === "/rich-transcript") return "rich-transcript";
  const state = new URLSearchParams(window.location.search).get("state");
  if (
    state === "empty" ||
    state === "unauth" ||
    state === "bridge-error"
  ) {
    return state;
  }
  return "default";
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
