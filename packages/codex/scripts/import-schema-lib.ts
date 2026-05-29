import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface SchemaImportMetadata {
  codexRepo: string;
  commit: string;
  commitDate: string;
  generatedAt: string;
  generatorCommand: string;
  subject: string;
}

export function resolveCodexRepo(
  env: Pick<NodeJS.ProcessEnv, "CODEX_REPO">,
  cwd = process.cwd(),
): string {
  const raw = env.CODEX_REPO?.trim();
  if (!raw) {
    throw new Error(
      "CODEX_REPO is required for schema import; pass an explicit upstream Codex checkout.",
    );
  }
  const expanded = raw.startsWith("~/") ? `${homedir()}${raw.slice(1)}` : raw;
  return resolve(cwd, expanded);
}

export function assertRequiredUpstreamPaths(codexRepo: string): void {
  const required = ["codex-rs/app-server", "codex-rs/app-server-protocol"];
  const missing = required.filter((path) => !existsSync(resolve(codexRepo, path)));
  if (missing.length > 0) {
    throw new Error(
      `CODEX_REPO is missing required App Server paths: ${missing.join(", ")}`,
    );
  }
}

export function assertFocusedGitClean(
  porcelainStatus: string,
  focusedPaths = ["codex-rs/app-server", "codex-rs/app-server-protocol"],
): void {
  const dirty = porcelainStatus
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  if (dirty.length === 0) return;

  throw new Error(
    [
      "CODEX_REPO has uncommitted changes in schema import paths.",
      `Focused paths: ${focusedPaths.join(", ")}`,
      ...dirty.map((line) => `- ${line}`),
    ].join("\n"),
  );
}

export async function collectSchemaImportMetadata(
  codexRepo: string,
  generatedAt = new Date().toISOString(),
): Promise<SchemaImportMetadata> {
  const commit = await gitText(codexRepo, ["rev-parse", "HEAD"]);
  const commitDate = await gitText(codexRepo, ["show", "-s", "--format=%cI", "HEAD"]);
  const subject = await gitText(codexRepo, ["show", "-s", "--format=%s", "HEAD"]);
  return {
    codexRepo,
    commit,
    commitDate,
    generatedAt,
    generatorCommand: `CODEX_REPO=${codexRepo} bun --filter @nyosegawa/agent-ui-codex generate:schema`,
    subject,
  };
}

export async function readFocusedGitStatus(codexRepo: string): Promise<string> {
  return gitText(codexRepo, [
    "status",
    "--porcelain",
    "--",
    "codex-rs/app-server",
    "codex-rs/app-server-protocol",
  ]);
}

export function patchProtocolMetadata(source: string, metadata: SchemaImportMetadata): string {
  const next = source
    .replace(
      /export const CODEX_PROTOCOL_COMMIT = "[^"]+";/,
      `export const CODEX_PROTOCOL_COMMIT = "${metadata.commit}";`,
    )
    .replace(
      /export const CODEX_PROTOCOL_GENERATED_AT = "[^"]+";/,
      `export const CODEX_PROTOCOL_GENERATED_AT = "${metadata.generatedAt}";`,
    );
  if (next === source) {
    throw new Error("Failed to update CODEX_PROTOCOL metadata constants.");
  }
  return next;
}

export function patchPackageJsonMetadata(
  source: string,
  metadata: SchemaImportMetadata,
): string {
  const parsed = JSON.parse(source) as {
    agentUi?: Record<string, unknown>;
  };
  parsed.agentUi = {
    ...(parsed.agentUi ?? {}),
    codexProtocolCommit: metadata.commit,
    generatedAt: metadata.generatedAt,
  };
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function renderGeneratedReadme(metadata: SchemaImportMetadata): string {
  return [
    "# Codex App Server Generated Schema",
    "",
    "This directory contains vendored TypeScript schema generated from the upstream",
    "Codex App Server protocol.",
    "",
    `- Upstream repository: \`${metadata.codexRepo}\``,
    `- Upstream commit: \`${metadata.commit}\``,
    `- Upstream commit date: \`${metadata.commitDate}\``,
    `- Upstream subject: \`${metadata.subject}\``,
    `- Generated at: \`${metadata.generatedAt}\``,
    `- Generator command: \`${metadata.generatorCommand}\``,
    "",
    "The generator exports both stable and experimental schema from",
    "`codex-rs/app-server-protocol`.",
    "",
  ].join("\n");
}

async function gitText(cwd: string, args: readonly string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", [...args], {
    cwd,
    encoding: "utf8",
  });
  return stdout.trim();
}
