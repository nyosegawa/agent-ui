export type VisualQaRouteCategory =
  | "component-closeups"
  | "host-reference"
  | "primitive-composition"
  | "protocol-lifecycle";

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
  category: VisualQaRouteCategory;
  description: string;
  docsScreenshot?: VisualQaDocsScreenshot;
  id: string;
  meta: string;
  ownerSpec: string;
  path: string;
  preview: boolean;
  readySelector: string;
  title: string;
  viewports: readonly VisualQaViewport[];
}

export const visualQaRoutes: readonly VisualQaRoute[] = [
  {
    category: "protocol-lifecycle",
    description:
      "Fixture-backed streaming, approvals, diff, usage, and automatic stored thread resume through AgentChat.",
    docsScreenshot: {
      desktopName: "agent-ui-home-desktop.png",
      mobileName: "agent-ui-home-mobile.png",
    },
    id: "default-conversation",
    meta: "preset · default fixture",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Default conversation",
    viewports: ["desktop", "tablet", "compact", "mobile", "short"],
  },
  {
    category: "protocol-lifecycle",
    description:
      "Dense approvals, status banners, rich renderer blocks, plan, tool call, image, web search, and system events.",
    docsScreenshot: {
      desktopName: "agent-ui-rich-transcript-desktop.png",
      mobileName: "agent-ui-rich-transcript-mobile.png",
    },
    id: "rich-transcript",
    meta: "preset · rich transcript fixture",
    ownerSpec: "examples/local-react-vite/e2e/visual-approvals.e2e.ts",
    path: "/rich-transcript",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Rich transcript fixture",
    viewports: ["desktop", "wide", "tablet", "compact", "mobile", "short"],
  },
  {
    category: "host-reference",
    description:
      "Host workflow surface composed from independent thread, status, usage, approval, and composer primitives.",
    docsScreenshot: {
      desktopName: "agent-ui-host-workflow-desktop.png",
      fullPage: true,
      mobileName: "agent-ui-host-workflow-mobile.png",
    },
    id: "host-workflow-recipe",
    meta: "primitives · host slot",
    ownerSpec: "examples/local-react-vite/e2e/visual-layout.e2e.ts",
    path: "/host-workflow-recipe",
    preview: true,
    readySelector: ".aui-host-recipe",
    title: "Host workflow recipe",
    viewports: ["desktop", "tablet", "compact", "mobile", "short"],
  },
  {
    category: "primitive-composition",
    description:
      "Failed first-message retry through the public composer controller without host-owned rollback logic.",
    id: "composer-retry",
    meta: "primitive · composer retry",
    ownerSpec: "examples/local-react-vite/e2e/composer-retry.e2e.ts",
    path: "/composer-retry",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Composer retry",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description:
      "Transcript primitive with compact defaults, verbose command/file blocks, and critical-only chat text.",
    id: "transcript-density",
    meta: "primitive · transcript density",
    ownerSpec: "examples/local-react-vite/e2e/transcript-density.e2e.ts",
    path: "/transcript-density",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Transcript density",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description:
      "Transcript local media rendered from structured browser-safe resource metadata rather than raw paths.",
    id: "resource-resolution",
    meta: "primitive · resource resolution",
    ownerSpec: "examples/local-react-vite/e2e/resource-resolution.e2e.ts",
    path: "/resource-resolution",
    preview: true,
    readySelector: ".aui-example-frame",
    title: "Resource resolution",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description:
      "Independent scoped history collections for host-owned navigation surfaces.",
    id: "scoped-thread-lists",
    meta: "primitive · scoped history",
    ownerSpec: "examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts",
    path: "/scoped-thread-lists",
    preview: false,
    readySelector: '[data-testid="scoped-thread-lists"]',
    title: "Scoped thread lists",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description: "AgentUsagePanel rendered with no chat, composer, sidebar, or status chrome.",
    docsScreenshot: {
      desktopName: "agent-ui-usage-only-desktop.png",
      mobileName: "agent-ui-usage-only-mobile.png",
    },
    id: "usage-only",
    meta: "primitive · usage only",
    ownerSpec: "examples/local-react-vite/e2e/visual-layout.e2e.ts",
    path: "/usage-only",
    preview: true,
    readySelector: ".aui-usage-only",
    title: "Usage-only panel",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description: "AgentThreadView locked to a specific threadId, ignoring active sidebar selection.",
    docsScreenshot: {
      desktopName: "agent-ui-scoped-thread-desktop.png",
      mobileName: "agent-ui-scoped-thread-mobile.png",
    },
    id: "scoped-thread-pane",
    meta: "primitive · fixed thread",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/scoped-thread-pane",
    preview: true,
    readySelector: ".aui-example-frame .aui-thread-surface",
    title: "Scoped thread pane",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "primitive-composition",
    description:
      "Codex Apps/connectors metadata from app/list, paginated, with enabled and accessibility state.",
    docsScreenshot: {
      desktopName: "agent-ui-app-connectors-desktop.png",
      mobileName: "agent-ui-app-connectors-mobile.png",
      prepare: "refresh-app-connectors",
    },
    id: "app-connectors",
    meta: "primitive · app metadata",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/app-connectors",
    preview: true,
    readySelector: ".aui-example-frame .aui-apps-panel",
    title: "App connectors",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "protocol-lifecycle",
    description: "Authenticated Codex account with no stored threads — first-run after login.",
    id: "empty-authenticated-workspace",
    meta: "preset · empty",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/?state=empty",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Empty authenticated workspace",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "protocol-lifecycle",
    description: "First-run device-code login flow without stale account or usage state.",
    id: "unauthenticated-first-run",
    meta: "preset · unauthenticated",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/?state=unauth",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Unauthenticated first run",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "protocol-lifecycle",
    description:
      "Failed local Codex bridge — diagnostics surface the cause and no misleading start action.",
    id: "bridge-error",
    meta: "preset · bridge error",
    ownerSpec: "examples/local-react-vite/e2e/smoke.e2e.ts",
    path: "/?state=bridge-error",
    preview: true,
    readySelector: '[data-testid="agent-chat"]',
    title: "Bridge error",
    viewports: ["desktop", "tablet", "compact", "mobile"],
  },
  {
    category: "component-closeups",
    description:
      "Component close-ups and full-page previews for the current visual QA route set.",
    docsScreenshot: {
      desktopName: "agent-ui-fixture-gallery-desktop.png",
      fullPage: true,
      mobileName: "agent-ui-fixture-gallery-mobile.png",
    },
    id: "fixture-gallery",
    meta: "gallery · visual QA",
    ownerSpec: "examples/local-react-vite/e2e/visual-closeups.e2e.ts",
    path: "/fixture-gallery",
    preview: false,
    readySelector: ".aui-fixture-gallery",
    title: "Fixture gallery",
    viewports: ["desktop", "wide", "tablet", "compact", "mobile", "short"],
  },
];

export const docsScreenshotRoutes = visualQaRoutes.filter(
  (route): route is VisualQaRoute & { docsScreenshot: VisualQaDocsScreenshot } =>
    Boolean(route.docsScreenshot),
);

export const previewRoutes = visualQaRoutes.filter((route) => route.preview);
