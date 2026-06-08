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
- Freshness Check
- Investigation Method
- Subagent Rounds
- Sources Inspected
- Findings
- Repo Guidance Findings
- Architecture / Boundary Findings
- Validation / CI Findings
- Existing Skill / Command Findings
- Web / Current-State Findings
- Freshness / Staleness Findings
- Generated / Vendored / Protected File Findings
- Risks
- Decisions
- Rejected Approaches
- Remaining Unknowns

Research must cite repo paths inspected. If subagents are unavailable, record
that the same lanes were researched sequentially by the main agent. When
external or time-sensitive facts affect the plan, research must cite web/current
sources or record why live research was intentionally skipped.
Every planning run must record the freshness check result before research
findings are finalized.
Research must also record the branch decision, whether the branch was created
or reused, and any blocker that prevents a safe planning commit or push.

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
- Branch And Planning Commit
- Phase Checklist
- Task Checklist By Phase
- Implementation Notes
- Validation Evidence
- Review Evidence
- Commit Log
- Final Checklist

`Branch And Planning Commit` must include these fields:

```md
- Branch:
- Planning commit:
- Remote:
- Push result:
- Blockers:
```

Every phase must use this shape:

```md
- [ ] P001 <phase title>
  - Goal:
  - Scope:
  - Expected files/areas:
  - Validation:
  - Review:
  - Commit:
  - Push:
  - PR/CI:
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 <task title>
      - Expected files/areas:
      - Validation note:
    - [ ] T002 <task title>
      - Expected files/areas:
      - Validation note:
```

Phases are the standard unit for implementation, validation, review, commit,
push, PR, and CI follow-through. Tasks are checklists within phases. Split a
phase before implementation if it is too large, mixes unrelated
responsibilities, has incompatible validation methods, cannot be reviewed
meaningfully, cannot be committed or reverted coherently, or carries public API,
migration, security, or data-loss risk that needs isolation.

Task-level execution, review, or commit is a fallback only. If used, `todo.md`
must record why the phase could not remain the execution unit.

## `goal-prompt.md`

Required sections:

- `/goal` command
- source artifact paths
- repo guidance paths
- branch and planning commit
- freshness policy and freshness result
- execution rules
- validation rules
- review rules
- commit rules
- push rules
- PR rules
- CI follow-through rules
- evidence rules
- repo-specific forbidden edits
- repo-specific checks
- stop conditions
- escalation conditions

The prompt must include absolute paths to `research.md`, `plan.md`, and
`todo.md`, the planning branch name, planning commit status or hash,
repo-specific forbidden edits, required checks, freshness result, and
phase-first execution rules. It must tell `/goal` to continue implementation on
the same branch used for planning and to rely on `research.md`, `plan.md`, and
`todo.md` instead of duplicating their long contents.

`goal-prompt.md` must be 4000 characters or fewer. Count characters, not bytes.
