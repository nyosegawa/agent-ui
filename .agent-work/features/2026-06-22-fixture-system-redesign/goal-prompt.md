## /goal command

Implement the Agent UI fixture system redesign.

## source artifact paths

Read and follow:

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-22-fixture-system-redesign/research.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-22-fixture-system-redesign/plan.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-22-fixture-system-redesign/todo.md

## repo guidance paths

Read `AGENTS.md`, `docs/architecture/product-boundary.md`, `docs/architecture/testing.md`, `docs/maintenance/ci-cd.md`, `docs/guides/browser-verification.md`, and `/Users/sakasegawa/.agents/agent-skill-best-practices.md` before editing relevant surfaces.

## branch and planning commit

Continue implementation on the same branch: `codex/fixture-system-redesign-plan`. Planning commit: this planning artifact commit; confirm the final hash from git log before implementation.

## freshness policy and freshness result

Freshness check result was `refresh-needed`; targeted refresh was completed for testing, package exports, product boundary, and browser verification docs. Re-run freshness if the branch is stale before implementation.

## execution rules

Execute phase-first from `todo.md`. Do not do a quick patch. Finish all phases unless blocked. Update `todo.md` evidence as phases complete.

## validation rules

Use focused validation while iterating: `bun run validate:fast`, `bun run test:styles`, React vitest for component changes, local-react typecheck/build, `bun run test:e2e:fixtures`, `bun run test:repo-skills`, `bun run test:skills`, docs stale tests, and real-local e2e when component behavior affects the real Codex example. Run `bun run validate:packages`, API snapshots, and package resolution if public exports or package output change. Finish with broad validation appropriate to the diff.

## review rules

Review browser-visible behavior across desktop, wide, tablet, 700px/narrow, mobile, embedded narrow, and short viewports. Verify no overflow, submit lower-right placement, review/model/cwd compaction, menu/sheet containment, focus return, route readiness, and real primitive closeups.

## commit rules

Commit phase-first after validation. Split a phase only when it becomes too large or mixes incompatible risk, and record the reason in `todo.md`.

## push rules

Push `codex/fixture-system-redesign-plan` to `origin` after validated commits.

## PR rules

Open a PR for `main` with design summary, validation evidence, browser evidence, and docs/skills notes.

## CI follow-through rules

Inspect GitHub Actions after push/PR and report concrete success or failure. Do not claim ready without CI status.

## evidence rules

Record commands, screenshots or metrics, route/viewport matrix, and any blockers in `todo.md` and PR notes.

## repo-specific forbidden edits

Do not edit `third_party/codex/**`, generated schema, dist output, or host runtime/auth/persistence/deployment policy in core. Do not make private `.aui-*` selectors a public API.

## repo-specific checks

Preserve Agent UI as a reusable Codex App Server UI library. Keep maintainer-only fixture commands out of public `skills/agent-ui`.

## stop conditions

Stop if implementation requires protocol/schema changes, protected generated edits, or a product boundary change not covered by the plan.

## escalation conditions

Escalate if route deletion would remove a meaningful public example, if public exports must change, or if validation reveals a larger host integration contract change.
