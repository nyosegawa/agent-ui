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

  it("keeps Codex app metadata explicit and portable", async () => {
    const metadataPath = join(publicSkillRoot, "agent-ui", "agents", "openai.yaml");
    const text = await readFile(metadataPath, "utf8");
    const metadata = parseOpenAiMetadata(text);

    expect(metadata.interface).toEqual({
      brand_color: "#2563EB",
      default_prompt:
        "Use $agent-ui to integrate or debug Agent UI in this host application.",
      display_name: "Agent UI",
      short_description:
        "Integrate reusable Codex App Server UI components in host applications.",
    });
    expect(metadata.policy).toEqual({ allow_implicit_invocation: true });
    expect(metadata.dependencies).toBeUndefined();
  });

  it("keeps public skill guidance aligned with Agent UI public APIs", async () => {
    const allSkillText = await readSkillTreeText(join(publicSkillRoot, "agent-ui"));

    for (const required of [
      "@nyosegawa/agent-ui-react",
      "@nyosegawa/agent-ui-codex",
      "@nyosegawa/agent-ui-codex/websocket",
      "@nyosegawa/agent-ui-codex/request-builders",
      "@nyosegawa/agent-ui-server",
      "@nyosegawa/agent-ui-react/primitives",
      "@nyosegawa/agent-ui-react/styles.css",
      "createCodexWebSocketTransport",
      "attachAgentUiWebSocketBridge",
      "createAgentUiLocalMediaHelper",
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
    expect(allSkillText).not.toContain(
      'AgentResolvedLocalAttachment } from "@nyosegawa/agent-ui-react"',
    );
    expect(allSkillText).toContain(
      "Same-origin routing and upstream `Origin` checks are not authentication.",
    );
    expect(allSkillText).toContain("canonical resume");
    expect(allSkillText).toContain("thread/read` preview hydration versus `thread/resume` activation");
    expect(allSkillText).toContain("bridgePolicy.admission");
    expect(allSkillText).toContain("local-loopback");
    expect(allSkillText).toContain("host-callback");
    expect(allSkillText).toContain("unsafe-no-admission");
    expect(allSkillText).toContain("per-connection resolver pattern");
    expect(allSkillText).toContain("mobile thread history drawer");
    expect(allSkillText).toContain("--aui-z-sheet");
    expect(allSkillText).toContain("host-owned workflow gates");
    expect(allSkillText).toContain("structured asset URLs");
    expect(allSkillText).toMatch(/browser `File` to local-path upload\s+adapter/);
    expect(allSkillText).toMatch(/canonical approval\s+kinds/);
    expect(allSkillText).toContain("AgentWorkingDirectory");
    expect(allSkillText).toContain("AgentResourcePath");
    expect(allSkillText).toContain("AgentSkillPath");
    expect(allSkillText).toContain("AgentMentionPath");
    expect(allSkillText).toContain("Match the existing lockfile");
    expect(allSkillText).toMatch(/do not\s+create a second lockfile/);
    expect(allSkillText).toContain("Use published Agent UI packages from the registry");
    expect(allSkillText).toContain("Do not target internal `.aui-*` selectors");
    expect(allSkillText).toContain("changed host CSS contains no `.aui-` selectors");
    expect(allSkillText).toContain("Use the host app's validation ladder");
    expect(allSkillText).toContain("host-local route");
    expect(allSkillText).toContain("local browser smoke against the Agent UI route");
  });

  it("routes new adopters through safe first-host-app and upload guidance", async () => {
    const skillText = await readFile(
      join(publicSkillRoot, "agent-ui", "SKILL.md"),
      "utf8",
    );
    const allSkillText = await readSkillTreeText(join(publicSkillRoot, "agent-ui"));

    for (const requiredTrigger of [
      "new adopter",
      "first host app",
      "AgentChat preset",
      "headless + primitives",
      "same-origin bridge skeleton",
      "Node >=22",
      "新規導入",
      "初回導入",
      "最小構成",
    ]) {
      expect(skillText, requiredTrigger).toContain(requiredTrigger);
    }

    for (const requiredGuidance of [
      'browserMethodPolicy: "productized"',
      'admission: { mode: "local-loopback" }',
      "Do not start new adopters on",
      "Check `response.ok`",
      "assertLocalMediaAsset",
      "Do not blindly trust `asset.path`",
      "dedicated upload root",
      "turn/completed",
      "transcriptDisplay",
      "default`, `byCategory`, and `byRole`",
      "resolution is `default` -> `byCategory` -> `byRole`",
      'transcriptDisplay="answer-focused"',
      'transcriptMode="answer-focused"',
      "raw protocol item",
      "block kinds",
      "answer-focused",
      "send a message",
      "stop a running turn",
      "steer a running turn",
      "approve and decline a pending approval",
      "attach image and non-image files",
      "@nyosegawa/agent-ui-codex/test-fixtures",
      "mobile and tablet widths for overflow",
      "verify reload/resume keeps the canonical thread id",
    ]) {
      expect(allSkillText, requiredGuidance).toContain(requiredGuidance);
    }
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
      "upload-only compatibility entry point",
      "legacyExecApproval",
      "legacyPatchApproval",
      "path URI",
      "pathUri",
      "pathuri",
      "/maintainer-gallery",
      "close-up",
      "closeup",
      "probe route",
      "specimen",
      "visual-route-matrix.e2e.ts",
      "test:e2e:fixtures",
      "validate:packages",
      "test:api-snapshots",
      "test:repo-skills",
      "GitHub Actions",
      "CI gate",
      "Repository policy",
      "Playwright fixtures",
      "bun run typecheck",
      "bun run lint",
      "bun run test",
      "real-local",
      "fixture matrix",
      "maintainer fixture",
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

function parseOpenAiMetadata(text: string): {
  dependencies?: unknown;
  interface?: Record<string, string>;
  policy?: Record<string, boolean>;
} {
  const metadata: {
    dependencies?: unknown;
    interface?: Record<string, string>;
    policy?: Record<string, boolean>;
  } = {};
  let section: "dependencies" | "interface" | "policy" | undefined;

  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.trim() === "") continue;
    const topLevel = line.match(/^([a-z_]+):$/);
    if (topLevel) {
      const key = topLevel[1];
      expect(["dependencies", "interface", "policy"], `${index + 1}: ${line}`).toContain(
        key,
      );
      section = key as typeof section;
      if (section === "dependencies") metadata.dependencies = {};
      else metadata[section] = {};
      continue;
    }

    const field = line.match(/^ {2}([a-z_]+):\s*(.+)$/);
    expect(field, `invalid metadata line ${index + 1}: ${line}`).not.toBeNull();
    if (!field || !section) continue;

    const [, key, rawValue] = field;
    if (section === "dependencies") {
      throw new Error(`unexpected dependency metadata at line ${index + 1}: ${line}`);
    }
    if (section === "policy") {
      expect(["true", "false"], `${index + 1}: ${line}`).toContain(rawValue);
      metadata.policy ??= {};
      metadata.policy[key] = rawValue === "true";
      continue;
    }
    metadata.interface ??= {};
    metadata.interface[key] = parseYamlString(rawValue);
  }

  return metadata;
}

function parseYamlString(rawValue: string): string {
  const quoted = rawValue.match(/^"([\s\S]*)"$/);
  if (quoted) return quoted[1].replace(/\\"/g, '"');
  return rawValue;
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
