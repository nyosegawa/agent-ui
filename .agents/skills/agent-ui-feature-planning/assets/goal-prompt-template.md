# Goal Prompt

Keep this goal prompt under 4000 characters. Prefer concise execution rules and
absolute artifact paths over repeating details already present in research.md,
plan.md, and todo.md.

## /goal command

/goal Implement the Agent UI feature plan from these artifacts. Continue on the
same branch used for planning; do not create a new implementation branch.

## source artifact paths

- research: <absolute-path-to-research.md>
- plan: <absolute-path-to-plan.md>
- todo: <absolute-path-to-todo.md>

## repo guidance paths

- <repo-root>/AGENTS.md
- <repo-root>/docs/architecture/product-boundary.md
- <repo-root>/docs/architecture/testing.md
- <repo-root>/docs/maintenance/ci-cd.md
- <repo-root>/docs/maintenance/repository-skills.md

## branch and planning commit

- Branch: <branch-name>
- Planning commit: <hash-or-pending-with-blocker>
- Same-branch rule: continue implementation on <branch-name>; planning and
  implementation share one branch.

## freshness policy and freshness result

- Read research.md Freshness Check before editing.
- If watched guidance changed after planning, stop and refresh the plan.
- Freshness result: <summary from research.md>

## execution rules

- Read research.md, plan.md, and todo.md for detail.
- Execute one TODO phase per iteration by default, in order unless plan.md
  justifies a dependency change.
- Split a phase before implementation if it is too large, unsafe to review, or
  cannot be committed coherently.
- Update todo.md with statuses, evidence, blockers, and branch/commit/push
  details.

## validation rules

- Run phase-specific validation before marking a phase complete.
- Record exact commands or verification methods and results in todo.md.
- If validation cannot run, record why and escalate if it blocks completion.

## review rules

- After validation, run an independent review when available; otherwise do a
  separate fresh-context review pass.
- Fix rejected findings, rerun validation, and rereview.

## commit rules

- Prefer one commit per completed phase after validation and review.
- Do not commit unrelated worktree changes.
- Record commit hashes in todo.md.

## push rules

- Push completed phase commits to the same branch before PR creation/update when
  remote push is possible.
- Record remote, pushed commit hash, push result, or exact blocker in todo.md.

## PR rules

- After planned phases and final validation pass, create a PR with summary,
  validation, review evidence, risks, skipped checks, and release/UI/protocol/
  docs/security impact.

## CI follow-through rules

- Watch GitHub Actions to concrete success or failure.
- Fix in-scope failures, rerun focused validation, commit, push, and continue
  watching.

## evidence rules

- Record implementation, validation, review, commit, push, PR, CI, and
  skipped-check evidence in todo.md.

## repo-specific forbidden edits

- Do not edit vendored Codex except through upstream sync.
- Do not hand-edit generated schema or dist output.
- Do not move host runtime ownership into Agent UI core.
- Do not expose secrets, local tokens, `.npmrc`, or unredacted diagnostics.

## repo-specific checks

- Use Bun for repo package operations.
- Select focused gates from docs/architecture/testing.md.
- Use `bun run validate:packages` for package output.
- Browser-visible changes need Playwright and real interaction evidence.

## stop conditions

- Planned phases are complete or explicitly deferred.
- Completion criteria in plan.md are satisfied.
- Required validation/review/commit/push/PR/CI evidence is recorded or blocked
  with exact reason.

## escalation conditions

- Requirements conflict, public-interface tradeoffs are unresolved, required
  services are unavailable, repo guidance conflicts, forbidden edits are
  required, or branch/worktree state blocks safe commits.
