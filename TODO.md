# Agent UI vNext Host Integration TODO

Work through this checklist in order. Do not treat any phase as complete until
its docs, examples, tests, and validation items are complete.

## Phase 0: Baseline And Branch Hygiene

- [ ] Confirm the working tree is clean before implementation work begins.
- [ ] Confirm the branch name is purpose-based and uses the `codex/` prefix.
- [ ] Read `AGENTS.md`, `docs/architecture/product-boundary.md`,
  `docs/architecture/security.md`, `docs/architecture/testing.md`,
  `docs/reference/package-exports.md`, `docs/reference/hooks.md`,
  `docs/reference/react-components.md`, `docs/reference/server-bridge.md`,
  `docs/guides/attachments.md`, and `docs/guides/react.md`.
- [ ] Run baseline validation and record the current state:
  - [ ] `bun run validate:fast`
  - [ ] `bun run validate:protocol`
  - [ ] `bun run build`
  - [ ] `bun run validate:packages`
  - [ ] `bun run test:api-snapshots`
  - [ ] `bun run validate:e2e`
- [ ] Record any known baseline failures with owner, command, and exact failure
  summary before using them as accepted risk.
- [ ] Start or identify the relevant local example servers for future browser
  checks.
- [ ] Capture baseline screenshots or current known-good visual evidence for:
  - [ ] default desktop chat
  - [ ] default mobile chat
  - [ ] empty first-run screen
  - [ ] sidebar drawer
  - [ ] composer with attachments
  - [ ] command/tool/detail blocks

## Phase 1: Public API Inventory

- [ ] Generate current API snapshots.
- [ ] List all current root exports for:
  - [ ] `@nyosegawa/agent-ui-core`
  - [ ] `@nyosegawa/agent-ui-codex`
  - [ ] `@nyosegawa/agent-ui-react`
  - [ ] `@nyosegawa/agent-ui-server`
  - [ ] `@nyosegawa/agent-ui-web-components`
- [ ] Mark each export as one of:
  - [ ] keep public
  - [ ] replace with vNext API
  - [ ] move to subpath
  - [ ] make private
  - [ ] remove
- [ ] Identify all examples and docs that import soon-to-change APIs.
- [ ] Identify all tests that encode old state names or old hook behavior.
- [ ] Update `docs/reference/package-exports.md` draft notes with intended
  package boundaries.
- [ ] Create or draft design notes for these review gates:
  - [ ] public thread view model versus internal normalized entity
  - [ ] optimistic first-message operation model
  - [ ] local media helper security and naming
  - [ ] controller count and responsibilities
  - [ ] component replacement map scope
  - [ ] bridge policy and diagnostics audience
  - [ ] example shape before package export changes
  - [ ] package export map before release validation
- [ ] For each review gate, record:
  - [ ] what remains internal
  - [ ] what becomes public
  - [ ] what host responsibility is intentionally not handled
  - [ ] which example proves the design
  - [ ] which tests protect the contract

## Phase 2: Protocol And Normalization Contract

- [ ] Classify every App Server method or notification used by vNext as one of:
  - [ ] productized stable Agent UI behavior
  - [ ] stable host-managed lower-level surface
  - [ ] experimental opt-in surface
  - [ ] unsupported or test-only surface
- [ ] Classify thread lifecycle methods and notifications:
  - [ ] `thread/start`
  - [ ] `thread/resume`
  - [ ] `thread/read`
  - [ ] `thread/list`
  - [ ] thread title/name updates
  - [ ] archive/unarchive/close if upstream supports them
- [ ] Classify turn lifecycle methods and notifications:
  - [ ] `turn/start`
  - [ ] `turn/steer`
  - [ ] `turn/interrupt`
  - [ ] turn completion and interruption notifications
  - [ ] `clientUserMessageId` support
- [ ] Classify server request and approval surfaces:
  - [ ] command approval
  - [ ] file change approval
  - [ ] user input
  - [ ] MCP elicitation
  - [ ] permissions
  - [ ] dynamic tool calls
- [ ] Classify media/resource payloads from live notifications and
  `thread/read` history.
- [ ] Confirm unsupported methods such as `thread/turns/items/list` stay out of
  default React behavior.
- [ ] Update protocol capability docs or draft notes with the classification.
- [ ] Update normalizer fixtures needed to prove the classified lifecycle
  contract.
- [ ] Run `bun run validate:protocol`.

## Phase 3: Core Lifecycle State Model

- [ ] Replace thread registry buckets with explicit internal thread entity and
  collection state.
- [ ] Define internal activity state.
- [ ] Define internal availability state.
- [ ] Define internal storage state.
- [ ] Define public `AgentThreadView` separately from internal normalized
  entities.
- [ ] Ensure public thread view does not expose `raw` protocol payloads.
- [ ] Ensure public thread view does not expose canonical-ID reconciliation
  details unless needed as a documented diagnostic.
- [ ] Add `AgentThreadCollection`.
- [ ] Add `AgentThreadScope`.
- [ ] Add active thread state independent from history collections.
- [ ] Add optimistic operation state.
- [ ] Add collection sync state:
  - [ ] `idle`
  - [ ] `loading`
  - [ ] `ready`
  - [ ] `error`
- [ ] Add canonical ID reconciliation support.
- [ ] Add lifecycle events for:
  - [ ] optimistic thread created
  - [ ] thread started
  - [ ] thread reconciled
  - [ ] thread updated
  - [ ] thread title updated
  - [ ] thread archived
  - [ ] thread unarchived
  - [ ] thread closed
  - [ ] collection refresh started
  - [ ] collection page received
  - [ ] collection synced
  - [ ] collection failed
- [ ] Update selectors:
  - [ ] active thread selector
  - [ ] thread by ID selector
  - [ ] collection by scope key selector
  - [ ] ordered collection threads selector
  - [ ] pending operations selector
- [ ] Update retention so active, live, pending, and request-bound threads are
  retained correctly.
- [ ] Add core reducer tests for all lifecycle transitions.
- [ ] Add core reducer tests for collection scoping and pagination.
- [ ] Add core reducer tests for canonical ID reconciliation.
- [ ] Add core reducer tests for retention under the new model.
- [ ] Run focused core reducer tests.

## Phase 4: Composer Controller And Atomic First Message

- [ ] Add internal/source-level `useAgentComposerController(threadId)` before
  publishing any new controller export.
- [ ] Move first-run submission and normal composer submission behind the same
  controller-owned action surface.
- [ ] Replace or break `startThreadWithInput()` with controller-owned
  `startWithMessage()`.
- [ ] Generate stable pending thread, turn, and user message IDs.
- [ ] Add optimistic pending thread insertion.
- [ ] Add optimistic pending turn insertion.
- [ ] Add optimistic user message insertion.
- [ ] Insert pending thread into matching collections immediately.
- [ ] Send `thread/start` after optimistic state is visible.
- [ ] Reconcile pending thread ID to canonical server thread ID.
- [ ] Send `turn/start` with `clientUserMessageId`.
- [ ] Reconcile server user message item to optimistic user message.
- [ ] Prevent duplicated user messages after reconciliation.
- [ ] Roll back the whole pending thread when `thread/start` fails.
- [ ] Keep the real thread and mark the message failed when `turn/start` fails
  after thread creation.
- [ ] Add retry support for failed pending first messages.
- [ ] Add failure UI metadata for pending messages.
- [ ] Add operation state observable by operation ID.
- [ ] Ensure callers do not manage rollback callbacks or pending thread/turn
  promises directly.
- [ ] Ensure unmount cannot trigger duplicate rollback or retry.
- [ ] Add controller actions for retry and cancel by operation ID.
- [ ] Update first-run submit to use the same controller as normal composer.
- [ ] Update normal composer submit to use the same optimistic message path where
  appropriate.
- [ ] Preserve existing running-turn semantics:
  - [ ] Enter queues locally while a regular turn is running
  - [ ] Cmd/Ctrl+Enter steers the active turn when allowed
  - [ ] Stop only calls `turn/interrupt`
  - [ ] queued follow-ups remain scoped by thread
  - [ ] queued attachments survive edit/restore
- [ ] Add unit tests for:
  - [ ] immediate pending state
  - [ ] successful reconciliation
  - [ ] `thread/start` failure rollback
  - [ ] `turn/start` failure retry
  - [ ] duplicate prevention
- [ ] Add browser/e2e test proving first user message appears immediately before
  assistant output.

## Phase 5: Scoped Thread Lists

- [ ] Implement `useAgentThreadListController(scope)`.
- [ ] Support explicit `scope.key`.
- [ ] Support search state.
- [ ] Support pagination and `nextCursor`.
- [ ] Support refresh and invalidation.
- [ ] Support loading/error state per collection.
- [ ] Support preview hydration without activation.
- [ ] Support explicit activation/resume.
- [ ] Ensure background preview reads do not mutate active run settings.
- [ ] Ensure sidebar selection uses canonical thread IDs after hydration.
- [ ] Add `onHistorySynced` or equivalent lifecycle event.
- [ ] Add docs explaining host-owned scope semantics.
- [ ] Rebuild `AgentThreadSidebar` on the controller.
- [ ] Add tests for multiple independent thread collections.
- [ ] Add tests for scoped active-thread consistency.
- [ ] Add tests for search pagination not leaking between scopes.
- [ ] Add browser/e2e tests for sidebar search, select, mobile drawer, and
  scoped list behavior.

## Phase 6: Local Media Helper And Resource Resolution

- [ ] Replace or extend upload helper with
  `createAgentUiLocalMediaHelper()`.
- [ ] Treat the helper as opt-in and local-first; do not make it a general file
  server or remote storage layer.
- [ ] Add upload handler returning:
  - [ ] `path`
  - [ ] `url`
  - [ ] `id`
  - [ ] `name`
  - [ ] `redactedPath`
  - [ ] `mimeType`
  - [ ] `sizeBytes`
- [ ] Add static handler for tokenized file URLs.
- [ ] Ensure static serving is disabled unless the host intentionally wires the
  handler.
- [ ] Prefer `serveAssetHandler` or similarly constrained naming over
  generic static-serving names.
- [ ] Ensure static URLs are not derived from raw local paths.
- [ ] Ensure static URLs are addressed by registered asset ID only.
- [ ] Add safe local path resolution that returns registered file assets only.
- [ ] Add URL creation by asset ID, not arbitrary raw path.
- [ ] Prevent path traversal before filesystem access.
- [ ] Refuse to serve files outside the configured root.
- [ ] Use unguessable or session-scoped asset IDs by default.
- [ ] Allow host admission/session checks before serving bytes.
- [ ] Require host admission/session checks for non-loopback or shared
  endpoints.
- [ ] Keep loopback development defaults separate from remote deployment docs.
- [ ] Define cleanup-after-preview behavior.
- [ ] Document when sending local paths to App Server or model context is
  acceptable.
- [ ] Add cleanup support.
- [ ] Add TTL cleanup support.
- [ ] Add max-byte and content-type checks.
- [ ] Add path traversal tests.
- [ ] Add unauthorized/static-serving boundary docs.
- [ ] Add `AgentResolvedAttachment`.
- [ ] Change attachment resolver contract to return structured metadata.
- [ ] Preserve Codex input construction as explicit `input`.
- [ ] Add `previewUrl` for UI rendering.
- [ ] Add `displayName` and `redactedPath`.
- [ ] Add attachment preview failure state.
- [ ] Add fallback card for unavailable local media.
- [ ] Add `resolveLocalMediaUrl(path, item)` support for transcript media.
- [ ] Ensure React never renders raw filesystem paths as image/video `src`.
- [ ] Add tests for composer preview URLs.
- [ ] Add tests for transcript local image URL resolution.
- [ ] Add tests for missing media fallback.
- [ ] Add e2e proving local image appears in composer and transcript.
- [ ] Add e2e proving unavailable local media does not render a broken image.

## Phase 7: Transcript View Model And Density

- [ ] Add `AgentTranscriptEntry`.
- [ ] Add `useAgentTranscriptController(threadId, options)`.
- [ ] Include role, block, status, density, approval anchors, and optimistic
  public pending state in entries.
- [ ] Ensure transcript entries do not expose internal optimistic operation
  objects.
- [ ] Preserve transcript windowing behavior.
- [ ] Preserve approval anchoring behavior.
- [ ] Add density options:
  - [ ] default
  - [ ] compact
  - [ ] verbose
  - [ ] critical-only
  - [ ] per block kind
- [ ] Add `useAgentTranscriptScrollController(options)`.
- [ ] Support host-owned scroll container refs.
- [ ] Support jump to latest.
- [ ] Support jump to pending approval.
- [ ] Support show earlier items.
- [ ] Rebuild `AgentMessageList` on the transcript controller.
- [ ] Expose default block renderers with `Default` fallback.
- [ ] Add tests for transcript entries.
- [ ] Add tests for density behavior.
- [ ] Add tests for custom block renderer preserving wrappers.
- [ ] Add browser/e2e tests for custom command block renderer and approval
  anchors.

## Phase 8: Composer Styled Parts And Attachment Boundary

- [ ] Decide whether the internal composer controller should become public as
  `useAgentComposerController(threadId)`.
- [ ] Add resource resolution primitives before adding attachment-specific
  controller API.
- [ ] Add `useAgentAttachmentController(options)` only if it owns a stable
  behavior boundary distinct from composer and transcript.
- [ ] Decide whether attachment behavior should remain a resource primitive plus
  composer integration instead of a public controller.
- [ ] Expose:
  - [ ] `value`
  - [ ] `setValue`
  - [ ] `canSubmit`
  - [ ] `submitMode`
  - [ ] `disabledReason`
  - [ ] `isSubmitting`
  - [ ] `isInterrupting`
  - [ ] `activeTurnId`
  - [ ] queued follow-ups
  - [ ] failed pending messages
  - [ ] retry actions
- [ ] Add styled parts:
  - [ ] `AgentComposerPanel`
  - [ ] `AgentComposerInput`
  - [ ] `AgentComposerToolbar`
  - [ ] `AgentAttachmentChips`
  - [ ] `AgentComposerSubmitButton`
  - [ ] `AgentStartComposer`
- [ ] Make initial composer and normal composer share the same primitives.
- [ ] Preserve keyboard submit behavior.
- [ ] Preserve stop behavior.
- [ ] Preserve follow-up queue behavior.
- [ ] Preserve attachment edit/restore behavior.
- [ ] Add tests for shared first-run/normal composer behavior.
- [ ] Add tests for mobile composer behavior.
- [ ] Add browser/e2e tests for queue, edit, retry, stop, and attachments.

## Phase 9: Component Layering And Visual Baseline

- [ ] Replace `slots` with `components` map.
- [ ] Add `defaultAgentComponents`.
- [ ] Keep new parts internal/source-level until component replacement tests and
  examples prove the contract.
- [ ] Start with limited replacement points:
  - [ ] layout shell
  - [ ] sidebar
  - [ ] empty state / start composer
  - [ ] composer panel
  - [ ] transcript block renderers
  - [ ] approval surface
- [ ] Add typed props for each replaceable component.
- [ ] Pass `Default` renderers to replaceable parts.
- [ ] Limit `Default` renderers to narrow block-level or surface-level
  contracts where they do not expose private internals.
- [ ] Reject replacement points whose accessibility, scroll, or approval-anchor
  contract cannot be documented and tested.
- [ ] Keep `AgentChat` as the default product-quality preset.
- [ ] Mark candidate styled parts as public only after the component replacement
  design gate passes.
- [ ] Ensure replacing one block does not bypass transcript wrappers.
- [ ] Ensure replacing sidebar does not require reimplementing list controller.
- [ ] Ensure replacing composer toolbar does not break submit semantics.
- [ ] Add fixture close-ups for:
  - [ ] empty state mobile
  - [ ] start composer
  - [ ] sidebar drawer search/select
  - [ ] custom block renderer fallback
  - [ ] local media fallback card
  - [ ] optimistic pending message
- [ ] Run visual layout tests for desktop and mobile.
- [ ] Run agent-browser QA for the real local app default route.
- [ ] Run agent-browser QA for the fixture gallery.
- [ ] Capture screenshots for changed docs where needed.

## Phase 10: Bridge Policy And Structured Diagnostics

- [ ] Add `AgentUiBridgePolicy`.
- [ ] Add explicit admission modes:
  - [ ] local loopback only
  - [ ] host callback
  - [ ] unsafe no admission with required reason
- [ ] Replace opaque browser method allowlists with capability categories.
- [ ] Add context-rich server request policy callback.
- [ ] Add bounded permission grant enforcement.
- [ ] Remove generic broad auto-accept behavior where unsafe.
- [ ] Add dynamic tool policy shape.
- [ ] Add dynamic tool debug events:
  - [ ] received
  - [ ] denied
  - [ ] helper thread created
  - [ ] MCP call started
  - [ ] timeout
  - [ ] completed
  - [ ] failed
- [ ] Add bridge health state:
  - [ ] admission checked
  - [ ] process spawned
  - [ ] initialized
  - [ ] connected
  - [ ] idle closed
  - [ ] backpressure closed
  - [ ] pending request count
  - [ ] last redacted diagnostic
- [ ] Add diagnostic audience:
  - [ ] user
  - [ ] developer
  - [ ] audit
- [ ] Ensure default UI renders user-facing diagnostics separately from debug
  diagnostics.
- [ ] Ensure stderr, admission phases, and dynamic tool phases default to
  developer/audit audience.
- [ ] Add React diagnostics controller updates.
- [ ] Separate user-facing errors from debug-only warnings.
- [ ] Add server unit tests for policy decisions.
- [ ] Add server unit tests for bounded permission grants.
- [ ] Add server unit tests for bridge health events.
- [ ] Add docs for host-owned audit logging and auth boundaries.

## Phase 11: Codex Normalization Updates

- [ ] Implement the normalization work approved in Phase 2.
- [ ] Normalize all productized thread lifecycle notifications.
- [ ] Normalize thread archive/unarchive/close consistently.
- [ ] Normalize compact/settings/goal lifecycle only where productized.
- [ ] Preserve experimental/host-only labeling.
- [ ] Normalize media item payloads into resource-aware blocks.
- [ ] Preserve `clientUserMessageId` for optimistic reconciliation.
- [ ] Update protocol capability docs.
- [ ] Update API snapshots.
- [ ] Run protocol and normalizer tests.

## Phase 12: Example Updates

- [ ] Update `examples/codex-local-web`.
  - [ ] Use vNext bridge policy.
  - [ ] Use local media helper upload and static handlers.
  - [ ] Return structured resolved attachments.
  - [ ] Resolve transcript local media URLs.
  - [ ] Use atomic first message API.
  - [ ] Demonstrate diagnostics/health.
  - [ ] Add e2e for local image transcript visibility.
  - [ ] Add e2e for first message immediate reflection.
- [ ] Update `examples/local-react-vite`.
  - [ ] Add optimistic first message fixture.
  - [ ] Add local media fallback fixture.
  - [ ] Add custom components map fixture.
  - [ ] Add density mode fixture.
  - [ ] Add mobile empty state fixture.
  - [ ] Update visual tests.
- [ ] Update `examples/recipes`.
  - [ ] Add `headless-chat-controller`.
  - [ ] Add `scoped-thread-list`.
  - [ ] Add `host-owned-composer`.
  - [ ] Add `local-media-helper`.
  - [ ] Add `custom-transcript-blocks`.
  - [ ] Add `bridge-policy`.
  - [ ] Add `diagnostics-panel`.
  - [ ] Add `migration-vnext`.
- [ ] Update `examples/next-with-bridge-sidecar`.
  - [ ] Use vNext bridge policy.
  - [ ] Document full-chat WebSocket boundary.
  - [ ] Add local media helper utilities where applicable.
- [ ] Update `examples/next-rpc-route`.
  - [ ] Keep read/list/status-only scope.
  - [ ] Document that it cannot power `AgentChat`.
- [ ] Update all example docs under `docs/examples`.

## Phase 13: Documentation Updates

- [ ] Update `docs/README.md`.
- [ ] Update `docs/architecture/overview.md`.
- [ ] Update `docs/architecture/product-boundary.md`.
- [ ] Update `docs/architecture/security.md`.
- [ ] Update `docs/architecture/testing.md`.
- [ ] Update `docs/reference/package-exports.md`.
- [ ] Replace or update `docs/reference/hooks.md` with controllers reference.
- [ ] Update `docs/reference/react-components.md`.
- [ ] Update `docs/reference/server-bridge.md`.
- [ ] Update `docs/reference/codex-protocol.md`.
- [ ] Update `docs/guides/react.md`.
- [ ] Update `docs/guides/attachments.md` into local resource guidance.
- [ ] Update `docs/guides/approvals.md`.
- [ ] Add or update diagnostics guide.
- [ ] Update `docs/guides/nextjs.md`.
- [ ] Update `docs/guides/remote-deployment.md`.
- [ ] Update `docs/guides/theming.md` if component layering changes styling
  guidance.
- [ ] Update `docs/maintenance/ci-cd.md` if validation gates change.
- [ ] Update `docs/maintenance/release-checklist.md`.
- [ ] Create `docs/migrations/<version>-host-consumers.md`.
- [ ] Migration guide includes:
  - [ ] who must migrate
  - [ ] package-by-package breaking changes
  - [ ] before/after import examples
  - [ ] before/after React examples
  - [ ] before/after server bridge examples
  - [ ] local media helper migration
  - [ ] first message optimistic migration
  - [ ] validation checklist
  - [ ] non-promises and host-owned boundaries
- [ ] Update package READMEs.
- [ ] Update changelogs or changesets as appropriate.
- [ ] Ensure every new public API is documented exactly once as canonical.

## Phase 14: Package Exports And API Snapshots

- [ ] Stabilize internal module boundaries before finalizing export maps.
- [ ] Distinguish internal modules from public source APIs and published export
  map APIs.
- [ ] Update package export maps.
- [ ] Remove accidental public deep imports.
- [ ] Add subpaths where needed.
- [ ] Ensure browser-safe imports do not pull Node stdio code.
- [ ] Update API snapshot tests.
- [ ] Update package resolution tests.
- [ ] Run `bun run test:api-snapshots`.
- [ ] Run `bun run test:package-resolution`.
- [ ] Run `bun run validate:packages`.
- [ ] Confirm generated schema and dist output are not hand-edited.

## Phase 15: Full Validation

- [ ] Run `bun run validate:fast`.
- [ ] Run `bun run validate:protocol`.
- [ ] Run `bun run build`.
- [ ] Run `bun run validate:packages`.
- [ ] Run `bun run test:api-snapshots`.
- [ ] Run `bun run test:package-resolution`.
- [ ] Run `bun run validate:release`.
- [ ] Run `bun run validate:e2e`.
- [ ] Run docs screenshot capture if docs images changed.
- [ ] Use `agent-browser` to verify:
  - [ ] default real local app desktop
  - [ ] default real local app mobile
  - [ ] first message immediate reflection
  - [ ] local image composer preview
  - [ ] local image transcript rendering
  - [ ] missing local media fallback
  - [ ] sidebar drawer
  - [ ] custom components fixture
  - [ ] approval anchoring
  - [ ] transcript scroll/jump behavior
- [ ] Check for horizontal overflow on mobile.
- [ ] Check button hit targets.
- [ ] Check text overflow in compact states.
- [ ] Check console errors.
- [ ] Check server logs for unredacted secrets or raw local paths where they do
  not belong.

## Phase 16: Commit, Push, And PR Readiness

- [ ] Review `git status --short`.
- [ ] Confirm no unrelated user changes are staged.
- [ ] Commit logically grouped changes as implementation progresses.
- [ ] Push the branch after meaningful checkpoints.
- [ ] Open a draft PR when the design is implemented enough for review.
- [ ] Include PR summary covering:
  - [ ] lifecycle model
  - [ ] optimistic first message
  - [ ] local file/resource contract
  - [ ] controller/component layering
  - [ ] bridge policy/diagnostics
  - [ ] examples updated
  - [ ] docs updated
  - [ ] validation run
- [ ] Watch GitHub Actions to a concrete pass/fail state before claiming ready.
- [ ] Resolve CI failures with focused commits.
- [ ] Mark PR ready only after all validation and browser checks pass.

## Completion Criteria

- [ ] `AgentChat` remains polished without host customization.
- [ ] Host apps can replace layout, sidebar, composer, transcript blocks, and
  diagnostics without reimplementing hidden behavior.
- [ ] First user message appears immediately in transcript and thread list.
- [ ] Failed first message can rollback or retry predictably.
- [ ] Local image attachments render in composer and transcript through explicit
  resource resolution.
- [ ] Raw local paths are not used as browser media URLs.
- [ ] Missing media renders professional fallback UI.
- [ ] Scoped thread lists do not race or clear active threads incorrectly.
- [ ] Preview reads do not mutate active thread run settings.
- [ ] Server request policy is context-rich and default-safe.
- [ ] Bridge health and diagnostics are structured and redacted.
- [ ] All examples demonstrate the intended vNext integration shape.
- [ ] All relevant docs are updated.
- [ ] Migration docs are sufficient for host consumers.
- [ ] Unit, package, e2e, and browser validations pass.
- [ ] GitHub Actions pass.
