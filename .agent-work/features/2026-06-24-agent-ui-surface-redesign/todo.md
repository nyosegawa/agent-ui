# Agent UI Surface Redesign Todo

## Status Summary

- Planning status: complete on branch.
- Implementation status: in progress; P001 and P002 implemented, validated, reviewed, committed, pushed, and followed through to CI success. P003 implemented, validated, and reviewed; commit/push evidence pending.
- Planning branch: reuse `codex/fixture-system-redesign-plan`.
- Compatibility stance: no backwards compatibility.
- Required review stance: every implementation phase must run four parallel subagent reviews after focused validation and before phase commit.

## Branch And Planning Commit

- Branch: `codex/fixture-system-redesign-plan`
- Planning commit: `0194146` (`Plan Agent UI surface redesign`).
- Remote: `origin/codex/fixture-system-redesign-plan`
- Push result: P001 pushed to `origin/codex/fixture-system-redesign-plan`.
- Blockers: none known before artifact validation.

## Phase Checklist

- P001 Protocol classification and Codex adapter boundary - implemented, validated, reviewed, committed, and pushed.
- P002 Core runtime state, reducers, selectors, and view-state contract - implemented, validated, reviewed, committed, pushed, and CI-successful.
- P003 React view models, direct-link controller, and raw-free components - implemented, validated, and reviewed; commit/push pending.
- P004 Default composer, turn controls, retry, and neutral integrations
- P005 Run policy, model/effort, cwd, and host-boundary controls
- P006 Showcase and maintainer gallery foundation
- P007 React export subpaths, package contracts, examples, and public skill API guidance
- P008 Cross-docs, screenshots, release readiness, PR, and CI

## Task Checklist By Phase

- [x] P001 Protocol classification and Codex adapter boundary
  - Goal: classify Codex App Server runtime status, input, request, and policy semantics before core/React redesign depends on them.
  - Scope: codex normalizers, `protocol.ts`, request builders, protocol docs/tests, method classification, generated-schema usage only.
  - Expected files/areas: `packages/codex/src/protocol.ts`, `packages/codex/src/normalizers/**`, `packages/codex/src/request-builders.ts`, `packages/codex/test/**`, `docs/reference/codex-protocol.md`.
  - Validation: protocol tests, request-builder tests, capability/method classification tests, docs checks touching protocol docs.
  - Review: after validation, spawn four parallel subagents: protocol/core correctness and invariants; phase boundary/order/coupling/validation completeness; React API/package exports/docs/examples; browser-visible UX/transcript/mobile/real-local.
  - Commit: commit only after P1/P2 review findings are fixed in phase; only P3/nonblocking follow-ups may be deferred with owner and later phase.
  - Push: push phase commit to `origin/codex/fixture-system-redesign-plan`.
  - PR/CI: update PR status if one exists; record CI if triggered.
  - Evidence:
    - Implementation: Added stable server-request role metadata and guards in `packages/codex/src/protocol.ts`; changed Codex server-request normalization to classify only stable request methods; recognized generated structured thread runtime status in the Codex normalizer before legacy core projection; added `textInput(text, { textElements })`; updated Codex protocol and package export docs; updated Codex API snapshots.
    - Validation: `bun run test:protocol` passed; `bun run typecheck` passed; `bun run validate:protocol` passed; `bun run lint` passed; `bun run test:api-snapshots` passed after intentional update; `bun run validate:packages` passed; `bun run test:package-resolution` passed. Browser QA not run for P001 because no React, CSS, fixture route, or real-local bridge UI changed; browser-visible validation is scheduled for P003-P006.
    - Review: Four parallel subagent reviews completed. Protocol/core lane found no P1/P2 and one P3 drift note, addressed by typing the internal runtime-status helper from generated `ThreadStatus`/`ThreadActiveFlag`. Phase-boundary lane found P2 missing `validate:packages`, fixed by running and passing that gate. React/API/docs lane found P2 stale package export docs and over-public runtime-status API wording, fixed by updating docs, keeping runtime status internal, and refreshing snapshots. Browser/UX lane found no P1/P2 and recommended no browser QA for P001.
    - Commit: `0798db0` (`Classify Codex protocol requests`).
    - Push: pushed `0798db0` to `origin/codex/fixture-system-redesign-plan`; PR #35 is open at https://github.com/nyosegawa/agent-ui/pull/35.
    - PR/CI: PR #35 detected CI and Compatibility runs for the pushed implementation commit; final CI status must be followed after the evidence commit is pushed.
  - Tasks:
    - [x] T001 Preserve upstream thread status active flags in codex normalizers.
      - Expected files/areas: `packages/codex/src/normalizers/shared.ts`, protocol tests.
      - Validation note: protocol tests no longer expect active flags collapsed to `waitingForInput`.
    - [x] T002 Classify server request methods without turning all requests into approvals.
      - Expected files/areas: `packages/codex/src/protocol.ts`, `packages/codex/src/normalizers/server-requests.ts`, protocol docs/tests.
      - Validation note: approval-only helpers remain distinct from broad response/reject flows; dynamic tool calls are not retained as normal pending approvals.
    - [x] T003 Preserve text elements in input request contracts.
      - Expected files/areas: codex request builders and protocol tests.
      - Validation note: mention/text elements round-trip without React inventing App/Plugin semantics.
    - [x] T004 Document stable, experimental, and host-only protocol surfaces.
      - Expected files/areas: `docs/reference/codex-protocol.md`.
      - Validation note: App/plugin picker and marketplace UX are explicitly host-owned.

- [x] P002 Core runtime state, reducers, selectors, and view-state contract
  - Goal: implement runtime state invariants and raw-free core view selectors after protocol semantics are proven.
  - Scope: core state, reducers, selectors, retention/fixtures, core docs/tests, core snapshots if needed.
  - Expected files/areas: `packages/core/src/**`, `packages/core/test/**`, `test/api-snapshots/core__index.d.ts`, core docs if public.
  - Validation: reducer/selector tests, core public surface tests, API snapshots if core exports change.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit only after P1/P2 review findings are fixed in phase; only P3/nonblocking follow-ups may be deferred with owner and later phase.
  - Push: push phase commit.
  - PR/CI: record validation and CI status.
  - Evidence:
    - Implementation: Added first-class core thread runtime state with structured runtime status, active flags, active turn, last turn result, runtime-derived activity, pending server-request overlay, raw-free thread summary/transcript/approval/server-request selectors, and request waiting reasons. Codex thread normalizers now pass structured runtime status into core for thread start/status/read/list events and normalize archived list rows from their effective status. React composer submit/disabled state now follows runtime-derived `thread.activity`, including standalone `AgentComposer` approval-blocked display. Local fixtures and examples now include required runtime state and expose public core selector usage. The visible `Composer · App + Plugin mentions` debug closeup was removed from the main fixture gallery pending the P004 neutral integration redesign.
    - Validation: `bun test packages/core/test/reducer.test.ts` passed; `bun run validate:protocol` passed; `bun x vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx` passed; `bun run typecheck` passed; `bun run lint` passed; `bun run --cwd examples/local-react-vite typecheck` passed; `bun run --cwd examples/local-react-vite build` passed; `bun run test:e2e:fixtures` passed with 145 passed and 1 skipped screenshot refresh; `bun run validate:packages` passed; `bun run test:api-snapshots` passed; `bun run test:package-resolution` passed; targeted real-local e2e passed with 17 tests across `real-local-layout`, `real-local-follow-ups`, and `real-local-thread-lifecycle`.
    - Browser QA: agent-browser checked `http://127.0.0.1:5174/fixture-gallery` desktop with overflowX 0, `Composer · App + Plugin mentions` absent after the fix, normal composer App/Plugin button counts both 0, and screenshots `/tmp/agent-ui-p002-fixture-gallery-after-fixes-desktop.png` and `/tmp/agent-ui-p002-fixture-gallery-no-app-plugin-desktop.png`; checked `http://127.0.0.1:5174/rich-transcript` mobile 390x900 with overflowX 0, approval and Send button hit-tests all true, and screenshot `/tmp/agent-ui-p002-rich-transcript-after-fixes-mobile.png`; checked `http://127.0.0.1:5174/composer-retry` mobile with overflowX 0, `Failed first message` visible, and screenshot `/tmp/agent-ui-p002-composer-retry-after-fixes-mobile.png`. Remaining risk: App/Plugin public props still exist until P004 deletes/replaces that API surface; fixture-gallery no longer presents them as normal composer UI.
    - Review: Four parallel phase reviews completed. Phase-boundary lane found evidence/browser-QA recording gaps, fixed by running and recording browser and validation evidence. React/API/docs lane found standalone `AgentComposer` did not surface approval-blocked state and fixture-gallery still taught obsolete App/Plugin mention concepts; fixed with standalone composer disabled notice/test, removal of App/Plugin mention resolvers from visible composer closeups, and updated e2e. Protocol/core lane found failed/error runtime activity regression, archived active list rows remaining active, hidden dynamic-tool requests driving waiting state, and raw-free selector coverage gaps; fixed with runtime normalization changes and reducer/protocol tests. Browser/UX lane found no P1/P2 and required targeted real-local e2e, which passed. Re-review closed protocol/core and React/API/docs P1/P2 findings; one subagent-local visual-closeups rerun hit a server-exit flake, but the main-agent full `bun run test:e2e:fixtures` rerun passed afterward.
    - Commit: `3829ef5` (`Add core runtime view state`) plus CI fix `cd456f9` (`Update thread history runtime expectations`).
    - Push: pushed through `cd456f9` to `origin/codex/fixture-system-redesign-plan`; PR #35 updated. CI/Compatibility for `cd456f9` succeeded: API snapshots, Detect changes, Detect compatibility changes, Lint, Node.js 22.x, Node.js 24.x, Package resolution, Package validation, Playwright fixtures, Protocol and fixtures, Repository policy, Typecheck, Unit tests, and pnpm workspace smoke all passed.
  - Tasks:
    - [x] T001 Add runtime status model with active flags, active turn, and last turn result.
      - Expected files/areas: `packages/core/src/state/thread.ts`, reducers, selectors.
      - Validation note: reducer tests cover active, idle, waiting flags, failed/interrupted/completed turns.
    - [x] T002 Stop server requests from mutating thread status directly.
      - Expected files/areas: `packages/core/src/reducer/server-requests.ts`, request selectors.
      - Validation note: multi-request and host-seeded queue tests prove no unconditional running fallback.
    - [x] T003 Add request summary and execution-state selectors.
      - Expected files/areas: `packages/core/src/selectors.ts`, core tests.
      - Validation note: waiting reason distinguishes approval, user input, permission, auth, MCP elicitation, attestation, unknown, and non-visual/internal request kinds.
    - [x] T004 Add raw-free core view selectors for thread summary, transcript, approvals, and server requests.
      - Expected files/areas: core selectors/types/tests.
      - Validation note: selectors do not require React to inspect raw reducer entities.

- [x] P003 React view models, direct-link controller, and raw-free components
  - Goal: move React hooks/components to core view models and preserve direct-link live-session open/resume outside default routing.
  - Scope: headless controllers, transcript components, replacement maps, direct-link controller/recipe, React tests, real-local routing/lifecycle validation, docs owned by hooks/components.
  - Expected files/areas: `packages/react/src/hooks/**`, `packages/react/src/components/**`, `packages/react/src/timeline.tsx`, `examples/codex-local-web/**`, `docs/reference/hooks.md`, `docs/reference/react-components.md`.
  - Validation: React unit tests, source-structure tests, `examples/codex-local-web` typecheck/build, relevant real-local Playwright spec for direct-link read/resume.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after all P1/P2 review items are fixed and checked.
  - Push: push phase commit.
  - PR/CI: record validation and CI status.
  - Evidence:
    - Implementation: Converted `AgentMessageList`, `AgentThreadHeader`, `AgentThreadTimeline`, transcript rendering, item renderers, and preset component replacement contracts to consume transcript/thread view models instead of raw `ThreadState`/`TurnState` component props. Removed the legacy `components.Item` replacement from `AgentComponents`; customization now uses `renderItem(entry, Default)` and `components.blocks`. Added `useAgentDirectThreadController()` for `thread/read` preview and direct-link `thread/read` + `thread/resume` open semantics, and rewired `threadUrlRouting` to use it. Added raw-free `AgentTranscriptEntry`/`AgentTranscriptItem` contracts, expanded core transcript block view fields needed by command/tool/file rendering, added raw-free thread `displayStatus`, preserved preview availability for loaded stored sessions, and kept internal `.codex/sessions/*.jsonl` paths out of user-facing cwd display. Updated local Vite and recipe examples, React docs, hooks docs, theming docs, package export docs, and API snapshots.
    - Validation: `bun run typecheck` passed; `bun x vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx` passed; `bun x vitest run --config vitest.config.ts packages/core/test/reducer.test.ts packages/react/test/components.vitest.tsx packages/react/test/source-structure.vitest.ts packages/react/test/thread-url-routing.vitest.ts packages/react/test/thread-resume-diagnostics.vitest.tsx` passed with 289 tests; focused fixed-thread completed-status test passed; `bun run test:api-snapshots:update && bun run test:api-snapshots` passed; `bun run validate:packages` passed; `bun run test:package-resolution` passed; `bunx playwright test examples/local-react-vite/e2e/visual-route-matrix.e2e.ts --config playwright.fixtures.config.ts` passed with 62 tests; `bunx playwright test examples/codex-local-web/e2e/real-local-layout.e2e.ts --config playwright.real-local.config.ts` passed with 4 tests.
    - Browser QA: agent-browser checked `http://127.0.0.1:5174/fixture-gallery` desktop with document overflow 0 and visible component/preset sections; checked `http://127.0.0.1:5174/composer-retry` mobile 390x900 with document overflow 0 and retry fixture text visible. Remaining risk: `composer-retry` still presents debug explanatory copy and belongs in the P004/P006 fixture-gallery split/redesign; it is not treated as final user-facing UI.
    - Review: Four parallel P003 subagent reviews completed. Phase-boundary lane found stale API snapshots and missing P003 evidence; fixed by updating/checking API snapshots and recording this evidence. Protocol/core lane found core `selectThreadTranscriptView` dropped newly exposed block fields; fixed by copying the full `AgentTranscriptBlockView` field set and asserting preservation. Browser/UX lane found `AgentThreadTimeline` hook-order risk when `threadId` appears later and completed threads falling through to Ready; fixed by keeping hook order stable and adding raw-free `displayStatus` with a completed-status assertion. React/API/docs lane found stale theming/react docs referring to `Item` and `AgentItemBlock`; fixed by documenting `blocks`, `renderItem(entry, Default)`, and `AgentTranscriptBlock`.
    - Commit:
    - Push:
  - Tasks:
    - [x] T001 Convert hooks and transcript components from raw `ThreadState`/`TurnState` to view models.
      - Expected files/areas: hooks, thread/timeline components, tests.
      - Validation note: public React snapshot no longer exposes raw reducer state through component props.
    - [x] T002 Remove or convert legacy `components.Item` raw-state override.
      - Expected files/areas: `chat.tsx`, component docs, tests.
      - Validation note: replacement map cannot receive `AgentItemState`/`TurnState`.
    - [x] T003 Extract direct-link open/resume semantics from `threadUrlRouting`.
      - Expected files/areas: headless controller/hook, route recipe docs, real-local tests.
      - Validation note: tests prove `thread/read` + `thread/resume` and canonical returned ID activation still work without default-owned routing.
    - [x] T004 Update hook/component docs for raw-free contracts.
      - Expected files/areas: `docs/reference/hooks.md`, `docs/reference/react-components.md`.
      - Validation note: docs include view-model shapes and direct-link composition recipe.

- [ ] P004 Default composer, turn controls, retry, and neutral integrations
  - Goal: replace App/Plugin-specific composer concepts while preserving host extensibility and transcript-first turn controls.
  - Scope: composer, attachments, neutral integrations, stop/queue/steer/retry, first-message retry, i18n, CSS, component tests, visual e2e.
  - Expected files/areas: `packages/react/src/components/**`, `packages/react/src/hooks/**`, `packages/react/src/styles/**`, `examples/local-react-vite/**`, `docs/reference/react-components.md`, API snapshots if public types change.
  - Validation: React component tests, API snapshots if changed, composer retry e2e, visual layout/approvals/accessibility e2e, real-local follow-up tests if affected.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record route/e2e status.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Add neutral composer integrations returning explicit `AgentUserInput`.
      - Expected files/areas: composer model, hooks, tests.
      - Validation note: integration chips send explicit input and preserve follow-up queue order.
    - [ ] T002 Delete App/Plugin composer props, buttons, chip kinds, CSS variants, and tests after neutral path lands.
      - Expected files/areas: chat/thread/composer props, attachments, mentions, CSS, tests.
      - Validation note: no `onRequestAppMention`/`onRequestPluginMention` in React public API.
    - [ ] T003 Preserve `AgentTextInput.text_elements` through React input conversion.
      - Expected files/areas: `packages/react/src/hooks/turn-input.ts`, tests.
      - Validation note: tests prove inline text elements survive.
    - [ ] T004 Redesign composer retry as public UX plus maintainer diagnostics.
      - Expected files/areas: showcase/probe routes and tests.
      - Validation note: failed first message, failed active follow-up, text elements, attachment chips, queue order, no duplicate follow-ups, keyboard reachability, focus return, and no public debug explanatory copy are covered.
    - [ ] T005 Lock composer send/stop placement.
      - Expected files/areas: composer CSS, visual e2e.
      - Validation note: send/stop is bottom-right pinned and hit-testable on desktop and mobile; policy/model compact controls are validated in P005.

- [ ] P005 Run policy, model/effort, cwd, and host-boundary controls
  - Goal: replace Run settings panel with protocol-backed policy/model controls and starter-only cwd.
  - Scope: run settings hooks/components, request composition, starter cwd, host policy docs, compact controls, real-local layout.
  - Expected files/areas: `packages/react/src/hooks/run-settings.ts`, `packages/react/src/components/run-settings.tsx`, `packages/react/src/components/starter-cwd.tsx`, docs, tests, visual e2e.
  - Validation: run-settings unit tests, React component tests, visual layout e2e, browser/mobile hit-test coverage, real-local layout/follow-up tests if affected.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record validation status.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Replace `AGENT_EXECUTION_MODES` primary model with typed `AgentRunPolicy`.
      - Expected files/areas: hooks/types/tests.
      - Validation note: host-supplied allowed policies and default policy are tested.
    - [ ] T002 Split policy menu from model/effort controls.
      - Expected files/areas: components, CSS, tests.
      - Validation note: compact triggers are icon-sized and menus stay viewport-contained.
    - [ ] T003 Keep cwd starter/thread-start only and remove freeform normal composer cwd controls.
      - Expected files/areas: `starter-cwd`, run settings panel removal, docs.
      - Validation note: tests prove cwd does not appear in normal composer.
    - [ ] T004 Test first-message merge order and model default effort behavior.
      - Expected files/areas: run settings and start-thread tests.
      - Validation note: `startThreadWithInput()` merges thread/turn options correctly.
    - [ ] T005 Rerun send/stop pinning evidence after policy/model layout changes.
      - Expected files/areas: visual e2e and browser QA evidence.
      - Validation note: desktop/mobile hit-test, focus, overflow, and menu containment are recorded.

- [ ] P006 Showcase and maintainer gallery foundation
  - Goal: introduce the route split as the browser-visible proving ground and update route docs/skills in the same phase.
  - Scope: route registry, manifest schema, showcase routes, maintainer gallery, closeups/probes/specimens, route/e2e docs, public skill route leakage tests.
  - Expected files/areas: `examples/local-react-vite/src/**`, `examples/local-react-vite/e2e/**`, `docs/guides/browser-verification.md`, `docs/architecture/testing.md`, `docs/examples/local-react-vite.md`, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
  - Validation: local Vite typecheck/build, manifest tests, route matrix e2e, focused browser QA, `bun run test:skills`.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review fixes.
  - Push: push phase commit.
  - PR/CI: record route/e2e status.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Create route registry and move public examples under `/showcase/*`.
      - Expected files/areas: `examples/local-react-vite/src/routes/showcase/**`.
      - Validation note: each showcase route has ready selector and viewport coverage.
    - [ ] T002 Move closeups, probes, specimens, and previews under `/maintainer-gallery`.
      - Expected files/areas: `examples/local-react-vite/src/routes/maintainer-gallery/**`.
      - Validation note: maintainer gallery is not selected for docs screenshots.
    - [ ] T003 Update manifest schema with `audience`, `kind`, `ownerSpecs`, `viewports`, and docs screenshot eligibility.
      - Expected files/areas: `visual-qa-manifest.ts`, manifest tests.
      - Validation note: schema tests reject ambiguous route entries.
    - [ ] T004 Add waiting-label states to visual QA.
      - Expected files/areas: fixtures, e2e, sidebar/mobile drawer states.
      - Validation note: all user-visible waiting labels are readable and aligned on desktop/mobile; non-visual/internal request kinds do not surface as approval labels.
    - [ ] T005 Update public skill/docs route guidance and forbidden maintainer terms.
      - Expected files/areas: `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`, route docs.
      - Validation note: public skill forbids `/maintainer-gallery`, closeup/probe/specimen maintainer language, and repo-only QA commands.

- [ ] P007 React export subpaths, package contracts, examples, and public skill API guidance
  - Goal: freeze root/primitives/headless exports after composer and run-policy public surfaces are in place.
  - Scope: React barrels, tsup entries, package exports, API snapshots, runtime export policy, package docs, web components, example imports, public skill API guidance.
  - Expected files/areas: `packages/react/src/**`, `packages/react/package.json`, `packages/react/tsup.config.ts`, `packages/web-components/src/**`, `examples/**`, `docs/reference/package-exports.md`, `test/api-snapshots/**`, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
  - Validation: `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`, affected example builds, `bun run test:skills`.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record package validation and CI status.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Split root, `./primitives`, and `./headless` React entrypoints.
      - Expected files/areas: barrels, `package.json`, `tsup.config.ts`.
      - Validation note: API snapshots and package resolution include each public subpath.
    - [ ] T002 Keep `AgentChat` as the root preset name and remove `AgentWorkspace` from default public API.
      - Expected files/areas: React exports, docs, examples.
      - Validation note: root docs and public skill teach `AgentChat`; product shells remain example/host code.
    - [ ] T003 Update web component and examples to import from correct public subpaths.
      - Expected files/areas: `packages/web-components`, `examples/**`.
      - Validation note: affected examples build/typecheck.
    - [ ] T004 Update package export docs and public skill API guidance in the same phase.
      - Expected files/areas: `docs/reference/package-exports.md`, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
      - Validation note: docs/skill match API snapshot names and subpath imports.

- [ ] P008 Cross-docs, screenshots, release readiness, PR, and CI
  - Goal: finish cross-cutting docs/skills/screenshots and prove release readiness after phase-local contracts are already updated.
  - Scope: architecture/guides/examples docs, repo-local skills, docs screenshots, final validation, PR/CI.
  - Expected files/areas: `docs/**`, `.agents/skills/**`, `docs/screenshots/**`, final validation evidence.
  - Validation: `bun run validate:fast`, `bun run validate:packages`, `bun run validate:release`, `bun run test:e2e:fixtures`, `bun run test:repo-skills`, `bun run test:skills`, plus real-local e2e if touched.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: final fixes commit if needed.
  - Push: push final branch.
  - PR/CI: create/update PR and follow Actions to success or concrete failure.
  - Evidence:
    - Implementation:
    - Validation:
    - Review:
    - Commit:
    - Push:
  - Tasks:
    - [ ] T001 Rewrite cross-cutting architecture/guides/examples docs.
      - Expected files/areas: `docs/architecture/overview.md`, `docs/guides/**`, `docs/examples/**`.
      - Validation note: docs route names and import examples match implementation.
    - [ ] T002 Update repo-local planning/review/browser QA skills.
      - Expected files/areas: `.agents/skills/**`.
      - Validation note: `bun run test:repo-skills` passes.
    - [ ] T003 Refresh docs screenshots only from showcase routes if intentionally changed.
      - Expected files/areas: `docs/screenshots/**`.
      - Validation note: screenshot capture command and diffs are recorded.
    - [ ] T004 Run full validation and follow PR CI.
      - Expected files/areas: validation and CI evidence in this todo.
      - Validation note: CI success or concrete failure is recorded.

## Implementation Notes

- Do not edit `third_party/codex/**`.
- Do not hand-edit generated schema in `packages/codex/src/generated/**`.
- Do not preserve deprecated public APIs for compatibility.
- Keep `AgentChat` as the root preset name.
- Prefer deletion of wrong concepts over aliases, but land replacement paths before deleting host extensibility hooks.
- If a phase becomes too large, split the phase before implementation and keep review/validation/commit boundaries phase-first.
- Docs/tests/examples/snapshots owned by a phase must be updated in that phase.

## Validation Evidence

Planning artifact validation:

- Passed with `node .agents/skills/agent-ui-feature-planning/scripts/validate-artifacts.mjs .agent-work/features/2026-06-24-agent-ui-surface-redesign`.

Implementation validation:

- P001 passed protocol/typecheck/lint/API snapshot/package validation/package resolution before commit.
- P002 passed reducer/core fixtures, protocol, React component tests, full unit tests, typecheck, lint, local Vite typecheck/build, fixture e2e, package validation, API snapshots, package resolution, targeted real-local e2e, and agent-browser route checks before commit/push; PR #35 CI for `cd456f9` passed all required CI and Compatibility checks.
- P003 passed React/core/source/direct-link tests, typecheck, API snapshots, package validation, package resolution, fixture visual matrix, real-local layout matrix, and agent-browser route overflow checks before commit.

Browser-visible evidence checklist for phases that touch browser-visible behavior:

- P002 routes: `/fixture-gallery`, `/rich-transcript`, `/composer-retry`.
- P002 viewports: desktop fixture-gallery; mobile 390x900 rich-transcript and composer-retry.
- P002 command/spec: `bun run test:e2e:fixtures`; targeted real-local Playwright specs; agent-browser route checks.
- P002 manual or agent-browser interaction: agent-browser open/eval/screenshot for overflow, visible status, closeup removal, and hit-testing.
- P002 hit-test/focus/overflow result: overflowX 0 on checked routes; rich-transcript mobile approval and Send hit-tests true; normal fixture-gallery composer has 0 App buttons and 0 Plugin buttons.
- P002 screenshot or trace path: `/tmp/agent-ui-p002-fixture-gallery-after-fixes-desktop.png`, `/tmp/agent-ui-p002-fixture-gallery-no-app-plugin-desktop.png`, `/tmp/agent-ui-p002-rich-transcript-after-fixes-mobile.png`, `/tmp/agent-ui-p002-composer-retry-after-fixes-mobile.png`.
- P002 remaining risk: App/Plugin public props remain until P004 removes/replaces that API surface; fixture-gallery no longer presents them as normal composer UI.
- P003 routes: `/fixture-gallery`, `/composer-retry`, plus real-local layout stored-thread route coverage from Playwright.
- P003 viewports: fixture-gallery desktop; composer-retry mobile 390x900; Playwright fixture matrix desktop/wide/tablet/compact/mobile/short as defined by the manifest; real-local desktop/mobile.
- P003 command/spec: visual-route-matrix Playwright, real-local-layout Playwright, agent-browser open/snapshot/eval checks.
- P003 manual or agent-browser interaction: agent-browser open/snapshot/eval for overflow and visible retry/gallery content.
- P003 hit-test/focus/overflow result: overflow 0 on checked fixture-gallery desktop and composer-retry mobile routes.
- P003 screenshot or trace path: not captured; deterministic Playwright matrix and agent-browser snapshots/eval were used for this phase.
- P003 remaining risk: composer-retry and debug fixture copy remain intentionally non-final until P004/P006 remove or split debug-only gallery surfaces.

## Review Evidence

Planning research:

- 4 parallel subagents x 5 rounds requested.
- Rounds 1-5 completed during planning research.
- Round 5 corrections incorporated.

Implementation phase review rule:

- Each phase must run four parallel subagent reviews after focused validation.
- Fixed lanes: protocol/core correctness and state invariants; phase boundary, ordering, coupling, and validation completeness; React API/package exports/docs/examples; browser-visible UX, transcript-first behavior, mobile, and real-local integration.

## Commit Log

- Planning commit: `0194146` (`Plan Agent UI surface redesign`).
- Implementation commits: P001 `0798db0` (`Classify Codex protocol requests`), P001 evidence `a2d31f3` (`Record P001 redesign evidence`), P002 `3829ef5` (`Add core runtime view state`), P002 CI fix `cd456f9` (`Update thread history runtime expectations`).

## Final Checklist

- [x] Round 5 draft review completed.
- [x] Artifact validator passed.
- [x] Planning commit created.
- [x] Planning branch pushed.
- [x] Implementation started after explicit approval.
