# Research

## Scope

- Feature/problem: Redesign Agent UI's public transcript display contract around semantic categories and one `transcriptDisplay` policy, without raw protocol item kind or renderer block taxonomy dependencies.
- Canonical artifact directory: `.agent-work/features/2026-07-01-transcript-semantic-category/`
- Planning date: 2026-07-01
- Requested outcome: Detailed feature plan only. Include docs, examples, public `agent-ui` skill updates, validation, and phase-by-phase 4-lane review. Avoid MVP/ad hoc implementation. Backward compatibility is not a constraint.

## Freshness Check

- Manifest path: `.agents/skills/agent-ui-feature-planning/references/freshness-manifest.json`
- Last full research commit: `499a9020c1613923ae547411ad930e0bcefb8ed9`
- Current commit: `062b87385f90433939ee0c0fe488942bc9ac4cb1`
- Watched input result: `node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs` returned `refresh-needed`.
- Refresh mode: targeted refresh.
- Files or globs refreshed: `package.json`, `docs/architecture/product-boundary.md`, `docs/architecture/testing.md`, `docs/maintenance/ci-cd.md`, `docs/maintenance/repository-skills.md`, `docs/reference/package-exports.md`, `.github/workflows/ci.yml`, `.github/workflows/compatibility.yml`, `.agents/skills/*/SKILL.md`, `.agents/skills/*/references/*.md`, `docs/architecture/*.md`, `docs/maintenance/*.md`, `docs/reference/*.md`.
- Manifest updated: no; this plan records current targeted evidence without changing skill baseline files.
- Notes: Changed watched inputs affect guidance, validation, and public API policy but do not indicate package layout, build system, CI model, generated-file, or submodule workflow replacement. Full refresh was skipped.

## Investigation Method

- Repo root: `/Users/sakasegawa/src/github.com/nyosegawa/agent-ui`
- Branch decision: created `codex/transcript-semantic-category-plan` from clean `main`; planning and implementation share this branch.
- Subagents used: eight explorer subagents across two 4-lane rounds.
- Research rounds: initial adoption audit, then breaking-design audit after the user waived compatibility and requested docs/skill/phase review coverage.
- Main-agent inspections: transcript controller, timeline rendering, preset/thread components, core item block taxonomy, Web Component wrapper, docs, tests, examples, public skill, package exports, validation scripts.
- Web/current research: skipped intentionally; this plan depends on repo-local public API, docs, tests, and normalizers in the current checkout.

## Subagent Rounds

### Round 1

- Lane: Public API/product boundary.
- Prompt/source: Product boundary, React components/hooks/package export docs, `chat.tsx`, `timeline.tsx`, `hooks/transcript.ts`.
- Findings: semantic classification is Agent UI-owned raw-free view-model metadata; broad modes must not imply persistence, regrouping, or lifecycle ownership.
- Follow-up needed: separate display policy from host workflow state.

### Round 1

- Lane: Implementation/protocol normalization.
- Prompt/source: Core item/block taxonomy, reducer tests, timeline blocks/renderers, normalizer coverage.
- Findings: raw `reasoning` currently normalizes to `thinking`; `error` and `approval` are not primary categories; categories should derive from normalized state.
- Follow-up needed: define a corrected taxonomy.

### Round 1

- Lane: Host ergonomics/docs.
- Prompt/source: Host integration docs, React/theming docs, recipes, local React Vite density route.
- Findings: current `density` is primitive-only and block-kind keyed; `AgentChat` and `AgentThreadView` lack preset-level control.
- Follow-up needed: expose a coherent policy through preset/thread surfaces.

### Round 1

- Lane: Risk/release.
- Prompt/source: public tests, source-structure tests, Web Component wrapper, testing and CI docs.
- Findings: replacing `dataKind`, `data-kind`, or `byBlockKind` is breaking and needs major release discipline.
- Follow-up needed: treat this as breaking if compatibility is waived.

### Round 2

- Lane: First-principles breaking API design.
- Prompt/source: Current plan artifacts and transcript APIs.
- Findings: additive plan conflicted with waived compatibility. Replace `dataKind` as host-facing identity, use one `transcriptDisplay` API everywhere, move `critical-only` out of density, and use a major changeset.
- Follow-up needed: rewrite plan/todo as breaking display-contract redesign.

### Round 2

- Lane: Docs/examples/public skill completeness.
- Prompt/source: docs/reference, docs/guides, docs/examples, package READMEs, `skills/agent-ui`, examples, skill tests.
- Findings: plan must explicitly cover getting-started, first-host-app, web-components docs, package READMEs, showcase fixture/e2e/catalog tests, `test/agent-ui-skill.test.ts`, and a dedicated category-display recipe.
- Follow-up needed: add exact docs/examples/skill/test targets.

### Round 2

- Lane: Validation/release/API snapshot completeness.
- Prompt/source: testing/CI/package-export guidance, Web Components, snapshots.
- Findings: final validation should require `bun run validate:release` and `bun run validate:e2e`; Web Components pass-through is mandatory; API snapshot updates need manual declaration diff review; every phase needs 4 parallel reviews.
- Follow-up needed: update validation and review process.

### Round 2

- Lane: Implementation sequencing risk.
- Prompt/source: plan artifacts and transcript implementation.
- Findings: need dedicated phases for contract decision, `dataKind` removal/render identity migration, display policy rewrite, approval safety, docs/examples/snapshots, and final validation.
- Follow-up needed: rewrite phases.

### Round 3

- Lane: Not run.
- Prompt/source: Round 2 closed the planning gaps.
- Findings: N/A.
- Follow-up needed: N/A.

## Sources Inspected

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/README.md`
- `CONTRIBUTING.md`
- `docs/architecture/testing.md`
- `docs/maintenance/ci-cd.md`
- `docs/maintenance/repository-skills.md`
- `docs/reference/package-exports.md`
- `docs/reference/hooks.md`
- `docs/reference/react-components.md`
- `docs/guides/host-integration.md`
- `docs/guides/react.md`
- `docs/guides/theming.md`
- Relevant implementation: `packages/react/src/hooks/transcript.ts`, `packages/react/src/timeline.tsx`, `packages/react/src/timeline/blocks.ts`, `packages/react/src/timeline/item-renderers.tsx`, `packages/react/src/components/chat.tsx`, `packages/react/src/components/thread.tsx`, `packages/react/src/headless.ts`, `packages/react/src/primitives.ts`, `packages/react/src/index.ts`, `packages/core/src/state/item.ts`, `packages/core/src/stores/item.ts`, `packages/web-components/src/index.tsx`
- Relevant tests: `packages/react/test/components.vitest.tsx`, `packages/react/test/source-structure.vitest.ts`, `packages/web-components/test/web-components.test.tsx`, `packages/core/test/reducer.test.ts`, `test/api-snapshots/*.d.ts`, `test/agent-ui-skill.test.ts`
- Relevant examples: `examples/local-react-vite/src/main.tsx`, `examples/local-react-vite/src/fixtures/public-component-catalog.ts`, `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`, `examples/local-react-vite/e2e/transcript-density.e2e.ts`, `examples/recipes/src/custom-transcript-blocks.tsx`, `docs/examples/recipes.md`
- Relevant skills: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/layout-composition.md`, `.agents/skills/agent-ui-feature-planning/SKILL.md`
- Relevant workflows/scripts: `package.json`, `scripts/check-api-snapshots.mjs`, `.github/workflows/ci.yml`, `.github/workflows/compatibility.yml`
- Web/current sources: none; skipped with reason above.

## Findings

- `AgentTranscriptEntry.dataKind` is a mixed display identity derived from stored block kind, synthesized block kind, raw item kind, and stream fallback.
- Default rendering uses `dataKind` for labels and DOM `data-kind`; block renderer selection uses `block.kind`.
- Current density is block-kind keyed and conflates density with critical-only filtering.
- `AgentChat`, `AgentThreadView`, `AgentThreadTimeline`, and Web Components do not expose one coherent transcript display policy.
- Public docs/examples/skills currently point hosts toward `renderItem`, `components.blocks`, and primitive density, not a stable semantic display contract.

## Repo Guidance Findings

- Agent UI owns raw-free transcript view models, transcript primitives, controllers, replacement maps, and documented extension points.
- Host apps own persistence, routing, workflows, auth, process lifecycle, and product state.
- Public package changes require package exports, docs, examples or recipes, tests, API snapshots, package-resolution evidence, and release impact.
- Breaking npm-consumer-facing changes need a changeset and release-aware validation.

## Architecture / Boundary Findings

- Agent UI should own semantic transcript categories and display policy resolution.
- Agent UI should not own saved display preferences, host workflow gates, routing, or product-specific modes.
- `components.blocks` should remain renderer dispatch by block kind, separate from display policy.
- Approval/failure/running safety is a product invariant, not a density option.

## Validation / CI Findings

- Focused tests should cover category derivation, `dataKind` removal, display labels, visibility/density resolution, preset/thread/Web Component pass-through, and approval/failure/running safety.
- Docs/examples/skill changes need `bun run test:skills`, recipe/local React typecheck/build, catalog/e2e updates, API snapshot update plus manual declaration diff review, and package resolution.
- Final validation for this public breaking change should be `bun run validate:release` and `bun run validate:e2e`.
- Each implementation phase needs four parallel reviews: API/export/snapshot, transcript behavior, web/browser/examples, release/product-boundary.

## Existing Skill / Command Findings

- `skills/agent-ui` must be updated to say: use `transcriptDisplay` and categories for display policy; use `renderItem` / `components.blocks` for custom rendering; do not branch on raw `dataKind`, raw item kind, or private selectors for display policy.
- `package.json` current validation commands include `validate:fast`, `validate:protocol`, `validate:packages`, `validate:e2e`, `validate:release`, `test:api-snapshots`, and `test:package-resolution`.

## Web / Current-State Findings

- No external current facts were required.
- The plan is based on current checkout source, docs, tests, scripts, and subagent audits.

## Freshness / Staleness Findings

- Freshness manifest is stale against current commit for guidance, validation, workflows, and docs.
- Targeted current inspections were performed for the changed areas relevant to this plan.
- Refresh the plan if watched guidance files change again before implementation.

## Generated / Vendored / Protected File Findings

- Do not edit `third_party/codex`.
- Do not hand-edit generated schema files under `packages/codex/src/generated`.
- Do not hand-edit package `dist` output.
- API snapshot files under `test/api-snapshots` are generated by `bun run test:api-snapshots:update` after reviewing public API changes.

## Risks

- Category naming is durable public API.
- Removing `dataKind`, `density`, and `byBlockKind` is breaking and needs comprehensive migration docs.
- DOM selector migration can break style/e2e tests if not coordinated.
- Visibility policy can hide approvals or failures unless safety rules are hard tests.
- Web Components can drift from React preset behavior unless treated as mandatory.

## Decisions

- Plan a breaking transcript display contract redesign.
- Replace `dataKind` as public display identity with semantic category and label metadata.
- Use taxonomy: `message`, `reasoning`, `plan`, `command`, `fileChange`, `toolActivity`, `web`, `media`, `system`, `unknown`; use `role` for user/assistant distinctions.
- Replace `AgentTranscriptDensity`/`byBlockKind` with one `transcriptDisplay` policy supporting visibility and density by category/role.
- Keep `components.blocks` keyed by `block.kind` only for renderer dispatch.
- Make Web Components support mandatory if React preset exposes `transcriptDisplay`.
- Require four parallel subagent review lanes for every implementation phase.
- Add a major changeset.

## Rejected Approaches

- Preserving `dataKind`, `density`, or `byBlockKind` compatibility shims as the main outcome.
- Replacing `components.blocks` keys with semantic category keys.
- Exposing raw protocol item kind strings as categories.
- Including both `reasoning` and `thinking` as categories.
- Treating `error` or `approval` as primary transcript categories.
- Adding host preference persistence, routing, workflow gates, or product-specific answer-focused state to Agent UI core.

## Remaining Unknowns

- Final field names: `category` versus `semanticCategory`; `displayLabel` versus i18n label key.
- Exact collapse UI for each category and whether renderer-specific previews need new public metadata.
- Whether `web` should include all web-search-like activity or stay separate from `toolActivity` in docs.
