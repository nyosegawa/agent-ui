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

## branch and planning commit

- Branch: `codex-upstream/64bdeed9f7ad`
- Planning commits: use latest committed package on this branch.
- Same-branch rule: planning and implementation share this branch.

## freshness policy and freshness result

- Read research.md Freshness Check before editing.
- Freshness result: targeted refresh needed; current files inspected.

## execution rules

- Read research.md, plan.md, todo.md before edits.
- Execute one TODO phase per iteration: P001 approvals, P002 paths/root exports, P003 fallbacks, P004 docs/skills/examples/snapshots, P005 release/PR/CI.
- Preserve generated schema and generated stable-types as explicit exceptions; clean preferred product APIs only.
- Update todo.md with statuses and evidence.

## validation rules

- Run phase-specific focused validation before marking a phase complete.
- Required final checks: bun run test:protocol; bun run typecheck; bun run lint; bun run build; bun run test:api-snapshots; bun run test:package-resolution; bun run validate:packages; bun run validate:release.
- Run bun run test:skills for public skill changes; bun run test:repo-skills only for maintainer skill changes.
- Typecheck/build touched examples; run Playwright only for approval/local-media visible behavior.
- Update API snapshots only after reviewing declaration changes.
- Run todo.md rg sweeps and record generated exceptions.

## review rules

- Review after each phase; use subagent if available.
- Fix findings, rerun affected validation, record evidence.

## commit rules

- Prefer one commit per completed phase.
- Do not commit unrelated worktree changes.
- Add changeset: pre-1.0 fixed-version minor unless explicit 1.0/major decision.

## push rules

- Push completed phase commits to origin/codex-upstream/64bdeed9f7ad.
- Record commit hash or blocker.

## PR rules

- Keep PR #33 per same-branch request; retitle/rewrite from schema-only to schema refresh plus compatibility cleanup before review.
- PR notes: API, protocol, docs, skills, examples, validation, changeset, risks.

## CI follow-through rules

- Inspect GitHub checks to concrete pass/fail; record skipped checks and residual risk.

## evidence rules

- Record implementation, validation, review, commit, push, PR, CI in todo.md.

## repo-specific forbidden edits

- Do not edit third_party/codex.
- Do not hand-edit packages/codex/src/generated/** or dist/**.
- Do not move host auth, persistence, isolation, lifecycle, billing, deployment into core.

## repo-specific checks

- Core/react public APIs expose no legacy approval kinds after P001.
- Request-builders hide generated path names; clients/session may be generated-backed only if documented.
- Public skills/docs/examples must not advertise legacy names or path URI terminology for local paths.

## stop conditions

- Stop if generated schema must change; use upstream-sync instead.
- Stop if path representation requires host security policy.

## escalation conditions

- Escalate if validation cannot run, CI is blocked, or same-branch PR strategy conflicts with PR #33.
