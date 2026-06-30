---
name: agent-ui-feature-planning
description: Plan Agent UI repository features before implementation. Use when the user asks to make a feature plan, plan before coding, research/plan/todo/goal prompt, solve a problem group, architecture plan, 実装前に計画, feature planning, PLAN/TODO作成, or goal-prompt generation for this repo. Do not use for small direct edits, review-only requests, npm release operations, upstream sync, browser QA, or external host-app integration unless the user explicitly asks for a planning package.
---

# Agent UI Feature Planning

Use this skill to create a repo-specific planning package before implementation.
Do not implement the feature. Produce artifacts only under:

```text
.agent-work/features/<date>-<slug>/
  research.md
  plan.md
  todo.md
  goal-prompt.md
```

Do not create root-level aliases unless the user explicitly asks.

## First Pass

1. Read [freshness policy](references/freshness-policy.md), then read
   `references/freshness-manifest.json`.
2. Run `node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs`
   from the repo root when script execution is available. If watched inputs
   changed, do targeted refresh before planning; do full refresh only for
   structural repo, CI, build, or agent-guidance changes, or when the user asks.
   Record the result in `research.md`.
3. Read [artifact contract](references/artifact-contract.md) and
   [review rubric](references/review-rubric.md).
4. Read [repo research summary](references/repo-research-summary.md), then
   inspect the current repo files it references before finalizing the plan.
5. Choose a concise slug from the user's requested feature or problem group.
6. Create or switch to the single branch that will carry both planning and
   implementation before writing artifacts.
7. Create the canonical artifact directory with today's date:
   `.agent-work/features/<YYYY-MM-DD>-<slug>/`.
8. Copy or adapt templates from `assets/` into that directory.

## Workflow

1. **Freshness Check**: compare the current repo state against
   `references/freshness-manifest.json`. Reuse current repo guidance when
   unchanged; targeted-refresh changed watched inputs; full-refresh only for
   structural drift. Record freshness evidence in `research.md`.
2. **Branch Setup**: use one branch for both planning and implementation.
   Do not create a separate planning-only branch. If the user provides a
   branch name, use it exactly. Otherwise derive a concise branch from the
   feature slug, following repo branch conventions discovered in guidance.
   Create or switch to the branch before writing planning artifacts. Verify the
   worktree does not contain unrelated changes that would make safe planning
   commits impossible. Record the branch decision and blockers in working notes,
   then write them into `research.md` and `todo.md`.
3. **Specify**: extract what the user wants, why, affected users/systems,
   success criteria, non-goals, completion criteria, and expected evidence.
4. **Clarify**: ask only questions that materially affect planning. If the user
   asks for autonomous planning, write conservative assumptions in `plan.md`.
5. **Research**: inspect relevant implementation, tests, examples, docs,
   workflows, package exports, protected surfaces, and skills. Use subagents
   when available for independent lanes; otherwise run the lanes sequentially
   and record that subagents were unavailable. Use web/current research when
   the plan depends on external or time-sensitive facts such as current OpenAI
   Codex behavior, package registry state, GitHub Actions state, dependency
   versions, browser/tooling behavior, or external API/spec changes.
   For new-adopter onboarding, public API, package README, or host-integration
   changes, include the public Agent UI skill under `skills/agent-ui`, package
   README files, `docs/guides/first-host-app.md`, `docs/examples/recipes.md`,
   and `examples/recipes` in the inspection surface.
6. **Plan**: write `plan.md` with Agent UI ownership, design decisions,
   impacted areas, validation, commit/PR/CI, risks, and open questions.
7. **Tasks**: write `todo.md` phase-first. Phases are the default unit for
   implementation, validation, review, commit, push, PR, and CI follow-through;
   tasks are checklists inside phases. Use task-level execution only as a
   documented fallback when a phase is too large or unsafe to review/commit.
   Include the `Branch And Planning Commit` section with branch, planning
   commit, remote, push result, and blockers fields.
8. **Analyze**: review `research.md`, `plan.md`, and `todo.md` for
   contradictions, unsupported assumptions, missing validation, repo rule
   violations, oversized phases, hidden follow-ups, and vague completion.
9. **Goal Prompt**: write `goal-prompt.md` as a copy-paste-ready Codex `/goal`
   prompt with absolute artifact paths, freshness result, and phase-first
   execution protocol. Keep it at or below 4000 characters. It must instruct
   implementation to continue on the same branch used for planning.
10. **Validate Artifacts**: run
    `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs <artifact-dir>`
    only after `goal-prompt.md` exists. This is a deterministic shape checker,
    not a prose-quality review. After validation passes, commit the planning
    package with one concise planning commit such as `Plan <feature slug>`.
    If a remote exists and push is possible, push the branch. Record branch
    name, planning commit hash, remote, push result, and blockers in `todo.md`.
    If branch creation, commit, or push is blocked, record the exact blocker in
    `research.md` or `todo.md` and report it.

## Research Lanes

Use the prompts in `agents/` when subagents are available:

- `agents/repo-guidance-researcher.md`
- `agents/implementation-surface-researcher.md`
- `agents/validation-researcher.md`
- `agents/skill-design-reviewer.md`

Default to four parallel lanes and up to three rounds. Stop after one round
when findings are sufficient; run additional rounds only to close concrete
unknowns or review a risky planning contract.

## Boundaries

- Agent UI is a reusable Codex App Server UI component library, not a hosted
  runtime. Keep host auth, persistence, routing, process lifecycle, deployment,
  billing, workspace isolation, upload storage, and workflow state outside core.
- Do not plan direct edits inside the vendored Codex submodule except through
  upstream sync.
- Do not plan hand edits to auto-created schema files or compiled artifacts.
- Public API plans must include package exports, docs, examples, tests, API
  snapshots or package-resolution evidence, and release impact.
- New-adopter and host-integration plans must explicitly keep README/docs,
  package README files, recipes, and the public `skills/agent-ui` skill aligned
  while keeping repository-maintainer commands out of the public skill.
- Browser-visible plans must include Playwright and/or `agent-browser`
  evidence.

## Completion

Before reporting ready, confirm the four artifact files exist, the freshness
check is recorded, the analysis pass is reflected in the artifacts, the
validator passed, `todo.md` is phase-first, and the generated `goal-prompt.md`
names exact absolute paths, the planning branch, the planning commit, and
repo-specific forbidden edits/checks. Report the artifact directory, selected
branch, planning commit, remote/push result, questions asked or assumptions
made, freshness result, research lanes used, whether web/current research was
used or intentionally skipped, validation selected, artifact validation result,
and remaining risks.
