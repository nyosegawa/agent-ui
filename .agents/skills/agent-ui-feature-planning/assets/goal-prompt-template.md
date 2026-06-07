# Goal Prompt

Use this prompt with Codex `/goal`.

```text
/goal command:
/goal Implement the Agent UI feature plan using these artifacts:

source artifact paths:
- research: <absolute-path-to-research.md>
- plan: <absolute-path-to-plan.md>
- todo: <absolute-path-to-todo.md>

Repository root: /Users/sakasegawa/src/github.com/nyosegawa/agent-ui
repo guidance paths:
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/AGENTS.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/product-boundary.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/testing.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/maintenance/ci-cd.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/maintenance/repository-skills.md

freshness policy and freshness result:
- Read the freshness result in research.md before implementation.
- If watched repo guidance changed after planning, stop and refresh the plan before editing.
- Freshness result: <copy the research.md Freshness Check summary>

execution rules:
- Execute exactly one TODO phase per iteration by default.
- Complete all tasks in the active phase before phase validation and phase review.
- Work in phase order unless plan.md justifies a dependency change.
- Split a phase before implementation if it is too large, mixes unrelated responsibilities, has incompatible validation methods, or cannot be reviewed/committed coherently.
- Use task-level execution only when the phase is not safely reviewable or committable as one unit; record the reason in todo.md.
- Update todo.md after each phase attempt with task statuses, phase evidence, and split/merge decisions.
- Append major discoveries, rejected approaches, and boundary decisions to plan.md or research.md.
- Use web/current research when external or time-sensitive facts affect implementation decisions, including current OpenAI Codex behavior, package registry state, GitHub Actions state, dependency versions, browser/tooling behavior, or external API/spec changes. Record sources or state why web/current research was skipped.

validation rules:
- Run the phase-specific validation before marking a phase complete.
- Run task-specific validation only when todo.md defines task-level validation or when a task was split out for separate execution.
- Do not claim validation passed without recording the exact command or verification method and result.
- If validation cannot run, record why and escalate if that blocks completion.

review rules:
- Spawn an independent reviewer subagent after completing a phase and running phase validation.
- The reviewer must inspect the phase diff, task statuses, repo rules, and validation evidence.
- The reviewer must not implement fixes.
- If the reviewer rejects the phase, fix the issue, rerun validation, and rerun review.
- If subagents are unavailable, perform a separate review pass with fresh context and record that subagents were unavailable.

commit rules:
- Prefer one commit per completed phase.
- Split a phase into multiple commits only when tasks are logically independent, risky, mechanically separable, or too large for useful review.
- Combine phases into one commit only when mechanically inseparable and record why.
- Commit only after phase validation and reviewer approval unless plan.md explicitly defines an intentional red-phase commit.
- Use concise imperative commit messages.
- Record the commit hash in todo.md.
- Do not commit unrelated working tree changes.

push rules:
- Push completed phase commits to the feature branch before creating or updating a PR.
- Record the branch name, remote, pushed commit hash, and push result in todo.md.
- Do not push unrelated working tree changes.
- If push is blocked by auth, remote protection, network failure, or missing upstream, record the exact blocker and escalate when it prevents PR or CI follow-through.

PR rules:
- After planned phases are complete and final validation passes, create a pull request with gh when available.
- Use the repo PR template and include implemented phases, validation evidence, review evidence, known risks, skipped checks, release impact, UI impact, protocol/upstream impact, docs impact, and security/secrets notes.

CI follow-through rules:
- Watch GitHub Actions to concrete success or failure.
- If CI fails, inspect logs, fix in-scope failures, rerun focused validation, commit, push, and continue watching.

evidence rules:
- Record implementation, validation, review, commit, push, PR, and CI evidence in todo.md.
- Record skipped validation with a reason and whether the user approved the exception.

Repo-specific forbidden edits:
- Do not edit the vendored Codex submodule except through an explicit upstream-sync workflow.
- Do not hand-edit auto-created schema files or compiled artifacts.
- Do not move host runtime ownership into Agent UI core.
- Do not expose secrets, raw tokens, local .npmrc files, or unredacted diagnostics.

Repo-specific checks:
- Use Bun for package operations.
- Select focused gates from docs/architecture/testing.md.
- Use bun run validate:packages for package output because build, publint, and attw must stay ordered.
- For browser-visible changes, run relevant Playwright tests and verify real interaction when layout, hit testing, focus, scrolling, or overflow matters.
- For public API/package boundary changes, include docs, examples, API snapshot or package-resolution evidence, and release impact.

stop conditions:
- every planned phase is complete or explicitly deferred,
- every task in completed phases is complete or explicitly skipped with a reason,
- every completion criterion in plan.md is satisfied,
- required validation has passed or an explicit user-approved exception is recorded,
- review evidence is recorded,
- commit hashes are recorded,
- push evidence is recorded when commits need to be shared or a PR will be created,
- a PR has been created when applicable,
- CI has been followed to concrete success or failure and recorded.

escalation conditions:
- requirements contradict each other,
- a public interface or architecture tradeoff cannot be resolved from the plan,
- required validation needs unavailable credentials/services/hardware,
- repo guidance conflicts in a way that affects implementation,
- proceeding would require forbidden edits,
- branch/worktree state makes safe commits impossible.
```
