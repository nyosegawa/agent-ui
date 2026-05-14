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
