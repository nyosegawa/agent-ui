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
- [x] Add Next.js local bridge example.
- [x] Add websocket remote demo.
- [x] Add custom component example.
- [x] Add headless hooks example.
- [x] Add themed example.

## MVP Validation

- [x] Start local Codex App Server from bridge.
- [x] Complete device-code login.
- [x] Start a thread.
- [x] Send a turn.
- [x] Render streaming assistant text.
- [x] Render command output.
- [x] Resolve command approval.
- [x] Resolve file-change approval.
- [x] Render diff preview.
- [x] Resume a thread.
- [x] Pass protocol conformance tests.
- [x] Pass reducer fixture tests.
- [x] Pass package export validation.
- [x] Pass browser smoke test.

## Product Polish

- [x] Add chat-window execution mode control.
- [x] Add chat-window model selection.
- [x] Add chat-window reasoning effort selection.
- [x] Add usage component for 5-hour and weekly limits.
- [x] Verify real Codex `model/list` and `account/rateLimits/read`.
- [x] Verify real Codex `thread/list` with stored sessions.
- [x] Verify real Codex `thread/read` for an individual stored session.
- [x] Verify real Codex `thread/resume` from history UI.
- [x] Add browser smoke coverage for run controls and usage.
- [x] Add browser smoke coverage for persisted session browsing.
- [x] Add no-horizontal-overflow visual assertions for desktop and mobile.
- [x] Refactor usage parsing into a focused utility with tests.
- [x] Refactor Codex thread response normalization for read/resume/list.
- [x] Refresh docs for run controls, usage, history, and real Codex verification.

## Post-MVP

- [x] Add remote WebSocket deployment guide.
- [x] Harden websocket reconnection policy.
- [x] Add Codex SDK adapter.
- [x] Add OpenAI Agents SDK adapter.
- [ ] Add Web Components wrapper.
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
