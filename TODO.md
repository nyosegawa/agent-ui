# TODO

This checklist is the execution source of truth for Agent UI.

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
- [x] Render live streaming assistant text from App Server events.
- [x] Render live command output from App Server events.
- [x] Render live diffs from App Server patch payloads.
- [x] Render live command approval prompts.
- [x] Render live file-change approval prompts.

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

### Experience Hardening Audit

- [x] Group per-turn command and file-change activity into a readable Work trace so terminal history does not dominate past sessions.
- [x] Screen-check the real local app after the Work trace refactor on the authenticated history view.
- [x] Audit empty, unauthenticated login, approval, diff, mobile, and error states with browser screenshots.
- [x] Replace the fixture Vite state gallery with a dedicated visual QA route.
- [x] Update component and testing docs with the final conversation/work-trace information architecture.

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

## Current Correctness Audit

- [x] Fix stable `account/read`, `account/login/start`, `account/login/cancel`, `account/logout`, `account/rateLimits/read`, and `model/list` params.
- [x] Preserve device-code `loginId` and support stable-schema login cancel.
- [x] Add schema-backed request param tests for real App Server methods.
- [x] Redact App Server stderr before callback, transport, WebSocket, and UI forwarding.
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
