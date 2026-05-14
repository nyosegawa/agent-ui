# TODO

This checklist is the execution source of truth for Agent UI vNext. The plan is
defined in `PLAN.md`. Backward compatibility with the current Watcher and
`skill-with-app` experiments is not required.

## Completion Rule

This is not an MVP checklist. Do not stop after a demo, scaffold, happy path, or
"good enough" component shell.

The work is complete only when every milestone in this file is checked off, all
deterministic validation gates pass, browser-visible behavior has Playwright or
`agent-browser` evidence, and any skipped real Codex check is documented with an
environment-specific reason.

If implementation uncovers missing protocol coverage, weak API boundaries,
layout defects, host integration gaps, or stale documentation, add new TODO
items before continuing. A task is not done until code, tests, docs, examples,
and verification all match.

## Work Loop Rule

For every coherent implementation slice:

- [ ] Inspect the current repo code before editing.
- [ ] Inspect `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` when the slice depends on App Server protocol behavior.
- [ ] Refactor old boundaries when they conflict with the vNext architecture.
- [ ] Add or update focused tests in the same change.
- [ ] Run targeted validation before committing.
- [ ] Update docs and `TODO.md` in the same change.
- [ ] Commit the slice with a meaningful message.
- [ ] Push the branch and confirm `git status --short --branch` is clean.

## Milestone 0: Baseline And Protocol Truth

- [x] Confirm the working tree intentionally contains `.agents/skills/agent-browser` and `skills-lock.json`.
- [x] Decide whether to keep any historical completed checklist items elsewhere, then keep this file focused on vNext implementation.
- [x] Inventory stale root/docs claims before implementation: `README.md`, `AGENTS.md`, `docs/*.md`, examples READMEs, and package READMEs.
- [x] Remove or flag stale MVP-era docs before any new API work begins, especially docs that describe old `AgentChat` composition as the final design.
- [x] Refresh generated stable App Server types from `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server`.
- [x] Refresh generated experimental App Server types in a separate generated tree.
- [x] Document the exact local App Server commit and generation commands used for the schema refresh.
- [x] Record the upstream App Server commit in `packages/codex/src/protocol.ts`.
- [x] Replace hand-written product method lists with generated-schema-derived capability metadata, keeping any unavoidable manual classification in one audited file with tests.
- [x] Split capability metadata into `stableAvailable`, `stableProductized`, `experimentalAvailable`, and `hostOnly`.
- [x] Add a protocol drift test that fails when generated files or capability metadata are stale.
- [x] Fix current drift around `account/rateLimits/read` and any other productized method missing from stable metadata.
- [x] Update `docs/protocol.md` only after the generated schema refresh and capability split are implemented.

Acceptance:

- [x] `bun run test:protocol` proves generated schema, protocol metadata, and capability lists agree.
- [x] Docs no longer mention non-existent public props such as `AgentProvider experimental`.
- [x] Root README and AGENTS instructions point implementers to `PLAN.md` and `TODO.md` as the active source of truth.
- [x] The Milestone 0 implementation is committed and pushed before starting Milestone 1.

## Milestone 1: Core State Model

- [ ] Add normalized stores for skills, apps, hooks, account, rate limits, pending server requests, and diagnostics in `packages/core`.
- [ ] Add turn plan and turn diff state.
- [ ] Add status/banner state for model reroutes, deprecation notices, config warnings, account status, and MCP OAuth status.
- [ ] Add registry-level thread state for cold history, preview threads, live threads, loaded threads, and active UI selection.
- [ ] Ensure fixed-thread consumers can subscribe by `threadId` without following global active selection.
- [ ] Add normalized item block types for text, thinking, plan, command execution, file change, tool call, MCP/collab tool call, web search, image, and system info.
- [ ] Add a first-class server-request queue model.
- [ ] Add usage state that separates App Server account/rate-limit windows from host-provided usage metrics.

Acceptance:

- [ ] Reducer tests cover text turns, command output deltas, file patches, plan updates, diff updates, rate-limit updates, and interrupted turns.
- [ ] Reducer tests prove non-active thread notifications update the registry without changing the active displayed thread.

## Milestone 2: Codex Adapter And Session API

- [ ] Rebuild request builders so params `satisfies` generated App Server request types.
- [ ] Expand the Codex client/session facade to cover thread start/resume/fork/list/loaded/read/archive/unarchive/name/metadata/compact/rollback/inject/unsubscribe.
- [ ] Expand turn helpers to cover start, steer, and interrupt.
- [ ] Normalize all supported App Server notifications into core events.
- [ ] Normalize server requests for command approval, file-change approval, user input, MCP elicitation, dynamic tool call, auth refresh, and attestation.
- [ ] Implement safe handling for legacy patch/exec approvals as compatibility normalizers only.
- [ ] Add App Server backpressure handling for `-32001` with retry/backoff where retry is safe.
- [ ] Add stable default behavior and explicit experimental opt-in behavior for field-level and method-level experimental APIs.
- [ ] Disable `thread/turns/items/list` in product APIs until upstream implements it.

Acceptance:

- [ ] Adapter tests use generated types as the source of truth and do not copy protocol shapes by hand.
- [ ] Fake App Server fixtures cover approvals, user input, MCP elicitation, dynamic tools, app list updates, skills changed, and account/rate-limit updates.

## Milestone 3: Public React API Redesign

- [ ] Introduce `AgentShell` as a layout primitive.
- [ ] Introduce `AgentThreadView` for one thread with timeline, approvals, and composer but no required sidebar or usage panel.
- [ ] Introduce `AgentThreadHeader`, `AgentThreadTimeline`, `AgentApprovalQueue`, `AgentComposerPanel`, `AgentUsagePanel`, `AgentDiagnosticsPanel`, `AgentSkillsPanel`, and `AgentThreadSidebar`.
- [ ] Redesign `AgentChat` as a preset composition of primitives.
- [ ] Make usage in presets suppressible and relocatable.
- [ ] Add `AgentWorkerPane` for plan-only first turn plus approved continuation.
- [ ] Add `AgentWorkspace` for chat plus optional right-side skill/app panel.
- [ ] Add headless hooks/controllers: `useAgentThreadController`, `useAgentTurnController`, `useAgentServerRequests`, `useAgentUsage`, `useAgentSkills`, `useAgentApps`, `useAgentWorkerSession`, and `useSkillAppPanel`.
- [ ] Keep the old public API only where it remains naturally compatible with the new primitives; do not preserve awkward shapes for compatibility.

Acceptance:

- [ ] A host can render only a specific thread by id.
- [ ] A host can render only usage.
- [ ] A host can render chat with no sidebar.
- [ ] A host can render chat with usage moved outside the shell.
- [ ] React tests cover each composition.

## Milestone 4: Kitchen-Quality Codex UX

- [ ] Port the useful `agent-kitchen` block taxonomy onto `agent-ui` normalized state.
- [ ] Implement polished renderers for command execution, file changes, tool calls, thinking, plans, diffs, images, system info, and web/search-style blocks.
- [ ] Implement status banners for model reroutes, deprecation notices, config warnings, account status, MCP OAuth, and rate limits.
- [ ] Implement richer approval cards for every server-request type.
- [ ] Implement token and rate-limit bars as standalone components usable inside or outside the shell.
- [ ] Implement thread actions for rename, archive, unarchive, fork, resume, compact, and rollback, with disabled/error states only when the generated protocol or runtime capability explicitly lacks support.
- [ ] Implement composer attachments for local images, file mentions, paste/drop, and app/plugin mentions.
- [ ] Keep visual components independent from generated App Server types.

Acceptance:

- [ ] Fixture gallery includes kitchen-derived examples for every renderer and banner.
- [ ] Component tests cover block rendering and approval response behavior.
- [ ] Browser checks prove no overlapping header/timeline/composer layout at narrow widths.

## Milestone 5: Skills, Apps, And agent-browser

- [ ] Productize `skills/list` with cwd-aware `useAgentSkills()`.
- [ ] Productize `skills/config/write` and `skills/changed`.
- [ ] Add structured skill input items to turn-start helpers.
- [ ] Add `app/list` and `app/list/updated` support with pagination, install/auth state, and `useAgentApps()`.
- [ ] Add composer mention chips for `app://...` and `plugin://...`.
- [ ] Add `SkillAppRegistry` that accepts static arrays, Vite glob outputs, and remote manifests.
- [ ] Add `SkillAppPanel` with right panel, modal, inline, and fullscreen modes.
- [ ] Add `SkillDataStore` in the server package for JSON/blob storage, path guards, transactions, and watch.
- [ ] Replace `curl /api/app`-style prototypes with client tools such as `open_skill_app`, `update_skill_app`, and `request_skill_app_feedback`.
- [ ] Validate client tool names against App Server reserved namespaces before exposing them.
- [ ] Detect the repo `agent-browser` skill and global CLI availability.
- [ ] Add a helper that injects the `agent-browser` skill into coding-agent verification turns.
- [ ] Add diagnostics when `agent-browser` is missing or the browser binary is not installed.

Acceptance:

- [ ] `agent-browser --version` and `agent-browser skills get core` succeed in local verification docs.
- [ ] A local example can open a skill app panel, update it from an agent action, receive feedback, and close it.
- [ ] A coding-agent workflow can be instructed to verify a local page with `agent-browser` through structured skill injection.

## Milestone 6: Server Bridge And Host Integration

- [ ] Split bridge internals into transport bridge, policy engine, dynamic tool bridge, and host event sink.
- [ ] Keep `stdio://` as the default local App Server transport.
- [ ] Treat direct App Server WebSocket transport as experimental/unsupported in docs and API naming.
- [ ] Add host event callbacks for thread events, turn events, usage deltas, and server requests.
- [ ] Add approval policy configuration that is explicit and visible to host apps.
- [ ] Add redaction tests for stderr and bridge logs.
- [ ] Add bridge tests for dynamic tool helper thread params against generated schema.
- [ ] Add slow-consumer/backpressure tests, or add a focused harness if the current test infrastructure cannot simulate them.

Acceptance:

- [ ] Watcher-style host apps can receive worker lifecycle and usage events without reading internal React state.
- [ ] Dynamic tools and approval policies require explicit host opt-in.

## Milestone 7: Examples And Migration Targets

- [ ] Update `examples/codex-local-web` to use the new preset shell.
- [ ] Add `examples/scoped-thread-pane` that demonstrates a Watcher-style fixed thread worker pane.
- [ ] Add `examples/usage-only` that renders account/rate-limit usage without chat chrome.
- [ ] Add `examples/skill-app-workspace` that replaces the `skill-with-app` architecture without a separate `:5191` curl/SSE server.
- [ ] Add `examples/fixture-gallery` for deterministic UI state regression.
- [ ] Document how Watcher should migrate to `AgentWorkerPane`.
- [ ] Document how `skill-with-app` should migrate to `AgentWorkspace`, `SkillAppRegistry`, and `SkillAppPanel`.

Acceptance:

- [ ] Each example has a focused README and a deterministic smoke path.
- [ ] Watcher and `skill-with-app` can be simplified by deleting host-side reimplementations rather than adapting around them.

## Milestone 8: Browser Verification With agent-browser

- [ ] Add an implementation guide for using `agent-browser` during local UI work.
- [ ] Add scripts or docs for running examples and verifying them with `agent-browser`.
- [ ] For each layout-impacting slice, capture `agent-browser snapshot -i` evidence.
- [ ] Capture screenshots for desktop and mobile-sized verification where layout changed.
- [ ] Verify no document-level horizontal overflow.
- [ ] Verify composer visibility after completed turns.
- [ ] Verify fixed-thread views ignore unrelated active-thread selection changes.
- [ ] Verify usage-only rendering has no hidden chat/sidebar assumptions.
- [ ] Verify skill/app panel open/update/feedback/close flow.

Suggested manual command sequence:

```bash
agent-browser skills get core
agent-browser open http://127.0.0.1:5174
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-browser-check.png
agent-browser close
```

Acceptance:

- [ ] Browser verification is referenced in PR or implementation notes for any component/layout change.
- [ ] Playwright remains the deterministic CI gate; `agent-browser` is the agent-driven local verification gate.

## Milestone 9: Validation And Release Gate

- [ ] Update `README.md` for the final vNext public API and examples.
- [ ] Update `AGENTS.md` for final repo working rules after the vNext implementation is complete.
- [ ] Update `docs/architecture.md`, `docs/component-api.md`, `docs/headless-hooks.md`, `docs/packages.md`, `docs/product.md`, `docs/protocol.md`, `docs/protocol-drift.md`, `docs/testing.md`, and `docs/theming.md`.
- [ ] Update every example README and package README affected by the new component/API shape.
- [ ] Search root docs and examples for stale terms before validation: `MVP`, `post-MVP`, `AgentProvider experimental`, old monolithic `AgentChat`, old usage placement, and old skill/app server assumptions.
- [ ] Run `bun run typecheck`.
- [ ] Run `bun run lint`.
- [ ] Run `bun test`.
- [ ] Run `bun run build`.
- [ ] Run `bun run test:protocol`.
- [ ] Run `bun run test:fixtures`.
- [ ] Run `bun run publint`.
- [ ] Run `bun run attw`.
- [ ] Run `bun run check:exports`.
- [ ] Run `bun run test:e2e:playwright`.
- [ ] Run `bun run test:node-compat`.
- [ ] Run `bun run test:e2e:real-codex` when local Codex auth/environment is available.
- [ ] Run `bun run test:e2e:real-codex:approval` when local approval smoke is available.
- [ ] Run the `agent-browser` manual verification sequence for changed examples.
- [ ] Update `PLAN.md`, `TODO.md`, and docs after implementation reality differs from the plan.
- [ ] Confirm every milestone completion was committed and pushed in coherent slices rather than one final bulk commit.

Acceptance:

- [ ] All deterministic gates pass.
- [ ] Any skipped real Codex or browser checks are documented with a concrete reason.
- [ ] Public package exports pass package validation.
- [ ] README, AGENTS, docs, package READMEs, and example READMEs describe the implemented API, not aspirational API that has not landed and not stale pre-vNext behavior.

## Milestone 10: Completeness Audit

- [ ] Re-read `PLAN.md` and verify every promised capability has code, tests, docs, and an example or explicit non-example rationale.
- [ ] Re-read every root and docs markdown file and remove contradictions against `PLAN.md`, `TODO.md`, and the implemented API.
- [ ] Re-audit `agent-ui` against the current Codex App Server generated schema and confirm no productized stable method is missing from capability metadata.
- [ ] Re-audit `agent-ui` against `agent-kitchen/packages/codex` and confirm all intentionally imported UX/state ideas landed or were explicitly rejected in docs.
- [ ] Re-audit the Watcher integration path and confirm `AgentWorkerPane` can replace the current host-side worker session orchestration.
- [ ] Re-audit the `skill-with-app` integration path and confirm `AgentWorkspace` plus `SkillAppPanel` can replace the separate curl/SSE app server pattern.
- [ ] Run an agent-browser dogfood pass against each browser example and record the checked URL, commands, and result.
- [ ] Ask at least one independent review pass to inspect for missing component APIs, host integration gaps, protocol drift, and "demo-only" shortcuts.
- [ ] Fix every audit finding or add a concrete blocking issue to `TODO.md` before marking this milestone complete.

Acceptance:

- [ ] There are no unchecked TODO items.
- [ ] There are no untracked files.
- [ ] `git status --short --branch` is clean and aligned with `origin/main` after the final push.
- [ ] A new session can read only `PLAN.md` and `TODO.md`, then understand both the intended architecture and the exact remaining work.
