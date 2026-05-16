import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STYLE_PATH = join(__dirname, "..", "src", "style.css");

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

describe("packages/react style.css", () => {
  const css = readFileSync(STYLE_PATH, "utf8");
  const occurrences = topLevelSelectorOccurrences(css);

  it.each([
    ".aui-run-controls-compact",
    ".aui-transcript-card",
    ".aui-message-list",
    ".aui-turn",
    ".aui-message",
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

  it("declares the rebuilt button system exactly once at the document root", () => {
    expect(occurrences.get(".aui-btn") ?? []).toHaveLength(1);
  });

  it("declares the rebuilt status pill exactly once at the document root", () => {
    expect(occurrences.get(".aui-status-pill") ?? []).toHaveLength(1);
  });

  it("does not contain the legacy attachment toolbar or chip selectors", () => {
    expect(css).not.toMatch(/\.aui-attachment-toolbar\b/);
    expect(css).not.toMatch(/\.aui-attachment-button\b/);
    expect(css).not.toMatch(/\.aui-attachment-chips\b/);
  });

  it("does not declare the retired plain .aui-button shell", () => {
    expect(occurrences.get(".aui-button") ?? []).toHaveLength(0);
    expect(occurrences.get(".aui-button-secondary") ?? []).toHaveLength(0);
  });

  it("does not contain the retired composer run-settings popover", () => {
    expect(css).not.toMatch(/\.aui-run-settings-popover\b/);
    expect(css).not.toMatch(/\.aui-run-settings-sheet\b/);
    expect(occurrences.get(".aui-composer-shell") ?? []).toHaveLength(0);
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
