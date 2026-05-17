import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REACT_SRC = join(__dirname, "..", "src");
const STYLE_PATH = join(__dirname, "..", "src", "styles.css");
const STYLE_DIR = join(__dirname, "..", "src", "styles");
const REPO_ROOT = join(__dirname, "..", "..", "..");

function importedStyleChunks(): string[] {
  const entry = readFileSync(STYLE_PATH, "utf8");
  return Array.from(entry.matchAll(/@import "\.\/styles\/([^"]+)";/g)).map(
    (match) => match[1]!,
  );
}

function readStyles(): string {
  const chunks = importedStyleChunks().map((name) =>
    readFileSync(join(STYLE_DIR, name), "utf8"),
  );
  return [readFileSync(STYLE_PATH, "utf8"), ...chunks].join("\n");
}

function readTextUnder(...dirs: string[]): string {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "dist" || entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (/\.(ts|tsx|js|jsx|md|html)$/.test(entry.name)) files.push(path);
    }
  };
  dirs.forEach(visit);
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

function cssClassNames(css: string): string[] {
  return Array.from(css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g))
    .map((match) => match[1]!)
    .filter((name) => name !== "org" && name !== "w3");
}

function topLevelSelectorOccurrences(css: string): Map<string, number[]> {
  const occurrences = new Map<string, number[]>();
  const lines = css.split("\n");
  let depth = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (depth === 0) {
      const match = /^(\.[a-zA-Z0-9_-]+(?:\[[^\]]*\])?)\s*\{/.exec(line);
      if (match) {
        const selector = match[1]!;
        const list = occurrences.get(selector) ?? [];
        list.push(index + 1);
        occurrences.set(selector, list);
      }
    }
    for (const char of line) {
      if (char === "{") depth += 1;
      else if (char === "}") depth = Math.max(0, depth - 1);
    }
  }
  return occurrences;
}

describe("packages/react styles.css", () => {
  const css = readStyles();
  const occurrences = topLevelSelectorOccurrences(css);

  it("imports every style chunk exactly once in manifest order", () => {
    const imported = importedStyleChunks();
    const files = readdirSync(STYLE_DIR)
      .filter((name) => name.endsWith(".css"))
      .sort();
    expect(imported).toHaveLength(new Set(imported).size);
    expect([...imported].sort()).toEqual(files);
    for (const name of imported) {
      expect(existsSync(join(STYLE_DIR, name)), name).toBe(true);
    }
  });

  it("does not keep removed aggregate css files", () => {
    expect(existsSync(join(STYLE_DIR, "controls.css"))).toBe(false);
    expect(existsSync(join(STYLE_DIR, "workspace-examples.css"))).toBe(false);
    expect(existsSync(join(__dirname, "..", "src", "style.css"))).toBe(false);
  });

  it("does not publish fixture or route-specific CSS through the React package entry", () => {
    const entry = readFileSync(STYLE_PATH, "utf8");
    expect(entry).not.toMatch(/host-recipe\.css/);
    expect(entry).not.toMatch(/fixture-gallery\.css/);
    expect(entry).not.toMatch(/closeups\.css/);
    expect(entry).not.toMatch(/usage-only\.css/);
    expect(css).not.toMatch(/\.aui-host-recipe\b/);
    expect(css).not.toMatch(/\.aui-fixture-gallery\b/);
    expect(css).not.toMatch(/\.aui-closeup\b/);
    expect(css).not.toMatch(/\.aui-usage-only\b/);
  });

  it.each([
    ".aui-run-controls-compact",
    ".aui-transcript-card",
    ".aui-message-list",
    ".aui-turn",
    ".aui-message",
    ".aui-message[data-kind=\"userMessage\"]",
    ".aui-message[data-kind=\"reasoning\"]",
    ".aui-plan-block",
    ".aui-thread-list-item",
    ".aui-chat-rail",
    ".aui-compose-panel",
    ".aui-composer",
    ".aui-composer-toolbar",
    ".aui-composer-chips",
    ".aui-composer-chip",
    ".aui-composer-hint",
    ".aui-composer-notice",
    ".aui-composer-tool",
    ".aui-composer-settings",
    ".aui-menu",
    ".aui-menu-panel",
    ".aui-menu-item",
    ".aui-approvals",
    ".aui-approval",
    ".aui-approval-compact",
  ])("declares %s exactly once at the document root", (selector) => {
    const lines = occurrences.get(selector) ?? [];
    expect(lines, `${selector} appears at lines: ${lines.join(", ")}`).toHaveLength(1);
  });

  it("declares the button system exactly once at the document root", () => {
    expect(occurrences.get(".aui-btn") ?? []).toHaveLength(1);
  });

  it("declares the status pill exactly once at the document root", () => {
    expect(occurrences.get(".aui-status-pill") ?? []).toHaveLength(1);
  });

  it("does not contain removed attachment toolbar or chip selectors", () => {
    expect(css).not.toMatch(/\.aui-attachment-toolbar\b/);
    expect(css).not.toMatch(/\.aui-attachment-button\b/);
    expect(css).not.toMatch(/\.aui-attachment-chips\b/);
  });

  it("does not declare the removed plain .aui-button shell", () => {
    expect(occurrences.get(".aui-button") ?? []).toHaveLength(0);
    expect(occurrences.get(".aui-button-secondary") ?? []).toHaveLength(0);
  });

  it("does not contain the removed composer run-settings popover", () => {
    expect(css).not.toMatch(/\.aui-run-settings-popover\b/);
    expect(css).not.toMatch(/\.aui-run-settings-sheet\b/);
    expect(occurrences.get(".aui-composer-shell") ?? []).toHaveLength(0);
  });

  it("does not keep unreferenced aui css classes", () => {
    const sourceText = readTextUnder(
      REACT_SRC,
      join(REPO_ROOT, "examples", "local-react-vite", "src"),
      join(REPO_ROOT, "examples", "local-react-vite", "e2e"),
      join(REPO_ROOT, "examples", "codex-local-web", "src"),
    );
    const unused = Array.from(new Set(cssClassNames(css)))
      .filter((name) => name.startsWith("aui-"))
      .filter((name) => !sourceText.includes(name));
    expect(unused).toEqual([]);
  });

  it("keeps markdown code blocks wrapped instead of creating nested scroll traps", () => {
    expect(css).toMatch(/\.aui-markdown pre\s*\{[^}]*overflow:\s*visible;/s);
    expect(css).toMatch(/\.aui-markdown pre code\s*\{[^}]*white-space:\s*pre-wrap;/s);
    expect(css).toMatch(/\.aui-markdown pre code\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
  });

  it("keeps heavy transcript bodies scroll-contained only behind details", () => {
    expect(css).toMatch(/\.aui-transcript-card \.aui-command-output\s*\{[^}]*max-height:\s*280px;/s);
    expect(css).toMatch(/\.aui-thinking-block pre,\n\.aui-json-section pre\s*\{[^}]*max-height:\s*260px;/s);
  });
});
