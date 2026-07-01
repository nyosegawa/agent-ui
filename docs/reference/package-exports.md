# Package Exports

## Package Set

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

Packages are split by responsibility, but the local bridge is included in the official package set.

## Common Import Paths

| Package                              | Common public imports                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `@nyosegawa/agent-ui-react`          | Root `AgentProvider` / `AgentChat`, `/primitives` visual building blocks, `/headless` controllers, `styles.css`         |
| `@nyosegawa/agent-ui-server`         | Root bridge, local media, policy, redaction, one-shot RPC helpers; `/advanced` raw stdio/process helpers                |
| `@nyosegawa/agent-ui-codex`          | Root protocol/session facade, `/websocket`, `/request-builders`, `/clients`, `/session`, `/normalizer`, `/stable-types`, `/test-fixtures` |
| `@nyosegawa/agent-ui-core`           | Root state, transport, selectors, reducer, fake transport; `/internal` only for Agent UI packages and repository tests  |
| `@nyosegawa/agent-ui-web-components` | Root custom element definition and element option types                                                                 |

Host apps should import package names and documented subpaths only. Do not
import `dist/*`, source files, generated schema chunks, or
`@nyosegawa/agent-ui-core/internal` from host code.

## Export Freeze Policy

The export map should change only when controller, resource, bridge, and
diagnostics boundaries have been proven together. Each promoted public export
must have all of the following before it becomes part of the package contract:

- an intentional export-map entry or package-root barrel export
- a canonical reference doc in this page or the package-specific reference page
- an example or recipe that imports the public surface through the package name
- a focused test, API snapshot, or package-resolution gate that protects that
  import

Source-level modules can remain usable inside the repository without becoming
published package API. Internal reducer reconciliation, optimistic operation
maps, local media temp-file lookup, bridge process lifecycle internals,
generated Codex schema files, bundled declaration chunks, private CSS chunks,
and `.aui-*` implementation selectors stay outside the public contract unless a
later design gate explicitly promotes them.

Declaration snapshots are the contract guard for this redesign. Root, React
headless, and React primitives must expose raw-free view models, explicit
controller actions, and host-policy callback contexts instead of reducer store
state, generated protocol payloads, or child-process internals. Remove old
shapes instead of preserving them when the cleaner view-model/controller API
replaces them.

Agent UI package exports also do not make host runtime policy public. Hosts
still own non-loopback bridge admission, hosted auth, persistence, tenant and
workspace isolation, audit sinks, upload/static authorization, process
supervision, billing, and deployment policy.

## Export Inventory

This inventory was verified from `test/api-snapshots/*.d.ts` with
`bun run test:api-snapshots` on 2026-06-29. Freeze the export map only after
internal boundaries, examples, tests, and host integration docs agree.

### `@nyosegawa/agent-ui-core`

Keep public: `AGENT_RETENTION_POLICY`, `FakeAgentTransport`,
`FakeAgentTransportOptions`, `FakeTransportRequest`, `AgentTransport`,
`AgentTransportEvent`, `AgentRequestOptions`, `RequestId`, `RequestIdKey`,
`requestIdKey`, `AgentEvent`, product-domain event/state/view types for account,
apps, connection, diagnostics, hooks, models, run settings, skills, status
banners, turns, usage, warnings, and raw-free thread views,
`AgentDiagnosticAudience`, resource metadata types
(`AgentItemBlockResource`, `AgentItemBlockResourceKind`), `agentReducer`,
`createInitialAgentState`, opaque `AgentSessionState`, and selectors for apps,
diagnostics, audience-filtered diagnostics, approval views, protocol
notifications, run settings, server-request summaries, status banners, thread
collection metadata, thread runtime/execution state, thread summary views,
transcript views, and usage.

Implementation boundary: `@nyosegawa/agent-ui-core/internal` exposes raw
normalized store state, raw reducer selectors, and fixture helpers for Agent UI
packages and repository tests. It is not the host integration path and must not
be used to justify adding raw store shape back to the root export.

Replaced by the current API: registry-bucket public shapes
(`ThreadRegistryState`, `ThreadRegistryStatus`, and `selectThreadRegistry`)
were removed in favor of explicit thread lifecycle state, scoped collections,
active-thread selectors, pending operation selectors, runtime-aware
`AgentThreadSummaryView`, raw-free transcript selectors, and the separate
public `AgentThreadView`.

Moved to implementation boundary or made view-model-only at root: raw normalized
`AgentSessionState`, `ThreadState`, `AgentItemBlock`, raw transcript block
selectors, ordered raw thread/turn/item selectors, pending raw approval
selectors, server-request queue selectors, and `runEventFixture`. Transcript
blocks now expose display-oriented fields such as `argumentsText`,
`resultText`, `errorText`, and `files` instead of raw `arguments`, `result`,
`error`, `changes`, or `metadata`. Public controllers should consume view
models rather than asking hosts to inspect raw store shape.

Make private: reducer-internal registry/retention helper behavior and any
canonical-ID reconciliation detail that is not part of an explicit diagnostic
surface.

Remove: no compatibility aliases are retained for the removed raw root
selectors or raw root state shape.

### `@nyosegawa/agent-ui-codex`

Keep public: protocol capability metadata and guards
(`CODEX_PROTOCOL_COMMIT`, `CODEX_PROTOCOL_GENERATED_AT`,
`codexCapabilityMetadata`, `getCodexCapabilityStatus`,
`isStableProductizedMethod`, `isHostOnlyMethod`,
`isExperimentalAvailableMethod`, `isExperimentalUnsupportedMethod`,
`assertCodexProductizedMethod`, `assertCodexExperimentalMethod`, stable and
experimental method lists), stable server-request role metadata and guards
(`codexServerRequestMethodMetadata`, `getCodexServerRequestMethodMetadata`,
`isCodexApprovalDecisionServerRequestMethod`, and
`isStableServerRequestMethod`), `CodexSession`, `createCodexSession`,
`createCodexClients`, grouped client classes, JSON-RPC helpers,
`createCodexStdioTransport`, `createCodexWebSocketTransport`,
`createCodexSdkTransportAdapter`, `startDeviceCodeLogin`, and
`cancelDeviceCodeLogin`.
Keep the WebSocket transport bearer-subprotocol helper
`createAgentUiBearerSubprotocol()` public for browser hosts that need to pass a
short-lived bridge token through the WebSocket handshake without query strings
or impossible custom headers.

Move to subpath: generated method params/results and request-construction
types should stay on `stable-types`, `clients`, `request-builders`, or
`normalizer` subpaths instead of the root. Normalizers such as
`normalizeThreadLoadedListResponse`, `normalizeThreadListResponse`,
`normalizeThreadReadResponse`, `normalizeThreadResumeResponse`,
`normalizeTurnsPage`, `normalizeAppsListResponse`, and
`normalizeCodexServerMessage` are host-owned lower-level helpers and should be
imported from `@nyosegawa/agent-ui-codex/normalizer`.
Request builders such as `textInput()` and `TextInputOptions` remain on the
`request-builders` subpath; hosts may pass generated `TextElement` values
explicitly, but Agent UI does not derive App/Plugin or marketplace semantics
from those elements.
Success-path Codex App Server fixtures remain on the
`@nyosegawa/agent-ui-codex/test-fixtures` subpath. They are public because new
host apps need a stable way to exercise `thread/start`, `turn/start`, streamed
assistant deltas, queued `turn/steer`, `turn/interrupt`, and `turn/completed`
without copying repository-only fake servers. They are not a production
process, authentication, storage, admission, or bridge-policy runtime.

Replace with current API: lifecycle-dependent normalizer contracts that still
produce old registry status names should be updated after protocol
classification.

Make private: generated source-level chunks and aliases surfaced only because
declaration bundling uses chunk names. Root imports should not expose generated
schema internals as the normal integration path.

Remove: unsupported or test-only protocol helpers, including default React use
of `thread/items/list`, must not be promoted.

### `@nyosegawa/agent-ui-react`

The React package has three public JavaScript entrypoints:

- `@nyosegawa/agent-ui-react`: default preset entry. Exports
  `AgentProvider`, `AgentChat`, `defaultAgentComponents`, `AgentComponents`,
  `AgentChatProps`, `AgentTranscriptDisplay*` display policy types, and i18n
  provider/dictionary helpers.
- `@nyosegawa/agent-ui-react/primitives`: visual composition entry. Exports
  shell, thread, transcript, composer, approval, status, usage, apps, skills,
  i18n, theme, run-settings, diff, local resource, and transcript item
  primitives backed by stable view models.
- `@nyosegawa/agent-ui-react/headless`: controller entry. Exports
  `AgentProvider`, public hooks/controllers, input/resource types, run-policy
  helpers, usage helpers, and i18n helpers for hosts that own layout.

Keep root small. New host-composition surfaces should go to `primitives` or
`headless`; root should stay the drop-in preset API.

Replace with current API: `AgentChatSlots` has been removed in favor of the
single `AgentComponents` map and `defaultAgentComponents`. The accepted
replacement points are `Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`,
`StatusBar`, `ThreadHeader`, `Approval`, and transcript `blocks`. `AgentChat`
also exposes `startOptions` for fixed first-thread and first-turn policy,
`threadHeaderEnd` for per-thread header actions, and `controls` for coordinating
the preset-owned mobile history drawer and context sheet with host overlays.
Transcript item customization uses `renderItem(entry, Default)` with
`AgentTranscriptEntry`; raw `components.Item` replacement is removed. Lower-level
scroll containers, approval anchor placement, composer toolbar internals,
attachment mutation controls, sidebar pagination internals, and generated block
normalization remain internal/source-level boundaries;
`useAgentThreadController`, `useAgentThreadHistory`, `useAgentThreadReader`,
`useAgentThreadListController`, `useAgentComposerController`,
`useAgentChatController`, `AgentComposerController`, `AgentChatController`,
`ThreadList`, and `AgentThreadSidebar` are rebuilt on explicit session,
active-thread, thread-list, composer, transcript, scroll, server-request, and
diagnostics controllers. The generic `AgentWorkspace` side-panel preset is
removed; hosts compose their own layout around `AgentChat` and primitives.
`startThreadWithInput()` is not a thread hook method;
the raw-free first-message start behavior is public on
`AgentComposerController` as
`startThreadWithInput(input, { threadOptions, turnOptions })`, while the
root preset external-send path is public on `AgentChatController` as
`sendMessage(input, { threadOptions, turnOptions })`. Host UI that uses
`AgentChat` should call that controller instead of directly sequencing
transport requests. `AgentChatSlots`, raw `components.Item`, private status
props, and legacy transcript density props are not supported; use
`transcriptDisplay` on
`AgentChat`, `AgentThreadView`, `AgentMessageList`, or
`useAgentTranscriptController()` for semantic transcript display policy.
`AgentTranscriptEntry` exposes `category`, `displayLabelKey`, resolved
`density`, and `visibility` for host renderers, while `components.blocks`
continues to dispatch by normalized `block.kind`. Header DOM selectors and
direct local media paths are not migration targets;
use the `AgentChat` `components` prop, `renderItem` /
`components.blocks`, `statusBarEnd` / `threadHeaderEnd`, and structured media
resolvers.
The source-level internal composer controller keeps its implementation helper named
`startWithMessage()`.
External UI that needs to send into the active `AgentChat` flow should use
`useAgentChatController().sendMessage(input, options)`. It returns
`started`, `sent`, `queued`, or `blocked` result objects and forwards
`turnOptions` for active idle threads while creating an optimistic user message
with `clientUserMessageId`; hosts should not recreate that lifecycle with
direct transport calls. Blocked results carry `AgentComposerBlockedReason`,
matching the core thread waiting reasons instead of collapsing every wait state
to approval.
React image input uses `AgentImageInput { type: "image", url }`, matching the
Codex stable input shape. `image_url` is not a React public API.
Approval composition uses raw-free `AgentApprovalRequest` view models. The
headless `useAgentApprovals()` hook returns command/file approval views and an
`approve(requestId, decision?: AgentApprovalDecision)` controller where
`decision` is `accept`, `acceptForSession`, or `decline`; internal upstream
legacy decision names are not host-facing. `AgentApprovalQueue`, the
`AgentChat` `components.Approval` replacement, `AgentThreadTimeline.renderApproval`,
and transcript approval anchors accept the same `AgentApprovalRequest` view type.
File-change approvals carry renderable patch views, including structured
changed-file entries, instead of requiring hosts to inspect generated
`fileChanges` payloads.
Broader server requests remain on `useAgentServerRequests()` as summaries plus
neutral `respond()` / `reject()` because their response payloads are
method-specific host policy, not approval UI decisions.

Keep off root: transcript-window utilities
(`DEFAULT_TRANSCRIPT_ITEM_LIMIT`, `TRANSCRIPT_ITEM_INCREMENT`,
`visibleTranscriptWindow`), lower-level input/resource helpers, visual
primitives, and headless controllers. Thread raw snapshot helpers such as
`threadSnapshotEvents`, `threadUpsertEvent`, `threadProjectPath`, and
`rawThreadId` are internal compatibility plumbing for React's Codex-backed
hooks, not React public API.

Make private: raw old state-name helpers, internal `.aui-*` styling details,
queue implementation objects, and any hook return that exposes optimistic
operation internals instead of public pending message state.

Remove: compatibility aliases that only preserve unshipped branch behavior.

### `@nyosegawa/agent-ui-server`

Keep public: `attachAgentUiWebSocketBridge`,
`handleAgentUiWebSocketConnection`, `createAgentUiNextRpcRoute`,
`createAgentUiExpressMiddleware`, one-shot method policy helpers, high-level
`CodexAppServerOptions`, bridge option types, browser method capability policy
types, `AgentUiBridgePolicy` admission mode types, structured bridge
rejection/result types such as `AgentUiBridgeRejection`,
`AgentUiBridgeResult`, `AgentUiBridgeAdmissionDecision`, and
`AgentUiBridgeRejectionReason`,
bearer WebSocket subprotocol parser/verifier helpers
`parseAgentUiBearerSubprotocol()` and `verifyAgentUiBearerSubprotocol()`,
`AgentUiDynamicToolPolicy`, dynamic tool handler/helper types and explicit MCP
mapping factories, dynamic tool debug event types, host event sink helpers,
bridge health event types, context-rich server-request policy callback/helper
types including command and file-change approval policy callbacks, redaction
helpers, `createAgentUiLocalMediaHelper()`, and the upload-only
`createAgentUiLocalUploadHandler()` / `AgentUiUploadHandler` surface.
`createAgentUiLocalMediaHelper()` is the broader local media helper that returns
path, URL, asset ID, display name, redacted path, MIME type, and byte size while
keeping static serving explicitly host-wired. `createAgentUiLocalUploadHandler()`
remains public for hosts that only need browser `File` to local-path upload
adaptation.

Advanced subpath: `@nyosegawa/agent-ui-server/advanced` exports
`createCodexAppServerBridge`, `CodexAppServerBridgeOptions`,
`CodexAppServerBridge`, `CodexChildProcess`, `CodexSpawnOptions`, and the
dynamic tool helper-thread functions `handleDynamicToolRequest`,
`createDynamicToolHelperThread`, `maybeResolveHelperThreadRequest`, and
`dynamicToolFailure`. These are explicit process/stdio composition surfaces,
not the default React workflow.

Keep off root: bridge process lifecycle internals and raw child-process details
that hosts do not need for admission, diagnostics, or shutdown policy. Root
bridge and one-shot options expose only `cwd`, `env`, `initialize`, `shutdown`,
and `stderr` from the App Server launch configuration.

Remove: `defaultDynamicToolHandler` was removed; hosts now choose
`dynamicToolPolicy: { mode: "disabled" }`, provide a host callback, or wrap the
explicit `createMcpDynamicToolHandler()` mapping helper.

### `@nyosegawa/agent-ui-web-components`

Keep public: `defineAgentChatElement`, `AgentChatElement`,
`AgentChatElementOptions`, `AgentChatWebComponentElement`, and the JavaScript
property contract for `transcriptDisplay` / `transcriptMode`.

Replace with current API: `AgentChatElementOptions.components` follows the React
`components` replacement map. `transcriptDisplay` and `transcriptMode` mirror the
React `AgentChat` display policy surface.

Move to subpath: none at this gate.

Make private: element render internals and React root lifecycle details.

Remove: none at this gate.

### Validated Import Sites

Examples that prove the current package surface: `examples/local-react-vite`
uses the React root and current component map, `examples/codex-local-web` uses
the server bridge and local media helper, `examples/next-with-bridge-sidecar`
uses the typed bridge policy and local upload/static routes,
`examples/docs-site` imports public React surfaces, and `examples/recipes`
imports current host integration recipes.

Docs that describe the current API: `docs/reference/hooks.md`,
`docs/reference/react-components.md`, `docs/reference/react-protocol-coverage.md`,
`docs/reference/server-bridge.md`,
`docs/guides/react.md`, `docs/guides/attachments.md`,
`docs/guides/theming.md`, `docs/guides/i18n.md`,
`docs/guides/approvals.md`, `docs/guides/web-components.md`,
`docs/guides/host-integration.md`, and `docs/examples/*`.

Resource resolution exports live on `@nyosegawa/agent-ui-react/headless` and
`@nyosegawa/agent-ui-react/primitives` as browser/UI metadata boundaries:
`AgentResolvedResource`, `AgentResourceKind`, `AgentFileResourceRequest`,
`AgentLocalMediaResourceRequest`, `AgentResourceRequest`,
`AgentResourceResolution`, `AgentResourceResolver`,
`AgentLocalMediaUrlResolver`, `agentResourceUrl`, and
`agentResourceDisplayName`. Composer-local upload metadata such as
`AgentResolvedLocalAttachment` lives on
`@nyosegawa/agent-ui-react/primitives` because it is tied to the visual
composer attachment surface. These are not host upload, storage,
authorization, static-serving policy, or host capability-registry semantics.
Resource resolution returns structured `AgentResolvedResource` objects; URL
string shorthand is not part of the public contract.

Composer controller exports on `@nyosegawa/agent-ui-react/headless` include
the raw-free `AgentComposerController` view plus `AgentComposerSubmitMode`,
`AgentComposerDisabledReason`, `AgentComposerBlockedReason`,
`AgentComposerFailedPendingMessage`, `AgentComposerIntegration`,
`AgentComposerIntegrationAttachment`, and `AgentComposerIntegrationResolver`.
`AgentComposerSubmitMode` is `"send" | "stop"`; queued follow-ups are local
composer state, not a third submit-button mode. Internal provider-scoped
first-message operation maps, rollback payloads, and generated protocol
payloads remain source-level only. `AgentComposerFailedPendingMessage.retryable`
is the public signal for whether Retry can be offered after remount or
initial-state hydration.

Thread lifecycle controller exports may add raw-free start/resume result or
handle types only after the implementation, examples, tests, and snapshots use
the same names. The public result contract for `AgentThreadStartResult`,
`AgentThreadStartWithInputResult`, and `AgentThreadResumeResult` is:

- `threadId` is the canonical id the host should persist after start, first
  message start, or resume.
- `requestedThreadId` is optional diagnostic metadata for resume paths where
  the host asked for an alias or stale persisted id.
- Resume may also return raw-free `status`, `activity`, `activeTurnId`,
  `waitingReasons`, and `runSettings` metadata so hosts can distinguish idle
  resumes from rejoined running or input-waiting threads without inspecting App
  Server payloads.
- First-message start returns stable `operationId`, `turnId`,
  `optimisticTurnId`, and `userMessageId` metadata as Agent UI view-model
  fields, not as a generated `ThreadStartResponse` or `TurnStartResponse`.
- First-message `turnId` is the App Server turn id returned by `turn/start`
  when available; `optimisticTurnId` is the transient UI turn id used before
  live turn notifications reconcile the first user message.
- Raw App Server responses, generated protocol payloads, optimistic operation
  maps, canonical-id alias maps, and reducer reconciliation records stay out of
  the React package root.

Server bridge exports include a per-connection resolver type as a thin
option-resolution boundary before spawn. The exported shape covers explicit
bridge options such as `cwd`, `env`, `initialize`, `bridgePolicy.admission`,
`browserMethodPolicy`, `serverRequestPolicy`, `dynamicToolPolicy`, `hostEvents`,
inbound limits, idle timeout, and backpressure settings without introducing auth
providers, token stores, workspace registries, tenant/session models, or process
supervisors.

Composer styled parts exported from `@nyosegawa/agent-ui-react/primitives` are
`AgentComposer`, `AgentComposerInput`, `AgentComposerToolbar`,
`AgentAttachmentChips`, `AgentComposerSubmitButton`, and
`AgentStartComposer`. They expose browser UI composition surfaces while keeping
attachment mutation, preview revocation, queued attachment restore, and
first-message rollback internals private.

Tests encoding old state names or old hook behavior:
`packages/core/test/reducer.test.ts`, `packages/core/test/public-surface.test.ts`,
`packages/react/test/components.vitest.tsx`, React e2e files under
`examples/local-react-vite/e2e`, real-local e2e files under
`examples/codex-local-web/e2e`, `test/api-snapshots/*.d.ts`,
`test/runtime-export-policy.test.ts`, and `packages/web-components/test`.

## Monorepo Layout

```text
agent-ui/
  packages/
    core/
    codex/
    react/
    server/
    web-components/
  examples/
    codex-local-web/
    docs-site/
    local-react-vite/
    next-rpc-route/
    next-with-bridge-sidecar/
    recipes/
  docs/
```

## `@nyosegawa/agent-ui-core`

Core state and protocol-neutral primitives.

Responsibilities:

- normalized event model
- request/response abstraction
- reducer and state machine
- selectors
- transport interface
- fake transport
- fixture utilities

The package root exports these building blocks directly: state/event/transport
types, reducer and selector helpers, `FakeAgentTransport`, fixture utilities,
and the default retention policy constant. Item blocks may expose
protocol-neutral resource metadata for browser-safe URLs and host-resolved local
media paths; upload, authorization, static serving, and path-to-URL policy stay
outside core. Store singletons, store interfaces, retention helper internals,
and reducer-internal commit/merge helpers are not part of the root public API.
JSON-RPC framing and generated App Server schema are Codex adapter
responsibilities, not core responsibilities.

Must not include:

- React
- Node child process management
- generated Codex types
- Codex request builders
- generic/non-App-Server SDK adapters

## `@nyosegawa/agent-ui-codex`

Codex App Server adapter.

Responsibilities:

- vendored generated schema kept in the source repository, not the published
  package packlist
- stable protocol type mapping
- JSON-RPC-lite request correlation
- stdio transport
- optional websocket transport
- initialize handshake
- server request response handling
- App Server notifications to normalized events
- device-code login request helpers
- optional Codex SDK-like client adapter for hosts that already own a compatible client
- success-path App Server test fixture for host validation
- generated-schema-backed input helpers for text, images, mentions, skills, and
  agent-browser verification turns

The package root exports the protocol/session/transport facade: JSON-RPC
helpers, protocol capability metadata, session helpers, stdio transport,
WebSocket transport, SDK adapter, and auth helpers. Browser code should import
the browser-safe grouped clients from
`@nyosegawa/agent-ui-codex/clients`, the stable session facade from
`@nyosegawa/agent-ui-codex/session`, normalized event helpers from
`@nyosegawa/agent-ui-codex/normalizer`, and the WebSocket transport from
`@nyosegawa/agent-ui-codex/websocket` so Node stdio code stays out of the browser
bundle.

Default support is stable App Server API only. Experimental API requires
explicit opt-in. Generated stable App Server types are an advanced public
type-only surface at `@nyosegawa/agent-ui-codex/stable-types`; the grouped typed
client surface lives at `@nyosegawa/agent-ui-codex/clients`; request builders
and structured user-input helpers live at
`@nyosegawa/agent-ui-codex/request-builders`; and host-owned normalization
helpers live at `@nyosegawa/agent-ui-codex/normalizer`. The in-memory success
fixture for host tests lives at `@nyosegawa/agent-ui-codex/test-fixtures`.
Request builders are the
preferred raw-free request boundary: their public path fields use Agent UI-owned
string aliases such as `AgentWorkingDirectory`, `AgentResourcePath`,
`AgentSkillPath`, and `AgentMentionPath` instead of generated schema names such
as `LegacyAppPathString` or `AbsolutePathBuf`. They intentionally remain string
aliases because filesystem authority belongs to the host; Agent UI does not
invent URI-shaped filesystem strings or opaque path objects.
The client and session facades still return generated response types for
productized stable methods, and experimental calls use generated params/results
once the host opts in. Those are generated-backed advanced surfaces; use
`request-builders` for preferred product request input shapes. `requestRaw()` is
the intentionally untyped escape hatch.
Protocol capability metadata and guards are exported from the package root so
hosts can distinguish stable productized, stable host-only, stable available,
experimental available, and experimental unsupported methods before making
dynamic requests.
Undocumented deep imports such as
`@nyosegawa/agent-ui-codex/src/generated/stable` and
`@nyosegawa/agent-ui-codex/generated/stable` are blocked by the export map.
Generated source files are not published; hosts that need App Server types
should use `@nyosegawa/agent-ui-codex/stable-types` or the typed client and
request-builder subpaths.

The `test-fixtures` subpath intentionally covers only the success-path protocol
shape that host tests commonly need: canonical thread ids, thread start/read,
turn start, assistant deltas, queued steer, interrupt, and completion events.
Use it to test the host's Agent UI wiring. Do not use it as evidence that
bridge admission, bearer tokens, App Server process lifecycle, upload storage,
or multi-user authorization are production-ready; those policies remain
host-owned and need separate validation.

The SDK adapter is not the primary integration path and does not add an `@openai/codex` runtime dependency.

## `@nyosegawa/agent-ui-react`

React UI and hooks.

Responsibilities:

- root drop-in preset: `AgentProvider`, `AgentChat`, `AgentComponents`,
  `AgentChatProps`, `defaultAgentComponents`, and supporting preset prop types
- `/primitives` visual composition API for hosts that own layout
- `/headless` hooks, controllers, input/resource types, run-policy helpers,
  transcript-window helpers, usage helpers, and i18n helpers
- `--aui-*` design-system tokens and the bundled plain CSS theme

The package root intentionally does not re-export the full primitive or
headless surface. Advanced hosts should import visual building blocks from
`@nyosegawa/agent-ui-react/primitives` and controllers from
`@nyosegawa/agent-ui-react/headless`.

React does not export Codex request builders such as `threadStartParams()`,
`turnStartParams()`, `textInput()`, `localImageInput()`, Agent UI path aliases,
or generated Codex method parameter types. Hosts that need to construct App
Server request params or structured user input should import them from
`@nyosegawa/agent-ui-codex/request-builders` or use a host-provided Codex
session/controller.

The default UI is transcript-first. Usage, diagnostics, status summaries, run
settings, and side panels are exported as host-composition primitives instead
of being mandatory chat chrome.
Theme and locale state are also host-owned: `AgentChat` and `AgentShell`
accept an optional `theme` prop, `AgentChat` accepts `locale` and `messages`,
and `AgentThemeToggle` / `AgentLocaleSelect` are controlled primitives hosts
can render outside the transcript surface.

The only public stylesheet export is
`@nyosegawa/agent-ui-react/styles.css`. Package builds copy private style chunks
under `dist/styles/*` for the bundled stylesheet only. Hosts should not import
`dist/styles/*` or rely on internal `.aui-*` selectors as a styling contract.
The stable customization surface is the public `--aui-*` token set, plus
documented component props, the `components` map, render props, and `className`
attachment points.

The default UI keeps the high-traffic surfaces split internally:

- `primitives.ts`: public visual composition entry; `components/chat.tsx`, `components/thread.tsx`, `components/composer.tsx`, `components/run-settings.tsx`, `components/status.tsx`, `components/sidebar.tsx`, `components/approvals.tsx`, and `components/locale.tsx`: responsibility-scoped React surfaces
- `index.ts`: root preset entry
- `primitives.ts`: visual composition entry
- `headless.ts`: controller/type entry
- `i18n.tsx`: compatibility barrel for the i18n public API
- `i18n/`: locale normalization, interpolation, provider runtime, i18n types, and built-in locale dictionaries
- `timeline.tsx`: public transcript primitives and turn ordering; focused modules under `timeline/` own block synthesis, approval anchors, item renderers, scroll-follow behavior, visible-window state, formatting, and closed-card previews
- `transcript-window.ts`: large hydrated transcript item ordering and incremental window policy
- `diff-viewer.tsx`: read-only diff rendering and patch payload normalization

React must be a peer dependency.

## `@nyosegawa/agent-ui-server`

Node and framework integration.

Responsibilities:

- high-level local WebSocket bridge
- advanced raw stdio bridge subpath for hosts that own process details
- Next.js one-shot RPC Route Handler helper
- same-origin WebSocket bridge helpers for full chat integrations
- local upload helper for browser `File` to App Server-readable path adapters
- Express middleware
- dynamic tool mapping helpers, server-request policy helpers, host-event
  sinks, and redaction utilities
- auth/token forwarding recipes

Browser packages must not spawn child processes directly.

## `@nyosegawa/agent-ui-web-components`

Custom element wrapper for host applications that do not want to mount React directly.

Responsibilities:

- define `<agent-chat>` or a caller-supplied tag name
- accept `transport`, `initialState`, `components`, `transcriptDisplay`,
  `transcriptMode`, and `agentOptions` as JavaScript properties
- keep registration deterministic: no-DOM registration returns `undefined`,
  same-tag registration is idempotent, and foreign tag collisions throw
- treat `agentOptions` as a complete replacement for transport, initial state,
  component replacements, transcript display policy, transcript mode, and class
  name
- pass `agentOptions.className` or the observed `chat-class` attribute through
  to the rendered `AgentChat`
- remount `AgentProvider` when `transport` or `initialState` changes
- render the standard React `AgentChat` inside `AgentProvider`

The wrapper does not create transports, spawn Codex, or include CSS
automatically. Hosts should import `@nyosegawa/agent-ui-react/styles.css`.
Token overrides on the custom element or a wrapper are the supported styling
path. `chat-class` is the only observed attribute; other options stay as
JavaScript properties because they carry objects or functions.

## Examples

- `examples/local-react-vite`: fixture-backed local component smoke target.
- `examples/codex-local-web`: real local Codex web app target using a same-origin WebSocket bridge to `codex app-server --listen stdio://`.
- `examples/next-rpc-route`: Next.js one-shot RPC Route Handler example. It is not the chat-capable bridge.
- `examples/next-with-bridge-sidecar`: Next.js full-chat example using a custom Node server with `attachAgentUiWebSocketBridge()`.
- `examples/recipes`: typed host integration recipes and remote deployment notes.
- `examples/docs-site`: small package-overview/demo landing page. It is not a markdown documentation renderer.

Route-focused public fixtures such as `/showcase/composed-shell`,
`/showcase/composer-primitives`, `/showcase/transcript-content`,
`/showcase/approvals-status`, `/showcase/thread-navigation`,
`/showcase/usage-only`, `/showcase/app-connectors`, and `/showcase/host-workflow-recipe` live inside
`examples/local-react-vite` and are documented under `docs/examples/`.

## Browser Public API

```tsx
import { AgentProvider, AgentChat } from "@nyosegawa/agent-ui-react";
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";

const transport = createCodexWebSocketTransport({
  url: "ws://127.0.0.1:5175/agent-ui/ws",
  initialize: {
    capabilities: {
      experimentalApi: false,
      requestAttestation: false,
    },
    clientInfo: {
      name: "agent_ui_example",
      title: "Agent UI Example",
      version: "0.1.0",
    },
  },
});

export function App() {
  return (
    <AgentProvider transport={transport}>
      <AgentChat />
    </AgentProvider>
  );
}
```

Browser hosts connect to a host-owned WebSocket endpoint. Node hosts normally
use the root WebSocket bridge. Hosts that intentionally compose their own stdio
process bridge use the advanced subpath:

```ts
import { createCodexAppServerBridge } from "@nyosegawa/agent-ui-server/advanced";

const bridge = createCodexAppServerBridge({
  initialize: {
    capabilities: {
      experimentalApi: false,
      requestAttestation: false,
    },
    clientInfo: {
      name: "agent_ui_host",
      title: "Agent UI Host",
      version: "0.1.0",
    },
  },
});

await bridge.transport.connect();
```

Headless usage:

```tsx
import {
  useAgentApprovals,
  useAgentComposerController,
  useAgentThreadController,
} from "@nyosegawa/agent-ui-react/headless";

const thread = useAgentThreadController(threadId);
const approvals = useAgentApprovals(threadId);
const composer = useAgentComposerController(threadId);
```

## Export Boundary Gates

The package boundary is mechanically checked after `bun run build:packages`:

- `bun run test:api-snapshots` reads every package `exports` map and compares
  only public declaration targets with `test/api-snapshots/*`. Missing,
  changed, and stale snapshots fail unless `bun run test:api-snapshots:update`
  is run intentionally. If a declaration target is missing because package
  output has not been built, the script reports the missing export target and
  asks for `bun run build:packages` or `bun run validate:packages` instead of surfacing a
  raw filesystem error. The check also normalizes private hashed declaration
  chunk names before comparing snapshots and verifies import/require declaration
  parity for each exported subpath. Internal declaration chunks generated by the
  bundler, including hashed `.d.ts` files, are not public API snapshots unless
  they are reachable from an export map.
- `bun run test:packlist` runs after `bun run build:packages` in `bun run
validate:packages`. It dry-runs each package packlist and rejects unexpected
  source files, stale build artifacts, and private generated files outside the
  current allowed publish surface.
- `bun run test:package-resolution` reads the same export maps, verifies
  `import.meta.resolve`, ESM import, CJS `require`/`require.resolve`, and
  rejects undocumented deep imports such as package `dist/*`, `src/*`, generated
  Codex schema subpaths, and private CSS chunks.
  It creates a fresh package build before resolving packages from an isolated
  consumer project.
- `bun run test:node-compat` runs inside `bun run validate:packages`. It checks
  representative named exports for package roots and documented JavaScript
  subpaths, then imports/requires every public JavaScript export target from the
  built ESM/CJS output on Node.js LTS. Asset exports such as
  `@nyosegawa/agent-ui-react/styles.css` are resolver-checked, not executed as
  JavaScript.

Stable host-facing public subpaths:

- `@nyosegawa/agent-ui-core`
- `@nyosegawa/agent-ui-codex`
- `@nyosegawa/agent-ui-codex/clients`
- `@nyosegawa/agent-ui-codex/normalizer`
- `@nyosegawa/agent-ui-codex/request-builders`
- `@nyosegawa/agent-ui-codex/session`
- `@nyosegawa/agent-ui-codex/stable-types`
- `@nyosegawa/agent-ui-codex/test-fixtures`
- `@nyosegawa/agent-ui-codex/websocket`
- `@nyosegawa/agent-ui-react`
- `@nyosegawa/agent-ui-react/headless`
- `@nyosegawa/agent-ui-react/primitives`
- `@nyosegawa/agent-ui-react/styles.css`
- `@nyosegawa/agent-ui-server`
- `@nyosegawa/agent-ui-server/advanced`
- `@nyosegawa/agent-ui-web-components`

Exported implementation subpaths:

- `@nyosegawa/agent-ui-core/internal`

React style chunks under `dist/styles/*` are copied package internals used by
`styles.css`, not host imports. Internal `.aui-*` selectors are likewise
implementation details; the design-system contract is the public `--aui-*`
token set.
