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

Agent UI package exports also do not make host runtime policy public. Hosts
still own non-loopback bridge admission, hosted auth, persistence, tenant and
workspace isolation, audit sinks, upload/static authorization, process
supervision, billing, and deployment policy.

## Export Inventory

This inventory was verified from `test/api-snapshots/*__index.d.ts` with
`bun run test:api-snapshots` on 2026-06-24. Freeze the export map only after
internal boundaries, examples, tests, and host integration docs agree.

### `@nyosegawa/agent-ui-core`

Keep public: `AGENT_RETENTION_POLICY`, `FakeAgentTransport`,
`FakeAgentTransportOptions`, `FakeTransportRequest`, `AgentTransport`,
`AgentTransportEvent`, `AgentRequestOptions`, `RequestId`, `RequestIdKey`,
`requestIdKey`, `AgentEvent`, product-domain event/state types for account,
apps, connection, diagnostics, hooks, items, models, run settings, server
requests, skills, status banners, turns, usage, and warnings,
`AgentDiagnosticAudience`, resource-aware item block types
(`AgentItemBlockResource`, `AgentItemBlockResourceKind`), `agentReducer`,
`createInitialAgentState`,
`runEventFixture`, and selectors for account, apps, diagnostics,
audience-filtered diagnostics, items, running turns, ordered items/turns,
pending approvals, approval views, protocol notifications, run settings,
server requests, server-request summaries, status banners, thread, thread
runtime/execution state, thread summary views, transcript views, turn, and
usage.

Replaced by the current API: registry-bucket public shapes
(`ThreadRegistryState`, `ThreadRegistryStatus`, and `selectThreadRegistry`)
were removed in favor of explicit thread lifecycle state, scoped collections,
active-thread selectors, pending operation selectors, runtime-aware
`AgentThreadSummaryView`, raw-free transcript selectors, and the separate
public `AgentThreadView`.

Move to subpath or make diagnostic-only: raw normalized `AgentSessionState`,
`ThreadState`, `AgentThread`, `AgentTurn`, and store-wide selectors when they
expose internal reconciliation details. Public controllers should consume view
models rather than asking hosts to inspect raw store shape.

Make private: reducer-internal registry/retention helper behavior and any
canonical-ID reconciliation detail that is not part of an explicit diagnostic
surface.

Remove: no additional core root exports are removed at this gate beyond
replacing the registry bucket model with the current collection model.

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

Replace with current API: lifecycle-dependent normalizer contracts that still
produce old registry status names should be updated after protocol
classification.

Make private: generated source-level chunks and aliases surfaced only because
declaration bundling uses chunk names. Root imports should not expose generated
schema internals as the normal integration path.

Remove: unsupported or test-only protocol helpers, including default React use
of `thread/turns/items/list`, must not be promoted.

### `@nyosegawa/agent-ui-react`

The React package has three public JavaScript entrypoints:

- `@nyosegawa/agent-ui-react`: default preset entry. Exports
  `AgentProvider`, `AgentChat`, `defaultAgentComponents`, `AgentComponents`,
  `AgentChatProps`, and i18n provider/dictionary helpers.
- `@nyosegawa/agent-ui-react/primitives`: visual composition entry. Exports
  shell, thread, transcript, composer, approval, status, usage, apps, skills,
  i18n, theme, run-settings, diff, local resource, and transcript item
  primitives backed by stable view models.
- `@nyosegawa/agent-ui-react/headless`: controller entry. Exports
  `AgentProvider`, public hooks/controllers, input/resource types, run-policy
  helpers, transcript-window helpers, usage helpers, and i18n helpers for hosts
  that own layout.

Keep root small. New host-composition surfaces should go to `primitives` or
`headless`; root should stay the drop-in preset API.

Replace with current API: `AgentChatSlots` has been removed in favor of the
single `AgentComponents` map and `defaultAgentComponents`. The accepted
replacement points are `Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`,
`Approval`, and transcript `blocks`. Transcript item customization uses
`renderItem(entry, Default)` with `AgentTranscriptEntry`; raw
`components.Item` replacement is removed. Lower-level scroll containers,
approval anchor placement, composer toolbar internals, attachment mutation
controls, sidebar pagination internals, and generated block normalization
remain internal/source-level boundaries;
`useAgentThread`, `useAgentThreadController`, `useAgentThreads`,
`useAgentThreadHistory`, `useAgentThreadReader`,
`useAgentThreadListController`, `useAgentComposer`,
`useAgentComposerController`, `AgentComposerController`, `ThreadList`, and
`AgentThreadSidebar` are rebuilt on explicit session, active-thread,
thread-list, composer, transcript, scroll, server-request, and diagnostics
controllers. The generic `AgentWorkspace` side-panel preset is removed; hosts
compose their own layout around `AgentChat` and primitives.
`startThreadWithInput()` is not a thread hook method;
the raw-free first-message start behavior is public on
`AgentComposerController` as
`startThreadWithInput(input, { threadOptions, turnOptions })`, while the
source-level internal composer controller keeps its implementation helper named
`startWithMessage()`.

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
`handleAgentUiWebSocketConnection`, `createCodexAppServerBridge`,
`createAgentUiNextRpcRoute`, `createAgentUiExpressMiddleware`,
one-shot method policy helpers, bridge option types, browser method capability
policy types, `AgentUiBridgePolicy` admission mode types, structured bridge
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

Move to subpath or make explicit advanced surface: dynamic tool helper-thread
exports and one-shot RPC policy helpers are host-managed lower-level surfaces;
they can stay public but should not be presented as default React workflow.

Make private: bridge process lifecycle internals and raw child-process details
that hosts do not need for admission, diagnostics, or shutdown policy.

Remove: `defaultDynamicToolHandler` was removed; hosts now choose
`dynamicToolPolicy: { mode: "disabled" }`, provide a host callback, or wrap the
explicit `createMcpDynamicToolHandler()` mapping helper.

### `@nyosegawa/agent-ui-web-components`

Keep public: `defineAgentChatElement`, `AgentChatElement`,
`AgentChatElementOptions`, and `AgentChatWebComponentElement`.

Replace with current API: `AgentChatElementOptions.components` follows the React
`components` replacement map.

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

Resource resolution exports live on `@nyosegawa/agent-ui-react/headless` as the
attachment boundary: `AgentResolvedResource`, `AgentResourceKind`,
`AgentFileResourceRequest`, `AgentLocalMediaResourceRequest`,
`AgentResourceRequest`, `AgentResourceResolution`, `AgentResourceResolver`,
`AgentLocalMediaUrlResolver`, `AgentResolvedLocalAttachment`,
`agentResourceUrl`, and `agentResourceDisplayName`. These are browser/UI
metadata primitives, not host upload, storage, authorization,
static-serving policy, or App/Plugin picker semantics. Resource resolution
returns structured `AgentResolvedResource` objects; URL string shorthand is not
part of the public contract.

Composer controller exports on `@nyosegawa/agent-ui-react/headless` include
the raw-free `AgentComposerController` view plus `AgentComposerSubmitMode`,
`AgentComposerDisabledReason`,
`AgentComposerFailedPendingMessage`, `AgentComposerIntegration`,
`AgentComposerIntegrationAttachment`, and `AgentComposerIntegrationResolver`.
Internal first-message operation maps,
rollback payloads, and generated protocol payloads remain source-level only.

Thread lifecycle controller exports may add raw-free start/resume result or
handle types only after the implementation, examples, tests, and snapshots use
the same names. The public result contract for `AgentThreadStartResult`,
`AgentThreadStartWithInputResult`, and `AgentThreadResumeResult` is:

- `threadId` is the canonical id the host should persist after start, first
  message start, or resume.
- `requestedThreadId` is optional diagnostic metadata for resume paths where
  the host asked for an alias or stale persisted id.
- Resume may also return raw-free `status`, `activity`, `activeTurnId`, and
  `runSettings` metadata so hosts can distinguish idle resumes from rejoined
  running or approval-waiting threads without inspecting App Server payloads.
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
`AgentComposerPanel`, `AgentComposerInput`, `AgentComposerToolbar`,
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
- generated-schema-backed input helpers for text, images, mentions, skills, and
  agent-browser verification turns

The package root exports the protocol/session/transport facade: JSON-RPC
helpers, protocol capability metadata, session helpers, stdio transport,
WebSocket transport, SDK adapter, and auth helpers. Browser code should import
the browser-safe grouped clients from
`@nyosegawa/agent-ui-codex/clients`, the compatibility session facade from
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
helpers live at `@nyosegawa/agent-ui-codex/normalizer`. Request builders are the
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

The SDK adapter is not the primary integration path and does not add an `@openai/codex` runtime dependency.

## `@nyosegawa/agent-ui-react`

React UI and hooks.

Responsibilities:

- root drop-in preset: `AgentProvider`, `AgentChat`, `AgentComponents`,
  `defaultAgentComponents`, and i18n helpers
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
`@nyosegawa/agent-ui-react/styles.css`. That file imports private source chunks
from `packages/react/src/styles/*`; package builds copy those chunks under
`dist/styles/*` for the bundled stylesheet only. Hosts should not import
`dist/styles/*` or rely on internal `.aui-*` selectors as a styling contract.
The stable customization surface is the token set in
`packages/react/src/styles/tokens.css`, plus documented component props,
the `components` map, render props, and `className` attachment points.

The default UI keeps the high-traffic surfaces split internally:

- `components.ts`: public barrel; `components/chat.tsx`, `components/thread.tsx`, `components/composer.tsx`, `components/run-settings.tsx`, `components/status.tsx`, `components/sidebar.tsx`, `components/approvals.tsx`, and `components/locale.tsx`: responsibility-scoped React surfaces
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

- local bridge
- Codex App Server process lifecycle
- Next.js one-shot RPC Route Handler helper
- same-origin WebSocket bridge helpers for full chat integrations
- local upload helper for browser `File` to App Server-readable path adapters
- Express middleware
- dynamic tool helper thread utilities, server-request policy helpers,
  host-event sinks, and redaction utilities
- auth/token forwarding recipes

Browser packages must not spawn child processes directly.

## `@nyosegawa/agent-ui-web-components`

Custom element wrapper for host applications that do not want to mount React directly.

Responsibilities:

- define `<agent-chat>` or a caller-supplied tag name
- accept `transport`, `initialState`, `components`, and `agentOptions` as JavaScript
  properties
- pass `agentOptions.className` or the `chat-class` attribute through to the
  rendered `AgentChat`
- render the standard React `AgentChat` inside `AgentProvider`

The wrapper does not create transports, spawn Codex, or include CSS
automatically. Hosts should import `@nyosegawa/agent-ui-react/styles.css`.
Token overrides on the custom element or a wrapper are the supported styling
path. The `chat-class` attribute is read when the element renders; it is not a
general observed-attribute API for every `AgentChat` option.

## Examples

- `examples/local-react-vite`: fixture-backed local component smoke target.
- `examples/codex-local-web`: real local Codex web app target using a same-origin WebSocket bridge to `codex app-server --listen stdio://`.
- `examples/next-rpc-route`: Next.js one-shot RPC Route Handler example. It is not the chat-capable bridge.
- `examples/next-with-bridge-sidecar`: Next.js full-chat example using a custom Node server with `attachAgentUiWebSocketBridge()`.
- `examples/recipes`: typed host integration recipes and remote deployment notes.
- `examples/docs-site`: small package-overview/demo landing page. It is not a markdown documentation renderer.

Route-focused public fixtures such as `/showcase/usage-only`,
`/showcase/scoped-thread-pane`, `/showcase/app-connectors`, and `/showcase/host-workflow-recipe` live inside
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

Browser hosts connect to a host-owned WebSocket endpoint. Node hosts that own
the local process use the server package:

```ts
import { createCodexAppServerBridge } from "@nyosegawa/agent-ui-server";

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
  useAgentThread,
} from "@nyosegawa/agent-ui-react/headless";

const thread = useAgentThread(threadId);
const approvals = useAgentApprovals(threadId);
const composer = useAgentComposerController(threadId);
```

## Export Boundary Gates

The package boundary is mechanically checked after `bun run build`:

- `bun run test:api-snapshots` reads every package `exports` map and compares
  only public declaration targets with `test/api-snapshots/*`. Missing,
  changed, and stale snapshots fail unless `bun run test:api-snapshots:update`
  is run intentionally. If a declaration target is missing because package
  output has not been built, the script reports the missing export target and
  asks for `bun run build` or `bun run validate:packages` instead of surfacing a
  raw filesystem error. The check also normalizes private hashed declaration
  chunk names before comparing snapshots and verifies import/require declaration
  parity for each exported subpath. Internal declaration chunks generated by the
  bundler, including hashed `.d.ts` files, are not public API snapshots unless
  they are reachable from an export map.
- `bun run test:packlist` runs after `bun run build` in `bun run
  validate:packages`. It dry-runs each package packlist and rejects unexpected
  source files, stale build artifacts, and private generated files outside the
  current allowed publish surface.
- `bun run test:package-resolution` reads the same export maps, verifies
  `import.meta.resolve`, ESM import, CJS `require`/`require.resolve`, and
  rejects undocumented deep imports such as package `dist/*`, `src/*`, generated
  Codex schema subpaths, and private CSS chunks.
- `bun run test:node-compat` runs inside `bun run validate:packages`. It checks
  representative named exports for package roots and documented JavaScript
  subpaths, then imports/requires every public JavaScript export target from the
  built ESM/CJS output on Node.js LTS. Asset exports such as
  `@nyosegawa/agent-ui-react/styles.css` are resolver-checked, not executed as
  JavaScript.

Only these subpaths are public today:

- `@nyosegawa/agent-ui-core`
- `@nyosegawa/agent-ui-codex`
- `@nyosegawa/agent-ui-codex/clients`
- `@nyosegawa/agent-ui-codex/normalizer`
- `@nyosegawa/agent-ui-codex/request-builders`
- `@nyosegawa/agent-ui-codex/session`
- `@nyosegawa/agent-ui-codex/stable-types`
- `@nyosegawa/agent-ui-codex/websocket`
- `@nyosegawa/agent-ui-react`
- `@nyosegawa/agent-ui-react/headless`
- `@nyosegawa/agent-ui-react/primitives`
- `@nyosegawa/agent-ui-react/styles.css`
- `@nyosegawa/agent-ui-server`
- `@nyosegawa/agent-ui-web-components`

React style chunks under `dist/styles/*` are copied package internals used by
`styles.css`, not host imports. Internal `.aui-*` selectors are likewise
implementation details; the design-system contract is the `--aui-*` token set
from `packages/react/src/styles/tokens.css`.
