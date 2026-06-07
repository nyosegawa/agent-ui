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

1. Read [artifact contract](references/artifact-contract.md) and
   [review rubric](references/review-rubric.md).
2. Read [repo research summary](references/repo-research-summary.md), then
   inspect the current repo files it references before finalizing the plan.
3. Choose a concise slug from the user's requested feature or problem group.
4. Create the canonical artifact directory with today's date:
   `.agent-work/features/<YYYY-MM-DD>-<slug>/`.
5. Copy or adapt templates from `assets/` into that directory.

## Workflow

1. **Specify**: extract what the user wants, why, affected users/systems,
   success criteria, non-goals, completion criteria, and expected evidence.
2. **Clarify**: ask only questions that materially affect planning. If the user
   asks for autonomous planning, write conservative assumptions in `plan.md`.
3. **Research**: inspect relevant implementation, tests, examples, docs,
   workflows, package exports, protected surfaces, and skills. Use subagents
   when available for independent lanes; otherwise run the lanes sequentially
   and record that subagents were unavailable. Use web/current research when
   the plan depends on external or time-sensitive facts such as current OpenAI
   Codex behavior, package registry state, GitHub Actions state, dependency
   versions, browser/tooling behavior, or external API/spec changes.
4. **Plan**: write `plan.md` with Agent UI ownership, design decisions,
   impacted areas, validation, commit/PR/CI, risks, and open questions.
5. **Tasks**: write `todo.md` as an executable checklist with evidence fields
   for implementation, validation, review, and commit.
6. **Analyze**: review `research.md`, `plan.md`, and `todo.md` for
   contradictions, unsupported assumptions, missing validation, repo rule
   violations, oversized tasks, hidden follow-ups, and vague completion.
7. **Goal prompt**: write `goal-prompt.md` as a copy-paste-ready Codex `/goal`
   prompt with absolute artifact paths and the execution protocol.

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
- Browser-visible plans must include Playwright and/or `agent-browser`
  evidence.

## Completion

Before reporting ready, confirm the four artifact files exist, the analysis pass
is reflected in the artifacts, and the generated `goal-prompt.md` names exact
absolute paths and repo-specific forbidden edits/checks. Report the artifact
directory, questions asked or assumptions made, research lanes used, whether
web/current research was used or intentionally skipped, validation selected, and
remaining risks.
