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
- [ ] Add `.editorconfig`.
- [ ] Add TypeScript base config.
- [ ] Add shared package build config.
- [ ] Add CI workflow.
- [ ] Add package validation workflow.
- [ ] Add release workflow skeleton.

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
- [ ] Add local quickstart.
- [ ] Add Codex App Server transport guide.
- [ ] Add device-code login guide.
- [ ] Add remote deployment guide.
- [ ] Add protocol drift guide.
- [ ] Add theming guide.
- [ ] Add component API reference.
- [ ] Add headless hooks reference.

## Toolchain

- [ ] Verify Bun latest before dependency lock-in.
- [ ] Add `bun.lock`.
- [ ] Add TypeScript.
- [ ] Add Vitest.
- [ ] Add React test tooling.
- [ ] Add Playwright.
- [ ] Add ESLint.
- [ ] Add Prettier.
- [ ] Add Changesets.
- [ ] Add package validation with `publint`.
- [ ] Add package validation with `arethetypeswrong`.
- [ ] Add optional Node.js LTS compatibility CI.
- [ ] Add optional pnpm compatibility smoke test.

## Packages

- [ ] Create `packages/core`.
- [ ] Create `packages/codex`.
- [ ] Create `packages/react`.
- [ ] Create `packages/server`.
- [ ] Create shared package export conventions.
- [ ] Create shared tsconfig conventions.
- [ ] Create shared test conventions.

## Core Package

- [ ] Define normalized event model.
- [ ] Define request/response abstraction.
- [ ] Define transport interface.
- [ ] Define session state types.
- [ ] Define thread state types.
- [ ] Define turn state types.
- [ ] Implement reducer.
- [ ] Implement selectors.
- [ ] Implement pending server request state.
- [ ] Implement fake transport.
- [ ] Implement fixture runner.
- [ ] Add reducer invariant tests.

## Codex Package

- [ ] Add Codex App Server schema import script.
- [ ] Vendor stable generated schema.
- [ ] Vendor experimental generated schema behind opt-in.
- [ ] Record Codex upstream commit metadata.
- [ ] Implement JSON-RPC-lite message framing.
- [ ] Implement request id correlation.
- [ ] Implement stdio transport.
- [ ] Implement initialize handshake.
- [ ] Implement server request response handling.
- [ ] Implement App Server notification normalization.
- [ ] Implement device-code login helpers.
- [ ] Implement optional websocket transport.
- [ ] Add protocol method snapshot tests.

## React Package

- [ ] Implement `AgentProvider`.
- [ ] Implement `useAgentThread`.
- [ ] Implement `useAgentTurn`.
- [ ] Implement `useAgentApprovals`.
- [ ] Implement `useAgentComposer`.
- [ ] Implement `useAgentAuth`.
- [ ] Implement `AgentChat`.
- [ ] Implement `AgentComposer`.
- [ ] Implement `AgentMessageList`.
- [ ] Implement `AgentWorkLog`.
- [ ] Implement `AgentApprovalPrompt`.
- [ ] Implement `AgentDiffViewer`.
- [ ] Implement `AgentStatusBar`.
- [ ] Implement `ThreadList`.
- [ ] Implement `ThreadSidebar`.
- [ ] Add CSS variables.
- [ ] Add slot/render prop customization.
- [ ] Add accessibility tests for interactive components.

## Server Package

- [ ] Implement Codex App Server process spawning.
- [ ] Implement local bridge lifecycle.
- [ ] Implement bridge error handling.
- [ ] Implement stderr log forwarding.
- [ ] Implement safe process shutdown.
- [ ] Add Next.js Route Handler helpers.
- [ ] Add Express middleware.
- [ ] Add token redaction utilities.
- [ ] Add server package tests with fake child process.

## Fixtures

- [ ] Add handshake fixture.
- [ ] Add account device-code login fixture.
- [ ] Add thread start fixture.
- [ ] Add text turn fixture.
- [ ] Add streaming agent message fixture.
- [ ] Add reasoning summary fixture.
- [ ] Add plan update fixture.
- [ ] Add command execution fixture.
- [ ] Add command approval fixture.
- [ ] Add file change fixture.
- [ ] Add file change approval fixture.
- [ ] Add interrupted turn fixture.
- [ ] Add failed turn fixture.
- [ ] Add rate-limit update fixture.

## Examples

- [ ] Add local React + Vite example.
- [ ] Add Next.js local bridge example.
- [ ] Add websocket remote demo.
- [ ] Add custom component example.
- [ ] Add headless hooks example.
- [ ] Add themed example.

## MVP Validation

- [ ] Start local Codex App Server from bridge.
- [ ] Complete device-code login.
- [ ] Start a thread.
- [ ] Send a turn.
- [ ] Render streaming assistant text.
- [ ] Render command output.
- [ ] Resolve command approval.
- [ ] Resolve file-change approval.
- [ ] Render diff preview.
- [ ] Resume a thread.
- [ ] Pass protocol conformance tests.
- [ ] Pass reducer fixture tests.
- [ ] Pass package export validation.
- [ ] Pass browser smoke test.

## Post-MVP

- [ ] Add remote WebSocket deployment guide.
- [ ] Harden websocket reconnection policy.
- [ ] Add Codex SDK adapter.
- [ ] Add OpenAI Agents SDK adapter.
- [ ] Add Web Components wrapper.
- [ ] Add richer thread navigation.
- [ ] Add Monaco or CodeMirror diff integration.
- [ ] Add multi-user deployment recipe.
- [ ] Add API-key remote deployment recipe.
- [ ] Add hosted demo app.
- [ ] Add documentation site.
- [ ] Add visual regression tests.
- [ ] Add release automation.
- [ ] Add changelog automation.
- [ ] Add package provenance/signing if useful.
