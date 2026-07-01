# TODO

## Status Summary

- Overall status: P004 complete; P005 next.
- Current phase: P005 Final validation, review, PR, and CI follow-through.
- Blockers: none for planning; implementation should refresh if watched guidance changes again.
- Last validation: P005 `bun run validate:release` and `bun run validate:e2e` passed after final review fixes.
- Last review: P005 final 4-lane subagent review completed; P1/P2 findings were remediated and all four lanes re-verified clean.
- PR/CI: no PR yet.

## Branch And Planning Commit

- Branch: `codex/transcript-semantic-category-plan`
- Planning commit: `0fc7e40`
- Remote: `origin`
- Push result: pushed to `origin/codex/transcript-semantic-category-plan`
- Blockers: none known

## Phase Checklist

- [x] P001 Finalize breaking transcript display contract
  - Goal: Decide the public names, removals, taxonomy, safety semantics, and migration contract before implementation.
  - Scope: Contract/spec work in source types and docs comments only if useful; no broad rendering migration yet.
  - Expected files/areas: `packages/react/src/hooks/transcript.ts`, `docs/reference/hooks.md`, `docs/reference/react-components.md`, this artifact if plan drift is found.
  - Validation: `bun run test -- packages/react/test/components.vitest.tsx`; `bun run typecheck`.
  - Review: 4 parallel subagent reviews after validation: API/export/snapshot, transcript behavior, web/browser/examples, release/product-boundary.
  - Commit: one commit after validation and 4-lane review.
  - Push: push after commit if remote available.
  - PR/CI: no PR until later phases unless scope expands.
  - Evidence:
    - Implementation: Added source-level transcript display contract types and static source-structure guard.
    - Validation: `bun run test -- packages/react/test/components.vitest.tsx` passed; `bun run test:styles` passed; `bun run typecheck` passed.
    - Review: 4-lane final review passed with no findings.
    - Commit: `188e448` Define transcript display contract
    - Push: P001 commits pushed to `origin/codex/transcript-semantic-category-plan`.
  - Tasks:
    - [x] T001 Choose final field names: `category` or `semanticCategory`, plus `displayLabel` or i18n label key.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`, docs notes.
      - Validation note: Typecheck and focused tests compile.
    - [x] T002 Define `AgentTranscriptCategory` taxonomy: `message`, `reasoning`, `plan`, `command`, `fileChange`, `toolActivity`, `web`, `media`, `system`, `unknown`.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`.
      - Validation note: Category mapping test covers all categories.
    - [x] T003 Decide explicit removals: `dataKind` as public display identity and `AgentTranscriptDensity.byBlockKind` as public policy.
      - Expected files/areas: docs and type references.
      - Validation note: Compile errors reveal migration surface.
    - [x] T004 Specify mandatory safety overrides for failed, in-progress, and approval-anchored entries.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`, docs notes.
      - Validation note: Tests added in later phases must encode these invariants.
    - [x] T005 Run 4 parallel subagent review for P001 and record results.
      - Expected files/areas: `todo.md`.
      - Validation note: No P001 commit until all lanes are clean or remediated.

- [x] P002 Migrate transcript view model and rendering identity
  - Goal: Replace `dataKind`-based display identity with category/display label while keeping renderer dispatch separate.
  - Scope: React transcript controller, timeline labels, DOM attributes, and focused tests.
  - Expected files/areas: `packages/react/src/hooks/transcript.ts`, `packages/react/src/timeline.tsx`, `packages/react/src/timeline/item-renderers.tsx`, `packages/react/test/components.vitest.tsx`.
  - Validation: `bun run test -- packages/react/test/components.vitest.tsx`; `bun run typecheck`.
  - Review: 4 parallel subagent reviews after validation.
  - Commit: one commit after validation and 4-lane review.
  - Push: push after commit.
  - PR/CI: no PR until public docs/examples are aligned unless risk warrants early draft.
  - Evidence:
    - Implementation: Replaced `AgentTranscriptEntry.dataKind` with public `category` and `displayLabelKey`, moved transcript DOM identity to `data-category`/`data-role` with `data-block-kind` for renderer identity, migrated styles and e2e selectors, and kept custom block dispatch by `block.kind`.
    - Validation: `bun run test -- packages/react/test/components.vitest.tsx` passed; `bun run test:styles` passed; `bun run --cwd examples/local-react-vite typecheck` passed; `bun run typecheck` passed.
    - Review: 4-lane review completed. API/export/snapshot found public category/snapshot obligations, remediated by exporting `AgentTranscriptCategory` and updating the source guard, with API snapshots/docs kept as P004 gates. Transcript behavior found `assistantMessage` alias misclassification, remediated with role mapping and test coverage. Web/browser/examples found one stale `examples/codex-local-web` `data-kind` selector, remediated. Release/product-boundary found changeset/docs obligations for P004 and no product-boundary blocker.
    - Commit: `483d805` Migrate transcript display identity
    - Push: P002 commits pushed to `origin/codex/transcript-semantic-category-plan`.
  - Tasks:
    - [x] T001 Replace `AgentTranscriptEntry.dataKind` with category/display-label metadata.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`.
      - Validation note: Existing probe tests updated for new contract.
    - [x] T002 Derive categories from normalized block/role state, not raw protocol item kind strings.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`.
      - Validation note: Tests cover reasoning/thinking, tool variants, web, media, system, unknown.
    - [x] T003 Replace timeline labels and DOM display identity with category-based attributes.
      - Expected files/areas: `packages/react/src/timeline.tsx`, item renderers, styles/tests as needed.
      - Validation note: Migrate assertions from `data-kind` to `data-category` or final chosen name.
    - [x] T004 Keep `components.blocks` renderer dispatch by `block.kind`.
      - Expected files/areas: `packages/react/src/timeline.tsx`, tests.
      - Validation note: Custom block renderer test still proves block renderer selection.
    - [x] T005 Run 4 parallel subagent review for P002 and record results.
      - Expected files/areas: `todo.md`.
      - Validation note: Remediate findings before commit.

- [x] P003 Replace density with unified `transcriptDisplay` policy
  - Goal: Ship one coherent display policy API for visibility and density across controller, primitives, preset, thread components, and Web Components.
  - Scope: React hooks/components, Web Components wrapper, tests, and safety invariants.
  - Expected files/areas: `packages/react/src/hooks/transcript.ts`, `packages/react/src/timeline.tsx`, `packages/react/src/components/thread.tsx`, `packages/react/src/components/chat.tsx`, `packages/web-components/src/index.tsx`, `packages/react/test/components.vitest.tsx`, `packages/web-components/test/web-components.test.tsx`.
  - Validation: `bun run test -- packages/react/test/components.vitest.tsx packages/web-components/test/web-components.test.tsx`; `bun run test:styles`; `bun run validate:fast`.
  - Review: 4 parallel subagent reviews after validation.
  - Commit: one commit after validation and 4-lane review.
  - Push: push after commit.
  - PR/CI: no PR until docs/examples phase unless risk warrants early draft.
  - Evidence:
    - Implementation: Replaced controller/primitive `density` inputs with unified `transcriptDisplay`, added category/role/default display policy resolution, `visible`/`collapsed`/`hidden`, `comfortable`/`compact`/`expanded`, `answer-focused` preset shortcut, React thread/chat pass-through, Web Component pass-through, safety overrides, collapsed DOM rendering, and updated local React Vite example selectors.
    - Validation: `bun run test -- packages/react/test/components.vitest.tsx packages/web-components/test/web-components.test.tsx` passed; `bun run test:styles` passed; `bun run validate:fast` passed with existing composer hook lint warnings only; `bunx playwright test examples/local-react-vite/e2e/transcript-density.e2e.ts --config playwright.fixtures.config.ts` passed.
    - Review: 4-lane review completed. API/export/snapshot and release lanes identified stale snapshots/docs/changeset as P004 release blockers. Transcript behavior found no blocker and requested explicit `byRole` precedence and in-progress safety tests, both added. Web/browser lane found blank collapsed command/file rows and missing E2E visible-content coverage, remediated with CSS and Playwright assertions. Plan drift for `answer-focused` was reconciled in `plan.md`.
    - Commit: `47be754` Add transcript display policy
    - Push: P003 commits pushed to `origin/codex/transcript-semantic-category-plan`.
  - Tasks:
    - [x] T001 Define `AgentTranscriptDisplayPolicy`, `AgentTranscriptDisplayRule`, density, and visibility types.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`.
      - Validation note: Public type tests compile.
    - [x] T002 Replace primitive `density` prop and controller option with `transcriptDisplay`.
      - Expected files/areas: hook/timeline components.
      - Validation note: Compile failures from old prop are resolved intentionally.
    - [x] T003 Add `transcriptDisplay` to `AgentChat`, `AgentThreadView`, `AgentThreadTimeline`, and `AgentChatElementOptions`.
      - Expected files/areas: React components and `packages/web-components/src/index.tsx`.
      - Validation note: React and Web Components tests prove pass-through.
    - [x] T004 Implement visibility and density resolution by category and role.
      - Expected files/areas: `packages/react/src/hooks/transcript.ts`, timeline render.
      - Validation note: Tests cover hidden/collapsed/visible and density results.
    - [x] T005 Preserve approval/failure/running safety overrides as hard tests.
      - Expected files/areas: transcript hook/thread tests.
      - Validation note: Anchored and tail approvals remain reachable and jumpable.
    - [x] T006 Run 4 parallel subagent review for P003 and record results.
      - Expected files/areas: `todo.md`.
      - Validation note: Remediate findings before commit.

- [x] P004 Migrate docs, examples, public skill, skill tests, snapshots, and changeset
  - Goal: Make the breaking public surface complete and discoverable across every adopter entry point.
  - Scope: docs, package READMEs, examples, recipes, public skill, tests, API snapshots, changeset.
  - Expected files/areas: `docs/reference/hooks.md`, `docs/reference/react-components.md`, `docs/reference/package-exports.md`, `docs/guides/react.md`, `docs/guides/host-integration.md`, `docs/guides/theming.md`, `docs/getting-started.md`, `docs/guides/first-host-app.md`, `docs/examples/local-react-vite.md`, `docs/guides/web-components.md`, `docs/examples/recipes.md`, `packages/react/README.md`, `packages/web-components/README.md`, `examples/recipes`, `examples/local-react-vite/src/main.tsx`, `examples/local-react-vite/src/fixtures/public-component-catalog.ts`, `examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`, `examples/local-react-vite/e2e/transcript-display.e2e.ts`, `test/public-showcase-catalog.test.ts`, `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/layout-composition.md`, `test/agent-ui-skill.test.ts`, `.changeset/*.md`, `test/api-snapshots/*.d.ts`.
  - Validation: example typechecks/builds, `bun run test:skills`, snapshot update + manual declaration diff + snapshot check, package resolution.
  - Review: 4 parallel subagent reviews after validation.
  - Commit: one commit after validation and 4-lane review.
  - Push: push after commit.
  - PR/CI: open draft or ready PR after this phase if final validation passes or is queued.
  - Evidence:
    - Implementation: Updated reference docs, getting-started/example docs, React and Web Component READMEs, local Vite showcase route, recipes, public `skills/agent-ui` guidance, skill tests, API snapshots, and a major changeset. Public route/test naming now uses `transcript-display` / "Transcript display policy"; old transcript density API terms are absent outside the `density` rule value.
    - Validation: `bun run validate:packages && bun run test:api-snapshots:update` passed; `bun run --cwd examples/recipes typecheck` passed; `bun run --cwd examples/local-react-vite typecheck && bun run --cwd examples/local-react-vite build` passed; `bun run test:skills && bun run test:api-snapshots && bun run test:package-resolution` passed; `bunx vitest run test/public-showcase-catalog.test.ts test/maintainer-gallery-catalog.test.ts test/package-scripts-docs.test.ts packages/react/test/components.vitest.tsx` passed; `bunx playwright test examples/local-react-vite/e2e/transcript-display.e2e.ts --config playwright.fixtures.config.ts` passed; `git diff --check` passed; stale public-term search for `transcript-density`, `Transcript density`, `AgentTranscriptDensity`, `byBlockKind`, `critical-only`, and `verbose` returned no matches.
    - Review: 4-lane review completed. API/export/snapshot found stale package export docs for React display types and Web Component display properties; remediated. Docs/examples found stale local Vite "transcript density" route/catalog/test naming; remediated by renaming public route to `/showcase/transcript-display`. Public skill found missing `default`/`byCategory`/`byRole` resolution and preset prop scoping; remediated in skill guidance and tests. Release/product-boundary found the same showcase naming issue and no host-policy leakage.
    - Commit: `4122e42` Document transcript display policy
    - Push: P004 commits pushed to `origin/codex/transcript-semantic-category-plan`.
  - Tasks:
    - [x] T001 Update public reference and guide docs for `category`, `transcriptDisplay`, visibility/density, safety overrides, migration from `dataKind`/`density`.
      - Expected files/areas: docs listed in phase scope.
      - Validation note: Prose review plus link consistency; must document `category`, `displayLabelKey`, `data-block-kind`, `data-category`, `data-role`, `transcriptDisplay`, `default`/`byCategory`/`byRole`, `comfortable`/`compact`/`expanded`, `visible`/`collapsed`/`hidden`, optional `answer-focused`, and removal of `dataKind`/transcript `data-kind`/`density`/`byBlockKind`/`critical-only`/`verbose`.
    - [x] T002 Update React and Web Components package READMEs.
      - Expected files/areas: `packages/react/README.md`, `packages/web-components/README.md`.
      - Validation note: Public import paths and prop names are correct.
    - [x] T003 Add/update examples proving primitive, `AgentThreadView`, `AgentChat`, and Web Component display policy usage.
      - Expected files/areas: `examples/local-react-vite`, `examples/recipes`.
      - Validation note: `bun run --cwd examples/recipes typecheck`; `bun run --cwd examples/local-react-vite typecheck`; `bun run --cwd examples/local-react-vite build`.
    - [x] T004 Update Playwright/catalog tests for new category/display selectors and preset pass-through.
      - Expected files/areas: `examples/local-react-vite/e2e/transcript-display.e2e.ts`, `test/public-showcase-catalog.test.ts`.
      - Validation note: Relevant fixture e2e or final `validate:e2e`.
    - [x] T005 Update public `skills/agent-ui` guidance and its tests.
      - Expected files/areas: `skills/agent-ui/SKILL.md`, `skills/agent-ui/references/layout-composition.md`, `test/agent-ui-skill.test.ts`.
      - Validation note: `bun run test:skills` asserts new required/forbidden guidance.
    - [x] T006 Add major changeset.
      - Expected files/areas: `.changeset/*.md`.
      - Validation note: Scope includes public React and Web Components packages as needed; `bunx changeset status --verbose` must no longer fail due to missing changeset.
    - [x] T007 Update API snapshots and manually review declaration diff before checking.
      - Expected files/areas: `test/api-snapshots`.
      - Validation note: `bun run test:api-snapshots:update`; inspect diff for `AgentTranscriptEntry`, `AgentTranscriptCategory`, React/headless/primitives declarations, and raw/internal type leaks; `bun run test:api-snapshots`; `bun run test:package-resolution`.
    - [x] T008 Run 4 parallel subagent review for P004 and record results.
      - Expected files/areas: `todo.md`.
      - Validation note: Remediate findings before commit.

- [ ] P005 Final validation, review, PR, and CI follow-through
  - Goal: Prove the breaking public API, package output, browser-visible behavior, docs, and release metadata are ready.
  - Scope: repository validation and PR/CI process.
  - Expected files/areas: no planned source changes except fixes from validation/review.
  - Validation: `bun run validate:release`; `bun run validate:e2e`; focused reruns after fixes.
  - Review: 4 parallel final subagent reviews plus any manual release review needed.
  - Commit: final fix commit if needed.
  - Push: push all commits.
  - PR/CI: open PR and follow GitHub Actions to concrete success/failure.
  - Evidence:
    - Implementation: Final review fixes force failed, in-progress, and approval-anchored transcript entries to full `visible` state even when policies collapse them; unknown transcript labels now use `timeline.unknown`; stale public "transcript density" wording was removed from high-level docs/skill guidance; unused `itemLabel` was removed.
    - Validation: `bunx vitest run packages/react/test/components.vitest.tsx -t "transcript|display|answer-focused|category|collapsed|approval"` passed; `bun run test:skills` passed; `bun run test:api-snapshots:update && bun run test:api-snapshots` passed; stale wording search returned no matches; `bun run validate:release` passed after snapshot refresh; `bun run validate:e2e` passed with fixture 231 passed/1 skipped and real-local 20 passed.
    - Review: Final 4-lane review completed. API/export lane was clean after fixes and reran snapshot/package checks. Runtime lane's P1 collapsed-safety finding was remediated and re-verified clean. Docs/skills lane's stale wording/high-level guide findings were remediated and re-verified clean. Release/product-boundary lane's unknown-label finding was remediated and re-verified clean.
    - Commit:
    - Push:
  - Tasks:
    - [x] T001 Run final release and e2e gates.
      - Expected files/areas: command evidence.
      - Validation note: `bun run validate:release`; `bun run validate:e2e`.
    - [x] T002 Run 4 parallel final subagent reviews and remediate findings.
      - Expected files/areas: full diff.
      - Validation note: Rerun focused gates after fixes.
    - [ ] T003 Push branch and open PR.
      - Expected files/areas: Git/GitHub.
      - Validation note: PR body includes breaking API migration, validation, review, release, docs, UI, protocol, security impact.
    - [ ] T004 Watch CI.
      - Expected files/areas: GitHub Actions.
      - Validation note: success/failure recorded; fix in-scope failures and continue watching.

## Task Checklist By Phase

### P001 Finalize breaking transcript display contract

- [x] T001 Choose final field names.
  - Expected files/areas: `packages/react/src/hooks/transcript.ts`, docs notes.
  - Validation note: typecheck.
- [x] T002 Define `AgentTranscriptCategory`.
  - Expected files/areas: `packages/react/src/hooks/transcript.ts`.
  - Validation note: mapping tests.
- [x] T003 Decide explicit removals.
  - Expected files/areas: docs and type references.
  - Validation note: compile migration surface.
- [x] T004 Specify safety overrides.
  - Expected files/areas: hook/docs notes.
  - Validation note: invariant tests later.
- [x] T005 Run 4 parallel subagent review.
  - Expected files/areas: `todo.md`.
  - Validation note: record all lanes.

### P002 Migrate transcript view model and rendering identity

- [x] T001 Replace `dataKind`.
  - Expected files/areas: transcript hook.
  - Validation note: probe tests.
- [x] T002 Derive categories from normalized state.
  - Expected files/areas: transcript hook.
  - Validation note: all category tests.
- [x] T003 Replace labels and DOM identity.
  - Expected files/areas: timeline/renderers/styles/tests.
  - Validation note: selector migration tests.
- [x] T004 Preserve renderer dispatch.
  - Expected files/areas: timeline/tests.
  - Validation note: block renderer tests.
- [x] T005 Run 4 parallel subagent review.
  - Expected files/areas: `todo.md`.
  - Validation note: record all lanes.

### P003 Replace density with unified `transcriptDisplay` policy

- [x] T001 Define display policy types.
  - Expected files/areas: transcript hook/types.
  - Validation note: typecheck.
- [x] T002 Replace density prop/options.
  - Expected files/areas: hook/timeline.
  - Validation note: compile/test migration.
- [x] T003 Add pass-through to preset/thread/web components.
  - Expected files/areas: React components and Web Components.
  - Validation note: pass-through tests.
- [x] T004 Implement rule resolution.
  - Expected files/areas: transcript hook/timeline.
  - Validation note: hidden/collapsed/visible tests.
- [x] T005 Preserve safety overrides.
  - Expected files/areas: hook/thread tests.
  - Validation note: approval/failure/running tests.
- [x] T006 Run 4 parallel subagent review.
  - Expected files/areas: `todo.md`.
  - Validation note: record all lanes.

### P004 Migrate docs, examples, public skill, skill tests, snapshots, and changeset

- [x] T001 Update docs.
  - Expected files/areas: docs listed in phase.
  - Validation note: prose/link review.
- [x] T002 Update package READMEs.
  - Expected files/areas: React/Web Components READMEs.
  - Validation note: public imports correct.
- [x] T003 Update examples/recipes.
  - Expected files/areas: examples listed in phase.
  - Validation note: examples typecheck/build.
- [x] T004 Update e2e/catalog tests.
  - Expected files/areas: local React Vite e2e/catalog tests.
  - Validation note: fixture or final e2e.
- [x] T005 Update public skill and tests.
  - Expected files/areas: `skills/agent-ui`, `test/agent-ui-skill.test.ts`.
  - Validation note: `bun run test:skills`.
- [x] T006 Add major changeset.
  - Expected files/areas: `.changeset`.
  - Validation note: package scope.
- [x] T007 Update/review API snapshots.
  - Expected files/areas: `test/api-snapshots`.
  - Validation note: update, manual diff review, check.
- [x] T008 Run 4 parallel subagent review.
  - Expected files/areas: `todo.md`.
  - Validation note: record all lanes.

### P005 Final validation, review, PR, and CI follow-through

- [ ] T001 Run final validation.
  - Expected files/areas: command evidence.
  - Validation note: `validate:release` and `validate:e2e`.
- [ ] T002 Run 4 parallel final reviews and remediate.
  - Expected files/areas: full diff.
  - Validation note: focused reruns.
- [ ] T003 Push and open PR.
  - Expected files/areas: Git/GitHub.
  - Validation note: PR body complete.
- [ ] T004 Watch CI.
  - Expected files/areas: GitHub Actions.
  - Validation note: success/failure recorded.

## Implementation Notes

- This is a breaking redesign. Do not implement compatibility shims just to preserve `dataKind`, `density`, or `byBlockKind`.
- Keep `components.blocks` block-kind dispatch because it solves renderer replacement, not display policy.
- Use `transcriptDisplay` consistently instead of mixing primitive `density` with preset `transcriptDensity`.
- Web Components support is mandatory if the React preset exposes the policy.
- Every phase needs 4 parallel review lanes after validation and before commit:
  1. API/export/snapshot reviewer.
  2. Transcript behavior reviewer.
  3. Web/browser/examples reviewer.
  4. Release/product-boundary reviewer.

## Validation Evidence

- Planning artifact validation passed:
  - Command: `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-07-01-transcript-semantic-category`
  - Result: passed; required files/sections exist, `goal-prompt.md` is under 4000 characters, `todo.md` is phase-first, and absolute artifact paths/same-branch rule are present.
- P001 validation passed:
  - Command: `bun run test -- packages/react/test/components.vitest.tsx`
  - Result: passed, 217 tests.
  - Command: `bun run test:styles`
  - Result: passed, 73 tests.
  - Command: `bun run typecheck`
  - Result: passed across workspaces.
- P002 validation passed:
  - Command: `bun run test -- packages/react/test/components.vitest.tsx`
  - Result: passed, 218 tests.
  - Command: `bun run test:styles`
  - Result: passed, 73 tests.
  - Command: `bun run --cwd examples/local-react-vite typecheck`
  - Result: passed.
  - Command: `bun run typecheck`
  - Result: passed across workspaces.
- P003 validation passed:
  - Command: `bun run test -- packages/react/test/components.vitest.tsx packages/web-components/test/web-components.test.tsx`
  - Result: passed, 227 tests.
  - Command: `bun run test:styles`
  - Result: passed, 73 tests.
  - Command: `bun run validate:fast`
  - Result: passed; lint reported existing warnings in `packages/react/src/hooks/composer.ts` only.
  - Command: `bunx playwright test examples/local-react-vite/e2e/transcript-density.e2e.ts --config playwright.fixtures.config.ts`
  - Result: passed, 2 tests.
- P004 validation passed:
  - Command: `bun run validate:packages && bun run test:api-snapshots:update`
  - Result: passed; API snapshots were updated and manually reviewed for transcript display type changes and absence of stale density/byBlockKind/internal leaks.
  - Command: `bun run --cwd examples/recipes typecheck`
  - Result: passed.
  - Command: `bun run --cwd examples/local-react-vite typecheck && bun run --cwd examples/local-react-vite build`
  - Result: passed; Vite chunk-size warning only.
  - Command: `bun run test:skills && bun run test:api-snapshots && bun run test:package-resolution`
  - Result: passed.
  - Command: `bunx vitest run test/public-showcase-catalog.test.ts test/maintainer-gallery-catalog.test.ts test/package-scripts-docs.test.ts packages/react/test/components.vitest.tsx`
  - Result: passed, 242 tests.
  - Command: `bunx playwright test examples/local-react-vite/e2e/transcript-display.e2e.ts --config playwright.fixtures.config.ts`
  - Result: passed, 2 tests.
  - Command: `bunx changeset status --verbose`
  - Result: major bump queued for `@nyosegawa/agent-ui-react`, `@nyosegawa/agent-ui-web-components`, and fixed-version public packages.
  - Command: `git diff --check`
  - Result: passed.
  - Command: `rg -n "transcript-density|Transcript density|AgentTranscriptDensity|byBlockKind|critical-only|verbose" docs packages examples skills test .changeset`
  - Result: no matches.
- P005 validation passed:
  - Command: `bunx vitest run packages/react/test/components.vitest.tsx -t "transcript|display|answer-focused|category|collapsed|approval"`
  - Result: passed, 36 focused tests run.
  - Command: `bun run test:skills`
  - Result: passed, 6 tests.
  - Command: `bun run test:api-snapshots:update && bun run test:api-snapshots`
  - Result: passed; React API snapshots refreshed for the i18n dictionary chunk after adding `timeline.unknown`.
  - Command: `rg -n "transcript density|density props|density prop|transcript display density|transcript-density|Transcript density|AgentTranscriptDensity|byBlockKind|critical-only|verbose|timeline\\.system.*unknown|itemLabel" skills/agent-ui docs packages examples test .changeset`
  - Result: no matches.
  - Command: `bun run validate:release`
  - Result: passed; lint still reports existing `packages/react/src/hooks/composer.ts` hook dependency warnings only, and `publint` still reports repository URL suggestions only.
  - Command: `bun run validate:e2e`
  - Result: passed; fixture e2e 231 passed / 1 skipped, real-local e2e 20 passed.

## Review Evidence

- Initial 4-lane audit concluded: adopt only if category/display policy is coherent and docs/tests/release are included.
- Second 4-lane audit changed direction to breaking redesign:
  - Public API lane: replace `dataKind`, unify `transcriptDisplay`, major changeset.
  - Docs/skill lane: include getting-started, first-host-app, web-components docs, package READMEs, recipes, skill tests, showcase e2e.
  - Validation lane: require `validate:release`, `validate:e2e`, mandatory Web Components pass-through, manual API snapshot diff review, 4 parallel reviews per phase.
  - Sequencing lane: add dedicated phases for contract, view-model identity, display policy, docs/examples/snapshots, and final validation.
- P001 final 4-lane review:
  - API/export/snapshot: no findings; source-level contract is not exported through root/headless/primitives and no API snapshot update is required for P001.
  - Transcript behavior: no findings; taxonomy, precedence comment, and safety comment are coherent; no runtime behavior changed.
  - Web/browser/examples: no findings; no browser-visible change; later TODO coverage is adequate.
  - Release/product-boundary: no findings; P001 can commit as a source-level checkpoint without docs/snapshots/changeset.
- P002 final 4-lane review:
  - API/export/snapshot: found public `AgentTranscriptEntry` and category type obligations; remediated by exporting `AgentTranscriptCategory` and updating the source-structure guard. API snapshots remain a P004 release gate after package declarations are rebuilt.
  - Transcript behavior: found `assistantMessage` alias misclassification; remediated by mapping it to assistant role and adding test coverage.
  - Web/browser/examples: found stale `examples/codex-local-web` transcript `data-kind` selector; remediated by switching to `data-category="message"` plus `data-role="user"`.
  - Release/product-boundary: no host-policy leakage or block-kind shim blocker; docs and major changeset are mandatory P004 gates.
- P003 final 4-lane review:
  - API/export/snapshot: found stale API snapshots and docs for the breaking public `density` -> `transcriptDisplay` migration; recorded as P004 release blockers.
  - Transcript behavior: no runtime blocker; requested explicit role precedence and in-progress safety tests, both added.
  - Web/browser/examples: found collapsed command/file rows rendered blank and missing E2E visible-content assertion; remediated by keeping collapsed metadata visible and asserting `Command` / `File change` text in Playwright.
  - Release/product-boundary: no host-policy leakage; `answer-focused` remains an explicit display-only public preset and P004 must document it plus snapshots/changeset.
- P004 final 4-lane review:
  - API/export/snapshot: found stale `docs/reference/package-exports.md` lists for root React display type exports and Web Component `transcriptDisplay` / `transcriptMode` properties; remediated.
  - Docs/examples/recipes: found local Vite showcase still exposed "transcript density" route/title/catalog/test naming; remediated by renaming public route and e2e to `transcript-display` / "Transcript display policy".
  - Public skill: found missing durable `default`/`byCategory`/`byRole` contract, resolution order, and `transcriptDisplay` versus `transcriptMode` preset scoping; remediated in skill guidance and tests.
  - Release/product-boundary: found the same showcase naming issue; no P0/P1 findings and no host-specific runtime policy leakage.
- P005 final 4-lane review:
  - API/export/snapshot: initial review clean; follow-up clean after `timeline.unknown` and API snapshot refresh.
  - Transcript behavior: found P1 collapsed safety issue for failed, in-progress, and approval-anchored entries; remediated by forcing safety-critical entries to `visible` after policy resolution and adding tests; follow-up clean.
  - Docs/examples/skills: found stale top-level "transcript density" framing and missing high-level `transcriptDisplay` guide links; remediated; follow-up clean.
  - Release/product-boundary: found unknown transcript blocks were labeled as system; remediated with `timeline.unknown`; follow-up clean.

## Commit Log

- `0fc7e40` Plan transcript display contract redesign
- `77d622f` Record transcript display planning commit
- `4c2b49b` Record transcript display planning push
- `188e448` Define transcript display contract
- `eb4f508` Record transcript display contract phase
- `4e64a50` Record transcript display contract push
- `483d805` Migrate transcript display identity
- `e85673f` Record transcript display identity phase
- `ac0b3ff` Record transcript display identity push
- `47be754` Add transcript display policy
- `8933424` Record transcript display policy phase
- `dd46e20` Record transcript display policy push
- `4122e42` Document transcript display policy
- `4c571c2` Record transcript display docs phase

## Final Checklist

- [ ] Every phase is complete or explicitly deferred.
- [ ] Every task in completed phases is complete or explicitly skipped with a reason.
- [ ] Every completion criterion in `plan.md` is satisfied.
- [ ] Required validation passed or an explicit user-approved exception is recorded.
- [ ] 4-lane review evidence is recorded for every completed phase.
- [ ] Branch, planning commit, remote, push result, and blockers are recorded.
- [ ] Commit hashes are recorded for completed phases.
- [ ] Push evidence is recorded when commits need to be shared or a PR will be created.
- [ ] PR URL is recorded when applicable.
- [ ] CI was followed to concrete success or failure when applicable.
