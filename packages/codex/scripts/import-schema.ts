import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  assertFocusedGitClean,
  assertRequiredUpstreamPaths,
  collectSchemaImportMetadata,
  patchPackageJsonMetadata,
  patchProtocolMetadata,
  readFocusedGitStatus,
  renderGeneratedReadme,
  resolveCodexRepo,
} from "./import-schema-lib";

const execFileAsync = promisify(execFile);

const generatedRoot = fileURLToPath(new URL("../src/generated", import.meta.url));
const codexPackageRoot = fileURLToPath(new URL("..", import.meta.url));
const codexRepo = resolveCodexRepo(process.env);
const codexRs = join(codexRepo, "codex-rs");

assertRequiredUpstreamPaths(codexRepo);
const metadata = await collectSchemaImportMetadata(codexRepo);
assertFocusedGitClean(await readFocusedGitStatus(codexRepo));

const tempRoot = await createTempGeneratedRoot();

try {
  await runCargoExport(join(tempRoot, "stable"));
  await runCargoExport(join(tempRoot, "experimental"), true);
  await deleteJsonFiles(tempRoot);
  await writeProtocolCapabilities(tempRoot);
  await replaceGeneratedOutput(tempRoot, generatedRoot);
  await writeMetadata(metadata);
} finally {
  await rm(tempRoot, { force: true, recursive: true });
}

async function writeProtocolCapabilities(outDir: string): Promise<void> {
  const stableClient = await extractMethods(`${outDir}/stable/ClientRequest.ts`);
  const stableNotifications = await extractMethods(`${outDir}/stable/ServerNotification.ts`);
  const stableServerRequests = await extractMethods(`${outDir}/stable/ServerRequest.ts`);
  const experimentalClient = await extractMethods(`${outDir}/experimental/ClientRequest.ts`);
  const experimentalOnly = experimentalClient.filter(
    (method) => !stableClient.includes(method),
  );
  const source = [
    "// GENERATED CODE! DO NOT MODIFY BY HAND!",
    "",
    declaration("generatedStableClientMethods", stableClient),
    "",
    declaration("generatedStableNotificationMethods", stableNotifications),
    "",
    declaration("generatedStableServerRequestMethods", stableServerRequests),
    "",
    declaration("generatedExperimentalOnlyClientMethods", experimentalOnly),
    "",
  ].join("\n");
  await Bun.write(`${outDir}/protocol-capabilities.ts`, source);
}

async function extractMethods(file: string): Promise<string[]> {
  const source = await Bun.file(file).text();
  return [...source.matchAll(/"method": "([^"]+)"/g)]
    .map((match) => match[1])
    .filter((method): method is string => Boolean(method))
    .sort();
}

function declaration(name: string, methods: readonly string[]): string {
  return [
    `export const ${name} = [`,
    ...methods.map((method) => `  ${JSON.stringify(method)},`),
    "] as const;",
  ].join("\n");
}

async function createTempGeneratedRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "agent-ui-codex-schema-"));
  await mkdir(join(root, "stable"), { recursive: true });
  await mkdir(join(root, "experimental"), { recursive: true });
  return root;
}

async function runCargoExport(outDir: string, experimental = false): Promise<void> {
  await execFileAsync(
    "cargo",
    [
      "run",
      "-p",
      "codex-app-server-protocol",
      "--bin",
      "export",
      "--",
      ...(experimental ? ["--experimental"] : []),
      "--out",
      outDir,
    ],
    {
      cwd: codexRs,
      maxBuffer: 1024 * 1024 * 20,
    },
  );
}

async function deleteJsonFiles(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await deleteJsonFiles(path);
      continue;
    }
    if (entry.name.endsWith(".json")) await rm(path);
  }
}

async function replaceGeneratedOutput(tempRoot: string, outDir: string): Promise<void> {
  await rm(join(outDir, "stable"), { force: true, recursive: true });
  await rm(join(outDir, "experimental"), { force: true, recursive: true });
  await rm(join(outDir, "protocol-capabilities.ts"), { force: true });
  await rename(join(tempRoot, "stable"), join(outDir, "stable"));
  await rename(join(tempRoot, "experimental"), join(outDir, "experimental"));
  await rename(
    join(tempRoot, "protocol-capabilities.ts"),
    join(outDir, "protocol-capabilities.ts"),
  );
}

async function writeMetadata(metadata: Awaited<ReturnType<typeof collectSchemaImportMetadata>>) {
  const protocolPath = join(codexPackageRoot, "src", "protocol.ts");
  const packageJsonPath = join(codexPackageRoot, "package.json");
  const generatedReadmePath = join(generatedRoot, "README.md");

  await writeFile(
    protocolPath,
    patchProtocolMetadata(await readFile(protocolPath, "utf8"), metadata),
  );
  await writeFile(
    packageJsonPath,
    patchPackageJsonMetadata(await readFile(packageJsonPath, "utf8"), metadata),
  );
  await writeFile(generatedReadmePath, renderGeneratedReadme(metadata));
}
