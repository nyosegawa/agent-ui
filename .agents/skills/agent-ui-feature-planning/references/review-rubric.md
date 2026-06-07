# Planning Review Rubric

Use this rubric before declaring a planning package ready.

## Required Checks

- The artifact directory is exactly `.agent-work/features/<date>-<slug>/`.
- `research.md`, `plan.md`, `todo.md`, and `goal-prompt.md` all exist.
- The freshness check result is recorded in `research.md`.
- Research cites actual repo files inspected, not only memory or filenames.
- Web/current research is present when external or time-sensitive facts affect
  the plan, or the skip reason is explicit.
- Open questions are either material blockers or explicitly documented
  assumptions.
- The plan classifies Agent UI-owned behavior versus host-owned behavior.
- Public API changes include package exports, docs, examples, tests, API
  snapshots or package resolution, and release impact.
- Protocol changes include stable/experimental/host-only classification and
  forbid direct vendored Codex edits outside upstream sync.
- Browser-visible changes include Playwright and/or `agent-browser` evidence.
- Protected file handling is explicit.
- `todo.md` is phase-first: each phase has goal, scope, files/areas,
  validation, review, commit, push, PR/CI, evidence, and included tasks.
- Each phase is small enough to implement, validate, review, and commit as one
  unit, or `todo.md` records why task-level fallback is required.
- `goal-prompt.md` includes absolute artifact paths, freshness result,
  one-phase-per-iteration,
  validation-before-completion, independent review, bounded remediation, commit,
  push, PR, CI, evidence, stop, and escalation rules.

## Reject The Package If

- It plans implementation work in the current task.
- It creates root-level aliases without explicit user request.
- It moves host runtime ownership into Agent UI core.
- It treats examples as product policy without naming the public package
  boundary.
- It relies on machine-produced artifacts or vendored upstream edits as
  hand-edit targets.
- It omits validation for the changed surface.
- It relies on current external facts without web/current research or an
  explicit skip reason.
- It has vague phases or tasks such as "finish integration" or "update docs"
  without evidence and expected files.
- It says CI will be watched but does not define concrete success/failure
  recording.
- It hides a known unresolved decision as a task instead of recording an open
  question or escalation condition.
