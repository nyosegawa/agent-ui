# TODO

This checklist is the execution source of truth for Agent UI vNext. The plan is
defined in `PLAN.md`. External app workflows are not core library scope;
Watcher-style proposal flows and skill-with-app-style runtimes must be composed
outside the package from generic Codex App Server UI primitives.

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

- [x] Inspect the current repo code before editing.
- [x] Inspect `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` when the slice depends on App Server protocol behavior.
- [x] Refactor old boundaries when they conflict with the vNext architecture.
- [x] Add or update focused tests in the same change.
- [x] Run targeted validation before committing.
- [x] Update docs and `TODO.md` in the same change.
- [x] Commit the slice with a meaningful message.
- [x] Push the branch and confirm `git status --short --branch` is clean.

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

- [x] Add normalized stores for skills, apps, hooks, account, rate limits, pending server requests, and diagnostics in `packages/core`.
- [x] Add turn plan and turn diff state.
- [x] Add status/banner state for model reroutes, deprecation notices, config warnings, account status, and MCP OAuth status.
- [x] Add registry-level thread state for cold history, preview threads, live threads, loaded threads, and active UI selection.
- [x] Ensure fixed-thread consumers can subscribe by `threadId` without following global active selection.
- [x] Add normalized item block types for text, thinking, plan, command execution, file change, tool call, MCP/collab tool call, web search, image, and system info.
- [x] Add a first-class server-request queue model.
- [x] Add usage state that separates App Server account/rate-limit windows from host-provided usage metrics.

Acceptance:

- [x] Reducer tests cover text turns, command output deltas, file patches, plan updates, diff updates, rate-limit updates, and interrupted turns.
- [x] Reducer tests prove non-active thread notifications update the registry without changing the active displayed thread.

## Milestone 2: Codex Adapter And Session API

- [x] Rebuild request builders so params `satisfies` generated App Server request types.
- [x] Expand the Codex client/session facade to cover thread start/resume/fork/list/loaded/read/archive/unarchive/name/metadata/compact/rollback/inject/unsubscribe.
- [x] Expand turn helpers to cover start, steer, and interrupt.
- [x] Normalize all supported App Server notifications into core events.
- [x] Normalize server requests for command approval, file-change approval, user input, MCP elicitation, dynamic tool call, auth refresh, and attestation.
- [x] Implement safe handling for legacy patch/exec approvals as compatibility normalizers only.
- [x] Add App Server backpressure handling for `-32001` with retry/backoff where retry is safe.
- [x] Add stable default behavior and explicit experimental opt-in behavior for field-level and method-level experimental APIs.
- [x] Disable `thread/turns/items/list` in product APIs until upstream implements it.

Acceptance:

- [x] Adapter tests use generated types as the source of truth and do not copy protocol shapes by hand.
- [x] Fake App Server fixtures cover approvals, user input, MCP elicitation, dynamic tools, app list updates, skills changed, and account/rate-limit updates.

## Milestone 3: Public React API Redesign

- [x] Introduce `AgentShell` as a layout primitive.
- [x] Introduce `AgentThreadView` for one thread with timeline, approvals, and composer but no required sidebar or usage panel.
- [x] Introduce `AgentThreadHeader`, `AgentThreadTimeline`, `AgentApprovalQueue`, `AgentComposerPanel`, `AgentUsagePanel`, `AgentDiagnosticsPanel`, `AgentSkillsPanel`, and `AgentThreadSidebar`.
- [x] Redesign `AgentChat` as a preset composition of primitives.
- [x] Make usage in presets suppressible and relocatable.
- [x] Add generic fixed-thread composition with `AgentThreadView`.
- [x] Add `AgentWorkspace` for chat plus optional host-owned side panel slot.
- [x] Add headless hooks/controllers: `useAgentThreadController`, `useAgentTurnController`, `useAgentServerRequests`, `useAgentUsage`, `useAgentSkills`, and `useAgentApps`.
- [x] Keep the old public API only where it remains naturally compatible with the new primitives; do not preserve awkward shapes for compatibility.

Acceptance:

- [x] A host can render only a specific thread by id.
- [x] A host can render only usage.
- [x] A host can render chat with no sidebar.
- [x] A host can render chat with usage moved outside the shell.
- [x] React tests cover each composition.

## Milestone 4: Kitchen-Quality Codex UX

Reopened on 2026-05-14 after review found the earlier completion bar too low:
the preset chat stacked diagnostics, banners, and usage above the thread, and
the kitchen fixture proved presence more than visual quality.

- [x] Port the useful `agent-kitchen` block taxonomy onto `agent-ui` normalized state.
- [x] Implement polished renderers for command execution, file changes, tool calls, thinking, plans, diffs, images, system info, and web/search-style blocks.
- [x] Implement status banners for model reroutes, deprecation notices, config warnings, account status, MCP OAuth, and rate limits.
- [x] Implement richer approval cards for every server-request type.
- [x] Implement token and rate-limit bars as standalone components usable inside or outside the shell.
- [x] Implement thread actions for rename, archive, unarchive, fork, resume, compact, and rollback, with disabled/error states only when the generated protocol or runtime capability explicitly lacks support.
- [x] Implement composer attachments for local images, file mentions, paste/drop, and app/plugin mentions.
- [x] Keep visual components independent from generated App Server types.

Acceptance:

- [x] Fixture gallery includes kitchen-derived examples for every renderer and banner.
- [x] Component tests cover block rendering and approval response behavior.
- [x] Browser checks prove no overlapping header/timeline/composer layout at narrow widths.
- [x] Rework `AgentChat` so thread/timeline/work trace is the primary column and status, diagnostics, and usage move to compact secondary chrome.
- [x] Replace full-width status-banner stacking with compact summary rail plus critical inline warnings near the thread.
- [x] Re-run kitchen desktop/mobile visual QA with saved screenshots and update the Playwright layout contract snapshots.

## Milestone 5: Skills, Apps, And agent-browser

- [x] Productize `skills/list` with cwd-aware `useAgentSkills()`.
- [x] Productize `skills/config/write` and `skills/changed`.
- [x] Add structured skill input items to turn-start helpers.
- [x] Add `app/list` and `app/list/updated` support with pagination, install/auth state, and `useAgentApps()`.
- [x] Add composer mention chips for `app://...` and `plugin://...`.
- [x] Keep skill-with-app-style registry, panel runtime, storage, and client tools out of core package scope.
- [x] Add generic workspace slots for host-owned panels without library-owned runtime state.
- [x] Keep dynamic tool bridges generic and host opt-in rather than exposing app-specific client tools.
- [x] Detect the repo `agent-browser` skill and global CLI availability.
- [x] Add a helper that injects the `agent-browser` skill into coding-agent verification turns.
- [x] Add diagnostics when `agent-browser` is missing or the browser binary is not installed.

Acceptance:

- [x] `agent-browser --version` and `agent-browser skills get core` succeed in local verification docs.
- [x] React tests prove a host-owned panel can render through generic workspace slots.
- [x] A coding-agent workflow can be instructed to verify a local page with `agent-browser` through structured skill injection.

## Milestone 6: Server Bridge And Host Integration

- [x] Split bridge internals into transport bridge, policy engine, dynamic tool bridge, and host event sink.
- [x] Keep `stdio://` as the default local App Server transport.
- [x] Treat direct App Server WebSocket transport as experimental/unsupported in docs and API naming.
- [x] Add host event callbacks for thread events, turn events, usage deltas, and server requests.
- [x] Add approval policy configuration that is explicit and visible to host apps.
- [x] Add redaction tests for stderr and bridge logs.
- [x] Add bridge tests for dynamic tool helper thread params against generated schema.
- [x] Add slow-consumer/backpressure tests, or add a focused harness if the current test infrastructure cannot simulate them.

Acceptance:

- [x] Host apps can receive thread, turn, usage, and server-request events without reading internal React state.
- [x] Dynamic tools and approval policies require explicit host opt-in.

## Milestone 7: Examples And Migration Targets

Reopened on 2026-05-14 after review found `/host-workflow-recipe` was only an
`h2/p/ol` explanation demo and `/fixture-gallery` was a link list rather than a
visual QA surface.

- [x] Update `examples/codex-local-web` to use the new preset shell.
- [x] Add `examples/scoped-thread-pane` that demonstrates a generic fixed-thread pane.
- [x] Add `examples/usage-only` that renders account/rate-limit usage without chat chrome.
- [x] Add `examples/app-connectors` that demonstrates `app/list` Apps/connectors support.
- [x] Add `examples/host-workflow-recipe` that demonstrates host-owned side panels through generic slots.
- [x] Add `examples/fixture-gallery` for deterministic UI state regression.
- [x] Document that external apps compose proposal/workspace workflows from generic primitives rather than core workflow-specific APIs.

Acceptance:

- [x] Each example has a focused README and a deterministic smoke path.
- [x] Examples do not justify new core APIs with external-app-specific workflows.
- [x] Rebuild `/host-workflow-recipe` as a concrete host-owned workflow panel
      composed from generic primitives, with thread summary, workflow status,
      pending requests, plan/context files, usage, and host actions.
- [x] Rebuild `/fixture-gallery` as a desktop/mobile iframe preview gallery for
      default, kitchen, usage-only, scoped-thread, app-connectors, and
      host-workflow states.

## Milestone 8: Browser Verification With agent-browser

Reopened on 2026-05-14 because previous evidence leaned toward
accessibility/existence checks and did not prove the visual quality of the
changed routes.

- [x] Add an implementation guide for using `agent-browser` during local UI work.
- [x] Add scripts or docs for running examples and verifying them with `agent-browser`.
- [x] For each layout-impacting slice, capture `agent-browser snapshot -i` evidence.
- [x] Capture screenshots for desktop and mobile-sized verification where layout changed.
- [x] Verify no document-level horizontal overflow.
- [x] Verify composer visibility after completed turns.
- [x] Verify fixed-thread views ignore unrelated active-thread selection changes.
- [x] Verify usage-only rendering has no hidden chat/sidebar assumptions.
- [x] Verify host-owned side panels render through generic slots without core runtime state.

Suggested manual command sequence:

```bash
agent-browser skills get core
agent-browser open http://127.0.0.1:5174
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-browser-check.png
agent-browser close
```

Acceptance:

- [x] Browser verification is referenced in PR or implementation notes for any component/layout change.
- [x] Playwright remains the deterministic CI gate; `agent-browser` is the agent-driven local verification gate.
- [x] Capture current desktop and mobile screenshots under `docs/screenshots/`
      for `/`, `/?state=kitchen`, `/host-workflow-recipe`, `/usage-only`,
      `/scoped-thread-pane`, `/app-connectors`, and `/fixture-gallery`.
- [x] Record visual-quality-focused browser commands, checked URLs, results,
      and residual risk in `docs/testing.md`.

## Milestone 9: Validation And Release Gate

- [x] Update `README.md` for the final vNext public API and examples.
- [x] Update `AGENTS.md` for final repo working rules after the vNext implementation is complete.
- [x] Update `docs/architecture.md`, `docs/component-api.md`, `docs/headless-hooks.md`, `docs/packages.md`, `docs/product.md`, `docs/protocol.md`, `docs/protocol-drift.md`, `docs/testing.md`, and `docs/theming.md`.
- [x] Update every example README and package README affected by the new component/API shape.
- [x] Search root docs and examples for stale terms before validation: `MVP`, `post-MVP`, `AgentProvider experimental`, old monolithic `AgentChat`, old usage placement, and old skill/app server assumptions.
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
- [x] Run `bun run test:e2e:real-codex` when local Codex auth/environment is available.
- [x] Run `bun run test:e2e:real-codex:approval` when local approval smoke is available.
- [x] Run the `agent-browser` manual verification sequence for changed examples.
- [x] Update `PLAN.md`, `TODO.md`, and docs after implementation reality differs from the plan.
- [x] Confirm every milestone completion was committed and pushed in coherent slices rather than one final bulk commit.

Acceptance:

- [x] All deterministic gates pass.
- [x] Any skipped real Codex or browser checks are documented with a concrete reason.
- [x] Public package exports pass package validation.
- [x] README, AGENTS, docs, package READMEs, and example READMEs describe the implemented API, not aspirational API that has not landed and not stale pre-vNext behavior.

## Milestone 10: Completeness Audit

Reopened on 2026-05-14 because the previous audit accepted weak UI evidence and
did not call out the stale completion status after Milestones 4/7/8 were
reopened.

- [x] Re-read `PLAN.md` and verify every promised capability has code, tests, docs, and an example or explicit non-example rationale.
- [x] Re-read every root and docs markdown file and remove contradictions against `PLAN.md`, `TODO.md`, and the implemented API.
- [x] Re-audit `agent-ui` against the current Codex App Server generated schema and confirm no productized stable method is missing from capability metadata.
- [x] Re-audit `agent-ui` against `agent-kitchen/packages/codex` and confirm all intentionally imported UX/state ideas landed or were explicitly rejected in docs.
- [x] Re-audit public exports and docs to confirm Watcher-specific proposal/session APIs are not in core.
- [x] Re-audit public exports and docs to confirm skill-with-app-specific registry/storage/panel/client-tool runtime APIs are not in core.
- [x] Run an agent-browser dogfood pass against each browser example and record the checked URL, commands, and result.
- [x] Ask at least one independent review pass to inspect for missing component APIs, host integration gaps, protocol drift, and "demo-only" shortcuts.
- [x] Fix every audit finding or add a concrete blocking issue to `TODO.md` before marking this milestone complete.

Acceptance:

- [x] There are no unchecked TODO items.
- [x] There are no untracked files.
- [x] `git status --short --branch` is clean and aligned with `origin/main` after the final push.
- [x] A new session can read only `PLAN.md` and `TODO.md`, then understand both the intended architecture and the exact remaining work.
- [x] Re-audit against `agent-kitchen/packages/codex` for remaining UX/state
      ideas and document current deferrals rather than treating them as done.
- [x] Re-audit against current App Server schema for Apps/connectors drift and
      boundary risks.
- [x] Re-search public exports/docs for Watcher-specific and skill-with-app
      runtime APIs after the UI/example rewrite.
