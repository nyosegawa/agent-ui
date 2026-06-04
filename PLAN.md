# Agent UI Host Integration Plan

## Purpose

This plan records the host integration design shipped by this PR. Earlier
working notes used the `vNext` label, but the branch intentionally treats this
as the current design because there are no existing consumers to preserve.

Agent UI should turn the current request-driven improvement list into a coherent
embeddable library design. The target is not to add one API for every consumer
request. The target is a small set of stable primitives that let host
applications build first-class Codex App Server experiences without forcing
Agent UI to become a hosted runtime.

The redesign is intentionally breaking. Backward compatibility is not a design
constraint for this work. Existing APIs should survive only when they remain the
best shape after the model is cleaned up.

## Product Boundary

Agent UI owns:

- Normalized Codex App Server state, events, controllers, and selectors.
- React controllers, styled parts, and a high-quality `AgentChat` preset.
- Same-origin local bridge helpers, local upload/media helper utilities,
  redaction helpers, server request policy helpers, and structured diagnostics.
- Public package boundaries, examples, migration docs, and validation fixtures.

Host applications own:

- Authentication, authorization, sessions, routing, persistence, and audit logs.
- Workspace, account, tenant, project, product-surface, and deployment scoping.
- Codex App Server process admission and non-loopback exposure policy.
- Upload persistence, cleanup policy, static file authorization, and resource
  lifecycle.
- Dynamic tool authorization, MCP access policy, and host-specific registries.

The design must preserve that boundary even when the APIs become easier to
compose.

## Design Principles

1. Model lifecycle explicitly.
   Active thread, stored history, preview hydration, pending first message,
   running turn, failed turn, archived thread, and closed thread are different
   states. They should not be inferred from registry bucket membership.

2. Separate controller state from UI parts.
   A host should be able to keep Agent UI behavior while replacing layout or
   chrome. A preset should be a composition of public controllers and public
   styled parts, not a place where hidden behavior is trapped.

3. Treat local resources as resolved resources, not paths.
   The runtime may require local references. The browser UI requires
   display-safe URLs, display names, redacted paths, and professional fallback
   states. These are related but not interchangeable.

4. Make optimistic UI a contract.
   First user message submission must create visible pending thread, user
   message, transcript state, and thread list state before server responses
   arrive. Rollback and retry are part of the same contract.

5. Keep defaults product-quality.
   Headless support must not degrade the default UI. `AgentChat` should remain a
   polished mobile-capable default, and examples should prove that baseline.

6. Prefer typed policies over broad toggles.
   `accept` versus `manual` is too coarse for serious hosts. Server request,
   browser method, admission, dynamic tool, and permission policies should be
   context-rich and default-safe.

7. Make examples executable specifications.
   Examples are not secondary docs. The real local app, fixture gallery, Next
   sidecar, and recipes must prove the intended integration shape.

8. Add public API only after proving the internal boundary.
   Internal store shape, selectors, actions, and examples should prove a
   behavior before it becomes a published API. The plan should preserve review
   gates where a candidate API can be reduced, renamed, or kept internal.

9. Classify protocol before modeling product behavior.
   Core lifecycle states must be derived from productized Codex App Server
   methods and notifications, not from desired UI states alone. Stable
   host-managed, experimental, unsupported, and test-only protocol surfaces may
   remain available through lower-level adapters, but they must not become
   default React behavior by accident.

## Non-Goals

- Do not build a hosted Codex service.
- Do not own host authentication, sessions, billing, persistence, audit logs,
  tenant isolation, or product workflow routing.
- Do not create a general-purpose file server or remote storage layer.
- Do not make host concepts such as workspace, project, account, tenant, or
  product surface first-class Agent UI core semantics.
- Do not expose raw App Server payloads as the normal public API.
- Do not turn dynamic tool execution or MCP registry management into a default
  UI workflow.
- Do not promise experimental App Server methods as stable product UI.

## Execution Shape

This work is large enough that a single implementation pass would hide too many
review decisions. The right sequence is:

1. Inventory the current public API and classify the Codex App Server protocol
   surfaces that host integration depends on.
2. Redesign core lifecycle state and reducers from those classified protocol
   contracts.
3. Build controller-owned composer submission, including optimistic first
   message behavior, before exposing new React APIs.
4. Add scoped thread collections, resource resolution, transcript view models,
   bridge policy, and diagnostics behind internal/source-level boundaries.
5. Convert examples into executable specs before freezing export maps.
6. Publish only the reduced, documented package surface after examples, tests,
   migration docs, API snapshots, package validation, and browser checks agree.

Breaking changes are allowed, but each design gate should leave a reviewable
decision trail. Avoid compatibility shims for unshipped branch work; do keep
temporary internal adapters when they let the branch land in coherent,
test-backed stages.

## Protocol Classification Gate

Before changing core lifecycle semantics, classify every App Server method and
notification used by the host integration design:

- Productized stable methods that Agent UI owns through React behavior.
- Stable host-managed methods that may remain available through lower-level
  Codex/server helpers but should not become default UI workflow.
- Experimental methods that require explicit host opt-in and documentation.
- Unsupported or test-only methods that must not be promoted.

This gate must cover thread start/resume/read/list, turn start/steer/interrupt,
server request resolution, archive/unarchive/close if upstream supports them,
token usage updates, media/resource payloads, dynamic tool calls, and
`clientUserMessageId` reconciliation. Core state may introduce UI-specific
pending and collection concepts, but it should not invent durable App Server
semantics without labeling them as Agent UI-owned view state.

## Architecture Overview

Agent UI exposes three host integration layers.

### Layer 1: Core State Model

Core owns protocol-neutral state and transitions.

```ts
interface InternalThreadEntity {
  id: string;
  canonicalId?: string;
  activity: InternalThreadActivity;
  availability: InternalThreadAvailability;
  storage: InternalThreadStorageState;
  metadata: InternalThreadMetadata;
  turnIds: string[];
  tokenUsage?: ThreadTokenUsage;
  operations: Record<string, InternalOperationState>;
  raw?: unknown;
}

export interface AgentThreadView {
  id: string;
  title: string;
  subtitle?: string;
  cwd?: string;
  isActive: boolean;
  isPreview: boolean;
  isArchived: boolean;
  isRunning: boolean;
  needsInput: boolean;
  lastActivityAt?: number;
  pending?: AgentPendingThreadState;
  error?: AgentError;
}

export interface AgentThreadCollection {
  key: string;
  scope: AgentThreadScope;
  ids: string[];
  nextCursor: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error?: AgentError;
  syncedAt?: number;
}
```

The old global registry bucket model should be replaced with:

- A global thread entity map.
- A single active thread pointer.
- Keyed thread collections for history/search/scope views.
- Explicit optimistic operation records.
- Explicit lifecycle events for thread, turn, message, collection sync, and
  resource resolution.

Public view models and internal normalized entities must be separate. Consumers
should not receive `raw` protocol payloads, canonical-ID reconciliation details,
or internal storage/activity enums as the primary API. Public hooks should return
stable view models and operation state. Low-level debugging access, if needed,
must be explicit and documented as unstable or diagnostic-only.

### Layer 2: Controllers

React controllers own behavior and return state/actions/ARIA metadata without
forcing a visual layout.

Initial required controllers:

- `useAgentSessionController()`
- `useAgentBootstrapController()`
- `useAgentActiveThreadController()`
- `useAgentThreadListController(scope)`
- `useAgentThreadController(threadId)`
- `useAgentComposerController(threadId)`
- `useAgentTranscriptController(threadId, options)`
- `useAgentTranscriptScrollController(options)`
- `useAgentServerRequestController(threadId)`
- `useAgentDiagnosticsController()`

Candidate controllers that must be justified before publication:

- `useAgentAttachmentController(options)`
- any message-specific controller
- any low-level block-renderer controller

The old hooks may be removed or renamed when they obscure the model.

Controller count should stay conservative. New controllers must exist only when
they own a stable user-facing behavior boundary. Before adding a controller,
define the core store events, selectors, and action surface it composes.
Attachment behavior should be split into resource resolution primitives plus
composer integration, not duplicated across composer and transcript controllers.

### Layer 3: Styled Parts And Presets

Default styled parts should be public and replaceable, but replacement points
should be introduced gradually. Too many replacement points make the contract
hard to preserve.

Initial public replacement points:

- Layout shell.
- Sidebar.
- Empty state / start composer.
- Composer panel.
- Transcript block renderers.
- Approval surface.

Additional low-level parts can become public only after the default preset uses
them internally and tests prove their accessibility, scroll, approval anchor,
and visual contracts.

`AgentChat` remains the preset. It composes controllers and default styled
parts. It should accept a single `components` map rather than coarse slots.

```ts
export interface AgentComponents {
  Shell?: React.ComponentType<AgentShellProps>;
  Sidebar?: React.ComponentType<AgentSidebarProps>;
  EmptyState?: React.ComponentType<AgentEmptyStateProps>;
  ComposerPanel?: React.ComponentType<AgentComposerPanelProps>;
  Approval?: React.ComponentType<AgentApprovalProps>;
  blocks?: Partial<
    Record<AgentItemBlock["kind"], React.ComponentType<AgentBlockProps>>
  >;
}
```

Block replacement points should receive resolved props and a narrow `Default`
renderer. Layout-level replacement points should receive a controller/view-model
contract rather than every internal prop. Avoid broad `Default` renderers that
turn private behavior into an accidental public API.

## Thread, History, And Optimistic First Message

### Problem

Today `startThreadWithInput()` waits for `thread/start`, then sends
`turn/start`. Until `thread/start` resolves, there is no active thread,
transcript item, or thread list item. After `thread/start` resolves, the active
thread may still have an empty transcript until App Server notifications arrive.

This makes the first user message feel like it was not accepted.

### Current Contract

`startWithMessage()` should be the primary first-message action exposed through
the composer controller. It may start as an internal/source-level controller
action while the model is proven, but callers should never orchestrate rollback
and reconciliation themselves.

```ts
export interface AgentMessageOperation {
  id: string;
  status: "pending" | "reconciled" | "failed" | "rolledBack";
  threadId?: string;
  turnId?: string;
  messageId?: string;
  error?: AgentError;
  canRetry: boolean;
}
```

Behavior:

1. Generate stable pending IDs.
2. Dispatch an optimistic active thread.
3. Dispatch an optimistic pending turn.
4. Dispatch an optimistic user message item.
5. Insert the pending thread into matching thread collections.
6. Send `thread/start`.
7. Reconcile pending thread ID to canonical thread ID.
8. Send `turn/start` with `clientUserMessageId`.
9. Reconcile server user message item to the optimistic item.
10. On `thread/start` failure, rollback the whole pending thread through
    controller-owned operation state.
11. On `turn/start` failure after thread creation, keep the real thread and mark
    the pending message failed with retry.

`AgentEmptyState` and `AgentComposerPanel` should use the same composer
controller and submission semantics so first-run and normal composer behavior
cannot diverge. React consumers should observe `operations` from the controller
and call controller actions such as `retryMessage(operationId)`. They should not
manage pending promises, rollback callbacks, or unmount-sensitive optimistic
state.

## Scoped Thread Lists

Thread lists should be first-class collections.

```ts
export interface AgentThreadScope {
  key: string;
  cwd?: string | string[] | null;
  hostScopeKey?: string | null;
  archived?: boolean | null;
  searchTerm?: string | null;
  sourceKinds?: string[] | null;
  sort?: "updatedAtDesc" | "createdAtDesc" | "titleAsc";
  limit?: number;
}
```

Agent UI should not invent host scoping semantics that App Server does not
provide. It can provide:

- Stable metadata accessors.
- Scope keys.
- Client-side scope predicates for known thread metadata fields.
- Opaque host scope keys for host-owned grouping.
- Hook parameters for App Server-supported list filters.
- Docs explaining host-owned scope mapping.

Host concepts such as workspace, project, account, tenant, and product surface
must not become Agent UI core semantics. Hosts may map those concepts to an
opaque `hostScopeKey` or pass a host predicate to React controllers, but Agent
UI should not assign meaning to those fields.

`useAgentThreadListController(scope)` should own loading, pagination, refresh,
search debounce, visible IDs, selection, preview hydration, and canonical ID
reconciliation. Sidebar should be a styled preset over that controller.

## Local File And Image Resources

### Problem

Composer thumbnails work because React has a browser blob URL. Transcript
images can fail because App Server items contain local filesystem paths, and
React currently risks using that path directly as an image URL.

### Current Contract

Attachment resolution should return structured resources.

```ts
export interface AgentResolvedAttachment {
  id: string;
  input: AgentUserInput | AgentUserInput[];
  displayName: string;
  previewUrl?: string;
  localPath?: string;
  redactedPath?: string;
  mediaKind?: "image" | "video" | "file";
  sizeBytes?: number;
  mimeType?: string;
}

export type AgentLocalAttachmentResolver = (
  file: File,
  context: AgentAttachmentResolveContext,
) => AgentResolvedAttachment | Promise<AgentResolvedAttachment>;
```

Server helpers should evolve from upload-only to a local upload/media helper.
The helper is an opt-in local-first bridge utility, not an authorization layer.

```ts
export interface AgentUiLocalMediaHelper {
  directory: string;
  uploadHandler: AgentUiHttpHandler;
  serveAssetHandler: AgentUiHttpHandler;
  resolveLocalPath(path: string): AgentUiLocalFileAsset | undefined;
  urlForAsset(assetId: string): string | undefined;
  cleanup(): Promise<void>;
}
```

Rules:

- UI must not render raw local filesystem paths as `img` or `video` URLs.
- UI should prefer `displayName` and `redactedPath` over `localPath`.
- The transcript renderer should accept `resolveLocalMediaUrl(path, item)`.
- `http:`, `https:`, `blob:`, and `data:` URLs can render directly.
- Filesystem paths require a host resolver or render a fallback card.
- Static file serving is host-owned and must be covered by admission/auth docs.
- The browser-facing static route must address registered asset IDs, never raw
  paths or path-derived URL segments.

Local media helpers are local-first, single-user convenience helpers for hosts
that already own the bridge. They are not a general file server, remote storage
layer, persistence system, or authorization system.

Static serving safety requirements:

- Treat serving as disabled unless the host wires the handler intentionally.
- Never serve paths outside the configured root.
- Prevent path traversal before filesystem access.
- Use unguessable or session-scoped asset IDs by default.
- Allow host admission/session checks before serving bytes.
- Require host admission/session checks for any non-loopback or shared endpoint.
- Keep development loopback defaults visibly separate from remote-capable
  deployment guidance.
- Return a professional fallback after cleanup or missing files.
- Keep raw local paths out of browser-visible URLs.
- Document when a host intentionally sends local paths to App Server or model
  context, and when it should send only display text.

## Transcript And Density

The transcript should expose a stable view model.

```ts
export interface AgentTranscriptEntry {
  id: string;
  turnId: string;
  itemId?: string;
  role: "user" | "assistant" | "reasoning" | "tool" | "command" | "file" | "system";
  block: AgentItemBlock;
  status?: string;
  density: "inline" | "compact" | "disclosure" | "expanded";
  approvals: PendingServerRequest[];
  pending?: AgentPendingViewState;
}
```

Hosts should be able to:

- Render the default transcript.
- Use entries headlessly.
- Replace one block kind while preserving wrappers, anchors, scroll behavior,
  windowing, and fallback rendering.
- Select density by transcript, turn, item kind, or block kind.

## Composer And Attachments

Composer behavior should live in `useAgentComposerController()`. This controller
is the behavioral owner for first-run submission, normal turn submission,
queued follow-ups, stop, retry, and attachment integration. The public name can
be finalized after internal controller tests and examples prove the boundary.

It should expose:

- `value`, `setValue`
- `submitMode: "send" | "stop"`
- `canSubmit`
- `disabledReason`
- `isSubmitting`
- `isInterrupting`
- `activeTurnId`
- `queuedFollowUps`
- `submit()`
- `submitNow()`
- `stop()`
- `queueFollowUp()`
- `retryFailedMessage()`
- attachment integration through resource-resolution primitives. Publish
  `AgentAttachmentController` only if it owns behavior that is distinct from
  composer and transcript resource handling.

`AgentFirstRun` should stop duplicating composer behavior. The initial composer
and normal composer should share primitives.

## Bridge Policy And Diagnostics

Bridge configuration should be explicit and typed.

```ts
export interface AgentUiBridgePolicy {
  admission: AgentUiAdmissionPolicy;
  browser: AgentUiBrowserPolicy;
  serverRequests: AgentUiServerRequestPolicy;
  dynamicTools: AgentUiDynamicToolPolicy;
  diagnostics?: AgentUiBridgeDiagnosticsPolicy;
}
```

Server request policy should be callback-first.

```ts
export interface AgentUiServerRequestPolicy {
  decide(context: AgentUiServerRequestContext): AgentUiServerRequestDecision;
}

export type AgentUiServerRequestDecision =
  | { action: "manual" }
  | { action: "reject"; error?: AgentError; auditReason?: string }
  | { action: "respond"; response: unknown; auditReason?: string }
  | {
      action: "grantPermissions";
      permissions: AgentUiPermissionGrant;
      scope: "turn";
      auditReason?: string;
    };
```

Rules:

- Default remains manual/default-deny for privileged actions.
- Permission grants must be bounded against requested permissions.
- Unsafe no-admission bridge usage must be explicit.
- Browser method policy should be capability-based, not an opaque method list.
- Dynamic tool execution remains host-owned, but Agent UI should emit structured
  debug events for received, denied, helper-thread, MCP-call, timeout, and
  completed phases.

## Diagnostics And Health

Add structured health state for local bridge integrations:

- admission checked/rejected
- process spawned
- initialized
- connected
- idle closed
- backpressure closed
- pending requests
- stderr warnings after redaction
- dynamic tool phases
- upload/file-store readiness
- account/model/skills/thread-list readiness

React should expose this through `useAgentDiagnosticsController()`. Default UI
should keep user-facing errors separate from debug-only diagnostics.

Diagnostics should carry an explicit audience.

```ts
export type AgentDiagnosticAudience = "user" | "developer" | "audit";

export interface AgentDiagnosticView {
  id: string;
  audience: AgentDiagnosticAudience;
  severity: "info" | "warning" | "error" | "critical";
  source: "connection" | "account" | "thread" | "tool" | "bridge" | "resource";
  message: string;
  recoverability?: "retryable" | "requiresUser" | "debugOnly" | "fatal";
}
```

Examples:

- `connected`, `account ready`, and `thread list failed` can be user-facing.
- stderr warnings, admission phase details, and dynamic tool phases are
  developer or audit diagnostics unless promoted by the host.

## Package Boundary Changes

`@nyosegawa/agent-ui-core`:

- Own host integration state, events, selectors, optimistic operations, transcript view
  model, resource metadata types, and fake transport fixtures.

`@nyosegawa/agent-ui-codex`:

- Keep Codex App Server request builders and stable generated type subpaths.
- Normalize lifecycle notifications and media/resource item payloads.
- Keep browser-safe imports on documented subpaths.

`@nyosegawa/agent-ui-react`:

- Export controllers and styled parts only after their internal/source-level
  contracts are proven by examples and tests.
- Keep `AgentChat` as a preset over public parts.
- Keep one public stylesheet.
- Remove or replace incidental internal barrels if they freeze bad API.

`@nyosegawa/agent-ui-server`:

- Add local upload/media helper utilities for local-first hosts.
- Replace fragmented bridge options with typed policy.
- Add structured diagnostics and health events.

`@nyosegawa/agent-ui-web-components`:

- Pass Agent UI `agentOptions`, component replacement options where feasible, and
  local resource resolver hooks through JavaScript properties.

Package export maps should be finalized after internal module boundaries are
stable. During implementation, distinguish:

- Internal module boundaries.
- Public source-level package API.
- Published export-map API.

Do not freeze incidental exports simply because a barrel currently exposes them.
Do not hand-edit generated schema or dist output while moving package surfaces.

## Design Review Gates

Before implementation proceeds past each major boundary, run a design review and
record the decision in the PR or a short design note.

Required gates:

1. Public thread view model versus internal normalized entity.
2. Optimistic first-message operation model.
3. Local media helper security and naming.
4. Controller count and controller responsibilities.
5. Component replacement map scope.
6. Bridge policy and diagnostics audience.
7. Example shape before package export changes.
8. Package export map before release validation.

Each gate should explicitly answer:

- What remains internal?
- What becomes public?
- What host responsibility is intentionally not handled?
- Which example proves the design?
- Which tests protect the contract?

## Example Redesign

Examples must change with the API. They are validation targets.

### `examples/codex-local-web`

This is the canonical full local integration.

It should demonstrate:

- Same-origin WebSocket bridge.
- Explicit bridge policy.
- Local media helper with upload and asset serving.
- `resolveLocalAttachment` returning structured attachment metadata.
- `resolveLocalMediaUrl` for transcript media.
- Atomic first message with optimistic UI.
- Thread URL routing.
- Sidebar collection scopes.
- Diagnostics/health panel.
- Browser e2e for local image transcript display.

### `examples/local-react-vite`

This is the fixture-backed visual contract.

It should demonstrate:

- Default `AgentChat` unchanged visual baseline.
- Mobile empty state and first composer.
- Sidebar drawer search/select.
- Custom `components` map.
- Custom block renderer with `Default` fallback.
- Transcript density modes.
- Attachment fallback card when local media URL is unavailable.
- Optimistic first message fixtures.

### `examples/recipes`

Recipes should be small and typed.

Recommended recipes:

- `headless-chat-controller`
- `scoped-thread-list`
- `host-owned-composer`
- `local-media-helper`
- `custom-transcript-blocks`
- `bridge-policy`
- `diagnostics-panel`
- `host-integration-checklist`

### `examples/next-with-bridge-sidecar`

Keep this as the full-chat Next.js example. It should use the typed bridge
policy and file-store shape.

### `examples/next-rpc-route`

Keep this intentionally narrow. It should not power chat. It should document
read/list/status-only one-shot behavior.

## Documentation Redesign

Docs must be updated as part of implementation, not after.

Required docs:

- Architecture overview
- Product boundary
- Security
- Testing
- Package exports
- React guide
- Hooks/controllers reference
- React components/parts reference
- Server bridge reference
- Attachments and local resources guide
- Approvals and server requests guide
- Diagnostics guide
- Examples docs
- Migration guide
- Release checklist

The host-consumer migration guide should be first-class in
`docs/guides/host-integration.md`. It should include package-by-package
breaking changes, example diffs, validation steps, and what Agent UI does not
promise.

## Validation Strategy

Focused unit tests:

- Core lifecycle reducer.
- Thread collection scoping and pagination.
- Optimistic first message reconcile/rollback/retry.
- Local resource metadata and redaction.
- Transcript entry generation and density.
- Permission policy bounding.
- Bridge policy method categories.

React tests:

- Controllers return stable state/actions.
- First-run and normal composer share submit semantics.
- Attachment/resource primitives handle preview, failure, retry, and cleanup
  without duplicating composer and transcript behavior.
- Custom components preserve default wrappers.
- Transcript media fallback avoids broken raw-path images.

Server tests:

- Local file store upload/static/cleanup/security.
- Bridge policy admission and unsafe explicit mode.
- Structured diagnostics events.
- Server request policy context and bounded grants.

Browser tests:

- `agent-browser` real local checks for default UI.
- First message appears immediately before server echo.
- Local image appears in composer and transcript.
- Missing local media renders fallback.
- Mobile empty state and sidebar drawer.
- Custom component map preserves approval anchors and scroll.

Release validation:

- `bun run validate:fast`
- `bun run validate:protocol`
- `bun run build`
- `bun run validate:packages`
- `bun run test:api-snapshots`
- `bun run test:package-resolution`
- `bun run validate:release`
- `bun run validate:e2e`
- GitHub Actions watched to concrete pass/fail before claiming readiness.

## Success Criteria

This work is complete only when:

- The default UI remains polished on desktop and mobile.
- A host can build a custom shell without reimplementing hidden Agent UI
  behavior.
- First message submission is visibly accepted immediately.
- Local images render through an explicit host resource contract or degrade to
  a professional fallback.
- Thread history, active thread, scoped lists, and previews cannot drift through
  implicit state races.
- Server bridge policy and diagnostics are explicit, typed, and documented.
- Examples use the intended current host integration API shape.
- Docs and migration guidance are complete enough for a consumer to upgrade.
- Tests and browser checks cover the behavior that motivated the redesign.
