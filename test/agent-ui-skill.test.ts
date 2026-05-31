import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicSkillRoot = join(root, "skills");
const expectedAgentUiReferences = [
  "debug.md",
  "dynamic-tools.md",
  "host-owned-remote.md",
  "integration-profiles.md",
  "layout-composition.md",
  "local-single-user.md",
  "server-bridge.md",
  "theming.md",
  "uploads.md",
  "validation.md",
];

describe("public Agent UI skill", () => {
  it("uses the installable skills/*/SKILL.md layout with portable frontmatter", async () => {
    const skills = await publicSkillDirs();
    expect(skills.map((skill) => skill.name)).toEqual(["agent-ui"]);

    for (const skill of skills) {
      const text = await readFile(skill.skillPath, "utf8");
      const frontmatter = parseFrontmatter(text);

      expect(frontmatter.name).toBe(skill.name);
      expect(frontmatter.name).toMatch(/^[a-z0-9-]{1,64}$/);
      expect(frontmatter.description).toBeTypeOf("string");
      expect(frontmatter.description.length).toBeGreaterThan(120);
      expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
      expect(frontmatter.description).toContain("Agent UI");
      expect(frontmatter.description).toContain("Codex");
      expect(frontmatter.description).toContain("Agent UI導入");
      expect(text.split(/\r?\n/).length).toBeLessThanOrEqual(500);
    }
  });

  it("keeps progressive-disclosure references one level deep and complete", async () => {
    const skillPath = join(publicSkillRoot, "agent-ui", "SKILL.md");
    const text = await readFile(skillPath, "utf8");
    const links = localMarkdownTargets(text);

    expect(links).toEqual([
      "references/integration-profiles.md",
      "references/local-single-user.md",
      "references/host-owned-remote.md",
      "references/server-bridge.md",
      "references/layout-composition.md",
      "references/theming.md",
      "references/uploads.md",
      "references/dynamic-tools.md",
      "references/debug.md",
      "references/validation.md",
    ]);

    for (const link of links) {
      expect(link, "reference links should stay one level below SKILL.md").toMatch(
        /^references\/[^/]+\.md$/,
      );
      expect(existsSync(resolve(dirname(skillPath), link)), link).toBe(true);
    }

    const actualReferences = await readdir(
      join(publicSkillRoot, "agent-ui", "references"),
    );
    expect(actualReferences.sort()).toEqual(expectedAgentUiReferences);
  });

  it("keeps public skill guidance aligned with Agent UI public APIs", async () => {
    const allSkillText = await readSkillTreeText(join(publicSkillRoot, "agent-ui"));

    for (const required of [
      "@nyosegawa/agent-ui-react",
      "@nyosegawa/agent-ui-codex",
      "@nyosegawa/agent-ui-codex/websocket",
      "@nyosegawa/agent-ui-codex/request-builders",
      "@nyosegawa/agent-ui-server",
      "@nyosegawa/agent-ui-react/styles.css",
      "createCodexWebSocketTransport",
      "attachAgentUiWebSocketBridge",
      "createAgentUiLocalUploadHandler",
      "createMcpDynamicToolHandler",
      "createAgentUiNextRpcRoute",
      "AgentProvider",
      "AgentChat",
      "--aui-*",
    ]) {
      expect(allSkillText, required).toContain(required);
    }

    expect(allSkillText).toContain("Only the full chat bridge can power `AgentChat`.");
    expect(allSkillText).toContain("A plain Route Handler is only for one-shot RPC.");
    expect(allSkillText).toContain(
      "Same-origin routing and upstream `Origin` checks are not authentication.",
    );
    expect(allSkillText).toContain("Match the existing lockfile");
    expect(allSkillText).toMatch(/do not\s+create a second lockfile/);
    expect(allSkillText).toContain("Use published Agent UI packages from the registry");
    expect(allSkillText).toContain("Do not target internal `.aui-*` selectors");
    expect(allSkillText).toContain("changed host CSS contains no `.aui-` selectors");
  });

  it("keeps public skill docs free of maintainer-only or stale repository assumptions", async () => {
    const allSkillText = await readSkillTreeText(join(publicSkillRoot, "agent-ui"));

    for (const forbidden of [
      "CODEX_REPO",
      "/Users/sakasegawa",
      "@nyosegawa/agent-ui-react/dist/styles",
      "dist/styles/*",
      "git reset --hard",
      "publish --access",
    ]) {
      expect(allSkillText, forbidden).not.toContain(forbidden);
    }
  });
});

async function publicSkillDirs(): Promise<Array<{ name: string; skillPath: string }>> {
  const dirents = await readdir(publicSkillRoot, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => ({
      name: dirent.name,
      skillPath: join(publicSkillRoot, dirent.name, "SKILL.md"),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
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

async function readSkillTreeText(path: string): Promise<string> {
  const dirents = await readdir(path, { withFileTypes: true });
  const parts: string[] = [];

  for (const dirent of dirents) {
    const child = join(path, dirent.name);
    if (dirent.isDirectory()) {
      parts.push(await readSkillTreeText(child));
    } else if (
      dirent.isFile() &&
      (dirent.name === "SKILL.md" || dirent.name.endsWith(".md"))
    ) {
      parts.push(`# ${basename(child)}\n${await readFile(child, "utf8")}`);
    }
  }

  return parts.join("\n");
}
