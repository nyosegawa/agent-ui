import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const markdownRoots = ["docs", "examples"];
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
