## /goal command

Implement the Agent UI architecture redesign.

## source artifact paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-29-agent-ui-architecture-redesign/research.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-29-agent-ui-architecture-redesign/plan.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/.agent-work/features/2026-06-29-agent-ui-architecture-redesign/todo.md

## repo guidance paths

- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/AGENTS.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/product-boundary.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/architecture/testing.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/reference/package-exports.md
- /Users/sakasegawa/src/github.com/nyosegawa/agent-ui/docs/reference/server-bridge.md

## branch and planning commit

Continue on branch `codex/agent-ui-architecture-redesign-plan`. Planning commit: committed; final amended hash is reported by the planning run.

## freshness policy and freshness result

Freshness result: `refresh-needed`; targeted refresh was recorded from current product-boundary, testing, package-exports, and planning skill references. Do not redo planning unless those files changed again.

## execution rules

Work phase-first from `todo.md`. Implement one phase at a time, validate it, run 4 parallel subagent reviews, commit it, push it, and record evidence in `todo.md`. Split a phase before coding if it is too large or mixes incompatible validation. Do not use task-level commits unless the phase cannot remain coherent; record why.

## validation rules

Use focused validation per phase. Final local closeout must include `bun run validate:release` and `bun run validate:e2e`. Public API changes require API snapshots, package-resolution, docs, examples/recipes, and changeset/changelog review.

## review rules

After each phase, review for P0/P1 issues, raw leaks, host-boundary leaks, docs drift, package export drift, and browser-visible regressions. Remediate bounded issues before continuing; stop if the design premise changes.

## commit rules

Commit each coherent phase with a concise subject. Keep planning and implementation on this same branch. Do not commit generated schema or compiled output unless produced by the correct generator/build flow and intended for the repo.

## push rules

Push each completed phase commit to `origin` after validation and review. Record push evidence in `todo.md`.

## PR rules

Open/update one large PR. PR evidence must include public surface -> source -> API snapshot -> docs -> example -> test -> changeset mapping.

## CI follow-through rules

Follow GitHub Actions to concrete success/failure. Required CI success cannot be inferred from local validation alone.

## evidence rules

Record implementation, validation, review, commit, push, PR, and CI evidence in `todo.md`. Keep docs generic and do not mention downstream apps.

## repo-specific forbidden edits

Do not edit `third_party/codex` directly. Do not hand-edit `packages/codex/src/generated/**`, `dist`, `.next`, or generated declarations. Do not move host auth, persistence, process lifecycle, upload storage, workspace/tenant isolation, audit, billing, deployment, or product workflow ownership into Agent UI.

## repo-specific checks

Read current source before editing public surfaces. Use Bun. Preserve `validate:packages` ordering: fresh build, packlist, Node compatibility, `publint`, `attw`.

## stop conditions

Stop for unresolved protocol classification, required upstream schema drift, unsafe host-policy ownership, package validation failure caused by design mismatch, or loss of phase reviewability.

## escalation conditions

Escalate if upstream sync is needed, credentials/network block push/PR/CI checks, or a public API decision cannot be resolved from repo policy and the plan.
