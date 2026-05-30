import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const agentUiRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const codexSubmodulePath = resolve(agentUiRepoRoot, "third_party/codex");

export interface SchemaImportMetadata {
  codexRepo: string;
  commit: string;
  commitDate: string;
  generatedAt: string;
  generatorCommand: string;
  subject: string;
}

export function resolveCodexSubmodule(): string {
  return codexSubmodulePath;
}

export function assertRequiredUpstreamPaths(codexRepo: string): void {
  const required = ["codex-rs/app-server", "codex-rs/app-server-protocol"];
  const missing = required.filter((path) => !existsSync(resolve(codexRepo, path)));
  if (missing.length > 0) {
    throw new Error(
      `third_party/codex is missing required App Server paths: ${missing.join(", ")}`,
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
      "third_party/codex has uncommitted changes in schema import paths.",
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
    generatorCommand: "bun --filter @nyosegawa/agent-ui-codex generate:schema",
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
  const upstreamPath = relative(agentUiRepoRoot, metadata.codexRepo) || metadata.codexRepo;
  return [
    "# Codex App Server Generated Schema",
    "",
    "This directory contains vendored TypeScript schema generated from the upstream",
    "Codex App Server protocol.",
    "",
    `- Upstream repository: \`${upstreamPath}\``,
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
