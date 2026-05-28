import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const reactSrc = join(__dirname, "..", "src");
const componentDir = join(reactSrc, "components");
const hookDir = join(reactSrc, "hooks");
const timelineDir = join(reactSrc, "timeline");
const reactApiSnapshot = join(
  __dirname,
  "..",
  "..",
  "..",
  "test",
  "api-snapshots",
  "react__index.d.ts",
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
  it("keeps components.ts as a public barrel without a catch-all implementation file", () => {
    const barrel = readFileSync(join(reactSrc, "components.ts"), "utf8");
    expect(existsSync(join(reactSrc, "components-main.tsx"))).toBe(false);
    expect(existsSync(join(reactSrc, "components.tsx"))).toBe(false);
    expect(barrel).not.toContain("components-main");
    expect(barrel).toContain('export * from "./components/chat";');
    expect(barrel).toContain('export * from "./components/composer";');
    expect(barrel).toContain('export * from "./components/run-settings";');
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

  it("keeps Codex generated request params out of the React public API", () => {
    const snapshot = readFileSync(reactApiSnapshot, "utf8");
    expect(snapshot).not.toContain("@nyosegawa/agent-ui-codex/stable-types");
    expect(snapshot).not.toContain("CodexStableMethodParams");
    expect(snapshot).not.toContain("ThreadStartParams");
    expect(snapshot).not.toContain("TurnStartParams");
    expect(snapshot).not.toContain("AppsListParams");
    expect(snapshot).not.toContain("SkillsListParams");
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
