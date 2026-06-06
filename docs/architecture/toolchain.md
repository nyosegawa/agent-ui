# Toolchain

Repository pins and CI workflows are the source of truth. Do not keep dated
"latest upstream" snapshots in product docs; check upstream registries at
upgrade time and update pins, lockfile, generated output, and workflows in the
same change.

## Repository Pins

Current repo-pinned baseline:

```text
package manager: bun@1.3.13
CI setup-bun: 1.3.13
Node compatibility target: Node 22 / 24
pnpm compatibility smoke: pnpm@10.15.0
TypeScript: 6.0.3
Vite: 8.0.11
Vitest: 4.1.5
Playwright: 1.59.1
React peer range: >=18.3.0 || >=19.0.0
React dev/example version: 19.2.6
```

Keep `packageManager`, CI setup-bun versions, `@types/bun`, and `bun.lock`
aligned when changing the Bun pin.

Local installed tool versions are diagnostics only. They do not define latest
availability or repository policy. Before dependency upgrades, query the
current upstream sources live and treat this page as the repo-pinned baseline,
not as a latest-version catalog.

## Runtime Policy

- Bun is the primary package manager and development runner.
- Published packages must remain Node-compatible.
- Browser packages must not depend on Node-only APIs.
- Node process, filesystem, upload, and WebSocket bridge code belongs in
  `@nyosegawa/agent-ui-server`.
- Stdio transport and Codex protocol framing belong in
  `@nyosegawa/agent-ui-codex`.

## Workspace Policy

Use package.json workspaces and Bun workspace filters:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Do not introduce monorepo orchestration just to paper over unclear package
boundaries. `turbo` is not installed today; evaluate it only if task graph
caching becomes a real bottleneck.

## Build And Package Validation

The package build uses `tsup`; declarations and ESM/CJS export shape are
validated with:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

`validate:packages` is the ordered build, `test:packlist`,
`test:node-compat`, `publint`, and `attw` path. Do not run build, `publint`, or
`attw` in parallel because build cleans package `dist/` directories. API
snapshots are export-map driven and compare public declaration targets only.

If package exports or declaration output become hard to maintain, evaluate
`tsdown`, `unbuild`, or raw `tsc`, but do not switch without evidence.

## Release Automation

Changesets configuration lives in `.changeset/config.json`. Use the manually
created release PR flow from `.agents/skills/npm-release/`: create a release
branch, run `bunx changeset version` locally, and open one release PR whose
title includes the target version. After that reviewed release PR is merged, the
trusted `main` push release path validates again and publishes only public
package versions that are not already on npm. Publishing requires `NPM_TOKEN` as
a repository secret for trusted `main` push workflows. `CHANGESETS_GITHUB_TOKEN`
is optional when a stronger token is needed for GitHub Release creation;
otherwise the workflow uses the default `GITHUB_TOKEN`.

The publish job grants `id-token: write` and sets `NPM_CONFIG_PROVENANCE=true`
so npm provenance can be attached when the registry and token support it.

## Codex Reference

`@openai/codex` and the local OpenAI Codex checkout are references for the App
Server protocol. Agent UI's primary integration is:

```text
codex app-server --listen stdio://
```

Do not treat an npm Codex package API as the primary product boundary unless a
future design explicitly changes that.
