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

Reopened again on 2026-05-15 for the primitive-first UI pass: `AgentChat` still
looked like the center of the library, mobile secondary chrome could disappear,
rate-limit normal status was treated too strongly, and the host workflow/gallery
examples needed to prove real composition.

Reopened a third time on 2026-05-15 because an external review still rejected
the UI as "bordered card stacks on a fixed shell". The visual design system,
preset hierarchy, and host workflow surface were rebuilt with a warm typography-
led palette, primary-thread layout, condensed secondary rail, and host-recipe
context blocks composed entirely from primitives. See the 2026-05-15 visual
quality rebuild gate entry in `docs/testing.md`.

Reopened a fourth time on 2026-05-15 after a follow-up review found that the
layout was fine but the *basic primitives themselves* (composer, button, input,
approval, command/diff block, sidebar) were under-crafted: the composer read
as a row of form controls, button hierarchy was unclear, App/Plugin chips
looked careless, and the approval card lacked decision affordance. The
interactive layer was rebuilt in place. See the 2026-05-15 primitive
craftsmanship rebuild entry in `docs/testing.md`.

Reopened a fifth time on 2026-05-15 because the default UI still treated
command/file-change work as a UI-owned activity grouping instead of a Codex App
Server transcript. This pass removes that grouping from the default path,
keeps command/tool/diff items inline in turn order, hardens long transcript
layout, moves run settings into a compact composer popover, and makes history
pagination infinite-scroll first.

Reopened a sixth time on 2026-05-15 because removing the Work trace surface did
not finish the transcript-first architecture: huge hydrated threads could still
mount every item and heavy body immediately, `AgentChat` still defaulted to
dashboard-like usage/diagnostics chrome, and the real local web example needed
a dedicated layout audit gate.

- [x] Remove the default activity grouping surface and render command,
      tool-call, command-output, file-change, and diff items inline with the
      transcript item order.
- [x] Export transcript item primitives for host-owned composition and
      component QA.
- [x] Replace the composer settings strip with a compact popover/sheet that
      does not squeeze the textarea or approval actions.
- [x] Make the thread sidebar cursor pagination infinite-scroll first with a
      single Load more fallback and no bulk-load control.
- [x] Harden message list, turns, markdown, command output, diff, thread title,
      and sidebar row overflow behavior with element-level bounding checks.
- [x] Update docs, tests, examples, and QA notes so the default surface is
      transcript-first rather than dashboard/activity-first.
- [x] Make `AgentChat` default to transcript-first chrome with `usage=false`
      and `diagnostics=false`.
- [x] Render large hydrated transcripts incrementally with `Show earlier items`
      while preserving App Server turn/item order.
- [x] Keep user/assistant messages expanded; keep command output, JSON/tool
      payloads, and CodeMirror diffs unmounted until their details disclosure is
      opened.
- [x] Add `AgentRunSettingsPanel` as a standalone compact primitive.
- [x] Add `scripts/real-local-web-layout-audit.mjs` for the already-running
      real `examples/codex-local-web` port-5175 gate.
- [x] Gate the real local web composer with viewport rect and send-button
      hit-test checks so the transcript cannot push the composer offscreen.
- [x] Extend the CSS duplication guard to the transcript, composer, sidebar,
      run settings, and rail selectors named in the transcript-first audit.

- [x] Rebuild the composer as one bordered rounded card with attachment
      chips, an auto-resizing textarea, an inline icon-button toolbar
      (paperclip, image, App, Plugin), and a primary circular send icon
      button with an `Enter to send` hint and natural focus / disabled /
      drag states.
- [x] Replace the ad-hoc `aui-button*` classes with an explicit `aui-btn`
      system (`primary | secondary | ghost | danger | subtle`,
      `sm | md | lg`, `icon-only`) so `Approve`, `Decline`,
      `Approve for session`, `New thread`, `Refresh`, `Hide`, and
      `App / Plugin` mention buttons each render at the right hierarchy.
- [x] Unify the input layer with a shared `aui-input-shell` (icon prefix,
      one focus ring) and `aui-select` (custom chevron) so cwd / search /
      model / effort / segmented controls share one visual language.
- [x] Rebuild the approval card with shield icon, humanized title and
      reason, `LOW / MED / HIGH` risk pill, command on a dark surface, a
      metadata grid for cwd / sandbox / approval policy, and three explicit
      decisions on a divider footer.
- [x] Refine the timeline: user bubble uses primary-tinted accent, assistant
      text flows as markdown, plan callout uses primary tint, command/diff
      share a dark code surface, and `COMPLETED` meta is suppressed on
      user/assistant items.
- [x] Polish sidebar search and thread list: icon-prefix search,
      coloured status dot per thread, subtle-variant Load/Load more/Hide so
      secondary chrome never reads as primary actions.
- [x] Add a `Component close-ups` section to `/fixture-gallery` that renders
      composer (normal/focused/approval-pending/mobile), approval cards
      (command/user input), command/diff surfaces, sidebar search + threads,
      usage/status chips, the full button palette, and inputs/selects/
      segmented as direct live primitives — not iframes.
- [x] Fix the host workflow recipe so `AgentStatusSummary` is rendered
      exactly once, with a Playwright regression that asserts no duplicates.

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
- [x] Rework `AgentChat` so thread/transcript is the primary column and status, diagnostics, and usage move to compact secondary chrome.
- [x] Replace full-width status-banner stacking with compact summary rail plus critical inline warnings near the thread.
- [x] Re-run kitchen desktop/mobile visual QA with saved screenshots and update the Playwright layout contract snapshots.
- [x] Add primitive-first status/thread/usage exports so host apps can recreate
      the preset from independently placed components.
- [x] Keep mobile status, usage, and diagnostics reachable through compact
      secondary chrome instead of hiding the rail.
- [x] Normalize status severity so normal rate-limit messages do not render as
      critical thread warnings.
- [x] Rebuild the design system with a warm, typography-led palette, reduced
      card noise, and intentional message-bubble hierarchy (user bubble,
      assistant flowing markdown, reasoning blockquote, plan callout, code
      surface for command/diff).
- [x] Rewrite the secondary rail as cohesive cards (status summary, status
      details, usage, diagnostics) inside a bg-soft strip instead of a stack of
      bordered boxes.
- [x] Make the approval card the highest-contrast affordance on the thread
      surface, with a strong primary Approve button and outline secondaries.
- [x] Humanize item-kind labels (`MCP tool`, `Web search`, `Compaction`, etc.)
      so meta lines never show camelCase protocol identifiers.
- [x] Fix mobile approval/composer horizontal clipping after the approval
      hit-test pass, and add bounding-rect viewport guards so overflow hidden
      cannot hide regressions from Playwright.

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

Reopened again on 2026-05-15 because the host workflow route still used the
preset shell too heavily and the fixture gallery needed stronger loading and
nonblank preview checks.

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
- [x] Rebuild `/host-workflow-recipe` from thread/status/usage/approval/composer
      primitives rather than placing an `AgentChat` preset beside a host card stack.
- [x] Add gallery loading state, reload affordance, and Playwright checks that
      kitchen and host-workflow previews are not blank.
- [x] Rewrite `/host-workflow-recipe` as a real product surface: intent header,
      selected-thread meta, two-column composition, host-owned workflow context
      blocks (stats, validation checklist, pending requests, plan/context,
      usage windows), and host actions wired to the verification command. No
      `h2/p/ol` demo prose, no generic metric cards.
- [x] Rewrite `/fixture-gallery` as a grouped visual QA surface (Preset
      surfaces, Primitive compositions, Lifecycle states) with dark device
      frames, size labels, and per-frame loading state.

## Milestone 8: Browser Verification With agent-browser

Reopened on 2026-05-14 because previous evidence leaned toward
accessibility/existence checks and did not prove the visual quality of the
changed routes.

Reopened again on 2026-05-15 to add mobile secondary-chrome reachability,
rate-limit severity, duplicate-status, gallery-preview, and screenshot-buffer
smoke checks.

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
- [x] Add Playwright coverage for mobile secondary chrome, rate-limit normal
      status, non-duplicate critical status, gallery preview loading, and
      screenshot-buffer nonblank smoke.

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

Reopened again on 2026-05-15 to re-check primitive-first exports, public docs,
visual examples, and host-specific boundary terms after the composition rewrite.

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
- [x] Re-search public exports/docs/examples for host-specific worker-pane and
      app-panel runtime terms after the primitive-first rewrite.

## Milestone 11: Composer Resolver API And Visual QA Hardening

Reopened on 2026-05-15 to fix four primitive-quality gaps that survived the
craftsmanship rebuild: the chat input still relied on `globalThis.prompt()` for
App / Plugin mentions, image attachments reused the `@`-mention icon,
`packages/react/src/style.css` carried duplicated composer rules, and
`/fixture-gallery` plus `/usage-only` were not credible visual QA surfaces.

- [x] Replace `globalThis.prompt()` App / Plugin mention flow with host-supplied
      `onRequestAppMention` / `onRequestPluginMention` resolvers on
      `AgentComposer`, `AgentComposerPanel`, `AgentThreadView`, and `AgentChat`.
- [x] Hide composer App / Plugin buttons unless the host wires the matching
      resolver so embedders never ship a button that does nothing.
- [x] Add a dedicated `IconImage` and use it for the attach-image button and
      the image attachment chip; retire `IconAt` from those slots.
- [x] Delete legacy composer / button / segmented / status-pill /
      history-controls CSS blocks that were superseded by the rebuilt section
      in `packages/react/src/style.css`.
- [x] Cover composer behaviour with new vitest specs (no `globalThis.prompt`
      ever, resolver-driven chips, hidden buttons without resolvers, image
      icon on image chips) and a `style-duplication.vitest.ts` regression
      test for composer / button / status-pill duplication.
- [x] Reorder `/fixture-gallery` so component close-ups, critical interaction
      states, preset surfaces, then full-page iframe previews appear in that
      order on desktop and mobile.
- [x] Replace the hand-written `CloseupComposerFocused` DOM with the real
      `AgentComposer` driven by a `FocusFirstTextarea` effect, and add
      Playwright assertions that close-ups are rendered above iframes and
      reachable inside the first ~2 viewports.
- [x] Rebuild `/usage-only` as a four-section host-shell demo (compact rail,
      standalone quota panel, dashboard widget, inline thread chrome) using
      only generic `AgentUsagePanel` / `AgentUsageSummary` primitives.
- [x] Refresh `docs/screenshots/agent-ui-*` for every captured route after the
      composer + usage-only + fixture-gallery rebuild.
- [x] Update `docs/component-api.md` to document the resolver API, the image
      icon, and the no-`prompt()` guarantee.

Acceptance:

- [x] `bun run typecheck`, `bun run lint`, `bun test`, `bunx vitest run`,
      `bun run test:protocol`, `bun run test:fixtures`, `bun run build`,
      `bun run publint`, `bun run attw`, and `bun run test:e2e:playwright`
      all pass on the rebuilt branch.
- [x] No `skill-with-app`-specific registry, panel, storage, or client-tool
      APIs reappeared in `packages/`, `docs/`, or `examples/`.
- [x] `app/list` is still framed as Codex Apps/connectors, not as
      skill-with-app surface.

## Milestone 12: Approval Hit-Testing And Gallery Truthfulness

Reopened on 2026-05-15 after review found that visible approval actions in
`/?state=kitchen` were not actually clickable because composer/sidebar chrome
could cover their center points.

- [x] Make pending approval layouts reserve real pointer space above composer
      chrome on desktop and mobile instead of relying on visibility alone.
- [x] Add Playwright hit-test guards using `document.elementFromPoint()` and
      `locator.click({ trial: true })` for approval actions on `/`,
      `/?state=kitchen`, and `/host-workflow-recipe` at desktop and mobile
      sizes.
- [x] Keep `/fixture-gallery` close-up titles aligned with their rendered
      content: command and user-input approval close-ups show one approval
      each, and `Command block` shows the isolated command surface rather than
      a full timeline.
- [x] Handle rejected composer App / Plugin mention resolvers without
      unhandled promise rejections and without adding attachments.
- [x] Refresh docs screenshots after the approval layout and fixture-gallery
      changes.
- [x] Re-run the full validation ladder and browser QA for `/`,
      `/?state=kitchen`, `/host-workflow-recipe`, `/usage-only`, and
      `/fixture-gallery`.

Acceptance:

- [x] Approval action center points hit the intended button or its child for
      `Approve`, `Approve for session`, and `Decline` in the kitchen and
      host-workflow surfaces on desktop and mobile.
- [x] No `globalThis.prompt()` composer mention flow, `IconAt` image
      attachment, skill-with-app-specific API, or non-Apps/connectors framing
      for `app/list` has returned.

## Milestone 13: Composer / Approvals / History / Mobile Completion

Reopened on 2026-05-16 after a review found the basic experience still
unfinished: run settings were an external disclosure, approvals were a large
independent scroll pane, working directory was editable mid-thread, history
needed an explicit Load button, and mobile stacked the whole sidebar under the
chat.

- [x] Make `AgentApprovalQueue` a compact pending-decision surface above the
      composer: one expanded card plus compact picker rows, inline metadata,
      no large independent scroll pane.
- [x] Rebuild the composer as the primary input surface and remove the
      standalone `Run settings` disclosure.
- [x] Replace mode segmented control and model/effort selects with compact
      anchored toolbar menus (`AuiMenu`) that open as bottom sheets on mobile
      and support Esc / outside-click / arrow-key navigation.
- [x] Make working directory a thread-start setting only; remove cwd editing
      from existing-thread composer chrome.
- [x] Support image/file attachments through paste, drag-and-drop, and the
      toolbar pickers, with removable chips and send-payload wiring.
- [x] Add a real host upload endpoint to `examples/codex-local-web` so a
      browser `File` becomes a real `localImage` path.
- [x] Auto-load thread history and debounce-filter it from the search box;
      remove the standalone `Load` button.
- [x] Rebuild the mobile layout: chat + composer first, thread history as an
      off-canvas drawer opened from a `Threads` trigger.
- [x] Add fixture-gallery close-ups for pasted image, multiple attachments,
      mode menu, model/effort menu, and a mobile chat shell.
- [x] Add component tests for attachments, menus, cwd absence, multi-approval
      display, and debounced search; update Playwright and the real-local-web
      layout audit.
- [x] Refresh `docs/screenshots/*` and update README/docs for the new
      composer toolbar, menus, cwd-at-thread-start, attachments, approval
      surface, and mobile shell policy.

Acceptance:

- [x] `bun run typecheck`, `bun run lint`, `bun test`, `bun run test:protocol`,
      `bun run test:fixtures`, `bun run build`, `bun run publint`,
      `bun run attw`, `bun run test:node-compat`, and
      `bun run test:e2e:playwright` all pass.
- [x] `bun run test:e2e:real-local-web-layout` passes against a live port-5175
      `examples/codex-local-web` server with no horizontal overflow.
- [x] Real port-5175 verification: composer, mode/model/effort menus, history
      search, mobile drawer, and pasted-image attachment all work; no
      `Work trace` UI and no `Load all` control.

## Milestone 14: Approval In Transcript

Reopened on 2026-05-16 because the approval UI still failed: `AgentApprovalQueue`
was an independent `AgentThreadSurface` grid row with its own `max-height` +
`overflow: auto`, so on mobile the approval pane took ~350-400px while the
message list collapsed to ~36px, `.aui-command-line` / `.aui-metadata-grid`
clipped past a 390px viewport, and the experience read as a pane wedged between
the transcript and the composer instead of a pending decision at the end of the
thread.

- [x] Add a `footer` slot to `AgentMessageList` and render it as the final
      `<li>` of the transcript scroll area.
- [x] Make `AgentThreadTimeline` accept `threadId` and append the thread's
      pending `AgentApprovalQueue` into the transcript footer.
- [x] Remove the standalone `AgentApprovalQueue` row from `AgentThreadView`
      and the host-workflow recipe composition.
- [x] Drop the `.aui-approvals` grid row and the `:has(.aui-approvals)`
      row-shrink rule from `.aui-thread-surface` (now four rows: header,
      critical notices, transcript, composer).
- [x] Remove `max-height`, `overflow`, the gradient background, and the pane
      border from `.aui-approvals`; the transcript scroll area is the only
      scroll container.
- [x] Rebuild the approval card compact: drop heavy elevation, wrap command
      lines (`white-space: pre-wrap`) and metadata (`overflow-wrap: anywhere`),
      and use a 2-column mobile action grid with a full-width primary
      `Approve`.
- [x] Pull the transcript auto-scroll back from the bottom when a pending
      approval's decision footer would be clipped above the fold.
- [x] Add a Playwright gate asserting the approval is inside `.aui-message-list`,
      has no `max-height`, is not an independent scroll pane, the message list
      stays >=160px, and the document has no horizontal overflow at desktop and
      mobile.
- [x] Extend `scripts/real-local-web-layout-audit.mjs` with the same
      approval-pane checks (skipped when no approval is pending).
- [x] Update `docs/component-api.md`, `docs/architecture.md`, `docs/testing.md`,
      `README.md`, and the host-workflow recipe README for the in-transcript
      approval surface; refresh `docs/screenshots/*`.

Acceptance:

- [x] `bun run typecheck`, `bun run lint`, `bun test`, `bunx vitest run`,
      `bun run test:protocol`, `bun run test:fixtures`, `bun run build`,
      `bun run publint`, `bun run attw`, `bun run test:node-compat`, and
      `bun run test:e2e:playwright` all pass.
- [x] `bun run test:e2e:real-local-web-layout` passes against a live port-5175
      `examples/codex-local-web` server, and the audit also passes against
      port-5174 `/?state=kitchen` (approval fixture) with the message list at
      496px / 387px and zero overflow offenders.
- [x] Browser QA on port-5174 (`/`, `/?state=kitchen`, `/host-workflow-recipe`)
      and port-5175 confirms the approval is a transcript item, the decision
      footer is hit-testable, and there is no horizontal overflow on desktop
      or mobile.

## Milestone 15: Refactor Without Behavior Changes

Opened on 2026-05-17 for a structure-only refactor. The user-facing port-5174
fixture experience and port-5175 real Codex local web experience must stay
unchanged. Stored transcripts remain loss-aware: regular user/assistant
messages stay expanded, command/tool/diff/file-change items stay inline in the
transcript, and heavy command/tool/diff bodies remain mounted only after their
details disclosure is opened.

- [x] Add behavior-lock regression tests before moving code: normal messages do
      not collapse, stored file-change turns keep tool context, closed tool
      cards show readable previews, open tool cards expose arguments/result/
      error, thread rows keep title/meta, and markdown/code blocks avoid nested
      scroll traps.
- [ ] Split `packages/react/src/timeline.tsx` into internal transcript modules
      without changing public exports or App Server item-kind behavior.
- [ ] Organize transcript CSS so message, block, tool, command, and diff
      selectors are easier to audit without changing layout.
- [ ] Split the local fixture example into route and fixture modules while
      keeping it clearly separate from `examples/codex-local-web`.
- [ ] Update README and docs for the refactored internal architecture and
      remove stale vocabulary.
- [ ] Re-run the required validation ladder and browser QA for 5174 fixture
      routes and 5175 real local web at desktop and mobile viewports.
