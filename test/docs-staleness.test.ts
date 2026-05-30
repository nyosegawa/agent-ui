import { readdir, readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const markdownRoots = ["docs", "examples"];
const publicMarkdownRoots = ["docs"];
const publicMarkdownFiles = ["README.md"];
const stalePatterns = [
  "examples/local-react-vite/playwright.config.ts",
  "/Users/sakasegawa/src/github.com/nyosegawa/agent-ui",
  ".aui-approval-card",
];

describe("documentation stale references", () => {
  it("keeps docs free of stale local paths, configs, and selectors", async () => {
    const files = await collectMarkdownFiles(process.cwd(), markdownRoots);
    const staleMatches: string[] = [];

    for (const file of files) {
      const text = await readFile(file, "utf8");
      for (const pattern of stalePatterns) {
        if (text.includes(pattern)) staleMatches.push(`${file}: ${pattern}`);
      }
    }

    expect(staleMatches).toEqual([]);
  });

  it("keeps public Markdown free of em dash characters", async () => {
    const files = [
      ...publicMarkdownFiles.map((file) => join(process.cwd(), file)),
      ...(await collectMarkdownFiles(process.cwd(), publicMarkdownRoots)),
      ...(await collectExamplePublicMarkdownFiles(process.cwd())),
    ];
    const matches: string[] = [];

    for (const file of files) {
      const text = await readFile(file, "utf8");
      text.split("\n").forEach((line, index) => {
        if (line.includes("—")) matches.push(`${file}:${index + 1}: ${line}`);
      });
    }

    expect(matches).toEqual([]);
  });

  it("documents docs-site as compile/style smoke instead of browser smoke", async () => {
    const files = [
      join(process.cwd(), "docs", "examples", "docs-site.md"),
      join(process.cwd(), "examples", "docs-site", "README.md"),
    ];

    for (const file of files) {
      const text = await readFile(file, "utf8");
      expect(text).toContain("compile/style smoke surface");
      expect(text).not.toMatch(/browser smoke/i);
    }
  });
});

async function collectMarkdownFiles(root: string, entries: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry);
    const dirents = await readdir(path, { withFileTypes: true });
    for (const dirent of dirents) {
      const child = join(path, dirent.name);
      if (dirent.isDirectory()) {
        files.push(...(await collectMarkdownFiles(root, [join(entry, dirent.name)])));
      } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
        files.push(child);
      }
    }
  }
  return files;
}

async function collectExamplePublicMarkdownFiles(root: string): Promise<string[]> {
  const files = await collectMarkdownFiles(root, ["examples"]);
  const recipePrefix = `${join(root, "examples", "recipes")}${sep}`;
  return files.filter((file) => {
    return file.endsWith(`${sep}README.md`) || file.startsWith(recipePrefix);
  });
}
