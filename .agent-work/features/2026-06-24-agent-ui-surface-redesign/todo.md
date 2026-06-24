# Agent UI Surface Redesign Todo

## Status Summary

- Planning status: complete on branch.
- Implementation status: in progress; P001 through P005 implemented, validated, reviewed, committed, pushed, and followed through to CI success. P006 implemented, validated, reviewed, committed, and pushed; CI evidence is being recorded.
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
- P003 React view models, direct-link controller, and raw-free components - implemented, validated, reviewed, committed, pushed, and CI-successful.
- P004 Default composer, turn controls, retry, and neutral integrations - implemented, validated, reviewed, committed, and pushed.
- P005 Run policy, model/effort, cwd, and host-boundary controls - implemented, validated, reviewed, committed, pushed, and CI-successful.
- P006 Showcase and maintainer gallery foundation - implemented, validated, reviewed, committed, and pushed.
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
    - Commit: `a858fe0` (`Move React transcript APIs to view models`), CI fix `36eabc5` (`Update loaded history preview expectation`), and API snapshot fix `6e5cb3b` (`Update core API snapshot for thread display status`).
    - Push: pushed through `6e5cb3b` to `origin/codex/fixture-system-redesign-plan`; PR #35 updated. CI and Compatibility for `6e5cb3b` succeeded. CI passed Detect changes, Package resolution, Playwright fixtures, Repository policy, Protocol and fixtures, Unit tests, Typecheck, API snapshots, Package validation, and Lint. Compatibility passed Detect compatibility changes.
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

- [x] P004 Default composer, turn controls, retry, and neutral integrations
  - Goal: replace App/Plugin-specific composer concepts while preserving host extensibility and transcript-first turn controls.
  - Scope: composer, attachments, neutral integrations, stop/queue/steer/retry, first-message retry, i18n, CSS, component tests, visual e2e.
  - Expected files/areas: `packages/react/src/components/**`, `packages/react/src/hooks/**`, `packages/react/src/styles/**`, `examples/local-react-vite/**`, `docs/reference/react-components.md`, API snapshots if public types change.
  - Validation: React component tests, API snapshots if changed, composer retry e2e, visual layout/approvals/accessibility e2e, real-local follow-up tests if affected.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record route/e2e status.
  - Evidence:
    - Implementation: Deleted the App/Plugin composer mention API and helper module, replaced it with neutral `composerIntegrations` that must resolve explicit `AgentUserInput`, converted composer/follow-up attachment kinds from App/Plugin to integration, preserved `AgentTextInput.text_elements`, added default failed first-message retry UI with live status semantics, moved retry fixture explanation into maintainer diagnostics, kept integration labels visible on narrow screens, and kept send/stop bottom-right hit-testable in checked mobile evidence. Package export docs changed in P004 because public composer types changed; P007 subpath/export freezing remains later.
    - Validation: `bun x vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx --testNamePattern "composer integration|retried first message|failed first messages|Retry message"` passed with 7 tests; `bun x vitest run --config vitest.config.ts packages/react/test/source-structure.vitest.ts` passed with 24 tests; `bun run validate:fast` passed with 61 files and 686 tests; `bun run build && bun run test:api-snapshots:update && bun run test:api-snapshots && bun run test:package-resolution` passed; `bun run validate:packages` passed; `bunx playwright test examples/codex-local-web/e2e/real-local-layout.e2e.ts --config playwright.real-local.config.ts` passed with 4 tests; fixture matrix initially had one `unauthenticated-first-run` mobile ready-selector timeout, the focused rerun passed, and the full rerun `bun run test:e2e:clean-ports && bunx playwright test examples/local-react-vite/e2e/composer-retry.e2e.ts examples/local-react-vite/e2e/visual-route-matrix.e2e.ts --config playwright.fixtures.config.ts` passed with 63 tests.
    - Review: Four parallel P004 subagent reviews completed. Phase-boundary lane found missing evidence and requested broader coverage; fixed by recording this evidence and covering failed retry, explicit integration input, text elements, attachment chips/input order, no duplicate retry, invalid integration rejection, and retry cancel behavior. Protocol/core lane found invalid JS resolver output could add bad attachments and retry cancellation could leave retried first messages in progress; fixed with runtime input validation, warning behavior, `item/failed` restoration on cancel, and component tests. React/API/docs lane found package export docs grouped integration types under resource resolution; fixed by documenting them with composer controller types. Browser/UX lane found mobile integration buttons were indistinguishable and failed cards were not live-announced; fixed by preserving integration labels on narrow screens and adding `role="status"`/`aria-live="polite"`.
    - Commit: `Redesign composer integrations and retry` phase commit.
    - Push: push phase commit to `origin/codex/fixture-system-redesign-plan`.
  - Tasks:
    - [x] T001 Add neutral composer integrations returning explicit `AgentUserInput`.
      - Expected files/areas: composer model, hooks, tests.
      - Validation note: integration chips send explicit input and preserve follow-up queue order.
    - [x] T002 Delete App/Plugin composer props, buttons, chip kinds, CSS variants, and tests after neutral path lands.
      - Expected files/areas: chat/thread/composer props, attachments, mentions, CSS, tests.
      - Validation note: no `onRequestAppMention`/`onRequestPluginMention` in React public API.
    - [x] T003 Preserve `AgentTextInput.text_elements` through React input conversion.
      - Expected files/areas: `packages/react/src/hooks/turn-input.ts`, tests.
      - Validation note: tests prove inline text elements survive.
    - [x] T004 Redesign composer retry as public UX plus maintainer diagnostics.
      - Expected files/areas: showcase/probe routes and tests.
      - Validation note: failed first message, failed active follow-up, text elements, attachment chips, queue order, no duplicate follow-ups, keyboard reachability, focus return, and no public debug explanatory copy are covered.
    - [x] T005 Lock composer send/stop placement.
      - Expected files/areas: composer CSS, visual e2e.
      - Validation note: send/stop is bottom-right pinned and hit-testable on desktop and mobile; policy/model compact controls are validated in P005.

- [x] P005 Run policy, model/effort, cwd, and host-boundary controls
  - Goal: replace Run settings panel with protocol-backed policy/model controls and starter-only cwd.
  - Scope: run settings hooks/components, request composition, starter cwd, host policy docs, compact controls, real-local layout.
  - Expected files/areas: `packages/react/src/hooks/run-settings.ts`, `packages/react/src/components/run-settings.tsx`, `packages/react/src/components/starter-cwd.tsx`, docs, tests, visual e2e.
  - Validation: run-settings unit tests, React component tests, visual layout e2e, browser/mobile hit-test coverage, real-local layout/follow-up tests if affected.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record validation status.
  - Evidence:
    - Implementation: Replaced the public execution-mode model with `AgentRunPolicy`, `DEFAULT_AGENT_RUN_POLICIES`, `AGENT_FULL_ACCESS_RUN_POLICY`, `agentRunPolicyTurnOptions`, provider-supplied `runPolicies`, and `defaultRunPolicyId`; renamed core `RunSettingsState.executionMode` to `policyId`; removed `AgentRunSettingsPanel`/`ComposerRunSettings` compatibility aliases; split composer run controls into a policy menu and combined model/effort menu; removed normal-composer cwd editing and public `setCwd`; kept cwd selection inside `AgentStarterCwd` and `thread/start`; stopped implicitly resending cwd on normal, resumed, and retry `turn/start`; made dangerous full-access host opt-in instead of a default policy; added policy-state normalization for stale/empty host policy lists; updated i18n, docs, examples, e2e labels, CSS, and API snapshots.
    - Validation: `bun x vitest run --config vitest.config.ts packages/react/test/run-settings.vitest.ts packages/react/test/components.vitest.tsx --testNamePattern "run polic|working-directory|working directory|startThreadWithInput|selected model and working directory|Model and effort|Run policy|first-message"` passed with 8 tests; `bun x vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx` passed with 198 tests; `bun x vitest run --config vitest.config.ts packages/react/test/source-structure.vitest.ts packages/react/test/i18n.vitest.ts` passed with 27 tests; `bun run validate:fast` passed with 61 files and 689 tests; `bun run build && bun run test:api-snapshots:update && bun run test:api-snapshots` passed; `bun run test:api-snapshots` passed after package-resolution rebuild; `bun run validate:packages` passed; `bun run test:package-resolution` first failed because it was run concurrently with `validate:packages` and Next reported another build process, then passed when rerun alone; `bun run test:e2e:clean-ports && bunx playwright test examples/local-react-vite/e2e/smoke.e2e.ts examples/local-react-vite/e2e/design-system-contract.e2e.ts examples/local-react-vite/e2e/accessibility-contract.e2e.ts examples/local-react-vite/e2e/visual-layout.e2e.ts examples/local-react-vite/e2e/visual-closeups.e2e.ts examples/local-react-vite/e2e/visual-route-matrix.e2e.ts --config playwright.fixtures.config.ts` passed with 111 tests; `bunx playwright test examples/codex-local-web/e2e/real-local-layout.e2e.ts examples/codex-local-web/e2e/real-local-follow-ups.e2e.ts --config playwright.real-local.config.ts` passed with 8 tests.
    - Browser QA: Agent-browser checked latest dev server `http://127.0.0.1:5177/fixture-gallery` at 1280x633 and `http://127.0.0.1:5177/` at 390x900. Desktop fixture-gallery run policy menu had overflow `0`, no `Run settings panel` text, selected `Review` segment with selected background, no default `Full access`, and menu containment true; screenshot `/tmp/agent-ui-p005-fixture-gallery-desktop-after-review.png`. Mobile baseline had overflow `0`, policy/model buttons 36x36, send button 36x36 pinned to composer bottom-right, menu containment true, and no default `Full access`; screenshot `/tmp/agent-ui-p005-mobile-default-after-review.png`. Remaining browser risk: route split and public/maintainer gallery separation are still P006.
    - Review: Four parallel P005 subagent reviews completed. Protocol/core lane found stale/disallowed policy ids could remain in public state and `runPolicies={[]}` rendered defaults but applied no policy; fixed by provider/effective-policy normalization, safe fallback tests, and consistent turn option resolution. Phase-boundary lane found implicit cwd still sent on normal/resumed/retry `turn/start`, dangerous full access was default, public `setCwd` remained, and evidence was missing; fixed by removing implicit turn cwd, making full access opt-in, internalizing starter cwd dispatch, adding negative cwd assertions, and recording evidence. React/API/docs lane found empty-policy inconsistency and underdocumented provider policy API; fixed with provider docs, hook docs, package export docs, and tests. Browser/UX lane found selected policy segments had `aria-checked` but CSS only styled `aria-pressed`; fixed selector styling and verified with agent-browser.
    - Commit: `Redesign run policy controls` phase commit.
    - Push: push phase commit to `origin/codex/fixture-system-redesign-plan`.
  - Tasks:
    - [x] T001 Replace `AGENT_EXECUTION_MODES` primary model with typed `AgentRunPolicy`.
      - Expected files/areas: hooks/types/tests.
      - Validation note: host-supplied allowed policies and default policy are tested.
    - [x] T002 Split policy menu from model/effort controls.
      - Expected files/areas: components, CSS, tests.
      - Validation note: compact triggers are icon-sized and menus stay viewport-contained.
    - [x] T003 Keep cwd starter/thread-start only and remove freeform normal composer cwd controls.
      - Expected files/areas: `starter-cwd`, run settings panel removal, docs.
      - Validation note: tests prove cwd does not appear in normal composer.
    - [x] T004 Test first-message merge order and model default effort behavior.
      - Expected files/areas: run settings and start-thread tests.
      - Validation note: `startThreadWithInput()` merges thread/turn options correctly.
    - [x] T005 Rerun send/stop pinning evidence after policy/model layout changes.
      - Expected files/areas: visual e2e and browser QA evidence.
      - Validation note: desktop/mobile hit-test, focus, overflow, and menu containment are recorded.

- [x] P006 Showcase and maintainer gallery foundation
  - Goal: introduce the route split as the browser-visible proving ground and update route docs/skills in the same phase.
  - Scope: route registry, manifest schema, showcase routes, maintainer gallery, closeups/probes/specimens, route/e2e docs, public skill route leakage tests.
  - Expected files/areas: `examples/local-react-vite/src/**`, `examples/local-react-vite/e2e/**`, `docs/guides/browser-verification.md`, `docs/architecture/testing.md`, `docs/examples/local-react-vite.md`, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
  - Validation: local Vite typecheck/build, manifest tests, route matrix e2e, focused browser QA, `bun run test:skills`.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review fixes.
  - Push: push phase commit.
  - PR/CI: record route/e2e status.
  - Evidence:
    - Implementation: Split the fixture surface into a public showcase index at `/`, public example routes under `/showcase/*`, and a maintainer-only gallery at `/maintainer-gallery`; removed old `/fixture-gallery` compatibility routing and renamed gallery CSS from `fixture-gallery` to `route-gallery`. Added manifest `audience`, `kind`, `ownerSpecs`, and explicit `docsScreenshot` eligibility; made docs screenshots derive from public showcase routes only; removed the obsolete fixture-gallery screenshot files. Updated maintainer gallery ordering so component close-ups and state diagnostics are separate from public iframe previews. Added user-visible waiting labels for approval, permission, input, MCP input, authentication, attestation, and mixed/unknown attention states; carried waiting reasons through core thread views and sidebar/mobile drawer metadata; kept the shared waiting formatter private to React internals. Updated docs, README, route e2e, browser QA skill references, example-authoring skill references, and public skill leakage tests so public guidance does not present maintainer routes as normal user-facing examples.
    - Validation: `bun run --cwd examples/local-react-vite typecheck` passed; `bun run --cwd examples/local-react-vite build` passed; `bun run test:skills` passed; `bun run test:repo-skills` passed; `bunx playwright test examples/local-react-vite/e2e/visual-qa-manifest.e2e.ts --config playwright.fixtures.config.ts` passed with 18 tests; `bun run typecheck` passed; `bun run lint` passed; `bun run validate:fast` passed with 61 files and 691 tests after review fixes; `bun x vitest run --config vitest.config.ts packages/react/test/components.vitest.tsx --testNamePattern "thread waiting status labels|waiting|approval"` passed with 19 tests; `bun run test:api-snapshots:update && bun run test:api-snapshots` passed; `bun run test:package-resolution && bun run validate:packages` passed; `bun run test:e2e:clean-ports && bunx playwright test examples/local-react-vite/e2e/visual-closeups.e2e.ts examples/local-react-vite/e2e/visual-route-matrix.e2e.ts --config playwright.fixtures.config.ts --grep "maintainer gallery mobile|public showcase index"` passed with 5 tests; final single-run `bun run test:e2e:fixtures` passed with 152 passed and 1 skipped after an earlier parallel-build interference failure was rerun cleanly.
    - Browser QA: agent-browser checked `http://127.0.0.1:5176/` desktop with heading `Agent UI showcase`, 12 public showcase links, zero maintainer links, overflow 0, and screenshot `/tmp/agent-ui-p006-showcase-index-desktop.png`; checked `http://127.0.0.1:5176/maintainer-gallery` mobile with heading `Agent UI maintainer gallery`, 27 closeups, all waiting labels visible, overflow 0, and screenshot `/tmp/agent-ui-p006-maintainer-gallery-mobile.png`; checked `http://127.0.0.1:5176/showcase/rich-transcript` desktop with status/notice `Needs attention`, approval count 1, send hit-test true, overflow 0, and screenshot `/tmp/agent-ui-p006-rich-transcript-desktop.png`. Remaining browser risk: agent-browser mobile viewport was supplemented by Playwright mobile route matrix coverage.
    - Review: Four parallel P006 subagent reviews completed. Protocol/core lane found missing real waiting-label runtime mapping coverage and a stale maintainer selector; fixed with private formatter tests, core waiting reasons on `AgentThreadView`, sidebar metadata propagation, selector existence checks, and updated route-gallery selector. Phase-boundary lane found the same stale selector, accidental public `formatThreadWaitingStatus` export/API snapshot drift, and blank evidence; fixed by moving the helper to a private module, refreshing API snapshots, recording validation evidence, and keeping maintainer routes out of public docs. React/API/docs lane found `/maintainer-gallery` promoted in public docs and the private formatter leaking through the React barrel; fixed by removing maintainer-gallery from public quickstart/package route lists and private helper relocation. Browser/UX lane found missing `/` showcase index viewport coverage, sidebar waiting rows falling back to generic attention without waiting reasons, and masked empty-selector viewport checks; fixed with public index viewport tests, `waitingReasons` propagation, and selector existence assertions.
    - Commit: `27521a4` (`Split showcase and maintainer gallery`).
    - Push: pushed through `759780a` to `origin/codex/fixture-system-redesign-plan`; PR #35 updated.
  - Tasks:
    - [x] T001 Create route registry and move public examples under `/showcase/*`.
      - Expected files/areas: `examples/local-react-vite/src/routes/showcase/**`.
      - Validation note: each showcase route has ready selector and viewport coverage.
    - [x] T002 Move closeups, probes, specimens, and previews under `/maintainer-gallery`.
      - Expected files/areas: `examples/local-react-vite/src/routes/maintainer-gallery/**`.
      - Validation note: maintainer gallery is not selected for docs screenshots.
    - [x] T003 Update manifest schema with `audience`, `kind`, `ownerSpecs`, `viewports`, and docs screenshot eligibility.
      - Expected files/areas: `visual-qa-manifest.ts`, manifest tests.
      - Validation note: schema tests reject ambiguous route entries.
    - [x] T004 Add waiting-label states to visual QA.
      - Expected files/areas: fixtures, e2e, sidebar/mobile drawer states.
      - Validation note: all user-visible waiting labels are readable and aligned on desktop/mobile; non-visual/internal request kinds do not surface as approval labels.
    - [x] T005 Update public skill/docs route guidance and forbidden maintainer terms.
      - Expected files/areas: `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`, route docs.
      - Validation note: public skill forbids `/maintainer-gallery`, closeup/probe/specimen maintainer language, and repo-only QA commands.

- [x] P007 React export subpaths, package contracts, examples, and public skill API guidance
  - Goal: freeze root/primitives/headless exports after composer and run-policy public surfaces are in place.
  - Scope: React barrels, tsup entries, package exports, API snapshots, runtime export policy, package docs, web components, example imports, public skill API guidance.
  - Expected files/areas: `packages/react/src/**`, `packages/react/package.json`, `packages/react/tsup.config.ts`, `packages/web-components/src/**`, `examples/**`, `docs/reference/package-exports.md`, `test/api-snapshots/**`, `skills/agent-ui/**`, `test/agent-ui-skill.test.ts`.
  - Validation: `bun run test:api-snapshots`, `bun run test:package-resolution`, `bun run validate:packages`, affected example builds, `bun run test:skills`.
  - Review: after validation, spawn four parallel subagents using the fixed lanes in P001.
  - Commit: commit after review remediation.
  - Push: push phase commit.
  - PR/CI: record package validation and CI status.
  - Evidence:
    - Implementation: split `@nyosegawa/agent-ui-react` into root preset, `./primitives`, and `./headless`; removed `AgentWorkspace` component/CSS public surface; split `AgentShell` into a primitive module; updated examples, docs, API snapshots, runtime/package-resolution policies, and serialized root build order so package builds finish before examples consume package dist CSS.
    - Validation: `bun run typecheck` passed; `bun run test:api-snapshots:update && bun run test:api-snapshots` passed; `bun run validate:fast` passed with 61 files and 691 tests; `bun run test:package-resolution` passed and resolved `@nyosegawa/agent-ui-react`, `@nyosegawa/agent-ui-react/headless`, `@nyosegawa/agent-ui-react/primitives`, and `styles.css`; `bun run validate:packages` passed including build, packlist, Node compatibility, publint, and attw.
    - Review: 4 parallel subagent phase reviews completed. P2 findings fixed in-phase: stale `package-exports.md` root resource/composer guidance moved to `headless`/`primitives`; stale "no React root exports removed" wording corrected; root `useAgentContext`/`useAgentAction` leak removed and negative root export assertion added; P007 validation evidence recorded. No P1 findings remained.
    - Commit: current P007 phase commit (`Split React public export surfaces`).
    - Push: pushed `6d9b0f9` to `codex/fixture-system-redesign-plan` (`82c19e1..6d9b0f9`).
  - Tasks:
    - [x] T001 Split root, `./primitives`, and `./headless` React entrypoints.
      - Expected files/areas: barrels, `package.json`, `tsup.config.ts`.
      - Validation note: API snapshots and package resolution include each public subpath; runtime policy guards root, headless, and primitives representative exports.
    - [x] T002 Keep `AgentChat` as the root preset name and remove `AgentWorkspace` from default public API.
      - Expected files/areas: React exports, docs, examples.
      - Validation note: root docs teach `AgentChat`; `AgentWorkspace` component and workspace CSS were removed; product shells remain host/examples code.
    - [x] T003 Update web component and examples to import from correct public subpaths.
      - Expected files/areas: `packages/web-components`, `examples/**`.
      - Validation note: affected examples typecheck and build through `validate:packages`.
    - [x] T004 Update package export docs and public skill API guidance in the same phase.
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
- P004 passed focused React/source tests, `validate:fast`, build/API snapshots/package resolution, package validation, fixture retry and visual route matrix, real-local layout matrix, and agent-browser route checks before commit.

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
- P004 routes: `/composer-retry`, fixture visual route matrix, and real-local first-run/stored-thread layout routes.
- P004 viewports: composer-retry mobile 390x900 by agent-browser; fixture matrix desktop/wide/tablet/compact/mobile/short as defined by the manifest; real-local desktop/mobile.
- P004 command/spec: focused React tests, source-structure test, `bun run validate:fast`, package validation, API snapshots, package resolution, composer-retry Playwright, visual-route-matrix Playwright, real-local-layout Playwright, and agent-browser route checks.
- P004 manual or agent-browser interaction: agent-browser opened `http://127.0.0.1:5174/composer-retry`, submitted a first message that failed once, inspected the default failed card, verified retry button focus/hit-test and send bottom-right hit-test, clicked retry, and confirmed failed card removal without horizontal overflow.
- P004 hit-test/focus/overflow result: mobile composer-retry overflowX 0, retry hit-test true, send hit-test true, send pinned bottom/right true; after retry, failed cards 0, failed messages 0, in-progress message 1, overflowX 0.
- P004 screenshot or trace path: `/tmp/agent-ui-p004-composer-retry-failed-mobile.png`, `/tmp/agent-ui-p004-composer-retry-after-retry-mobile.png`.
- P004 remaining risk: policy/model/cwd compact controls are intentionally left for P005, and gallery split/debug-vs-user showcase remains for P006.

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
- P004 phase commit: `Redesign composer integrations and retry`.
- Implementation commits: P001 `0798db0` (`Classify Codex protocol requests`), P001 evidence `a2d31f3` (`Record P001 redesign evidence`), P002 `3829ef5` (`Add core runtime view state`), P002 CI fix `cd456f9` (`Update thread history runtime expectations`), P003 `a858fe0` (`Move React transcript APIs to view models`), P003 CI fix `36eabc5` (`Update loaded history preview expectation`), P003 API snapshot fix `6e5cb3b` (`Update core API snapshot for thread display status`).

## Final Checklist

- [x] Round 5 draft review completed.
- [x] Artifact validator passed.
- [x] Planning commit created.
- [x] Planning branch pushed.
- [x] Implementation started after explicit approval.
