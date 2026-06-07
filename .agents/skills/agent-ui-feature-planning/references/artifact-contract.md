# Artifact Contract

Feature planning artifacts live only under:

```text
.agent-work/features/<date>-<slug>/
```

Required files:

- `research.md`
- `plan.md`
- `todo.md`
- `goal-prompt.md`

Do not create root-level aliases such as `PLAN.md`, `TODO.md`, or
`GOAL_PROMPT.md` unless the user explicitly asks for them.

## `research.md`

Required sections:

- Scope
- Investigation Method
- Subagent Rounds
- Sources Inspected
- Findings
- Repo Guidance Findings
- Architecture / Boundary Findings
- Validation / CI Findings
- Existing Skill / Command Findings
- Web / Current-State Findings
- Protected File Findings
- Risks
- Decisions
- Rejected Approaches
- Remaining Unknowns

Research must cite repo paths inspected. If subagents are unavailable, record
that the same lanes were researched sequentially by the main agent. When
external or time-sensitive facts affect the plan, research must cite web/current
sources or record why live research was intentionally skipped.

## `plan.md`

Required sections:

- Summary
- Background
- Current State
- Goals
- Non-Goals
- Repo-Specific Constraints
- Design Decisions
- Impacted Areas
- Validation Plan
- Commit, PR, And CI Plan
- Risks
- Completion Criteria
- Open Questions

The plan must classify each affected area as Agent UI-owned, host-owned,
protected, example-only, docs-only, or release-sensitive.

## `todo.md`

Required sections:

- Status Summary
- Task Checklist
- Implementation Notes
- Validation Evidence
- Review Evidence
- Commit Log
- Final Checklist

Every task must use this shape:

```md
- [ ] T001 <task title>
  - Scope:
  - Expected files/areas:
  - Validation:
  - Review:
  - Commit:
  - Push:
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
```

Tasks must be independently reviewable and coherent to validate. Split tasks
that mix package API changes, protocol behavior, UI layout, docs, and release
automation unless the plan records why they are mechanically inseparable.

## `goal-prompt.md`

Required sections:

- `/goal` command
- source artifact paths
- repo guidance paths
- execution rules
- validation rules
- review rules
- commit rules
- push rules
- PR rules
- CI follow-through rules
- evidence rules
- stop conditions
- escalation conditions

The prompt must include absolute paths to `research.md`, `plan.md`, and
`todo.md`, plus repo-specific forbidden edits and required checks.
