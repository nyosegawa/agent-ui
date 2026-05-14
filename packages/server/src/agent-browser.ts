import { access } from "node:fs/promises";
import { join } from "node:path";
import { execa, type Options as ExecaOptions } from "execa";

export interface AgentBrowserDetection {
  cliAvailable: boolean;
  coreSkillAvailable: boolean;
  diagnostics: string[];
  repoSkillPath?: string;
  skillInput?: { name: "agent-browser"; path: string; type: "skill" };
  version?: string;
}

export type AgentBrowserRunner = (
  command: string,
  args: string[],
  options?: ExecaOptions,
) => Promise<{ stdout?: unknown }>;

export async function detectAgentBrowser(options: {
  cwd: string;
  execaOptions?: ExecaOptions;
  runner?: AgentBrowserRunner;
}): Promise<AgentBrowserDetection> {
  const diagnostics: string[] = [];
  const runner = options.runner ?? execa;
  const repoSkillPath = join(options.cwd, ".agents/skills/agent-browser/SKILL.md");
  let skillExists = false;
  try {
    await access(repoSkillPath);
    skillExists = true;
  } catch {
    diagnostics.push(`Missing repo agent-browser skill: ${repoSkillPath}`);
  }

  let version: string | undefined;
  try {
    const result = await runner("agent-browser", ["--version"], options.execaOptions);
    version = typeof result.stdout === "string" ? result.stdout.trim() : undefined;
  } catch (caught) {
    diagnostics.push(`agent-browser --version failed: ${errorMessage(caught)}`);
  }

  let coreSkillAvailable = false;
  if (version) {
    try {
      await runner("agent-browser", ["skills", "get", "core"], options.execaOptions);
      coreSkillAvailable = true;
    } catch (caught) {
      diagnostics.push(`agent-browser skills get core failed: ${errorMessage(caught)}`);
    }
  }

  return {
    cliAvailable: Boolean(version),
    coreSkillAvailable,
    diagnostics,
    repoSkillPath: skillExists ? repoSkillPath : undefined,
    skillInput: skillExists
      ? { name: "agent-browser", path: repoSkillPath, type: "skill" }
      : undefined,
    version,
  };
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}
