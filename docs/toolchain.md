# Toolchain

Checked on 2026-05-17 JST against the repository and public package/version
indexes. Upstream latest versions are useful for upgrade planning; repository
pins are the source of truth for day-to-day work.

## Repository Pins

Current repo-pinned baseline:

```text
package manager: bun@1.3.13
Node compatibility target: Node 20 / 22 / 24
TypeScript: 6.0.3
Vite: 8.0.11
Vitest: 4.1.5
Playwright: 1.59.1
React peer range: >=18.3.0 || >=19.0.0
React dev/example version: 19.2.6
```

Keep `packageManager`, CI setup-bun versions, `@types/bun`, and `bun.lock`
aligned when changing the Bun pin.

## Local Environment Snapshot

Observed local tools:

```text
Node.js: v22.19.0
Bun: 1.3.13
npm: 11.11.0
pnpm: 10.15.0
```

Local installed versions are diagnostics only. They do not define latest
availability or repository policy.

## Upstream Snapshot

Observed upstream availability on 2026-05-17:

```text
Node.js current: v26.1.0
Node.js latest LTS: v24.15.0 Krypton
Bun latest: 1.3.14
pnpm latest: 11.1.2
Vite latest: 8.0.13
Vitest latest: 4.1.6
Playwright latest: 1.60.0
```

Upgrade by changing pins deliberately, updating the lockfile in the same
change, and running the local release gate in [testing.md](testing.md).

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
bun run build
bun run publint
bun run attw
bun run test:package-resolution
bun run test:node-compat
```

If package exports or declaration output become hard to maintain, evaluate
`tsdown`, `unbuild`, or raw `tsc`, but do not switch without evidence.

## Release Automation

Changesets configuration lives in `.changeset/config.json`. The release
workflow validates the repo, then creates or updates a Changesets version PR
when unpublished changesets exist. Publishing requires `NPM_TOKEN`; creating
the version PR requires `CHANGESETS_GITHUB_TOKEN` when the default
`GITHUB_TOKEN` cannot open pull requests.

The release workflow grants `id-token: write` and sets
`NPM_CONFIG_PROVENANCE=true` so npm provenance can be attached when the registry
and token support it.

## Codex Reference

`@openai/codex` and the local OpenAI Codex checkout are references for the App
Server protocol. Agent UI's primary integration is:

```text
codex app-server --listen stdio://
```

Do not treat an npm Codex package API as the primary product boundary unless a
future design explicitly changes that.
