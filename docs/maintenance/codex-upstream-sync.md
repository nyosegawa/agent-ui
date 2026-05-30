# Codex Upstream Sync

Agent UI tracks OpenAI Codex App Server as the primary protocol source. The
update process is intentionally review-first: automation detects drift and can
open a draft PR, but semantic classification, UI behavior, docs, and validation
must be reviewed before merge.

## Ownership

The repository development skill lives at
`.agents/skills/codex-upstream-sync/`. Use it for Codex App Server schema
refreshes, protocol drift reports, and Codex Automation setup. Durable
maintenance scripts live under `scripts/codex-upstream/`; the skill orchestrates
when and how to run them.

The skill is not a user-facing integration skill. User-facing Agent UI install
or SaaS integration skills belong under `skills/`.

## Upstream Source

Agent UI vendors the upstream source as a git submodule at `third_party/codex`.
That submodule is the only schema source used by the maintenance commands. The
submodule must contain:

- `codex-rs/app-server`
- `codex-rs/app-server-protocol`

The checked-in submodule pointer should match
`packages/codex/src/protocol.ts` `CODEX_PROTOCOL_COMMIT`. Update PRs move the
submodule pointer and generated schema together.

## Local Commands

Inspect upstream and current metadata:

```sh
bun run codex:upstream:info
```

Compare generated method surfaces without changing this repository:

```sh
bun run codex:upstream:drift
```

The drift command compares checked-in generated schema against
`third_party/codex` `origin/main` through a temporary git worktree. It does not
move the checked-in submodule pointer.

Prepare a draft PR when drift exists:

```sh
bun run codex:upstream:prepare -- --push --pr --draft
```

The prepare command creates a branch, imports schema through
`packages/codex/scripts/import-schema.ts`, advances `third_party/codex` to the
configured upstream branch, runs focused validation, commits the submodule
pointer and generated schema metadata, optionally pushes, and optionally opens a
draft PR. Validation failures are reported in the PR body so an agent can make
follow-up semantic commits on the same branch.

## Classification Gate

`bun run test:protocol` fails if a generated method has not been explicitly
classified.

Stable client methods must be one of:

- Productized in `stableProductizedMethods`.
- Host-only in `hostOnlyMethods`.

Experimental-only client methods must be one of:

- Available in `experimentalAvailableMethods`.
- Unsupported in `experimentalUnsupportedMethods`.
- Test-only in the internal test-only list.

After a schema import, update `docs/reference/codex-protocol.md` to match these
decisions.

## Codex Automation Setup

Use the prompt in
`.agents/skills/codex-upstream-sync/references/codex-automation-prompt.md` for a
weekly or manual Codex Automation. The automation should:

- Run the drift check.
- Open a draft PR only when drift exists.
- Make follow-up commits if semantic fixes are clear.
- Never merge the PR.
- Never publish npm packages.
- Never edit files inside the upstream Codex submodule.

Recommended automation configuration:

- Title: `Codex App Server Upstream Sync`
- Repository: `nyosegawa/agent-ui`
- Base branch: `main`
- Schedule: every Sunday at 09:00 Japan time
- Cron equivalent: `0 0 * * 0` UTC
- Prompt source:
  `.agents/skills/codex-upstream-sync/references/codex-automation-prompt.md`
- Expected result: report only when there is no drift, or open a draft PR when
  upstream schema drift exists

GitHub Actions remain the validation layer for the PR. The automation is an
agent workflow, not a replacement for review.

## Completion Checklist

Before merging a Codex upstream sync PR:

- `bun run test:protocol`
- `bun run typecheck`
- `bun run lint`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- Relevant fixture or real local Playwright suites when visible behavior
  changes

Also verify that generated metadata is consistent across
`packages/codex/src/protocol.ts`, `packages/codex/package.json`, and
`packages/codex/src/generated/README.md`, and that the `third_party/codex`
submodule pointer matches `CODEX_PROTOCOL_COMMIT`.
