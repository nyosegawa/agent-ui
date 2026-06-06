# Agent UI Host Integration Plan

## Purpose

Two real host applications exposed the same class of problems: Agent UI is
usable as an embeddable Codex App Server UI, but several host integration
contracts are still implicit. This plan turns those findings into durable public
API, examples, documentation, tests, and the installable `skills/agent-ui`
guidance.

This is not a plan to make Agent UI a host runtime. Hosts still own product
workflow, routing, authentication, workspace selection, persistence, process
lifecycle, deployment topology, and audit policy. Agent UI should own stable UI
primitives, React controllers, bridge helpers, local media metadata, overlay
layer contracts, and executable examples that keep host implementations from
guessing at internals.

## Source Findings

### Agent App Embed

- `AgentChat` was embedded inside product chrome with header, navigation,
  runtime panel, mobile drawer sidebar, host sheets/modals, local attachments,
  and transcript local media preview.
- Pain points were mobile drawer interaction, overlay stacking, local media
  safety, lack of a full host integration reference app, and unclear public
  behavior for first-message optimism and scoped thread history.
- Local media is already mostly addressed in current docs and implementation:
  `createAgentUiLocalMediaHelper()`, structured `AgentResolvedResource`
  metadata, missing-media fallback, asset IDs, and same-origin serving exist.
  Remaining work is to update installable skill guidance and ensure examples
  prove the safe path.

### Watcher Embed

- Watcher is a Tauri desktop app with React UI, Node sidecar, Codex App Server
  bridge, embedded thread surface, localStorage resume, and user-selected worker
  workspace.
- Pain points were unsafe `startThread()` then `startTurn()` sequencing,
  ambiguous `resumeThread()` canonical id handling, static high-level bridge
  options, local desktop admission design, and host-gated workflow composition.
- Current code confirms the issue: `useAgentTurnController(threadId)` binds to
  the thread id from the render that created it, while `startThread()` returns
  only `{ threadId }` and `startTurn()` throws without an active/resolved
  thread. The default `AgentChat` has an internal safe first-message path, but
  headless hosts do not.

## Adopted Direction

### 1. Public Thread Start/Resume Results And Safe First Turn

Adopt a public React controller surface that lets host code start a thread and
its first turn without waiting for React state propagation.

Preferred shape:

```ts
const result = await thread.startThread({
  thread: { model, cwd, approvalPolicy, sandbox },
  input,
});

await result.thread.startTurn(nextInput);
```

or, if a handle is too large for the first implementation:

```ts
const result = await thread.startThreadWithInput({ thread, input });
await result.startTurn(nextInput);
```

The public result must be an Agent UI view-model result, not a raw App Server
response. It should make the id to persist obvious:

```ts
{
  threadId: "thread-canonical",
  requestedThreadId?: "thread-alias",
  startedTurnId?: "turn-1",
}
```

For resume, `resumeThread()` should return a result that explicitly distinguishes
the requested id from the active canonical id, or it should return a thread
handle whose `threadId` is the id hosts should persist after resume. Avoid
publishing internal alias maps or reconciliation operation maps.

### 2. Per-Connection Bridge Resolution Without Host Runtime Ownership

Keep `attachAgentUiWebSocketBridge()` as the simple local single-user helper.
Add a per-connection resolver pattern for local desktop and sidecar hosts whose
workspace/env/policy can change between WebSocket connections.

The direction is a typed resolver/helper that validates host decisions before
spawning Codex App Server:

```ts
resolveBridgeOptions({ request }) => ({
  cwd: resolveAllowedWorkspace(request),
  env: codexBridgeEnv(),
  bridgePolicy: { admission: desktopAdmission },
  browserMethodPolicy: "productized",
  serverRequestPolicy: hostServerRequestPolicy(),
});
```

The resolver may be exposed through `attachAgentUiWebSocketBridge()` if it stays
thin, or as a recipe/helper built around `handleAgentUiWebSocketConnection()`.
Do not add a workspace registry, Tauri/Electron store, token store, tenant model,
or process supervisor to Agent UI.

### 3. Mobile Drawer And Overlay Layer Contract

Make the mobile thread drawer a real public behavior of the `AgentChat` preset:

- backdrop click closes the drawer
- Escape closes the drawer
- focus returns to the `Open thread history` trigger
- the chat surface behind the drawer is inert or equivalently non-interactive
- drawer search and thread selection remain reachable
- body/shell scroll behavior is intentional and tested

Introduce public layer tokens instead of raw z-index constants:

```css
--aui-z-backdrop
--aui-z-drawer
--aui-z-popover
--aui-z-sheet
--aui-z-dialog
--aui-z-toast
```

Agent UI should document the relative order of its own surfaces. Host sheets or
modals remain host-owned, but hosts should know where to place them relative to
Agent UI drawers, menus, dialogs, and toasts without styling private `.aui-*`
selectors.

### 4. Host Composition Examples As Executable Specifications

Extend the existing host workflow fixtures instead of creating a marketing demo.
The reference surface should prove:

- desktop host header plus `AgentChat`
- desktop `AgentChat` plus optional host side panel
- mobile host header plus `AgentChat`
- mobile drawer open/close and blocked background hit testing
- mobile drawer plus host-owned sheet/modal layering
- local attachment upload with structured metadata
- transcript local media preview and missing-media fallback
- first user message optimistic rendering
- scoped thread history loading
- host-gated workflow composition where the host controls a gate and Agent UI
  owns the thread timeline/composer primitives

The host-gated workflow should remain a recipe/primitive composition. Do not add
Watcher-specific proposal, worker, plan approval, or localStorage semantics to
core Agent UI.

### 5. Installable `skills/agent-ui` Refresh

The skill should encode the public integration contract so future agents do not
rediscover these boundaries.

Update the skill to cover:

- thread lifecycle and canonical resume integration
- local desktop bridge admission and per-connection option resolution
- mobile drawer and overlay layer behavior
- local media helper and structured resource metadata
- host-owned workflow composition
- validation checks for real interactions, not screenshots alone

Keep the skill concise and route to references. Do not turn it into a full API
manual or copy application-specific Watcher/Agent App details.

## Explicit Non-Goals

- No hosted Codex service, auth provider, billing layer, credential store, or
  process orchestration layer.
- No Host modal/sheet manager in `@nyosegawa/agent-ui-react`.
- No browser-provided `cwd`, `env`, or method policy trusted directly for bridge
  spawn.
- No `browserMethodPolicy: "all"` recommendation for desktop convenience.
- No `unsafe-no-admission` default for local desktop apps.
- No public dependency on private `.aui-*` selectors or raw z-index values.
- No raw App Server response or generated protocol payload in new React public
  controller results.
- No public exposure of internal optimistic operation maps, alias maps, or
  reducer reconciliation records.

## Implementation Phases

### Phase 1: Contracts And API Design Gates

Update architecture and reference docs first so the implementation has a fixed
target:

- add thread handle / first-turn design gate
- add bridge per-connection resolver design gate
- add overlay layer and drawer accessibility design gate
- add host workflow recipe design gate
- update package export policy before changing public API snapshots

### Phase 2: React Thread Lifecycle API

Refactor the existing internal safe first-message path into a public raw-free
controller action. Preserve `AgentChat` behavior while making the same safe path
available to headless hosts.

Validate with React tests, core reconciliation tests, API snapshots, package
resolution, and recipe examples.

### Phase 3: Server Bridge Resolver And Desktop Admission Recipe

Add the typed resolver/helper or documented low-level pattern. Prove that
connection-specific `cwd`, `env`, admission, browser method policy, server
request policy, and dynamic-tool policy are resolved before bridge spawn.

Keep `attachAgentUiWebSocketBridge()` simple for local single-user use unless
the resolver can be added without making it a runtime owner.

### Phase 4: Overlay Layer Tokens And Mobile Drawer Behavior

Add layer tokens to `tokens.css`, replace internal raw z-index values, document
the relative layer contract, and implement drawer Escape/focus/background
interaction behavior.

Validate with React component tests, Playwright hit tests, and style token
guards.

### Phase 5: Host Integration Fixtures And Docs

Extend `examples/local-react-vite` and existing docs to show the full host
embedding shape, including host overlay layering and host-gated workflow
composition.

Do not rely on a static screenshot. The example must support interaction tests.

### Phase 6: Skill Refresh

Update `skills/agent-ui` references and tests after the public docs/API direction
is stable enough to avoid teaching stale names.

### Phase 7: Validation And Release Readiness

Run focused checks after each phase, then the broader release checks before
claiming readiness:

- `bun run test:skills`
- focused React component tests
- focused server bridge tests
- `bun run test:styles`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run validate:packages`
- `bun run validate:e2e`
- `bun run validate:release`

## Success Criteria

- A headless host can safely start a new thread with an initial turn without
  waiting for React state propagation.
- A host resuming a stored thread can clearly identify and persist the canonical
  active thread id.
- A desktop/sidecar host can resolve bridge options per connection without using
  browser-controlled cwd/env or rewriting the low-level WebSocket bridge.
- Mobile drawer behavior works without host CSS patches and blocks background
  interaction.
- Host overlays can be placed relative to Agent UI layers using documented
  tokens, not private selectors.
- Local media skill guidance points to structured metadata and
  `createAgentUiLocalMediaHelper()`, not raw paths or string URL shorthands.
- Host integration examples cover real layout, stacking, accessibility, local
  media, first-message optimism, scoped history, and host-gated composition.
- `skills/agent-ui` triggers for the real integration problems and preserves the
  product boundary.
