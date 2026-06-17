# Codex Protocol

## Primary Backend

Agent UI's primary backend is Codex App Server.

Default startup:

```text
codex app-server --listen stdio://
```

The integration is protocol-based. Agent UI does not rely on a JavaScript SDK API for the primary Codex path.

## Transport Interface

```ts
export interface AgentTransport {
  connect(): Promise<void>;
  close(): Promise<void>;
  request<TParams, TResult>(
    method: string,
    params?: TParams,
    options?: {
      signal?: AbortSignal;
      timeoutMs?: number;
      trace?: unknown;
    },
  ): Promise<TResult>;
  notify(method: string, params?: unknown): void;
  events: AsyncIterable<AgentTransportEvent>;
  respond(requestId: RequestId, result: unknown): Promise<void>;
  reject(requestId: RequestId, error: AgentError): Promise<void>;
}

type AgentError = {
  code?: number;
  message: string;
  data?: unknown;
};
```

`AgentEvent` is the normalized event union emitted by protocol adapters. The
core package also exports domain unions such as `ConnectionEvent`,
`ThreadEvent`, `TurnEvent`, `ItemEvent`, `ServerRequestEvent`,
`DiagnosticsEvent`, and `UsageEvent` for hosts that route event handling by
surface.

Transport event iterators drain queued events before completing. Stdio,
WebSocket without reconnect, and SDK adapters emit `connection/closed` on close;
the next iterator read after that close event resolves with `{ done: true }`.
When WebSocket reconnect is enabled, transient close events do not end the
iterator because a replacement socket may still emit later events.

## Stdio Transport

The default transport:

- spawns `codex app-server --listen stdio://`
- writes one JSON object per line
- reads one JSON object per line
- correlates request id to response promise
- preserves optional JSON-RPC-lite top-level `trace` on requests
- supports per-request abort and timeout, removing the pending entry before the
  promise rejects so late App Server responses cannot leak request state
- emits `connection/connected` only after `initialize` resolves when initialize
  metadata is configured; the readiness signal is the initialize response, not
  the fire-and-forget `initialized` notification
- preserves JSON-RPC error `code` and `data` on rejected requests
- retries App Server overload `-32001` responses for idempotent read methods
  only, with bounded backoff
- pauses later writes after `stdin.write()` backpressure in a bounded queue until
  `drain`; `backpressure.maxWriteQueueBytes` controls the queued byte limit
- exposes stderr logs separately
- fails fast on process exit
- rejects pending requests on close
- supports server requests that require client responses

Implementation status:

- `@nyosegawa/agent-ui-codex` owns JSON-RPC-lite framing over existing stdio streams.
- `@nyosegawa/agent-ui-server` owns local process spawning for `codex app-server --listen stdio://`.
- `createCodexAppServerBridge()` returns a `CodexAppServerBridge` with a
  `transport` property and redacts stderr before forwarding logs.
- The generated stable and experimental TypeScript schemas are vendored under `packages/codex/src/generated`.
- `request-builders.ts` is the product request boundary. Builders return
  params whose method-specific types are derived from the generated stable
  `ClientRequest` union. React does not own or re-export Codex-specific
  request shapes.
- `createCodexClients()` groups productized App Server methods by protocol
  primitive: connection, threads, turns, approvals, apps, skills, hooks,
  models, and account. Its method params and results use generated-schema-derived
  aliases, so stable reads/lists return method-specific response types instead
  of `unknown`. Client construction validates that this method surface exactly
  matches the productized stable method classification.
  Experimental method calls must use `requestExperimental()`, require explicit
  opt-in, and are rejected if the method is stable/productized, host-only,
  experimental unsupported, or unknown. `requestRaw()` remains the explicit
  escape hatch for host-managed protocol calls outside the productized facade.
- `createCodexSession()` is a compatibility facade over `createCodexClients()`
  for host code that still expects `thread` and `turn` namespaces.
- `normalizer.ts` is the composition root for App Server notifications and
  server requests. Protocol-family modules under `packages/codex/src/normalizers`
  own account, thread, turn, item, server-request, apps/connectors, status, and
  model-list normalization. Browser-facing packages that need normalized events
  without Node stdio transport types can import the public
  `@nyosegawa/agent-ui-codex/normalizer` subpath.
- `thread/turns/items/list` is intentionally disabled in the product facade
  until upstream implements it.
- Protocol metadata and schema refresh workflow are owned by
  [Protocol Drift](../architecture/protocol-drift.md) and the generated schema
  README.

## WebSocket Transport

Direct WebSocket support to Codex App Server is experimental and unsupported
upstream. Agent UI's productized browser path is a same-origin host bridge that
keeps Codex App Server on the default `stdio://` transport.

Rules:

- remote production deployment is host-owned advanced integration work
- non-loopback exposure requires explicit auth
- bearer tokens must not be logged or placed in query strings
- reconnect is opt-in
- multi-user use requires per-user process/credential/workspace separation

Implementation status:

- `createCodexWebSocketTransport()` speaks the same JSON-RPC-lite request/response shape over `WebSocket`.
- Browser-facing imports should use `@nyosegawa/agent-ui-codex/websocket`; the package root also contains Node stdio code.
- `@nyosegawa/agent-ui-server` exports `attachAgentUiWebSocketBridge()` for same-origin local web apps. It keeps a Codex App Server process alive for the browser session and forwards transport events through an Agent UI envelope.
- The same-origin bridge closes the App Server process when the browser socket closes and also has an idle timeout for abandoned browser sessions.
- The same-origin bridge closes slow browser consumers with WebSocket code
  `1013` when the outbound buffer exceeds its configured backpressure limit.
- Uploads, dynamic-tool handling, one-shot HTTP RPC, and bridge security
  boundaries are documented in [Server Bridge](./server-bridge.md).
- `examples/codex-local-web` is the primary real local web app path.
- The transport accepts `url`, optional `protocols`, optional initialize
  metadata, and optional reconnect settings. Browser hosts that need a
  short-lived bridge token during the WebSocket handshake can pass
  `createAgentUiBearerSubprotocol(token)` in `protocols`; server-side bridge
  admission must validate it and keep the token out of URLs and logs.
- Authentication belongs to the host endpoint, for example same-origin cookies or a reverse proxy session.
- Reconnect is opt-in with bounded exponential backoff. On close, pending requests are rejected so callers do not hang across a broken socket.
- Like stdio, WebSocket transport reports protocol readiness after initialize
  resolves and preserves JSON-RPC error `code` and `data`.
- Like stdio, WebSocket requests support optional `trace`, abort signals, and
  timeouts. Socket close rejects all pending requests.
- WebSocket and stdio retry App Server `-32001` overload errors only for
  retry-safe read/list methods such as `thread/read`; mutating calls such as
  `turn/start` fail immediately.
- When reconnect is disabled or exhausted, the WebSocket event iterator drains
  `connection/closed` and then completes.

## Raw JSON-RPC Fixtures

Raw App Server conformance fixtures live in
`fixtures/app-server/v2-jsonrpc/`. They are JSONL files containing the raw
JSON-RPC-lite lines emitted by the App Server shape, not normalized
`AgentEvent` fixtures.

The manifest records the generated schema commit, fixture source commit, source
reference, sorted unique method list, purpose, and stability for each fixture. When the fixture source
commit differs from `CODEX_PROTOCOL_COMMIT`, the manifest must include a
`divergenceReason`; normal protocol tests validate the recorded commits and do
not inspect a local upstream checkout.

Fixture coverage is protocol evidence only. A method appearing in raw fixtures
does not by itself mean Agent UI productizes that method in React components,
browser defaults, or server bridge policies.

Deprecated protocol notifications are not mixed into current fixture files.
Compatibility fixtures use a `deprecated-*.jsonl` name and should keep payloads
readable, for example plain text deltas instead of base64-looking literals.

- `thread-start-basic.jsonl`
- `turn-text-stream.jsonl`
- `approvals-command-file.jsonl`
- `tool-requests.jsonl`
- `patch-streaming.jsonl`
- `thread-resume-usage.jsonl`
- `thread-history-state.jsonl`
- `apps-list-updates.jsonl`
- `account-login-rate-limit.jsonl`

`bun run test:protocol` parses those lines with the JSON-RPC parser,
normalizes them through the Codex adapter, and reduces them into core state.
`bun run test:core-fixtures` is the core-owned reducer coverage over normalized
`AgentEvent` fixtures. `bun run test:fixtures` remains as a compatibility alias
for that same runner; it is not raw JSON-RPC fixture coverage and not browser
fixture e2e.

## Stable and Experimental API

Default public API uses stable App Server protocol only.
The package exposes capability metadata plus `getCodexCapabilityStatus()`,
`isStableProductizedMethod()`, `isExperimentalAvailableMethod()`,
`isHostOnlyMethod()`, `assertCodexProductizedMethod()`, and
`assertCodexExperimentalMethod()` for hosts that need to gate dynamic method
selection.

The classification lists in `packages/codex/src/protocol.ts` are the source of
truth for Agent UI design gates. Before core lifecycle state or React-visible
behavior is promoted, check whether the relevant Codex App Server method or
notification is productized stable, stable but host-managed, experimental
opt-in, unsupported, or test-only. Generated schema files may contain more
methods and fields than Agent UI productizes; their presence alone does not
make a lifecycle state, component prop, or browser bridge method public.

Experimental protocol support:

```ts
await transport.request("initialize", {
  capabilities: {
    experimentalApi: true,
    requestAttestation: false,
  },
  clientInfo: {
    name: "agent_ui_host",
    title: null,
    version: "0.1.0",
  },
});
```

`initialize` uses the generated stable `InitializeParams` shape. `clientInfo`
requires `name`, nullable `title`, and `version`; `capabilities` is either
`null` or an object with required `experimentalApi` and `requestAttestation`
booleans plus optional nullable `optOutNotificationMethods`. Agent UI sends the
`initialized` client notification only after the initialize response; readiness
is the response, not the notification.

Generated experimental types may exist internally, but they must not appear in default public component props or normalized core state.

`createCodexSession(transport)` defaults to stable methods only. Hosts that
need experimental methods must opt in with
`createCodexSession(transport, { experimental: true })`.
Field-level experimental request fields on otherwise stable methods remain
host-managed raw protocol usage. Stable helpers such as
`threadResumeParams()` and `createCodexSession().thread.resume()` intentionally
accept only the generated stable request shape; fields such as
`thread/resume.excludeTurns`, `thread/resume.initialTurnsPage`, and
path/history resume must be sent through `requestRaw()` by a host that also owns
the corresponding `experimentalApi` negotiation and pagination behavior.
`thread/turns/list` remains experimental, but `normalizeThreadTurnsListResponse()`
can normalize its paged response into merge-only snapshot events. Descending
pages are emitted in chronological turn order, and anchor refetch pages merge
without duplicating known turns.
`thread/list` is productized for stored history collections. The public
`normalizeThreadListResponse()` helper emits thread snapshot events followed by
a scoped `thread/collection/pageReceived` event, preserving response cursors
without inventing workspace, tenant, routing, or persistence semantics. Hosts
choose the `AgentThreadScope` that matches their request filters, including
archived and cwd filters; Agent UI only stores the scoped collection view.
`thread/loaded/list` is productized as an in-memory loaded-thread ID page. The
public `normalizeThreadLoadedListResponse()` helper emits a scoped
`thread/collection/pageReceived` event for those ids without creating thread
entities or metadata, because the response does not contain durable thread
snapshots. Hosts that need titles, cwd, transcript state, or active-thread
hydration must follow with `thread/read` or `thread/resume`.
`thread/compact/start` remains a productized client method, but its current
response is empty and the stable `thread/compacted` notification is deprecated
in favor of item-level context compaction data. Agent UI preserves
`thread/compacted` as developer/audit raw diagnostics instead of inventing core
compact lifecycle state.
`normalizeThreadResumeResponse()` also understands `initialTurnsPage`; resume
metadata and the initial page are emitted as non-destructive snapshot events so
`excludeTurns: true` can add page data without clearing an existing transcript.
`thread/turns/items/list` is tracked as experimental unsupported and remains
disabled because it is not implemented upstream. `mock/experimentalMethod` is
generated test-only schema coverage, so it is excluded from experimental
availability, capability metadata, and `assertCodexExperimentalMethod()`.

Stable `thread/start` and React `ThreadStartOptions` do not expose
`dynamicTools`. Generated experimental `thread/start` can contain dynamic-tool
fields, but hosts that opt into that raw protocol path own the experimental API
negotiation and tool execution policy.

## Lifecycle Classification Gate

Core lifecycle state must be derived from classified App Server protocol
surfaces before React behavior is published. Agent UI may add UI-owned pending,
collection, preview, and failure state, but those states must not be presented
as durable App Server semantics.

Productized stable Agent UI behavior:

- Thread lifecycle: `thread/start`, `thread/resume`, `thread/read`,
  `thread/list`, `thread/loaded/list`, `thread/archive`,
  `thread/unarchive`, `thread/name/set`, `thread/metadata/update`,
  `thread/started`, `thread/status/changed`, `thread/name/updated`,
  `thread/archived`, `thread/unarchived`, `thread/closed`, and
  `thread/tokenUsage/updated`.
- Turn lifecycle: `turn/start`, `turn/steer`, `turn/interrupt`,
  `turn/started`, `turn/completed`, `turn/plan/updated`, and
  `turn/diff/updated`.
- Transcript item lifecycle: `item/started`, `item/completed`,
  `item/agentMessage/delta`, `item/plan/delta`,
  `item/reasoning/summaryTextDelta`, `item/reasoning/summaryPartAdded`,
  `item/reasoning/textDelta`, `item/commandExecution/outputDelta`,
  `item/commandExecution/terminalInteraction`,
  `item/fileChange/outputDelta`, `item/fileChange/patchUpdated`,
  `item/mcpToolCall/progress`, and command exec output notifications already
  normalized as structured or raw activity.
- Approval and host-input requests:
  `item/commandExecution/requestApproval`,
  `item/fileChange/requestApproval`, `item/tool/requestUserInput`,
  `mcpServer/elicitation/request`, `item/permissions/requestApproval`,
  `item/tool/call`, `account/chatgptAuthTokens/refresh`,
  `attestation/generate`, `applyPatchApproval`, `execCommandApproval`, and
  `serverRequest/resolved`.
- Account, app, skill, hook, model, usage, warning, and status surfaces already
  documented in the stable productized method and notification lists above.

Stable host-managed lower-level surfaces:

- Shell, filesystem, configuration, plugin/marketplace, MCP resource/tool,
  remote auth status, thread goal, review, feedback, guardian-denied action,
  and Windows sandbox methods listed as host-only above.
- Dynamic tool execution remains host-managed even though `item/tool/call` is a
  stable server request. Agent UI may normalize the request and bridge it, but
  authorization, tool mapping, helper-thread policy, MCP access, and audit logs
  belong to the host.
- Permissions approval policy remains host-managed. Agent UI can render or
  forward the request, but it must not infer workspace, tenant, or deployment
  authorization.
- Stable-generated raw notifications such as `rawResponseItem/completed` are
  developer/audit diagnostics until a normalizer maps them to productized core
  state. They are protocol coverage, not lifecycle behavior by themselves.

Experimental opt-in surfaces:

- `thread/turns/list` can be normalized with
  `normalizeThreadTurnsListResponse()` for host-owned pagination and preview
  hydration experiments, but it must not become default React behavior without
  an explicit opt-in design.
- `thread/search`, `thread/settings/update`, realtime/audio methods, process
  control, fuzzy-file-search sessions, memory, environment, remote control,
  collaboration mode, and elicitation counters stay experimental and require
  `experimentalApi: true` plus host-owned policy.
- Stable methods with experimental fields, such as `thread/resume` pagination
  fields and generated dynamic-tool fields on `thread/start`, remain raw
  host-managed protocol usage until a productized contract is designed.
- Thread goal and settings notifications remain outside default core lifecycle
  state. Goal methods are host-managed, and `thread/settings/update` is
  experimental opt-in; `thread/goal/updated`, `thread/goal/cleared`, and
  `thread/settings/updated` are preserved as developer/audit raw diagnostics
  until a host-owned controller contract is designed.

Unsupported or test-only surfaces:

- `thread/turns/items/list` is generated but unsupported upstream and must stay
  out of default React behavior.
- `mock/experimentalMethod` is schema test coverage only and is intentionally
  absent from capability metadata.

Thread close handling is notification-only in the current stable generated
surface: `thread/closed` is mapped, but there is no productized stable
`thread/close` client method. Agent UI can model closed availability from the
notification and stored snapshots, but a default React close action must wait
for an upstream stable method or be explicitly labeled host-owned.
Archive lifecycle is status-only in core: `thread/archived` maps to archived
availability, `thread/unarchived` maps back to available loaded state, and
`thread/closed` maps to closed availability without inventing a client-side
close method.

`clientUserMessageId` is a stable correlation field on `turn/start` and
`turn/steer`. Agent UI uses it for optimistic first-message reconciliation
while keeping temporary operation IDs and duplicate-prevention bookkeeping
inside Agent UI state.

Media/resource payloads are split by audience. Codex input construction may use
stable `image` and `localImage` user input variants, but browser rendering must
use host-resolved display URLs and metadata. `thread/read` history and live item
notifications may contain local image/path-bearing payloads; React must resolve
those through an explicit host/local-media resolver rather than using raw local
paths as `src` values. Core item blocks therefore normalize media payloads into
protocol-neutral `resource` metadata: local paths remain resolver inputs, while
only browser-safe `https:`, `data:`, or `blob:` URLs are eligible for direct
media rendering.

## Schema Drift

Codex App Server schema is expected to change. The refresh workflow, generated
metadata policy, and validation checklist are owned by
[Protocol Drift](../architecture/protocol-drift.md). This reference only
describes the currently productized protocol semantics.

## Release Protocol Surface

The current generated stable `ClientRequest` schema contains many App Server
methods. Agent UI intentionally productizes the real local chat path first and
does not claim complete Codex Desktop parity for every host utility. The
coverage status is:

Stable productized methods:

- `initialize`
- `account/read` with `{ refreshToken: false }` for startup bootstrap
- `account/login/start` with `{ type: "chatgptDeviceCode" }`
- `account/login/cancel` with `{ loginId }`
- `account/logout` without params
- `account/rateLimits/read` without params
- `account/usage/read` without params
- `model/list` with `{}` or stable pagination params
- `thread/start`
- `thread/resume`
- `thread/fork`
- `thread/list`
- `thread/loaded/list`
- `thread/read`
- `thread/archive`
- `thread/unarchive`
- `thread/name/set`
- `thread/metadata/update`
- `thread/compact/start`
- `thread/rollback`
- `thread/inject_items`
- `thread/unsubscribe`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `skills/list`
- `skills/config/write`
- `hooks/list`
- `app/list`

`skills/config/write` is productized only for the skill enablement flow exposed
by `useAgentSkills().setSkillEnabled()`. It is intentionally distinct from the
host-only `config/*` write methods below.

`turn/start` and `turn/steer` request builders preserve the optional
`clientUserMessageId` correlation field when a host supplies one; Agent UI does
not synthesize that id for transcript rendering.

`app/list` and `app/list/updated` normalize connector availability with the App
Server vocabulary: `isEnabled` becomes `AgentApp.enabled`, `isAccessible`
becomes `AgentApp.accessible`, and descriptive fields such as `installUrl`,
description, `logoUrl`, `logoUrlDark`, `distributionChannel`, labels, branding,
`appMetadata`, normalized `logos`, compatibility `metadata`, and plugin display
names are preserved. Agent UI does not derive installed/auth-needed state from
`app/list`; plugin-specific install/auth semantics remain host-owned or plugin
API state.

Host-only or advanced local tooling:

- `thread/shellCommand`
- `thread/approveGuardianDeniedAction`
- `command/exec`
- `command/exec/write`
- `command/exec/terminate`
- `command/exec/resize`
- `fs/readFile`
- `fs/writeFile`
- `fs/createDirectory`
- `fs/getMetadata`
- `fs/readDirectory`
- `fs/remove`
- `fs/copy`
- `fs/watch`
- `fs/unwatch`
- `fuzzyFileSearch`
- `review/start`
- `getConversationSummary`
- `gitDiffToRemote`
- `getAuthStatus`
- `modelProvider/capabilities/read`
- `permissionProfile/list`
- `config/read`
- `config/value/write`
- `config/batchWrite`
- `configRequirements/read`
- `externalAgentConfig/detect`
- `externalAgentConfig/import`
- `account/sendAddCreditsNudgeEmail`
- `feedback/upload`
- `marketplace/add`
- `marketplace/remove`
- `marketplace/upgrade`
- `plugin/installed`
- `plugin/list`
- `plugin/read`
- `plugin/skill/read`
- `plugin/share/save`
- `plugin/share/updateTargets`
- `plugin/share/list`
- `plugin/share/checkout`
- `plugin/share/delete`
- `plugin/install`
- `plugin/uninstall`
- `skills/extraRoots/set`
- `experimentalFeature/list`
- `experimentalFeature/enablement/set`
- `mcpServer/oauth/login`
- `config/mcpServer/reload`
- `mcpServerStatus/list`
- `mcpServer/resource/read`
- `mcpServer/tool/call`
- `thread/goal/clear`
- `thread/goal/get`
- `thread/goal/set`
- `thread/delete`
- `windowsSandbox/readiness`
- `windowsSandbox/setupStart`

`skills/extraRoots/set` replaces the App Server process runtime extra
standalone skill roots. It is host-only because hosts own local filesystem
selection, persistence, and the policy for exposing generated or external skill
directories to the App Server process.

Experimental available methods:

- `collaborationMode/list`
- `environment/add`
- `fuzzyFileSearch/sessionStart`
- `fuzzyFileSearch/sessionUpdate`
- `fuzzyFileSearch/sessionStop`
- `memory/reset`
- `process/spawn`
- `process/writeStdin`
- `process/resizePty`
- `process/kill`
- `remoteControl/enable`
- `remoteControl/disable`
- `remoteControl/client/list`
- `remoteControl/client/revoke`
- `remoteControl/pairing/start`
- `remoteControl/pairing/status`
- `remoteControl/status/read`
- `thread/backgroundTerminals/clean`
- `thread/backgroundTerminals/list`
- `thread/backgroundTerminals/terminate`
- `thread/increment_elicitation`
- `thread/decrement_elicitation`
- `thread/memoryMode/set`
- `thread/realtime/start`
- `thread/realtime/appendAudio`
- `thread/realtime/appendText`
- `thread/realtime/listVoices`
- `thread/realtime/stop`
- `thread/search`
- `thread/settings/update`
- `thread/turns/list`

Experimental test-only methods:

- `mock/experimentalMethod`

Experimental unsupported methods:

- `thread/turns/items/list`

Server requests:

- approval decisions: command approval, file change approval, and legacy
  `applyPatchApproval` / `execCommandApproval` compatibility requests
- host integration requests: user input, MCP elicitation, permissions approval,
  dynamic tool call, auth refresh, and attestation

Default Agent UI approval controls are limited to the approval-decision subset.
Queued host integration requests remain available through the broad
server-request queue so hosts can render method-specific flows without
receiving generic `{ decision }` responses. Dynamic tool calls are normalized as
server-request events for transports and bridge handlers, but the default core
queue does not retain them because tool execution is out-of-band host work.

Stable user input variants are `text`, `image`, `localImage`, `skill`, and
`mention`. There is no generic local-file user input; hosts should persist
arbitrary browser files and include explicit text such as
`Attached file: /absolute/path`.

Notifications:

- thread lifecycle
- turn lifecycle
- item lifecycle
- agent message deltas
- command output deltas
- file patch updates
- plan, diff, and reasoning deltas
- account updated/login completed
- app list updates
- skills changed invalidation
- model reroutes, deprecation notices, config warnings, and MCP OAuth/status banners
- warnings/errors

`process/outputDelta` and `process/exited` are stable App Server
notifications, but Agent UI does not render a process surface by default. They
are preserved as raw `notification/received` diagnostics so hosts can inspect
them without the core library inventing thread or item correlation that the
protocol does not provide. `command/exec/outputDelta` remains normalized as
connection-scoped command output and decodes its `deltaBase64` payload.
Raw protocol notifications and unsupported notification warnings carry the
`developer` and `audit` diagnostic audiences by default; they are not
user-facing diagnostics until a productized normalizer maps them to explicit UI
state.
MCP server startup status follows the same split. App-scoped startup failures
are developer/audit diagnostics because they usually describe host or Codex
configuration, not a user action inside the current chat. Thread-scoped MCP
startup failures may synthesize a user warning banner for that thread, and later
non-failed startup updates remove that banner instead of leaving stale status
chrome behind.

Current protocol non-goals:

- remote/multi-user production
- realtime/audio and voice UX
- plugin marketplace administration
- dynamic MCP resource/tool management as a product surface
- external ChatGPT auth token mode
- unsupported `thread/turns/items/list`

Unrecognized notifications are never treated as chat text. The normalizer keeps
known message, command, file-change, approval, plan, usage, account, warning,
and error events structured; unknown or deferred App Server messages should
surface as redacted diagnostics or neutral timeline activity until explicitly
productized.

## Real Codex Smoke Boundaries

The real Codex smoke path covers these protocol facts when local Codex auth is
available:

```text
initialize
account/read
model/list
account/rateLimits/read
thread/list
thread/read includeTurns
thread/start
turn/start
stream item/agentMessage/delta
turn/completed
thread/resume after a completed turn is persisted
```

The direct real smoke script resumes with `{ threadId }`. Hosts that need
experimental resume fields such as `excludeTurns` after hydrating turns through
`thread/read` must send that request through `requestRaw()` and own the
experimental pagination behavior.

The covered surfaces are:

- `model/list` returns the account-visible model collection under `data`.
- `account/rateLimits/read` returns primary and secondary account usage windows when the authenticated App Server exposes them.
- `thread/list` returns stored sessions.
- `thread/read` with `includeTurns: true` returns persisted turn history without resuming.
- `thread/resume` succeeds from a stored history id using the stable `{ threadId }`
  request shape.
- `thread/start` can create an ephemeral thread for smoke verification.
- `turn/start` streams `item/agentMessage/delta` and emits `turn/completed`.
- App Server has no `queue/message` method. Agent UI's follow-up queue is local
  React state; queued `Send now` and Cmd/Ctrl+Enter use `turn/steer`, while Stop
  uses `turn/interrupt`.

Model names, default model ordering, and exact rate-limit windows are
account/server dependent. Tests should assert protocol shape and UI behavior,
not hard-coded product availability from one local account.
