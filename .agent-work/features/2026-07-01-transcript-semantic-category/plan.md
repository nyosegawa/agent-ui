# Plan

## Summary

Redesign the public transcript display contract around semantic categories and a single display policy API. This is a deliberate breaking cleanup, not an additive MVP. The implementation should remove `dataKind` and block-kind density as host-facing display policy surfaces, replace them with category-driven view-model metadata, and update React, Web Components, docs, examples, public skill guidance, tests, API snapshots, and release notes together.

## Background

Hosts currently need to inspect `block.kind`, `item.kind`, or `dataKind` to decide whether transcript entries are reasoning, tools, commands, plans, file changes, or messages. That is unstable because `dataKind` is a mixed display identity derived from stored block kind, synthesized block kind, raw item kind, and stream fallback. The user explicitly waived backward compatibility and asked to avoid ad hoc or MVP implementation, so the plan treats this as a first-principles public API redesign.

## Current State

- `AgentTranscriptEntry.dataKind` is public and drives labels and DOM `data-kind`.
- `AgentTranscriptDensity` is a narrow density concept with `byBlockKind` overrides and `critical-only` filtering.
- `block.kind` is needed for `components.blocks` renderer dispatch, but it is also the only practical public policy key.
- `AgentMessageList` and `useAgentTranscriptController` accept `density`; `AgentChat`, `AgentThreadView`, Web Components, and public docs do not expose a coherent preset-level transcript display policy.
- Existing examples and tests focus on `AgentMessageList density={{ byBlockKind }}` and old `data-kind` behavior.

## Goals

- Define a durable public transcript category taxonomy that is coarser than renderer block kinds.
- Replace `AgentTranscriptEntry.dataKind` with `category` / `semanticCategory` plus display-label metadata.
- Replace `AgentTranscriptDensity` with one coherent `transcriptDisplay` policy across `useAgentTranscriptController`, `AgentMessageList`, `AgentThreadTimeline`, `AgentThreadView`, `AgentChat`, and Web Components.
- Move `critical-only` out of density and into explicit safety override behavior for failed, in-progress, and approval-anchored entries.
- Keep `block.kind` for renderer dispatch only; do not present it as the display policy axis.
- Update DOM attributes from display identity based on raw/mixed kind to semantic category, with tests and Playwright selectors migrated intentionally.
- Update all public docs, package READMEs, examples, public Agent UI skill, skill tests, API snapshots, and changeset as part of the redesign.
- Add phase-by-phase 4-lane parallel review before every implementation commit.

## Non-Goals

- Do not preserve `dataKind` as a public host contract.
- Do not keep `byBlockKind` as the preferred public display policy API.
- Do not ship a partial compatibility shim as the main outcome.
- Do not add host preference persistence, route state, user settings storage, or workflow state.
- Do not make `components.blocks` category-keyed; it remains renderer dispatch by block kind.
- Do not regroup transcript items or move approval placement.
- Do not edit vendored Codex, generated schema, or dist output by hand.

## Repo-Specific Constraints

- Agent UI is a reusable Codex App Server UI component library, not a hosted runtime.
- Host applications own auth, persistence, routing, process lifecycle, deployment, billing, workspace isolation, upload storage, and workflow state.
- Use Bun for repository package operations.
- Do not edit the vendored Codex submodule directly.
- Do not hand-edit auto-created schema files or compiled artifacts.
- Keep public package exports, docs, examples, skills, tests, snapshots, and changesets aligned for a breaking npm-facing API change.

## Design Decisions

- Rename the feature concept to "transcript display contract redesign".
- Public category taxonomy should be semantic and coarse:

```ts
type AgentTranscriptCategory =
  | "message"
  | "reasoning"
  | "plan"
  | "command"
  | "fileChange"
  | "toolActivity"
  | "web"
  | "media"
  | "system"
  | "unknown";
```

- Keep `role` for user/assistant/system/tool/command distinctions within `message` and other categories. Do not encode `userMessage` / `assistantMessage` as categories.
- Prefer `reasoning` as the semantic category name even though current renderer block kind is `thinking`; docs can explain that reasoning/thinking logs normalize to this category.
- Add a public label/display field such as `displayLabel` or `labelKey` so labels no longer depend on `dataKind`.
- Remove `AgentTranscriptEntry.dataKind` from public view models and migrate internal rendering/tests away from it.
- Keep `AgentTranscriptBlock.kind` and `components.blocks` for rendering-specific overrides, not display policy.
- Replace `AgentTranscriptDensity` with a unified display policy. Candidate shape:

```ts
type AgentTranscriptDisplayDensity = "comfortable" | "compact" | "expanded";
type AgentTranscriptDisplayVisibility = "visible" | "collapsed" | "hidden";

interface AgentTranscriptDisplayRule {
  density?: AgentTranscriptDisplayDensity;
  visibility?: AgentTranscriptDisplayVisibility;
}

interface AgentTranscriptDisplayPolicy {
  default?: AgentTranscriptDisplayRule;
  byCategory?: Partial<Record<AgentTranscriptCategory, AgentTranscriptDisplayRule>>;
  byRole?: Partial<Record<AgentTranscriptEntry["role"], AgentTranscriptDisplayRule>>;
}
```

- Use a single prop name, `transcriptDisplay`, across the controller, primitives, preset, thread components, and Web Components.
- Safety overrides are mandatory: failed, in-progress, and approval-anchored entries must remain reachable even when a policy says `hidden`.
- Add a major changeset.
- `answer-focused` is an explicit public preset shortcut layered on the same `transcriptDisplay` policy contract, not hidden host state. P004 must document it as an optional display-only library preset with safety overrides.

## Impacted Areas

- Packages: `packages/react` is Agent UI-owned, public API, release-sensitive. `packages/web-components` is release-sensitive and must expose the same preset display policy intentionally.
- Examples: `examples/local-react-vite` must prove primitive, thread, and preset display policy behavior. `examples/recipes` must include category-aware density and semantic-category render wrapping.
- Docs: `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/package-exports.md`, `docs/guides/react.md`, `docs/guides/host-integration.md`, `docs/guides/theming.md`, `docs/getting-started.md`, `docs/guides/first-host-app.md`, `docs/examples/local-react-vite.md`, `docs/guides/web-components.md`, `docs/examples/recipes.md`, `packages/react/README.md`, `packages/web-components/README.md`.
- Tests: `packages/react/test/components.vitest.tsx`, `packages/react/test/source-structure.vitest.ts`, `packages/web-components/test/web-components.test.tsx`, `examples/local-react-vite/e2e/transcript-density.e2e.ts`, `test/public-showcase-catalog.test.ts`, `test/agent-ui-skill.test.ts`, API snapshots.
- Workflows/scripts: no workflow script changes planned; validation uses existing scripts.
- Skills: `skills/agent-ui/SKILL.md` and `skills/agent-ui/references/layout-composition.md` must tell hosts to use `transcriptDisplay` and categories for display policy, and `renderItem` / `components.blocks` for rendering.
- Protected surfaces: `third_party/codex`, generated Codex schema, and package `dist` are protected; API snapshots are generator-managed.

## Validation Plan

- P001/P002 focused React: `bun run test -- packages/react/test/components.vitest.tsx`, `bun run typecheck`.
- P003 display policy and wrappers: `bun run test -- packages/react/test/components.vitest.tsx packages/web-components/test/web-components.test.tsx`, `bun run test:styles`, `bun run validate:fast`.
- P004 docs/examples/skill: `bun run --cwd examples/recipes typecheck`, `bun run --cwd examples/local-react-vite typecheck`, `bun run --cwd examples/local-react-vite build`, `bun run test:skills`, `bun run test:api-snapshots:update`, manual declaration diff review, `bun run test:api-snapshots`, `bun run test:package-resolution`.
- Browser: update and run the transcript density fixture; run broader `bun run validate:e2e` in final validation.
- Final release gate: `bun run validate:release` and `bun run validate:e2e`.
- CI follow-through: push branch, open PR, inspect GitHub Actions, and follow checks to concrete success/failure.

## Commit, PR, And CI Plan

- Branch: `codex/transcript-semantic-category-plan`
- Phase commit policy: one implementation commit per completed phase after focused validation and 4-lane review.
- Task-level fallback policy: use task-level commits only if a phase becomes too large or validation isolates an unsafe public API risk; record reason in `todo.md`.
- Required phase reviews:
  1. API/export/snapshot reviewer.
  2. Transcript behavior reviewer.
  3. Web/browser/examples reviewer.
  4. Release/product-boundary reviewer.
- PR title/body expectations: mention breaking transcript display contract, category taxonomy, unified `transcriptDisplay`, docs/examples/skill updates, major changeset, validation, and migration impact.
- Required checks: Repository policy, Typecheck, Lint, Unit tests, Protocol and fixtures, Package validation, API snapshots, Package resolution, Playwright fixtures, Real local smoke as CI path filters require.
- CI follow-through: watch Actions to success/failure; fix in-scope failures with focused validation, commit, push, and continue watching.

## Risks

- Category naming is durable public API; names must avoid mirroring transient block kinds too closely.
- Removing `dataKind` and `byBlockKind` is breaking; migration docs and release notes must be explicit.
- DOM selector migration can break e2e/style tests if not done in one coordinated phase.
- Visibility policies can accidentally hide approvals or failed/running content; approval safety is a phase gate.
- Web Components could drift from React preset behavior unless included as mandatory scope.
- Full release and e2e gates may be slow but are required for this public API redesign.

## Completion Criteria

- Public transcript entries expose semantic category and display label metadata without `dataKind` as display identity.
- Unified `transcriptDisplay` policy replaces density/byBlockKind as the host-facing display policy API across React and Web Components.
- Renderer dispatch by `components.blocks` still works by block kind, clearly separated from display policy.
- Failed, in-progress, and approval-anchored entries remain reachable, anchored, jumpable, and visible/collapsed according to safety rules.
- DOM attributes, tests, Playwright selectors, examples, docs, package READMEs, public skill guidance, and skill tests use the new contract.
- API snapshots are updated after manual declaration diff review.
- Major changeset is present.
- Each phase has validation evidence and 4-lane review evidence in `todo.md`.
- `bun run validate:release` and `bun run validate:e2e` pass before PR readiness is claimed.

## Open Questions

- Final field names: `category` versus `semanticCategory`; assumption: prefer `category` only if docs make clear it is transcript-display category, otherwise use `semanticCategory`.
- Final display policy prop name: assumption is `transcriptDisplay`.
- Final label field: `displayLabel` string versus i18n label key. Implementation should choose the one consistent with existing i18n renderer patterns.
