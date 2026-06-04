# vNext Design Gates

This note records the Phase 1 review gates for the breaking vNext host
integration work. It should be updated as each gate moves from draft to
implemented API.

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
- What becomes public: a raw-free composer controller view for text state,
  submit/stop/steer actions, active-turn state, and queued follow-ups. Phase 8
  supersedes the earlier draft that considered publishing first-message
  operation controls.
- Host responsibility intentionally not handled: custom persistence of failed
  drafts, product workflow routing after submit, and long-term retry policy.
- Example that proves the design: `examples/codex-local-web` first-run local
  thread start through the bridge.
- Tests that protect the contract: composer controller unit tests for immediate
  pending state, reconciliation, rollback, retry, duplicate prevention, and an
  e2e proving the first user message appears before assistant output.

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
  `examples/recipes/src/headless-hooks.tsx` once rebuilt on vNext controllers.
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
  and `/fixture-gallery` close-ups.
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
