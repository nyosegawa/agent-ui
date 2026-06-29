# Host Integration Design Gates

This note records the review gates for Agent UI's current host integration
model. Update it whenever a gate moves from source-level implementation detail
to documented public API.

## Public Thread View Model Versus Internal Normalized Entity

- What remains internal: normalized thread entities, registry or collection
  bookkeeping, canonical-ID reconciliation state, raw protocol payloads, and
  operation records.
- What becomes public: `AgentThreadView`, `AgentThreadCollection`,
  `AgentThreadScope`, active-thread selectors/controllers, and operation status
  view models that hide raw store shape.
- Host responsibility intentionally not handled: persistence, workspace or
  tenant scope semantics, audit logs, routing, and durable archival policy.
- Example that proves the design: `examples/local-react-vite` scoped thread
  pane and default sidebar fixtures.
- Tests that protect the contract: core reducer collection tests, React sidebar
  controller tests, API snapshots, and fixture e2e for sidebar search/select.

## Optimistic First-Message Operation Model

- What remains internal: pending operation objects, rollback callbacks,
  temporary IDs, retry bookkeeping, canonical-ID reconciliation details,
  `startWithMessage`, retry/cancel by operation ID, and failed first-message
  operation controls.
- What becomes public: raw-free thread lifecycle results and handles that make
  the host-persisted thread id explicit after start or resume, plus a composer
  controller view for text state, submit/stop/steer actions, active-turn state,
  queued follow-ups, and stable failed-message state.
- Host responsibility intentionally not handled: custom persistence of failed
  drafts, product workflow routing after submit, and long-term retry policy.
- Examples that prove the design: `examples/codex-local-web` first-run local
  thread start through the bridge and `examples/recipes/src/headless-hooks.tsx`
  using `startThreadWithInput()` instead of sequencing raw `thread/start` then
  `turn/start` calls.
- Tests that protect the contract: composer/controller unit tests for immediate
  pending state, canonical-id turn start, reconciliation, rollback, retry,
  duplicate prevention, raw-free failed-message controls, resume result
  canonicalization, and an e2e proving the first user message appears before
  assistant output.

## Public Thread Start And Resume Handles

- What remains internal: optimistic operation maps, canonical-id alias maps,
  raw `ThreadStartResponse` / `ThreadResumeResponse` /
  `TurnStartResponse` payloads, reducer reconciliation records, pending server
  request migration records, and temporary item/turn ids.
- What becomes public: an Agent UI thread lifecycle result or handle whose
  `threadId` is the canonical id hosts should persist after `startThread()`,
  first-message start, or `resumeThread()`. Resume results may include
  `requestedThreadId` for diagnostics when the host asked for an alias or stale
  persisted id, and first-message results may include stable view-model turn
  metadata such as `startedTurnId` only when it is not a raw protocol payload.
- Host responsibility intentionally not handled: durable thread persistence,
  URL routing, localStorage/session storage, workspace/project mapping,
  tenant/session identity, and product workflow transitions after start or
  resume.
- Examples that prove the design: `examples/recipes/src/headless-hooks.tsx`
  using `startThreadWithInput()`, the default `AgentChat` first-run path, and
  the scoped-list/direct-URL resume fixtures in `examples/local-react-vite`.
- Tests that protect the contract: React lifecycle tests for immediate first
  user message rendering while `thread/start` is pending, `turn/start` using
  the canonical thread id after start reconciliation, stable failed-message
  retry/cancel state, `resumeThread()` returning the persisted id, direct URL
  canonical resume, scoped-list canonical resume, core reducer alias
  reconciliation, API snapshots, and package-resolution smoke.

## Local Media Helper Security And Naming

- What remains internal: temp-directory layout, token generation, cleanup
  internals, registered asset lookup, filesystem traversal checks, and static
  byte-serving implementation.
- What becomes public: `createAgentUiLocalMediaHelper()`,
  `AgentResolvedAttachment`, asset-ID URL creation, upload handler, constrained
  `serveAssetHandler`, cleanup methods, and structured preview metadata.
- Host responsibility intentionally not handled: auth, session admission,
  upload persistence, remote storage, static file authorization, tenant
  isolation, and cleanup policy beyond helper-level TTL support.
- Example that proves the design: `examples/codex-local-web` composer and
  transcript local image attachment flow.
- Tests that protect the contract: server path traversal and admission tests,
  React composer preview URL tests, transcript media resolution tests, missing
  media fallback tests, and real-local attachment e2e.

## Controller Count And Responsibilities

- What remains internal: raw reducer dispatch details, temporary adapters,
  queue stores, thread-list collection request sequencing, stale response
  suppression, and lower-level block renderer state that does not own a stable
  host behavior boundary.
- What becomes public: conservative controllers for session bootstrap, active
  thread, thread list, thread, composer, transcript, transcript scroll, server
  requests, and diagnostics after examples, tests, docs, and API snapshots
  prove them.
- Host responsibility intentionally not handled: workflow state machines,
  routing, persistence, account/workspace policy, and custom tool registries.
- Example that proves the design: the default `AgentChat` sidebar plus
  `examples/recipes/src/headless-hooks.tsx` built on public controllers.
- Tests that protect the contract: controller unit tests, React component
  tests for scoped lists/resume/history sync, API snapshots, and docs
  snippet/API import tests.

## Scoped Thread List Host Semantics

- What remains internal: request sequencing implementation, stale response
  suppression, collection cursor bookkeeping, reducer event details, and raw
  `thread/list` payloads.
- What becomes public: `useAgentThreadListController(scope, options)`, its
  controller/request/options/sync-event types, scoped thread views,
  loading/error state, preview activation, explicit resume, and normalized
  history-sync metadata.
- Host responsibility intentionally not handled: tenant/workspace/project
  authorization, persisted history ownership, routing policy, audit logs, and
  durable storage of list sync events.
- Example that proves the design: default `AgentChat` sidebar and
  `examples/recipes/src/scoped-thread-list.tsx`, which uses the public
  controller instead of parsing raw `thread/list` responses.
- Tests that protect the contract: React controller tests for explicit
  `scope.key`, search pagination isolation, stale response suppression,
  background preview settings, canonical activation/resume, direct URL
  canonical resume, and normalized `onHistorySynced` metadata.

## Component Replacement Map Scope

- What remains internal: implementation-only styled primitives, CSS chunk
  structure, internal `.aui-*` selectors, and replacement points not used by the
  default preset.
- What becomes public: an `AgentComponents` map for shell, sidebar, empty
  state, composer panel, transcript block renderers, and approval surface.
- Host responsibility intentionally not handled: page-level product chrome,
  marketing layout, routing, and custom design-system governance.
- Example that proves the design: `examples/recipes/src/custom-components.tsx`
  and `/maintainer-gallery` close-ups.
- Tests that protect the contract: React component replacement tests,
  close-up e2e, visual layout e2e, accessibility e2e, and style ownership
  guards.

## Bridge Policy And Diagnostics Audience

- What remains internal: child process lifecycle mechanics, raw stderr,
  unredacted diagnostic payloads, and low-level bridge transport internals.
- What becomes public: admission hooks, browser method policy, server request
  policy, redaction helpers, structured bridge diagnostics, and host event
  sinks.
- Host responsibility intentionally not handled: authentication, non-loopback
  exposure policy, process admission beyond callbacks, audit logs, tenant
  isolation, and deployment topology.
- Example that proves the design: `examples/next-with-bridge-sidecar` and
  `examples/codex-local-web`.
- Tests that protect the contract: server bridge tests, websocket
  backpressure/admission tests, redaction tests, package snapshots, and
  real-local e2e.

## Per-Connection Bridge Option Resolution

- What remains internal: Codex child-process lifecycle mechanics, connection
  registries, session stores, workspace registries, token storage, auth
  providers, tenant/session mapping, process supervision, and deployment
  topology.
- What becomes public: a thin per-connection resolver pattern for the host to
  return the explicit bridge option set before spawn: `cwd`, `env`,
  `initialize`, `bridgePolicy.admission`, `browserMethodPolicy`,
  `serverRequestPolicy`, `dynamicToolPolicy`, `hostEvents`, inbound limits, idle
  timeout, and backpressure settings. Resolver rejection or admission rejection
  must close the socket without spawning Codex App Server.
- Host responsibility intentionally not handled: authentication, workspace
  validation policy, sidecar/session token issuance, packaged-app CSP,
  persisted user preferences, non-loopback exposure, audit storage, and
  process lifecycle supervision.
- Example that proves the design: the server bridge reference snippets and
  `examples/recipes` local desktop bridge/admission recipe.
- Tests that protect the contract: websocket tests proving connection-specific
  `cwd`/`env`, resolver/admission rejection without spawn, dynamic-tool helper
  threads using the resolved cwd, and advanced bridge tests proving the raw
  stdio bridge passes resolved `cwd`/`env` to the spawn callback.
- Promotion rule: `attachAgentUiWebSocketBridge()` may accept the resolver only
  while it remains a thin adapter around host-owned decisions. If resolver
  support starts to require Agent UI-owned auth, workspace storage, token
  storage, or process supervision, keep the public shape as a helper/recipe
  around `handleAgentUiWebSocketConnection()` instead.

## Overlay Layers And Mobile Drawer

- What remains internal: `.aui-*` implementation selectors, component DOM
  structure, raw z-index numbers, internal focus sentinels, scroll-lock
  implementation details, and one-off fixture stacking values.
- What becomes public: the relative layer contract expressed with stylesheet
  tokens `--aui-z-backdrop`, `--aui-z-drawer`, `--aui-z-popover`,
  `--aui-z-sheet`, `--aui-z-dialog`, and `--aui-z-toast`; the `AgentChat`
  mobile drawer behavior where backdrop click and Escape close the drawer,
  focus returns to the `Open thread history` trigger, background chat controls
  are inert or equivalently non-interactive while the drawer is open, drawer
  search/select remain reachable, and drawer scroll behavior is intentional.
- Host responsibility intentionally not handled: host modal/sheet state,
  page-level overlay managers, product navigation drawers, global scroll policy
  outside the Agent UI preset, and styling Agent UI through private selectors.
- Example that proves the design: `examples/local-react-vite` host integration
  fixture with mobile drawer open/close, blocked background hit testing, and a
  host-owned sheet/modal placed relative to the public Agent UI layer tokens.
- Tests that protect the contract: React component tests for Escape, backdrop
  close, focus return, and background non-interaction; Playwright tests for
  mobile drawer search/select, hit testing, close-after-selection, and no
  horizontal overflow; style tests proving layer tokens exist and shared
  overlays consume them.

## Host-Gated Workflow Composition

- What remains internal: workflow-specific state machines, proposal/approval
  orchestration, Watcher- or product-specific lifecycle names, host panel
  persistence, routing, and custom registry state.
- What becomes public: primitives, controllers, replacement points, and recipes
  that let a host gate when a thread or turn can be started while Agent UI owns
  only the transcript, composer, server-request, and thread-history UI
  behavior.
- Host responsibility intentionally not handled: product workflow policy,
  state-machine persistence, worker orchestration, plan approval semantics,
  localStorage/session restoration, and user/workspace authorization.
- Example that proves the design: `examples/local-react-vite` host workflow
  recipe showing host-owned gates around Agent UI primitives without adding
  product-specific APIs to core.
- Tests that protect the contract: focused fixture tests for gated composition,
  first-message optimism, scoped history loading, and docs/package snapshots
  that keep exported APIs generic.

## Example Shape Before Package Export Changes

- What remains internal: source-only adapters and draft controllers until an
  executable example depends on them cleanly.
- What becomes public: only APIs that are used by default, headless, fixture,
  and real-local examples without exposing host-runtime concerns.
- Host responsibility intentionally not handled: custom auth, sessions,
  persistence, workspace/tenant/product workflow scoping, and deployment
  policy.
- Example that proves the design: `examples/local-react-vite`,
  `examples/codex-local-web`, `examples/next-with-bridge-sidecar`, and
  `examples/recipes`.
- Tests that protect the contract: fixture e2e, real-local e2e, package
  resolution smoke, API snapshots, and docs staleness checks.

## Package Export Map Before Release Validation

- What remains internal: generated schema source, dist output, internal style
  chunks, reducer commit helpers, and private controller implementation files.
- What becomes public: reduced root exports, documented subpaths, the single
  React stylesheet, and package-specific advanced surfaces with API snapshots.
- Host responsibility intentionally not handled: dependency pinning outside the
  package contract, unsupported deep imports, and consuming generated source
  files directly.
- Example that proves the design: clean consumer package-resolution smoke plus
  docs-site package overview.
- Tests that protect the contract: `bun run validate:packages`,
  `bun run test:api-snapshots`, `bun run test:package-resolution`,
  `publint`, `attw`, and runtime export policy tests.
