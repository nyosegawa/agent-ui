# Fixture System Redesign Todo

## Status Summary

Planning complete pending artifact validation, planning commit, push, implementation, PR, and CI follow-through.

## Branch And Planning Commit

- Branch: codex/fixture-system-redesign-plan
- Planning commit: this planning artifact commit; final hash to be confirmed from git log
- Remote: origin
- Push result: pending
- Blockers: none known

## Phase Checklist

- P001 pending: Visual QA manifest and route inventory
- P002 pending: Container-aware component layout redesign
- P003 pending: Fixture route and closeup cleanup
- P004 pending: Validation and browser evidence hardening
- P005 pending: Docs and Agent Skills alignment
- P006 pending: Final validation, PR, and CI follow-through

## Task Checklist By Phase

- [ ] P001 Visual QA manifest and route inventory
  - Goal: Make one typed source of truth for fixture routes, gallery, docs screenshots, and Playwright coverage.
  - Scope: Example-only plus docs/test guard updates.
  - Expected files/areas: `examples/local-react-vite/src/**`, `examples/local-react-vite/e2e/**`, `docs/screenshots/README.md`, docs stale tests.
  - Validation: local-react typecheck/build, focused route inventory tests.
  - Review: Run 4 parallel subagents for phase-level review before moving to P002; confirm every current route is classified as protocol, primitive composition, host reference, or closeup.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with next compatible phase.
  - PR/CI: include route inventory evidence in PR.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T001 Add typed visual QA manifest.
      - Expected files/areas: `examples/local-react-vite/src/fixtures/**`
      - Validation note: manifest has route id, path, category, purpose, ready selector, viewports, docs screenshot flag, owner spec.
    - [ ] T002 Wire gallery, route list, screenshot capture, and e2e route coverage to the manifest.
      - Expected files/areas: `examples/local-react-vite/src/main.tsx`, `examples/local-react-vite/e2e/**`
      - Validation note: no duplicated hard-coded route inventory remains except intentional tests.

- [ ] P002 Container-aware component layout redesign
  - Goal: Make Agent UI components responsive by their container and guarantee composer submit placement.
  - Scope: Agent UI-owned React components and internal styles.
  - Expected files/areas: `packages/react/src/components/**`, `packages/react/src/styles/**`, React component tests.
  - Validation: React vitest, style tests, fixture e2e layout tests at desktop/tablet/compact/mobile/short widths.
  - Review: Run 4 parallel subagents for phase-level review before moving to P003; confirm no host runtime responsibility or public selector contract is introduced.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with adjacent validated phase.
  - PR/CI: include before/after evidence for 700px and tablet widths.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T003 Add internal layout mode or container-query structure.
      - Expected files/areas: `packages/react/src/components/shared.tsx`, component roots, styles.
      - Validation note: tablet and embedded narrow containers do not depend only on viewport width.
    - [ ] T004 Redesign composer toolbar and submit placement.
      - Expected files/areas: `composer.tsx`, `composer.css`, `composer-mobile.css`, submit tests.
      - Validation note: submit stays in lower-right cell across required widths.
    - [ ] T005 Redesign run settings compaction.
      - Expected files/areas: `run-settings.tsx`, `starter-cwd.tsx`, run settings styles.
      - Validation note: review/model/cwd compact to icon-only, menu, or sheet before overflow.
    - [ ] T006 Fix tablet header/status/sidebar behavior.
      - Expected files/areas: chat/thread/status/sidebar components and styles.
      - Validation note: 768px routes have no clipped account/status controls or document overflow.

- [ ] P003 Fixture route and closeup cleanup
  - Goal: Make every visible fixture route product-quality and aligned with current Agent UI design.
  - Scope: Example-only route pages, closeups, fixture state, local CSS.
  - Expected files/areas: `examples/local-react-vite/src/main.tsx`, `closeups/**`, `fixtures/**`, `styles/**`.
  - Validation: `test:e2e:fixtures`, visual closeup specs, accessibility contract, manual screenshots.
  - Review: Run 4 parallel subagents for phase-level review before moving to P004; confirm closeups use real primitives or are clearly host examples.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with validation phase.
  - PR/CI: show evidence for `/fixture-gallery`, `/composer-retry`, `/scoped-thread-lists`, `/app-connectors`, `/usage-only`.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T007 Rebuild obsolete closeups.
      - Expected files/areas: `ComponentCloseupGallery.tsx`, gallery CSS.
      - Validation note: no fake menu/select/segmented DOM represents Agent UI primitives.
    - [ ] T008 Redesign `/composer-retry`.
      - Expected files/areas: route code, fixture state, composer retry e2e.
      - Validation note: raw probe values are not visible as unfinished UI.
    - [ ] T009 Polish unfinished fixture routes.
      - Expected files/areas: `/scoped-thread-lists`, `/app-connectors`, `/usage-only`, related CSS.
      - Validation note: first render is complete, dates are current or relative, no native cramped controls remain.

- [ ] P004 Validation and browser evidence hardening
  - Goal: Catch visual QA drift automatically and record useful manual evidence.
  - Scope: Playwright specs, helper assertions, docs stale guards, real-local layout checks.
  - Expected files/areas: `examples/local-react-vite/e2e/**`, `test/**`, Playwright configs, docs tests.
  - Validation: fixture e2e, real-local e2e, docs/skill tests.
  - Review: Run 4 parallel subagents for phase-level review before moving to P005; confirm tests assert behavior and layout contracts, not private styling trivia.
  - Commit: phase commit after validation.
  - Push: after phase commit or batch with docs phase.
  - PR/CI: include route/viewport matrix and screenshot links.
  - Evidence:
    - Implementation: pending
    - Validation: pending
    - Review: pending
    - Commit: pending
    - Push: pending
  - Tasks:
    - [ ] T010 Add route inventory and viewport matrix guards.
      - Expected files/areas: fixture e2e support and docs stale tests.
      - Validation note: desktop, wide, tablet, compact, mobile, embedded narrow, and short cases are covered where required.
    - [ ] T011 Add behavioral visual contract assertions.
      - Expected files/areas: visual layout, accessibility, design-system contract specs.
      - Validation note: no overflow, hit targets, focus return, submit placement, menu/sheet containment, route readiness.
    - [ ] T012 Update real-local layout audit.
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

Each phase requires a 4-subagent parallel review after phase implementation and validation pass, before the next phase starts. Record the subagent findings, accepted fixes, rejected findings, and remaining risks in the phase Evidence Review field.

## Validation Evidence

Pending implementation. Planning artifact validation should be recorded before the planning commit.

## Review Evidence

Pending implementation. Browser evidence should include desktop, tablet, 700px/narrow, mobile, and short viewport screenshots or metrics for the affected routes.

## Commit Log

- Planning commit: pending
- Implementation commits: pending

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
