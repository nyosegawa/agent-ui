export type PublicComponentCatalogLayer =
  | "default"
  | "composition"
  | "primitive"
  | "host-integration";

export interface PublicComponentCatalogEntry {
  codeApi: readonly string[];
  coveredComponents: readonly string[];
  copyCode: string;
  description: string;
  href: string;
  layer: PublicComponentCatalogLayer;
  ownership: string;
  patternSection: "workflow" | "advanced";
  routeIds: readonly string[];
  start: boolean;
  title: string;
  whenToUse: string;
}

export interface PublicComponentCoverageEntry {
  component: string;
  layer: PublicComponentCatalogLayer;
  routeIds: readonly string[];
}

export interface PublicApiCatalogEntry {
  group: PublicApiCatalogGroup;
  isVisual: boolean;
  layers: readonly PublicComponentCatalogLayer[];
  name: string;
  packageName:
    | "@nyosegawa/agent-ui-react"
    | "@nyosegawa/agent-ui-react/headless"
    | "@nyosegawa/agent-ui-react/primitives";
  previewHref: string;
  sampleCode: string;
  usedBy: readonly {
    href: string;
    start: boolean;
    title: string;
  }[];
}

export type PublicApiCatalogGroup =
  | "Setup"
  | "Presets"
  | "Layout primitives"
  | "Status and review"
  | "Usage"
  | "Onboarding and controls"
  | "Advanced capability metadata";

export const publicComponentCatalog: readonly PublicComponentCatalogEntry[] = [
  {
    codeApi: ["AgentProvider", "AgentChat"],
    coveredComponents: ["AgentChat"],
    copyCode: `import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

export function App({ transport }) {
  return (
    <AgentProvider transport={transport}>
      <AgentChat usage diagnostics />
    </AgentProvider>
  );
}`,
    description:
      "Use the complete Codex chat preset when the host wants Agent UI to own the chat chrome.",
    href: "/showcase/default-conversation",
    layer: "default",
    ownership:
      "Agent UI owns the shell, thread history, transcript, composer, approvals, usage, and diagnostics. The host supplies transport, auth, and process lifecycle.",
    patternSection: "workflow",
    routeIds: ["default-conversation", "rich-transcript"],
    start: true,
    title: "Default chat preset",
    whenToUse: "Start here when you want a complete Codex chat surface with minimal composition.",
  },
  {
    codeApi: [
      "AgentProvider",
      "AgentChat",
      "useAgentChatController",
    ],
    coveredComponents: [
      "AgentChat",
      "AgentStatusBar",
      "AgentThreadHeader",
      "AgentThreadSidebar",
      "AgentComposer",
    ],
    copyCode: `import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import { useAgentChatController } from "@nyosegawa/agent-ui-react/headless";
import "@nyosegawa/agent-ui-react/styles.css";

function HostCommandBar() {
  const chat = useAgentChatController();
  return (
    <button
      onClick={() => void chat.sendMessage("Summarize this thread")}
      type="button"
    >
      Send from host UI
    </button>
  );
}

export function App({ transport }) {
  return (
    <AgentProvider transport={transport}>
      <HostCommandBar />
      <AgentChat
        components={{
          StatusBar: ({ Default, end, ...props }) => (
            <Default {...props} end={<><span>Host status</span>{end}</>} />
          ),
        }}
        startOptions={{ threadOptions: { cwd: "/workspace/fixed-project" } }}
        threadHeaderEnd={({ thread }) => (
          <button type="button">Host actions for {thread.id}</button>
        )}
        usage
      />
    </AgentProvider>
  );
}`,
    description:
      "Keep the complete AgentChat preset while replacing documented surfaces and sending from host-owned UI.",
    href: "/showcase/agent-chat-composition",
    layer: "composition",
    ownership:
      "Agent UI owns the chat lifecycle, optimistic state, history drawer, composer, and local media rendering. The host owns product chrome, fixed starter policy, overlay coordination, and external controls.",
    patternSection: "workflow",
    routeIds: ["agent-chat-composition", "host-workflow-recipe"],
    start: true,
    title: "Composable chat preset",
    whenToUse:
      "Use this when AgentChat is mostly right but host chrome needs targeted replacement points and external send actions.",
  },
  {
    codeApi: [
      "AgentProvider",
      "AgentShell",
      "AgentThreadSidebar",
      "AgentThreadView",
      "AgentStatusBar",
    ],
    coveredComponents: [
      "AgentShell",
      "AgentThreadSidebar",
      "AgentThreadView",
      "AgentThreadSurface",
      "AgentThreadHeader",
      "AgentComposer",
      "AgentStatusBar",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentShell,
  AgentStatusBar,
  AgentThreadSidebar,
  AgentThreadView,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function HostShell({ activeThreadId, setActiveThreadId, transport }) {
  return (
    <AgentProvider transport={transport}>
      <AgentShell
        sidebar={
          <AgentThreadSidebar
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
          />
        }
      >
        <AgentStatusBar />
        <AgentThreadView threadId={activeThreadId} />
      </AgentShell>
    </AgentProvider>
  );
}`,
    description:
      "Compose the durable thread, sidebar, status, and transcript regions inside host chrome.",
    href: "/showcase/composed-shell",
    layer: "composition",
    ownership:
      "The host owns page layout, product navigation, review sheets, persistence policy, and workflow state. Agent UI owns the embedded Codex chat behavior.",
    patternSection: "workflow",
    routeIds: ["composed-shell", "host-workflow-recipe"],
    start: true,
    title: "Composed shell",
    whenToUse:
      "Use this when Agent UI lives inside a larger product workflow instead of occupying the whole page.",
  },
  {
    codeApi: ["AgentProvider", "AgentComposer"],
    coveredComponents: [
      "AgentComposer",
      "AgentComposerInput",
      "AgentComposerToolbar",
      "AgentComposerSubmitButton",
      "AgentAttachmentChips",
      "ComposerRunControls",
      "AgentRunControls",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import { AgentComposer } from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function ComposerSlot({ transport, threadId }) {
  return (
    <AgentProvider transport={transport}>
      <AgentComposer threadId={threadId} />
    </AgentProvider>
  );
}`,
    description:
      "Use composer primitives when the host needs a custom input placement, queued follow-ups, attachments, or run controls.",
    href: "/showcase/composer-primitives",
    layer: "primitive",
    ownership:
      "Agent UI owns submit, interrupt, queued follow-ups, and attachment normalization. The host owns where files are stored and how local resources resolve.",
    patternSection: "workflow",
    routeIds: ["composer-primitives", "host-workflow-recipe", "resource-resolution"],
    start: true,
    title: "Composer slot",
    whenToUse:
      "Use this when the composer belongs in a custom host layout or workflow-specific input region.",
  },
  {
    codeApi: ["AgentProvider", "AgentMessageList"],
    coveredComponents: [
      "AgentMessageList",
      "AgentTranscript",
      "AgentThreadTimeline",
      "AgentTurn",
      "AgentContentBlockView",
      "AgentMessageItem",
      "AgentCommandItem",
      "AgentCommandOutputItem",
      "AgentToolCallItem",
      "AgentReasoningItem",
      "AgentDiffViewer",
      "AgentDiffItem",
      "AgentFileChangeItem",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import { AgentMessageList } from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function TranscriptPane({ transport, threadId }) {
  return (
    <AgentProvider transport={transport}>
      <AgentMessageList threadId={threadId} />
    </AgentProvider>
  );
}`,
    description:
      "Render transcript messages, command output, file changes, and custom content blocks without taking over protocol state.",
    href: "/showcase/transcript-content",
    layer: "primitive",
    ownership:
      "Agent UI owns transcript rendering, block semantics, approvals anchoring, and safe local-media fallbacks. The host owns any custom renderer data it injects.",
    patternSection: "workflow",
    routeIds: ["rich-transcript", "transcript-content", "resource-resolution"],
    start: true,
    title: "Transcript pane",
    whenToUse:
      "Use this when you need a transcript pane without the full AgentChat preset.",
  },
  {
    codeApi: [
      "AgentProvider",
      "AgentApprovalQueue",
      "AgentStatusDetails",
      "AgentStatusSummary",
    ],
    coveredComponents: [
      "AgentApprovalQueue",
      "AgentCriticalNoticeList",
      "AgentStatusSummary",
      "AgentStatusDetails",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentApprovalQueue,
  AgentStatusDetails,
  AgentStatusSummary,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function ReviewRail({ transport }) {
  return (
    <AgentProvider transport={transport}>
      <aside className="review-rail">
        <AgentStatusSummary />
        <AgentStatusDetails />
        <AgentApprovalQueue />
      </aside>
    </AgentProvider>
  );
}`,
    description:
      "Surface approvals and critical notices in a review rail while keeping approval decisions inside Agent UI primitives.",
    href: "/showcase/approvals-status",
    layer: "primitive",
    ownership:
      "Agent UI owns approval actions and status semantics. The host owns surrounding policy text and where the review rail appears.",
    patternSection: "workflow",
    routeIds: ["approvals-status", "rich-transcript", "host-workflow-recipe"],
    start: true,
    title: "Review rail",
    whenToUse:
      "Use this when approvals or runtime notices must be visible outside the transcript.",
  },
  {
    codeApi: ["AgentProvider", "AgentThreadView", "ThreadList"],
    coveredComponents: [
      "ThreadList",
      "AgentThreadSidebar",
      "AgentThreadView",
      "AgentThreadSurface",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentThreadView,
  ThreadList,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function ThreadNavigation({ activeThreadId, setActiveThreadId, threads, transport }) {
  return (
    <AgentProvider transport={transport}>
      <section className="thread-layout">
        <ThreadList
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
          threads={threads}
        />
        <AgentThreadView threadId={activeThreadId} />
      </section>
    </AgentProvider>
  );
}`,
    description:
      "Build host-owned navigation around thread rows, active selection, and an embedded thread view.",
    href: "/showcase/thread-navigation",
    layer: "host-integration",
    ownership:
      "Agent UI owns thread row and thread view primitives. The host owns routing, list scopes, URL state, and workspace selection.",
    patternSection: "workflow",
    routeIds: ["thread-navigation", "host-workflow-recipe"],
    start: false,
    title: "Thread navigation",
    whenToUse:
      "Use this when the host already has navigation and needs Agent UI thread surfaces inside it.",
  },
  {
    codeApi: ["AgentProvider", "AgentUsagePanel", "AgentUsageSummary"],
    coveredComponents: [
      "AgentUsagePanel",
      "AgentUsageSummary",
      "AgentRateLimitBar",
      "AgentTokenUsageBar",
      "AgentContextUsageIndicator",
      "AgentDiagnosticsPanel",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentUsagePanel,
  AgentUsageSummary,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function UsageSettings({ transport }) {
  return (
    <AgentProvider transport={transport}>
      <section className="usage-settings">
        <AgentUsageSummary />
        <AgentUsagePanel autoRefresh={false} />
      </section>
    </AgentProvider>
  );
}`,
    description:
      "Display usage, diagnostics, context pressure, and rate-limit state without requiring chat chrome.",
    href: "/showcase/usage-only",
    layer: "primitive",
    ownership:
      "Agent UI owns usage display primitives. The host owns refresh cadence, settings placement, and account-level product copy.",
    patternSection: "workflow",
    routeIds: ["usage-only", "default-conversation"],
    start: false,
    title: "Usage and diagnostics",
    whenToUse:
      "Use this when usage or diagnostics should appear in settings, sidebars, or dashboards.",
  },
  {
    codeApi: ["AgentProvider", "AgentAppsPanel", "AgentSkillsPanel"],
    coveredComponents: ["AgentAppsPanel", "AgentSkillsPanel"],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentAppsPanel,
  AgentSkillsPanel,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function CapabilityPanels({ cwd, transport }) {
  return (
    <AgentProvider transport={transport}>
      <section className="capability-panels">
        <AgentAppsPanel />
        <AgentSkillsPanel cwd={cwd} />
      </section>
    </AgentProvider>
  );
}`,
    description:
      "Render Codex app metadata and skill controls while the host owns registry, marketplace, and execution policy.",
    href: "/showcase/app-connectors",
    layer: "host-integration",
    ownership:
      "Agent UI renders normalized app and skill metadata. The host owns registry policy, marketplace decisions, and execution boundaries.",
    patternSection: "advanced",
    routeIds: ["app-connectors"],
    start: false,
    title: "Apps and skills metadata",
    whenToUse:
      "Use this when your host exposes Codex apps/connectors or skills as inspectable capabilities.",
  },
  {
    codeApi: [
      "AgentProvider",
      "AgentFirstRun",
      "AgentLocaleSelect",
      "AgentThemeToggle",
    ],
    coveredComponents: [
      "AgentFirstRun",
      "AgentStartComposer",
      "AgentStarterCwd",
      "AgentLocaleSelect",
      "AgentThemeToggle",
    ],
    copyCode: `import { AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentFirstRun,
  AgentLocaleSelect,
  AgentThemeToggle,
} from "@nyosegawa/agent-ui-react/primitives";
import "@nyosegawa/agent-ui-react/styles.css";

export function FirstRun({ locale, setLocale, startThread, theme, setTheme, transport }) {
  return (
    <AgentProvider transport={transport}>
      <section className="first-run">
        <AgentFirstRun onStartThread={startThread} />
        <AgentLocaleSelect value={locale} onChange={setLocale} />
        <AgentThemeToggle value={theme} onChange={setTheme} />
      </section>
    </AgentProvider>
  );
}`,
    description:
      "Cover first-run, workspace start, working-directory, locale, and theme controls used around the core surfaces.",
    href: "/showcase/empty-authenticated-workspace",
    layer: "default",
    ownership:
      "Agent UI owns first-run controls and theme/locale primitives. The host owns workspace admission, folder policy, and persistence.",
    patternSection: "advanced",
    routeIds: [
      "empty-authenticated-workspace",
      "unauthenticated-first-run",
      "default-conversation",
    ],
    start: false,
    title: "First-run and settings controls",
    whenToUse:
      "Use these around the default preset when the host wants explicit setup controls.",
  },
];

export const publicComponentCoverage: readonly PublicComponentCoverageEntry[] =
  publicComponentCatalog.flatMap((entry) =>
    entry.coveredComponents.map((component) => ({
      component,
      layer: entry.layer,
      routeIds: entry.routeIds,
    })),
  );

export const publicStartCatalog: readonly PublicComponentCatalogEntry[] =
  publicComponentCatalog.filter((entry) => entry.start);

export const publicPatternCatalog: readonly PublicComponentCatalogEntry[] =
  publicComponentCatalog;

export const publicApiCatalog: readonly PublicApiCatalogEntry[] = buildPublicApiCatalog();

function buildPublicApiCatalog(): readonly PublicApiCatalogEntry[] {
  const entriesByName = new Map<
    string,
    {
      group: PublicApiCatalogGroup;
      isVisual: boolean;
      layers: Set<PublicComponentCatalogLayer>;
      name: string;
      packageName: PublicApiCatalogEntry["packageName"];
      previewHref: string;
      sampleCode: string;
      usedBy: { href: string; start: boolean; title: string }[];
    }
  >();
  for (const entry of publicComponentCatalog) {
    for (const apiName of entry.codeApi) {
      const current =
        entriesByName.get(apiName) ??
        {
          layers: new Set<PublicComponentCatalogLayer>(),
          group: publicApiGroup(apiName),
          isVisual: apiName !== "AgentProvider" && !apiName.startsWith("use"),
          name: apiName,
          packageName:
            apiName === "useAgentChatController"
              ? "@nyosegawa/agent-ui-react/headless"
              : apiName === "AgentChat" || apiName === "AgentProvider"
              ? "@nyosegawa/agent-ui-react"
              : "@nyosegawa/agent-ui-react/primitives",
          previewHref: `/showcase/component-preview?api=${encodeURIComponent(apiName)}`,
          sampleCode: entry.copyCode,
          usedBy: [],
        };
      current.layers.add(entry.layer);
      if (!current.usedBy.some((usedBy) => usedBy.title === entry.title)) {
        current.usedBy.push({ href: entry.href, start: entry.start, title: entry.title });
      }
      entriesByName.set(apiName, current);
    }
  }
  return [...entriesByName.values()]
    .map((entry) => ({
      isVisual: entry.isVisual,
      group: entry.group,
      layers: [...entry.layers].sort(),
      name: entry.name,
      packageName: entry.packageName,
      previewHref: entry.previewHref,
      sampleCode: entry.sampleCode,
      usedBy: entry.usedBy,
    }))
    .sort((a, b) => publicApiSortRank(a.name) - publicApiSortRank(b.name) || a.name.localeCompare(b.name));
}

function publicApiGroup(name: string): PublicApiCatalogGroup {
  if (name === "AgentProvider") return "Setup";
  if (name === "AgentChat") return "Presets";
  if (
    name === "AgentShell" ||
    name === "AgentThreadSidebar" ||
    name === "AgentThreadView" ||
    name === "AgentStatusBar" ||
    name === "AgentComposer" ||
    name === "AgentMessageList" ||
    name === "ThreadList"
  ) {
    return "Layout primitives";
  }
  if (name === "useAgentChatController") return "Presets";
  if (
    name === "AgentApprovalQueue" ||
    name === "AgentStatusSummary" ||
    name === "AgentStatusDetails"
  ) {
    return "Status and review";
  }
  if (name === "AgentUsageSummary" || name === "AgentUsagePanel") return "Usage";
  if (name === "AgentFirstRun" || name === "AgentLocaleSelect" || name === "AgentThemeToggle") {
    return "Onboarding and controls";
  }
  return "Advanced capability metadata";
}

function publicApiSortRank(name: string): number {
  const order = [
    "AgentProvider",
    "AgentChat",
    "useAgentChatController",
    "AgentShell",
    "AgentThreadSidebar",
    "AgentThreadView",
    "AgentStatusBar",
    "AgentComposer",
    "AgentMessageList",
    "AgentApprovalQueue",
    "AgentStatusSummary",
    "AgentStatusDetails",
    "ThreadList",
    "AgentUsageSummary",
    "AgentUsagePanel",
    "AgentAppsPanel",
    "AgentSkillsPanel",
    "AgentFirstRun",
    "AgentLocaleSelect",
    "AgentThemeToggle",
  ];
  const index = order.indexOf(name);
  return index === -1 ? order.length : index;
}

export const deprecatedPublicShowcaseTerms = [
  "/fixture-gallery",
  "/showcase/scoped-thread-lists",
  "Fixture gallery",
  "Run settings panel",
  "app/plugin picker",
  "App/Plugin picker",
  "Plugin picker",
] as const;
