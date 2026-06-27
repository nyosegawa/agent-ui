## /goal command

/goal Implement the composable AgentChat API plan in
`/Users/sakasegawa/src/github.com/nyosegawa/agent-ui`.

## source artifact paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-28-composable-agent-chat-api/research.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-28-composable-agent-chat-api/plan.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-28-composable-agent-chat-api/todo.md

## repo guidance paths

`AGENTS.md`, `docs/architecture/product-boundary.md`,
`docs/architecture/testing.md`, `docs/maintenance/ci-cd.md`,
`docs/reference/package-exports.md`, `docs/reference/hooks.md`,
`docs/reference/react-components.md`.

## branch and planning commit

- Branch: `codex/plan-composable-agent-chat-api`
- Planning commit: see the latest planning commit on this branch.
- Same-branch rule: continue implementation on the planning branch
  `codex/plan-composable-agent-chat-api`; do not start another branch unless
  the user explicitly redirects.

## freshness policy and freshness result

`check-freshness.mjs` returned `refresh-needed` because
`docs/architecture/product-boundary.md`, `docs/architecture/testing.md`,
`docs/reference/package-exports.md`, and related watched globs changed since
the planning baseline. Treat current checked-in files and these artifacts as
source of truth.

## execution rules

Follow `todo.md` phase-first. Implement one phase at a time, validate it, run 4
parallel subagent reviews, commit it, and push before moving on when practical.
Do not execute task-first unless a phase becomes too large to review or revert.

## validation rules

Use focused gates while iterating, then run the relevant full gates before PR:
`bun run validate:fast`, `bun run validate:protocol`,
`bun run validate:packages`, `bun run test:api-snapshots`,
`bun run test:package-resolution`, `bun run test:e2e:fixtures`. Run real-local
e2e if live bridge lifecycle behavior changes. Keep `validate:packages`
ordered.

## review rules

Run 4 parallel subagent reviews after each phase. Review for product-boundary
violations, raw protocol/state leaks, private DOM/CSS reliance,
source-structure limits, API/docs/example drift, and missing browser evidence.

## commit rules

Use concise imperative commits by phase. Add a changeset for consumer-facing
API changes; default to major if public APIs are removed or renamed.

## push rules

Push the branch after validated phase commits when practical.

## PR rules

Open or update the PR after implementation phases are ready for review. Include
summary, tests, release impact, UI impact, protocol impact, docs impact, and
security notes.

## CI follow-through rules

Watch GitHub Actions to concrete success or failure. Record validation and CI
evidence in `todo.md` or PR notes.

## evidence rules

Update `todo.md` evidence fields as phases complete.

## repo-specific forbidden edits

Do not edit `third_party/codex`, generated Codex schema, `dist`, private CSS
chunks as public API, or `.aui-*` selectors as host-facing contracts.

## repo-specific checks

Root stays preset-only; new controllers go to `/headless`; visual pieces go to
`/primitives`; external send must use a public controller, not raw transport.

## stop conditions

Stop if the design requires host auth/persistence/process ownership in Agent UI,
raw transport calls for normal host UI, generated schema edits, or unbounded
slots that expose private scroll/approval/composer internals.

## escalation conditions

Escalate if package-resolution proves duplicate React package instances, if
Codex App Server protocol behavior must change, or if a phase cannot be
validated/reviewed/committed coherently.
