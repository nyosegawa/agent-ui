## /goal command

Implement the Agent UI surface redesign from the artifacts below.

## source artifact paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-24-agent-ui-surface-redesign/research.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-24-agent-ui-surface-redesign/plan.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-24-agent-ui-surface-redesign/todo.md

## repo guidance paths

- `/Users/sakasegawa/src/github.com/nyosegawa/agent-ui/AGENTS.md`
- `/Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/product-boundary.md`
- `/Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/testing.md`

## branch and planning commit

Continue implementation on the same branch used for planning: `codex/fixture-system-redesign-plan`.
Planning commit: pending in artifacts; use the latest planning commit on this branch and record it in `todo.md`.

## freshness policy and freshness result

Freshness result: `refresh-needed`. Use live repo files as source of truth before each phase.

## execution rules

Implement one phase at a time from `todo.md`. No backwards compatibility shims. Keep Agent UI a reusable Codex App Server UI library, not a hosted runtime.

## validation rules

Run focused validation for each phase. Run API snapshots/package resolution/package validation for export changes. Browser QA must record route, desktop/mobile viewport, command/spec, manual or agent-browser interaction, hit-test/focus/overflow result, screenshot/trace path or not-captured reason, and remaining risk. Run `bun run test:repo-skills` for `.agents/skills` changes and `bun run test:skills` for public skill changes.

## review rules

After each phase implementation and focused validation, spawn four parallel subagents. Lanes: protocol/core correctness and state invariants; phase boundary, ordering, coupling, and validation completeness; React API/package exports/docs/examples; browser-visible UX, transcript-first behavior, mobile, and real-local integration. Fix P1/P2 findings in the same phase and rerun checks.

## commit rules

Commit each validated and reviewed phase. Record commit evidence in `todo.md`.

## push rules

Push each phase commit to `origin/codex/fixture-system-redesign-plan`.

## PR rules

Create or update one PR for this branch when implementation starts.

## CI follow-through rules

Follow GitHub Actions to concrete success or failure before claiming readiness.

## evidence rules

Update `todo.md` with implementation, validation, review, commit, push, PR/CI evidence for every phase.

## repo-specific forbidden edits

Do not edit `third_party/codex/**`. Do not hand-edit `packages/codex/src/generated/**`.

## repo-specific checks

Use Bun. Required final gates include `bun run validate:fast`, `bun run validate:packages`, `bun run validate:release`, `bun run test:e2e:fixtures`, `bun run test:repo-skills`, and `bun run test:skills`; add real-local e2e if touched.

## stop conditions

Stop if a phase cannot be reviewed or reverted coherently, or if implementation would require vendored Codex edits.

## escalation conditions

Escalate if Codex protocol behavior is ambiguous, validation repeatedly fails outside phase scope, or a planned boundary would move host runtime ownership into Agent UI core.
