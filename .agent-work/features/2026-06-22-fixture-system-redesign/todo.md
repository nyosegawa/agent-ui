# Fixture System Redesign Todo

## Status Summary

P001-P004 implementation complete, committed, and pushed. P005-P006 remain pending.

## Branch And Planning Commit

- Branch: codex/fixture-system-redesign-plan
- Planning commit: 2c02187 Plan fixture system redesign
- Remote: origin
- Push result: P001-P004 pushed to `origin/codex/fixture-system-redesign-plan`
- Blockers: none known

## Phase Checklist

- P001 done: Visual QA manifest and route inventory
- P002 done: Container-aware component layout redesign
- P003 done: Fixture route and closeup cleanup
- P004 done: Validation and browser evidence hardening
- P005 pending: Docs and Agent Skills alignment
- P006 pending: Final validation, PR, and CI follow-through

## Task Checklist By Phase

- [x] P001 Visual QA manifest and route inventory
  - Goal: Make one typed source of truth for fixture routes, gallery, docs screenshots, and Playwright coverage.
  - Scope: Example-only plus docs/test guard updates.
  - Expected files/areas: `examples/local-react-vite/src/**`, `examples/local-react-vite/e2e/**`, `docs/screenshots/README.md`, docs stale tests.
  - Validation: local-react typecheck/build, focused route inventory tests.
  - Review: Run 4 parallel subagents for phase-level review before moving to P002; confirm every current route is classified as protocol, primitive composition, host reference, or closeup.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with next compatible phase.
  - PR/CI: include route inventory evidence in PR.
  - Evidence:
    - Implementation: Added `visual-qa-manifest.ts`, derived gallery previews from it, made docs screenshot capture consume docs screenshot entries, added route inventory Playwright coverage, and updated source-structure guards for main router and screenshot directory drift.
    - Validation: Passed `bun run --cwd examples/local-react-vite typecheck`; `bun run --cwd examples/local-react-vite build`; `bunx playwright test examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts --config playwright.fixtures.config.ts`; `bunx vitest run packages/react/test/source-structure.vitest.ts`; `bunx vitest run test/docs-staleness.test.ts test/package-scripts-docs.test.ts`.
    - Review: 4 parallel subagents reviewed P001. Accepted fixes: update stale source-structure screenshot assertion, add main router drift guard, add docs screenshot directory guard. No docs/public-boundary findings. Deferred P3 bundle hygiene note because the manifest is private fixture-only and preserving one source of truth is more important for P001; revisit during P003 closeup/preview cleanup if bundle output still retains unused docs metadata.
    - Commit: 89588f2 Add visual QA route manifest
    - Push: pushed to `origin/codex/fixture-system-redesign-plan`
  - Tasks:
    - [x] T001 Add typed visual QA manifest.
      - Expected files/areas: `examples/local-react-vite/src/fixtures/**`
      - Validation note: manifest has route id, path, category, purpose, ready selector, viewports, docs screenshot flag, owner spec.
    - [x] T002 Wire gallery, route list, screenshot capture, and e2e route coverage to the manifest.
      - Expected files/areas: `examples/local-react-vite/src/main.tsx`, `examples/local-react-vite/e2e/**`
      - Validation note: no duplicated hard-coded route inventory remains except intentional tests.

- [x] P002 Container-aware component layout redesign
  - Goal: Make Agent UI components responsive by their container and guarantee composer submit placement.
  - Scope: Agent UI-owned React components and internal styles.
  - Expected files/areas: `packages/react/src/components/**`, `packages/react/src/styles/**`, React component tests.
  - Validation: React vitest, style tests, fixture e2e layout tests at desktop/tablet/compact/mobile/short widths.
  - Review: Run 4 parallel subagents for phase-level review before moving to P003; confirm no host runtime responsibility or public selector contract is introduced.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with adjacent validated phase.
  - PR/CI: include before/after evidence for 700px and tablet widths.
  - Evidence:
    - Implementation: Changed composer toolbar to a grid with a dedicated lower-right submit cell, added container queries for compact composer controls, added ResizeObserver-backed compact menu behavior for run settings, made first-run composer use the same grid invariant, and changed status/account tablet behavior to container queries so embedded narrow shells compact without relying on viewport width.
    - Validation: Passed `bun run test:styles`; `bun run --cwd examples/local-react-vite typecheck`; `bun run --cwd examples/local-react-vite build`; `bunx vitest run packages/react/test/components.vitest.tsx packages/react/test/composer-submit-semantics.vitest.ts packages/react/test/source-structure.vitest.ts`; `bunx playwright test examples/local-react-vite/e2e/visual-layout.e2e.ts --config playwright.fixtures.config.ts`.
    - Review: 4 parallel subagents reviewed P002. No product-boundary/public-surface findings. Accepted fixes: strengthened submit containment and hit-test assertions, moved status/account compaction from viewport media rules to container queries, and added a desktop-viewport embedded narrow shell test. Remaining risk: broader sidebar drawer behavior is still planned for later phases if visual route cleanup exposes additional embedded-host needs.
    - Commit: ecc7d47 Redesign composer responsive layout
    - Push: pushed to `origin/codex/fixture-system-redesign-plan`
  - Tasks:
    - [x] T003 Add internal layout mode or container-query structure.
      - Expected files/areas: `packages/react/src/components/shared.tsx`, component roots, styles.
      - Validation note: tablet and embedded narrow containers do not depend only on viewport width.
    - [x] T004 Redesign composer toolbar and submit placement.
      - Expected files/areas: `composer.tsx`, `composer.css`, `composer-mobile.css`, submit tests.
      - Validation note: submit stays in lower-right cell across required widths.
    - [x] T005 Redesign run settings compaction.
      - Expected files/areas: `run-settings.tsx`, `starter-cwd.tsx`, run settings styles.
      - Validation note: review/model/cwd compact to icon-only, menu, or sheet before overflow.
    - [x] T006 Fix tablet header/status/sidebar behavior.
      - Expected files/areas: chat/thread/status/sidebar components and styles.
      - Validation note: 768px routes have no clipped account/status controls or document overflow.

- [x] P003 Fixture route and closeup cleanup
  - Goal: Make every visible fixture route product-quality and aligned with current Agent UI design.
  - Scope: Example-only route pages, closeups, fixture state, local CSS.
  - Expected files/areas: `examples/local-react-vite/src/main.tsx`, `closeups/**`, `fixtures/**`, `styles/**`.
  - Validation: `test:e2e:fixtures`, visual closeup specs, accessibility contract, manual screenshots.
  - Review: Run 4 parallel subagents for phase-level review before moving to P004; confirm closeups use real primitives or are clearly host examples.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with validation phase.
  - PR/CI: show evidence for `/fixture-gallery`, `/composer-retry`, `/scoped-thread-lists`, `/app-connectors`, `/usage-only`.
  - Evidence:
    - Implementation: Replaced obsolete closeups for mode/model/input states with real `AgentComposer`, `AgentRunSettingsPanel`, `AgentThreadSidebar`, and `AgentChat` primitives; kept the route-preview iframe isolated to `FixturePreview`. Rebuilt `/composer-retry` as a readable status panel with a real empty state before the first failure and retry controls only after a failed optimistic message exists. Polished `/scoped-thread-lists` with structured headers, independent empty/not-loaded/end-of-list states, and scoped metadata. Seeded `/app-connectors` so its first render is populated before refresh. Changed usage reset fixtures from stale absolute dates to relative future dates and added a source-structure guard against hard-coded ISO reset dates.
    - Validation: Passed `bun run --cwd examples/local-react-vite typecheck`; `bun run --cwd examples/local-react-vite build`; `bun run test:styles`; `bunx playwright test examples/local-react-vite/e2e/composer-retry.e2e.ts examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts examples/local-react-vite/e2e/smoke.e2e.ts examples/local-react-vite/e2e/visual-closeups.e2e.ts examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts --config playwright.fixtures.config.ts`; `bun run test:e2e:fixtures`.
    - Review: 4 parallel subagents reviewed P003 by route UI/design, closeup primitive fidelity, test coverage, and product-boundary/public-surface risk. Accepted fixes: hide raw pre-failure retry metrics and retry CTA before a start attempt, replace the remaining fake sidebar-search closeup with real `AgentThreadSidebar`, distinguish scoped-list `Not loaded` from `End of list`, assert app connectors before refresh, and guard usage reset dates against stale literals. Second 4-agent re-review reported no P0-P2 findings; remaining docs/Agent Skills work stays deferred to P005.
    - Commit: 44d406e Polish fixture routes and closeups
    - Push: pushed to `origin/codex/fixture-system-redesign-plan`
  - Tasks:
    - [x] T007 Rebuild obsolete closeups.
      - Expected files/areas: `ComponentCloseupGallery.tsx`, gallery CSS.
      - Validation note: no fake menu/select/segmented DOM represents Agent UI primitives.
    - [x] T008 Redesign `/composer-retry`.
      - Expected files/areas: route code, fixture state, composer retry e2e.
      - Validation note: raw probe values are not visible as unfinished UI.
    - [x] T009 Polish unfinished fixture routes.
      - Expected files/areas: `/scoped-thread-lists`, `/app-connectors`, `/usage-only`, related CSS.
      - Validation note: first render is complete, dates are current or relative, no native cramped controls remain.

- [x] P004 Validation and browser evidence hardening
  - Goal: Catch visual QA drift automatically and record useful manual evidence.
  - Scope: Playwright specs, helper assertions, docs stale guards, real-local layout checks.
  - Expected files/areas: `examples/local-react-vite/e2e/**`, `test/**`, Playwright configs, docs tests.
  - Validation: fixture e2e, real-local e2e, docs/skill tests.
  - Review: Run 4 parallel subagents for phase-level review before moving to P005; confirm tests assert behavior and layout contracts, not private styling trivia.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with docs phase.
  - PR/CI: include route/viewport matrix and screenshot links.
  - Evidence:
    - Implementation: Added a manifest-driven `visual-route-matrix.e2e.ts` that runs every declared visual QA route across its declared desktop/wide/tablet/compact/mobile/short viewports and checks route readiness, document overflow, visible text containment, and key Agent UI surface containment. Added `real-local-layout.e2e.ts` for deterministic codex-local-web first-run and stored-thread desktop/mobile layout checks. Collapsed closeup cards to one column at tablet/short widths after the new matrix exposed a real short-viewport composer toolbar overflow.
    - Validation: Passed `bun run --cwd examples/local-react-vite typecheck`; `bun run --cwd examples/codex-local-web typecheck`; `bunx playwright test examples/local-react-vite/e2e/visual-route-matrix.e2e.ts --config playwright.fixtures.config.ts`; `bunx playwright test examples/codex-local-web/e2e/real-local-layout.e2e.ts --config playwright.real-local.config.ts`; `bun run test:e2e:fixtures`; `bun run test:e2e:real-local`; `bun run test:styles`.
    - Review: 4 parallel subagents reviewed P004. No P0-P2 findings. Review confirmed the matrix asserts geometry/behavior contracts rather than brittle exact styling, the real-local layout audit is stable under the fake App Server real-local scope, the new specs are picked up by existing fixture and real-local scripts, and P004 does not add public API/export or product-boundary obligations. Docs and Agent Skills remain intentionally deferred to P005.
    - Commit: ca99cd4 Harden visual QA layout coverage
    - Push: pushed to `origin/codex/fixture-system-redesign-plan`
  - Tasks:
    - [x] T010 Add route inventory and viewport matrix guards.
      - Expected files/areas: fixture e2e support and docs stale tests.
      - Validation note: desktop, wide, tablet, compact, mobile, embedded narrow, and short cases are covered where required.
    - [x] T011 Add behavioral visual contract assertions.
      - Expected files/areas: visual layout, accessibility, design-system contract specs.
      - Validation note: no overflow, hit targets, focus return, submit placement, menu/sheet containment, route readiness.
    - [x] T012 Update real-local layout audit.
      - Expected files/areas: real-local e2e specs and docs.
      - Validation note: real Codex example confirms component behavior against App Server-backed state.

- [ ] P005 Docs and Agent Skills alignment
  - Goal: Reflect the new visual QA system in maintainer docs, repo skills, and public host guidance.
  - Scope: Docs-only, maintainer skill files, public skill references, skill tests.
  - Expected files/areas: `docs/**`, `.agents/skills/**`, `skills/agent-ui/**`, `test/repository-skills.test.ts`, `test/agent-ui-skill.test.ts`.
  - Validation: `bun run test:repo-skills`, `bun run test:skills`, docs stale tests.
  - Review: Run 4 parallel subagents for phase-level review before moving to P006; confirm maintainer-only route names and commands do not leak into public host skill workflow.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with final validation.
  - PR/CI: include docs/skill diff summary.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T013 Update maintainer docs.
      - Expected files/areas: testing, browser verification, screenshots, local-react docs.
      - Validation note: docs describe manifest-driven visual QA and screenshot evidence accurately.
    - [ ] T014 Update repo skills.
      - Expected files/areas: browser-qa, example-authoring, review, release-validation, planning skills.
      - Validation note: repository skill tests assert visual QA drift prevention guidance.
    - [ ] T015 Update public skill only where host-facing.
      - Expected files/areas: `skills/agent-ui/**`.
      - Validation note: public skill tests reject maintainer-only fixture commands/routes.

- [ ] P006 Final validation, PR, and CI follow-through
  - Goal: Prove the redesign is complete and ready for review.
  - Scope: Whole touched surface.
  - Expected files/areas: all modified files, PR body, CI status.
  - Validation: broad local gates, package validation if release-sensitive files changed, GitHub Actions inspection.
  - Review: Run 4 parallel subagents for final phase-level review; confirm completion criteria from `plan.md` are met before PR readiness is claimed.
  - Commit: final cleanup commit if needed.
  - Push: push branch to `origin`.
  - PR/CI: open PR and follow CI to concrete success or failure.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T016 Run broad validation.
      - Expected files/areas: repo scripts and CI-equivalent gates.
      - Validation note: include `validate:release`, `validate:e2e`, and `validate:packages` if needed.
    - [ ] T017 Prepare PR evidence and follow CI.
      - Expected files/areas: PR body, screenshots, CI checks.
      - Validation note: report exact pass/fail status and blockers.

## Implementation Notes

Implement phase-first. A task-level commit is allowed only if a phase becomes too large or mixes incompatible review/validation risk; record the reason here if that happens.

Do not edit protected generated or vendored files. Do not introduce host runtime ownership into Agent UI core. Prefer internal layout implementation unless public API is clearly required.

P001 review note: if later fixture preview work changes gallery rendering again, reassess whether docs/e2e-only manifest metadata should be split away from the browser bundle without reintroducing duplicated route truth.

Each phase requires a 4-subagent parallel review after phase implementation and validation pass, before the next phase starts. Record the subagent findings, accepted fixes, rejected findings, and remaining risks in the phase Evidence Review field.

## Validation Evidence

- P001 passed:
  - `bun run --cwd examples/local-react-vite typecheck`
  - `bun run --cwd examples/local-react-vite build`
  - `bunx playwright test examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts --config playwright.fixtures.config.ts`
  - `bunx vitest run packages/react/test/source-structure.vitest.ts`
  - `bunx vitest run test/docs-staleness.test.ts test/package-scripts-docs.test.ts`

## Review Evidence

- P001 4-subagent review completed:
  - Manifest/schema/source-of-truth review: P2 router drift guard requested and fixed.
  - Test/validation review: P1 source-structure drift and P2 screenshot directory guard requested and fixed.
  - Docs/example-boundary review: no findings.
  - TypeScript/build/runtime review: no P0-P2 findings; P3 private bundle metadata note recorded for later reassessment.

## Commit Log

- Planning commit: 2c02187 Plan fixture system redesign
- P001 implementation commit: 89588f2 Add visual QA route manifest
- P001 evidence update commit: latest P001 evidence commit on this branch; final hash from git log
- P002 implementation commit: ecc7d47 Redesign composer responsive layout
- P002 evidence update commit: latest P002 evidence commit on this branch; final hash from git log
- Later implementation commits: pending

## Final Checklist

- [ ] All reported UI issues fixed.
- [ ] All current fixture routes either redesigned, deleted with justification, or classified by manifest.
- [ ] No obsolete fake Agent UI closeups remain.
- [ ] Submit lower-right invariant is tested.
- [ ] Narrow review/model/cwd compaction is tested.
- [ ] Tablet header/status/sidebar behavior is tested.
- [ ] Docs, maintainer skills, public skill, and tests are updated.
- [ ] Focused and broad validation results are recorded.
- [ ] Branch is pushed, PR is opened, and CI is inspected.
