export type VisualQaRouteAudience = "public" | "maintainer";

export type VisualQaRouteCategory =
  | "host-reference"
  | "primitive-composition"
  | "protocol-lifecycle"
  | "visual-maintenance";

export type VisualQaRouteKind =
  | "closeup-gallery"
  | "probe"
  | "showcase"
  | "specimen"
  | "state";

export type VisualQaViewport =
  | "desktop"
  | "wide"
  | "tablet"
  | "compact"
  | "mobile"
  | "short";

export interface VisualQaDocsScreenshot {
  desktopName: string;
  fullPage?: boolean;
  mobileName: string;
  prepare?: "refresh-app-connectors";
}

export interface VisualQaRoute {
  audience: VisualQaRouteAudience;
  category: VisualQaRouteCategory;
  description: string;
  docsScreenshot: VisualQaDocsScreenshot | false;
  id: string;
  kind: VisualQaRouteKind;
  meta: string;
  ownerSpecs: readonly string[];
  path: string;
  preview: boolean;
  readySelector: string;
  title: string;
  viewports: readonly VisualQaViewport[];
}

export const visualQaRoutes: readonly VisualQaRoute[] = [
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "User-facing entry catalog for default, composed, primitive, and host-integration Agent UI surfaces.",
    docsScreenshot: false,
    id: "showcase",
    kind: "showcase",
    meta: "catalog · public entry",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase",
    preview: false,
    readySelector: '[data-testid="public-component-catalog"]',
    title: "Agent UI showcase",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Direct public API catalog for Agent UI snippets, grouped away from maintainer-only primitive coverage.",
    docsScreenshot: false,
    id: "showcase-components",
    kind: "showcase",
    meta: "catalog · public API",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/components",
    preview: false,
    readySelector: '[data-testid="public-api-catalog"]',
    title: "Component API catalog",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "host-reference",
    description:
      "Workflow-oriented host pattern catalog linking each use case to its snippet and deterministic route.",
    docsScreenshot: false,
    id: "showcase-patterns",
    kind: "showcase",
    meta: "catalog · host patterns",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/patterns",
    preview: false,
    readySelector: '[data-testid="public-pattern-catalog"]',
    title: "Host patterns",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Generated single-component preview surface used by the public component API catalog.",
    docsScreenshot: false,
    id: "showcase-component-preview",
    kind: "specimen",
    meta: "catalog · component preview",
    ownerSpecs: [
      "examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts",
      "examples/local-react-vite/e2e/visual-route-matrix.e2e.ts",
    ],
    path: "/showcase/component-preview",
    preview: false,
    readySelector: ".aui-component-preview-frame",
    title: "Component preview",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "protocol-lifecycle",
    description:
      "Fixture-backed streaming, approvals, diff, usage, and automatic stored thread resume through AgentChat.",
    docsScreenshot: {
      desktopName: "agent-ui-home-desktop.png",
      mobileName: "agent-ui-home-mobile.png",
    },
    id: "default-conversation",
    kind: "showcase",
    meta: "preset · default fixture",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/default-conversation",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Default conversation",
    viewports: ["desktop", "tablet", "compact", "mobile", "short"],
  },
  {
    audience: "public",
    category: "protocol-lifecycle",
    description:
      "Dense approvals, status banners, rich renderer blocks, plan, tool call, image, web search, and system events.",
    docsScreenshot: {
      desktopName: "agent-ui-rich-transcript-desktop.png",
      mobileName: "agent-ui-rich-transcript-mobile.png",
    },
    id: "rich-transcript",
    kind: "showcase",
    meta: "preset · rich transcript fixture",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-approvals.e2e.ts"],
    path: "/showcase/rich-transcript",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Rich transcript fixture",
    viewports: ["desktop", "wide", "tablet", "compact", "mobile", "short"],
  },
  {
    audience: "public",
    category: "host-reference",
    description:
      "AgentChat preset composed with host status/header additions, external send controls, fixed start options, overlay coordination, and local media resolution.",
    docsScreenshot: false,
    id: "agent-chat-composition",
    kind: "showcase",
    meta: "preset · composition",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/agent-chat-composition",
    preview: true,
    readySelector: ".aui-host-recipe .aui-host-composition",
    title: "Composable chat preset",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "host-reference",
    description:
      "Neutral composed Agent UI shell showing sidebar history, status, and thread view inside host-owned layout.",
    docsScreenshot: false,
    id: "composed-shell",
    kind: "showcase",
    meta: "composition · shell",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/composed-shell",
    preview: true,
    readySelector: ".aui-composed-shell-example .aui-shell",
    title: "Composed shell",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "host-reference",
    description:
      "Host workflow surface composed from independent thread, status, usage, approval, and composer primitives.",
    docsScreenshot: {
      desktopName: "agent-ui-host-workflow-desktop.png",
      fullPage: true,
      mobileName: "agent-ui-host-workflow-mobile.png",
    },
    id: "host-workflow-recipe",
    kind: "showcase",
    meta: "primitives · host slot",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-layout.e2e.ts"],
    path: "/showcase/host-workflow-recipe",
    preview: true,
    readySelector: ".aui-host-recipe",
    title: "Host workflow recipe",
    viewports: ["desktop", "tablet", "compact", "mobile", "short"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Normal composer primitive placement with Agent UI-owned submit, follow-up, interrupt, and attachment state.",
    docsScreenshot: false,
    id: "composer-primitives",
    kind: "showcase",
    meta: "primitive · composer",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/composer-primitives",
    preview: true,
    readySelector: ".aui-primitive-example-card .aui-composer",
    title: "Composer slot",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Failed first-message retry through the public composer controller without host-owned rollback logic.",
    docsScreenshot: false,
    id: "composer-retry",
    kind: "showcase",
    meta: "primitive · composer retry",
    ownerSpecs: ["examples/local-react-vite/e2e/composer-retry.e2e.ts"],
    path: "/showcase/composer-retry",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Composer retry",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Default transcript primitive rendering for messages, commands, file changes, tools, media, and status content.",
    docsScreenshot: false,
    id: "transcript-content",
    kind: "showcase",
    meta: "primitive · transcript content",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/transcript-content",
    preview: true,
    readySelector: ".aui-example-frame .aui-thread-surface",
    title: "Transcript pane",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Review rail composition for status summaries, detailed notices, and pending approval actions.",
    docsScreenshot: false,
    id: "approvals-status",
    kind: "showcase",
    meta: "primitive · review rail",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/approvals-status",
    preview: true,
    readySelector: ".aui-review-rail-example",
    title: "Review rail",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Transcript primitive with semantic display policy, collapsed command/file blocks, and hidden chat text.",
    docsScreenshot: false,
    id: "transcript-display",
    kind: "showcase",
    meta: "primitive · transcript display policy",
    ownerSpecs: ["examples/local-react-vite/e2e/transcript-display.e2e.ts"],
    path: "/showcase/transcript-display",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Transcript display policy",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Transcript local media rendered from structured browser-safe resource metadata rather than raw paths.",
    docsScreenshot: false,
    id: "resource-resolution",
    kind: "showcase",
    meta: "primitive · resource resolution",
    ownerSpecs: ["examples/local-react-vite/e2e/resource-resolution.e2e.ts"],
    path: "/showcase/resource-resolution",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Resource resolution",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "maintainer",
    category: "visual-maintenance",
    description:
      "Contract fixture proving independent scoped history collections do not share search terms, cursors, rows, or active selection.",
    docsScreenshot: false,
    id: "scoped-thread-lists",
    kind: "probe",
    meta: "maintainer · scoped history",
    ownerSpecs: ["examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts"],
    path: "/maintainer/scoped-thread-lists",
    preview: false,
    readySelector: '[data-testid="scoped-thread-lists"]',
    title: "Scoped thread list contract",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description: "AgentUsagePanel rendered with no chat, composer, sidebar, or status chrome.",
    docsScreenshot: {
      desktopName: "agent-ui-usage-only-desktop.png",
      mobileName: "agent-ui-usage-only-mobile.png",
    },
    id: "usage-only",
    kind: "showcase",
    meta: "primitive · usage only",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-layout.e2e.ts"],
    path: "/showcase/usage-only",
    preview: true,
    readySelector: ".aui-usage-only",
    title: "Usage-only panel",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Host-owned active thread selection composed from ThreadList and AgentThreadView primitives.",
    docsScreenshot: false,
    id: "thread-navigation",
    kind: "showcase",
    meta: "host · thread navigation",
    ownerSpecs: ["examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts"],
    path: "/showcase/thread-navigation",
    preview: true,
    readySelector: ".aui-thread-navigation-example",
    title: "Thread navigation",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description: "AgentThreadView locked to a specific threadId, ignoring active sidebar selection.",
    docsScreenshot: {
      desktopName: "agent-ui-scoped-thread-desktop.png",
      mobileName: "agent-ui-scoped-thread-mobile.png",
    },
    id: "scoped-thread-pane",
    kind: "showcase",
    meta: "primitive · fixed thread",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/scoped-thread-pane",
    preview: true,
    readySelector: ".aui-example-frame .aui-thread-surface",
    title: "Scoped thread pane",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "primitive-composition",
    description:
      "Codex Apps/connectors metadata from app/list, paginated, with enabled and accessibility state.",
    docsScreenshot: {
      desktopName: "agent-ui-app-connectors-desktop.png",
      mobileName: "agent-ui-app-connectors-mobile.png",
      prepare: "refresh-app-connectors",
    },
    id: "app-connectors",
    kind: "showcase",
    meta: "primitive · app metadata",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/app-connectors",
    preview: true,
    readySelector: ".aui-example-frame .aui-apps-panel",
    title: "App connectors",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "protocol-lifecycle",
    description: "Authenticated Codex account with no stored threads — first-run after login.",
    docsScreenshot: false,
    id: "empty-authenticated-workspace",
    kind: "state",
    meta: "preset · empty",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/empty-authenticated-workspace",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Empty authenticated workspace",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "protocol-lifecycle",
    description: "First-run device-code login flow without stale account or usage state.",
    docsScreenshot: false,
    id: "unauthenticated-first-run",
    kind: "state",
    meta: "preset · unauthenticated",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/unauthenticated-first-run",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Unauthenticated first run",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "public",
    category: "protocol-lifecycle",
    description:
      "Failed local Codex bridge — diagnostics surface the cause and no misleading start action.",
    docsScreenshot: false,
    id: "bridge-error",
    kind: "state",
    meta: "preset · bridge error",
    ownerSpecs: ["examples/local-react-vite/e2e/smoke.e2e.ts"],
    path: "/showcase/bridge-error",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Bridge error",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    audience: "maintainer",
    category: "visual-maintenance",
    description:
      "Maintainer-only component close-ups, probes, specimens, and full-page previews for visual QA.",
    docsScreenshot: false,
    id: "maintainer-gallery",
    kind: "closeup-gallery",
    meta: "maintainer · visual QA",
    ownerSpecs: [
      "examples/local-react-vite/e2e/visual-closeups.e2e.ts",
      "examples/local-react-vite/e2e/design-system-contract.e2e.ts",
    ],
    path: "/maintainer-gallery",
    preview: false,
    readySelector: ".aui-route-gallery",
    title: "Maintainer gallery",
    viewports: ["desktop", "wide", "tablet", "compact", "mobile", "short"],
  },
];

export const docsScreenshotRoutes = visualQaRoutes.filter(
  (route): route is VisualQaRoute & { docsScreenshot: VisualQaDocsScreenshot } =>
    route.docsScreenshot !== false,
);

export const previewRoutes = visualQaRoutes.filter((route) => route.preview);

export const publicShowcaseRoutes = visualQaRoutes.filter(
  (route) => route.audience === "public",
);

export const maintainerGalleryRoutes = visualQaRoutes.filter(
  (route) => route.audience === "maintainer",
);
