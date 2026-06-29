---
name: agent-ui-review
description: Review Agent UI repository changes, pull requests, branches, diffs, or Codex-generated updates for correctness, product boundary, protocol behavior, server bridge safety, package exports, tests, docs, UI regressions, and release risk. Use when the user asks for review, PR review, branch review, diff audit, safety check, or whether Agent UI changes are ready to merge.
---

# Agent UI Review

Use this skill for repository-specific code review. Focus on bugs, regressions,
public API drift, product-boundary issues, missing validation, and release risk.

## First Pass

1. Identify the change type: protocol, core state, React UI, server bridge,
   styles, examples, docs, packages, skills, hooks, or CI.
2. Read the relevant source, tests, examples, and docs before judging the diff.
3. Use [review rubric](references/review-rubric.md) for findings and output
   format.
4. Use [product boundary](references/product-boundary.md) when a change affects
   package responsibilities, host ownership, bridge behavior, or examples.
5. Use [validation review](references/validation-review.md) to check whether
   tests and commands match the blast radius.

## Review Output

- Lead with findings, ordered by severity.
- Cite concrete files and symbols.
- Prioritize correctness, security, API compatibility, UI regressions, test gaps,
  docs drift, and release risk.
- For new-adopter, host-integration, public API, or package README changes,
  check alignment across README/docs, package README files, `docs/examples/recipes.md`,
  `examples/recipes`, and the public `skills/agent-ui` skill. Flag public skill
  leakage if repo-maintainer commands or CI gates appear in external-host
  guidance.
- Keep summaries brief and secondary.
- If there are no findings, say that clearly and note any residual test gaps.

## Boundaries

Review the repository as a reusable Codex App Server UI component library. The
public packages should expose composable primitives, hooks, adapters, transports,
server bridge helpers, and documented extension points. Host applications own
product workflows, routing, persistence, process lifecycle, deployment,
credentials, resource policy, and app-specific orchestration.
