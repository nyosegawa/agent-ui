import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REACT_SRC = join(__dirname, "..", "src");
const STYLE_PATH = join(__dirname, "..", "src", "styles.css");
const STYLE_DIR = join(__dirname, "..", "src", "styles");
const REPO_ROOT = join(__dirname, "..", "..", "..");
const DOCS_DIR = join(REPO_ROOT, "docs");
const REACT_PACKAGE_JSON = join(__dirname, "..", "package.json");
const EXAMPLE_STYLE_DIRS = [
  join(REPO_ROOT, "examples", "local-react-vite", "src", "styles"),
  join(REPO_ROOT, "examples", "codex-local-web", "src"),
  join(REPO_ROOT, "examples", "docs-site", "src"),
];
const EXAMPLE_HTML_FILES = [
  join(REPO_ROOT, "examples", "codex-local-web", "index.html"),
  join(REPO_ROOT, "examples", "local-react-vite", "index.html"),
  join(REPO_ROOT, "examples", "docs-site", "index.html"),
];
const VISUAL_SOURCE_DIRS = [
  REACT_SRC,
  join(REPO_ROOT, "examples", "local-react-vite", "src"),
  join(REPO_ROOT, "examples", "codex-local-web", "src"),
  join(REPO_ROOT, "examples", "docs-site", "src"),
];
const rawColorPattern =
  /#[0-9a-fA-F]{3,8}\b|%23[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/;

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

function designTokenDefinitions(tokens: string): Set<string> {
  return new Set(
    Array.from(tokens.matchAll(/(--aui-[a-zA-Z0-9-]+)\s*:/g)).map(
      (match) => match[1]!,
    ),
  );
}

function designTokenReferences(text: string): Set<string> {
  return new Set(
    Array.from(text.matchAll(/var\((--aui-[a-zA-Z0-9-]+)/g)).map(
      (match) => match[1]!,
    ),
  );
}

function cssBlockContentsAt(css: string, open: number): string | undefined {
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    const char = css[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, index);
      }
    }
  }
  return undefined;
}

function selectorBlocks(css: string, selector: string): string[] {
  const blocks: string[] = [];
  let searchFrom = 0;
  while (searchFrom < css.length) {
    const start = css.indexOf(`${selector} {`, searchFrom);
    if (start === -1) break;
    const open = css.indexOf("{", start);
    const block = cssBlockContentsAt(css, open);
    if (block) blocks.push(block);
    searchFrom = open + (block?.length ?? 0) + 1;
  }
  return blocks;
}

function mediaBlock(css: string, query: string): string {
  const start = css.indexOf(`@media ${query}`);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  return cssBlockContentsAt(css, open) ?? "";
}

function tokenDeclarationsInBlocks(blocks: string[]): Array<[string, string]> {
  const declarations = new Map<string, string>();
  for (const block of blocks) {
    for (const match of block.matchAll(/(--aui-[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations.set(match[1]!, match[2]!.trim());
    }
  }
  return [...declarations.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function styleFilesUnder(...dirs: string[]): string[] {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "dist" || entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (entry.name.endsWith(".css")) files.push(path);
    }
  };
  dirs.forEach(visit);
  return files.sort();
}

function sourceFilesUnder(...dirs: string[]): string[] {
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "dist" || entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(path);
    }
  };
  dirs.forEach(visit);
  return files.sort();
}

function lineViolations(
  files: string[],
  pattern: RegExp,
  allow: (line: string) => boolean,
): string[] {
  const violations: string[] = [];
  for (const file of files) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (pattern.test(line) && !allow(line)) {
        violations.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  return violations;
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

  it("defines the design-system token groups used by distributed styles", () => {
    const tokens = readFileSync(join(STYLE_DIR, "tokens.css"), "utf8");
    for (const token of [
      "--aui-space-100",
      "--aui-space-400",
      "--aui-font-size-md",
      "--aui-font-size-xl-plus",
      "--aui-line-relaxed",
      "--aui-line-prose",
      "--aui-control-height-md",
      "--aui-control-height-lg-plus",
      "--aui-radius-md",
      "--aui-duration-normal",
      "--aui-duration-focus",
      "--aui-duration-spin",
      "--aui-duration-pulse",
      "--aui-letter-spacing",
      "--aui-letter-spacing-label",
    ]) {
      expect(tokens, token).toContain(token);
    }
  });

  it("does not reference undefined design-system tokens", () => {
    const tokens = readFileSync(join(STYLE_DIR, "tokens.css"), "utf8");
    const definedTokens = designTokenDefinitions(tokens);
    const tokenText = [
      readFileSync(STYLE_PATH, "utf8"),
      ...styleFilesUnder(STYLE_DIR, ...EXAMPLE_STYLE_DIRS).map((file) =>
        readFileSync(file, "utf8"),
      ),
      ...sourceFilesUnder(...VISUAL_SOURCE_DIRS).map((file) =>
        readFileSync(file, "utf8"),
      ),
    ].join("\n");
    const undefinedTokens = Array.from(designTokenReferences(tokenText))
      .filter((token) => !definedTokens.has(token))
      .sort();
    expect(undefinedTokens).toEqual([]);
  });

  it("keeps styles.css as the only public React stylesheet import", () => {
    const packageJson = JSON.parse(readFileSync(REACT_PACKAGE_JSON, "utf8")) as {
      exports?: Record<string, unknown>;
    };
    const exportKeys = Object.keys(packageJson.exports ?? {});
    expect(exportKeys.filter((key) => key.includes("style"))).toEqual(["./styles.css"]);
    expect(exportKeys.filter((key) => key.startsWith("./styles/"))).toEqual([]);

    const sourceText = [
      readFileSync(join(REPO_ROOT, "README.md"), "utf8"),
      readTextUnder(
        DOCS_DIR,
        join(REPO_ROOT, "examples"),
      ),
    ].join("\n");
    expect(sourceText).not.toMatch(/@nyosegawa\/agent-ui-react\/styles\//);
    expect(sourceText).not.toMatch(
      /(?:import|from)\s+["'][^"']*@nyosegawa\/agent-ui-react\/dist\/styles\//,
    );
    expect(sourceText).not.toMatch(
      /import\s+["'][^"']*packages\/react\/src\/styles\//,
    );
  });

  it("keeps dark and system theme token definitions in parity", () => {
    const tokens = readFileSync(join(STYLE_DIR, "tokens.css"), "utf8");
    const darkDeclarations = tokenDeclarationsInBlocks(
      selectorBlocks(tokens, '[data-aui-theme="dark"]'),
    ).filter(([token]) => token !== "--aui-color-scheme");
    const systemDarkDeclarations = tokenDeclarationsInBlocks(
      selectorBlocks(
        mediaBlock(tokens, "(prefers-color-scheme: dark)"),
        '[data-aui-theme="system"]',
      ),
    );

    expect(systemDarkDeclarations).toEqual(darkDeclarations);
  });

  it("keeps distributed component CSS on design-system tokens for color, radius, and tracking", () => {
    const files = styleFilesUnder(STYLE_DIR).filter(
      (file) => !file.endsWith("tokens.css"),
    );
    expect(lineViolations(files, rawColorPattern, () => false)).toEqual([]);
    expect(
      lineViolations(files, /letter-spacing:\s*[^;]+;/, (line) =>
        /letter-spacing:\s*(0|var\(--aui-[^)]+\));/.test(line),
      ),
    ).toEqual([]);
    expect(
      lineViolations(files, /border(?:-[a-z]+)*-radius:\s*[^;]*\b\d+(?:\.\d+)?px\b/, (line) =>
        /border(?:-[a-z]+)*-radius:\s*(0|50%);/.test(line),
      ),
    ).toEqual([]);
    expect(
      lineViolations(files, /\b\d+(?:\.\d+)?(?:ms|s)\b/, (line) =>
        /var\(--aui-duration-/.test(line),
      ),
    ).toEqual([]);
  });

  it("keeps fixture and docs example CSS visually aligned with Agent UI tokens", () => {
    const files = styleFilesUnder(...EXAMPLE_STYLE_DIRS);
    expect(lineViolations(files, rawColorPattern, () => false)).toEqual([]);
    expect(
      lineViolations(files, /letter-spacing:\s*[^;]+;/, (line) =>
        /letter-spacing:\s*(0|var\(--aui-[^)]+\));/.test(line),
      ),
    ).toEqual([]);
    expect(
      lineViolations(files, /border(?:-[a-z]+)*-radius:\s*[^;]*\b\d+(?:\.\d+)?px\b/, (line) =>
        /border(?:-[a-z]+)*-radius:\s*(0|50%);/.test(line),
      ),
    ).toEqual([]);
    expect(
      lineViolations(files, /\b\d+(?:\.\d+)?(?:ms|s)\b/, (line) =>
        /var\(--aui-duration-/.test(line),
      ),
    ).toEqual([]);
  });

  it("keeps visual inline styles from bypassing design-system tokens", () => {
    const files = sourceFilesUnder(...VISUAL_SOURCE_DIRS);
    expect(lineViolations(files, /letterSpacing:\s*["']-/, () => false)).toEqual([]);
    expect(lineViolations(files, rawColorPattern, () => false)).toEqual([]);
    expect(
      lineViolations(
        files,
        /borderRadius:\s*(?:\d+(?:\.\d+)?|["'][^"']*\b\d+(?:\.\d+)?px\b[^"']*["'])/,
        (line) => /borderRadius:\s*(?:0|["']0["'])/.test(line),
      ),
    ).toEqual([]);
    expect(
      lineViolations(
        files,
        /\b(?:fontSize|fontFamily|lineHeight|gap|rowGap|columnGap|padding|margin|outline|outlineOffset|transitionDuration|animationDuration):\s*[^,}]+/,
        (line) =>
          /:\s*(?:0|["']0["']|["'][^"']*var\(--aui-[^)]+\)[^"']*["'])/.test(line) ||
          /styles\.(?:fontSize|fontFamily|lineHeight)/.test(line),
      ),
    ).toEqual([]);
  });

  it("keeps example HTML style blocks on design-system tokens", () => {
    expect(lineViolations(EXAMPLE_HTML_FILES, rawColorPattern, () => false)).toEqual([]);
    expect(
      lineViolations(EXAMPLE_HTML_FILES, /\b(?:padding|margin|gap):\s*[^;]+;/, (line) =>
        /:\s*(?:0|var\(--aui-[^)]+\)(?: [^;]+)?);/.test(line),
      ),
    ).toEqual([]);
  });

  it.each([
    ".aui-run-controls-compact",
    ".aui-transcript-card",
    ".aui-message-list",
    ".aui-turn",
    ".aui-message",
    '.aui-message[data-kind="userMessage"]',
    '.aui-message[data-kind="reasoning"]',
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
    ".aui-follow-up-queue",
    ".aui-follow-up-card",
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
    expect(css).toMatch(
      /\.aui-transcript-card \.aui-command-output\s*\{[^}]*max-height:\s*280px;/s,
    );
    expect(css).toMatch(
      /\.aui-thinking-block pre,\n\.aui-json-section pre\s*\{[^}]*max-height:\s*260px;/s,
    );
  });
});
