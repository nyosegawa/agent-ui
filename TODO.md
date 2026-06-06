# Agent UI Host Integration TODO

## 0. Planning Baseline

- [x] Confirm the branch is not `main` before implementation work.
- [x] Re-read `docs/architecture/product-boundary.md` before changing public
      API, bridge behavior, examples, or skills.
- [x] Keep all implementation changes outside `third_party/codex`.
- [x] Do not hand-edit generated schema or package `dist` output.
- [x] Add or update a changeset when public package behavior changes. No
      changeset is needed for the docs-only contract baseline; revisit this on
      the first public package behavior change.

## 1. Contract Documentation First

- [x] Update `docs/architecture/host-integration-design-gates.md` with a design
      gate for public thread start/resume handles.
  - [x] State that optimistic operation maps, alias maps, raw App Server
        responses, and reducer reconciliation remain internal.
  - [x] State that public results must identify the thread id hosts should
        persist after start/resume.
  - [x] Name the examples and tests that prove the contract.
- [x] Update `docs/architecture/host-integration-design-gates.md` with a design
      gate for per-connection bridge option resolution.
  - [x] Keep auth, workspace policy, token storage, tenant/session mapping, and
        process supervision host-owned.
  - [x] State that `attachAgentUiWebSocketBridge()` remains the simple local
        helper unless the resolver stays thin.
- [x] Update `docs/architecture/host-integration-design-gates.md` with a design
      gate for overlay layers and mobile drawer behavior.
  - [x] Define which layer decisions are Agent UI-owned.
  - [x] Define how hosts place their own sheets/modals relative to Agent UI.
- [x] Update `docs/architecture/host-integration-design-gates.md` with a design
      gate for host-gated workflow composition.
  - [x] Keep product workflow state machines host-owned.
  - [x] Prefer primitives/recipes over workflow-specific core APIs.
- [x] Update `docs/reference/package-exports.md` before exporting any new public
      React or server types.
- [x] Update `docs/reference/hooks.md` with the selected thread start/resume
      public result shape.
- [x] Update `docs/reference/server-bridge.md` with the selected
      per-connection resolver/helper pattern.
- [x] Update `docs/reference/react-components.md` with drawer and overlay layer
      public behavior.
- [x] Update `docs/guides/host-integration.md` with the new host integration
      checklist.

## 2. React Thread Lifecycle API

- [x] Design the public result type for safe thread start with first turn.
  - [x] Include the id hosts should persist.
  - [x] Do not return raw `ThreadStartResponse` or `TurnStartResponse`.
  - [x] Do not expose internal optimistic operation ids unless they are
        converted into a stable public view-model concept.
- [x] Design the public resume result type.
  - [x] Include `threadId` as the canonical/resolved id.
  - [x] Include `requestedThreadId` when useful for host diagnostics.
  - [x] Avoid publishing alias maps or reducer reconciliation internals.
- [x] Refactor the current internal first-message path in
      `packages/react/src/hooks/composer.ts` so public headless hosts can use the
      same safe behavior as `AgentChat`.
- [x] Preserve current `AgentChat` first-run behavior.
- [x] Update `packages/react/src/hooks/thread.ts` and related exports with the
      selected public API.
- [x] Update `packages/react/src/hooks/thread-list.ts` if scoped list resume
      results should expose the same resolved-id semantics.
- [x] Update examples using headless hooks so they no longer teach unsafe
      `startThread()` then `startTurn()` sequencing.
- [x] Add focused React tests proving:
  - [x] a first user message appears immediately while `thread/start` is
        pending
  - [x] `turn/start` uses the canonical/resolved thread id after thread start
  - [x] start failure leaves a stable public failed-message state
  - [x] retry/cancel remain raw-free
  - [x] `resumeThread()` returns the id hosts should persist
  - [x] direct URL and scoped-list resume still reconcile aliases correctly
- [x] Preserve core reducer tests for optimistic thread reconciliation,
      stale turn/item event canonicalization, and pending server request migration.
- [x] Update API snapshots and package-resolution tests.

## 3. Server Bridge Resolver And Local Desktop Admission

- [x] Select `attachAgentUiWebSocketBridge({ resolveBridgeOptions })` as the
      public shape instead of a separate handler wrapper.
- [x] Ensure bridge options are resolved before `createCodexAppServerBridge()`
      spawns Codex App Server.
- [x] Ensure resolver rejection closes the socket without spawning a child
      process.
- [x] Keep the resolved option set explicit:
  - [x] `cwd`
  - [x] `env`
  - [x] `initialize`
  - [x] `bridgePolicy.admission`
  - [x] `browserMethodPolicy`
  - [x] `serverRequestPolicy`
  - [x] `dynamicToolPolicy`
  - [x] `hostEvents`
  - [x] inbound limits and idle/backpressure settings
- [x] Add a local desktop admission recipe for Tauri/Electron/sidecar-style
      hosts.
  - [x] Require loopback binding by default.
  - [x] Treat `Origin` as signal, not authentication.
  - [x] Use an explicit sidecar/session token or host callback when needed.
  - [x] Describe no-Origin request handling as a host decision.
  - [x] Keep packaged app CSP coordination host-owned.
  - [x] Validate selected workspaces server-side before assigning bridge `cwd`.
- [x] Add server tests proving:
  - [x] different connections can spawn with different `cwd`/`env`
  - [x] rejected resolver/admission paths do not spawn
  - [x] dynamic-tool helper threads use the resolved connection cwd
  - [x] `createCodexAppServerBridge()` passes `cwd`/`env` to the spawn callback
- [x] Update `examples/recipes` with typed bridge/admission snippets if the
      recipe is not a full runnable example.

## 4. Mobile Drawer And Overlay Layers

- [x] Add public layer tokens in `packages/react/src/styles/tokens.css`.
  - [x] `--aui-z-backdrop`
  - [x] `--aui-z-drawer`
  - [x] `--aui-z-popover`
  - [x] `--aui-z-sheet`
  - [x] `--aui-z-dialog`
  - [x] `--aui-z-toast`
- [x] Replace raw z-index values in distributed React CSS with layer tokens
      where they represent shared overlay decisions.
- [x] Keep one-off example z-index values in example CSS only when they are
      specific to the fixture composition.
- [x] Implement mobile drawer Escape close.
- [x] Implement focus return to the `Open thread history` trigger after drawer
      close.
- [x] Make the chat/background region inert or equivalently non-interactive
      while the drawer is open.
- [x] Decide and document drawer scroll-lock behavior.
- [x] Preserve current closed-drawer DOM behavior unless deliberately changing
      tests and docs.
- [x] Add React component tests for drawer Escape, backdrop close, focus return,
      and background non-interaction.
- [x] Add Playwright tests that:
  - [x] open the drawer on mobile
  - [x] verify background composer/menu actions cannot be clicked
  - [x] verify drawer search/select still works
  - [x] verify no horizontal overflow
  - [x] verify the drawer closes after selection
- [x] Add style tests that layer tokens exist and shared overlays use them.

## 5. Host Integration Reference App

- [x] Decide whether to extend `/host-workflow-recipe` or add a new route.
- [x] Cover desktop host header plus `AgentChat`.
- [x] Cover desktop `AgentChat` plus host side panel.
- [x] Cover mobile host header plus `AgentChat`.
- [x] Cover mobile drawer open/close.
- [x] Cover mobile drawer plus a host-owned sheet/modal with documented layer
      order.
- [x] Cover local attachment upload with structured resource metadata.
- [x] Cover transcript local media preview and missing-media fallback.
- [x] Cover first-message optimistic rendering.
- [x] Cover scoped thread history loading.
- [x] Cover host-gated workflow composition without adding Watcher-specific
      semantics to Agent UI core.
- [ ] Add Playwright tests for layout, stacking, hit testing, focus, scroll, and
      mobile overflow.
- [ ] Update `docs/examples/local-react-vite.md`, `docs/getting-started.md`, and
      `docs/architecture/testing.md` for the new/extended route.

## 6. Local Media Guidance Alignment

- [ ] Confirm current local media implementation still matches docs:
  - [ ] `createAgentUiLocalMediaHelper()`
  - [ ] structured `AgentResolvedResource`
  - [ ] `AgentResolvedLocalAttachment`
  - [ ] `resolveLocalMediaUrl(path, item)`
  - [ ] missing-media fallback
  - [ ] asset-id URLs rather than raw filesystem browser URLs
  - [ ] `serveAssetHandler` opt-in admission
  - [ ] SVG rejection and content-type behavior
- [ ] Update examples or docs if any local media guidance still recommends
      raw paths, string URL shorthands, or upload-only helpers as the primary path.
- [ ] Preserve `createAgentUiLocalUploadHandler()` as compatibility guidance,
      but present `createAgentUiLocalMediaHelper()` as the main helper.

## 7. Installable `skills/agent-ui` Refresh

- [ ] Keep `skills/agent-ui/SKILL.md` under the progressive-disclosure limit.
- [ ] Update the skill description with trigger terms for:
  - [ ] thread lifecycle
  - [ ] canonical resume
  - [ ] local media helper
  - [ ] mobile drawer
  - [ ] overlay layers
  - [ ] local desktop bridge
  - [ ] host-gated workflow
- [ ] Update `skills/agent-ui/SKILL.md` job classification to include:
  - [ ] thread lifecycle / resume / history integration
  - [ ] host-owned workflow composition
  - [ ] local desktop bridge policy
- [ ] Update `skills/agent-ui/references/server-bridge.md`.
  - [ ] `bridgePolicy.admission`
  - [ ] `local-loopback`
  - [ ] `host-callback`
  - [ ] `unsafe-no-admission` as non-default
  - [ ] `browserMethodPolicy`
  - [ ] inbound limits
  - [ ] bridge health events
  - [ ] initialize ownership
  - [ ] per-connection resolver pattern
- [ ] Update `skills/agent-ui/references/local-single-user.md`.
  - [ ] loopback default
  - [ ] local desktop sidecar admission
  - [ ] non-loopback opt-in requirements
- [ ] Update `skills/agent-ui/references/layout-composition.md`.
  - [ ] mobile drawer contract
  - [ ] overlay layer tokens
  - [ ] Host-owned sheet/modal placement
  - [ ] host-gated workflow recipe guidance
- [ ] Update `skills/agent-ui/references/uploads.md`.
  - [ ] `createAgentUiLocalMediaHelper()` as the main helper
  - [ ] structured resource metadata
  - [ ] same-origin asset route
  - [ ] `serveAssetHandler` opt-in
  - [ ] no string URL shorthand
  - [ ] no raw filesystem path as browser `src`
- [ ] Update `skills/agent-ui/references/integration-profiles.md` with
      per-connection bridge and workflow-gate classification.
- [ ] Update `skills/agent-ui/references/debug.md` with:
  - [ ] canonical resume
  - [ ] `thread/read` preview versus `thread/resume`
  - [ ] mobile drawer reachability
  - [ ] structured local media resolution
  - [ ] per-connection admission rejection
- [ ] Update `skills/agent-ui/references/validation.md` with interaction checks
      for drawer, overlay, resume, local media, and bridge admission.
- [ ] Update `test/agent-ui-skill.test.ts` required strings and forbidden
      strings to guard the refreshed guidance.
- [ ] Run `bun run test:skills`.

## 8. Validation Matrix

- [ ] After docs-only contract updates, run the focused docs/skill tests that
      apply.
- [ ] After React API updates, run:
  - [ ] focused React component/hook tests
  - [ ] `bun run test:api-snapshots`
  - [ ] `bun run test:package-resolution`
- [ ] After server bridge updates, run:
  - [ ] focused `packages/server/test/websocket.test.ts`
  - [ ] focused `packages/server/test/bridge.test.ts`
  - [ ] package API snapshots if exports changed
- [ ] After CSS overlay updates, run:
  - [ ] `bun run test:styles`
  - [ ] relevant React component tests
- [ ] After example updates, run:
  - [ ] relevant example typecheck/build
  - [ ] focused Playwright specs
  - [ ] `bun run test:e2e:fixtures`
- [ ] Before merge readiness, run:
  - [ ] `bun run validate:fast`
  - [ ] `bun run validate:protocol`
  - [ ] `bun run validate:packages`
  - [ ] `bun run validate:e2e`
  - [ ] `bun run validate:release`

## 9. Merge Readiness Review

- [ ] Confirm public docs, package exports, examples, tests, and skill guidance
      all describe the same API names and behavior.
- [ ] Confirm no host runtime, auth provider, process supervisor, tenant model,
      workflow orchestrator, or modal manager moved into Agent UI core.
- [ ] Confirm no host-facing guidance depends on private `.aui-*` selectors.
- [ ] Confirm no new public React result exposes raw App Server generated
      payloads.
- [ ] Confirm local media guidance never maps raw filesystem paths to browser
      URLs.
- [ ] Confirm remote/multi-user guidance still requires host-owned auth,
      isolation, admission, resource limits, and audit logging.
- [ ] Inspect GitHub Actions after pushing an implementation branch and follow
      running workflows to concrete success or failure before claiming ready.
