# Goal Prompt

## /goal command

/goal Implement the Agent UI new-adopter onboarding plan from these artifacts. Continue on the same branch used for planning; do not create a new implementation branch. Backward compatibility is not required.

## source artifact paths

- research: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-30-new-adopter-onboarding/research.md
- plan: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-30-new-adopter-onboarding/plan.md
- todo: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-30-new-adopter-onboarding/todo.md

## repo guidance paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/AGENTS.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/product-boundary.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/testing.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/maintenance/ci-cd.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/maintenance/repository-skills.md
- /Users/sakasegawa/.agents/agent-skill-best-practices.md

## branch and planning commit

- Branch: codex/new-adopter-onboarding-plan
- Planning commit: pending
- Same-branch rule: continue on codex/new-adopter-onboarding-plan.

## freshness policy and freshness result

- Read research.md Freshness Check before editing.
- If watched guidance changed after planning, stop and refresh the plan.
- Freshness result: targeted refresh was required and performed from current files at de40a498107428b4f1741394a1202146d21922e0.

## execution rules

- Read research.md, plan.md, and todo.md first.
- Execute one TODO phase per iteration.
- Split large or unsafe phases before editing.
- Update todo.md with status, evidence, blockers, commits, pushes, PR, and CI.
- Keep host runtime policy outside Agent UI core.

## validation rules

- Run phase-specific validation before marking a phase complete.
- Public skill: bun run test:skills.
- Repo skill: bun run test:repo-skills.
- Package/API/export: API snapshots, package resolution, package validation.
- Bridge/upload/controller: focused unit tests plus relevant real-local/e2e.

## review rules

- After validation, perform independent or fresh-context review.
- Fix findings, rerun validation, and rereview.

## commit rules

- Prefer one commit per completed phase.
- Do not commit unrelated worktree changes.
- Record commit hashes in todo.md.

## push rules

- Push completed phase commits when remote push is possible.
- Record push result or blocker in todo.md.

## PR rules

- After final validation, create a PR with summary, validation, review evidence, risks, skipped checks, and release/UI/protocol/docs/security impact.

## CI follow-through rules

- Watch GitHub Actions to concrete success/failure. Fix in-scope failures, commit, push, and continue watching.

## evidence rules

- Record implementation, validation, review, commit, push, PR, CI, and skipped-check evidence in todo.md.

## repo-specific forbidden edits

- Do not edit vendored Codex except through upstream sync.
- Do not hand-edit generated schema, dist, or API snapshots; regenerate via scripts.
- Do not expose secrets, local tokens, .npmrc, or unredacted diagnostics.

## repo-specific checks

- Use Bun for repo package operations.
- Select gates from docs/architecture/testing.md.
- Use bun run validate:packages for package output.
- Browser-visible changes need Playwright evidence.

## stop conditions

- All planned phases are complete or explicitly deferred.
- Completion criteria in plan.md are satisfied.
- Required evidence is recorded or blocked with exact reason.

## escalation conditions

- Stop and ask if requirements conflict, public-interface tradeoffs are unresolved, required services are unavailable, repo guidance conflicts, forbidden edits are required, or branch/worktree state blocks commits.
