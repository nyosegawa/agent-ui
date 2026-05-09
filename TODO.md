# TODO

This checklist is the execution source of truth for Agent UI.

## Active Completion Gate: Deterministic Multi-Turn E2E

Real Codex browser continuation was verified manually on 2026-05-10. The same
core behavior should be protected by the deterministic fake stdio App Server
Playwright gate so ordinary CI catches regressions.

### Fake Stdio Continuation

- [x] Make the fake stdio App Server emit unique turn/item ids for repeated `turn/start` calls.
- [x] Add a browser WebSocket Playwright test that sends two turns in the same thread.
- [x] Assert the composer re-enables and the app has no horizontal overflow after the second turn.

### Completion Hygiene

- [x] Update testing docs for deterministic multi-turn browser coverage.
- [x] Run targeted validation, commit, push, and watch Actions.

## Completed Gate: Multi-Turn Browser Continuation Smoke

The composer must recover after a completed real Codex turn so users can keep
working in the same thread instead of being forced to create a new session.

### Browser Continuation

- [x] Start a new real local browser thread through `http://127.0.0.1:5174/`.
- [x] Send a first real Codex turn and wait for assistant text plus non-running completion.
- [x] Send a second real Codex turn in the same thread after completion.
- [x] Verify the composer is enabled after the second turn and the page has no horizontal overflow.

## Active Completion Gate: Sidebar Structure Hardening

The real history sidebar now exhausts stored Codex sessions, which means the
sidebar must remain structurally stable when loading, error, empty, pagination,
and large-list states appear or disappear.

### Sidebar Layout

- [x] Replace implicit sidebar grid rows with explicit header, search, feedback, and scrollable-list regions.
- [x] Keep status, error, and pagination controls outside the thread-list scroll container.
- [x] Add component coverage proving history controls, counts, pagination, and list rows remain reachable together.

### Completion Hygiene

- [x] Update component/testing docs for the hardened sidebar structure.
- [x] Run targeted validation, commit, push, and watch Actions.

## Active Completion Gate: Full Validation Sweep

The real local app now passes targeted UI, history, and browser checks. This
gate verifies the complete package and app surface after the latest state and
pagination changes.

### Required Validation

- [x] Run `bun run typecheck`.
- [x] Run `bun run lint`.
- [x] Run `bun test`.
- [x] Run `bun run build`.
- [x] Run `bun run test:protocol`.
- [x] Run `bun run test:fixtures`.
- [x] Run `bun run publint`.
- [x] Run `bun run attw`.
- [x] Run `bun run check:exports`.
- [x] Run `bun run test:e2e:playwright`.
- [x] Run `bun run test:node-compat`.

### Completion Hygiene

- [x] Fix any failures from the full sweep.
- [x] Update docs if validation scope or known limits changed.
- [x] Commit, push, and watch Actions.

## Active Completion Gate: Real History Exhaustion

Real App Server verification on 2026-05-10 showed `Load all` loaded 525 threads
but still reported `more available` because the UI capped the action at 20
pages. A button labeled `Load all` must either actually exhaust the cursor or
clearly say that it only loads a batch.

### History Exhaustion

- [x] Make `Load all` follow real `thread/list` cursors until exhaustion, with a repeated-cursor guard instead of a fixed page cap.
- [x] Re-run real `Load all` against the local Codex App Server and verify the sidebar reaches `all loaded`.
- [x] Keep deterministic tests for multi-page cursor exhaustion.

### Completion Hygiene

- [x] Update docs for cursor exhaustion behavior.
- [x] Run targeted validation, commit, push, and watch Actions.

## Active Completion Gate: Preview Versus Ready Thread UX

Real browser verification on 2026-05-10 showed that a stored `thread/read`
preview and a newly started empty thread were both shown as `Preview`, and the
preview composer remained enabled even though the thread had not been resumed.
The product must make the sendability of a thread explicit.

### Thread Sendability

- [x] Show newly started or resumed sendable threads as `Ready`, not `Preview`.
- [x] Keep stored history previews read-only until the user resumes the thread.
- [x] Hide the `Resume` action for a sendable empty thread.
- [x] Add React tests for preview read-only state and ready new-thread state.
- [x] Re-run real browser turn verification after the UX fix.

### Completion Hygiene

- [x] Update docs for preview/readiness behavior.
- [x] Run targeted validation, commit, push, and watch Actions.

## Active Completion Gate: Header And Composer Layout Hardening

The 2026-05-10 in-app browser audit found that the real-session thread header
could let `Resume` and `New thread` actions crowd into the message timeline at
narrow widths. This gate is complete only after the header, message list, and
composer have explicit non-overlap contracts in CSS, tests, docs, and browser
inspection.

### Header Action Layout

- [x] Make the thread title and thread actions use explicit layout regions so action buttons never overlap the message timeline.
- [x] Add browser-level assertions for thread-header/action/message-list non-overlap at narrow widths.
- [x] Re-check the real local browser screen after the patch, including console diagnostics.

### Completion Hygiene

- [x] Update docs for the non-overlap layout contract.
- [x] Keep lint independent from Playwright's transient `test-results` directory.
- [x] Run targeted validation, commit, push, and watch Actions.

## Completed Gate: Real Session UX Repair

This section was a release gate. The product-grade gate below proved
the protocol path, package quality, Markdown rendering, and scroll containment,
but the live browser audit on 2026-05-10 found additional real-session UX issues
that must be fixed before the local web app can be called finished.

### Real Session Metadata

- [x] Prefer real App Server `cwd` over internal Codex session `path` when normalizing `thread/list`, `thread/read`, `thread/resume`, and `thread/start` payloads.
- [x] Keep internal `.codex/sessions/*.jsonl` paths out of thread subtitles and working-directory suggestions unless no user-facing cwd exists.
- [x] Browser-check real persisted sessions to verify working directory appears in the thread header and run settings.

### Narrow Layout Polish

- [x] Make run settings compact on narrow screens so model/effort/mode/cwd controls do not crush the message timeline.
- [x] Keep the message timeline, composer, and history list independently usable at narrow width with the composer anchored in the chat surface.
- [x] Add/adjust unit and Playwright assertions for compact run settings, usable message-list height, and real cwd preservation.

### Completion Hygiene

- [x] Update docs with the final real-session metadata and narrow-layout behavior.
- [x] Run targeted validation for this repair slice, then commit and push.
- [x] Re-run the real local browser screen check after the patch.

## Completed Gate: Thread History Completion

This section was a release gate. Real local sessions now render
correctly, but the history browser still needs product-grade controls for
larger real Codex histories.

### History Browsing

- [x] Show user-facing working directory context in thread list rows when available.
- [x] Add a bounded `Load all` flow that follows real `thread/list` cursors until history is exhausted.
- [x] Show visible history count and remaining-pagination state without relying on raw protocol cursors.
- [x] Browser-check mobile history pagination controls are fully reachable without relying on document scroll.

### Tests And Docs

- [x] Add React tests for cwd metadata in history rows and multi-page `Load all`.
- [x] Update component/testing docs for the completed history browser behavior.
- [x] Run targeted validation, browser/e2e checks, commit, push, and watch Actions.
- [x] Re-run real Codex stdio, command-approval, and file-change approval smoke after history/mobile repairs.

## Completed Gate: Product-Grade Local Codex UX

This section was the previous release gate. The previous release gates proved the
protocol path and package quality, but the finished product is not complete
until this section is complete with implementation, browser inspection, tests,
docs, commits, pushes, and GitHub Actions checks.

### App Server Coverage Audit

- [x] Re-audit `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` stable capabilities against Agent UI.
- [x] Classify supported, intentionally host-only, deferred, and unsupported App Server methods in `docs/protocol.md`.
- [x] Ensure unsupported App Server notifications degrade into readable diagnostics or neutral timeline entries instead of raw JSON walls.

### Conversation Experience

- [x] Render user and assistant messages as safe Markdown with lists, code blocks, links, headings, quotes, and tables where applicable.
- [x] Keep command output, diffs, approvals, reasoning, and plan updates in contextual turn activity without overwhelming conversation reading.
- [x] Verify real persisted sessions with long Markdown and command-heavy turns remain readable at narrow and desktop widths.

### App Shell Layout

- [x] Give the history sidebar and active thread independent scroll containers; do not depend on whole-page scroll for normal use.
- [x] Keep the composer visible at the bottom of the chat surface while history scrolls.
- [x] Add a collapsible history sidebar that remains usable and accessible.
- [x] Ensure mobile/narrow layouts keep chat, history, approvals, and composer reachable without horizontal overflow.

### Working Directory UX

- [x] Preserve and display working directory for persisted `thread/list`, hydrated `thread/read`, resumed, and newly started threads.
- [x] Improve working-directory selection using recent real thread paths instead of an empty bare input.
- [x] Keep internal JSONL/session paths hidden from default history labels while real project paths remain visible.

### Product Polish, Tests, And Docs

- [x] Browser-check all primary screens after each UI refactor using the in-app browser.
- [x] Add or update React/unit/e2e tests for Markdown rendering, scroll containment, sidebar collapse, and cwd preservation.
- [x] Update docs for the final information architecture, App Server coverage, Markdown security, and UX constraints.
- [x] Re-run full validation and GitHub Actions after this gate is complete.

## Repository Setup

- [x] Create `nyosegawa/agent-ui`.
- [x] Clone repository with `ghq`.
- [x] Add top-level `README.md`.
- [x] Add top-level `AGENTS.md`.
- [x] Add top-level `TODO.md`.
- [x] Add MIT license.
- [x] Add initial docs.
- [x] Set Bun as the primary package manager.
- [x] Add `.editorconfig`.
- [x] Add TypeScript base config.
- [x] Add shared package build config.
- [x] Add CI workflow.
- [x] Add package validation workflow.
- [x] Add release workflow skeleton.

## Documentation

- [x] Write product scope.
- [x] Write package structure.
- [x] Write architecture.
- [x] Write protocol integration plan.
- [x] Write authentication plan.
- [x] Write toolchain baseline.
- [x] Write testing strategy.
- [x] Write security model.
- [x] Write roadmap.
- [x] Add local quickstart.
- [x] Add Codex App Server transport guide.
- [x] Add device-code login guide.
- [x] Add remote deployment guide.
- [x] Add protocol drift guide.
- [x] Add theming guide.
- [x] Add component API reference.
- [x] Add headless hooks reference.

## Toolchain

- [x] Verify Bun latest before dependency lock-in.
- [x] Add `bun.lock`.
- [x] Add TypeScript.
- [x] Add Vitest.
- [x] Add React test tooling.
- [x] Add Playwright.
- [x] Add ESLint.
- [x] Add Prettier.
- [x] Add Changesets.
- [x] Add package validation with `publint`.
- [x] Add package validation with `arethetypeswrong`.
- [x] Add optional Node.js LTS compatibility CI.
- [x] Add optional pnpm compatibility smoke test.

## Packages

- [x] Create `packages/core`.
- [x] Create `packages/codex`.
- [x] Create `packages/react`.
- [x] Create `packages/server`.
- [x] Create shared package export conventions.
- [x] Create shared tsconfig conventions.
- [x] Create shared test conventions.

## Core Package

- [x] Define normalized event model.
- [x] Define request/response abstraction.
- [x] Define transport interface.
- [x] Define session state types.
- [x] Define thread state types.
- [x] Define turn state types.
- [x] Implement reducer.
- [x] Implement selectors.
- [x] Implement pending server request state.
- [x] Implement fake transport.
- [x] Implement fixture runner.
- [x] Add reducer invariant tests.

## Codex Package

- [x] Add Codex App Server schema import script.
- [x] Vendor stable generated schema.
- [x] Vendor experimental generated schema behind opt-in.
- [x] Record Codex upstream commit metadata.
- [x] Implement JSON-RPC-lite message framing.
- [x] Implement request id correlation.
- [x] Implement stdio transport.
- [x] Implement initialize handshake.
- [x] Implement server request response handling.
- [x] Implement App Server notification normalization.
- [x] Implement device-code login helpers.
- [x] Implement optional websocket transport.
- [x] Add protocol method snapshot tests.

## React Package

- [x] Implement `AgentProvider`.
- [x] Implement `useAgentThread`.
- [x] Implement `useAgentThreadHistory` for `thread/list` pagination and search.
- [x] Implement `useAgentThreadReader` for `thread/read` preview/history hydration.
- [x] Implement `useAgentTurn`.
- [x] Implement `useAgentApprovals`.
- [x] Implement `useAgentComposer`.
- [x] Implement `useAgentAuth`.
- [x] Implement `AgentChat`.
- [x] Implement `AgentComposer`.
- [x] Implement `AgentMessageList`.
- [x] Implement persisted session browser UI.
- [x] Implement thread preview/read UI without resuming.
- [x] Implement `AgentWorkLog`.
- [x] Implement `AgentApprovalPrompt`.
- [x] Implement `AgentDiffViewer`.
- [x] Implement `AgentStatusBar`.
- [x] Implement `AgentRunControls` for execution mode, model, and reasoning effort.
- [x] Implement `AgentUsage` for account rate-limit windows.
- [x] Implement `ThreadList`.
- [x] Implement `ThreadSidebar`.
- [x] Add CSS variables.
- [x] Add slot/render prop customization.
- [x] Add accessibility tests for interactive components.
- [x] Add accessibility tests for run controls, usage, and history UI.

## Server Package

- [x] Implement Codex App Server process spawning.
- [x] Implement local bridge lifecycle.
- [x] Implement bridge error handling.
- [x] Implement stderr log forwarding.
- [x] Implement safe process shutdown.
- [x] Add Next.js Route Handler helpers.
- [x] Add Express middleware.
- [x] Add token redaction utilities.
- [x] Add server package tests with fake child process.

## Fixtures

- [x] Add handshake fixture.
- [x] Add account device-code login fixture.
- [x] Add thread start fixture.
- [x] Add text turn fixture.
- [x] Add streaming agent message fixture.
- [x] Add reasoning summary fixture.
- [x] Add plan update fixture.
- [x] Add command execution fixture.
- [x] Add command approval fixture.
- [x] Add file change fixture.
- [x] Add file change approval fixture.
- [x] Add interrupted turn fixture.
- [x] Add failed turn fixture.
- [x] Add rate-limit update fixture.

## Examples

- [x] Add local React + Vite example.
- [x] Add real Codex local web app example.
- [x] Add Next.js local bridge example.
- [x] Add websocket remote demo.
- [x] Add custom component example.
- [x] Add headless hooks example.
- [x] Add themed example.

## Package Baseline Validation

This section tracks the package/fixture baseline. It is useful, but it is not the finished product gate.

- [x] Render fixture-backed streaming assistant text.
- [x] Render fixture-backed command output.
- [x] Resolve fixture-backed command approval.
- [x] Resolve fixture-backed file-change approval.
- [x] Render fixture-backed diff preview.
- [x] Resume fixture-backed or fake persisted thread history.
- [x] Pass protocol conformance tests.
- [x] Pass reducer fixture tests.
- [x] Pass fixture-backed browser smoke test.
- [x] Add chat-window execution mode control.
- [x] Add chat-window model selection.
- [x] Add chat-window reasoning effort selection.
- [x] Add usage component for 5-hour and weekly limits.
- [x] Add browser smoke coverage for run controls and usage.
- [x] Add browser smoke coverage for persisted session browsing.
- [x] Add no-horizontal-overflow visual assertions for desktop and mobile.
- [x] Refactor usage parsing into a focused utility with tests.
- [x] Refactor Codex thread response normalization for read/resume/list.
- [x] Refresh docs for run controls, usage, history, and real Codex verification.

## Active Release Gate: Real Local App Release

This is the current source of truth for making Agent UI a finished local Codex web experience. The release is not complete until this section is complete.

### Real App Bridge

- [x] Keep a real local web app under `examples/codex-local-web`.
- [x] Use a persistent host bridge instead of `FakeAgentTransport`.
- [x] Keep one Codex App Server process alive for a browser session.
- [x] Forward App Server notifications to browser state.
- [x] Forward App Server server requests to browser state.
- [x] Forward browser approval responses back to App Server.
- [x] Forward browser rejection responses back to App Server.
- [x] Add an integration test where `createCodexWebSocketTransport()` consumes the server bridge end-to-end.
- [x] Add an integration test proving approval response/rejection reaches the stdio App Server side.
- [x] Surface bridge connection errors in the UI.
- [x] Surface redacted App Server stderr in the UI or a visible diagnostics panel.
- [x] Shut down the App Server process when the browser session closes.
- [x] Add idle timeout shutdown for abandoned App Server browser sessions.

### Real App Bootstrap

- [x] Read account state on app startup with `account/read`.
- [x] If unauthenticated, show a first-run device-code login state.
- [x] If authenticated, do not show a misleading Login button.
- [x] Read model data on startup with `model/list`.
- [x] Read usage data on startup with `account/rateLimits/read`.
- [x] Refresh account and usage after device-code login completes.
- [x] Clear local account state after `account/logout` succeeds.
- [x] Show loading, empty, and error states for account/model/usage bootstrap.
- [x] Handle device-code login without logging raw tokens.

### Real Thread Workflow

- [x] Load stored Codex threads from `thread/list`.
- [x] Match thread search/filter UI to real `thread/list` behavior.
- [x] Ignore malformed stored thread rows without stable ids.
- [x] Hydrate stored sessions with `thread/read`.
- [x] Resume stored sessions with `thread/resume`.
- [x] Start new threads with a selected working directory.
- [x] Send turns with stable `turn/start` params.
- [x] Disable composer and expose Stop while a turn is running.
- [x] Type Stop requests with stable `turn/interrupt` params.
- [x] Render live streaming assistant text from App Server events.
- [x] Render live command output from App Server events.
- [x] Render live diffs from App Server patch payloads.
- [x] Render live command approval prompts.
- [x] Render live file-change approval prompts.
- [x] Mark threads as waiting for approval while server requests are pending.
- [x] Keep command/diff work trace visible while approval decisions are pending.

### Correctness Gaps

- [x] Remove fixture-only model and reasoning-effort names from user-facing demos.
- [x] Stop inventing reasoning-effort options when Codex App Server does not provide them.
- [x] Verify current real Codex `model/list` response shape and update normalizers/tests from that shape.
- [x] Do not expose collaboration/execution preset UI beyond documented `turn/start` fields for the local release.
- [x] Make execution mode controls map only to documented stable App Server turn params.
- [x] Verify live `turn/start` behavior for each built-in execution mode.
- [x] Fix approval response payloads to use generated stable decisions such as `accept`, `acceptForSession`, `decline`, and `cancel`.
- [x] Add tests that fail if fixture model ids look like real production model ids.
- [x] Add tests that fail if effort options are fabricated without model metadata.
- [x] Add schema-backed tests for command approval response payloads.
- [x] Add schema-backed tests for file-change approval response payloads.

### UI/UX Finish

- [x] Clearly label fixture smoke demos separately from real Codex demos.
- [x] Make quickstart launch the real local web app first.
- [x] Add unauthenticated first-run state.
- [x] Add no-session empty state.
- [x] Add bridge-error state.
- [x] Add thread search/filter loading and empty states.
- [x] Add thread history load-more pagination for real `thread/list` cursors.
- [x] Auto-preview the latest stored session after startup `thread/list` so the main pane is not empty.
- [x] Keep run settings and message input together as one composer surface.
- [x] Make run settings readable on desktop and mobile.
- [x] Add usage limit cards for 5-hour and weekly windows using real rate-limit data.
- [x] Add accessible approval controls for command and file-change requests.
- [x] Make diff preview polished for real App Server patch payloads.
- [x] Add visual regression coverage for the real local app shell.
- [x] Keep App Server plugin manifest warnings out of the primary chat flow.
- [x] Suppress known low-value Codex plugin `interface.defaultPrompt` warnings from visible diagnostics.
- [x] Make long persisted-session messages preview-first with explicit expansion.
- [x] Cap very large persisted-session command-output lists so history remains readable.
- [x] Auto-scroll hydrated persisted sessions to the latest messages.
- [x] Normalize structured real App Server message content before rendering persisted and live turns.
- [x] Keep narrow-width persisted session history vertical and readable instead of horizontal card overflow.
- [x] Show completed message status after real App Server thread completion and hydrated `thread/read`.
- [x] Make local Vite examples resilient to hot reloads during package rebuilds.
- [x] Remove local Playwright color-environment warning noise from release validation.
- [x] Keep Vite examples independent of package `dist/` cleanup during local development.
- [x] Suppress known low-value Codex plugin and skill manifest warnings from visible diagnostics and the local web dev terminal.
- [x] Replace detached command-output and diff panels with contextual turn-timeline activity.
- [x] Collapse command-heavy persisted-session work steps so conversation context remains readable.
- [x] Replace raw approval JSON with structured command and file-change review cards.
- [x] Replace raw thread status labels such as `notLoaded` with product-facing labels.
- [x] Hide internal Codex JSONL session paths from default thread history UI.
- [x] Keep the start-thread action hidden until account bootstrap confirms it is usable.
- [x] Keep the running-turn Stop action in the thread header so it stays visible above approvals and work traces.
- [x] Keep desktop history and chat inside an app-like viewport so stored sessions do not stretch the whole page.

### Experience Hardening Audit

- [x] Group per-turn command and file-change activity into a readable Work trace so terminal history does not dominate past sessions.
- [x] Screen-check the real local app after the Work trace refactor on the authenticated history view.
- [x] Audit empty, unauthenticated login, approval, diff, mobile, and error states with browser screenshots.
- [x] Replace the fixture Vite state gallery with a dedicated visual QA route.
- [x] Update component and testing docs with the final conversation/work-trace information architecture.

## Active Product Completion Audit

This section is the active gate for making the real local Codex web experience
feel finished rather than merely functional. Do not mark these items complete
until the implementation, browser screen check, docs, and relevant tests are all
updated together.

### Information Architecture

- [x] Re-audit the conversation/work-trace/approval hierarchy against real persisted sessions and live turns.
- [x] Ensure command output, diffs, and approvals are visible in context without turning history into a terminal log wall.
- [x] Ensure the thread sidebar remains useful with very long real thread titles and dense histories.
- [x] Ensure empty, loading, authenticated, unauthenticated, bridge-error, approval, running, preview, and completed states have consistent hierarchy and copy.

### Visual QA

- [x] Browser-check the real local app at narrow, desktop, and tall-history viewports after each UI refactor.
- [x] Browser-check the fixture QA route for empty, unauthenticated, bridge-error, approval, diff, and work-trace states.
- [x] Add or update visual/e2e assertions for every UI regression found during browser checks.
- [x] Keep screenshots and snapshot expectations aligned with intentional layout changes.

### Code Quality

- [x] Remove remaining avoidable type assertions and replace weak protocol parsing with local type guards.
- [x] Split oversized React component sections when behavior is hard to audit.
- [x] Keep reducer state transitions explicit for running, waiting-for-input, preview, completed, failed, and interrupted flows.
- [x] Keep browser transport, bridge lifecycle, and diagnostics redaction tests at production quality.

### Documentation Freshness

- [x] Re-read docs after UI and protocol changes and remove stale product claims.
- [x] Keep `docs/component-api.md` aligned with the actual component hierarchy.
- [x] Keep `docs/testing.md` aligned with the latest validation commands, dates, and real-vs-fake coverage.
- [x] Keep `docs/authentication.md`, `docs/security.md`, and `docs/protocol.md` aligned with the real App Server behavior currently used.

## Release Readiness

This section is the publish/release gate after the real local app works.

- [x] Fix package export/type resolution so `bun run attw` passes.
- [x] Run `bun run typecheck`.
- [x] Run `bun run lint`.
- [x] Run `bun test`.
- [x] Run `bun run build`.
- [x] Run `bun run test:protocol`.
- [x] Run `bun run test:fixtures`.
- [x] Run `bun run publint`.
- [x] Run `bun run attw`.
- [x] Run `bun run test:e2e:playwright`.
- [x] Run real local app smoke for model list, usage, thread list, thread read, thread resume, start thread, send turn, and streaming text.
- [x] Run fake stdio browser smoke for command output, diff preview, and approval handling through the real WebSocket transport.
- [x] Run real Codex approval smoke for command and file-change approval requests.
- [x] Re-run real Codex stdio and approval smoke after real history rendering hardening.
- [x] Record exact real smoke commands, date, Codex version, and any auth/environment dependencies in docs.
- [x] Confirm GitHub Actions pass after push.
- [x] Re-run full release validation after the Active Product Completion Audit is complete.
- [x] Confirm GitHub Actions pass after the final product-completion push.

## Current Correctness Audit

- [x] Fix stable `account/read`, `account/login/start`, `account/login/cancel`, `account/logout`, `account/rateLimits/read`, and `model/list` params.
- [x] Preserve device-code `loginId` and support stable-schema login cancel.
- [x] Type the Codex device-code auth helper against generated `LoginAccountResponse`.
- [x] Remove loose `any` and nondeterministic warning ids from the Codex protocol normalizer.
- [x] Remove loose `any` from React App Server response hooks.
- [x] Remove loose `any` from the browser WebSocket transport envelope handling.
- [x] Add schema-backed request param tests for real App Server methods.
- [x] Redact App Server stderr before callback, transport, WebSocket, and UI forwarding.
- [x] Avoid retaining raw transport stderr events in React diagnostics state.
- [x] Clarify Next one-shot RPC helper scope and keep chat-capable bridge on WebSocket.
- [x] Document real vs fake approval coverage without overstating completion.
- [x] Re-run full validation after corrective audit changes.
- [x] Confirm GitHub Actions pass after corrective audit changes.

## Implemented Extras

These are useful extras, but they are not substitutes for the real local app release gate.

- [x] Add remote WebSocket deployment guide.
- [x] Harden websocket reconnect handling.
- [x] Add Codex SDK adapter.
- [x] Add OpenAI Agents SDK adapter.
- [x] Add Web Components wrapper.
- [x] Add richer thread navigation.
- [x] Add Monaco or CodeMirror diff integration.
- [x] Add multi-user deployment recipe.
- [x] Add API-key remote deployment recipe.
- [x] Add hosted demo app.
- [x] Add documentation site.
- [x] Add visual regression tests.
- [x] Add release automation.
- [x] Add changelog automation.
- [x] Add package provenance/signing if useful.

## Ongoing Operations

- [x] Commit and push each stable implementation slice.
- [x] Keep `TODO.md` updated in the same commit as implementation changes.
- [x] Add or update tests with each behavior change.
- [x] Refactor when implementation complexity starts hiding protocol or UI state behavior.
- [x] Re-check current Codex App Server schema and behavior before relying on assumptions.
