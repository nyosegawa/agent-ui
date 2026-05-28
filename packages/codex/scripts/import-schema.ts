import { $ } from "bun";

const out = new URL("../src/generated", import.meta.url).pathname;
const codexRepo =
  process.env.CODEX_REPO ?? "/Users/sakasegawa/src/github.com/openai/codex";
const codexRs = `${codexRepo}/codex-rs`;

await $`rm -rf ${out}/stable ${out}/experimental`;
await $`mkdir -p ${out}/stable ${out}/experimental`;
await $`cargo run -p codex-app-server-protocol --bin export -- --out ${out}/stable`.cwd(codexRs);
await $`cargo run -p codex-app-server-protocol --bin export -- --experimental --out ${out}/experimental`.cwd(
  codexRs,
);
await $`find ${out} -name '*.json' -delete`;
await writeProtocolCapabilities(out);

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
