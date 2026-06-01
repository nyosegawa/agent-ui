import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const repoSkillsRoot = join(root, ".agents", "skills");
const m4SkillNames = [
  "agent-ui-review",
  "browser-qa",
  "example-authoring",
  "release-validation",
];
const releaseOperationSkillNames = ["npm-release"];
const repositorySkillNames = [...m4SkillNames, ...releaseOperationSkillNames];

describe("repository development skills", () => {
  it("keeps repository skills discoverable with portable frontmatter", async () => {
    const skillNames = await skillDirs();
    for (const expected of repositorySkillNames) {
      expect(skillNames).toContain(expected);
    }

    for (const skillName of repositorySkillNames) {
      const skillPath = join(repoSkillsRoot, skillName, "SKILL.md");
      const text = await readFile(skillPath, "utf8");
      const frontmatter = parseFrontmatter(text);

      expect(frontmatter.name).toBe(skillName);
      expect(frontmatter.name).toMatch(/^[a-z0-9-]{1,64}$/);
      expect(frontmatter.description).toBeTypeOf("string");
      expect(frontmatter.description.length).toBeGreaterThan(120);
      expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
      expect(text.split(/\r?\n/).length).toBeLessThanOrEqual(500);
    }
  });

  it("keeps repository skill references one level deep and resolvable", async () => {
    for (const skillName of [...repositorySkillNames, "codex-upstream-sync"]) {
      const skillPath = join(repoSkillsRoot, skillName, "SKILL.md");
      const text = await readFile(skillPath, "utf8");
      for (const target of localMarkdownTargets(text)) {
        if (!target.startsWith("references/")) continue;
        expect(target, `${skillName} reference depth`).toMatch(/^references\/[^/]+\.md$/);
        expect(existsSync(resolve(dirname(skillPath), target)), target).toBe(true);
      }
    }
  });

  it("keeps repository skill roles separated by maintenance workflow", async () => {
    const review = await readSkillText("agent-ui-review");
    const release = await readSkillText("release-validation");
    const examples = await readSkillText("example-authoring");
    const browserQa = await readSkillText("browser-qa");
    const npmRelease = await readSkillText("npm-release");

    expect(review).toContain("Lead with findings");
    expect(review).toContain("Host applications own");
    expect(review).toContain("product workflows, routing, persistence");
    expect(release).toContain("Do not run build, `publint`, or `attw` in parallel");
    expect(release).toContain("gh run list");
    expect(examples).toContain("@nyosegawa/agent-ui-react/styles.css");
    expect(examples).toContain("--aui-*");
    expect(examples).toContain("fixture routes deterministic");
    expect(browserQa).toContain("agent-browser skills get core");
    expect(browserQa).toContain("Screenshots alone are not enough");
    expect(browserQa).toMatch(/Playwright is the\s+deterministic CI gate/);
    expect(npmRelease).toContain("first public release is `0.1.0`");
    expect(npmRelease).toContain("manual `workflow_dispatch`");
    expect(npmRelease).toContain("npm-release` GitHub Environment");
    expect(npmRelease).toContain("bunx changeset publish");
    expect(npmRelease).toMatch(/must not publish packages unless the user\s+explicitly asks/);
  });

  it("keeps M4 skills focused on ownership boundaries instead of narrow host names", async () => {
    const m4Text = await Promise.all(
      m4SkillNames.map((name) => readSkillText(name)),
    ).then((parts) => parts.join("\n"));

    expect(m4Text).not.toMatch(/skill-with-app/i);
    expect(m4Text).not.toMatch(/\bwatcher\b/i);
    expect(m4Text).toContain("Host applications own");
    expect(m4Text).toContain("app-specific orchestration");
  });
});

async function skillDirs(): Promise<string[]> {
  const dirents = await readdir(repoSkillsRoot, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort();
}

async function readSkillText(skillName: string): Promise<string> {
  const skillRoot = join(repoSkillsRoot, skillName);
  return readMarkdownTree(skillRoot);
}

async function readMarkdownTree(path: string): Promise<string> {
  const dirents = await readdir(path, { withFileTypes: true });
  const parts: string[] = [];
  for (const dirent of dirents) {
    const child = join(path, dirent.name);
    if (dirent.isDirectory()) {
      parts.push(await readMarkdownTree(child));
    } else if (dirent.isFile() && dirent.name.endsWith(".md")) {
      parts.push(await readFile(child, "utf8"));
    }
  }
  return parts.join("\n");
}

function parseFrontmatter(text: string): Record<string, string> {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  expect(match).not.toBeNull();

  const fields: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split(/\r?\n/)) {
    const field = line.match(/^([a-zA-Z0-9-]+):\s*(.*)$/);
    expect(field, `invalid frontmatter line: ${line}`).not.toBeNull();
    if (!field) continue;
    fields[field[1]] = field[2];
  }
  return fields;
}

function localMarkdownTargets(markdown: string): string[] {
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, "");
  return [...withoutCodeBlocks.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map((match) => match[1] ?? "")
    .filter((target) => {
      return (
        target !== "" && !target.startsWith("#") && !/^[a-z][a-z0-9+.-]*:/i.test(target)
      );
    });
}
