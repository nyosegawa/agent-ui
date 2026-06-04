# Agent UI vNext Host Integration TODO

Work through this checklist in order. Do not treat any phase as complete until
its docs, examples, tests, and validation items are complete.

## Phase 0: Baseline And Branch Hygiene

- [x] Confirm the working tree is clean before implementation work begins.
- [x] Confirm the branch name is purpose-based and uses the `codex/` prefix.
- [x] Read `AGENTS.md`, `docs/architecture/product-boundary.md`,
  `docs/architecture/security.md`, `docs/architecture/testing.md`,
  `docs/reference/package-exports.md`, `docs/reference/hooks.md`,
  `docs/reference/react-components.md`, `docs/reference/server-bridge.md`,
  `docs/guides/attachments.md`, and `docs/guides/react.md`.
- [x] Run baseline validation and record the current state:
  - [x] `bun run validate:fast`
  - [x] `bun run validate:protocol`
  - [x] `bun run build`
  - [x] `bun run validate:packages`
  - [x] `bun run test:api-snapshots`
  - [x] `bun run validate:e2e`
- [x] Record any known baseline failures with owner, command, and exact failure
  summary before using them as accepted risk.
- [x] Start or identify the relevant local example servers for future browser
  checks.
- [x] Capture baseline screenshots or current known-good visual evidence for:
  - [x] default desktop chat
  - [x] default mobile chat
  - [x] empty first-run screen
  - [x] sidebar drawer
  - [x] composer with attachments
  - [x] command/tool/detail blocks

### Phase 0 Notes

- Branch baseline: `codex/agent-ui-vnext-design-plan`.
- Working tree baseline before implementation: clean.
- Baseline validation on 2026-06-03: `bun run validate:fast`, `bun run
  validate:protocol`, `bun run build`, `bun run validate:packages`, `bun run
  test:api-snapshots`, and `bun run validate:e2e` all passed. `publint`
  emitted repository URL suggestions only.
- Known baseline failures: none.
- Browser evidence server: `bun --filter
  @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174`, URL
  `http://127.0.0.1:5174/`.
- Browser evidence captured with `agent-browser`:
  `/tmp/agent-ui-vnext-baseline-default-desktop.png`,
  `/tmp/agent-ui-vnext-baseline-default-mobile.png`,
  `/tmp/agent-ui-vnext-baseline-empty-first-run.png`,
  `/tmp/agent-ui-vnext-baseline-sidebar-drawer.png`,
  `/tmp/agent-ui-vnext-baseline-composer-attachments.png`, and
  `/tmp/agent-ui-vnext-baseline-command-tool-detail-closeups.png`.

## Phase 1: Public API Inventory

- [x] Generate current API snapshots.
- [x] List all current root exports for:
  - [x] `@nyosegawa/agent-ui-core`
  - [x] `@nyosegawa/agent-ui-codex`
  - [x] `@nyosegawa/agent-ui-react`
  - [x] `@nyosegawa/agent-ui-server`
  - [x] `@nyosegawa/agent-ui-web-components`
- [x] Mark each export as one of:
  - [x] keep public
  - [x] replace with vNext API
  - [x] move to subpath
  - [x] make private
  - [x] remove
- [x] Identify all examples and docs that import soon-to-change APIs.
- [x] Identify all tests that encode old state names or old hook behavior.
- [x] Update `docs/reference/package-exports.md` draft notes with intended
  package boundaries.
- [x] Create or draft design notes for these review gates:
  - [x] public thread view model versus internal normalized entity
  - [x] optimistic first-message operation model
  - [x] local media helper security and naming
  - [x] controller count and responsibilities
  - [x] component replacement map scope
  - [x] bridge policy and diagnostics audience
  - [x] example shape before package export changes
  - [x] package export map before release validation
- [x] For each review gate, record:
  - [x] what remains internal
  - [x] what becomes public
  - [x] what host responsibility is intentionally not handled
  - [x] which example proves the design
  - [x] which tests protect the contract

### Phase 1 Notes

- API snapshots regenerated with `bun run test:api-snapshots:update`; no API
  snapshot file changes were produced.
- Root export inventory and draft keep/replace/subpath/private/remove
  classifications are recorded in `docs/reference/package-exports.md`.
- Review-gate notes are recorded in
  `docs/architecture/vnext-design-gates.md`.
- Soon-to-change examples/docs/tests are listed in the vNext draft export
  inventory.

## Phase 2: Protocol And Normalization Contract

- [x] Classify every App Server method or notification used by vNext as one of:
  - [x] productized stable Agent UI behavior
  - [x] stable host-managed lower-level surface
  - [x] experimental opt-in surface
  - [x] unsupported or test-only surface
- [x] Classify thread lifecycle methods and notifications:
  - [x] `thread/start`
  - [x] `thread/resume`
  - [x] `thread/read`
  - [x] `thread/list`
  - [x] thread title/name updates
  - [x] archive/unarchive/close if upstream supports them
- [x] Classify turn lifecycle methods and notifications:
  - [x] `turn/start`
  - [x] `turn/steer`
  - [x] `turn/interrupt`
  - [x] turn completion and interruption notifications
  - [x] `clientUserMessageId` support
- [x] Classify server request and approval surfaces:
  - [x] command approval
  - [x] file change approval
  - [x] user input
  - [x] MCP elicitation
  - [x] permissions
  - [x] dynamic tool calls
- [x] Classify media/resource payloads from live notifications and
  `thread/read` history.
- [x] Confirm unsupported methods such as `thread/turns/items/list` stay out of
  default React behavior.
- [x] Update protocol capability docs or draft notes with the classification.
- [x] Update normalizer fixtures needed to prove the classified lifecycle
  contract.
- [x] Run `bun run validate:protocol`.

### Phase 2 Notes

- Protocol classification is recorded in
  `docs/reference/codex-protocol.md#vnext-lifecycle-classification-gate`.
- `thread/closed` is notification-only in the current stable generated surface;
  there is no productized stable `thread/close` client method.
- `thread/turns/list` remains experimental opt-in, while
  `thread/turns/items/list` remains experimental unsupported and outside
  default React behavior.
- Normalizer fixture review: existing raw fixtures already cover
  `thread/started`, `thread/name/updated`, `thread/status/changed`,
  `thread/tokenUsage/updated`, `turn/completed`, command/file approvals,
  dynamic tool calls, user input, MCP elicitation, and stored history. No new
  fixture was required for this classification-only phase.

## Phase 3: Core Lifecycle State Model

- [x] Replace thread registry buckets with explicit internal thread entity and
  collection state.
- [x] Define internal activity state.
- [x] Define internal availability state.
- [x] Define internal storage state.
- [x] Define public `AgentThreadView` separately from internal normalized
  entities.
- [x] Ensure public thread view does not expose `raw` protocol payloads.
- [x] Ensure public thread view does not expose canonical-ID reconciliation
  details unless needed as a documented diagnostic.
- [x] Add `AgentThreadCollection`.
- [x] Add `AgentThreadScope`.
- [x] Add active thread state independent from history collections.
- [x] Add optimistic operation state.
- [x] Add collection sync state:
  - [x] `idle`
  - [x] `loading`
  - [x] `ready`
  - [x] `error`
- [x] Add canonical ID reconciliation support.
- [x] Add lifecycle events for:
  - [x] optimistic thread created
  - [x] thread started
  - [x] thread reconciled
  - [x] thread updated
  - [x] thread title updated
  - [x] thread archived
  - [x] thread unarchived
  - [x] thread closed
  - [x] collection refresh started
  - [x] collection page received
  - [x] collection synced
  - [x] collection failed
- [x] Update selectors:
  - [x] active thread selector
  - [x] thread by ID selector
  - [x] collection by scope key selector
  - [x] ordered collection threads selector
  - [x] pending operations selector
- [x] Update retention so active, live, pending, and request-bound threads are
  retained correctly.
- [x] Add core reducer tests for all lifecycle transitions.
- [x] Add core reducer tests for collection scoping and pagination.
- [x] Add core reducer tests for canonical ID reconciliation.
- [x] Add core reducer tests for retention under the new model.
- [x] Run focused core reducer tests.

### Phase 3 Notes

- Replaced legacy `threadRegistry` buckets with `threadLifecycle`
  active-thread state, scoped collections, optimistic operations, canonical ID
  aliases, and explicit thread entity lifecycle fields. React hooks, examples,
  tests, docs, and API snapshots now use lifecycle state instead of registry
  buckets.
- Added internal activity, availability, storage, operation, collection, scope,
  canonical alias, and public `AgentThreadView` types in core state.
- Added lifecycle events and selectors for optimistic thread creation,
  reconciliation, collection sync/failure, active thread views, collection
  lookup, ordered collection threads, and pending operations.
- Focused validation: `bun test packages/core/test`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`,
  `bun run validate:packages`, `bun run test:api-snapshots`, `bun run
  test:package-resolution`, and `bunx vitest run
  test/docs-staleness.test.ts` passed after this slice.
- Commit-unit review process: spawned review subagent
  `019e8e9f-2660-7f73-9de1-a30887d428ce` to review this diff with the
  `agent-ui-review` skill. Findings about API snapshots, reconciliation
  merging, and alias-aware selectors were addressed in this slice.
- Commit-unit review process: spawned follow-up review subagent
  `019e8eb3-a3e1-7a22-8579-c53b4add1436` after the alias and public API fixes;
  the review reported no findings.
- Commit-unit review process: spawned registry-removal review subagent
  `019e8ec1-7479-75e3-8ed7-6388d27546c3`. Findings about unbounded
  `thread/collection/pageReceived` collections and optimistic-thread server
  request reconciliation were fixed with focused reducer regression tests.

## Phase 4: Composer Controller And Atomic First Message

- [x] Add internal/source-level `useAgentComposerController(threadId)` before
  publishing any new controller export.
- [x] Move first-run submission and normal composer submission behind the same
  controller-owned action surface.
- [x] Replace or break `startThreadWithInput()` with controller-owned
  `startWithMessage()`.
- [x] Generate stable pending thread, turn, and user message IDs.
- [x] Add optimistic pending thread insertion.
- [x] Add optimistic pending turn insertion.
- [x] Add optimistic user message insertion.
- [x] Insert pending thread into matching collections immediately.
- [x] Send `thread/start` after optimistic state is visible.
- [x] Reconcile pending thread ID to canonical server thread ID.
- [x] Send `turn/start` with `clientUserMessageId`.
- [x] Reconcile server user message item to optimistic user message.
- [x] Prevent duplicated user messages after reconciliation.
- [x] Roll back the whole pending thread when `thread/start` fails.
- [x] Keep the real thread and mark the message failed when `turn/start` fails
  after thread creation.
- [x] Add retry support for failed pending first messages.
- [x] Add failure UI metadata for pending messages.
- [x] Add operation state observable by operation ID.
- [x] Ensure callers do not manage rollback callbacks or pending thread/turn
  promises directly.
- [x] Ensure unmount cannot trigger duplicate rollback or retry.
- [x] Add controller actions for retry and cancel by operation ID.
- [x] Update first-run submit to use the same controller as normal composer.
- [x] Update normal composer submit to use the same optimistic message path where
  appropriate.
- [x] Preserve existing running-turn semantics:
  - [x] Enter queues locally while a regular turn is running
  - [x] Cmd/Ctrl+Enter steers the active turn when allowed
  - [x] Stop only calls `turn/interrupt`
  - [x] queued follow-ups remain scoped by thread
  - [x] queued attachments survive edit/restore
- [x] Add unit tests for:
  - [x] immediate pending state
  - [x] successful reconciliation
  - [x] `thread/start` failure rollback
  - [x] `turn/start` failure retry
  - [x] duplicate prevention
- [x] Add browser/e2e test proving first user message appears immediately before
  assistant output.

### Phase 4 Notes

- Added source-level `useAgentComposerController(threadId)` in React and kept it
  out of the root package export while the vNext controller contract is proven.
  `useAgentComposer()` remains the public wrapper, and React composer parts use
  the controller through a source import.
- Superseded by the Phase 8 public composer controller decision: the root export
  now includes `useAgentComposerController(threadId)` as a raw-free
  `AgentComposerController` view, while first-message operation controls moved
  to the source-level `useInternalAgentComposerController`.
- Replaced the thread hook's `startThreadWithInput()` draft path with
  controller-owned `startWithMessage()` for first-run submission. The root API
  snapshot now keeps only `startWithMessage()` and operation controls internal;
  the public composer controller shape still does not expose the first-message
  action.
- Phase 4 design gate for this slice:
  - What remains internal: `startWithMessage()`, temporary first-message
    operation details, rollback/retry policy, and pending-ID reconciliation.
  - What becomes public: `useAgentComposer()` plus the Phase 8
    `useAgentComposerController()` raw-free wrapper and their
    current public composer controller type in this slice.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workflow routing, deployment policy, and long-term retry policy.
  - Example that proves the design: `examples/codex-local-web` first-run local
    thread start through the bridge.
  - Tests protecting the contract: React component/hook tests,
    `test/api-snapshots`, package validation/resolution checks, and real-local
    Playwright thread lifecycle e2e.
- Commit-unit review process: spawned review subagent
  `019e8ec8-5ede-7f03-9e14-3bdc25666e6e`. The Phase 4 controller slice had no
  direct findings. The review found a Phase 3 lifecycle edge where delayed
  server requests arriving after optimistic thread reconciliation could retain
  the pending ID; the reducer now canonicalizes `serverRequest/created`
  thread IDs and has focused regression coverage.
- Commit-unit review process: spawned review subagent
  `019e8ed8-f075-7b23-8ded-4ddf7d5e88c5` after the controller-owned
  first-message path and API boundary fixes. Findings about missing recorded
  package/API validation and missing browser evidence were addressed in this
  TODO entry and with targeted real-local Playwright coverage.
- Focused validation after this slice: `bun --filter @nyosegawa/agent-ui-react
  test`, `bun test packages/core/test`, `bun run typecheck`, `bun run lint`,
  `bun run validate:packages`, `bun run test:api-snapshots`,
  `bun run test:package-resolution`, `bunx vitest run
  test/docs-staleness.test.ts`, and targeted browser validation
  `bun run test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx
  playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts` passed.
- Added optimistic first-message state before `thread/start`: stable pending
  operation/thread/turn/user-message IDs are generated in the composer
  controller, the pending thread becomes active and enters the default
  collection, and the pending user message is visible before the App Server
  replies in React unit coverage. `thread/reconciled` rewrites pending
  turn/item thread IDs to the canonical thread ID, and successful `turn/start`
  marks the first-message operation succeeded so public pending-operation
  selectors clear it.
- Matching collection insertion is intentionally limited to collections Agent UI
  can evaluate locally: `all` collections and existing history scopes whose
  cwd/search/archive filters match the pending thread metadata. Opaque custom
  host scopes remain host-owned and are not guessed by core.
- URL routing intentionally remains host-facing only for real thread IDs:
  optimistic pending thread IDs are not pushed into browser history, and
  popstate handling suppresses the next active-thread push so back/forward does
  not get bounced back to the current thread.
- Commit-unit review process: spawned review subagent
  `019e8ee6-15ab-7ee3-bf1d-76523fe0dd11` after the optimistic first-message
  slice. Findings about matching collection insertion and stale pending
  operation state were fixed with core/React regression tests. The browser/e2e
  immediate-message criterion remains a TODO item; current browser coverage
  proves final first-run behavior and URL history, while jsdom proves
  pre-server-response message visibility.
- Focused validation after optimistic insertion: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`,
  `bun run test:api-snapshots`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run validate:packages`, and targeted
  browser validation `bun run test:e2e:clean-ports && env -u NO_COLOR -u
  FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts`, and `bun run test:package-resolution`
  passed. The first browser run exposed pending/canonical URL history
  duplication; the routing suppression fix made the rerun pass.
- Added productized `clientUserMessageId` support to first-message
  `turn/start` requests. Core now reconciles App Server `userMessage` items
  carrying `clientId` or `clientUserMessageId` back to the optimistic user
  message item, including the real server-turn case where the server item
  arrives on a different turn ID from the pending optimistic turn. This prevents
  duplicated user messages while keeping server item identity in raw diagnostic
  metadata.
- Commit-unit review process: spawned review subagent
  `019e8ef3-ea44-7c13-8ab4-97f90bdcef52` for the
  `clientUserMessageId`/user-message reconciliation slice. Findings about
  same-turn-only reconciliation and stale TODO status were fixed with
  cross-turn reducer coverage and this TODO update.
- Focused validation after `clientUserMessageId` reconciliation: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, and `bun run lint`
  passed.
- Added `thread/optimistic/rolledBack` for first-message `thread/start`
  failures before canonical thread creation. Rollback removes the pending
  thread entity, active pointer, matching collection IDs, pending operation, and
  optimistic turn/user-message state; React does not send `turn/start` after
  this failure path.
- Commit-unit review process: spawned review subagent
  `019e8efd-040d-7070-b6e0-c0225e9f5f11` for the `thread/start` rollback
  slice. The review found no code defect and requested this TODO status update.
- Focused validation after rollback: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, and `bun run lint`
  passed.
- Added `turn/start` failure handling after canonical thread creation. The real
  thread remains active, the optimistic first user message is marked failed,
  and the first-message operation is marked failed so pending-operation
  selectors clear. Retry/cancel actions and visible failure UI metadata remain
  separate TODO items.
- Commit-unit review process: spawned review subagent
  `019e8f01-c50a-7aa2-bd14-9e603ab4c9b7` for the `turn/start` failure slice.
  The review found no code defect and requested this TODO status/note update.
- Focused validation after `turn/start` failure handling: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, and `bun run lint`
  passed.
- Added source-level first-message operation controls without exposing them
  through public `useAgentComposer()`: the Phase 8-renamed
  `useInternalAgentComposerController()` can look up operations by ID, retry
  failed first messages on the real thread with the same `clientUserMessageId`,
  and cancel operations by ID. Retry is gated to failed operations with an
  in-flight guard to prevent duplicate same-tick `turn/start` requests, and
  cancellation suppresses terminal retry dispatches from unresolved retry
  promises.
- Failure metadata now flows into rebuilt item blocks and rendered transcript
  messages expose failed item status via `data-status`. Retry/cancel UI remains
  controller-level only in this slice; the default preset does not add visible
  retry buttons until the public controller/component contract is frozen.
- Commit-unit review process: spawned review subagent
  `019e8f0b-dbde-7d93-9aa6-84d6d051afb0` for retry/cancel/operation/failure
  metadata. Findings about retry race gating, cancellation overwrite, React
  failure-status coverage, and stale TODO status were fixed.
- Commit-unit review process: spawned follow-up review subagent
  `019e8f14-d060-7783-865b-4d17106f092d` after the retry/cancel race fixes; the
  review reported no findings.
- Focused validation after retry/cancel operation controls: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, and `bun run lint`
  passed.
- Controller ownership remains internal: public `useAgentComposer()` omits
  rollback/retry/cancel/pending-promise details, while source-level
  `useInternalAgentComposerController()` owns the first-message workflow. Added
  React coverage proving provider unmount during a pending `thread/start` does
  not trigger duplicate rollback/retry work or extra `thread/start`/`turn/start`.
- Existing running-turn semantics remain covered by the React suite: running
  Enter queues locally, running Cmd/Ctrl+Enter steers, Stop calls only
  `turn/interrupt`, queued follow-ups stay thread-scoped, and queued
  attachments survive edit/restore.
- Commit-unit review process: spawned review subagent
  `019e8f17-c35c-7b92-858f-87ad874f564b` for controller ownership and unmount
  duplicate-work safety. The review found no code defect and requested this
  TODO status update.
- Focused validation after unmount/running-turn semantics: `bun --filter
  @nyosegawa/agent-ui-react test` passed.
- Normal composer submit remains the existing-thread `turn/start` path through
  `useAgentTurn.startTurn`; the first-message optimistic thread path is applied
  only where appropriate, for initial thread creation. Existing run-settings,
  keyboard, queue, steer, Stop, scoped follow-up, and attachment-restore tests
  continue to protect regular composer behavior.
- Added real-local Playwright coverage proving the first user message appears
  in the transcript before assistant output. The fake App Server now delays the
  first assistant delta for the slow smoke fixture, and the assertion is scoped
  to `.aui-message-list article[data-kind='userMessage']`.
- Commit-unit review process: spawned review subagent
  `019e8f1a-c2cb-7472-908d-0629b6308b06` for the browser/e2e immediate-message
  proof. Findings about a racy assistant-delta absence assertion, unscoped text
  lookup, and stale Phase 4 TODO status were fixed.
- Focused browser validation after e2e fix: `bun run test:e2e:clean-ports &&
  env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts` passed.
- Phase 4 completion validation: `bun run test:api-snapshots`, `bun run
  validate:packages`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
  lint`, `bun run typecheck`, and `bun run test:package-resolution` passed.

## Phase 5: Scoped Thread Lists

- [x] Implement `useAgentThreadListController(scope)`.
- [x] Support explicit `scope.key`.
- [x] Support search state.
- [x] Support pagination and `nextCursor`.
- [x] Support refresh and invalidation.
- [x] Support loading/error state per collection.
- [x] Support preview hydration without activation.
- [x] Support explicit activation/resume.
- [x] Ensure background preview reads do not mutate active run settings.
- [x] Ensure sidebar selection uses canonical thread IDs after hydration.
- [x] Add `onHistorySynced` or equivalent lifecycle event.
- [x] Add docs explaining host-owned scope semantics.
- [x] Rebuild `AgentThreadSidebar` on the controller.
- [x] Add tests for multiple independent thread collections.
- [x] Add tests for scoped active-thread consistency.
- [x] Add tests for search pagination not leaking between scopes.
- [x] Add browser/e2e tests for sidebar search, select, mobile drawer, and
  scoped list behavior.

### Phase 5 Notes

- Added source-level `useAgentThreadListController(scope)` in React and kept it
  out of the public root export while scoped list behavior is proven. The
  controller owns collection-backed `thread/list` refresh, invalidation,
  search, pagination, loading/error state, preview hydration, and activation.
- Rebuilt `AgentThreadSidebar` on the source-level controller. Sidebar
  selection now waits for successful hydration and reports the canonical
  thread ID returned by `thread/read`; failed hydration does not advance the
  host `onSelectThread` callback.
- Background preview hydration uses `thread/read` with `activate: false` and no
  longer syncs active run settings. Active hydration still restores thread run
  settings.
- Core collection state now treats `nextCursor: null` as an explicit final-page
  clear rather than preserving the previous cursor. Existing explicit
  `scope.key` collections also refresh their stored scope metadata when a new
  collection event arrives for the same key.
- Phase 5 design gate for this slice:
  - What remains internal: `useAgentThreadListController(scope)`, collection
    request sequencing, stale response suppression, preview hydration policy,
    and sidebar controller composition.
  - What becomes public: no new root export or package export in this slice;
    existing sidebar props remain the only public React surface touched.
  - Host responsibility intentionally not handled: workspace/project/tenant
    routing, persisted history ownership, auth, audit logging, and hosted
    thread storage policy.
  - Example that proves the design: current `AgentThreadSidebar` in
    `AgentChat`; browser/e2e proof for scoped sidebar behavior remains open.
  - Tests protecting the contract: core reducer collection tests and React
    component/controller tests for explicit keyed scopes, search pagination
    isolation, stale search response suppression, background preview run
    settings, canonical sidebar selection, and hydration failure behavior.
- Commit-unit review process: spawned review subagent
  `019e8f28-9594-7441-9222-c829a32b135a` with the `agent-ui-review` skill for
  this scoped-list controller slice. Findings about explicit-key collection
  scope metadata, stale search responses, and sidebar hydration failure
  selection were fixed with focused regression tests.
- Focused validation after this slice: `bun test
  packages/core/test/reducer.test.ts`, `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`,
  `bun run test:api-snapshots`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, and `bun run
  test:package-resolution` passed after review fixes. Browser validation:
  `bun run test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx
  playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts` passed.
- Added explicit source-level resume support to
  `useAgentThreadListController(scope)` while keeping the controller out of the
  root React export. `useAgentThread().resumeThread()` now reconciles a
  requested id into the canonical App Server `thread.id` when they differ, so
  active-thread state and scoped collection ids remain consistent after
  resume.
- Commit-unit review process: spawned review subagent
  `019e8f33-b197-78f2-9188-c151f78a7aa6` with the `agent-ui-review` skill for
  the explicit activation/resume slice. The review reported no findings and
  called out direct URL canonical resume as residual risk; that case is now
  covered by a React routing regression test.
- Focused validation after explicit resume: `bun --filter
  @nyosegawa/agent-ui-react test`, `bun test
  packages/core/test/reducer.test.ts`, `bun run typecheck`, and `bun run lint`
  passed. Completion validation for this slice also passed: `bun run
  test:api-snapshots`, `bun run validate:packages`, `bunx vitest run
  test/docs-staleness.test.ts`, and `bun run test:package-resolution`.
  Browser validation passed with `bun run test:e2e:clean-ports && env -u
  NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts`. React routing coverage now includes direct
  URL resume where App Server returns a different canonical thread id.
- Added source-level `onHistorySynced` support to
  `useAgentThreadListController(scope, options)` without publishing the
  controller at the root export. The callback receives normalized collection
  sync metadata only: scope, thread ids, next cursor, append mode, search term,
  and synced timestamp. Raw App Server response fields are intentionally not
  forwarded.
- `thread/list` success now also dispatches `thread/collection/synced` with the
  same cursor and timestamp as the page update. Stale list responses are
  sequence-gated before both collection updates and thread entity upserts, so
  old responses cannot overwrite currently displayed thread metadata.
- Commit-unit review process: spawned review subagent
  `019e8f3b-25c3-71a2-97c1-9d7a9f53e117` with the `agent-ui-review` skill for
  the history-sync lifecycle slice. The review found stale response entity
  upserts before sequence gating; the hook now buffers upserts until after the
  stale check and React coverage uses the same thread id across stale/current
  responses.
- Focused validation after history sync lifecycle: `bun --filter
  @nyosegawa/agent-ui-react test`, `bun test
  packages/core/test/reducer.test.ts`, `bun run typecheck`, and `bun run lint`
  passed.
- Documented host-owned scope semantics in `docs/reference/hooks.md` and
  `docs/architecture/vnext-design-gates.md`: Agent UI owns collection view
  state, keys, cursors, thread ids, loading/error, and normalized sync metadata;
  hosts own tenant/workspace/project meaning, authorization, persistence,
  routing policy, and audit storage.
- Added browser/e2e coverage for Phase 5 scoped lists. Real-local Playwright
  now verifies desktop sidebar search, automatic pagination, selection, and
  mobile drawer open/select/close behavior against the fake Codex App Server.
  The local Vite fixture route `/scoped-thread-lists` verifies explicit
  `scope.key` independence, search metadata, pagination cursor isolation, and
  active-thread selection in a deterministic browser harness using public core
  collection events/selectors.
- Commit-unit review process: spawned review subagent
  `019e8f42-ce8a-7423-834c-3b57e08273c4` with the `agent-ui-review` skill for
  the browser/e2e slice. Findings about mixed manual/automatic pagination proof
  and missing scoped-list browser proof were fixed by converting the real-local
  test to an automatic pagination assertion and adding the explicit-scope Vite
  fixture route/e2e.
- Browser validation after scoped-list e2e: `bun run test:e2e:clean-ports &&
  env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts --config
  playwright.real-local.config.ts` passed, and `env -u NO_COLOR -u FORCE_COLOR
  bunx playwright test
  examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts --config
  playwright.fixtures.config.ts` passed, including a rerun after deterministic
  sync timestamps were added to the fixture route.
- Phase 5 completion validation after the browser/e2e slice: `bun run
  test:api-snapshots`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
  lint`, `bun run typecheck`, `bun run validate:packages`, and `bun run
  test:package-resolution` all passed. `publint` still reports only the
  baseline repository URL suggestions.

## Phase 6: Local Media Helper And Resource Resolution

- [x] Replace or extend upload helper with
  `createAgentUiLocalMediaHelper()`.
- [x] Treat the helper as opt-in and local-first; do not make it a general file
  server or remote storage layer.
- [x] Add upload handler returning:
  - [x] `path`
  - [x] `url`
  - [x] `id`
  - [x] `name`
  - [x] `displayName`
  - [x] `redactedPath`
  - [x] `mimeType`
  - [x] `sizeBytes`
- [x] Add static handler for tokenized file URLs.
- [x] Ensure static serving is disabled unless the host intentionally wires the
  handler.
- [x] Prefer `serveAssetHandler` or similarly constrained naming over
  generic static-serving names.
- [x] Ensure static URLs are not derived from raw local paths.
- [x] Ensure static URLs are addressed by registered asset ID only.
- [x] Add safe local path resolution that returns registered file assets only.
- [x] Add URL creation by asset ID, not arbitrary raw path.
- [x] Prevent path traversal before filesystem access.
- [x] Refuse to serve files outside the configured root.
- [x] Use unguessable or session-scoped asset IDs by default.
- [x] Allow host admission/session checks before serving bytes.
- [x] Require host admission/session checks for non-loopback or shared
  endpoints.
- [x] Keep loopback development defaults separate from remote deployment docs.
- [x] Define cleanup-after-preview behavior.
- [x] Document when sending local paths to App Server or model context is
  acceptable.
- [x] Add cleanup support.
- [x] Add TTL cleanup support.
- [x] Add max-byte and content-type checks.
- [x] Add path traversal tests.
- [x] Add unauthorized/static-serving boundary docs.
- [x] Add `AgentResolvedAttachment`.
- [x] Change attachment resolver contract to return structured metadata.
- [x] Preserve Codex input construction as explicit `input`.
- [x] Add `previewUrl` for UI rendering.
- [x] Add `displayName` and `redactedPath`.
- [x] Add attachment preview failure state.
- [x] Add fallback card for unavailable local media.
- [x] Add `resolveLocalMediaUrl(path, item)` support for transcript media.
- [x] Ensure React never renders raw filesystem paths as image/video `src`.
- [x] Add tests for composer preview URLs.
- [x] Add tests for transcript local image URL resolution.
- [x] Add tests for missing media fallback.
- [x] Add e2e proving local image appears in composer and transcript.
- [x] Add e2e proving unavailable local media does not render a broken image.

### Phase 6 Notes

- Added `createAgentUiLocalMediaHelper()` in `@nyosegawa/agent-ui-server` and
  kept `createAgentUiLocalUploadHandler()` as an upload-only entry point backed
  by the same helper. The upload response now includes structured metadata:
  `path`, `url`, `id`, `name`, `displayName`, `redactedPath`, `mimeType`,
  `sizeBytes`, and `previewUrl`.
- Phase 6 local media helper design gate for this slice:
  - What remains internal: temp-directory layout, registered asset map,
    token generation, filename and asset-ID sanitization, path containment
    checks, and byte-serving implementation.
  - What becomes public: `createAgentUiLocalMediaHelper()`,
    `AgentResolvedAttachment`, `AgentUiLocalMediaHelper`, asset-ID URL
    creation, `handleUpload`, `serveAssetHandler`, `resolveAssetPath`,
    `getAsset`, cleanup, and local media helper options.
  - Host responsibility intentionally not handled: auth, session admission,
    tenant/workspace isolation, remote storage, upload persistence, audit
    logging, and non-loopback deployment policy. The helper accepts an
    admission callback, but hosts own the decision.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` now opt into the helper and explicitly
    wire separate upload and asset routes.
  - Tests that protect the contract: `packages/server/test/upload.test.ts`
    covers structured metadata, registered asset-ID serving, path traversal
    rejection before filesystem access, root containment, host admission
    denial, cleanup, TTL cleanup, byte limits, and content-type checks.
- Static serving remains disabled unless a host routes requests to
  `serveAssetHandler`. The helper creates preview URLs from registered asset
  IDs only; raw local paths are preserved only for explicit Codex App Server
  input construction. Docs now distinguish loopback demo defaults from
  non-loopback/shared endpoint responsibilities.
- Commit-unit review process: spawned review subagent
  `019e8f51-2430-7423-81c4-d41b4bdc73ef` with the `agent-ui-review` skill for
  the local media helper slice. The review reported no findings.
- Focused validation after this slice: `bun test
  packages/server/test/upload.test.ts`, `bun --filter @nyosegawa/agent-ui-server
  test`, `bun run test:api-snapshots`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run lint`, `bun run typecheck`, and
  `bun run validate:packages` passed. Package resolution validation with
  `bun run test:package-resolution` also passed after the public server export
  update. `publint` still reports only the baseline repository URL suggestions.
- Added asset-level cleanup-after-preview behavior with
  `AgentUiLocalMediaHelper.releaseAsset(id)`. `releaseAsset` removes the
  registry entry, deletes the registered temporary file after the same
  root-containment check used by serving, makes subsequent preview URL requests
  return 404, and is documented as preview cleanup only; hosts must keep assets
  alive while Codex App Server still needs the local path.
- Commit-unit review process: spawned review subagent
  `019e8f5b-1eed-7303-b9b3-f57d55aefa7e` with the `agent-ui-review` skill for
  the cleanup-after-preview slice. The review found mutable public asset
  metadata could redirect `releaseAsset` deletion to another file inside the
  helper root. The helper now stores immutable internal registered records,
  returns/callbacks with copies, and `releaseAsset` deletes only the internally
  registered path; regression coverage mutates both public and admission
  metadata and proves the substituted file is preserved.
- Changed React `resolveLocalAttachment(file, kind)` to return structured
  metadata through `AgentResolvedLocalAttachment`. The resolver now returns an
  explicit `input` field for Codex App Server input construction plus UI
  metadata such as `previewUrl`, `url`, `displayName`, `redactedPath`,
  `mimeType`, and `sizeBytes`. Composer chips prefer resolver-provided
  `previewUrl`/`url` and only create revocable browser object URLs as an image
  fallback.
- Phase 6 resolver contract design gate for this slice:
  - What remains internal: composer attachment state, fallback object URL
    ownership, queue restore/revoke bookkeeping, and chip composition.
  - What becomes public: `AgentResolvedLocalAttachment` and the structured
    `resolveLocalAttachment` return contract.
  - Host responsibility intentionally not handled: upload persistence, static
    asset authorization, non-loopback admission, local path lifetime after Codex
    input submission, and arbitrary file input semantics.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` return structured local media metadata
    while keeping Codex input construction in the resolver's `input` field.
  - Tests that protect the contract: React component tests for structured
    preview URLs, explicit Codex input payloads, queued attachment restore/send,
    and preview URL ownership.
- Focused validation after the resolver contract slice: `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`, `bun
  run test:api-snapshots`, and `bunx vitest run test/docs-staleness.test.ts`
  passed.
- Commit-unit review process: spawned review subagent
  `019e8f68-3b1a-7b93-87ef-e6282c7cf52b` with the `agent-ui-review` skill for
  the structured resolver slice. The review found non-image uploads could render
  as broken `<img>` chips when the local media helper returned `previewUrl` for
  every asset. Composer attachment state now applies resolver preview URLs only
  to image attachments; a regression test proves structured file attachments
  with `previewUrl`/`url` still render as file chips and keep explicit text
  input.
- Added React local media fallback and transcript URL resolution. Transcript
  image/video blocks now require host-supplied
  `resolveLocalMediaUrl(path, item)` before rendering a browser media `src`;
  missing resolver results, missing URLs, and failed media loads render the
  local-media fallback card instead of raw filesystem URLs or broken media
  elements. Composer chips now record preview failure state and fall back to
  the attachment icon when a structured image preview URL fails to load.
- Phase 6 transcript media design gate for this slice:
  - What remains internal: media load failure state, fallback card markup,
    filename extraction, attachment preview failure bookkeeping, and block
    renderer composition.
  - What becomes public: `AgentLocalMediaUrlResolver` and
    `resolveLocalMediaUrl` props on `AgentChat`, `AgentThreadView`,
    `AgentThreadTimeline`, `AgentMessageList`, and `AgentContentBlockView`.
  - Host responsibility intentionally not handled: static asset
    authorization, path-to-asset registry, upload persistence, asset lifetime,
    tenant/workspace scoping, and non-loopback exposure policy.
  - Example that proves the design: `examples/codex-local-web` remains the
    local media helper example; browser-visible e2e proof for transcript media
    is still open in this phase.
  - Tests that protect the contract: React component tests for structured
    attachment preview failure, transcript local media URL resolution, missing
    media fallback, and failed media load fallback.
- Focused validation after the transcript media slice: `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`, `bun
  run test:styles`, and `bun run test:api-snapshots` passed.
- Commit-unit review process: spawned review subagent
  `019e8f77-4f49-7ab0-bd16-08d1c62e6e0c` with the `agent-ui-review` skill for
  the transcript local media slice. Findings about API snapshot freshness,
  missing browser-visible proof, Windows path display leakage, and stale media
  failure state after refreshed URLs were addressed. Regression tests cover
  Windows path caption redaction and media retry after resolver URL changes.
- Focused browser validation after the review fixes: `bun run
  test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-attachments.e2e.ts --config
  playwright.real-local.config.ts` passed. This proves local image attachments
  render in the composer and transcript through explicit resolver URLs, and
  unavailable transcript local media renders the fallback card without a broken
  image element.
- Commit-unit follow-up review process: spawned review subagent
  `019e8f7e-ef53-7563-9270-2206a107453c` with the `agent-ui-review` skill
  after the review fixes and e2e proof; the review reported no findings.

## Phase 7: Transcript View Model And Density

- [x] Add `AgentTranscriptEntry`.
- [x] Add `useAgentTranscriptController(threadId, options)`.
- [x] Include role, block, status, density, approval anchors, and optimistic
  public pending state in entries.
- [x] Ensure transcript entries do not expose internal optimistic operation
  objects.
- [x] Ensure transcript entries do not expose raw protocol payload fields.
- [x] Preserve transcript windowing behavior.
- [x] Preserve approval anchoring behavior.
- [x] Add density options:
  - [x] default
  - [x] compact
  - [x] verbose
  - [x] critical-only
  - [x] per block kind
- [x] Add `useAgentTranscriptScrollController(options)`.
- [x] Support host-owned scroll container refs.
- [x] Support jump to latest.
- [x] Support jump to pending approval.
- [x] Support show earlier items.
- [x] Rebuild `AgentMessageList` on the transcript controller.
- [x] Expose default block renderers with `Default` fallback.
- [x] Add tests for transcript entries.
- [x] Add tests for density behavior.
- [x] Add tests for custom block renderer preserving wrappers.
- [x] Add browser/e2e tests for custom command block renderer and approval
  anchors.

### Phase 7 Notes

- Added public transcript view-model primitives:
  `AgentTranscriptEntry`, `AgentTranscriptBlock`, `AgentTranscriptItem`,
  `AgentTranscriptController`, and
  `useAgentTranscriptController(threadId, options)`. `AgentMessageList` now
  renders controller entries while preserving existing transcript windowing,
  approval anchoring, message/block DOM wrappers, and local media resolution.
- Phase 7 transcript entry/controller design gate for this slice:
  - What remains internal: block synthesis helpers, focused windowing state,
    approval pinning math, DOM scroll-follow implementation, and the temporary
    `useAgentTranscriptControllerForThread()` adapter used by `AgentMessageList`.
  - What becomes public: raw-free `AgentTranscriptEntry`,
    `AgentTranscriptBlock`, `AgentTranscriptItem`,
    `AgentTranscriptController`, `AgentTranscriptDensity`,
    `AgentTranscriptPendingState`, and
    `useAgentTranscriptController(threadId, options)`.
  - Host responsibility intentionally not handled: transcript persistence,
    audit logging, raw protocol rendering policy, tenant/workspace routing,
    custom virtualizer/layout policy, and host-specific block replacement
    registries.
  - Example that proves the design: `AgentMessageList` and `AgentThreadView`
    in the default `AgentChat` path render from controller entries without
    changing the real local example integration.
  - Tests that protect the contract: React component tests cover transcript
    entries with role/block/status/density/approval/pending metadata, no
    internal optimistic operation exposure, no raw item/block payload fields,
    preserved windowing, preserved approval anchoring, and source-structure
    ownership for windowing.
- Commit-unit review process: spawned review subagent
  `019e8f89-3110-7992-9fe3-2fb33c968617` with the `agent-ui-review` skill.
  Findings about stale API snapshots and public `ThreadState`/`TurnState`
  leakage were fixed by regenerating API snapshots, removing internal state from
  the public transcript controller and entries, and adding raw-free
  item/block entry views with focused assertions.
- Commit-unit review process: spawned follow-up review subagent
  `019e8f91-e399-7072-9343-588ed9f2900d` after the public view-model fixes;
  the review reported no findings and independently reran the required
  validation gates.
- Focused validation after this slice: `bun run typecheck`, `bun run lint`,
  `bun --filter @nyosegawa/agent-ui-react test`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run validate:packages`, and `bun run
  test:package-resolution` passed. `bun run test:package-resolution` initially
  failed once because it was run concurrently with `validate:packages` and hit a
  Next build lock; the command passed when rerun by itself.
- Added transcript density options:
  - What remains internal: density resolution/filtering helpers, default list
    CSS modifiers, and the example fixture route implementation.
  - What becomes public: `AgentTranscriptDensityMode`,
    `AgentTranscriptDensityConfig`, `AgentTranscriptDensity`, controller
    `density` options, resolved entry `density`, and `AgentMessageList`
    `density`.
  - Host responsibility intentionally not handled: persistence of density
    preference, product-specific severity policy, user settings storage, and
    tenant/workspace routing for density presets.
  - Example that proves the design: `/transcript-density` in the local React
    Vite fixture app composes `AgentMessageList` directly with compact defaults,
    verbose command/file blocks, and critical-only text blocks.
  - Tests that protect the contract: React component tests cover default,
    compact, verbose, critical-only, per-block-kind overrides, filtering, and
    rendered density attributes; Playwright covers the `/transcript-density`
    route on desktop and mobile with overflow checks.
- Focused validation after the density slice: `bun run typecheck`, `bun run
  lint`, `bun --filter @nyosegawa/agent-ui-react test`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run validate:packages`, `bun run
  test:package-resolution`, and `bun run test:e2e:clean-ports && env -u
  NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/transcript-density.e2e.ts --config
  playwright.config.ts` passed.
- Commit-unit review process: spawned review subagent
  `019e8f9e-fbb3-7910-aaf0-de904a8ff019` with the `agent-ui-review` skill.
  Findings about turn-level approvals disappearing under `critical-only` and
  missing root exports for density mode/config types were fixed by preserving
  the last source entry for after-turn approvals, adding a regression test, and
  exporting `AgentTranscriptDensityMode` / `AgentTranscriptDensityConfig`.
- Follow-up review subagent `019e8fa4-4048-7863-95b3-8c9cad4524bc` reported a
  stale React API snapshot for the new density root exports; the snapshot was
  regenerated so `AgentTranscriptDensityMode` and
  `AgentTranscriptDensityConfig` appear in the public root export list.
- Final density follow-up review from `019e8fa4-4048-7863-95b3-8c9cad4524bc`
  reported no findings after the snapshot fix. Required validation passed after
  serial reruns: `bun run test:api-snapshots`, `bun run test:styles`, `bun run
  validate:packages`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
  lint`, `bun run typecheck`, `bun --filter @nyosegawa/agent-ui-react test`,
  `bun run test:package-resolution`, and the `/transcript-density` Playwright
  desktop/mobile test. `validate:packages` and `test:package-resolution`
  failed once when run concurrently because both commands invoked workspace
  builds and hit transient build output/Next lock contention; both passed when
  rerun serially.
- Added public transcript scroll controller:
  - What remains internal: DOM selector defaults, MutationObserver scheduling,
    scroll-follow threshold, approval-tail clipping adjustment, and the concrete
    transcript scroll container inside `AgentMessageList`.
  - What becomes public: `useAgentTranscriptScrollController(options)`,
    `AgentTranscriptScrollController`, host-owned `scrollContainerRef`, jump to
    latest, jump to pending approval, show-earlier delegation, and public
    affordance booleans.
  - Host responsibility intentionally not handled: transcript preference
    persistence, routing, virtualizer selection, custom viewport layout policy,
    audit logging, tenant/workspace scoping, and hosted runtime lifecycle.
  - Example that proves the design: default `AgentMessageList` now composes the
    scroll controller while headless tests prove a host-owned transcript
    scroller can call the same actions.
  - Tests that protect the contract: React component tests cover host-owned
    scroll refs, `jumpToLatest()`, `jumpToPendingApproval()`,
    `showEarlierItems()`, default pending-approval jump UI, large-transcript
    show-earlier behavior, and thread-change reset behavior.
- Commit-unit review process: spawned review subagent
  `019e903b-679d-7903-a749-dda575179e18` with the `agent-ui-review` skill for
  the Phase 7 transcript scroll controller slice. Findings about stale React
  API snapshots, unintended legacy scroll-follow alias exports, and a
  misleading review note were fixed by updating the snapshot, keeping only
  `useAgentTranscriptScrollController` and `AgentTranscriptScrollController*`
  public, and replacing the handoff note with this scroll-controller review
  outcome. Focused validation passed before the review:
  `bun --filter @nyosegawa/agent-ui-react test -- 'transcript scroll|sidebar
  replacements|offers a distinct jump affordance|resets follow-scroll'`,
  `bun run test:api-snapshots`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run lint`, `bun run typecheck`,
  `bun run validate:packages`, and `bun run test:package-resolution`. The first
  package-validation attempt was run concurrently and hit Next build
  lock/build-output contention; both package gates passed when rerun serially.
- Commit-unit review process: review subagent
  `019e9032-2385-7db3-87f6-8330a0690dec` reviewed the Phase 9 wrapper
  delegation slice. The review found the sidebar wrapper test still did not
  prove hydrated transcript state after `thread/read`; the test now returns a
  visible canonical transcript item and asserts it renders after selecting the
  custom-wrapped sidebar row.
- Added browser-visible proof for custom command block renderers and approval
  anchors:
  - What remains internal: transcript message wrapper placement, approval anchor
    node placement, and low-level generated block normalization.
  - What becomes public: `components.blocks.commandExecution` with `Default`
    fallback remains the host-facing replacement point.
  - Host responsibility intentionally not handled: approval authorization
    policy, audit logging, routing, persistence, tenant/workspace scoping, and
    custom transcript viewport layout.
  - Example that proves the design: the local React fixture gallery `Custom
    command block` close-up renders a host wrapper around the default command
    renderer and an item-anchored command approval.
  - Tests that protect the contract:
    `examples/local-react-vite/e2e/visual-closeups.e2e.ts` asserts the custom
    renderer remains inside `.aui-message[data-kind="commandExecution"]`, the
    default command card is still rendered, and the approval anchor remains the
    command message's next sibling with the approval action reachable.
- Focused validation after the browser proof: `bun run typecheck`, `bun run
  lint`, and `bun run test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR
  bunx playwright test examples/local-react-vite/e2e/visual-closeups.e2e.ts
  --config playwright.config.ts` passed.
- Commit-unit review process: spawned review subagent
  `019e9049-012c-7fa2-8d79-06f4fc31bde3` with the `agent-ui-review` skill for
  the browser/e2e proof slice. The review found the approval action assertion
  was not tied to the adjacent anchor node; the Playwright assertion now checks
  the command message's next sibling contains both the command approval card and
  approve button. Follow-up review subagent
  `019e904b-4834-7952-bc0b-2faa3b81a0a8` reported no findings.

## Phase 8: Composer Styled Parts And Attachment Boundary

- [x] Decide whether the internal composer controller should become public as
  `useAgentComposerController(threadId)`.
- [x] Add resource resolution primitives before adding attachment-specific
  controller API.
- [x] Add `useAgentAttachmentController(options)` only if it owns a stable
  behavior boundary distinct from composer and transcript.
- [x] Decide whether attachment behavior should remain a resource primitive plus
  composer integration instead of a public controller.
- [x] Expose:
  - [x] `value`
  - [x] `setValue`
  - [x] `canSubmit`
  - [x] `submitMode`
  - [x] `disabledReason`
  - [x] `isSubmitting`
  - [x] `isInterrupting`
  - [x] `activeTurnId`
  - [x] queued follow-ups
  - [x] failed pending messages
  - [x] retry actions
- [x] Add styled parts:
  - [x] `AgentComposerPanel`
  - [x] `AgentComposerInput`
  - [x] `AgentComposerToolbar`
  - [x] `AgentAttachmentChips`
  - [x] `AgentComposerSubmitButton`
  - [x] `AgentStartComposer`
- [x] Make initial composer and normal composer share the same primitives.
- [x] Preserve keyboard submit behavior.
- [x] Preserve stop behavior.
- [x] Preserve follow-up queue behavior.
- [x] Preserve attachment edit/restore behavior.
- [x] Add tests for shared first-run/normal composer behavior.
- [x] Add tests for mobile composer behavior.
- [x] Add browser/e2e tests for queue, edit, retry, stop, and attachments.

Phase 8 notes:

- Public composer controller decision:
  - What remains internal: first-message operation lookup, retry, and cancel
    controls exposed by the source-level `useInternalAgentComposerController`;
    attachment state mutation helpers; attachment preview URL revocation policy;
    and default composer form layout internals.
  - What becomes public: root-exported `useAgentComposerController(threadId)`
    returning the raw-free `AgentComposerController` view. `useAgentComposer()`
    remains a public alias for that same controller view.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, upload storage, local file admission, attachment
    URL serving, and App Server process lifecycle.
  - Example that proves the design: existing headless hook examples can call
    `useAgentComposerController(threadId)` while default UI examples continue
    to compose `AgentComposerPanel`.
  - Tests that protect the contract: API snapshots protect the root export and
    component tests continue to use the source-level internal controller only
    where first-message operation retry/cancel is under test.
- Commit-unit review process: spawned review subagent
  `019e8fb0-978b-7a03-953c-e98a4d4c9347` with the `agent-ui-review` skill.
  Findings about stale Phase 4/vNext design notes describing the old internal
  composer boundary were fixed by marking the older boundary as superseded by
  the Phase 8 public controller decision and renaming operation-control notes to
  `useInternalAgentComposerController`. The final follow-up review reported no
  findings.
- Focused validation after the public composer controller decision: `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, `bun run
  typecheck`, `bun --filter @nyosegawa/agent-ui-react test`, and `bun run
  test:package-resolution` passed.
- Resource resolution primitive decision:
  - What remains internal: composer attachment state mutation,
    drag/drop/paste/file-picker wiring, preview URL revocation policy,
    queued-attachment edit/restore internals, and any attachment-specific
    controller.
	  - What becomes public: `AgentResolvedResource`, `AgentResourceKind`,
	    `AgentFileResourceRequest`, `AgentLocalMediaResourceRequest`,
	    `AgentResourceRequest`, `AgentResourceResolver`, `AgentResourceResolution`,
	    `AgentLocalMediaUrlResolver`, `AgentResolvedLocalAttachment`,
	    `agentResourceUrl`, and `agentResourceDisplayName`; existing
	    `AgentResolvedLocalAttachment` now builds on that resource shape, and
	    transcript local media resolution may return either a URL string or a
	    structured resource.
  - Host responsibility intentionally not handled: upload admission, storage,
    static asset authorization, cleanup policy, tenant/workspace scoping, and
    App Server path construction for non-image files.
  - Example that proves the design: `/resource-resolution` in the local React
    Vite fixture renders transcript media from structured browser-safe
    metadata, while `examples/codex-local-web` continues to supply host-owned
    attachment upload and media URL resolution.
	  - Tests that protect the contract: resource helper unit tests cover URL and
	    display-name selection, React component tests cover structured local media
	    resources rendering safe captions without exposing raw local paths and
	    video `mimeType` handling for opaque paths, and Playwright covers
	    `/resource-resolution` on desktop and mobile.
- Commit-unit review process: spawned review subagent
  `019e8fc1-ef5b-71a2-88af-03d4e61f8641` with the `agent-ui-review` skill.
  Findings about structured video resources with opaque App Server paths and an
  incomplete package export inventory were fixed with a video `mimeType`
  regression test and docs updates. The final follow-up review reported no
  findings.
- Focused validation after the resource resolution primitive: `bun
  --filter @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run
  lint`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run test:api-snapshots`, `bun run
  validate:packages`, `bun run test:package-resolution`, and browser validation
  `bun run test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx
  playwright test examples/local-react-vite/e2e/resource-resolution.e2e.ts
  --config playwright.config.ts` passed. One `validate:packages` run failed
  while another workspace build was still cleaning dist; it passed when rerun
  after the build processes finished.
- Attachment controller boundary decision:
  - What remains internal: `useComposerAttachmentState()`, file input/drag/drop/
    paste wiring, preview URL revocation, attachment chip mutation, queued
    attachment edit/restore, and preview failure state.
  - What becomes public: no `useAgentAttachmentController()` export in this
    slice. Attachment behavior stays as `resolveLocalAttachment`, shared
    resource primitives, and composer/transcript integration.
  - Host responsibility intentionally not handled: upload admission, file
    persistence, static serving, authorization, tenant/workspace scoping,
    cleanup timing, and deciding which Codex input payload represents a file.
  - Example that proves the design: `/resource-resolution` proves structured
    media metadata, while `examples/codex-local-web` proves host-owned upload
    and asset serving through the existing composer props.
  - Tests that protect the contract: resource helper tests, React component
    attachment/media tests, API snapshots proving no new attachment controller
    export, and resource-resolution Playwright coverage.
- Commit-unit review process: spawned review subagent
  `019e8fd4-653a-7e70-9d6c-c522387674cf` with the `agent-ui-review` skill for
  the attachment controller boundary decision. The review reported no findings
  and confirmed no public attachment controller is implied by docs, source
  exports, or API snapshots.
- Focused validation after the attachment controller decision: `rg
  "useAgentAttachmentController|AgentAttachmentController" packages docs
  TODO.md test/api-snapshots` found only the TODO decision note, `bun run
  test:api-snapshots` passed, and `bunx vitest run
  test/docs-staleness.test.ts` passed. Broader package/style/lint/type gates
  were unchanged from the preceding resource primitive validation because this
  decision only updated TODO design notes.
- Public composer controller field slice:
  - What remains internal: the first-message operation map, retry payload
    registry, rollback details, generated protocol payloads, attachment-local
    draft state, and host-disabled policy.
  - What becomes public: `AgentComposerController` now includes `canSubmit`,
    `submitMode`, `disabledReason`, `failedPendingMessages`,
    `retryFailedPendingMessage()`, and `cancelFailedPendingMessage()` alongside
    the already-public value, queue, active turn, submit, steer, and stop view.
    `AgentComposerSubmitMode`, `AgentComposerDisabledReason`, and
    `AgentComposerFailedPendingMessage` are root-exported type contracts.
  - Host responsibility intentionally not handled: approval-waiting policy,
    read-only preview policy, auth, persistence, tenant/workspace scoping,
    upload/storage policy, and how external disabled state composes with
    controller state.
  - Example that proves the design: headless hook examples can consume the
    public controller while the default `AgentComposerPanel` continues to
    compose attachment-local state and host-disabled props.
  - Tests that protect the contract: React component tests cover failed pending
    first-message retry/cancel through the public controller, API snapshots
    protect the root types, and source-structure tests keep controller helpers
    split by responsibility.
- Commit-unit review process: spawned review subagent
  `019e8fdb-a12a-7572-adca-5824de632e6a` with the `agent-ui-review` skill for
  the public composer controller field slice. The review found a thread-scope
  leak where a no-active-thread controller could expose hidden failed operations;
  this was fixed by returning failed pending messages only for the resolved
  thread scope, with a regression test for the no-active-thread case. The
  follow-up review reported no findings.
- Focused validation after the public composer controller field slice: `bun
  --filter @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run
  lint`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run test:api-snapshots`, `bun run
  validate:packages`, and `bun run test:package-resolution` passed.
- Composer styled parts slice:
  - What remains internal: attachment mutation state, preview URL revocation,
    drag/drop/paste wiring, queued attachment restore ownership, first-message
    rollback/retry payloads, and default preset layout decisions.
  - What becomes public: `AgentComposerPanel`, `AgentComposerInput`,
    `AgentComposerToolbar`, `AgentAttachmentChips`,
    `AgentComposerSubmitButton`, and `AgentStartComposer` as root-exported
    styled parts. The normal composer now renders through those parts while
    preserving existing `.aui-*` class names and ARIA labels.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, upload/storage policy, external disabled policy,
    and host routing around first-run submission.
  - Example that proves the design: local React Vite closeups continue to render
    the real `AgentComposer`, and docs show hosts can render the new styled
    parts directly.
  - Tests that protect the contract: React component tests render the public
    styled parts without `AgentChat`, existing composer accessibility tests
    protect the default form, API snapshots protect the root exports, and
    visual/e2e composer suites protect desktop/mobile layout.
- Commit-unit review process: spawned review subagent
  `019e8fe6-db93-7f82-a711-da602150a067` with the `agent-ui-review` skill for
  the composer styled parts slice. The review found that
  `AgentAttachmentChip.kind` leaked the internal `ComposerAttachment` source
  type into the public declaration surface and that `AgentComposerInput`
  replaced host-provided `aria-describedby` when `shortcutHintId` was set. The
  slice now uses public `AgentAttachmentChipKind`, regenerates the API
  snapshot, and merges/deduplicates described-by ids with regression coverage.
  The follow-up review reported no findings.
- Focused validation after the composer styled parts slice: `bun --filter
  @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run lint`, `bun
  run test:styles`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
  test:api-snapshots`, `bun run validate:packages`, and `bun run
  test:package-resolution` passed. Browser validation passed with `bun run
  test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/design-system-contract.e2e.ts
  examples/local-react-vite/e2e/visual-closeups.e2e.ts --config
  playwright.config.ts`.
- Shared starter/normal composer primitive slice:
  - What remains internal: starter submission state, first-message optimistic
    operation payloads, attachment mutation and preview ownership, queued
    follow-up restore wiring, and default preset layout decisions.
  - What becomes public: `AgentComposerToolbarProps.className` so hosts and
    first-run surfaces can combine the shared toolbar primitive with contextual
    classes. `AgentStartComposer` now composes `AgentComposerInput`,
    `AgentComposerToolbar`, and `AgentComposerSubmitButton`; the normal
    composer already uses the same primitives.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, upload/storage policy, route selection after
    first-run submission, and Codex App Server process lifecycle.
  - Example that proves the design: the local React Vite empty first-run screen
    and fixture gallery continue to render the starter and normal composer with
    the same public primitive classes.
  - Tests that protect the contract: React component tests assert starter
    prompt/toolbar classes from the shared primitives, preserve Shift+Enter as
    a newline/non-submit, and preserve Enter submit. Design-system Playwright
    covers desktop/mobile starter and normal composer control sizing.
- Commit-unit review process: spawned review subagent
  `019e8ff3-6ad4-7882-93ca-15dc00fbf30d` with the `agent-ui-review` skill for
  the shared starter/normal composer primitive slice. The review found only
  this TODO progress mismatch: the shared primitive item was still unchecked
  even though source, tests, docs, and API snapshots showed the sharing. The
  item is now checked. The review reported no code, docs, snapshot,
  accessibility, import-cycle, styling, or product-boundary findings.
- Focused validation after the shared starter/normal composer primitive slice:
  `bun --filter @nyosegawa/agent-ui-react test`, `bun run typecheck`, `bun run
  lint`, `bun run test:styles`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run test:api-snapshots`, `bun run
  validate:packages`, and `bun run test:package-resolution` passed. Browser
  validation passed with `bun run test:e2e:clean-ports && env -u NO_COLOR -u
  FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/design-system-contract.e2e.ts
  examples/local-react-vite/e2e/visual-closeups.e2e.ts --config
  playwright.config.ts`. One `test:package-resolution` run failed while
  `validate:packages` was concurrently running Next builds; it passed when
  rerun serially. One `test:styles` run failed after a starter toolbar override
  was temporarily added to `composer.css`; the override was moved into the
  existing first-run section in `thread.css`, and `test:styles` passed.
- Browser behavior preservation slice:
  - What remains internal: fake Codex App Server timers, queued follow-up state,
    attachment preview ownership, stop/interrupt request construction, and
    transcript auto-follow bookkeeping.
  - What becomes public: no new public API. This slice validates the already
    public/default composer behavior through real-local browser tests.
  - Host responsibility intentionally not handled: App Server process
    lifecycle, upload persistence, static asset authorization, auth,
    tenant/workspace scoping, and remote deployment policy.
  - Example that proves the design: `examples/codex-local-web` exercises the
    default composer against the fake Codex App Server with queued follow-ups,
    stop/interrupt, attachment edit/restore, arbitrary file payloads, and
    mobile composer anchoring.
  - Tests that protect the contract:
    `examples/codex-local-web/e2e/real-local-follow-ups.e2e.ts`,
    `examples/codex-local-web/e2e/real-local-attachments.e2e.ts`, and
    `examples/local-react-vite/e2e/design-system-contract.e2e.ts`.
- Commit-unit review process: spawned review subagent
  `019e8ff9-4284-7d41-ae79-9515d4ccbb28` with the `agent-ui-review` skill for
  the browser behavior preservation slice. The review found that changing the
  shared `slow smoke` fixture to emit an immediate first delta would break the
  Phase 4 first-message ordering proof. The fake server now keeps `slow smoke`
  delayed and uses `streaming smoke` for immediate-streaming long-running
  follow-up behavior.
- Focused validation after browser behavior preservation: `bun run
  test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts
  examples/codex-local-web/e2e/real-local-follow-ups.e2e.ts
  examples/codex-local-web/e2e/real-local-attachments.e2e.ts --config
  playwright.real-local.config.ts` passed 15 tests after the fake Codex App
  Server split the long-running fixtures: `slow smoke` still delays the first
  assistant delta for first-message ordering coverage, while `streaming smoke`
  emits an immediate first delta and delays turn completion so auto-follow,
  running-turn queue, steer, and stop behavior can be tested together. Retry
  browser proof is covered by the following `/composer-retry` fixture slice.
- Browser retry proof slice:
  - What remains internal: first-message retry payload storage, rollback
    details, generated `turn/start` params, retrying operation set, and default
    preset layout.
  - What becomes public: no new public API. The browser route uses the already
    public `useAgentComposerController()` retry surface.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, retry audit storage, routing after retry, and App
    Server process lifecycle.
  - Example that proves the design: `/composer-retry` in the local React Vite
    fixture creates a failed first message, retries it through the public
    composer controller, and proves the same user message remains visible.
  - Tests that protect the contract:
    `examples/local-react-vite/e2e/composer-retry.e2e.ts` plus React component
    retry coverage for operation id reuse and text preservation.
- Focused validation after browser retry proof: `bun --filter
  @nyosegawa/agent-ui-react test -- retries failed first messages`, `bun run
  typecheck`, and `bun run test:e2e:clean-ports && env -u NO_COLOR -u
  FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/composer-retry.e2e.ts --config
  playwright.config.ts` passed. The browser/e2e queue/edit/retry/stop/
  attachments checklist item is now complete through the combined real-local
  follow-up/attachment tests and the local React Vite retry fixture.
- Commit-unit review process: spawned review subagent
  `019e9003-ec4b-7af3-ac5d-45c1fe6cd560` with the `agent-ui-review` skill for
  the browser retry proof slice. The review reported no findings and confirmed
  that the fixture uses the public composer controller retry action without
  moving rollback or retry internals into host code.
- Phase 8 completion validation: `bun run test:api-snapshots`, `bun run
  test:styles`, `bunx vitest run test/docs-staleness.test.ts`, `bun
  --filter @nyosegawa/agent-ui-react test -- retries failed first messages`,
  `bun run lint`, `bun run typecheck`, `bun run validate:packages`, and `bun
  run test:package-resolution` passed. `validate:packages` still reports only
  the baseline `publint` repository URL suggestions.

## Phase 9: Component Layering And Visual Baseline

- [x] Replace `slots` with `components` map.
- [x] Add `defaultAgentComponents`.
- [x] Keep new parts internal/source-level until component replacement tests and
  examples prove the contract.
- [x] Start with limited replacement points:
  - [x] layout shell
  - [x] sidebar
  - [x] empty state / start composer
  - [x] composer panel
  - [x] transcript block renderers
  - [x] approval surface
- [x] Add typed props for each replaceable component.
- [x] Pass `Default` renderers to replaceable parts.
- [x] Limit `Default` renderers to narrow block-level or surface-level
  contracts where they do not expose private internals.
- [x] Reject replacement points whose accessibility, scroll, or approval-anchor
  contract cannot be documented and tested.
- [x] Keep `AgentChat` as the default product-quality preset.
- [x] Mark candidate styled parts as public only after the component replacement
  design gate passes.
- [x] Ensure replacing one block does not bypass transcript wrappers.
- [x] Ensure replacing sidebar does not require reimplementing list controller.
- [x] Ensure replacing composer toolbar does not break submit semantics.
- [x] Add fixture close-ups for:
  - [x] empty state mobile
  - [x] start composer
  - [x] sidebar drawer search/select
  - [x] custom block renderer fallback
  - [x] local media fallback card
  - [x] optimistic pending message
- [x] Run visual layout tests for desktop and mobile.
- [x] Run agent-browser QA for the real local app default route.
- [x] Run agent-browser QA for the fixture gallery.
- [x] Capture screenshots for changed docs where needed.

Phase 9 notes:

- Components map replacement slice:
  - What remains internal: reducer entities, transcript entry construction,
    approval placement/anchoring, sidebar history controller internals, first-run
    optimistic operation state, composer attachment mutation state, and
    generated protocol payloads.
  - What becomes public: `AgentComponents`, `defaultAgentComponents`, typed
    replacement props for `Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`,
    `Approval`, `Item`, and transcript `blocks`, plus `components` on
    `AgentChat` and the web component element/options.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, deployment policy, custom approval decision
    storage, upload/storage policy, and App Server process lifecycle.
  - Example that proves the design: `examples/recipes/src/custom-components.tsx`
    uses the `AgentChat.components` map; the web component test proves
    `components` and `agentOptions.components` pass-through.
  - Tests that protect the contract: React component tests cover preset item
    replacement and transcript block `Default` fallback, web component tests
    cover property pass-through, API snapshots protect the public map and
    removal of `AgentChatSlots`, and style/source-structure tests protect the
    wrapper CSS contract.
- Commit-unit review process: spawned review subagent
  `019e900e-37d0-79e1-8450-fd0590350532` with the `agent-ui-review` skill for
  the initial components map slice. Findings about stale API snapshots, an
  under-specified `AgentComponents` shape, and missing web component behavioral
  coverage were fixed by rebuilding/updating snapshots, adding typed
  replacement points with `Default` renderers, wiring transcript block
  replacement, and adding web component tests. The follow-up review reported no
  findings.
- Focused validation after the components map replacement slice: `bun
  --filter @nyosegawa/agent-ui-react test -- components map`, `bun --filter
  @nyosegawa/agent-ui-web-components test`, `bun run test:api-snapshots`, `bun
  run test:styles`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
  lint`, `bun run typecheck`, `bun run validate:packages`, and `bun run
  test:package-resolution` passed. `validate:packages` still reports only the
  baseline `publint` repository URL suggestions.
- Replacement-point contract gate:
  - What remains internal: transcript scroll container, approval anchor
    placement, composer toolbar internals, attachment mutation controls,
    sidebar pagination internals, and generated block normalization.
  - What becomes public: the accepted `AgentComponents` keys remain exactly
    `Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`, `Approval`, `Item`, and
    `blocks`, each with the documented surface-level props and narrow
    `Default` renderer where applicable.
  - Host responsibility intentionally not handled: custom approval decision
    storage, custom thread-history persistence, host routing, auth,
    tenant/workspace scoping, deployment policy, upload/storage policy, and App
    Server process lifecycle.
  - Example that proves the design: `examples/recipes/src/custom-components.tsx`
    shows a custom approval wrapper while preserving default approval actions
    through `Default`.
  - Tests that protect the contract: React component tests prove
    `components.Approval` stays at the existing transcript anchor and tail
    fallback, transcript block replacement stays inside the default message
    wrapper, and source-structure tests enforce the exact public
    `AgentComponents` key set.
- Commit-unit review process: spawned review subagent
  `019e9022-7c05-7a32-8115-c97304ebc607` with the `agent-ui-review` skill for
  the replacement-point contract gate. Findings about missing
  `components.Approval` anchor proof, a weak source-structure guard, and a
  recipe approval example without resolution actions were fixed with focused
  tests and recipe updates.
- Focused validation after the replacement-point contract gate: `bun --filter
  @nyosegawa/agent-ui-react test -- 'approval anchors|replacement
  points|components map replace transcript blocks'`, `bun run test:styles`,
  `bun run typecheck`, `bun run lint`, `bun run test:api-snapshots`, `bunx
  vitest run test/docs-staleness.test.ts`, and browser validation `bun run
  test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/design-system-contract.e2e.ts
  examples/local-react-vite/e2e/visual-closeups.e2e.ts --config
  playwright.config.ts` passed.
- Default preset quality gate:
  - What remains internal: default shell/sidebar drawer layout state,
    transcript scroll-follow behavior, command/diff lazy bodies, composer
    toolbar internals, and approval anchor placement.
  - What becomes public: no new public API. `AgentChat` remains the
    product-quality preset over the public components map and styled parts.
  - Host responsibility intentionally not handled: host chrome layout,
    authenticated profile placement, persistence, tenant/workspace scoping,
    deployment policy, and remote runtime/process lifecycle.
  - Example that proves the design: the local React Vite default route `/`
    renders the product preset without `components` overrides;
    `/host-workflow-recipe` proves hosts can compose primitives without
    degrading the preset.
  - Tests that protect the contract: `examples/local-react-vite/e2e/smoke.e2e.ts`
    and `examples/local-react-vite/e2e/visual-layout.e2e.ts` cover desktop and
    mobile default shell layout, horizontal overflow, thread drawer behavior,
    transcript/composer/menu reachability, nonblank screenshots, and visual
    layout snapshots.
- Focused validation after the default preset quality gate: `bun run
  test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/smoke.e2e.ts
  examples/local-react-vite/e2e/visual-layout.e2e.ts --config
  playwright.config.ts` passed 22 tests.
- Public styled-parts gate:
  - What remains internal: composer submission state, first-message operation
    payloads, attachment mutation/preview ownership, toolbar keyboard
    semantics, and default preset layout decisions.
  - What becomes public: the Phase 8 styled parts remain root exports after the
    component replacement design gate: `AgentComposerPanel`,
    `AgentComposerInput`, `AgentComposerToolbar`, `AgentAttachmentChips`,
    `AgentComposerSubmitButton`, and `AgentStartComposer`.
  - Host responsibility intentionally not handled: auth, persistence,
    tenant/workspace scoping, upload/storage policy, external disabled policy,
    route selection after first-run submission, and App Server process
    lifecycle.
  - Example that proves the design: local React Vite closeups render the real
    composer primitives, and the default `/` route proves `AgentChat` still
    composes them as the preset.
  - Tests that protect the contract: Phase 8 React styled-part tests, API
    snapshots, style/source-structure tests, and the Phase 9 components-map
    replacement tests protect these exports after the replacement design gate.
- Wrapper delegation contract gate:
  - What remains internal: transcript message wrappers, sidebar list controller
    and pagination behavior, composer toolbar keyboard/submission semantics,
    and generated turn/start request construction.
  - What becomes public: no new API. Hosts may wrap `blocks`, `Sidebar`, or
    `ComposerPanel`, but the documented `Default` renderer remains the way to
    preserve the default wrapper/controller/submit contracts.
  - Host responsibility intentionally not handled: custom history persistence,
    custom routing, custom approval audit storage, auth, tenant/workspace
    scoping, deployment policy, and App Server process lifecycle.
  - Example that proves the design: the custom components recipe demonstrates
    wrapper-style composition while preserving default approval actions.
  - Tests that protect the contract: React component tests prove a custom block
    remains inside `.aui-message`, a custom sidebar wrapper can delegate to
    `Default` and still use history search/collapse controls, and a custom
    composer panel wrapper can delegate to `Default` while preserving
    Shift+Enter newline and Enter submit semantics.
- Focused validation after the wrapper delegation contract gate: `bun --filter
  @nyosegawa/agent-ui-react test -- 'sidebar replacements|composer panel
  replacements|components map replace transcript blocks'` and `bun run
  typecheck` passed.
- Fixture close-up baseline gate:
  - What remains internal: first-message optimistic operation bookkeeping,
    sidebar drawer open state, sidebar search pagination requests, transcript
    media URL resolution, transcript message wrappers, and low-level block
    normalization.
  - What becomes public: no new API. Existing public primitives and preset
    surfaces are exercised: `AgentChat`, `AgentStartComposer`,
    `AgentMessageList`, `components.blocks.commandExecution`, and the default
    sidebar/composer/empty-state surfaces.
  - Host responsibility intentionally not handled: local media authorization
    and URL minting, thread-history persistence, custom routing after thread
    selection, auth, tenant/workspace scoping, deployment policy, and App
    Server process lifecycle.
  - Example that proves the design: `examples/local-react-vite` fixture gallery
    close-ups for empty mobile state, start composer, sidebar drawer
    search/select, custom command block fallback, local media fallback card, and
    optimistic pending message.
  - Tests that protect the contract:
    `examples/local-react-vite/e2e/visual-closeups.e2e.ts` checks the direct
    primitives, fallback media DOM, pending message status, and mobile sidebar
    drawer search/select behavior.
- Focused validation after the fixture close-up baseline gate: `bun run
  typecheck`, `bun run lint`, and `bun run test:e2e:clean-ports && env -u
  NO_COLOR -u FORCE_COLOR bunx playwright test
  examples/local-react-vite/e2e/visual-closeups.e2e.ts --config
  playwright.config.ts` passed.
- Commit-unit review process: spawned review subagent
  `019e9056-c057-7bb0-a129-33af817f372b` with the `agent-ui-review` skill for
  the fixture close-up baseline slice. The review found that the mobile sidebar
  drawer test only proved drawer collapse, not selected thread hydration. The
  fixture now renders selected-thread transcript content, and the Playwright
  test asserts the `Renderer audit` heading plus the selected transcript text.
- Browser QA after the fixture close-up baseline gate: visual layout tests `bun
  run test:e2e:clean-ports && env -u NO_COLOR -u FORCE_COLOR bunx playwright
  test examples/local-react-vite/e2e/visual-layout.e2e.ts --config
  playwright.config.ts` passed 14 tests. agent-browser QA checked
  `/fixture-gallery` at 1280x900 and 390x900, opened the sidebar drawer,
  searched `renderer`, selected `Renderer audit`, verified local media fallback
  and optimistic pending DOM, and captured
  `/tmp/agent-ui-fixture-gallery-desktop.png` and
  `/tmp/agent-ui-fixture-gallery-mobile.png`. This found a 19px mobile
  document overflow from the fixture group header pill; `fixture-gallery.css`
  now allows that label to wrap, and recheck showed overflow `0`. agent-browser
  QA also checked the real local app default route at `http://127.0.0.1:5175/`
  on 1280x900 and 390x900, verified shell/composer or first-run reachability,
  mobile drawer/search reachability, overflow `0`, and captured
  `/tmp/agent-ui-real-local-default-desktop.png` and
  `/tmp/agent-ui-real-local-default-mobile.png`. No changed docs required new
  committed screenshots.

## Phase 10: Bridge Policy And Structured Diagnostics

- [x] Add `AgentUiBridgePolicy`.
- [x] Add explicit admission modes:
  - [x] local loopback only
  - [x] host callback
  - [x] unsafe no admission with required reason
- [x] Replace opaque browser method allowlists with capability categories.
- [x] Add context-rich server request policy callback.
- [x] Add bounded permission grant enforcement.
- [x] Remove generic broad auto-accept behavior where unsafe.
- [x] Add dynamic tool policy shape.
- [x] Add dynamic tool debug events:
  - [x] received
  - [x] denied
  - [x] helper thread created
  - [x] MCP call started
  - [x] timeout
  - [x] completed
  - [x] failed
- [x] Add bridge health state:
  - [x] admission checked
  - [x] process spawned
  - [x] initialized
  - [x] connected
  - [x] idle closed
  - [x] backpressure closed
  - [x] pending request count
  - [x] last redacted diagnostic
- [x] Add diagnostic audience:
  - [x] user
  - [x] developer
  - [x] audit
- [x] Ensure default UI renders user-facing diagnostics separately from debug
  diagnostics.
- [x] Ensure stderr, admission phases, and dynamic tool phases default to
  developer/audit audience.
- [x] Add React diagnostics controller updates.
- [x] Separate user-facing errors from debug-only warnings.
- [x] Add server unit tests for policy decisions.
- [x] Add server unit tests for bounded permission grants.
- [x] Add server unit tests for bridge health events.
- [x] Add docs for host-owned audit logging and auth boundaries.

Phase 10 notes:

- Bridge admission policy slice:
  - What remains internal: child process spawn mechanics, raw request/socket
    objects beyond the admission callback, unredacted stderr, and low-level
    transport lifecycle.
  - What becomes public: `AgentUiBridgePolicy`,
    `AgentUiBridgeAdmissionPolicy`, and `bridgePolicy.admission` on
    `AgentUiWebSocketBridgeOptions` with `local-loopback`, `host-callback`, and
    `unsafe-no-admission` modes. The legacy top-level `admission` callback is
    treated as host-callback policy.
  - Host responsibility intentionally not handled: authentication,
    tenant/workspace isolation, audit log storage, non-loopback exposure
    policy, deployment topology, and process admission beyond the supplied
    callback or explicit unsafe reason.
  - Example that proves the design: `examples/next-with-bridge-sidecar` remains
    loopback-first through the default `local-loopback` policy while docs direct
    non-loopback hosts to host-callback admission.
  - Tests that protect the contract: server WebSocket tests cover explicit
    host-callback rejection before spawn, unsafe no-admission reason
    enforcement before spawn, unsafe reason logging, and the existing legacy
    admission rejection/error behavior.
- Focused validation after the bridge admission policy slice: `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run typecheck`, and `bun
  run test:api-snapshots` passed.
- Commit-unit review process: spawned review subagent
  `019e9061-8d37-7052-89c5-cfef8fa63c9f` with the `agent-ui-review` skill for
  the bridge admission policy slice. The review found the server API snapshot
  was stale after package declarations were rebuilt. `bun run
  validate:packages` passed with only the baseline `publint` repository URL
  suggestions, then `bun run test:api-snapshots` failed as expected for
  `server__index.d.ts`; `bun run test:api-snapshots:update` refreshed the
  reviewed public API snapshot and `bun run test:api-snapshots` passed.
- Browser method capability policy slice:
  - What remains internal: the concrete per-method sets produced from
    capabilities, low-level JSON-RPC forwarding, transport request execution,
    and generated App Server method metadata.
  - What becomes public: `BrowserMethodCapability` and
    `browserMethodPolicy: { capabilities: [...] }` for the WebSocket bridge.
    The default productized browser surface is now expressed as named
    capability categories rather than opaque method arrays; `all` remains an
    explicit unsafe host-owned escape hatch.
  - Host responsibility intentionally not handled: authorization for host-only
    methods such as filesystem, command, MCP calls, and config writes outside
    the published categories; audit logging; tenant/workspace isolation; and
    deployment exposure policy.
  - Example that proves the design: `examples/next-with-bridge-sidecar` and
    `examples/codex-local-web` continue to use the productized default browser
    capability set for `AgentChat`.
  - Tests that protect the contract: server WebSocket tests prove host-only
    methods are rejected by default, default full-chat methods still forward,
    capability subsets narrow the browser surface, and `all` explicitly
    forwards host-only methods.
- Focused validation after the browser method capability policy slice: `bun
  --filter @nyosegawa/agent-ui-server test -- websocket`, `bun run
  typecheck`, `bun run lint`, `bun run validate:packages`, `bun run
  test:api-snapshots:update`, and `bun run test:api-snapshots` passed.
- Commit-unit review process: spawned review subagent
  `019e9073-8648-7530-afc7-8028776624a0` with the `agent-ui-review` skill for
  the browser method capability policy slice. The review found that unknown
  runtime capability strings could throw during connection handling. The bridge
  now validates capability names before spawning, closes with a controlled
  browser-method-policy failure, and logs only redacted diagnostics; server
  WebSocket tests cover the invalid-runtime-capability path.
- Context-rich server request policy callback slice:
  - What remains internal: raw JSON-RPC forwarding, generated request payload
    shapes beyond the normalized context, fallback auto-resolution branches,
    and response/audit transport plumbing.
  - What becomes public: `serverRequestPolicy.decide(context)` plus
    `ServerRequestPolicyContext`, `ServerRequestPolicyDecision`, and
    `ServerRequestPolicyCallback`. The callback receives normalized request
    kind, request id, optional thread and turn ids, the public pending request,
    and the raw payload for host-owned decisions.
  - Host responsibility intentionally not handled: authentication, audit log
    persistence, tenant/workspace authorization, deployment exposure policy,
    and deciding whether a custom response is appropriate for a specific
    request. Returning `manual` keeps the request in the UI/manual path.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` continue to prove the default manual
    request boundary; the server bridge reference documents the callback for
    hosts that intentionally add custom request resolution.
  - Tests that protect the contract: server WebSocket tests cover custom
    `userInput` response resolution with thread/turn context and manual
    override before command auto-accept fallback.
- Focused validation after the context-rich server request policy callback
  slice: `bun --filter @nyosegawa/agent-ui-server test -- websocket`, `bun run
  typecheck`, `bun run lint`, `bun run validate:packages`, `bun run
  test:api-snapshots:update`, and `bun run test:api-snapshots` passed.
- Commit-unit review process: spawned review subagent
  `019e9081-d2bf-79a3-a860-9bf40ac1b3a4` with the `agent-ui-review` skill for
  the context-rich server request policy callback slice. The review found that
  `serverRequestPolicy.decide` exceptions could tear down the bridge and skip
  the manual UI path. The bridge now logs redacted policy failures, suppresses
  fallback auto-accept for that request, and forwards the request manually;
  server WebSocket coverage includes a throwing callback with command
  auto-accept configured. Follow-up focused validation passed with `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run typecheck`, and `bun
  run lint`.
- Follow-up review from the same subagent reported no findings. Final
  validation for this slice passed with `bun run test:api-snapshots`, `bun run
  test:styles`, `bun run validate:packages`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run lint`, `bun run typecheck`, and `bun
  run test:package-resolution`. The forbidden generated/dist/third-party diff
  check produced no matches.
- Bounded permission grant enforcement slice:
  - What remains internal: the concrete clamp helpers for permission family
    comparison, filesystem mode/path and protocol permission-profile subset
    checks, and response construction.
  - What becomes public: no new export; the existing
    `serverRequestPolicy.permissions(context)` contract now guarantees that
    returned grants are bounded to the requested permission families,
    protocol-shaped filesystem `read`/`write`/`entries` subsets, and
    `globScanMaxDepth` before the bridge responds. Returned `"session"` scope
    remains an explicit host decision after the permissions are bounded.
  - Host responsibility intentionally not handled: deciding whether to grant at
    all, authentication, authorization, audit persistence, tenant/workspace
    scoping, session-scope risk decisions, and schema-wide permission
    interpretation beyond the supported filesystem/network shapes.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` continue to keep permissions manual by
    default; the server bridge reference documents the opt-in callback shape.
  - Tests that protect the contract: server WebSocket tests cover default
    manual behavior, bounded allowed grants, preserving explicit session scope
    after bounding, dropping unrequested network grants, and dropping
    filesystem grants that broaden requested `read`/`write`/`entries` or
    `globScanMaxDepth`.
- Focused validation after the bounded permission grant enforcement slice:
  `bun --filter @nyosegawa/agent-ui-server test -- websocket`, `bun run
  typecheck`, and `bun run lint` passed.
- Commit-unit review process: spawned review subagent
  `019e908b-4cef-7272-8d76-ca9e339e134a` with the `agent-ui-review` skill for
  the bounded permission grant enforcement slice. The review found that the
  first clamp only covered invented `mode`/`paths` shapes and missed the
  protocol-shaped `read`/`write`/`entries` permission profile. The normal
  permission path now bounds `read`, `write`, `entries`, and
  `globScanMaxDepth`, docs distinguish dynamic helper turn scope from normal
  session scope, and server WebSocket tests cover protocol-shaped subset and
  broadening cases. Follow-up review found only the TODO test checkbox
  tracking mismatch, which was corrected here.
- Final validation after the bounded permission grant enforcement slice passed
  with `bun --filter @nyosegawa/agent-ui-server test -- websocket`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, `bun run
  typecheck`, and `bun run test:package-resolution`. The forbidden
  generated/dist/third-party diff check produced no matches.
- Broad auto-accept removal slice:
  - What remains internal: raw JSON-RPC approval response construction,
    command/file-change payload probing, and log/audit transport plumbing.
  - What becomes public: `serverRequestPolicy.commandExecution(context)` and
    `serverRequestPolicy.fileChange(context)` callback contracts with
    request/thread/turn/item context and explicit `{ action: "accept",
    scope?: "request" | "session" }` decisions. Generic
    `commandExecution: "accept"` and `fileChange: "acceptForSession"` broad
    toggles are no longer accepted by the public type or honored at runtime.
  - Host responsibility intentionally not handled: deciding which commands,
    file-change roots, sessions, users, workspaces, or tenants may be
    auto-approved; audit persistence; authorization; and deployment exposure
    policy.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` continue to prove the default manual
    approval boundary; the server bridge reference documents callback-only
    command/file approval auto-resolution for hosts that intentionally opt in.
  - Tests that protect the contract: server WebSocket tests cover manual
    override before callback fallback, callback exception fallback to manual,
    context-aware command/file acceptance, and ignored legacy broad string
    policies.
- Focused validation after broad auto-accept removal: `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run typecheck`, and `bun
  run lint` passed.
- Commit-unit review process: spawned review subagent
  `019e9098-4b82-7233-9e54-b600810752a2` with the `agent-ui-review` skill for
  the broad auto-accept removal slice. The review reported no findings and
  confirmed that command/file auto-resolution is callback-only, legacy broad
  string policies resolve to manual, callback failures remain on the manual UI
  path, and docs/API snapshots match the new public surface.
- Final validation after broad auto-accept removal passed with `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run
  test:api-snapshots:update`, `bun run test:api-snapshots`, `bun run
  test:styles`, `bun run validate:packages`, `bunx vitest run
  test/docs-staleness.test.ts`, `bun run lint`, `bun run typecheck`, and `bun
  run test:package-resolution`.
- Dynamic tool policy shape slice:
  - What remains internal: dynamic tool request routing through the WebSocket
    bridge, helper-thread promise caching, raw MCP JSON-RPC request/response
    plumbing, redacted failure response construction, and helper permission
    bounding internals.
  - What becomes public: `AgentUiDynamicToolPolicy` on
    `AgentUiWebSocketBridgeOptions`, with explicit `disabled` and
    `host-callback` modes. `DynamicToolHandler`,
    `DynamicToolHelperPermissionPolicy`, and `createMcpDynamicToolHandler()`
    remain public host-owned integration helpers; `defaultDynamicToolHandler`
    was removed.
  - Host responsibility intentionally not handled: dynamic tool authorization,
    MCP registry selection, tenant/workspace isolation, audit persistence,
    production resource limits, and deciding which helper permissions may be
    granted.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` continue to prove the default disabled
    bridge boundary; the server bridge reference documents the explicit
    `dynamicToolPolicy: { mode: "host-callback", handler }` integration.
  - Tests that protect the contract: server WebSocket tests cover default
    disabled dynamic tool execution, host-callback MCP mapping, redacted handler
    failures, helper MCP approval auto-resolution, and dynamic helper
    permission policies.
- Focused validation after the dynamic tool policy shape slice: `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run typecheck`, `bun
  --filter @nyosegawa/agent-ui-server build`, and `bun run
  test:api-snapshots:update` passed.
- Commit-unit review process: spawned review subagent
  `019e90a1-7430-7421-8e0c-fc1d28bad16f` with the `agent-ui-review` skill for
  the dynamic tool policy shape slice. The review found that
  `skills/agent-ui/references/dynamic-tools.md` still documented the removed
  `dynamicToolHandler` and `dynamicToolHelperPermissions` options. The skill
  reference now documents `dynamicToolPolicy: { mode: "host-callback",
  handler }` and `dynamicToolPolicy.helperPermissions`.
- Final validation after dynamic tool policy shape passed with `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, `bun run
  typecheck`, and `bun run test:package-resolution`. `publint` still reports
  only the baseline repository URL suggestions. The old `dynamicToolHandler` /
  `dynamicToolHelperPermissions` option names no longer appear in source,
  docs, skills, or API snapshots, and the forbidden generated/dist/third-party
  diff check produced no matches.
- Dynamic tool debug events slice:
  - What remains internal: raw dynamic tool arguments, MCP result content,
    helper-thread promise caching, low-level JSON-RPC request/response
    plumbing, and redacted message construction.
  - What becomes public: `hostEvents.onDynamicToolEvent`, plus
    `DynamicToolDebugEvent`, `DynamicToolDebugPhase`,
    `DynamicToolDebugRequest`, and `DynamicToolDebugEventDetails`. Dynamic
    handlers receive `context.emitDebugEvent()` so host-provided handlers and
    the MCP mapping helper can report phase metadata.
  - Host responsibility intentionally not handled: audit persistence,
    dynamic-tool authorization, tenant/workspace scoping, deployment exposure
    policy, and deciding which debug events are stored or shown in host
    developer/audit tooling.
  - Example that proves the design: `examples/codex-local-web` and
    `examples/next-with-bridge-sidecar` continue to prove default disabled
    dynamic tool execution; the server bridge reference documents the host
    event sink for integrations that opt in.
  - Tests that protect the contract: server WebSocket tests cover disabled
    `received`/`denied`, host-callback `received`,
    `helperThreadCreated`, `mcpCallStarted`, `completed`, redacted `failed`,
    and no raw arguments in debug events. Dynamic tool helper tests cover
    allowlist `denied` and MCP `timeout` events.
- Focused validation after the dynamic tool debug events slice: `bun --filter
  @nyosegawa/agent-ui-server test -- websocket dynamic-tools`, `bun run
  typecheck`, `bun --filter @nyosegawa/agent-ui-server build`, `bun run
  test:api-snapshots:update`, and `bun run lint` passed.
- Commit-unit review process: spawned review subagent
  `019e90ab-f65e-7b12-b5a9-1eb7407a6240` with the `agent-ui-review` skill for
  the dynamic tool debug events slice. The review found that throwing
  `hostEvents.onDynamicToolEvent` callbacks could alter bridge execution and
  that `completed` was emitted before the App Server response write succeeded.
  Dynamic tool host-event callbacks are now best-effort and redacted on failure,
  `completed` is emitted only after `transport.respond()` succeeds, and server
  WebSocket tests cover throwing event sinks on disabled denial and successful
  handler responses. Focused validation after the fixes passed with `bun
  --filter @nyosegawa/agent-ui-server test -- websocket dynamic-tools`, `bun
  run typecheck`, and `bun run lint`.
- Follow-up review from the same subagent reported no findings after the
  best-effort event sink and post-response `completed` fixes.
- Final validation after dynamic tool debug events passed with `bun --filter
  @nyosegawa/agent-ui-server test -- websocket dynamic-tools`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, `bun run
  typecheck`, and `bun run test:package-resolution`. `publint` still reports
  only the baseline repository URL suggestions. The forbidden
  generated/dist/third-party diff check produced no matches.
- Bridge health state slice:
  - What remains internal: bridge process lifecycle internals, WebSocket
    backpressure guard mechanics, raw stderr, raw browser/App Server
    request/response payloads, and mutation of the health state snapshot.
  - What becomes public: `hostEvents.onBridgeHealthEvent`,
    `AgentUiBridgeHealthEvent`, `AgentUiBridgeHealthPhase`, and
    `AgentUiBridgeHealthState` with admission, spawn, initialization,
    connection, idle/backpressure close, pending request count, and last
    redacted diagnostic fields.
  - Host responsibility intentionally not handled: authentication,
    tenant/workspace isolation, audit log persistence, alerting policy,
    deployment policy, and deciding where bridge health is shown or stored.
  - Example that proves the design: the loopback bridge examples keep the
    default host-owned bridge boundary, while the server bridge reference and
    Agent UI skill reference document the `hostEvents.onBridgeHealthEvent`
    integration for hosts that opt into developer/audit diagnostics.
  - Tests that protect the contract: server WebSocket tests cover lifecycle and
    pending-count events, redacted diagnostics without raw command secrets,
    unknown browser responses that must not decrement unrelated pending counts,
    idle closure health events, and backpressure closure health events.
- Focused validation after the bridge health state slice: `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run typecheck`, `bun
  --filter @nyosegawa/agent-ui-server build`, `bun run
  test:api-snapshots:update`, and `bun run lint` passed.
- Commit-unit review process: spawned review subagent
  `019e90be-6524-70e2-817c-c5b0b2bc25b7` with the `agent-ui-review` skill for
  the bridge health state slice. The review found that a stray or duplicate
  browser JSON-RPC response could decrement an unrelated pending request count.
  Pending request tracking is now keyed by request id, unknown ids are ignored
  for health count updates, and server WebSocket coverage includes the unknown
  response case. Follow-up review from the same subagent reported no findings.
- Final validation after bridge health state passed with `bun --filter
  @nyosegawa/agent-ui-server test -- websocket`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, `bun run
  typecheck`, and `bun run test:package-resolution`. `publint` still reports
  only the baseline repository URL suggestions. The forbidden
  generated/dist/third-party diff check produced no matches.
- Diagnostic audience slice:
  - What remains internal: raw stderr, raw protocol notifications, bridge
    transport internals, diagnostic retention policy internals, and any
    host-specific log routing, alerting, tenant/workspace mapping, or audit
    storage.
  - What becomes public: `AgentDiagnosticAudience`, optional diagnostic
    `audience` metadata on errors, warnings, status banners, protocol
    notifications, bridge health events, and dynamic tool debug events;
    audience-filtered core selectors; and `useAgentDiagnostics()`
    `userDiagnostics`, `developerDiagnostics`, and `auditDiagnostics` views.
  - Host responsibility intentionally not handled: authentication,
    authorization, tenant/workspace isolation, audit log persistence, alerting
    policy, and deciding which developer/audit diagnostics are displayed or
    stored.
  - Example that proves the design: default `AgentChat diagnostics` now renders
    only user-audience diagnostics while host code can read
    developer/audit diagnostics through the hook; loopback bridge examples keep
    host-owned bridge logging boundaries.
  - Tests that protect the contract: core reducer tests cover audience
    filtering and defaults; React component tests cover stderr classification
    into developer/audit without default visible UI; Codex protocol tests cover
    raw/unsupported notification audiences; server WebSocket tests cover
    bridge health and dynamic tool debug event audiences.
- Focused validation after the diagnostic audience slice: `bun run
  test:protocol`, `bun --filter @nyosegawa/agent-ui-core test -- reducer`,
  `bun --filter @nyosegawa/agent-ui-react test -- components
  status-formatting`, `bun --filter @nyosegawa/agent-ui-server test --
  websocket dynamic-tools`, `bun run typecheck`, `bun run lint`, `bun run
  build`, and `bun run test:api-snapshots:update` passed. Running `bun --filter
  @nyosegawa/agent-ui-codex test -- protocol` from the package cwd failed
  because raw JSON-RPC fixture tests expect the repository-root working
  directory; the root `bun run test:protocol` passed.
- Commit-unit review process: spawned review subagent
  `019e90d0-2e91-7f72-a3c6-f53be94630b9` with the `agent-ui-review` skill for
  the diagnostic audience slice. The review found that status summary/details
  and critical notices still read raw banners, so developer/audit banners could
  become user-visible. Those components now read `userDiagnostics.banners`, and
  React coverage includes a developer/audit critical banner that must not render
  in status summary/details/critical UI. Follow-up review from the same
  subagent reported no findings.
- Final validation after diagnostic audience passed with `bun run
  test:protocol`, `bun --filter @nyosegawa/agent-ui-core test -- reducer`,
  `bun --filter @nyosegawa/agent-ui-react test -- components
  status-formatting`, `bun --filter @nyosegawa/agent-ui-server test --
  websocket dynamic-tools`, `bun run typecheck`, `bun run lint`, `bun run
  test:api-snapshots`, `bun run test:styles`, `bun run validate:packages`,
  `bunx vitest run test/docs-staleness.test.ts`, and `bun run
  test:package-resolution`. `publint` still reports only the baseline
  repository URL suggestions. The forbidden generated/dist/third-party diff
  check produced no matches.

## Phase 11: Codex Normalization Updates

- [x] Implement the normalization work approved in Phase 2.
- [x] Normalize all productized thread lifecycle notifications.
- [x] Normalize thread archive/unarchive/close consistently.
- [x] Normalize compact/settings/goal lifecycle only where productized.
- [x] Preserve experimental/host-only labeling.
- [x] Normalize media item payloads into resource-aware blocks.
- [x] Preserve `clientUserMessageId` for optimistic reconciliation.
- [x] Update protocol capability docs.
- [x] Update API snapshots.
- [x] Run protocol and normalizer tests.

### Phase 11 Notes

- 2026-06-04 thread/list normalizer slice:
  - what remains internal: core thread entity state, canonical aliases,
    collection store internals, and raw generated `ThreadListResponse` payloads
    remain internal/source-level details.
  - what becomes public: `normalizeThreadListResponse()` on the
    `@nyosegawa/agent-ui-codex/normalizer` subpath only, returning normalized
    events, ids, response cursors, and the host-supplied `AgentThreadScope`.
  - what host responsibility is intentionally not handled: workspace, tenant,
    routing, persistence, audit logging, and durable meaning for history scopes
    remain host-owned; Agent UI only stores scoped collection view state.
  - which example proves the design: upcoming scoped thread-list example work
    in Phase 12 should call the helper with the request scope used by the host.
  - which tests protect the contract:
    `packages/codex/test/protocol.test.ts` covers `thread/list` snapshots,
    archived/cwd collection scope, pagination cursors, reducer integration, and
    missing thread id failures.
  - focused validation: `bun run test:protocol`, `bun run typecheck`,
    `bun run lint`, `bun run test:api-snapshots`, `bun run test:styles`,
    `bun run validate:packages`, `bunx vitest run
    test/docs-staleness.test.ts`, and `bun run test:package-resolution`
    passed. `publint` emitted the baseline repository URL suggestions only.
  - commit-unit review: spawned review subagent
    `019e90de-6e05-75a2-9429-b25a931d7f0f` with the `agent-ui-review` skill.
    Findings about missing validation notes and root/subpath export boundary
    drift were addressed by recording validation and making normalizers
    subpath-only at the codex package root. Follow-up review reported no
    findings.
  - handoff: remaining Phase 11 work starts with productized
    `thread/loaded/list`, compact/settings/goal classification-sensitive
    normalization, media payload resource blocks, and any remaining
    `clientUserMessageId` preservation checks.

- 2026-06-04 thread/loaded/list normalizer slice:
  - what remains internal: loaded-thread collection store internals and
    generated `ThreadLoadedListResponse` payloads remain source-level details.
    The helper does not create thread entities from ID-only payloads.
  - what becomes public: `normalizeThreadLoadedListResponse()` on the
    `@nyosegawa/agent-ui-codex/normalizer` subpath only, returning normalized
    collection events, ids, cursor state, and the loaded-thread scope.
  - what host responsibility is intentionally not handled: titles, cwd,
    transcript hydration, active-thread routing, session persistence, and
    loaded-thread process/runtime policy remain host-owned or require explicit
    `thread/read`/`thread/resume` calls.
  - which example proves the design: upcoming scoped thread-list examples in
    Phase 12 can show loaded-thread ids separately from hydrated history
    threads.
  - which tests protect the contract:
    `packages/codex/test/protocol.test.ts` covers ID-only loaded collection
    normalization, cursor preservation, reducer integration, no invented thread
    entities, and invalid id failures, including non-string IDs rejected by the
    stable generated response contract.
  - focused validation: `bun run test:protocol`, `bun run typecheck`,
    `bun run lint`, `bun run test:api-snapshots`, `bun run test:styles`,
    `bun run validate:packages`, `bunx vitest run
    test/docs-staleness.test.ts`, and `bun run test:package-resolution`
    passed. `publint` emitted the baseline repository URL suggestions only.
  - commit-unit review: spawned review subagent
    `019e90eb-5735-70c2-936b-47e00c435131` with the `agent-ui-review` skill.
    Findings about missing validation notes and numeric loaded-thread ID
    coercion were addressed in this slice. Follow-up review reported no
    findings.
  - handoff: remaining Phase 11 work starts with compact/settings/goal
    classification-sensitive normalization, media payload resource blocks, and
    remaining `clientUserMessageId` preservation checks.

- 2026-06-04 compact/settings/goal classification slice:
  - what remains internal: no core compact, settings, or goal lifecycle state is
    introduced from these notifications; raw notification payloads remain
    diagnostic-only.
  - what becomes public: no new public API; existing protocol capability docs
    now state that compacted, goal, and settings notifications are kept as raw
    developer/audit diagnostics unless a host-owned controller contract is
    designed.
  - what host responsibility is intentionally not handled: goal persistence,
    budget state, settings policy, cwd/model/sandbox mutation, and compact
    workflow routing remain host-managed or item-level protocol concerns.
  - which example proves the design: no example change in this slice; the
    protocol reference and protocol tests prove the contract until Phase 12
    recipes add host-owned diagnostics examples.
  - which tests protect the contract:
    `packages/codex/test/protocol.test.ts` covers `thread/compacted`,
    `thread/goal/updated`, `thread/goal/cleared`, and
    `thread/settings/updated` as raw developer/audit diagnostics that do not
    create thread entities.
  - focused validation: `bun run test:protocol`, `bun run typecheck`,
    `bun run lint`, `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, and `bun run test:styles` passed. API
    snapshots/styles were unchanged checks for repository policy; package
    validation was not required for this slice because no public API, package
    export, CSS, or dist/source package surface changed.
  - commit-unit review: spawned review subagent
    `019e90f5-9f04-70e0-b9f6-7830f712f70d` with the `agent-ui-review` skill.
    Findings about validation record detail and example proof wording were
    addressed in this slice. Follow-up review reported no findings.
  - handoff: remaining Phase 11 work starts with media payload resource blocks
    and remaining `clientUserMessageId` preservation checks.

- 2026-06-04 media resource block and client-message preservation slice:
  - what remains internal: media resource extraction from raw item payloads,
    failed media retry state, local path display fallback details, and
    optimistic duplicate-prevention bookkeeping remain implementation details.
  - what becomes public: core `AgentItemBlock.resource` metadata plus
    `AgentItemBlockResource` and `AgentItemBlockResourceKind` expose
    protocol-neutral media metadata on item blocks. React continues to expose
    host-side resource resolver primitives for browser rendering.
  - what host responsibility is intentionally not handled: upload admission,
    local path authorization, static asset serving, tenant isolation, cleanup,
    persistence, and path-to-URL policy remain host-owned. Core does not turn a
    raw local path into a browser URL.
  - which example proves the design:
    `examples/local-react-vite/e2e/resource-resolution.e2e.ts` proves
    host-resolved transcript media on desktop and mobile; Phase 12 examples can
    reuse the same resource metadata boundary for recipe docs.
  - which tests protect the contract:
    `packages/core/test/reducer.test.ts` covers local media item blocks with
    resource metadata, `packages/react/test/components.vitest.tsx` covers
    resolver-free browser-safe media URLs and local media fallback behavior,
    `packages/codex/test/protocol.test.ts` continues to cover
    `clientUserMessageId`-safe protocol normalization paths and raw diagnostic
    classification, and API snapshots protect the public core type addition.
  - focused validation: `bun test packages/core/test/reducer.test.ts`,
    `bun --filter @nyosegawa/agent-ui-react test components.vitest.tsx`,
    `bun run test:protocol`, `bun run typecheck`, `bun run lint`,
    `bun run test:api-snapshots`, `bun run test:styles`,
    `bun run validate:packages`, `bun run test:package-resolution`,
    `bunx vitest run test/docs-staleness.test.ts`, and `bunx playwright test
    --config playwright.fixtures.config.ts
    examples/local-react-vite/e2e/resource-resolution.e2e.ts` passed.
    `publint` emitted the baseline repository URL suggestions only. The direct
    `playwright` binary was not on PATH, so the browser-visible check was run
    through `bunx playwright`.
  - commit-unit review: spawned review subagent
    `019e9101-75ee-7131-aca2-7b770d4afa9a` with the `agent-ui-review` skill.
    Findings about missing package-resolution validation notes,
    `block.text` being treated as a local-media resolver input, and `http:`
    direct media URLs were addressed in this slice. Follow-up review reported
    no findings.
  - handoff: remaining Phase 11 work starts with verifying whether the broader
    lifecycle normalization items above can be marked complete, then moving to
    Phase 12 examples if no gaps remain.

- 2026-06-04 thread lifecycle completion audit slice:
  - what remains internal: reducer preview-downgrade protection, availability
    derivation, lifecycle collection internals, and generated notification
    payload shapes remain source-level details.
  - what becomes public: no new public API; the existing protocol docs now
    state that archive lifecycle is status-only in core and that no default
    React close action is exposed without a productized upstream client method.
  - what host responsibility is intentionally not handled: archive policy,
    stored-session persistence, tenant/workspace filtering, routing, and any
    close/unsubscribe workflow remain host-owned or upstream protocol concerns.
  - which example proves the design: no example change in this audit slice;
    Phase 12 scoped history examples should consume the already-normalized
    archive/unarchive lifecycle and collection state.
  - which tests protect the contract:
    `packages/codex/test/protocol.test.ts` covers productized lifecycle
    notifications, including `thread/archived`, `thread/unarchived`, and
    `thread/closed`; `packages/core/test/reducer.test.ts` covers
    archived-to-available unarchive behavior and closed availability.
  - focused validation: `bun run test:protocol`, `bun test
    packages/core/test/reducer.test.ts`, `bun run typecheck`, `bun run lint`,
    `bun run test:api-snapshots`, `bun run test:styles`,
    `bun run validate:packages`, `bun run test:package-resolution`, and
    `bunx vitest run test/docs-staleness.test.ts` passed. `publint` emitted
    the baseline repository URL suggestions only. An initial parallel run of
    `validate:packages` and `test:package-resolution` failed because their
    Next builds contended for the same build lock; both passed when rerun
    sequentially.
  - commit-unit review: spawned review subagent
    `019e910c-807f-76d1-a453-a414080df1bb` with the `agent-ui-review` skill.
    Findings about non-archived `thread/list` snapshots not clearing archived
    state and incomplete docs validation notes were addressed in this slice.
    Follow-up review reported no findings.
  - handoff: Phase 11 implementation checkboxes are complete; next work should
    run the review/follow-up validation for this audit slice, then start Phase
    12 examples from the first unchecked item.

## Phase 12: Example Updates

- [x] Update `examples/codex-local-web`.
  - [x] Use vNext bridge policy.
  - [x] Use local media helper upload and static handlers.
  - [x] Return structured resolved attachments.
  - [x] Resolve transcript local media URLs.
  - [x] Use atomic first message API.
  - [x] Demonstrate diagnostics/health.
  - [x] Add e2e for local image transcript visibility.
  - [x] Add e2e for first message immediate reflection.
- [x] Update `examples/local-react-vite`.
  - [x] Add optimistic first message fixture.
  - [x] Add local media fallback fixture.
  - [x] Add custom components map fixture.
  - [x] Add density mode fixture.
  - [x] Add mobile empty state fixture.
  - [x] Update visual tests.
- [x] Update `examples/recipes`.
  - [x] Add `headless-chat-controller`.
  - [x] Add `scoped-thread-list`.
  - [x] Add `host-owned-composer`.
  - [x] Add `local-media-helper`.
  - [x] Add `custom-transcript-blocks`.
  - [x] Add `bridge-policy`.
  - [x] Add `diagnostics-panel`.
  - [x] Add `migration-vnext`.
- [x] Update `examples/next-with-bridge-sidecar`.
  - [x] Use vNext bridge policy.
  - [x] Document full-chat WebSocket boundary.
  - [x] Add local media helper utilities where applicable.
- [x] Update `examples/next-rpc-route`.
  - [x] Keep read/list/status-only scope.
  - [x] Document that it cannot power `AgentChat`.
- [x] Update all example docs under `docs/examples`.

### Phase 12 Notes

- 2026-06-04 codex-local-web bridge policy and diagnostics slice:
  - example type: Real Local Codex Web.
  - changed routes: `examples/codex-local-web` root app and same-origin
    `/agent-ui/ws` bridge behavior; no new browser route was added.
  - what remains internal: bridge health event storage, dynamic-tool policy,
    server-request policy resolution, auth/admission implementation beyond
    loopback, process lifecycle details, and diagnostics formatting remain
    implementation or host-owned details.
  - what becomes public: no new package API; the example now explicitly shows
    `bridgePolicy.admission: { mode: "local-loopback" }`,
    `browserMethodPolicy: "productized"`, server-side bridge health phase
    logging, and the React diagnostics rail.
  - what host responsibility is intentionally not handled: hosted-service auth,
    session admission, tenant isolation, persistence, audit sinks, dynamic tool
    authorization, and deployment policy remain host-owned.
  - which example proves the design: `examples/codex-local-web` with
    `examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts` proving
    the diagnostics rail is present and first user messages render immediately,
    and `examples/codex-local-web/e2e/real-local-attachments.e2e.ts` proving
    local image transcript URLs are resolved through the same-origin static
    asset route instead of raw local paths.
  - which tests protect the contract:
    `examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts`,
    `examples/codex-local-web/e2e/real-local-attachments.e2e.ts`,
    `packages/server/test/websocket.test.ts` bridge-health event tests,
    `examples/codex-local-web` typecheck/build, and docs staleness tests.
  - focused validation: `bun --filter
    @nyosegawa/agent-ui-example-codex-local-web typecheck`, `bun --filter
    @nyosegawa/agent-ui-example-codex-local-web build`, `bunx playwright test
    --config playwright.real-local.config.ts
    examples/codex-local-web/e2e/real-local-thread-lifecycle.e2e.ts`,
    `bunx playwright test --config playwright.real-local.config.ts
    examples/codex-local-web/e2e/real-local-attachments.e2e.ts`, and `bunx
    vitest run test/docs-staleness.test.ts` passed. The build emitted the
    existing Vite chunk-size warning.
  - commit-unit review: spawned review subagent
    `019e9115-3db9-7e01-94db-496b2c49179e` with the `agent-ui-review` skill.
    Findings about overclaiming health-hook e2e coverage and stale local media
    TODO progress were addressed in this slice.

- 2026-06-04 local-react-vite fixture audit slice:
  - example type: Local React Vite fixture gallery and primitive routes.
  - changed routes: `/fixture-gallery`, `/composer-retry`,
    `/resource-resolution`, `/transcript-density`, and
    `/scoped-thread-lists`; no hosted bridge route was added.
  - what remains internal: fixture CSS class names, close-up composition
    helpers, fake transport request handlers, screenshot ownership, and
    transcript renderer implementation details remain example/test internals.
  - what becomes public: no new package API; the example documents public
    primitive usage through the composer controller retry route, structured
    local media resource resolution route, density options route, scoped thread
    list route, custom transcript block close-up, and mobile empty-state
    close-up.
  - what host responsibility is intentionally not handled: real Codex process
    lifecycle, bridge admission, auth, persistence, tenant isolation,
    screenshot publishing, and deployment policy remain outside the fixture
    example and Agent UI core.
  - which example proves the design: `examples/local-react-vite` proves the
    deterministic fixture surfaces through the routes above and the direct
    component close-up gallery.
  - which tests protect the contract:
    `examples/local-react-vite/e2e/composer-retry.e2e.ts`,
    `examples/local-react-vite/e2e/resource-resolution.e2e.ts`,
    `examples/local-react-vite/e2e/transcript-density.e2e.ts`,
    `examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts`, and
    `examples/local-react-vite/e2e/visual-closeups.e2e.ts`.
  - focused validation: `bun run --cwd examples/local-react-vite typecheck`,
    `bun run --cwd examples/local-react-vite build`, and `bunx playwright test
    --config playwright.fixtures.config.ts
    examples/local-react-vite/e2e/composer-retry.e2e.ts
    examples/local-react-vite/e2e/resource-resolution.e2e.ts
    examples/local-react-vite/e2e/transcript-density.e2e.ts
    examples/local-react-vite/e2e/scoped-thread-lists.e2e.ts
    examples/local-react-vite/e2e/visual-closeups.e2e.ts` passed. The build
    emitted the existing Vite chunk-size warning.
  - commit-unit review: spawned review subagent
    `019e911d-a9b5-7a83-8a59-42b7eb75fc08` with the `agent-ui-review` skill.
    The review found that `docs/examples/local-react-vite.md` incorrectly
    placed the custom transcript renderer in the critical-state section; the
    docs now distinguish critical states from component close-ups.

- 2026-06-04 recipes expansion slice:
  - example type: Typed host integration recipes.
  - changed routes: none; recipes are typed source examples under
    `examples/recipes/src`.
  - what remains internal: reusable hook internals, reducer details, bridge
    admission resolution, upload storage implementation, diagnostics filtering,
    transcript renderer internals, and package export policy remain outside
    recipes.
  - what becomes public: no new package API; recipes demonstrate existing
    public controllers, `AgentThreadView`, `AgentMessageList`,
    `AgentComposerPanel`, `AgentChat` components map, local media helper,
    explicit bridge policy, diagnostics panel, and vNext migration checklist.
  - what host responsibility is intentionally not handled: auth, tenant
    isolation, persistence, workspace and upload authorization, audit sinks,
    billing, Codex process lifecycle, and deployment policy remain host-owned.
  - which example proves the design: `examples/recipes` now contains the eight
    Phase 12 recipe files and README/docs entries describing their boundary.
  - which tests protect the contract: `examples/recipes` typecheck/build and
    docs staleness tests protect typed public API usage and documentation
    coverage.
  - focused validation: `bun run --cwd examples/recipes typecheck` and
    `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e9124-62e6-7d51-8987-a0bab55da1ac` with the `agent-ui-review` skill.
    Findings about separate composer controllers, unscoped thread list
    rendering, and sending without an active thread were fixed; follow-up
    review reported no findings.

- 2026-06-04 next-with-bridge-sidecar policy/media slice:
  - example type: Next.js full-chat WebSocket sidecar.
  - changed routes: same-origin `/agent-ui/ws`, `POST /agent-ui/upload`, and
    `/agent-ui/assets/<id>` sidecar routes; no Next Route Handler full-chat
    path was added.
  - what remains internal: bridge process lifecycle, admission resolution,
    health event storage, local upload storage, transcript renderer internals,
    and package export policy remain implementation details.
  - what becomes public: no new package API; the example now explicitly shows
    `bridgePolicy.admission: { mode: "local-loopback" }`,
    `browserMethodPolicy: "productized"`, host-side bridge health logging,
    upload/static helper wiring, structured attachment resolution, and
    transcript local media URL resolution.
  - what host responsibility is intentionally not handled: hosted-service auth,
    tenant isolation, persistence, upload authorization, process isolation,
    audit sinks, billing, and deployment policy remain host-owned.
  - which example proves the design: `examples/next-with-bridge-sidecar`
    demonstrates the full-chat WebSocket sidecar boundary and same-origin local
    media flow.
  - which tests protect the contract: `examples/next-with-bridge-sidecar`
    typecheck/build and docs staleness tests protect typed public API usage and
    documentation coverage.
  - focused validation: `bun run --cwd examples/next-with-bridge-sidecar
    typecheck`, `bun run --cwd examples/next-with-bridge-sidecar build`, and
    `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e9125-ee2d-7223-bc2d-5ce368cb002d` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 next-rpc-route boundary audit slice:
  - example type: Next.js one-shot RPC Route Handler.
  - changed routes: existing `POST /api/agent-ui`; no WebSocket route or
    `AgentChat` browser surface was added.
  - what remains internal: App Server process startup details, bridge
    lifecycle, streaming notifications, server-request forwarding, approval
    response handling, and method policy implementation remain server internals.
  - what becomes public: no new package API; the example keeps
    `createAgentUiNextRpcRoute()` narrowed to `account/read` and `model/list`
    and documents it as one HTTP request for one allowlisted method.
  - what host responsibility is intentionally not handled: route
    authentication, tenant isolation, persistence, hosted deployment policy,
    and any host-admin `allowedMethods: "all"` use remain host-owned.
  - which example proves the design: `examples/next-rpc-route` demonstrates
    the narrow one-shot route and explicitly points full chat to the WebSocket
    sidecar examples.
  - which tests protect the contract: `examples/next-rpc-route`
    typecheck/build, server one-shot RPC policy tests from earlier phases, and
    docs staleness tests protect the route boundary.
  - focused validation: `bun run --cwd examples/next-rpc-route typecheck`,
    `bun run --cwd examples/next-rpc-route build`, and `bunx vitest run
    test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e912a-b4ad-75b1-b742-0ac4f3c27a70` with the `agent-ui-review` skill.
    The review found that `docs/examples/next-rpc-route.md` under-documented
    the `AgentChat` limitation; the docs now explicitly exclude `AgentChat`,
    streaming turns, notifications, approvals, browser responses, attachments,
    and full chat.

- 2026-06-04 docs/examples coverage audit slice:
  - example type: documentation coverage for all example packages.
  - changed routes: none.
  - what remains internal: example-local CSS selectors, fake transports,
    fixture internals, bridge process lifecycle, upload storage details, and
    validation ownership remain implementation details.
  - what becomes public: no new package API; docs now cover the Phase 12
    example surfaces across `codex-local-web`, `local-react-vite`,
    `recipes`, `next-with-bridge-sidecar`, and `next-rpc-route`, while
    `docs-site` remains documented as a small executable package overview and
    style smoke surface.
  - what host responsibility is intentionally not handled: auth, tenant
    isolation, persistence, upload authorization, audit sinks, process
    lifecycle, billing, and deployment policy remain host-owned wherever docs
    describe bridges, uploads, diagnostics, or one-shot RPC.
  - which example proves the design: `docs/examples/*.md` maps each example to
    its intended route/package boundary and points full chat to WebSocket
    bridge examples rather than one-shot RPC.
  - which tests protect the contract: docs staleness tests and the focused
    example validations recorded above protect the docs coverage.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed
    after the docs/examples audit.
  - commit-unit review: spawned review subagent
    `019e912d-d057-7840-a14d-66fabf9d185c` with the `agent-ui-review` skill.
    Review reported no findings.
  - handoff: Phase 12 is complete. Final Phase 12 validation passed with
    `bun run test:protocol`, `bun run test:api-snapshots`, `bun run
    test:styles`, `bun run typecheck`, `bun run lint`, `bun run
    validate:packages`, `bun run test:package-resolution`, and `bunx vitest run
    test/docs-staleness.test.ts`. `validate:packages` emitted only the
    existing `publint` repository URL suggestions. `git diff --check` passed,
    and no diffs were present under `third_party/codex`,
    `packages/codex/src/generated`, package `dist`, or example build output.
    Next work starts Phase 13 documentation updates from the first unchecked
    item.

## Phase 13: Documentation Updates

- [x] Update `docs/README.md`.
- [x] Update `docs/architecture/overview.md`.
- [x] Update `docs/architecture/product-boundary.md`.
- [x] Update `docs/architecture/security.md`.
- [x] Update `docs/architecture/testing.md`.
- [x] Update `docs/reference/package-exports.md`.
- [x] Replace or update `docs/reference/hooks.md` with controllers reference.
- [x] Update `docs/reference/react-components.md`.
- [x] Update `docs/reference/server-bridge.md`.
- [x] Update `docs/reference/codex-protocol.md`.
- [x] Update `docs/guides/react.md`.
- [x] Update `docs/guides/attachments.md` into local resource guidance.
- [x] Update `docs/guides/approvals.md`.
- [x] Add or update diagnostics guide.
- [x] Update `docs/guides/nextjs.md`.
- [x] Update `docs/guides/remote-deployment.md`.
- [x] Update `docs/guides/theming.md` if component layering changes styling
  guidance.
- [x] Update `docs/maintenance/ci-cd.md` if validation gates change.
- [x] Update `docs/maintenance/release-checklist.md`.
- [x] Create `docs/migrations/<version>-host-consumers.md`.
- [x] Migration guide includes:
  - [x] who must migrate
  - [x] package-by-package breaking changes
  - [x] before/after import examples
  - [x] before/after React examples
  - [x] before/after server bridge examples
  - [x] local media helper migration
  - [x] first message optimistic migration
  - [x] validation checklist
  - [x] non-promises and host-owned boundaries
- [x] Update package READMEs.
- [x] Update changelogs or changesets as appropriate.
- [x] Ensure every new public API is documented exactly once as canonical.

### Phase 13 Notes

- 2026-06-04 docs README index slice:
  - documentation type: repository docs index.
  - changed routes: none.
  - what remains internal: final export-map freeze, generated schema details,
    dist output, reducer internals, bridge process lifecycle, diagnostics
    storage, and example-local implementation details remain outside the docs
    index.
  - what becomes public: no new package API; `docs/README.md` now points
    readers to `docs/architecture/vnext-design-gates.md` alongside
    `docs/reference/package-exports.md`, and describes React, attachments,
    resources, and controllers as vNext documentation entry points.
  - what host responsibility is intentionally not handled: auth, tenant
    isolation, persistence, upload authorization, audit sinks, process
    lifecycle, billing, and deployment policy remain documented as host-owned
    rather than index-level Agent UI responsibilities.
  - which example proves the design: Phase 12 example docs remain the proof
    surface; the docs index only routes readers to those examples and canonical
    references.
  - which tests protect the contract: docs staleness tests protect local links,
    stale wording, public Markdown punctuation, and docs-site wording.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e9135-2727-7d80-b167-bc3bd91f3196` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 architecture overview controller/resource slice:
  - documentation type: architecture overview.
  - changed routes: none.
  - what remains internal: source-level draft controllers, reducer/store
    internals, collection request sequencing, bridge process lifecycle,
    diagnostics storage, local media temp layout, static byte serving, generated
    schema, dist output, and export-map freeze remain internal or later gates.
  - what becomes public: no new package API; the overview now describes public
    controller composition, structured resource resolution, explicit bridge
    policy, host events/diagnostics, and the requirement that exports are
    frozen only after examples, tests, docs, API snapshots, and package
    resolution agree.
  - what host responsibility is intentionally not handled: authentication,
    non-loopback admission, tenant/workspace isolation, upload authorization,
    static route authorization, persistence, audit sinks, process isolation,
    billing, and deployment topology remain host-owned.
  - which example proves the design: Phase 12 examples prove the design through
    `examples/codex-local-web`, `examples/local-react-vite`,
    `examples/next-with-bridge-sidecar`, and `examples/recipes`.
  - which tests protect the contract: docs staleness tests protect the
    documentation links and stale references; focused example validations from
    Phase 12 protect the referenced behavior.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e9138-14db-7362-9d18-48df0bca210d` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 product boundary vNext ownership slice:
  - documentation type: product boundary.
  - changed routes: none.
  - what remains internal: raw reducer state, internal CSS selectors,
    source-level draft controllers, generated schema details, bridge process
    lifecycle internals, local media temp storage internals, diagnostics
    storage, and export-map freeze remain outside the product-boundary public
    claim.
  - what becomes public: no new package API; the boundary now names public
    React controllers/replacement maps, structured browser resource metadata,
    redaction helpers, and diagnostic audience classification as Agent UI
    library responsibilities.
  - what host responsibility is intentionally not handled: host runtime,
    hosted service operation, auth, tenant/workspace isolation, persistence,
    upload/static authorization, bridge admission beyond loopback defaults,
    audit sinks, diagnostic retention, process lifecycle, billing, and
    deployment policy remain host-owned.
  - which example proves the design: Phase 12 examples prove the ownership
    split through local media, bridge policy, diagnostics, one-shot RPC, and
    typed recipes.
  - which tests protect the contract: docs staleness tests protect the
    documentation boundary; Phase 12 focused validations protect the referenced
    examples.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e913a-f0d0-7511-8c9c-bc7fd51de54f` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 security bridge/media boundary slice:
  - documentation type: security architecture.
  - changed routes: none.
  - what remains internal: bridge process lifecycle, method-policy
    implementation details, local media temp layout, registered asset lookup,
    diagnostic storage, redaction implementation internals, generated schema,
    and dist output remain internal.
  - what becomes public: no new package API; security docs now explicitly
    describe `browserMethodPolicy`, one-shot RPC limits, `AgentChat` full-chat
    boundaries, and local media upload/static asset security responsibilities.
  - what host responsibility is intentionally not handled: non-loopback auth,
    bridge admission beyond loopback defaults, host-only method authorization,
    static asset authorization, upload persistence/cleanup policy, tenant and
    workspace mapping, audit logs, process isolation, billing, and deployment
    policy remain host-owned.
  - which example proves the design: `examples/codex-local-web`,
    `examples/next-with-bridge-sidecar`, and `examples/next-rpc-route` prove
    the bridge, media, and one-shot boundaries.
  - which tests protect the contract: docs staleness tests protect the
    documentation boundary; server bridge/upload tests and Phase 12 example
    validations protect the referenced behavior.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e913d-a33c-7920-aac6-2bb74b7de03b` with the `agent-ui-review` skill.
    The review found that `browserMethodPolicy` was described too broadly; the
    docs now separate browser-callable methods from notifications, server
    requests/responses, usage events, and dynamic-tool policy. Follow-up review
    reported no findings.

- 2026-06-04 testing matrix example gates slice:
  - documentation type: validation matrix.
  - changed routes: none.
  - what remains internal: CI implementation details, Playwright helper
    internals, fixture fake transport internals, package build output, generated
    schema, and release workflow execution remain outside the testing matrix
    public contract.
  - what becomes public: no new package API; testing docs now list focused
    example validation gates for recipes, Next one-shot RPC, Next sidecar,
    real-local Codex web, and local-react-vite fixture routes, including the
    Phase 12 e2e specs.
  - what host responsibility is intentionally not handled: host CI policy,
    external deployment checks, auth, tenant isolation, persistence, audit
    retention, billing, and release approval policy remain host/release-owner
    responsibilities.
  - which example proves the design: `examples/local-react-vite` and
    `examples/codex-local-web` e2e specs prove browser-visible behavior;
    `examples/recipes`, `examples/next-rpc-route`, and
    `examples/next-with-bridge-sidecar` typecheck/build gates prove typed
    example integrations.
  - which tests protect the contract: docs staleness tests protect the
    documentation matrix; focused example validations named in the doc protect
    the referenced behavior.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e9142-9ef9-7592-b5bd-c2f8e9113c06` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 package exports freeze-policy slice:
  - documentation type: package export reference.
  - changed routes: none.
  - what remains internal: source-level draft modules, reducer
    reconciliation, optimistic operation maps, local media temp-file lookup,
    bridge process lifecycle internals, generated Codex schema files, bundled
    declaration chunks, private CSS chunks, and `.aui-*` selectors remain
    outside the public export contract.
  - what becomes public: no new package API; package exports now document the
    vNext freeze requirements for promoted exports: intentional export map or
    package barrel, canonical docs, importing examples, and focused
    test/snapshot/package-resolution protection.
  - what host responsibility is intentionally not handled: non-loopback bridge
    admission, hosted auth, persistence, tenant/workspace isolation, audit
    sinks, upload/static authorization, process supervision, billing, and
    deployment policy remain host-owned.
  - which example proves the design: package-name imports in Phase 12 examples
    and recipes prove promoted surfaces; source-level helpers stay repo-local
    until a later design gate promotes them.
  - which tests protect the contract: `bun run test:api-snapshots`,
    `bun run test:package-resolution`, `bun run validate:packages`, runtime
    export policy tests, and docs staleness tests protect the package
    boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, and `bun run test:package-resolution`
    passed. After review fix, `bunx vitest run test/docs-staleness.test.ts`
    and `bun run test:api-snapshots` passed again.
  - commit-unit review: spawned review subagent
    `019e9147-dd56-7e71-b9b4-b750be5e5869` with the `agent-ui-review` skill.
    The review found that the server inventory incorrectly described
    `createAgentUiLocalUploadHandler()` as replaced by
    `createAgentUiLocalMediaHelper()`; package exports now keep the upload-only
    handler public and describe the media helper as the broader local-media
    surface. Follow-up review subagent
    `019e914c-7271-7462-a2ad-70fc928df97d` reported no findings.

- 2026-06-04 hooks controller boundary slice:
  - documentation type: React hooks/controller reference.
  - changed routes: none.
  - what remains internal: source-level controllers exposing reducer
    reconciliation, optimistic operation maps, queued attachment restore
    internals, collection request sequencing, raw generated protocol payloads,
    and first-message start helper internals remain outside the package API.
  - what becomes public: no new package API; `docs/reference/hooks.md` now
    defines exported raw-free hooks as the public controller layer and points
    hosts to public thread/composer controller actions.
  - what host responsibility is intentionally not handled: tenant/workspace
    mapping, project authorization, persistence, routing policy, and any
    meaning attached to view-state scope keys remain host-owned.
  - which example proves the design: `examples/recipes/src/headless-hooks.tsx`
    and the Phase 12 local React fixture routes prove controller composition
    through package-root hooks.
  - which tests protect the contract: docs staleness tests protect the
    reference; React component/e2e and API snapshot/package-resolution gates
    protect the public hook exports when the package surface changes.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: spawned review subagent
    `019e914b-60e3-75c1-b496-5a37addb24b5` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 react components replacement-map slice:
  - documentation type: React component reference.
  - changed routes: none.
  - what remains internal: old slot-oriented replacement shapes, internal
    component state, CSS implementation selectors, attachment mutation objects,
    transcript window bookkeeping, and generated protocol payloads remain
    outside the React public component contract. `components.Item` still
    exposes legacy core `AgentItemState` / `TurnState` with `raw?: unknown`
    fields in this draft; moving item replacement to raw-free transcript
    view-model props remains a later API stabilization task.
  - what becomes public: no new package API; `docs/reference/react-components.md`
    now documents `AgentChatProps.components`, `AgentComponents`, and
    `defaultAgentComponents` as the preset customization API.
  - what host responsibility is intentionally not handled: product shell,
    navigation model, auth gate, persistent panel state, tenant/workspace
    mapping, custom registries, and deployment policy remain host-owned.
  - which example proves the design: Phase 12 `examples/local-react-vite`
    fixture routes and recipe examples prove package-root component
    composition and replacement-map usage.
  - which tests protect the contract: docs staleness tests protect the
    reference; React component tests, source-structure tests, API snapshots, and
    package-resolution tests protect the component exports and replacement map
    when package surface changes.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bunx vitest run packages/react/test/source-structure.vitest.ts` passed
    before and after the review fix.
  - commit-unit review: spawned review subagent
    `019e9150-b25a-75a0-9a32-e06b48e71589` with the `agent-ui-review` skill.
    The review found that docs overstated `components.Item` as raw-free; docs
    now acknowledge its legacy `AgentItemState` / `TurnState` exposure and keep
    raw-free item replacement as a later API stabilization task. Follow-up
    review subagent `019e9156-5435-7812-b2a4-217aedf6ec3f` reported no
    findings.

- 2026-06-04 server bridge host-policy slice:
  - documentation type: server bridge reference.
  - changed routes: none.
  - what remains internal: bridge process lifecycle internals, transport event
    redaction implementation, dynamic-tool helper-thread internals, local media
    asset registry internals, generated schema, and package dist output remain
    internal.
  - what becomes public: no new package API; `docs/reference/server-bridge.md`
    now states that server bridge, local media, one-shot RPC, server-request
    policy, dynamic-tool mapping, host-event, and redaction helpers are public
    integration surfaces for a host-owned server process.
  - what host responsibility is intentionally not handled: authentication,
    non-loopback bridge admission, process supervision, persistence,
    tenant/workspace isolation, upload/static authorization, audit retention,
    billing, and deployment topology remain host-owned.
  - which example proves the design: `examples/next-with-bridge-sidecar`,
    `examples/codex-local-web`, and `examples/next-rpc-route` prove full-chat,
    local-media, and one-shot boundaries.
  - which tests protect the contract: server WebSocket/upload/next/express
    tests, API snapshots, package-resolution tests, and docs staleness tests
    protect the server bridge contract when implementation or exports change.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bunx vitest run packages/server/test/websocket.test.ts packages/server/test/upload.test.ts packages/server/test/next.test.ts packages/server/test/express.test.ts`
    passed.
  - commit-unit review: spawned review subagent
    `019e9152-025d-76e0-a35c-a6af2cd4fa23` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 codex protocol classification-gate slice:
  - documentation type: Codex protocol reference.
  - changed routes: none.
  - what remains internal: generated schema files, generated experimental-only
    fields, test-only methods, raw unsupported notifications, reducer
    lifecycle derivation internals, and bridge method policy implementation
    details remain internal or host-managed.
  - what becomes public: no new package API; `docs/reference/codex-protocol.md`
    now states that `packages/codex/src/protocol.ts` classification lists are
    the source of truth before promoting core lifecycle state or React-visible
    behavior.
  - what host responsibility is intentionally not handled: host-managed stable
    methods, experimental opt-in policy, raw protocol escape hatches,
    dynamic-tool execution policy, permissions policy, tenant/workspace
    authorization, and deployment policy remain host-owned.
  - which example proves the design: Phase 12 examples use productized thread,
    turn, history, resource, and server-request behavior instead of
    unsupported `thread/turns/items/list` or raw experimental fields.
  - which tests protect the contract: `bun run test:protocol`, Codex
    session/type tests, API snapshots, and docs staleness tests protect the
    classification and public protocol surface.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bun run test:protocol` passed before and after the review fix.
  - commit-unit review: spawned review subagent
    `019e9158-3053-7c21-8c91-cbb1791a3cad` with the `agent-ui-review` skill.
    The review found that `rawResponseItem/completed` was incorrectly listed as
    productized lifecycle behavior; docs now keep it as stable-generated raw
    developer/audit diagnostics until a normalizer maps it to productized core
    state. Follow-up review subagent
    `019e915c-6e36-7fc1-ae53-f1a022ee5582` reported no findings.

- 2026-06-04 React guide preset/customization slice:
  - documentation type: React guide.
  - changed routes: none.
  - what remains internal: private slots, source imports, internal component
    state, raw-free item replacement design, panel persistence, app registries,
    navigation policy, auth, tenant/workspace mapping, and hosted-service
    deployment remain outside Agent UI core.
  - what becomes public: no new package API; `docs/guides/react.md` now points
    hosts to `components`, preferred replacement points, public props/hooks,
    transcript controllers, and host-provided transports/resolvers/theme/locale
    state.
  - what host responsibility is intentionally not handled: panel state,
    product navigation/routing policy, authentication, tenant/workspace
    mapping, app registry ownership, and hosted chat deployment stay
    host-owned.
  - which example proves the design: `examples/recipes/src/custom-components.tsx`,
    `examples/recipes/src/custom-transcript-blocks.tsx`, and Phase 12 local
    React fixture routes prove preset customization and primitive composition.
  - which tests protect the contract: docs staleness tests and React
    source-structure tests protect the guide's replacement-map guidance.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bunx vitest run packages/react/test/source-structure.vitest.ts` passed.
  - commit-unit review: spawned review subagent
    `019e915c-e4ca-7de2-ac41-16d94b1a1ac6` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 attachments local-resource slice:
  - documentation type: attachment/local resource guide.
  - changed routes: none.
  - what remains internal: composer attachment mutation objects, queued
    attachment restore internals, local media asset registry internals,
    temp-file layout, generated protocol payloads, and package dist output
    remain internal.
  - what becomes public: no new package API; `docs/guides/attachments.md` now
    states that Agent UI owns browser UI state, structured resource metadata,
    and explicit Codex input plumbing for attachments.
  - what host responsibility is intentionally not handled: upload routes,
    static asset routes, admission/auth, persistence, cleanup, tenant/workspace
    scoping, and filesystem paths read by Codex App Server remain host-owned.
  - which example proves the design: `examples/codex-local-web`,
    `examples/next-with-bridge-sidecar`, and
    `examples/recipes/src/local-media-helper.tsx` prove host upload/static
    resource wiring.
  - which tests protect the contract: server upload tests, React component
    attachment/local-media tests, real-local attachment e2e, and docs staleness
    tests protect the resource boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bunx vitest run packages/server/test/upload.test.ts packages/react/test/resources.vitest.ts`
    passed.
  - commit-unit review: spawned review subagent
    `019e9160-4f9f-7cd0-a7d0-daaf88dbe7aa` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 approvals server-request boundary slice:
  - documentation type: approvals guide.
  - changed routes: none.
  - what remains internal: approval anchor placement internals, server-request
    queue reconciliation, dynamic-tool bridge internals, policy callback
    implementation details, generated protocol payloads, and audit storage
    remain internal or host-owned.
  - what becomes public: no new package API; `docs/guides/approvals.md` now
    separates approval-only decisions from broad server requests and points
    hosts to neutral `useAgentServerRequests().respond()` / `.reject()`.
  - what host responsibility is intentionally not handled: permission grants,
    MCP elicitation payloads, user-input forms, dynamic-tool authorization,
    audit logging, workspace policy, and tenant policy remain host-owned.
  - which example proves the design: Phase 12 local React fixture approvals and
    server bridge examples prove approval-only UI plus host-managed broad
    server requests.
  - which tests protect the contract: React approval/server-request tests,
    server WebSocket server-request policy tests, and docs staleness tests
    protect the boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bunx vitest run packages/react/test/components.vitest.tsx -t "approval|server request|server requests"`,
    and `bunx vitest run packages/server/test/websocket.test.ts -t "server request|permission|MCP approvals|dynamic"`
    passed.
  - commit-unit review: spawned review subagent
    `019e9161-d60e-7653-81e1-a1178c17328b` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 diagnostics audience guide slice:
  - documentation type: diagnostics guide.
  - changed routes: none.
  - what remains internal: raw transport events, bridge redaction
    implementation details, diagnostic retention internals, host event sink
    storage, dynamic-tool debug payload internals, generated protocol payloads,
    and audit storage remain internal or host-owned.
  - what becomes public: no new package API; `docs/guides/diagnostics.md`
    documents `AgentDiagnosticAudience`, `useAgentDiagnostics()` audience
    views, visible diagnostics primitives, server redaction helpers, and bridge
    health/debug diagnostic routing.
  - what host responsibility is intentionally not handled: hosted
    observability, authentication, tenant/workspace mapping, persistence,
    retention policy, alerting, incident routing, audit storage, and deployment
    policy remain host-owned.
  - which example proves the design: `examples/codex-local-web` and recipe
    diagnostics composition prove visible diagnostics plus redacted
    developer/audit bridge events.
  - which tests protect the contract: core diagnostic audience tests, React
    diagnostics tests, server redaction/bridge health tests, API snapshots, and
    docs staleness tests protect the diagnostics boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bunx vitest run packages/core/test/reducer.test.ts -t "diagnostics by audience|bounds raw diagnostics"`,
    `bunx vitest run packages/react/test/components.vitest.tsx -t "diagnostics|raw transport events"`,
    and `bunx vitest run packages/server/test/redaction.test.ts packages/server/test/bridge.test.ts packages/server/test/websocket.test.ts -t "redact|bridge health|diagnostic"`
    passed.
  - commit-unit review: spawned review subagent
    `019e9166-f095-7d91-849e-46caaeaa2baf` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 Next.js guide bridge/route-handler slice:
  - documentation type: Next.js guide.
  - changed routes: none.
  - what remains internal: bridge process lifecycle internals, one-shot method
    policy implementation details, upload/static route internals, generated
    protocol payloads, and package dist output remain internal.
  - what becomes public: no new package API; `docs/guides/nextjs.md` now
    documents full-chat WebSocket sidecar and one-shot Route Handler as
    separate helper-backed integration shapes.
  - what host responsibility is intentionally not handled: authentication,
    session routing, process supervision, upload/static authorization,
    persistence, tenant/workspace isolation, cwd/workspace derivation, audit
    logging, deployment policy, and resource policy remain host-owned.
  - which example proves the design: `examples/next-with-bridge-sidecar` proves
    full chat; `examples/next-rpc-route` proves one-shot read-style RPC.
  - which tests protect the contract: Next example typecheck/build gates,
    server next/express tests, package-resolution tests, and docs staleness
    tests protect the documented boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run --cwd examples/next-rpc-route typecheck`, and
    `bun run --cwd examples/next-with-bridge-sidecar typecheck` passed.
  - commit-unit review: spawned review subagent
    `019e9168-5bbd-75d2-9b02-7ffb9e7f57db` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 remote deployment host-owned slice:
  - documentation type: remote deployment guide.
  - changed routes: none.
  - what remains internal: bridge process lifecycle internals, redaction
    implementation details, local media temp layout, generated protocol
    payloads, and package dist output remain internal.
  - what becomes public: no new package API; `docs/guides/remote-deployment.md`
    now states that Agent UI packages provide transports, bridge helpers,
    redaction helpers, resource helpers, and React components rather than a
    hosted Codex service.
  - what host responsibility is intentionally not handled: hosted service
    operation, authentication, persistence, tenant isolation, billing,
    deployment controller, workspace authorization, session scoping, resource
    limits, and audit logging remain host-owned.
  - which example proves the design:
    `examples/recipes/multi-user-deployment.md` and
    `examples/recipes/api-key-remote-deployment.md` prove the host-owned
    remote deployment boundary.
  - which tests protect the contract: docs staleness tests, server bridge
    admission/redaction tests, package-resolution tests, and release validation
    gates protect the remote boundary when implementation changes.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bun run --cwd examples/recipes typecheck` passed.
  - commit-unit review: spawned review subagent
    `019e9168-86db-7153-bfc0-b2c29ceb9795` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 theming component-boundary slice:
  - documentation type: theming guide.
  - changed routes: none.
  - what remains internal: internal `.aui-*` selectors, private style chunks,
    component state, legacy `Item` raw core-state exposure, generated protocol
    payloads, and package dist output remain outside the theming contract.
  - what becomes public: no new package API; `docs/guides/theming.md` now
    points hosts to preferred replacement points and clarifies that `blocks` or
    transcript controllers are the raw-free rendering path.
  - what host responsibility is intentionally not handled: host theme state,
    structural product layout, custom item renderer policy, persistence, and
    deployment policy remain host-owned.
  - which example proves the design: `examples/recipes/src/themed.tsx`,
    `examples/recipes/src/custom-transcript-blocks.tsx`, and local fixture
    close-ups prove token and component replacement behavior.
  - which tests protect the contract: React style tests, source-structure
    tests, docs staleness tests, and package snapshot/resolution gates protect
    the theming boundary when exports or styles change.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bun run test:styles` passed.
  - commit-unit review: spawned review subagent
    `019e916e-2590-7e82-8db9-ea1c4dc2c76d` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 CI/CD focused-validation docs slice:
  - documentation type: maintenance CI/CD guide.
  - changed routes: none.
  - what remains internal: hosted workflow implementation details, artifact
    internals, package build output, generated schema, and release environment
    approval configuration remain internal or maintainer-owned.
  - what becomes public: no new package API; `docs/maintenance/ci-cd.md` now
    says docs touching example gates, exports, protocol classification, bridge
    policy, or browser-visible contracts should run focused local validations
    from the testing matrix even when hosted CI treats the PR as docs-only.
  - what host responsibility is intentionally not handled: host CI policy,
    branch protection configuration, release approval policy, deployment
    policy, and credential handling remain host/maintainer-owned.
  - which example proves the design: focused example gates named in
    `docs/architecture/testing.md` prove docs-to-example validation.
  - which tests protect the contract: docs staleness tests and CI workflow
    policy tests protect links and stale workflow wording.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts` and
    `bunx vitest run test/ci-workflow-policy.test.ts` passed after the
    compatibility workflow wording fix.
  - commit-unit review: review subagent
    `019e916e-48c1-70c3-b3f9-ff398feaaedc` found that Compatibility workflow
    wording overstated path-filter coverage and that CI workflow policy
    validation had not been recorded; the fix is under follow-up review by
    subagent `019e9175-2670-7690-bb2e-c43a806435f9`. Follow-up review
    reported no findings.

- 2026-06-04 release checklist canonical-docs slice:
  - documentation type: release checklist.
  - changed routes: none.
  - what remains internal: npm workflow internals, package dist output,
    generated schema, unpublished package tarballs, and release environment
    approvals remain maintainer-owned.
  - what becomes public: no new package API; release checklist now requires a
    canonical reference doc, importing example/recipe, focused validation note,
    API snapshots, and package export docs alignment before publishing promoted
    public API.
  - what host responsibility is intentionally not handled: npm publishing
    approval, release timing, hosted deployment, auth, persistence, tenant
    isolation, and billing remain maintainer/host-owned.
  - which example proves the design: package-name imports in public examples
    and recipes prove promoted public surfaces.
  - which tests protect the contract: `bun run validate:release`,
    `bun run validate:e2e`, `bun run test:api-snapshots`,
    `bun run test:package-resolution`, and docs staleness tests protect release
    readiness.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, and `bun run test:package-resolution`
    passed.
  - commit-unit review: spawned review subagent
    `019e916e-721a-77e1-ad45-220e31ba73f9` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 migration guide host-consumer slice:
  - documentation type: migration guide.
  - changed routes: none.
  - what remains internal: reducer reconciliation, optimistic operation maps,
    source-level first-message helpers, attachment mutation internals, bridge
    process lifecycle internals, generated schema files, package dist output,
    and raw protocol escape hatches remain internal or host-managed.
  - what becomes public: no new package API; `docs/migrations/vnext-host-consumers.md`
    now documents who must migrate, package-by-package breaking changes,
    before/after imports, React customization, server bridge, local media,
    first-message, validation, and host-owned boundaries.
  - what host responsibility is intentionally not handled: hosted Codex access,
    authentication, tenant isolation, persistence, audit storage, billing,
    deployment policy, dynamic tool execution, upload/static authorization, and
    remote deployment remain host-owned.
  - which example proves the design: `examples/recipes/src/migration-vnext.ts`
    and Phase 12 examples prove the migration checklist.
  - which tests protect the contract: docs staleness tests, recipes typecheck,
    API snapshots, package-resolution tests, and focused example gates protect
    the migration guidance when public surfaces change.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run --cwd examples/recipes typecheck`,
    `bun run test:api-snapshots`, `bun run test:package-resolution`, and
    `bun run validate:packages` passed.
  - focused validation after style-guard fix: `bun run test:styles` and
    `bunx vitest run test/docs-staleness.test.ts` passed after replacing the
    forbidden `dist/styles/*` import example with prose.
  - commit-unit review: spawned review subagent
    `019e9177-6989-7893-8f75-ee1275841cfa` with the `agent-ui-review` skill.
    Initial review found that the migration Before example tripped the public
    stylesheet guard; the follow-up review after the prose fix reported no
    findings.

- 2026-06-04 package README boundary slice:
  - documentation type: package READMEs.
  - changed routes: none.
  - what remains internal: reducer internals, generated schema deep imports,
    private style chunks, source modules, bridge process lifecycle internals,
    hosted service policy, and custom element render internals remain outside
    package README public claims.
  - what becomes public: no new package API; package READMEs now point hosts to
    documented selectors/view models, Codex subpaths, React props/hooks/tokens,
    explicit server policies, and web-component properties.
  - what host responsibility is intentionally not handled: runtime lifecycle,
    auth, persistence, tenant/workspace isolation, upload/static
    authorization, audit storage, billing, deployment policy, and
    app-specific workflows remain host-owned.
  - which example proves the design: package-name imports in public examples
    and recipes prove README package boundaries.
  - which tests protect the contract: docs staleness tests,
    package-resolution tests, API snapshots, and package validation protect
    package README guidance when exports change.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, `bun run test:package-resolution`, and
    `bun run validate:packages` passed.
  - commit-unit review: spawned review subagent
    `019e9177-f408-7481-91b4-616933b557e7` with the `agent-ui-review` skill.
    Review reported no findings for this scoped README boundary slice. The
    reviewer also observed the migration-guide stylesheet guard failure before
    the migration prose fix; local `bun run test:styles` passed after that fix.

- 2026-06-04 changeset decision:
  - documentation type: release metadata decision.
  - changed routes: none.
  - what remains internal: package versions, Changesets version PR generation,
    npm publish approval, and release workflow internals remain maintainer-owned.
  - what becomes public: no new package API; a patch changeset was added for
    `@nyosegawa/agent-ui-core`, `@nyosegawa/agent-ui-codex`,
    `@nyosegawa/agent-ui-react`, `@nyosegawa/agent-ui-server`, and
    `@nyosegawa/agent-ui-web-components` because package README boundary
    guidance affects npm consumers.
  - what host responsibility is intentionally not handled: release timing,
    hosted deployment, auth, persistence, tenant isolation, and billing remain
    host/maintainer-owned.
  - which example proves the design: not applicable for release metadata, but
    package-name imports in public examples prove the documented package
    boundaries.
  - which tests protect the contract: docs staleness, API snapshots, package
    resolution, and package validation confirm the patch changeset remains
    release metadata rather than a package API change.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, `bun run test:package-resolution`, and
    `bun run validate:packages` passed.
  - commit-unit review: review subagent
    `019e917b-e412-77e1-8c4f-3783a62b28a1` found that a changeset is required
    for package README consumer guidance and reported a `validate:packages`
    rerun failure in `test:node-compat`; a patch changeset was added in
    `.changeset/vnext-package-readme-boundaries.md`, then local
    `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, `bun run test:package-resolution`, and
    `bun run validate:packages` passed. Follow-up review reported no
    findings.

- 2026-06-04 canonical public API docs slice:
  - documentation type: canonical public API documentation audit.
  - changed routes: none.
  - what remains internal: reducer reconciliation, optimistic operation maps,
    generated schema deep imports, private style chunks, source-level helper
    modules, bridge process lifecycle internals, local media storage internals,
    and raw diagnostic payload handling remain outside canonical public docs.
  - what becomes public: no new package API; the promoted vNext surfaces are
    documented canonically through package READMEs, reference docs, guides, and
    migration guidance, with `docs/reference/package-exports.md` remaining the
    export-freeze source of truth.
  - what host responsibility is intentionally not handled: hosted runtime,
    auth, persistence, tenant/workspace isolation, upload/static
    authorization, audit storage, billing, deployment policy, and app-specific
    workflows remain host-owned.
  - which example proves the design: package-name imports in Phase 12 examples
    and `examples/recipes/src/migration-vnext.ts` prove the documented public
    surfaces without source-level deep imports.
  - which tests protect the contract: API snapshots, package-resolution tests,
    package validation, docs staleness tests, and recipe typecheck protect the
    canonical public docs boundary.
  - focused validation: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run --cwd examples/recipes typecheck`,
    `bun run test:api-snapshots`, `bun run test:package-resolution`, and
    `bun run validate:packages` passed.
  - focused validation after final TODO note update:
    `bunx vitest run test/docs-staleness.test.ts`,
    `bun run test:api-snapshots`, `bun run lint`, and `bun run typecheck`
    passed; `bun run test:styles` passed after the migration-guide prose fix.
  - commit-unit review: spawned review subagent
    `019e917c-71ce-71a3-be8d-1662067791ab` with the `agent-ui-review` skill.
    Review reported no findings and confirmed this note does not prematurely
    freeze Phase 14 export maps.

## Phase 14: Package Exports And API Snapshots

- [x] Stabilize internal module boundaries before finalizing export maps.
- [x] Distinguish internal modules from public source APIs and published export
  map APIs.
- [x] Update package export maps.
- [x] Remove accidental public deep imports.
- [x] Add subpaths where needed.
- [x] Ensure browser-safe imports do not pull Node stdio code.
- [x] Update API snapshot tests.
- [x] Update package resolution tests.
- [x] Run `bun run test:api-snapshots`.
- [x] Run `bun run test:package-resolution`.
- [x] Run `bun run validate:packages`.
- [x] Confirm generated schema and dist output are not hand-edited.

### Phase 14 Notes

- 2026-06-04 export boundary audit slice:
  - documentation type: package export boundary audit.
  - changed routes: none.
  - what remains internal: package `src/*` modules, package `dist/*` output,
    generated Codex schema files, declaration bundle chunks, private React
    style chunks, reducer stores, bridge lifecycle internals, and example Vite
    or TypeScript source aliases remain source-level or build-level details.
  - what becomes public: no new package API; published package APIs remain the
    package root exports, existing Codex subpaths, and
    `@nyosegawa/agent-ui-react/styles.css` as described in package manifests
    and `docs/reference/package-exports.md`.
  - what host responsibility is intentionally not handled: hosted runtime,
    auth, persistence, tenant/workspace isolation, upload/static
    authorization, process supervision, billing, and deployment policy remain
    host-owned and are not introduced through export maps.
  - which example proves the design: public examples import through package
    names and documented subpaths; source aliases in example build config only
    point those package specifiers at workspace source during local development.
  - which tests protect the contract: `packages/react/test/source-structure.vitest.ts`,
    `test/runtime-export-policy.test.ts`, API snapshots, package-resolution
    tests, package validation, and docs staleness tests protect the boundary.
  - focused validation: `bunx vitest run
    packages/react/test/source-structure.vitest.ts
    test/runtime-export-policy.test.ts` passed.
  - audit result: no export-map change was made in this slice. The next
    unchecked Phase 14 item is the actual export-map update decision.
  - commit-unit review: spawned review subagent
    `019e9186-cc7f-73f0-a30e-d49ddb56a171` with the `agent-ui-review` skill.
    Review reported no findings and confirmed this slice does not prematurely
    freeze Phase 14 export maps.

- 2026-06-04 export-map canonicalization slice:
  - documentation type: package export map decision.
  - changed routes: none.
  - what remains internal: package `src/*`, package `dist/*`, generated Codex
    schema subpaths, hashed declaration chunks, React private style chunks,
    server dynamic-tool helper internals, reducer stores, and example
    source-alias targets remain outside published package imports.
  - what becomes public: no new package API beyond the current manifest export
    maps. The canonical public specifiers are the package roots, the existing
    Codex subpaths (`clients`, `normalizer`, `request-builders`, `session`,
    `stable-types`, `websocket`), and
    `@nyosegawa/agent-ui-react/styles.css`.
  - what host responsibility is intentionally not handled: hosted runtime,
    authentication, persistence, tenant/workspace isolation, upload/static
    authorization, process lifecycle, billing, and deployment policy remain
    host-owned and are not introduced through additional exports.
  - which example proves the design: Phase 12 examples and recipes import
    public package names or documented subpaths; local Vite/TypeScript aliases
    are build-time workspace wiring, not consumer deep imports.
  - which tests protect the contract: `test:package-resolution` verifies the
    canonical manifest specifier list and rejects blocked deep imports;
    `test:api-snapshots` snapshots only export-map declaration targets;
    `test/package-scripts-docs.test.ts` aligns docs with package manifests;
    `test/npm-release-readiness.test.ts` and package validation protect
    publish metadata.
  - focused validation: `bun run test:package-resolution`,
    `bun run test:api-snapshots`, and `bunx vitest run
    test/package-scripts-docs.test.ts test/npm-release-readiness.test.ts
    scripts/api-snapshot-lib.vitest.ts` passed.
  - implementation note: no additional manifest edit was needed in this slice;
    the current export maps already match the canonical public specifier list
    and the actual export-map update decision is to keep that reduced surface.
  - commit-unit review: spawned review subagent
    `019e918e-7be7-7611-bb5f-ce06da0cee97` with the `agent-ui-review` skill.
    Review reported no findings.

- 2026-06-04 browser-safe export guard slice:
  - documentation type: package runtime export guard.
  - changed routes: none.
  - what remains internal: Codex stdio transport, server bridge process
    lifecycle, `execa`, Node streams/readline, upload filesystem helpers, and
    generated schema source modules remain outside browser-safe entrypoints.
  - what becomes public: no new package API; browser-safe public entrypoints are
    protected as `@nyosegawa/agent-ui-codex/websocket`, Codex request builders
    and normalizer helpers, React root, Web Components root, and React
    `styles.css`.
  - what host responsibility is intentionally not handled: hosted runtime,
    process supervision, auth, persistence, tenant/workspace isolation,
    upload/static authorization, billing, and deployment policy remain
    host-owned.
  - which example proves the design: browser examples import
    `@nyosegawa/agent-ui-codex/websocket`, React, Web Components, and
    `styles.css` without importing Codex stdio or server bridge helpers.
  - which tests protect the contract: `test/runtime-export-policy.test.ts`
    now walks the runtime source import/export graph from browser-safe
    entrypoints and asserts they avoid Node stdio imports, Codex root imports,
    server bridge imports, and `./stdio-transport`; `test:package-resolution`
    verifies the same documented subpaths resolve, and package validation
    checks built public targets.
  - focused validation: `bunx vitest run test/runtime-export-policy.test.ts`
    and `bunx vitest run test/docs-staleness.test.ts` passed.
  - commit-unit review: review subagent
    `019e9190-2470-7000-93dc-39bc095a66ac` found that the initial guard only
    scanned entrypoint source files and did not prove transitive imports; the
    guard was strengthened to walk the runtime source graph. Follow-up review
    reported no findings.

- 2026-06-04 package validation closure slice:
  - documentation type: package validation closure.
  - changed routes: none.
  - what remains internal: generated Codex schema files, package `dist/*`
    output, declaration bundle chunks, upstream `third_party/codex`, and
    private source modules remain unedited by hand.
  - what becomes public: no new package API; API snapshot and package
    resolution tests now cover the canonical Phase 14 public specifier set and
    browser-safe runtime graph guard.
  - what host responsibility is intentionally not handled: hosted runtime,
    authentication, persistence, tenant/workspace isolation, upload/static
    authorization, process lifecycle, billing, and deployment policy remain
    host-owned.
  - which example proves the design: package-name imports in public examples
    and recipes continue to prove the documented export map; local source
    aliases remain development-time build wiring only.
  - which tests protect the contract: `bun run test:api-snapshots`,
    `bun run test:package-resolution`, `bun run validate:packages`,
    `test/runtime-export-policy.test.ts`, `test/package-scripts-docs.test.ts`,
    and docs staleness tests protect the final Phase 14 package boundary.
  - focused validation: `bun run test:api-snapshots`,
    `bun run test:package-resolution`, `bun run validate:packages`,
    `bunx vitest run test/runtime-export-policy.test.ts
    test/package-scripts-docs.test.ts scripts/api-snapshot-lib.vitest.ts`, and
    `bunx vitest run test/docs-staleness.test.ts` passed. An initial
    `test:api-snapshots` run failed while `test:package-resolution` was
    concurrently rebuilding package declarations; rerunning after build
    completed passed.
  - generated/dist check: `git status --short third_party/codex
    packages/codex/src/generated packages/*/dist` and `git diff --
    packages/codex/src/generated third_party/codex` produced no output.
  - commit-unit review: spawned review subagent
    `019e919a-ebef-7e31-8bc8-323d883f2f33` with the `agent-ui-review` skill.
    Review reported no findings.

## Phase 15: Full Validation

- [x] Run `bun run validate:fast`.
- [x] Run `bun run validate:protocol`.
- [x] Run `bun run build`.
- [x] Run `bun run validate:packages`.
- [x] Run `bun run test:api-snapshots`.
- [x] Run `bun run test:package-resolution`.
- [x] Run `bun run validate:release`.
- [x] Run `bun run validate:e2e`.
- [x] Run docs screenshot capture if docs images changed.
- [x] Use `agent-browser` to verify:
  - [x] default real local app desktop
  - [x] default real local app mobile
  - [x] first message immediate reflection
  - [x] local image composer preview
  - [x] local image transcript rendering
  - [x] missing local media fallback
  - [x] sidebar drawer
  - [x] custom components fixture
  - [x] approval anchoring
  - [x] transcript scroll/jump behavior
- [x] Check for horizontal overflow on mobile.
- [x] Check button hit targets.
- [x] Check text overflow in compact states.
- [x] Check console errors.
- [x] Check server logs for unredacted secrets or raw local paths where they do
  not belong.

### Phase 15 Notes

- 2026-06-04 full validation progress:
  - `bun run validate:fast` passed: workspace typecheck, lint, and 58 Vitest
    files / 597 tests.
  - `bun run validate:protocol` passed: 12 Codex protocol test files / 86
    tests, plus 69 core fixture tests.
  - `bun run build` passed after workspace package/example builds completed.
  - `bun run validate:packages` passed: build, `test:packlist`,
    `test:node-compat`, `publint`, and `attw` completed. `publint` reported
    only the existing repository URL suggestions.
  - `bun run test:api-snapshots` passed after build.
  - `bun run test:package-resolution` passed and printed the canonical public
    specifiers.
  - Additional already-passed Phase 15 prerequisite checks from Phase 14:
    `bun run test:protocol`, `bun run test:styles`,
    `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, and
    `bun run typecheck`.
  - Note: an isolated `bun run test:api-snapshots` invocation failed when run
    before package declaration output existed; running `bun run build` first,
    as documented by the snapshot script and CI gate, made it pass.
  - `bun run validate:release` initially failed at `check:dead-code` on three
    unused React source exports: the private `ComposerSubmitButton` alias,
    `pinnedApprovalItemIdsByTurnId`, and `approvalAnchorsForTurn`. The fix
    removed the unused alias/export surface without changing public root
    exports or visible behavior.
  - `bun run check:dead-code` passed after the export cleanup.
  - `bun run validate:release` then passed: `validate:fast`,
    `validate:protocol`, `validate:packages`, `check:dead-code`,
    `test:api-snapshots`, and `test:package-resolution` completed. `publint`
    again reported only the existing repository URL suggestions.
  - release/dead-code cleanup commit-unit review: spawned review subagent
    `019e91aa-1e79-7c91-b3b8-40f2d9f3e627` with the `agent-ui-review` skill.
    Review reported no findings.
  - `bun run validate:e2e` passed: fixture Playwright suite ran 54 tests
    with 53 passed and 1 docs screenshot test skipped; real-local Playwright
    suite ran 15 tests with 15 passed.
  - docs screenshot capture applicability: `git status --short
    docs/screenshots` produced no output, so no docs screenshot files changed
    and capture was not required.
  - agent-browser desktop real-local check: opened
    `http://127.0.0.1:4174/` at 1280x900, verified the default start
    surface, started a thread with `slow smoke agent-browser`, and confirmed
    the user message appears before `Echo: slow smoke agent-browser`;
    document horizontal overflow was 0.
  - agent-browser mobile real-local check: opened
    `http://127.0.0.1:4174/` at 390x844, opened the thread history drawer,
    selected `Searchable real smoke`, confirmed the drawer closed, confirmed
    the heading updated, and measured horizontal overflow 0. Compact mode/menu
    controls remain hit-testable; measured compact control heights include
    existing 30px toolbar controls covered by the Playwright design-system
    contract.
  - agent-browser local media check: pasted `agent-browser-fixture.png` into
    the stored-thread composer, confirmed `.aui-composer-chip-thumbnail`,
    confirmed the transcript rendered an `.aui-image-block img` using an
    opaque `/agent-ui/assets/...` URL, sent `missing media smoke`, and
    confirmed `Local media unavailable` rendered with no broken image.
  - agent-browser fixture check: opened `/fixture-gallery` at 1280x900,
    confirmed `[data-testid="custom-command-renderer"]`, found one transcript
    approval anchor, and measured horizontal overflow 0 with no overflowing
    elements. On `/`, clicked the approval action by accessibility ref and
    clicked Jump to latest; transcript distance from bottom became 0.
  - agent-browser compact/mobile text check: opened `/transcript-density` at
    390x900 and measured horizontal overflow 0 with no overflowing elements in
    compact/critical transcript surfaces.
  - console/log check: fixture preview sessions reported no console or page
    errors. The real-local dev server initially produced a Vite HMR websocket
    console error; `examples/codex-local-web/server.ts` now attaches Vite HMR
    to the same custom HTTP server at `/vite-hmr`, after which a fresh
    agent-browser session reported `[vite] connected` and no page errors.
    Server logs showed bridge phase/pending counts and expected local-example
    startup paths only; no unredacted secrets or unexpected raw local paths
    were observed.
  - focused validation after the real-local HMR fix:
    `bun run --cwd examples/codex-local-web typecheck` passed and
    `bun run test:e2e:real-local` passed 15/15 tests.
  - full e2e validation was rerun after the HMR fix: `bun run validate:e2e`
    passed with the fixture Playwright suite at 53 passed / 1 docs screenshot
    test skipped and the real-local Playwright suite at 15 passed.
  - browser/HMR fix commit-unit review: spawned review subagent
    `019e91b5-f924-7c81-9ca5-ce0a1a19be70` with the `agent-ui-review` skill.
    Review reported no findings.
  - final validation-sensitive reruns after the last `server.ts` lint fix:
    `bun run test:protocol` passed 12/12 files and 86/86 tests;
    `bun run test:styles` passed 2/2 files and 62/62 tests;
    `bunx vitest run test/docs-staleness.test.ts` passed 1/1 file and 5/5
    tests; `bun run lint` passed; `bun run validate:packages` passed with
    only the existing `publint` repository URL suggestions; `bun run
    test:api-snapshots` passed; and `bun run typecheck` passed across all
    workspaces.

## Phase 16: Commit, Push, And PR Readiness

- [x] Review `git status --short`.
- [x] Confirm no unrelated user changes are staged.
- [x] Commit logically grouped changes as implementation progresses.
- [x] Push the branch after meaningful checkpoints.
- [x] Open a draft PR when the design is implemented enough for review.
- [x] Include PR summary covering:
  - [x] lifecycle model
  - [x] optimistic first message
  - [x] local file/resource contract
  - [x] controller/component layering
  - [x] bridge policy/diagnostics
  - [x] examples updated
  - [x] docs updated
  - [x] validation run
- [x] Watch GitHub Actions to a concrete pass/fail state before claiming ready.
- [x] Resolve CI failures with focused commits.
- [x] Mark PR ready only after all validation and browser checks pass.

### Phase 16 Notes

- 2026-06-04 PR readiness checkpoint:
  - `git status --short` reviewed after Phase 15 completion. The branch is
    `codex/agent-ui-vnext-design-plan`; the worktree contains the expected
    broad vNext docs, examples, package, tests, and changeset edits.
  - `git diff --cached --name-only` produced no output; nothing is staged.
  - `git status --short third_party/codex packages/codex/src/generated
    packages/*/dist docs/screenshots` produced no output, and `git diff --
    packages/codex/src/generated third_party/codex` produced no output.
  - `git diff --check` passed.
  - Created the reviewed vNext implementation checkpoint commit.
- 2026-06-04 final pre-commit integration review:
  - spawned review subagent `019e91be-cdc9-71e1-bfe3-11a48c14674d` with the
    `agent-ui-review` skill.
  - Review found P1: the scoped-thread-list recipe advertised a public host
    pattern while still using `useAgentThreadHistory()` and manually parsing raw
    `thread/list` response ids, and the race-safe
    `useAgentThreadListController()` remained source-level only.
  - Fix: exported `useAgentThreadListController()` and its public controller,
    request, options, and sync-event types from the React root, changed the
    scoped-thread-list recipe to use that controller without raw response
    parsing, updated hooks/package/design-gate docs, and updated React API
    snapshots.
  - Focused validation after the fix: `bunx vitest run
    packages/react/test/components.vitest.tsx -t "thread list"` passed 6/6
    selected tests; `bun run --cwd examples/recipes typecheck` passed;
    `bunx vitest run test/docs-staleness.test.ts` passed; `bun run
    validate:packages` passed with only the existing `publint` repository URL
    suggestions; `bun run test:api-snapshots` passed; and `bun run
    test:package-resolution` passed.
- 2026-06-04 scoped thread-list follow-up review and fix:
  - Review subagent `019e91c8-6a92-7b12-ab54-ce1a967c3bf1` used the
    `agent-ui-review` skill and found two P2 issues: the newly public
    `useAgentThreadListController()` still returned raw-bearing `ThreadState[]`,
    and `docs/architecture/vnext-design-gates.md` still described the controller
    itself as source-level/internal.
  - Fix: changed `useAgentThreadListController().threads` to return raw-free
    `AgentThreadView[]`, adapted the default sidebar list to consume raw-free
    view rows, kept the scoped-thread-list recipe on the public controller,
    updated hooks/package/design-gate docs, refreshed React API snapshots, and
    removed render-time ref access from the sidebar search/list switch.
  - Focused validation after the P2 fix: `bunx vitest run
    packages/react/test/components.vitest.tsx -t "thread list|sidebar"` passed;
    `bun run --cwd examples/recipes typecheck` passed; `bun run build` passed;
    `bun run test:api-snapshots:update` refreshed snapshots; `git diff --check`
    passed; and `git status --short third_party/codex
    packages/codex/src/generated packages/*/dist docs/screenshots` produced no
    output.
  - Required pre-commit gates after the P2 fix: `bun run test:protocol`, `bun run
    test:api-snapshots`, `bun run test:styles`, `bunx vitest run
    test/docs-staleness.test.ts`, `bun run lint`, `bun run typecheck`, `bun run
    test:package-resolution`, and a standalone `bun run validate:packages`
    passed. One earlier `validate:packages` attempt failed only because it was
    run concurrently with `test:package-resolution` and both tried to run Next
    builds at the same time.
  - Spawned follow-up review subagent `019e91d5-8e3a-7a63-8f32-317aa8b8757b`
    with the `agent-ui-review` skill to re-check the raw-free scoped
    thread-list public boundary before committing.
  - Follow-up review found P1: public `listThreads()`, `refresh()`, and
    `loadNextPage()` still returned raw App Server records, `previewThread()`
    returned `unknown`, and the public sidebar replacement props still carried
    `ThreadState[]`.
  - Fix: introduced raw-free `AgentThreadListResult`, changed
    `previewThread()` to `Promise<void>`, changed `AgentThreadSidebar`,
    `ThreadList`, and `AgentSidebarComponentProps` to use `AgentThreadView[]`,
    moved `ThreadState` to `AgentThreadView` conversion into the internal
    `AgentChat` composition path through core selectors, updated React guide
    usage, tests, and API snapshots.
  - Review subagent `019e91df-5436-7720-8744-57c1b08976ab` then found P1:
    the default sidebar search effect could repeatedly refetch the same
    `thread/list` query because the sidebar passed a fresh history scope and
    depended on the full controller object.
  - Fix: memoized the default sidebar history scope, made the debounced search
    effect depend on stable controller members instead of the whole controller,
    and added a regression test proving that advancing timers after a completed
    search does not issue another identical `thread/list` request.
  - Final scoped-thread-list follow-up review subagent
    `019e91e5-dc2f-7f93-87f0-35802628afee` reported no findings. It confirmed
    raw-free controller/sidebar public surfaces, stable sidebar search
    dependencies, and tests/snapshots/docs protecting the boundary.
  - Latest validation after the final follow-up: `bunx vitest run
    packages/react/test/components.vitest.tsx -t "auto-loads history|thread
    list|sidebar"`, `bun run test:protocol`, `bun run test:api-snapshots`, `bun
    run test:styles`, `bunx vitest run test/docs-staleness.test.ts`, `bun run
    lint`, `bun run typecheck`, `bun run validate:packages`, and `bun run
    test:package-resolution` passed. `validate:packages` still reports only the
    existing `publint` repository URL suggestions and Vite chunk-size warnings.
- 2026-06-04 PR checkpoint:
  - Pushed `codex/agent-ui-vnext-design-plan` to `origin`.
  - Opened draft PR #7: https://github.com/nyosegawa/agent-ui/pull/7
  - PR summary covers lifecycle model, optimistic first message, local
    file/resource contract, controller/component layering, bridge
    policy/diagnostics, updated examples, updated docs, validation runs, and
    subagent review notes.
  - GitHub Actions on the pushed PR head passed: CI and Compatibility both
    completed successfully. There were no CI failures to resolve.

## Phase 17: Current Design Language And Agent Skills Freshness

- [x] Treat the host integration model as the current design, not a future
  vNext migration, because this PR does not need backwards compatibility.
- [x] Remove public-facing vNext terminology from docs, examples, recipes,
  changesets, and PR wording. Keep only unavoidable factual branch/checkpoint
  references in internal notes.
- [x] Rename vNext-specific doc and recipe files to current-design names, then
  update docs-staleness coverage and links.
- [x] Re-check Agent Skills guidance against the latest official Codex manual.
- [x] Update public Agent UI skill docs and repository skill docs for the
  current Codex skill/plugin model.
- [x] Update focused tests that protect skill docs, repository skill docs, and
  docs/package script alignment.
- [x] Record a design note covering:
  - [x] what remains internal
  - [x] what becomes public
  - [x] what host responsibility is intentionally not handled
  - [x] which example proves the design
  - [x] which tests protect the contract
- [x] Run focused validation for docs, skills, examples, package/API surfaces
  touched by the rename and skill refresh.
- [x] Commit in small units, spawn an `agent-ui-review` subagent for each commit
  unit, fix review findings, push, and watch GitHub Actions to a concrete
  pass/fail state.

### Phase 17 Notes

- 2026-06-04 planning checkpoint:
  - Latest Codex manual was refreshed with the `openai-docs` skill. Current
    guidance treats skills as reusable workflow directories with `SKILL.md`,
    repo-scoped skills under `.agents/skills`, optional `agents/openai.yaml`
    metadata, and plugin distribution for shared reusable bundles.
  - Existing public skill docs still emphasize older install commands and need
    to be reframed around current Codex skill discovery, local installation
    through `$skill-installer`, and plugin-based distribution.
- 2026-06-04 current design language slice:
  - Renamed `docs/architecture/vnext-design-gates.md` to
    `docs/architecture/host-integration-design-gates.md`,
    `docs/migrations/vnext-host-consumers.md` to
    `docs/guides/host-integration.md`, and
    `examples/recipes/src/migration-vnext.ts` to
    `examples/recipes/src/host-integration-checklist.ts`.
  - Removed public-facing `vNext` terminology from docs, examples, recipes,
    and the package-boundary changeset so the PR presents the host integration
    model as the current design.
  - Design note:
    - what remains internal: generated schema, dist output, source-level
      controller internals, raw normalized entities, local media serving
      internals, bridge process lifecycle, and implementation CSS selectors.
    - what becomes public: host integration guide, host integration design
      gates, public package exports, documented controller/component/resource
      surfaces, and the host integration checklist recipe.
    - what host responsibility is intentionally not handled: hosted auth,
      persistence, tenant/workspace isolation, process supervision, upload or
      static authorization, billing, audit storage, and deployment policy.
    - which example proves the design:
      `examples/recipes/src/host-integration-checklist.ts` plus the default
      `AgentChat` sidebar and `examples/recipes/src/scoped-thread-list.tsx`.
    - which tests protect the contract:
      `bunx vitest run test/docs-staleness.test.ts`, `bun run --cwd
      examples/recipes typecheck`, `bun run test:styles`, `bun run lint`, and
      `bun run typecheck`.
  - Focused validation passed: `bunx vitest run test/docs-staleness.test.ts`,
    `bun run --cwd examples/recipes typecheck`, `bun run test:styles`, `bun run
    lint`, and `bun run typecheck`.
- 2026-06-04 Agent Skills freshness slice:
  - Refreshed the official Codex manual with `openai-docs` and verified the
    current model: skills are workflow directories with `SKILL.md`, Codex
    scans repo skills from `.agents/skills`, local setup uses
    `$skill-installer`, reusable distribution should use plugins, and optional
    `agents/openai.yaml` supplies Codex app metadata.
  - Updated `docs/maintenance/agent-ui-skills.md` to describe
    `skills/agent-ui` as distributable skill source, not Codex's repo-scoped
    discovery path; updated `docs/maintenance/repository-skills.md` to spell
    out `.agents/skills` scanning.
  - Added `skills/agent-ui/agents/openai.yaml` for stable Codex app display
    metadata and implicit invocation policy.
  - Design note:
    - what remains internal: maintainer workflows, repo validation commands,
      release operations, host app auth/persistence/deployment policy, and any
      app/MCP integrations not packaged in a plugin.
    - what becomes public: the `skills/agent-ui` skill source, its references,
      `agents/openai.yaml` metadata, and docs explaining plugin distribution.
    - what host responsibility is intentionally not handled: host package
      manager choice, hosted auth, bridge admission, tenant/workspace policy,
      upload/static authorization, persistence, and deployment.
    - which example proves the design: `skills/agent-ui/SKILL.md` plus
      `skills/agent-ui/references/server-bridge.md` and
      `skills/agent-ui/references/host-owned-remote.md`.
    - which tests protect the contract: `bun run test:skills`,
      `bun run test:repo-skills`, `bunx vitest run
      test/package-scripts-docs.test.ts`, `bunx vitest run
      test/docs-staleness.test.ts`, `bun run lint`, and `bun run typecheck`.
  - Focused validation passed: `bun run test:skills`, `bun run
    test:repo-skills`, `bunx vitest run test/package-scripts-docs.test.ts`,
    `bunx vitest run test/docs-staleness.test.ts`, `bun run lint`, and `bun run
    typecheck`.
- 2026-06-04 Phase 17 package/API validation:
  - `bun run validate:packages` passed with the existing `publint` repository
    URL suggestions and Vite chunk-size warnings.
  - `bun run test:api-snapshots` passed.
  - `bun run test:package-resolution` passed when rerun standalone. An earlier
    attempt failed only because it ran in parallel with `validate:packages` and
    both invoked Next builds concurrently.
- 2026-06-04 Phase 17 full validation:
  - `bun run test` passed: 58 test files and 598 tests.
  - `bun run validate:e2e` passed: fixture Playwright suite passed 53 tests
    with 1 screenshot-refresh test skipped, and real-local Playwright suite
    passed 15 tests.
- 2026-06-04 Phase 17 PR validation:
  - Pushed Phase 17 commits to PR #7.
  - GitHub Actions on the current PR #7 head are the authoritative evidence for
    CI readiness. The final check before completion confirmed that CI and
    Compatibility both completed successfully for the current PR head.

## Completion Criteria

- [x] `AgentChat` remains polished without host customization.
- [x] Host apps can replace layout, sidebar, composer, transcript blocks, and
  diagnostics without reimplementing hidden behavior.
- [x] First user message appears immediately in transcript and thread list.
- [x] Failed first message can rollback or retry predictably.
- [x] Local image attachments render in composer and transcript through explicit
  resource resolution.
- [x] Raw local paths are not used as browser media URLs.
- [x] Missing media renders professional fallback UI.
- [x] Scoped thread lists do not race or clear active threads incorrectly.
- [x] Preview reads do not mutate active thread run settings.
- [x] Server request policy is context-rich and default-safe.
- [x] Bridge health and diagnostics are structured and redacted.
- [x] All examples demonstrate the intended current host integration shape.
- [x] Public docs do not inherit vNext framing for this now-current design.
- [x] Agent Skills docs match the latest official Codex skill/plugin model.
- [x] All relevant docs are updated.
- [x] Host integration docs are sufficient for host consumers.
- [x] Unit, package, e2e, and browser validations pass.
- [x] GitHub Actions pass.

## Phase 18: Review Follow-Up Hardening

- [x] Fix P1 changeset release level and package-facing description.
- [x] Fix P1 post-reconcile stale alias turn/item event handling.
- [x] Add regression tests for stale pending-thread alias `turn/started`,
  streaming delta, completion, and failure events after `thread/reconciled`.
- [x] Fix P2 dynamic helper permission bounding for protocol-shaped filesystem
  permissions by sharing server-request policy bounding behavior.
- [x] Add dynamic helper permission tests that reject broadening grants.
- [x] Fix P2 local media SVG/active image serving hardening and add
  `nosniff`.
- [x] Add upload/local media tests for SVG rejection or safe serving headers.
- [ ] Clean current-design docs drift in `PLAN.md`, `TODO.md`,
  `docs/reference/package-exports.md`, and `docs/guides/host-integration.md`.
- [ ] Record design note covering:
  - [ ] what remains internal
  - [ ] what becomes public
  - [ ] what host responsibility is intentionally not handled
  - [ ] which example proves the design
  - [ ] which tests protect the contract
- [ ] Run focused validation for core reducer, server security, docs staleness,
  package/API/release gates touched by the fixes.
- [ ] Commit in small units, spawn an `agent-ui-review` subagent for each commit
  unit, fix review findings, push, and watch GitHub Actions to a concrete
  pass/fail state.

### Phase 18 Notes

- 2026-06-04 review intake:
  - External review reported P1 changeset severity mismatch, P1 stale alias
    turn/item event drops after optimistic thread reconciliation, P2 dynamic
    helper permission broadening, P2 local media SVG/same-origin serving
    hardening, and P2 stale current-design docs.
  - P1 stale alias fix: canonical thread aliases are now resolved in shared
    core state updates, turn starts/completions persist canonical turn ids, item
    starts/completions persist canonical item thread ids, and stale alias deltas
    / failures update the canonical turn after reconciliation.
  - Focused validation: `bun test packages/core/test/reducer.test.ts` pass;
    `bun run typecheck` pass.
  - P1 stale alias review follow-up: stale `thread/started`,
    `thread/upserted`, and `thread/status/changed` events now resolve to the
    canonical thread after reconciliation without resurrecting the pending alias.
    Focused validation: `bun test packages/core/test/reducer.test.ts` pass;
    `bun run typecheck` pass.
  - P2 stale alias coverage follow-up: added regression coverage that delayed
    alias `loaded` / `notLoaded` snapshots do not downgrade a live canonical
    thread after reconciliation. Focused validation:
    `bun test packages/core/test/reducer.test.ts` pass; `bun run lint` pass;
    `bun run typecheck` pass.
  - P1 changeset fix: all public packages now use pre-1.0 `minor` for this
    package-surface change, and the changeset body documents the public API,
    package boundary, migration, and host-owned responsibilities.
  - P2 dynamic helper permission fix: dynamic helper filesystem grants now use
    the same bounded protocol permission logic as normal server requests.
    Focused validation: `bun test packages/server/test/websocket.test.ts`
    pass; `bun run typecheck` pass.
  - P2 dynamic helper review follow-up: shared permission bounding now lives in
    an internal non-exported server module so it does not expand
    `@nyosegawa/agent-ui-server` public API. Focused validation:
    `bun test packages/server/test/websocket.test.ts` pass;
    `bun run test:api-snapshots` pass after rebuilding package declarations;
    `bun run typecheck` pass.
  - P2 local media hardening: upload rejects `image/svg+xml`, local asset
    responses include `X-Content-Type-Options: nosniff`, and JSON error
    responses also set `nosniff`. Focused validation:
    `bun test packages/server/test/upload.test.ts` pass; `bun run lint` pass;
    `bun run typecheck` pass.
