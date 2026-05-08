import { $ } from "bun";

const out = new URL("../src/generated", import.meta.url).pathname;

await $`rm -rf ${out}/stable ${out}/experimental`;
await $`mkdir -p ${out}/stable ${out}/experimental`;
await $`codex app-server generate-ts --out ${out}/stable`;
await $`codex app-server generate-ts --experimental --out ${out}/experimental`;
