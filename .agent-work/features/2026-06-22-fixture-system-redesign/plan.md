# Fixture System Redesign Plan

## Summary

Redesign Agent UI's fixture and visual QA system so the visible examples, component behavior, tests, docs, and maintainer skills all describe the same current product reality. This is a full-quality redesign, not a temporary fix for the currently reported routes.

## Background

Current browser-visible failures include raw probe output on `/composer-retry`, obsolete `Inputs · selects · segmented` closeups, weak working-directory controls, labels visible in narrow composer layouts, submit buttons drifting away from the lower-right corner, tablet header overflow, and unfinished fixture routes.

These failures come from multiple sources: viewport-only responsive rules, fake closeup DOM, duplicated route metadata, stale screenshot targets, incomplete route contracts, and skills/docs that do not yet require visual QA drift prevention.

## Current State

`examples/local-react-vite` is the deterministic fixture app, but its route inventory is spread across `src/main.tsx`, `src/fixtures/gallery.ts`, Playwright specs, screenshot capture code, and docs.

The composer and run settings rely on viewport breakpoints around `640px`. This fails for tablet and embedded narrow containers. The submit button is part of wrapping toolbar layout instead of a fixed composer placement invariant.

`fixture-gallery` mixes real component states with hand-built static UI. Some closeups preserve older Agent UI designs rather than testing the current components.

## Goals

- Make current Agent UI components responsive and visually coherent across desktop, tablet, compact, mobile, embedded narrow, and short viewports.
- Guarantee composer submit placement at the lower-right of the composer surface.
- Make review/model/cwd controls compact to icon-only or menu/sheet forms before layout breaks.
- Convert fixture routes and closeups into a deterministic visual QA system backed by real primitives and typed route metadata.
- Remove raw probe text, fake component closeups, obsolete static controls, stale dates, and unfinished route states.
- Strengthen Playwright, browser QA guidance, docs, and skills so the same class of drift is caught later.

## Non-Goals

- Do not turn Agent UI into a hosted app runtime.
- Do not add host-owned auth, persistence, process lifecycle, deployment, workspace policy, or billing behavior to core.
- Do not edit `third_party/codex`, generated schema, or dist output.
- Do not create pixel-perfect screenshot baselines as the main CI contract.
- Do not make private `.aui-*` selectors a public host contract.
- Do not preserve obsolete fixture-gallery layouts for backward compatibility.

## Repo-Specific Constraints

- Use Bun for package operations and validation.
- Read and follow `AGENTS.md`, `docs/architecture/product-boundary.md`, `docs/architecture/testing.md`, and `docs/maintenance/ci-cd.md`.
- Keep public package exports and stylesheet behavior release-safe.
- Update docs and skills alongside behavior changes.
- Run focused browser-visible validation for layout, hit testing, focus, scrolling, and overflow.
- Use the same branch, `codex/fixture-system-redesign-plan`, for planning and implementation.

## Design Decisions

Decision 1: keep one deterministic fixture app.

`examples/local-react-vite` remains the single fixture app. It gets a typed visual QA manifest with route id, path, category, purpose, ready selector, viewport contract, docs screenshot flag, and owning spec.

Decision 2: make real components the source of visual truth.

`fixture-gallery` becomes a real component state catalog. Fake DOM closeups, obsolete native select/input examples, and iframe-based component substitutions are removed or rebuilt from public primitives, controllers, and fixture state.

Decision 3: move from viewport-only to container-aware layout.

Agent UI layout behavior should use container-aware modes such as `wide`, `tablet`, `compact`, and `tight`. CSS container queries handle visual layout. React measurement is reserved for behavior that must choose drawer, sheet, or menu interactions.

Decision 4: make composer submit placement invariant.

The composer uses a stable layout structure where the textarea owns the main row, run settings and secondary status occupy flexible areas, and submit occupies a dedicated lower-right cell. Wrapping controls must not displace the submit button.

Decision 5: treat screenshots as review evidence.

Playwright asserts route readiness, no overflow, hit targets, focus return, menu/sheet containment, route inventory, and component behavior. Screenshots remain useful for PR review and docs but are not the primary CI oracle.

Decision 6: separate maintainer and public skill guidance.

Repository skills may reference fixture routes, Playwright specs, and maintainer commands. Public `skills/agent-ui` should only describe host-facing validation and composition guidance.

## Impacted Areas

- Agent UI-owned: `packages/react/src/components/**`, `packages/react/src/styles/**`, React tests, controller behavior if needed.
- Example-only: `examples/local-react-vite/src/**`, route manifest, closeups, fixture state, local CSS, Playwright fixture specs.
- Docs-only: `docs/architecture/testing.md`, `docs/guides/browser-verification.md`, `docs/examples/local-react-vite.md`, `docs/screenshots/README.md`, repository skill docs.
- Release-sensitive: `packages/react/src/index.ts`, public stylesheet import behavior, API snapshots, package exports, `skills/agent-ui`.
- Host-owned: host workflow/auth/persistence/process/workspace/deployment guidance only; no core implementation.
- Protected: `third_party/codex/**`, generated schema, dist output.

## Validation Plan

Start with targeted checks while iterating:

```bash
bun install --frozen-lockfile
bun run validate:fast
bun run test:styles
bunx vitest run packages/react/test/components.vitest.tsx packages/react/test/composer-submit-semantics.vitest.ts packages/react/test/source-structure.vitest.ts
bun run --cwd examples/local-react-vite typecheck
bun run --cwd examples/local-react-vite build
bun run test:e2e:fixtures
bun run test:repo-skills
bun run test:skills
bunx vitest run test/docs-staleness.test.ts test/package-scripts-docs.test.ts
```

Use focused Playwright specs for route inventory, visual layout, closeups, composer retry, scoped thread lists, design-system contract, and accessibility contract.

Run real-local checks when component changes affect the real Codex example:

```bash
AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 AGENT_UI_CODEX_CWD="$PWD" bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
bun run test:e2e:real-local
bun run test:e2e:real-local-web-layout
```

Run package validation if public exports, stylesheet package contents, or release-sensitive files change:

```bash
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
```

Finish with broad validation appropriate to the final diff:

```bash
bun run validate:release
bun run validate:e2e
```

## Commit, PR, And CI Plan

Implement phase-first. Each phase should be reviewable and commit-worthy on its own unless a phase must be split for safety. Push the branch and open a PR after all phases pass local validation.

Before claiming readiness, inspect GitHub Actions for the pushed branch or PR and report concrete success or failure.

Planning commit status is recorded in `todo.md`. The implementation should update `todo.md` with phase evidence as work proceeds.

## Risks

- Thresholds for layout modes can become another hidden contract if not tested across embedded widths.
- Route manifest migration can miss old route references in docs or screenshot scripts.
- Public skill updates can accidentally leak maintainer-only workflow.
- CSS changes can affect downstream hosts that rely on private selectors, even though those selectors are not public API.
- Large visual changes can be hard to review without phase commits and browser evidence.

## Completion Criteria

- All reported failures are fixed: `/composer-retry`, `fixture-gallery`, `Inputs · selects · segmented`, working directory design, review/model compaction, and submit lower-right placement.
- Fixture routes use current Agent UI components and no obsolete fake closeups remain.
- Tablet, compact, mobile, embedded narrow, desktop, and short viewport contracts pass.
- Route manifest is the source of truth for route inventory, gallery, screenshots, and e2e coverage.
- Docs and maintainer skills reflect the new visual QA workflow.
- Public `skills/agent-ui` includes only host-facing validation guidance.
- Focused and broad validations pass or any remaining failure is documented with a clear blocker.
- PR and CI status are inspected before the work is called ready.

## Open Questions

- Exact layout thresholds should be set after implementation screenshots at representative container widths.
- It may be possible to keep layout mode fully internal; add public API only if implementation proves it necessary.
- The final manifest schema should be kept minimal until route, screenshot, and e2e consumers are wired.
- Some fixture routes may be better deleted than redesigned if they no longer represent a durable visual contract.
