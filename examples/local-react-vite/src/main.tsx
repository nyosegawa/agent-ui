import {
  createInitialAgentState,
  FakeAgentTransport,
  selectOrderedCollectionThreads,
  selectThreadCollection,
  selectThreadSummaryView,
  selectThreadTranscriptView,
  type AgentThreadScope,
  type ThreadId,
} from "@nyosegawa/agent-ui-core";
import {
  localImageInput,
  textInput,
} from "@nyosegawa/agent-ui-codex/request-builders";
import {
  AgentChat,
  AgentI18nProvider,
  AgentProvider,
  type AgentLocale,
} from "@nyosegawa/agent-ui-react";
import {
  AgentAppsPanel,
  AgentApprovalQueue,
  AgentComposer,
  AgentDiagnosticsPanel,
  AgentFirstRun,
  AgentLocaleSelect,
  AgentMessageList,
  AgentShell,
  AgentSkillsPanel,
  AgentStatusBar,
  AgentStatusDetails,
  AgentStatusSummary,
  AgentThemeToggle,
  AgentThreadSidebar,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadView,
  AgentUsagePanel,
  AgentUsageSummary,
  ThreadList,
  type AgentLocalAttachmentKind,
  type AgentResolvedLocalAttachment,
  type AgentResolvedResource,
  type AgentTheme,
  normalizeUsageWindows,
} from "@nyosegawa/agent-ui-react/primitives";
import {
  useAgentApprovals,
  useAgentBootstrap,
  useAgentChatController,
  useAgentComposerController,
  useAgentContext,
  useAgentThread,
  useAgentThreadListController,
  useAgentUsage,
} from "@nyosegawa/agent-ui-react/headless";
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
import "./styles/route-gallery.css";
import "./styles/host-recipe.css";
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
import {
  publicApiCatalog,
  publicPatternCatalog,
  publicStartCatalog,
  type PublicApiCatalogGroup,
} from "./fixtures/public-component-catalog";

declare global {
  interface Window {
    __agentUiLocalReactViteRoot?: Root;
  }
}

function DemoApp() {
  const { pathname } = window.location;
  if (pathname === "/" || pathname === "/showcase") return <ShowcaseIndex />;
  if (pathname === "/showcase/components") return <ShowcaseComponentsPage />;
  if (pathname === "/showcase/component-preview") return <ComponentPreviewPage />;
  if (pathname === "/showcase/patterns") return <ShowcasePatternsPage />;
  if (pathname === "/maintainer-gallery") return <MaintainerGallery />;
  if (pathname === "/showcase/approvals-status") return <ApprovalsStatusExample />;
  if (pathname === "/showcase/agent-chat-composition") {
    return <AgentChatCompositionExample />;
  }
  if (pathname === "/showcase/app-connectors") return <AppConnectorsExample />;
  if (pathname === "/showcase/composed-shell") return <ComposedShellExample />;
  if (pathname === "/showcase/composer-primitives") return <ComposerPrimitivesExample />;
  if (pathname === "/showcase/composer-retry") return <ComposerRetryExample />;
  if (pathname === "/showcase/host-workflow-recipe") return <HostWorkflowRecipe />;
  if (pathname === "/showcase/resource-resolution") {
    return <ResourceResolutionExample />;
  }
  if (pathname === "/showcase/thread-navigation") return <ThreadNavigationExample />;
  if (pathname === "/showcase/transcript-content") return <TranscriptContentExample />;
  if (pathname === "/showcase/transcript-density") return <TranscriptDensityExample />;
  if (pathname === "/maintainer/scoped-thread-lists") {
    return <ScopedThreadListsExample />;
  }
  if (pathname === "/showcase/scoped-thread-pane") return <ScopedThreadPaneExample />;
  if (pathname === "/showcase/usage-only") return <UsageOnlyExample />;
  if (pathname === "/showcase/rich-transcript") {
    return <AgentDemo scenario="rich-transcript" />;
  }
  if (pathname === "/showcase/empty-authenticated-workspace") {
    return <AgentDemo scenario="empty" />;
  }
  if (pathname === "/showcase/unauthenticated-first-run") {
    return <AgentDemo scenario="unauth" />;
  }
  if (pathname === "/showcase/bridge-error") return <AgentDemo scenario="bridge-error" />;
  if (pathname === "/showcase/default-conversation") return <AgentDemo scenario="default" />;
  return <ShowcaseIndex />;
}

function ComposerRetryExample() {
  const theme = themeFromLocation();
  const [turnStartCalls, setTurnStartCalls] = useState(0);
  const transport = useMemo(
    () => new ComposerRetryTransport(setTurnStartCalls),
    [],
  );
  return (
    <AgentProvider initialState={createInitialAgentState()} transport={transport}>
      <main className="aui-demo-main" data-aui-theme={theme}>
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
  const failedCount = composer.failedPendingMessages.length;
  return (
    <details
      aria-label="Composer retry status"
      className="aui-host-recipe-panel aui-composer-retry-status"
    >
      <summary>Retry diagnostics</summary>
      <dl className="aui-composer-retry-metrics">
        <div>
          <dt>Pending failures</dt>
          <dd aria-label="failed pending count">
            {failedCount === 1 ? "1 failed message" : `${failedCount} failed messages`}
          </dd>
        </div>
        <div>
          <dt>Last error</dt>
          <dd aria-label="failed pending error">{failed?.error ?? "No failed message"}</dd>
        </div>
        <div>
          <dt>Turn starts</dt>
          <dd aria-label="turn start calls">
            {turnStartCalls === 1 ? "1 attempt" : `${turnStartCalls} attempts`}
          </dd>
        </div>
      </dl>
    </details>
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
      <main className="aui-example-frame aui-scoped-thread-route" data-aui-theme="light">
        <header className="aui-scoped-route-header">
          <h1>Scoped thread lists</h1>
          <p>
            Two host-owned history scopes share Agent UI state without sharing
            search terms, cursors, loaded rows, or active selection.
          </p>
        </header>
        <div className="aui-scoped-route-grid" data-testid="scoped-thread-lists">
          <ScopedThreadListPanel
            defaultSearch="alpha"
            label="Left"
            pageThreadId="thread-left-page"
            primaryThreadId="thread-left-alpha"
            scopeKey="history:left-fixture"
          />
          <ScopedThreadListPanel
            defaultSearch="beta"
            label="Right"
            pageThreadId="thread-right-page"
            primaryThreadId="thread-right-beta"
            scopeKey="history:right-fixture"
          />
        </div>
      </main>
    </AgentProvider>
  );
}

function ScopedThreadListPanel({
  defaultSearch,
  label,
  pageThreadId,
  primaryThreadId,
  scopeKey,
}: {
  defaultSearch: string;
  label: string;
  pageThreadId: ThreadId;
  primaryThreadId: ThreadId;
  scopeKey: string;
}) {
  const { dispatch, state } = useAgentContext();
  const didSeed = useRef(false);
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
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
  useEffect(() => {
    if (didSeed.current) return;
    didSeed.current = true;
    loadPage(false);
  });
  return (
    <section aria-label={`${label} scoped list`} className="aui-scoped-list-panel">
      <header className="aui-scoped-list-header">
        <span className="aui-host-recipe-meta-kicker">{label} scope</span>
        <h2>{label} history collection</h2>
        <p>
          This panel owns an independent history scope, cursor, and active
          selection so hosts can compose multiple thread lists.
        </p>
      </header>
      <label>
        <span>Search</span>
        <input
          aria-label={`${label} search`}
          className="aui-text-input"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />
      </label>
      <div className="aui-scoped-list-actions">
        <button type="button" onClick={() => loadPage(false)}>
          Refresh {label}
        </button>
        <button type="button" onClick={() => loadPage(true)}>
          Load more {label}
        </button>
      </div>
      <dl className="aui-scoped-list-meta">
        <div>
          <dt>Scope term</dt>
          <dd aria-label={`${label} scope metadata`}>
            {collection?.scope.kind === "history" && collection.scope.searchTerm
              ? collection.scope.searchTerm
              : "Not loaded"}
          </dd>
        </div>
        <div>
          <dt>Next cursor</dt>
          <dd aria-label={`${label} cursor`}>
            {collection ? collection.nextCursor ?? "End of list" : "Not loaded"}
          </dd>
        </div>
      </dl>
      <ul aria-label={`${label} threads`}>
        {threads.length > 0 ? (
          threads.map((thread) => (
            <li key={thread.thread.id}>
              <button
                type="button"
                onClick={() => dispatch({ threadId: thread.thread.id, type: "thread/active/set" })}
              >
                {thread.thread.name ?? thread.thread.id}
              </button>
            </li>
          ))
        ) : (
          <li className="aui-scoped-list-empty">Refresh this scope to load threads.</li>
        )}
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

function AgentDemo({ scenario }: { scenario: FixtureScenario }) {
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

function ShowcaseIndex() {
  const preferences = useShowcasePreferences();
  return (
    <AgentI18nProvider locale={preferences.locale}>
      <main className="aui-showcase-docs" data-aui-theme={preferences.theme}>
      <div className="aui-showcase-hero">
        <div>
          <h1>Build Codex interfaces with Agent UI</h1>
          <p>
            Choose a starting point, inspect a live example, and copy the code
            shape that matches your host application.
          </p>
        </div>
      </div>
      <ShowcasePreferenceBar preferences={preferences} />
      <ShowcaseGuideNav preferences={preferences} />
      <PublicComponentCatalog preferences={preferences} />
    </main>
    </AgentI18nProvider>
  );
}

function ComponentPreviewPage() {
  const apiName = new URL(window.location.href).searchParams.get("api") ?? "AgentChat";
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const initialState = useMemo(
    () =>
      apiName === "AgentFirstRun"
        ? createFixtureInitialState("empty")
        : createRichTranscriptInitialState(),
    [apiName],
  );
  const transport = useMemo(
    () =>
      createFixtureTransport(
        apiName === "AgentShell" || apiName === "AgentThreadSidebar"
          ? "host-workflow"
          : "rich-transcript",
      ),
    [apiName],
  );
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-component-preview" data-aui-theme={theme}>
          <ComponentPreviewBody apiName={apiName} initialLocale={locale} initialTheme={theme} />
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function ComponentPreviewBody({
  apiName,
  initialLocale,
  initialTheme,
}: {
  apiName: string;
  initialLocale: AgentLocale;
  initialTheme: AgentTheme;
}) {
  const { state } = useAgentContext();
  const embedded = isEmbeddedPreview();
  const threadId = state.threadLifecycle.activeThreadId ?? "thread-rich-transcript";
  const threads = selectOrderedCollectionThreads(state)
    .map((thread) => selectThreadSummaryView(state, thread.id))
    .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));
  const [locale, setLocale] = useState<AgentLocale>(initialLocale);
  const [theme, setTheme] = useState<AgentTheme>(initialTheme);
  const startThread = useCallback(() => undefined, []);

  let preview: ReactNode;
  switch (apiName) {
    case "AgentChat":
      preview = <AgentChat locale={locale} sidebar={false} theme={theme} usage={false} />;
      break;
    case "AgentShell":
      preview = (
        <AgentShell sidebar={<AgentThreadSidebar activeThreadId={threadId} />}>
          <div className="aui-component-preview-chat">
            <AgentStatusBar />
            <AgentThreadView threadId={threadId} />
          </div>
        </AgentShell>
      );
      break;
    case "AgentThreadSidebar":
      preview = <AgentThreadSidebar activeThreadId={threadId} />;
      break;
    case "AgentThreadView":
      preview = <AgentThreadView threadId={threadId} />;
      break;
    case "AgentStatusBar":
      preview = <AgentStatusBar />;
      break;
    case "AgentComposer":
      preview = <AgentComposer threadId={threadId} />;
      break;
    case "AgentMessageList":
      preview = <AgentMessageList density="default" threadId={threadId} />;
      break;
    case "AgentApprovalQueue":
      preview = <AgentApprovalQueue threadId={threadId} />;
      break;
    case "AgentStatusDetails":
      preview = <AgentStatusDetails />;
      break;
    case "AgentStatusSummary":
      preview = <AgentStatusSummary />;
      break;
    case "ThreadList":
      preview = <ThreadList activeThreadId={threadId} threads={threads} />;
      break;
    case "AgentUsagePanel":
      preview = <AgentUsagePanel autoRefresh={false} />;
      break;
    case "AgentUsageSummary":
      preview = <AgentUsageSummary />;
      break;
    case "AgentAppsPanel":
      preview = <AgentAppsPanel />;
      break;
    case "AgentSkillsPanel":
      preview = <AgentSkillsPanel cwd="/Users/example/project" />;
      break;
    case "AgentFirstRun":
      preview = <AgentFirstRun onStartThread={startThread} />;
      break;
    case "AgentLocaleSelect":
      preview = <AgentLocaleSelect value={locale} onChange={setLocale} />;
      break;
    case "AgentThemeToggle":
      preview = <AgentThemeToggle value={theme} onChange={setTheme} />;
      break;
    default:
      preview = <AgentChat locale={locale} sidebar={false} theme={theme} usage={false} />;
      break;
  }

  const compactPreviewApis = new Set([
    "AgentLocaleSelect",
    "AgentStatusSummary",
    "AgentThemeToggle",
    "AgentUsageSummary",
  ]);
  const fullPreviewApis = new Set([
    "AgentChat",
    "AgentShell",
    "AgentThreadSidebar",
    "AgentThreadView",
  ]);

  return (
    <section
      className="aui-component-preview-stage"
      data-api={apiName}
      data-embed={embedded ? "true" : undefined}
      data-size={compactPreviewApis.has(apiName) ? "compact" : "standard"}
      data-surface={fullPreviewApis.has(apiName) ? "full" : "inline"}
    >
      {embedded ? null : (
        <header>
          <span>Component preview</span>
          <h1>{apiName}</h1>
        </header>
      )}
      <div className="aui-component-preview-frame">{preview}</div>
    </section>
  );
}

function ShowcaseGuideNav({
  preferences,
}: {
  preferences: ShowcasePreferences;
}) {
  const guideLinks = [
    {
      description: "Start from a complete chat surface, composed shell, or primitive slot.",
      href: "/showcase",
      label: "Start",
    },
    {
      description: "Look up the public APIs that appear directly in snippets.",
      href: "/showcase/components",
      label: "Components",
    },
    {
      description: "Choose by product workflow instead of component name.",
      href: "/showcase/patterns",
      label: "Patterns",
    },
  ];
  return (
    <nav aria-label="Showcase sections" className="aui-showcase-guide-nav">
      {guideLinks.map((link) => (
        <a href={withShowcasePreferences(link.href, preferences)} key={link.href}>
          <strong>{link.label}</strong>
          <span>{link.description}</span>
        </a>
      ))}
    </nav>
  );
}

interface ShowcasePreferences {
  locale: AgentLocale;
  setLocale: (locale: AgentLocale) => void;
  setTheme: (theme: AgentTheme) => void;
  theme: AgentTheme;
}

function useShowcasePreferences(): ShowcasePreferences {
  const [locale, setLocaleState] = useState<AgentLocale>(() => localeFromLocation());
  const [theme, setThemeState] = useState<AgentTheme>(() => themeFromLocation());
  const updateSearchParam = useCallback((key: "locale" | "theme", value: string) => {
    const url = new URL(window.location.href);
    const defaultValue = key === "locale" ? "en" : "light";
    if (value === defaultValue) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  const setLocale = useCallback(
    (nextLocale: AgentLocale) => {
      setLocaleState(nextLocale);
      updateSearchParam("locale", nextLocale);
    },
    [updateSearchParam],
  );
  const setTheme = useCallback(
    (nextTheme: AgentTheme) => {
      setThemeState(nextTheme);
      updateSearchParam("theme", nextTheme);
    },
    [updateSearchParam],
  );
  return { locale, setLocale, setTheme, theme };
}

function ShowcasePreferenceBar({
  preferences,
}: {
  preferences: ShowcasePreferences;
}) {
  return (
    <div className="aui-showcase-preferences" aria-label="Showcase display settings">
      <span>Theme</span>
      <AgentThemeToggle value={preferences.theme} onChange={preferences.setTheme} />
    </div>
  );
}

function withShowcasePreferences(
  href: string,
  preferences: ShowcasePreferences,
  options: { embed?: boolean } = {},
): string {
  const url = new URL(href, window.location.origin);
  if (options.embed) url.searchParams.set("embed", "1");
  if (preferences.locale !== "en") url.searchParams.set("locale", preferences.locale);
  if (preferences.theme !== "light") url.searchParams.set("theme", preferences.theme);
  return `${url.pathname}${url.search}${url.hash}`;
}

function isEmbeddedPreview(): boolean {
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

function ShowcaseComponentsPage() {
  const preferences = useShowcasePreferences();
  const [query, setQuery] = useState("");
  const [activePanels, setActivePanels] = useState<Record<string, "code" | "preview">>(
    {},
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredApis = publicApiCatalog.filter((api) => {
    if (!normalizedQuery) return true;
    return [
      api.name,
      api.packageName,
      ...api.layers,
      api.group,
      ...api.usedBy.map((entry) => entry.title),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
  const groupedApis = publicApiGroupOrder
    .map((group) => ({
      apis: filteredApis.filter((api) => api.group === group),
      group,
    }))
    .filter((group) => group.apis.length > 0);
  return (
    <AgentI18nProvider locale={preferences.locale}>
      <main className="aui-showcase-docs" data-aui-theme={preferences.theme}>
      <div className="aui-showcase-hero">
        <div>
          <h1>Component API Catalog</h1>
          <p>
            Direct public APIs used by the showcase snippets. Internal primitives
            covered by QA stay in maintainer metadata, not this list.
          </p>
        </div>
      </div>
      <ShowcasePreferenceBar preferences={preferences} />
      <ShowcaseGuideNav preferences={preferences} />
      <section
        aria-label="Component API catalog"
        className="aui-showcase-section"
        data-testid="public-api-catalog"
      >
        <header className="aui-showcase-section-header">
          <div>
            <h2>Use This API</h2>
            <p>
              Search by API name, package, layer, or the starting point where it
              appears.
            </p>
          </div>
          <span>{filteredApis.length} APIs</span>
        </header>
        <label className="aui-showcase-search">
          <span>Search APIs</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="AgentComposer, primitives, host shell..."
            type="search"
            value={query}
          />
        </label>
        <div className="aui-showcase-api-groups">
          {groupedApis.map(({ apis, group }) => (
            <section className="aui-showcase-api-group" key={group}>
              <header>
                <h3>{group}</h3>
                <p>{publicApiGroupDescriptions[group]}</p>
              </header>
              <div className="aui-showcase-api-grid">
                {apis.map((api) => (
                  <article
                    className="aui-showcase-api-card"
                    data-api-name={api.name}
                    key={api.name}
                  >
              <header>
                <span>{api.layers.join(" · ")}</span>
                <h4>
                  {api.name}
                  {!api.isVisual ? <small>Non-visual</small> : null}
                </h4>
                <code>{api.packageName}</code>
              </header>
              <div className="aui-public-component-list">
                <span>Used in</span>
                <ul>
                  {api.usedBy.map((entry) => (
                    <li key={entry.title}>
                      <a
                        href={withShowcasePreferences(
                          showcaseSnippetHref(entry),
                          preferences,
                        )}
                      >
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {api.isVisual ? (
                <>
                  <ShowcaseTabs
                    activePanel={activePanels[api.name] ?? "preview"}
                    id={`api-${slugifyShowcaseTitle(api.name)}`}
                    label={api.name}
                    onChange={(panel) =>
                      setActivePanels((current) => ({ ...current, [api.name]: panel }))
                    }
                  />
                  {(activePanels[api.name] ?? "preview") === "preview" ? (
                    <ShowcasePreviewFrame
                      href={api.previewHref}
                      id={`api-${slugifyShowcaseTitle(api.name)}`}
                      preferences={preferences}
                      title={`${api.name} preview`}
                    />
                  ) : (
                    <CopyableCode
                      code={api.sampleCode}
                      id={`api-${slugifyShowcaseTitle(api.name)}`}
                      label={`${api.name} code`}
                    />
                  )}
                </>
              ) : (
                <div className="aui-showcase-api-note">
                  <strong>Non-visual provider</strong>
                  <p>
                    This API supplies Agent UI state and transport context. It is
                    shown in snippets, but it does not render UI by itself.
                  </p>
                  <CopyableCode
                    code={api.sampleCode}
                    id={`api-${slugifyShowcaseTitle(api.name)}`}
                    label={`${api.name} code`}
                  />
                </div>
              )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
    </AgentI18nProvider>
  );
}

const publicApiGroupOrder: readonly PublicApiCatalogGroup[] = [
  "Setup",
  "Presets",
  "Layout primitives",
  "Status and review",
  "Usage",
  "Onboarding and controls",
  "Advanced capability metadata",
];

const publicApiGroupDescriptions: Record<PublicApiCatalogGroup, string> = {
  "Advanced capability metadata":
    "Optional metadata panels for hosts that expose Codex capabilities outside the main chat flow.",
  "Layout primitives":
    "Composable visual regions for hosts that build their own shell around Agent UI.",
  "Onboarding and controls":
    "Controls used around workspace setup or display settings, not primary chat layout.",
  Presets: "Complete surfaces that own the default Agent UI chat experience.",
  "Setup": "Provider boundary and transport wiring required before visual components render.",
  "Status and review":
    "Review and runtime status primitives that can sit outside the transcript.",
  Usage: "Usage, quota, and diagnostics primitives for settings, rails, or dashboards.",
};

function ShowcasePatternsPage() {
  const preferences = useShowcasePreferences();
  const [activePanels, setActivePanels] = useState<Record<string, "code" | "preview">>(
    {},
  );
  const patternGroups = [
    {
      description:
        "Primary host workflows that decide where Agent UI owns behavior and where the host remains in control.",
      entries: publicPatternCatalog.filter((entry) => entry.patternSection === "workflow"),
      title: "Workflow recipes",
    },
    {
      description:
        "Optional capability, setup, and edge-case recipes that usually belong after the main integration path is chosen.",
      entries: publicPatternCatalog.filter((entry) => entry.patternSection === "advanced"),
      title: "Advanced recipes",
    },
  ].filter((group) => group.entries.length > 0);
  return (
    <AgentI18nProvider locale={preferences.locale}>
      <main className="aui-showcase-docs" data-aui-theme={preferences.theme}>
      <div className="aui-showcase-hero">
        <div>
          <h1>Host Patterns</h1>
          <p>
            Pick the workflow shape first, then open the live route or copy the
            matching snippet from the starting-point page.
          </p>
        </div>
      </div>
      <ShowcasePreferenceBar preferences={preferences} />
      <ShowcaseGuideNav preferences={preferences} />
      <section
        aria-label="Host pattern catalog"
        className="aui-showcase-section"
        data-testid="public-pattern-catalog"
      >
        <header className="aui-showcase-section-header">
          <div>
            <h2>Choose By Workflow</h2>
            <p>
              Patterns keep host responsibilities explicit while linking back to
              the exact API snippet and deterministic fixture route.
            </p>
          </div>
          <span>{publicPatternCatalog.length} patterns</span>
        </header>
        <div className="aui-showcase-pattern-groups">
          {patternGroups.map((group) => (
            <section className="aui-showcase-pattern-group" key={group.title}>
              <header>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </header>
              <div className="aui-showcase-pattern-grid">
                {group.entries.map((entry) => {
                  const id = `pattern-${slugifyShowcaseTitle(entry.title)}`;
                  const activePanel = activePanels[id] ?? "preview";
                  return (
                    <article
                      className="aui-showcase-pattern-card"
                      id={id}
                      key={entry.title}
                    >
                      <header className="aui-showcase-path-header">
                        <div>
                          <span>{entry.layer}</span>
                          <h4>{entry.title}</h4>
                          <p>{entry.whenToUse}</p>
                        </div>
                        <div className="aui-showcase-pattern-actions">
                          <a
                            href={withShowcasePreferences(
                              showcaseSnippetHref(entry),
                              preferences,
                            )}
                          >
                            View snippet
                          </a>
                          <a href={withShowcasePreferences(entry.href, preferences)}>
                            Open route
                          </a>
                        </div>
                      </header>
                      <dl>
                        <div>
                          <dt>Agent UI owns</dt>
                          <dd>{summarizeOwnership(entry.ownership, 0)}</dd>
                        </div>
                        <div>
                          <dt>Host owns</dt>
                          <dd>{summarizeOwnership(entry.ownership, 1)}</dd>
                        </div>
                      </dl>
                      <ShowcaseTabs
                        activePanel={activePanel}
                        id={id}
                        label={entry.title}
                        onChange={(panel) =>
                          setActivePanels((current) => ({ ...current, [id]: panel }))
                        }
                      />
                      {activePanel === "preview" ? (
                        <ShowcasePreviewFrame
                          href={entry.href}
                          id={id}
                          preferences={preferences}
                          title={`${entry.title} preview`}
                        />
                      ) : (
                        <CopyableCode
                          code={entry.copyCode}
                          id={id}
                          label={`${entry.title} code`}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
    </AgentI18nProvider>
  );
}

function summarizeOwnership(ownership: string, index: number): string {
  const sentences = ownership
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences[index] ?? ownership;
}

function showcaseSnippetHref(entry: { start: boolean; title: string }): string {
  const slug = slugifyShowcaseTitle(entry.title);
  return entry.start ? `/showcase#${slug}` : `/showcase/patterns#pattern-${slug}`;
}

function PublicComponentCatalog({
  preferences,
}: {
  preferences: ShowcasePreferences;
}) {
  const [activePanels, setActivePanels] = useState<Record<string, "code" | "preview">>(
    {},
  );
  return (
    <section
      aria-label="Public component catalog"
      className="aui-showcase-section"
      data-testid="public-component-catalog"
      id="component-catalog"
    >
      <header className="aui-showcase-section-header">
        <div>
          <h2>Choose Your Starting Point</h2>
          <p>
            Start with the primary integration shape. Advanced capabilities,
            setup controls, and edge states live in Patterns or Components.
          </p>
        </div>
        <span>{publicStartCatalog.length} paths</span>
      </header>
      <div className="aui-showcase-paths">
        {publicStartCatalog.map((entry) => {
          const id = slugifyShowcaseTitle(entry.title);
          const activePanel = activePanels[id] ?? "preview";
          return (
            <article
              className="aui-showcase-path"
              data-layer={entry.layer}
              id={id}
              key={entry.title}
            >
              <header className="aui-showcase-path-header">
                <div className="aui-showcase-path-copy">
                  <span>{entry.layer}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                </div>
                <div className="aui-showcase-live-link">
                  <a href={withShowcasePreferences(entry.href, preferences)}>
                    Open route
                  </a>
                  <CopyTextButton
                    label="Copy URL"
                    text={withShowcasePreferences(entry.href, preferences)}
                  />
                </div>
              </header>
              <div className="aui-public-component-list">
                <span>Use this API</span>
                <ul>
                  {entry.codeApi.map((apiName) => (
                    <li key={apiName}>{apiName}</li>
                  ))}
                </ul>
              </div>
              <ShowcaseTabs
                activePanel={activePanel}
                id={id}
                label={entry.title}
                onChange={(panel) =>
                  setActivePanels((current) => ({ ...current, [id]: panel }))
                }
              />
              {activePanel === "preview" ? (
                <ShowcasePreviewFrame
                  href={entry.href}
                  id={id}
                  preferences={preferences}
                  title={`${entry.title} preview`}
                />
              ) : (
                <CopyableCode code={entry.copyCode} id={id} label={`${entry.title} code`} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShowcaseTabs({
  activePanel,
  id,
  label,
  onChange,
}: {
  activePanel: "code" | "preview";
  id: string;
  label: string;
  onChange: (panel: "code" | "preview") => void;
}) {
  return (
    <div className="aui-showcase-tabs" role="tablist" aria-label={label}>
      <button
        aria-controls={`${id}-preview`}
        aria-selected={activePanel === "preview"}
        id={`${id}-preview-tab`}
        onClick={() => onChange("preview")}
        role="tab"
        type="button"
      >
        Preview
      </button>
      <button
        aria-controls={`${id}-code`}
        aria-selected={activePanel === "code"}
        id={`${id}-code-tab`}
        onClick={() => onChange("code")}
        role="tab"
        type="button"
      >
        Code
      </button>
    </div>
  );
}

function ShowcasePreviewFrame({
  href,
  id,
  preferences,
  title,
}: {
  href: string;
  id: string;
  preferences: ShowcasePreferences;
  title: string;
}) {
  const previewHref = withShowcasePreferences(href, preferences, { embed: true });
  const previewSurface = href.includes("/showcase/component-preview")
    ? new URL(href, window.location.origin).searchParams.get("api") ?? ""
    : "";
  return (
    <div
      aria-labelledby={`${id}-preview-tab`}
      className="aui-showcase-preview"
      data-preview-surface={previewSurface}
      id={`${id}-preview`}
      role="tabpanel"
    >
      <div className="aui-showcase-preview-url">
        <code>{previewHref}</code>
      </div>
      <iframe loading="lazy" src={previewHref} title={title} />
    </div>
  );
}

function CopyableCode({
  code,
  id,
  label,
}: {
  code: string;
  id: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      aria-labelledby={`${id}-code-tab`}
      className="aui-showcase-code"
      id={`${id}-code`}
      role="tabpanel"
    >
      <header>
        <span>{label}</span>
        <CopyTextButton
          copiedLabel="Copied"
          label={copied ? "Copied" : "Copy code"}
          onCopiedChange={setCopied}
          text={code}
        />
      </header>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyTextButton({
  copiedLabel = "Copied",
  label,
  onCopiedChange,
  text,
}: {
  copiedLabel?: string;
  label: string;
  onCopiedChange?: (copied: boolean) => void;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  const visibleLabel = copied ? copiedLabel : label;
  return (
    <button
      type="button"
      onClick={() => {
        const copyPromise = navigator.clipboard?.writeText(text) ?? Promise.resolve();
        void copyPromise.then(() => {
          setCopied(true);
          onCopiedChange?.(true);
          window.setTimeout(() => {
            setCopied(false);
            onCopiedChange?.(false);
          }, 1200);
        });
      }}
    >
      {visibleLabel}
    </button>
  );
}

function slugifyShowcaseTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function MaintainerGallery() {
  const grouped = useMemo(() => groupFixtures(visualQaStates), []);
  const theme = themeFromLocation();
  return (
    <main className="aui-route-gallery" data-aui-theme={theme}>
      <div className="aui-route-gallery-header">
        <div>
          <h1>Agent UI maintainer gallery</h1>
          <p>
            Maintainer-only visual QA for primitive close-ups, critical states,
            probes, specimens, and full-page preview comparisons.
          </p>
        </div>
        <div className="aui-route-gallery-actions">
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
          className="aui-route-gallery-group"
          id={
            group === "core"
              ? "preset-surfaces"
              : group === "primitives"
                ? "primitive-compositions"
                : "full-page-previews"
          }
          key={group}
        >
          <header className="aui-route-gallery-group-header">
            <h2>{fixtureGroupLabels[group]}</h2>
            <span>{states.length} preview{states.length === 1 ? "" : "s"}</span>
          </header>
          <div className="aui-route-gallery-grid">
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
      runtime: { status: { type: "idle" } },
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
      runtime: {
        lastTurn: { result: "completed", status: "completed", turnId: "turn-fixed" },
        status: { type: "idle" },
      },
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
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.account = {
      account: { email: "fixture@example.com", planType: "pro" },
      status: "authenticated",
    };
    state.usage.accountRateLimits = fixtureRateLimits();
    return state;
  }, []);
  const compactRail = (
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
  );
  return (
    <AgentProvider initialState={initialState} transport={new FakeAgentTransport()}>
      <main
        className="aui-usage-only"
        data-aui-embed={embedded ? "true" : undefined}
        data-aui-theme={theme}
        aria-label="Usage primitive demo"
      >
        {embedded ? null : (
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
        )}

        {compactRail}

        {embedded ? null : <section
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
        </section>}

        {embedded ? null : <section
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
        </section>}

        {embedded ? null : <section
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
        </section>}
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
  const initialState = useMemo(() => {
    const state = createInitialAgentState();
    state.apps.byScope["thread-connectors"] = {
      apps: [
        {
          accessible: true,
          enabled: true,
          id: "browser",
          installUrl: "app://browser",
          name: "Browser",
        },
        {
          accessible: false,
          enabled: false,
          id: "drive",
          installUrl: "app://drive",
          name: "Drive",
        },
      ],
      nextCursor: null,
      threadId: "thread-connectors",
    };
    return state;
  }, []);
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
    <AgentProvider initialState={initialState} transport={transport}>
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

function AgentChatCompositionExample() {
  const initialState = useMemo(() => createHostWorkflowInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("host-workflow"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <HostWorkflowComposition
        firstMessageControls={null}
        firstMessageStats={{ threadStartCalls: 0, turnStartCalls: 0 }}
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

function DemoThreadHeader({ threadId }: { threadId: ThreadId }) {
  const { state } = useAgentContext();
  const thread = selectThreadSummaryView(state, threadId);
  const transcript = selectThreadTranscriptView(state, threadId);
  if (!thread) return null;
  return (
    <AgentThreadHeader
      thread={thread}
      threadId={threadId}
      transcript={transcript}
    />
  );
}

function ComposedShellExample() {
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("host-workflow"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <ExampleFrame title="Composed shell">
            <section className="aui-composed-shell-example" aria-label="Composed shell">
              {embedded ? null : (
                <header>
                  <span>Composition · shell</span>
                  <h2>Embed Agent UI regions inside host-owned chrome</h2>
                  <p>
                    The host owns page layout and workflow context. Agent UI owns
                    sidebar history, status, transcript, approvals, and composer
                    behavior inside the shell.
                  </p>
                </header>
              )}
              <AgentShell
                sidebar={<AgentThreadSidebar activeThreadId="thread-rich-transcript" />}
              >
                <div className="aui-composed-shell-main">
                  <AgentStatusBar />
                  <AgentThreadView threadId="thread-rich-transcript" />
                </div>
              </AgentShell>
            </section>
          </ExampleFrame>
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function ApprovalsStatusExample() {
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <ExampleFrame title="Review rail">
            <section className="aui-review-rail-example" aria-label="Review rail">
              {embedded ? null : (
                <header>
                  <span>Primitive · review</span>
                  <h2>Keep runtime status and approval actions visible</h2>
                  <p>
                    Place review primitives beside your host workflow without
                    taking ownership of approval semantics or pending request state.
                  </p>
                </header>
              )}
              <div className="aui-review-rail-grid">
                <aside aria-label="Review primitives">
                  <AgentStatusSummary />
                  <AgentStatusDetails />
                  <AgentApprovalQueue threadId="thread-rich-transcript" />
                </aside>
                <AgentThreadView threadId="thread-rich-transcript" />
              </div>
            </section>
          </ExampleFrame>
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function ComposerPrimitivesExample() {
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <ExampleFrame title="Composer slot">
            <section className="aui-primitive-example-card" aria-label="Composer primitive">
              {embedded ? null : (
                <header>
                  <span>Primitive · composer</span>
                  <h2>Place the Codex composer in a host-owned input slot</h2>
                  <p>
                    The host owns the surrounding layout. Agent UI owns queued
                    follow-ups, submit state, interrupt handling, and attachment
                    normalization for the active thread.
                  </p>
                </header>
              )}
              <AgentComposer threadId="thread-rich-transcript" />
            </section>
          </ExampleFrame>
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function TranscriptContentExample() {
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <ExampleFrame title="Transcript pane">
            <AgentThreadSurface>
              <DemoThreadHeader threadId="thread-rich-transcript" />
              <AgentMessageList threadId="thread-rich-transcript" />
            </AgentThreadSurface>
          </ExampleFrame>
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function ThreadNavigationExample() {
  const locale = localeFromLocation();
  const theme = themeFromLocation();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <AgentI18nProvider locale={locale}>
        <main className="aui-demo-main" data-aui-theme={theme}>
          <ExampleFrame title="Thread navigation">
            <ThreadNavigationPreview />
          </ExampleFrame>
        </main>
      </AgentI18nProvider>
    </AgentProvider>
  );
}

function ThreadNavigationPreview() {
  const { dispatch, state } = useAgentContext();
  const activeThreadId = state.threadLifecycle.activeThreadId ?? "thread-rich-transcript";
  const threads = selectOrderedCollectionThreads(state)
    .map((thread) => selectThreadSummaryView(state, thread.id))
    .filter((thread): thread is NonNullable<typeof thread> => Boolean(thread));
  const selectThread = useCallback(
    (threadId: string) => dispatch({ threadId, type: "thread/active/set" }),
    [dispatch],
  );
  return (
    <section className="aui-thread-navigation-example" aria-label="Thread navigation primitive">
      <ThreadList
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        threads={threads}
      />
      <AgentThreadView threadId={activeThreadId} />
    </section>
  );
}

function TranscriptDensityExample() {
  const theme = themeFromLocation();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  const thread = initialState.threads["thread-rich-transcript"];
  if (!thread) return null;
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main" data-aui-theme={theme}>
        <ExampleFrame title="Transcript density">
          <AgentThreadSurface>
            <DemoThreadHeader threadId={thread.thread.id} />
            <AgentMessageList
              density={{
                default: "compact",
                byBlockKind: {
                  commandExecution: "verbose",
                  fileChange: "verbose",
                  text: "critical-only",
                },
              }}
              threadId={thread.thread.id}
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
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  const bootstrap = useAgentBootstrap();
  const { thread } = useAgentThread();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextSheetOpen, setContextSheetOpen] = useState(false);
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
    <main
      className="aui-host-recipe"
      data-aui-embed={embedded ? "true" : undefined}
      data-aui-theme={theme}
    >
      <div className="aui-host-recipe-shell">
        {embedded ? null : <header className="aui-host-recipe-header">
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
        </header>}
        <section
          className="aui-host-composition"
          aria-label="Host integration reference"
        >
          <div className="aui-host-thread">
            <AgentChat
              components={{
                StatusBar: ({ Default, end, ...props }) => (
                  <Default
                    {...props}
                    end={
                      <>
                        <span className="aui-host-inline-status">Host verified</span>
                        {end}
                      </>
                    }
                  />
                ),
                ThreadHeader: ({ Default, ...props }) => (
                  <div className="aui-host-thread-header">
                    <Default {...props} />
                  </div>
                ),
              }}
              controls={{
                contextSheetOpen,
                onContextSheetOpenChange: setContextSheetOpen,
                onSidebarCollapsedChange: setSidebarCollapsed,
                sidebarCollapsed,
              }}
              diagnostics={false}
              resolveLocalAttachment={resolveHostAttachment}
              resolveLocalMediaUrl={resolveHostLocalMediaUrl}
              sidebar
              startOptions={{
                threadOptions: {
                  cwd: "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
                  sandbox: "workspace-write",
                  threadSource: "user",
                },
                turnOptions: {
                  effort: "medium",
                  model: "gpt-5-codex",
                },
              }}
              threadHeaderEnd={({ thread }) => (
                <button
                  className="aui-host-action"
                  onClick={() => setHostSheetOpen(true)}
                  type="button"
                >
                  Review {thread.id}
                </button>
              )}
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
        <DemoThreadHeader threadId={threadId} />
        <AgentMessageList threadId={threadId} />
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
  const chat = useAgentChatController();
  const { approvals } = useAgentApprovals(thread?.thread.id);
  const { rateLimits } = useAgentUsage();
  const [externalSendStatus, setExternalSendStatus] = useState("Ready");
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
          onClick={() => {
            setExternalSendStatus("Sending");
            void chat
              .sendMessage("Summarize the host workflow context.", {
                turnOptions: { effort: "medium", model: "gpt-5-codex" },
              })
              .then((result) => setExternalSendStatus(result.type))
              .catch((error: unknown) =>
                setExternalSendStatus(
                  error instanceof Error ? error.message : "External send failed",
                ),
              );
          }}
          type="button"
        >
          Send host prompt
        </button>
        <span aria-label="External send status">{externalSendStatus}</span>
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
  const theme = themeFromLocation();
  const initialState = useMemo(() => createRichTranscriptInitialState(), []);
  const transport = useMemo(() => createFixtureTransport("rich-transcript"), []);
  const thread = initialState.threads["thread-rich-transcript"];
  const previewUrl =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
  if (!thread) return null;
  return (
    <AgentProvider initialState={initialState} transport={transport}>
      <main className="aui-demo-main" data-aui-theme={theme}>
        <ExampleFrame title="Resource resolution">
          <AgentThreadSurface>
            <DemoThreadHeader threadId={thread.thread.id} />
            <AgentMessageList
              resolveLocalMediaUrl={(path) => ({
                displayName: "fixture-image.png",
                kind: "url",
                previewUrl,
                redactedPath: `[agent-ui-local-media]/${path.split(/[\\/]+/).at(-1) ?? "media"}`,
              })}
              threadId={thread.thread.id}
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
  const theme = themeFromLocation();
  const embedded = isEmbeddedPreview();
  return (
    <main
      className="aui-example-frame"
      data-aui-embed={embedded ? "true" : undefined}
      data-aui-theme={theme}
    >
      {embedded ? null : <h1>{title}</h1>}
      {children}
    </main>
  );
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
