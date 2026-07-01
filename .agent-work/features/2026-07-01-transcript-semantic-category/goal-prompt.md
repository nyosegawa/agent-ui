# Goal Prompt

## /goal command

/goal Implement the Agent UI breaking transcript display contract redesign. Continue on the planning branch; do not create a new branch.

## source artifact paths

Research: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-07-01-transcript-semantic-category/research.md
Plan: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-07-01-transcript-semantic-category/plan.md
Todo: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-07-01-transcript-semantic-category/todo.md

## repo guidance paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/AGENTS.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/product-boundary.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/testing.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/maintenance/ci-cd.md

## branch and planning commit

- Branch: `codex/transcript-semantic-category-plan`
- Planning commit: pending; read todo.md.
- Same-branch rule: continue implementation on this branch.

## freshness policy and freshness result

- Read research.md Freshness Check before editing.
- If watched guidance changed after planning, stop and refresh.
- Result: refresh-needed; targeted refresh used; manifest not updated.

## execution rules

- Read research.md, plan.md, todo.md first.
- Execute phases in order: P001 contract, P002 identity, P003 transcriptDisplay, P004 docs/examples/skill/snapshots/changeset, P005 validation/PR/CI.
- Update todo.md with status, evidence, blockers, commits, push, PR, CI.

## validation rules

- Run phase validation before review.
- Final gates: bun run validate:release and bun run validate:e2e.
- Review API snapshot declaration diffs before bun run test:api-snapshots.

## review rules

- After each phase validation, run 4 parallel reviews: API/export/snapshot, transcript behavior, web/browser/examples, release/product-boundary.
- Fix findings, rerun focused validation, rereview before commit.

## commit rules

- One commit per completed phase after validation and review.
- Do not commit unrelated worktree changes.
- Add a major changeset.

## push rules

- Push phase commits to the same branch when possible.
- Record remote, hash, result, or blocker in todo.md.

## PR rules

- After phases and final validation, open PR with migration notes, validation, review, release/UI/protocol/docs/security impact, risks, skipped checks.

## CI follow-through rules

- Watch GitHub Actions to success/failure. Fix in-scope failures and continue watching.

## evidence rules

- Record implementation, validation, 4-lane review, commit, push, PR, CI, skipped checks in todo.md.

## repo-specific forbidden edits

- No vendored Codex edits except upstream sync.
- No hand edits to generated schema or dist output.
- Do not keep dataKind, density, or byBlockKind shims as the main outcome.
- Do not rekey components.blocks; block kind remains renderer dispatch.
- Do not move host runtime ownership into Agent UI core.

## repo-specific checks

- Use Bun.
- Replace display identity with category/label metadata.
- Derive categories from normalized block/role state, not raw protocol item kinds.
- Use one transcriptDisplay policy across controller, primitives, preset, thread components, and Web Components.
- Preserve approval anchors and safety overrides.

## stop conditions

- Phases are complete/deferred, plan.md criteria are met, and evidence is recorded.

## escalation conditions

- Requirements conflict, names remain unresolved, forbidden edits are required, validation cannot run, or branch/remote blocks commits/PR.
