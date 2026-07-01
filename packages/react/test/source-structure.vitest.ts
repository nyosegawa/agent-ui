import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  docsScreenshotRoutes,
  visualQaRoutes,
} from "../../../examples/local-react-vite/src/fixtures/visual-qa-manifest";

const reactSrc = join(__dirname, "..", "src");
const componentDir = join(reactSrc, "components");
const hookDir = join(reactSrc, "hooks");
const timelineDir = join(reactSrc, "timeline");
const repoRoot = join(__dirname, "..", "..", "..");
const coreSrc = join(repoRoot, "packages", "core", "src");
const examplesDir = join(repoRoot, "examples");
const codexLocalWebSrc = join(examplesDir, "codex-local-web", "src");
const docsSiteSrc = join(examplesDir, "docs-site", "src");
const localReactViteDir = join(examplesDir, "local-react-vite");
const localReactViteE2e = join(localReactViteDir, "e2e");
const localReactViteSrc = join(localReactViteDir, "src");
const docsScreenshotsDir = join(repoRoot, "docs", "screenshots");
const nextRpcRouteApp = join(examplesDir, "next-rpc-route", "app");
const nextWithBridgeSidecarApp = join(examplesDir, "next-with-bridge-sidecar", "app");
const recipesSrc = join(examplesDir, "recipes", "src");
const reactApiSnapshot = join(
  __dirname,
  "..",
  "..",
  "..",
  "test",
  "api-snapshots",
  "react__index.d.ts",
);
const reactHeadlessApiSnapshot = join(
  __dirname,
  "..",
  "..",
  "..",
  "test",
  "api-snapshots",
  "react__headless.d.ts",
);
const styleDir = join(reactSrc, "styles");
const maxResponsibilitySizedLines = 560;

function sourceTextUnder(...dirs: string[]): string {
  const files: string[] = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir, { recursive: true })) {
      if (typeof name !== "string") continue;
      if (!/\.(ts|tsx|css|md)$/.test(name)) continue;
      files.push(join(dir, name));
    }
  }
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

describe("React package source structure", () => {
  it("keeps React component surfaces on explicit public entrypoints", () => {
    const primitives = readFileSync(join(reactSrc, "primitives.ts"), "utf8");
    expect(existsSync(join(reactSrc, "components-main.tsx"))).toBe(false);
    expect(existsSync(join(reactSrc, "components.ts"))).toBe(false);
    expect(existsSync(join(reactSrc, "components.tsx"))).toBe(false);
    expect(primitives).not.toContain("components-main");
    expect(primitives).toContain('from "./components/shell";');
    expect(primitives).toContain('from "./components/composer";');
    expect(primitives).toContain('from "./components/run-settings";');
  });

  it("keeps hooks.ts as a public barrel over domain hook modules", () => {
    const barrel = readFileSync(join(reactSrc, "hooks.ts"), "utf8");
    expect(barrel).toContain('from "./hooks/thread";');
    expect(barrel).toContain('from "./hooks/composer";');
    expect(barrel).toContain('from "./hooks/approvals";');
    expect(barrel).toContain('from "./hooks/connectors";');
    expect(barrel).not.toContain("export function useAgent");
    expect(barrel).not.toContain("useCallback");
  });

  it("keeps component modules responsibility-sized", () => {
    for (const name of readdirSync(componentDir)) {
      if (!name.endsWith(".tsx")) continue;
      const lineCount = readFileSync(join(componentDir, name), "utf8").split("\n").length;
      expect(
        lineCount,
        responsibilitySizeFailure(name, lineCount, "component"),
      ).toBeLessThanOrEqual(maxResponsibilitySizedLines);
    }
  });

  it("keeps AgentChat replacement points at documented surface boundaries", () => {
    const chat = readFileSync(join(componentDir, "chat.tsx"), "utf8");
    const componentsBody =
      chat.match(/export interface AgentComponents \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const propertyNames = Array.from(componentsBody.matchAll(/^\s+(\w+)\??:/gm))
      .map((match) => match[1])
      .sort();
    expect(propertyNames).toEqual([
      "Approval",
      "ComposerPanel",
      "EmptyState",
      "Shell",
      "Sidebar",
      "StatusBar",
      "ThreadHeader",
      "blocks",
    ]);
  });

  it("keeps hook modules responsibility-sized", () => {
    for (const name of readdirSync(hookDir)) {
      if (!name.endsWith(".ts")) continue;
      const lineCount = readFileSync(join(hookDir, name), "utf8").split("\n").length;
      expect(lineCount, responsibilitySizeFailure(name, lineCount, "hook")).toBeLessThanOrEqual(
        maxResponsibilitySizedLines,
      );
    }
  });

  it("keeps AgentProvider focused on state and transport wiring", () => {
    const provider = readFileSync(join(reactSrc, "provider.tsx"), "utf8");
    expect(provider).toContain("useAgentTransportEvents(transport, dispatch)");
    expect(provider).not.toContain("JSON.parse");
    expect(provider).not.toContain("warning/added");
    expect(provider).not.toContain("for await");
  });

  it("keeps transcript renderers in focused timeline modules", () => {
    const timeline = readFileSync(join(reactSrc, "timeline.tsx"), "utf8");
    const renderers = readFileSync(join(timelineDir, "item-renderers.tsx"), "utf8");
    expect(timeline).toContain('from "./timeline/item-renderers";');
    expect(timeline).not.toContain("function AgentCommandItem");
    expect(timeline).not.toContain("function AgentToolCallItem");
    expect(renderers).toContain("function AgentCommandItem");
    expect(renderers).toContain("function AgentToolCallItem");
  });

  it("keeps transcript scroll-follow behavior in a focused timeline module", () => {
    const timeline = readFileSync(join(reactSrc, "timeline.tsx"), "utf8");
    const scrollFollow = readFileSync(join(timelineDir, "scroll-follow.ts"), "utf8");
    expect(timeline).toContain('from "./timeline/scroll-follow";');
    expect(timeline).not.toContain("new MutationObserver");
    expect(timeline).not.toContain("requestAnimationFrame");
    expect(scrollFollow).toContain("function useTranscriptFollowScroll");
    expect(scrollFollow).toContain("new MutationObserver");
  });

  it("keeps transcript windowing behavior in a focused timeline module", () => {
    const timeline = readFileSync(join(reactSrc, "timeline.tsx"), "utf8");
    const transcript = readFileSync(join(reactSrc, "hooks", "transcript.ts"), "utf8");
    const windowing = readFileSync(join(timelineDir, "windowing.ts"), "utf8");
    expect(transcript).toContain('from "../timeline/windowing";');
    expect(timeline).not.toContain("DEFAULT_TRANSCRIPT_ITEM_LIMIT");
    expect(timeline).not.toContain("setVisibleItemState");
    expect(transcript).not.toContain("DEFAULT_TRANSCRIPT_ITEM_LIMIT");
    expect(transcript).not.toContain("setVisibleItemState");
    expect(windowing).toContain("function useTranscriptWindowing");
    expect(windowing).toContain("visibleTranscriptWindow");
  });

  it("exports the transcript display category and policy contract", () => {
    const transcript = readFileSync(join(reactSrc, "hooks", "transcript.ts"), "utf8");
    const headless = readFileSync(join(reactSrc, "hooks.ts"), "utf8");
    expect(transcript).toContain("export type AgentTranscriptCategory =");
    for (const category of [
      "message",
      "reasoning",
      "plan",
      "command",
      "fileChange",
      "toolActivity",
      "web",
      "media",
      "system",
      "unknown",
    ]) {
      expect(transcript).toContain(`| "${category}"`);
    }
    expect(transcript).toContain('export type AgentTranscriptDisplayDensity = "comfortable"');
    expect(transcript).toContain('export type AgentTranscriptDisplayVisibility = "visible"');
    expect(transcript).toContain("Resolution order is default -> byCategory -> byRole");
    expect(transcript).toContain("entries cannot be made unreachable by a hidden rule");
    expect(headless).toContain("AgentTranscriptCategory");
    expect(headless).toContain("AgentTranscriptDisplayPolicy");
  });

  it("keeps Codex generated request params out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toContain("@nyosegawa/agent-ui-codex/stable-types");
    expect(snapshot).not.toContain("CodexStableMethodParams");
    expect(snapshot).not.toContain("ThreadStartParams");
    expect(snapshot).not.toContain("TurnStartParams");
    expect(snapshot).not.toContain("AppsListParams");
    expect(snapshot).not.toContain("SkillsListParams");
  });

  it("keeps Codex generated thread responses out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toContain("ThreadStartResponse");
    expect(snapshot).not.toContain("ThreadResumeResponse");
    expect(snapshot).not.toContain("ThreadForkResponse");
    expect(snapshot).not.toContain("ThreadReadResponse");
    expect(snapshot).not.toContain("ThreadArchiveResponse");
    expect(snapshot).not.toContain("ThreadUnarchiveResponse");
    expect(snapshot).not.toContain("ThreadSetNameResponse");
    expect(snapshot).not.toContain("ThreadCompactStartResponse");
    expect(snapshot).not.toContain("ThreadRollbackResponse");
    expect(snapshot).not.toMatch(/type ThreadStatus = \{[\s\S]*?type:/);
    expect(snapshot).not.toMatch(/type Thread = \{[\s\S]*?status\?: ThreadStatus/);
  });

  it("keeps Codex generated turn responses out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toContain("TurnStartResponse");
    expect(snapshot).not.toContain("TurnSteerResponse");
    expect(snapshot).not.toContain("TurnInterruptResponse");
  });

  it("keeps Codex generated response promises out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toMatch(/Promise<[^>]*Response>/);
  });

  it("keeps raw thread compatibility helpers out of the React root API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toContain("threadUpsertEvent");
    expect(snapshot).not.toContain("threadSnapshotEvents");
    expect(snapshot).not.toContain("rawThreadId");
    expect(snapshot).not.toContain("threadProjectPath");
  });

  it("keeps first-message operation internals out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    const headlessSnapshot = readFileSync(reactHeadlessApiSnapshot, "utf8");
    expect(snapshot).not.toContain("useInternalAgentComposerController");
    expect(snapshot).not.toContain("InternalAgentComposerController");
    expect(snapshot).not.toContain("startWithMessage");
    expect(snapshot).not.toContain("operationsById");
    expect(snapshot).not.toContain("retryOperation");
    expect(snapshot).not.toContain("cancelOperation");
    expect(headlessSnapshot).toContain("useAgentChatController");
    expect(headlessSnapshot).toContain("AgentChatController");
    expect(headlessSnapshot).toContain("AgentComposerSendMessageResult");
    expect(headlessSnapshot).toContain('type: "started"');
    expect(headlessSnapshot).toContain('type: "sent"');
    expect(headlessSnapshot).toContain('type: "queued"');
    expect(headlessSnapshot).toContain('type: "blocked"');
  });

  it("keeps raw protocol payload fields out of public declaration snapshots", () => {
    const coreSnapshot = readFileSync(
      join(repoRoot, "test", "api-snapshots", "core__index.d.ts"),
      "utf8",
    );
    for (const interfaceName of [
      "AgentThread",
      "ThreadTokenUsage",
      "AgentItemState",
      "AgentItemBlock",
      "AgentTurn",
      "TurnPlanState",
      "TurnDiffState",
    ]) {
      expect(interfaceBody(coreSnapshot, interfaceName), interfaceName).not.toContain("raw");
    }

    const reactSnapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(reactSnapshot).not.toContain("AgentResourceResolution = AgentResolvedResource | string");
    expect(reactSnapshot).not.toContain("AgentTranscriptBlock = Omit<");
    expect(reactSnapshot).not.toContain("AgentTranscriptItem = Omit<");
    expect(reactSnapshot).not.toContain("raw: any");
  });

  it("keeps known public raw debt fixed while the redesign removes it", () => {
    const coreSnapshot = readFileSync(
      join(repoRoot, "test", "api-snapshots", "core__index.d.ts"),
      "utf8",
    );
    const headlessSnapshot = readFileSync(reactHeadlessApiSnapshot, "utf8");
    const rootSnapshot = readFileSync(reactApiSnapshot, "utf8");
    const primitivesSnapshot = readFileSync(
      join(repoRoot, "test", "api-snapshots", "react__primitives.d.ts"),
      "utf8",
    );

    expect(rawDebtFindings("core", coreSnapshot)).toEqual([]);
    expect(coreRootResidualRawDebt()).toEqual([]);
    expect(rawDebtFindings("headless", headlessSnapshot)).toEqual([
      "headless:member:respond: (requestId: RequestId, result: unknown) => Promise<void>;",
      "headless:member:rateLimits: unknown;",
    ]);
    expect(rawDebtFindings("root", rootSnapshot)).toEqual([]);
    expect(rawDebtFindings("primitives", primitivesSnapshot)).toEqual([
      "primitives:member:patch: unknown;",
    ]);
  });

  it("keeps deprecated protocol fallback names out of public declaration snapshots", () => {
    const snapshots = [
      readFileSync(join(repoRoot, "test", "api-snapshots", "core__index.d.ts"), "utf8"),
      readFileSync(reactApiSnapshot, "utf8"),
    ].join("\n");
    for (const deprecatedName of [
      "item/fileChange/outputDelta",
      "thread/compacted",
      "mcpAppResourceUri",
      "rate_limits",
      "rate_limits_by_limit_id",
      "used_percent",
      "window_duration_mins",
      "reset_at",
      "model_provider",
      "sourceName",
    ]) {
      expect(snapshots).not.toContain(deprecatedName);
    }
  });

  it("keeps style chunks responsibility-sized", () => {
    for (const name of readdirSync(styleDir)) {
      if (!name.endsWith(".css")) continue;
      const lineCount = readFileSync(join(styleDir, name), "utf8").split("\n").length;
      expect(lineCount, responsibilitySizeFailure(name, lineCount, "style")).toBeLessThanOrEqual(
        maxResponsibilitySizedLines,
      );
    }
  });

  it("does not refer to removed compatibility entrypoints", () => {
    const text = sourceTextUnder(reactSrc);
    expect(text).not.toContain("components-main");
    expect(text).not.toContain("components.tsx");
    expect(text).not.toContain("@nyosegawa/agent-ui-react/style.css");
  });

  it("does not export removed component aliases", () => {
    const text = sourceTextUnder(componentDir);
    expect(text).not.toContain("AgentApprovalPrompt");
    expect(text).not.toContain("AgentDiagnostics =");
    expect(text).not.toContain("AgentStatusDrawer");
    expect(text).not.toContain("AgentStatusBanners");
    expect(text).not.toContain("AgentUsage =");
    expect(text).not.toContain("AgentStatusCard");
  });

  it("keeps route fixtures inside the local React Vite example", () => {
    for (const name of [
      "app-connectors",
      "host-workflow-recipe",
      "maintainer-gallery",
      "scoped-thread-pane",
      "usage-only",
    ]) {
      expect(existsSync(join(examplesDir, name, "README.md")), name).toBe(false);
    }
    const main = readFileSync(join(localReactViteSrc, "main.tsx"), "utf8");
    expect(main).not.toContain('pathname === "/qa"');
    const localReactViteSource = sourceTextUnder(localReactViteSrc);
    expect(localReactViteSource).not.toContain("thread-history-demo");
    expect(localReactViteSource).not.toContain("turn-history-demo");
    expect(localReactViteSource).not.toContain("docs/testing.md");
    expect(localReactViteSource).not.toContain("agent-ui-rich-transcript-check");
    for (const route of [
      "/maintainer-gallery",
      "/showcase/app-connectors",
      "/showcase/default-conversation",
      "/showcase/host-workflow-recipe",
      "/showcase/scoped-thread-pane",
      "/showcase/usage-only",
    ]) {
      expect(localReactViteSource).toContain(route);
    }
  });

  it("keeps retained examples on public package imports", () => {
    const exampleSource = sourceTextUnder(
      codexLocalWebSrc,
      docsSiteSrc,
      localReactViteSrc,
      nextRpcRouteApp,
      nextWithBridgeSidecarApp,
      recipesSrc,
    );
    expect(exampleSource).not.toContain("/packages/react/src/");
    expect(exampleSource).not.toContain("/packages/core/src/");
    expect(exampleSource).not.toContain("/packages/codex/src/");
    expect(exampleSource).not.toContain("/packages/server/src/");
    expect(exampleSource).not.toContain("@nyosegawa/agent-ui-react/src");
    expect(exampleSource).toContain("@nyosegawa/agent-ui-react");
  });

  it("keeps local React Vite visual QA inventory manifest-driven", () => {
    const capture = readFileSync(
      join(localReactViteE2e, "capture-docs-screenshots.e2e.ts"),
      "utf8",
    );
    const main = readFileSync(join(localReactViteSrc, "main.tsx"), "utf8");
    const routePathnames = new Set(
      visualQaRoutes
        .map((route) => route.path)
        .filter((path) => path !== "/" && !path.includes("?")),
    );
    const mainPathnames = new Set(
      Array.from(main.matchAll(/pathname === "([^"]+)"/g))
        .map((match) => match[1] ?? "")
        .filter((path) => path !== "/"),
    );

    expect(mainPathnames).toEqual(routePathnames);
    expect(capture).toContain(
      'import { docsScreenshotRoutes } from "../src/fixtures/visual-qa-manifest";',
    );
    for (const route of docsScreenshotRoutes) {
      expect(routePathnames.has(route.path) || route.path === "/").toBe(true);
      expect(route.docsScreenshot.desktopName).toMatch(/^agent-ui-.+-desktop\.png$/);
      expect(route.docsScreenshot.mobileName).toMatch(/^agent-ui-.+-mobile\.png$/);
    }
    expect(capture).not.toContain("/qa");
    expect(capture).not.toMatch(/path: "\//);
    expect(capture).toContain("mkdirSync(outputDir, { recursive: true })");

    const expectedScreenshotFiles = [
      "README.md",
      ...docsScreenshotRoutes.flatMap((route) => [
        route.docsScreenshot.desktopName,
        route.docsScreenshot.mobileName,
      ]),
    ].sort();
    const actualScreenshotFiles = readdirSync(docsScreenshotsDir)
      .filter((name) => typeof name === "string")
      .sort();
    expect(actualScreenshotFiles).toEqual(expectedScreenshotFiles);
  });

  it("keeps usage reset fixtures relative instead of stale absolute dates", () => {
    const demoState = readFileSync(
      join(localReactViteSrc, "fixtures", "demo-state.ts"),
      "utf8",
    );
    const fixtureRateLimitsBody =
      demoState.match(/export function fixtureRateLimits\(\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(fixtureRateLimitsBody).toContain("new Date()");
    expect(fixtureRateLimitsBody).not.toMatch(/20\d\d-\d\d-\d\dT/);
  });
});

function responsibilitySizeFailure(
  name: string,
  lineCount: number,
  kind: "component" | "hook" | "style",
): string {
  return [
    `${name} has ${lineCount} lines; source modules must stay at or below ${maxResponsibilitySizedLines} lines.`,
    "Do not satisfy this gate by minifying, one-line CSS rules, inlining unrelated logic, or doing a mechanical split.",
    kind === "style"
      ? "Read the CSS chunk, identify the visual ownership boundaries, delete stale selectors, and move coherent surfaces into purpose-named style chunks."
      : kind === "hook"
        ? "Read the hook module, identify the state/controller boundary, delete stale paths, and move coherent behavior into purpose-named hook modules."
        : "Read the component, identify the UI/state ownership boundaries, delete stale paths, and move coherent behavior into purpose-named component modules.",
    "If the file is still large after real cleanup, add a focused module with tests/docs that explain the new responsibility boundary.",
  ].join("\n");
}

function coreRootResidualRawDebt(): string[] {
  const index = readFileSync(join(coreSrc, "index.ts"), "utf8");
  const rawSymbols = new Set([
    "AgentItemBlock",
    "AgentItemMetadata",
    "AgentItemState",
    "PendingServerRequest",
    "ServerRequestQueueState",
    "ThreadLifecycleState",
    "ThreadState",
  ]);
  return Array.from(index.matchAll(/\b([A-Z]\w+)\b/g))
    .map((match) => match[1] ?? "")
    .filter((symbol, index, all) => rawSymbols.has(symbol) && all.indexOf(symbol) === index)
    .map((symbol) => `core-source:export:${symbol}`);
}

function interfaceBody(snapshot: string, interfaceName: string): string {
  const match = new RegExp(`interface ${interfaceName} \\{([\\s\\S]*?)\\n\\}`).exec(snapshot);
  return match?.[1] ?? "";
}

function rawDebtFindings(scope: string, snapshot: string): string[] {
  const rawDebtLine =
    /(\b(raw|payload|arguments|changes|result|error|metadata|details|patch|rateLimits)\??: unknown\b|Record<string, unknown>|unknown\[\]|PendingServerRequest|ThreadState|AgentItemBlock|@nyosegawa\/agent-ui-core\/internal|@nyosegawa\/agent-ui-codex\/stable-types|CodexStable|ThreadStartParams|TurnStartParams)/;
  const trackedSymbols = new Set([
    "AgentItemBlock",
    "AgentTranscriptBlockView",
    "CodexStable",
    "PendingServerRequest",
    "ThreadStartParams",
    "ThreadState",
    "TurnStartParams",
  ]);
  const findings: string[] = [];

  for (const rawLine of snapshot.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!rawDebtLine.test(line)) continue;

    if (/^import ['"]/.test(line)) {
      const moduleName = /import ['"]([^'"]+)['"]/.exec(line)?.[1] ?? "";
      findings.push(`${scope}:import-module:${moduleName}`);
      continue;
    }

    if (line.startsWith("import ")) {
      const moduleName = /from '([^']+)'/.exec(line)?.[1] ?? "";
      if (moduleName.includes("/internal")) {
        findings.push(`${scope}:import-module:${moduleName}`);
      }
      const importedNames = /\{([^}]+)\}/.exec(line)?.[1] ?? "";
      for (const importedName of importedNames
        .split(",")
        .map((name) => name.trim().replace(/ as .*/, ""))) {
        if (trackedSymbols.has(importedName)) {
          findings.push(`${scope}:import:${importedName} from ${moduleName}`);
        }
      }
      continue;
    }

    if (line.startsWith("export ")) {
      const exportBody = line.replace(/^export \{ /, "").replace(/ \};$/, "");
      for (const exportedName of exportBody.split(", ")) {
        const symbolName = exportedName.replace(/^type /, "");
        if (trackedSymbols.has(symbolName)) {
          findings.push(`${scope}:export:${exportedName}`);
        }
      }
      continue;
    }

    if (line.startsWith("declare function ")) {
      const functionName = /^declare function ([^(]+)/.exec(line)?.[1] ?? "unknown";
      const rawTypes = Array.from(trackedSymbols).filter((symbol) => line.includes(symbol));
      if (line.includes(": unknown")) rawTypes.push("unknown");
      if (rawTypes.length > 0) {
        findings.push(`${scope}:function:${functionName}:${rawTypes.join(",")}`);
      }
      continue;
    }

    if (/^(interface|type) /.test(line)) {
      findings.push(`${scope}:${line}`);
      continue;
    }

    findings.push(`${scope}:member:${line}`);
  }

  return findings;
}
