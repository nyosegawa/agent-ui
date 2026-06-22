# Fixture System Redesign Research

## Scope

Research a full redesign of the Agent UI fixture and visual QA system, including component layout behavior, deterministic example routes, browser-visible quality, docs, tests, and Agent Skills. The work intentionally avoids one-off compatibility patches because the affected examples have no external users and the goal is to make the owned surface coherent.

Branch decision: reuse `codex/fixture-system-redesign-plan` for planning and later implementation. Planning artifacts live under `.agent-work/features/2026-06-22-fixture-system-redesign/`.

## Freshness Check

Command run:

```bash
node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs
```

Result: `refresh-needed`.

Current commit: `d7b047c9f337c64004b584d12cd96abbf21489bd` (`Release Agent UI packages v1.0.0`).

Last full research commit recorded by the planning skill: `499a9020c1613923ae547411ad930e0bcefb8ed9`.

Changed watched files:

- `docs/architecture/testing.md`: validation matrix drift.
- `docs/reference/package-exports.md`: public package surface drift.

Changed watched globs:

- `docs/architecture/*.md`
- `docs/reference/*.md`

Action taken: targeted refresh, not a full structural restart. Current versions of `docs/architecture/testing.md`, `docs/reference/package-exports.md`, `docs/architecture/product-boundary.md`, and `docs/guides/browser-verification.md` were inspected before finalizing the plan.

## Investigation Method

The investigation combined code inspection, docs review, Playwright/browser-visible audits, and three subagent rounds across design, architecture, validation, and skills. The local fixture server was available at `http://127.0.0.1:5174/`, and the real local Codex example server was available at `http://127.0.0.1:5175/`.

Browser measurements used Playwright because the agent-browser CLI intermittently hung during the run. The inspected routes included `/`, `/fixture-gallery`, `/composer-retry`, `/rich-transcript`, `/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`, `/app-connectors`, `/transcript-density`, `/resource-resolution`, `/scoped-thread-lists`, and state variants such as `/?state=empty`.

Screenshots and metrics were written under `/tmp/agent-ui-audit-*.png` and `/tmp/agent-ui-fixture-release-audit/metrics.json`.

## Subagent Rounds

Round 1 focused on current visual failures.

- Design drift: `fixture-gallery` contains hand-built menus, old input/select/segmented examples, iframe-based closeups, and static copies instead of real current primitives.
- Composer responsiveness: compact behavior is viewport-bound at `640px`, so tablet and narrow embedded layouts retain labels and let submit controls drift.
- Live fixture audit: tablet header/account overflow, raw `/composer-retry` probe output, incomplete `/app-connectors` first render, unfinished `/scoped-thread-lists`, weak mobile gallery previews, and stale `/usage-only` dates were observed.
- Architecture boundary: examples and docs must keep host workflow/auth/runtime responsibility outside Agent UI core.

Round 2 focused on implementation ownership and validation lanes.

- Repository skills should encode visual redesign discipline for maintainers, while public `skills/agent-ui` should keep host-facing guidance only.
- Agent UI owns primitives, controllers, examples, visual QA, docs, and package boundaries. Hosts own routing, auth, persistence, process lifecycle, workspace policy, and deployment.
- Validation must include fixture e2e, real-local e2e, docs/skill stale guards, package/API guards when public exports move, and CI follow-through.
- Skill reflection should cover browser QA, example authoring, review, release validation, and planning without leaking maintainer-only commands into public host skills.

Round 3 focused on target architecture.

- Keep one deterministic `examples/local-react-vite` app and add a typed visual QA manifest as the source of truth for routes, gallery entries, screenshot capture, and Playwright coverage.
- Redesign component responsiveness around container-aware layout modes: `wide`, `tablet`, `compact`, and `tight`.
- Treat screenshots as review evidence, not the primary CI contract. CI should assert behavior, overflow, hit targets, focus, route inventory, and component contracts.
- Update maintainer docs and skills to prevent future static fixture drift.

## Sources Inspected

Repository guidance and docs:

- `AGENTS.md`
- `docs/architecture/product-boundary.md`
- `docs/architecture/testing.md`
- `docs/reference/package-exports.md`
- `docs/architecture/toolchain.md`
- `docs/maintenance/ci-cd.md`
- `docs/reference/react-components.md`
- `docs/examples/local-react-vite.md`
- `docs/guides/browser-verification.md`
- `docs/maintenance/agent-ui-skills.md`
- `docs/maintenance/repository-skills.md`
- `docs/screenshots/README.md`

Examples and fixture code:

- `examples/local-react-vite/README.md`
- `examples/local-react-vite/package.json`
- `examples/local-react-vite/src/main.tsx`
- `examples/local-react-vite/src/fixtures/gallery.ts`
- `examples/local-react-vite/src/fixtures/demo-state.ts`
- `examples/local-react-vite/src/closeups/ComponentCloseupGallery.tsx`
- `examples/local-react-vite/src/styles/fixture-gallery.css`
- `examples/local-react-vite/src/styles/host-recipe.css`
- `examples/local-react-vite/e2e/visual-layout.spec.ts`
- `examples/local-react-vite/e2e/design-system-contract.spec.ts`
- `examples/local-react-vite/e2e/visual-closeups.spec.ts`
- `examples/local-react-vite/e2e/composer-retry.spec.ts`
- `examples/local-react-vite/e2e/scoped-thread-lists.spec.ts`
- `examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts`

React package code and tests:

- `packages/react/src/components/composer.tsx`
- `packages/react/src/components/first-run.tsx`
- `packages/react/src/components/run-settings.tsx`
- `packages/react/src/components/starter-cwd.tsx`
- `packages/react/src/components/shared.tsx`
- `packages/react/src/styles/composer.css`
- `packages/react/src/styles/composer-mobile.css`
- `packages/react/src/styles/thread.css`
- `packages/react/src/styles/responsive.css`
- `packages/react/src/styles/controls-forms.css`
- `packages/react/test/components.vitest.tsx`
- `packages/react/test/composer-submit-semantics.vitest.ts`
- `packages/react/test/source-structure.vitest.ts`

Skill and repo tests:

- `.agents/skills/browser-qa/SKILL.md`
- `.agents/skills/example-authoring/SKILL.md`
- `.agents/skills/agent-ui-review/SKILL.md`
- `.agents/skills/release-validation/SKILL.md`
- `.agents/skills/agent-ui-feature-planning/SKILL.md`
- `/Users/sakasegawa/.agents/agent-skill-best-practices.md`
- `skills/agent-ui/SKILL.md`
- `test/repository-skills.test.ts`
- `test/agent-ui-skill.test.ts`
- `test/package-scripts-docs.test.ts`
- `package.json`
- `.github/workflows/*.yml`

## Findings

The observed failures are systemic. The fixture app, closeup gallery, route metadata, screenshot capture, responsive component CSS, docs, and maintainer skills each carry part of the visual QA story, but none of them currently owns the whole contract. That allows old static examples and partial routes to remain visible after the real component system changes.

The main redesign should therefore make the fixture app a deterministic quality system, not a set of demos. Component fixes should happen in the React package first, then fixtures should verify the real behavior.

## Repo Guidance Findings

Agent UI must remain a reusable Codex App Server UI library. The plan must not move host workflow, auth, persistence, process lifecycle, billing, workspace policy, or deployment into core.

Bun is the package manager and validation runner. Browser-visible work must include Playwright and real browser inspection where layout, hit testing, focus, scrolling, or overflow matters.

Generated schema, dist output, and `third_party/codex` are protected. This work does not require editing them.

## Architecture / Boundary Findings

`examples/local-react-vite` is the correct home for deterministic fixture and visual QA behavior. It should not become a hosted product example or own runtime policy.

The ideal split is:

- Agent UI-owned: React components, layout primitives, controllers, example fixture state, route manifest, Playwright contracts, docs, maintainer skills.
- Host-owned: custom workflow routing, auth, credentials, persistence, process lifecycle, workspace admission, deployment.
- Example-only: route pages, local fixture CSS, screenshot capture glue.
- Docs-only: browser verification and screenshot guidance.
- Release-sensitive: public exports, stylesheet import contract, package validation, public `skills/agent-ui`.
- Protected: `third_party/codex`, generated schema, dist output.

## Validation / CI Findings

Current tests do not fully cover tablet widths, embedded narrow containers, route inventory drift, or docs screenshot route drift. They also do not prevent fake closeups from representing obsolete component states.

The redesign needs a validation matrix across desktop, wide, tablet, compact, mobile, and short viewports. Required behavioral assertions include no document overflow, submit button bottom-right alignment, icon-only compaction, menu/sheet containment, focus return, approval hit targets, route readiness, and no stale route inventory.

`bun run validate:packages` remains required if public package output or exports change.

## Existing Skill / Command Findings

Maintainer skills should be updated:

- `.agents/skills/browser-qa`: require visual QA route inventory, tablet/narrow evidence, overflow/hit/focus checks, and fixture versus real-local separation.
- `.agents/skills/example-authoring`: require real primitives in fixture routes, local CSS only, token-backed examples, and docs/test updates.
- `.agents/skills/agent-ui-review`: add static fixture drift and responsive component review prompts.
- `.agents/skills/release-validation`: include fixture visual QA readiness when visual surfaces change.
- `.agents/skills/agent-ui-feature-planning`: ensure future plans capture visual QA and fixture drift prevention.

Public `skills/agent-ui` should receive only host-facing validation guidance. It should not teach maintainers to run private fixture routes or repo-specific Playwright commands.

## Web / Current-State Findings

Playwright audit results:

- At `390px`, the current composer usually reaches icon-only controls and submit remains near bottom-right.
- At `700px`, labels remain visible in narrow layouts and submit can drift far from the right edge on `/`, `/fixture-gallery`, `/rich-transcript`, `/host-workflow-recipe`, `/scoped-thread-pane`, and `/?state=empty`.
- `/composer-retry` visibly renders raw probe text such as `0`, `none`, `0`, and `Retry failed first message`.
- `/fixture-gallery` contains obsolete `Inputs · selects · segmented` styling and closeups that do not match the current run settings or working-directory design.
- Tablet widths can clip header/account controls.
- `/app-connectors` can initially render blank/incomplete until manual refresh.
- `/usage-only` uses dates stale relative to 2026-06-22.

Representative screenshot evidence exists under `/tmp/agent-ui-audit-root-700.png`, `/tmp/agent-ui-audit-fixture-gallery-700.png`, and `/tmp/agent-ui-audit-composer-retry-390.png`.

## Freshness / Staleness Findings

Docs changed since the planning skill's last full research baseline, especially validation and package exports. The implementation plan must rely on current docs inspected in this run.

Fixture staleness is not limited to docs. Route metadata, docs screenshot capture, Playwright route lists, and gallery UI can all drift independently today.

## Generated / Vendored / Protected File Findings

No generated schema or vendored Codex files need edits for this work.

Do not edit:

- `third_party/codex/**`
- generated schema outputs
- `dist/**`
- package build artifacts

If implementation discovers a protocol mismatch, stop and use the upstream sync workflow instead of hand-editing generated files.

## Risks

- A container-aware layout mode can split if CSS and React behavior use different thresholds.
- Public hosts may already override private `.aui-*` selectors; no-backcompat is acceptable for unshipped example behavior, but public stylesheet guidance must remain clear.
- One large visual redesign can become hard to review if phase boundaries are not enforced.
- Docs and skills can overfit to internal fixture routes if public and maintainer guidance are not kept separate.
- Screenshot churn can mask behavioral regressions if screenshots become the primary contract.

## Decisions

- Keep `examples/local-react-vite` as the single deterministic fixture app.
- Add a typed visual QA manifest as the source of truth for route inventory, gallery, docs screenshots, and e2e coverage.
- Fix real React components first; use fixture-gallery as evidence, not as fake UI.
- Replace viewport-only compact logic with container-aware layout modes.
- Make composer submit placement a component invariant.
- Remove or rebuild fake closeups and obsolete static controls.
- Update docs, maintainer skills, public skill guidance, and tests in the same implementation.
- Execute implementation phase-first with focused validation and review evidence per phase.

## Rejected Approaches

- Reject a quick CSS-only patch for the submit button. It would leave route drift, fake closeups, and missing tablet coverage.
- Reject a separate fixture-gallery app. It would duplicate setup and increase drift.
- Reject screenshot-only visual QA. It is review evidence, not a stable behavioral contract.
- Reject public skill instructions that mention maintainer-only fixture routes and commands.
- Reject compatibility shims for obsolete unshipped fixture designs.

## Remaining Unknowns

- Exact threshold values for `wide`, `tablet`, `compact`, and `tight` should be finalized during implementation with measured screenshots.
- Whether public React exports need any new component or hook for layout mode is not yet known; prefer internal implementation unless a public need emerges.
- The final route manifest shape should be validated against e2e and screenshot capture needs before broad route rewrites.
- Some observed blank/incomplete route behavior may be fixture-state timing rather than component behavior; implementation should isolate it before fixing.
