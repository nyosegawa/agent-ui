# Goal Prompt

## /goal command

/goal Implement the Agent UI compatibility-surface cleanup plan. Continue on branch codex-upstream/64bdeed9f7ad; do not create a new branch unless the user redirects.

## source artifact paths

- research: /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/.agent-work/features/2026-06-21-compatibility-surface-cleanup/research.md
- plan: /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/.agent-work/features/2026-06-21-compatibility-surface-cleanup/plan.md
- todo: /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/.agent-work/features/2026-06-21-compatibility-surface-cleanup/todo.md

## repo guidance paths

- /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/AGENTS.md
- /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/docs/architecture/product-boundary.md
- /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/docs/architecture/testing.md
- /Users/sakasegawa/.codex/worktrees/8ccc/agent-ui/docs/reference/package-exports.md

## branch and planning commit

- Branch: `codex-upstream/64bdeed9f7ad`
- Planning commit: pending in artifact; use the committed planning package on this branch.
- Same-branch rule: planning and implementation share this branch.

## freshness policy and freshness result

- Read research.md Freshness Check before editing.
- Freshness result: targeted refresh needed for testing/package-export docs; current files were inspected and no full refresh was required.

## execution rules

- Read research.md, plan.md, and todo.md before edits.
- Execute one TODO phase per iteration by default: P001 approvals, P002 path boundary, P003 deprecated fallback containment, P004 release/docs/final validation.
- Update todo.md with statuses and evidence.

## validation rules

- Run phase-specific focused validation before marking a phase complete.
- Required final checks: bun run test:protocol; bun run typecheck; bun run lint; bun run test:api-snapshots; bun run test:package-resolution; bun run validate:packages.
- Update API snapshots intentionally only after reviewing public declaration changes.

## review rules

- Do a fresh-context review after each phase; use an independent reviewer/subagent if available.
- Fix findings, rerun affected validation, and record evidence in todo.md.

## commit rules

- Prefer one commit per completed phase after validation and review.
- Do not commit unrelated worktree changes.
- Add a changeset for npm-facing public API changes.

## push rules

- Push completed phase commits to origin/codex-upstream/64bdeed9f7ad.
- Record pushed commit hash or blocker in todo.md.

## PR rules

- Decide whether to keep work stacked on PR #33 or split later; record the decision.
- PR notes must include public API, protocol, docs, validation, changeset, and risks.

## CI follow-through rules

- Inspect GitHub checks to concrete pass/fail after push.
- Record skipped checks and residual risk.

## evidence rules

- Record implementation, validation, review, commit, push, PR, and CI evidence in todo.md.

## repo-specific forbidden edits

- Do not edit third_party/codex.
- Do not hand-edit packages/codex/src/generated/** or dist/**.
- Do not move host-owned auth, persistence, workspace isolation, process lifecycle, billing, or deployment policy into Agent UI core.

## repo-specific checks

- Check generated-only compatibility names stay confined to generated schema surfaces.
- Check core/react public APIs do not expose legacy approval kinds after P001.

## stop conditions

- Stop if generated schema must change; use upstream-sync instead.
- Stop if path representation requires host security policy.

## escalation conditions

- Escalate if validation cannot run, CI is blocked, or branch/PR strategy conflicts with PR #33.
