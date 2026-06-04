# Server Bridge

Agent UI has two different server integration shapes. Keep them separate:

- full chat bridge: long-lived WebSocket session to a local App Server process
- one-shot RPC helper: one HTTP request runs one allowlisted target App Server method

Only the full chat bridge can power `AgentChat`.

The public server package exports bridge, local media, one-shot RPC,
server-request policy, dynamic-tool mapping, host-event, and redaction helpers.
Those helpers are integration surfaces for a host-owned server process; they do
not make Agent UI a hosted runtime. Authentication, non-loopback admission,
process supervision, persistence, tenant/workspace isolation, upload/static
authorization, audit retention, billing, and deployment topology stay outside
the core library.

## Full Chat WebSocket Bridge

Use this when a browser UI needs streaming turns, approvals, thread hydration,
usage updates, and server requests:

```text
browser Agent UI
  -> same-origin WebSocket /agent-ui/ws
    -> @nyosegawa/agent-ui-server
      -> codex app-server --listen stdio://
```

Server:

```ts
import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";

attachAgentUiWebSocketBridge({
  server,
  path: "/agent-ui/ws",
  cwd: process.cwd(),
  bridgePolicy: {
    admission: {
      admit(request) {
        return request.headers.origin === "http://127.0.0.1:5175";
      },
      mode: "host-callback",
    },
  },
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
```

Browser:

```ts
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";

const transport = createCodexWebSocketTransport({
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});
```

The bridge starts a Codex App Server process, forwards normalized transport
events to the browser, forwards browser responses for App Server requests, and
closes the process when the socket closes or the idle timeout expires. It is not
a transparent raw Codex WebSocket proxy: App Server notifications, requests,
stderr, and errors are sent to the browser as
`{ type: "agent-ui/transport-event", event }` envelopes. Browser JSON-RPC
requests still receive JSON-RPC responses using the original browser request id.
Slow browser consumers are closed with WebSocket code `1013` when the outbound
buffer exceeds the configured backpressure limit.

Inbound browser messages are checked before JSON parsing. The default maximum
message size is 256 KB and is applied both as `ws.maxPayload` on attached
servers and as a post-message guard for direct handler usage; oversized input
closes the browser socket with code `1009`. Each connection also has a default
rate limit of 60 messages per second; exceeding it closes the socket with code
`1008`. Hosts may tune these limits through `inbound.maxMessageBytes`,
`inbound.rateLimitMessages`, and `inbound.rateLimitIntervalMs`.

The default idle timeout is 30 minutes. When the connection is idle for that
long, the bridge closes the browser socket with `1000` and shuts down the App
Server process. Startup failures close with `1011`; admission rejections close
with `1008`; admission errors close with `1011`.

`bridgePolicy.admission` is checked before the Codex child process is spawned.
The explicit modes are:

- `local-loopback`: the default. Only loopback remote addresses such as
  `127.0.0.1` and `::1` are admitted.
- `host-callback`: calls a host callback with the original HTTP request. A
  `false` result closes the socket with `1008`; thrown or rejected errors close
  with `1011`, do not spawn the child process, and have diagnostics redacted
  before host stderr callbacks.
- `unsafe-no-admission`: admits without request checks only when the host
  supplies a non-empty `reason`. This mode is for explicit host-owned
  experiments and should be paired with external auth, isolation, and audit
  logging.

The legacy top-level `admission(request)` option is treated as
`host-callback`. Use host-callback admission for session or explicit local-token
checks on any bridge that is not a private loopback-only development endpoint;
an Origin comparison alone is not authentication. Browser JSON-RPC requests are
filtered by `browserMethodPolicy`; the default is the full-chat productized UI
surface expressed as capability categories:

Bridge health diagnostics are emitted through `hostEvents.onBridgeHealthEvent`.
The event carries a snapshot with `admissionChecked`, `processSpawned`,
`initialized`, `connected`, `pendingRequestCount`, and
`lastRedactedDiagnostic`. Health phases include `admissionChecked`,
`processSpawned`, `initialized`, `connected`, `pendingRequestCount`,
`diagnostic`, `idleClosed`, and `backpressureClosed`. Events carry
`audience: ["developer", "audit"]`. The bridge updates the pending count when
App Server requests arrive and when browser or bridge policy responses resolve
them. The health stream is for host developer/audit tooling; Agent UI does not
persist it, attach tenant meaning to it, or turn it into a deployment policy.

- `connection`: `initialize` and `initialized`
- `account`: account read, device login, logout, and rate-limit read
- `models`: model listing
- `threadHistory`: list/read/archive/unarchive thread history
- `threadLifecycle`: start/resume/fork/name/update/compact/rollback/inject/unsubscribe
- `turns`: start, steer, and interrupt turns
- `skills`: list and write skill config
- `hooks`: hook listing
- `apps`: app listing

Hosts may pass `browserMethodPolicy: { capabilities: [...] }` to narrow the
browser surface by category. This is intentionally broader than the one-shot
HTTP default below. Host-only methods such as `fs/readFile`, `command/exec`,
`mcpServer/tool/call`, and configuration writes outside the listed categories
require `browserMethodPolicy: "all"` plus host-owned auth, isolation, and audit
logging. Rejected methods return a JSON-RPC error with `code: -32601` and
`data.method`. When an allowed App Server request fails, the bridge preserves
the App Server error `code` and `data` in the browser response instead of
collapsing it to a message string. Browser request `trace` is forwarded as
JSON-RPC-lite top-level `trace` to the underlying transport.

The upstream App Server may reject direct browser WebSocket connections by
`Origin`, but that does not protect an Agent UI same-origin bridge endpoint.
The bridge is a host endpoint and must enforce its own admission/session policy.
Same-origin routing and upstream `Origin` checks are not authentication.
Non-loopback exposure requires host-owned auth, admission, workspace or session
scoping, process isolation, resource limits, and audit logging.
Agent UI provides policy hooks and diagnostics so hosts can implement those
decisions; it does not persist bridge events, attach tenant meaning, or choose
deployment isolation for them.

`handleAgentUiWebSocketConnection()` is the lower-level handler for hosts that
do not use `attachAgentUiWebSocketBridge()`. If admission needs HTTP headers,
cookies, the `Origin` header, or loopback remote address checks, pass the
original `IncomingMessage` as the third argument. Without a request object,
`local-loopback` and `host-callback` admission reject before spawning; only
`unsafe-no-admission` with a non-empty reason can proceed.

Server-side redaction helpers are public exports from
`@nyosegawa/agent-ui-server`: `redactSecrets()`, `redactStructuredValue()`, and
`redactTransportEvent()`. They are part of the server API snapshot. Any new
redaction helper added for bridge errors, diagnostics, or structured JSON-RPC
payloads must either remain package-internal or update the server API snapshot
in the same change.

When the bridge is configured with `initialize`, the bridge owns App Server
initialization and sends the `initialize` / `initialized` handshake over stdio
before forwarding transport events. In that mode, browser `initialize` requests
are rejected with a JSON-RPC error instead of being forwarded as a second App
Server initialization. If a host intentionally wants browser-owned
initialization, omit bridge `initialize` and allow the browser transport to send
it.

Bridge shutdown is deterministic. Browser socket close, browser socket error,
idle timeout, App Server transport EOF, or bridge close first closes the
transport, which rejects pending requests, then sends `SIGTERM` to the Codex
child process, waits for the grace period, and escalates to `SIGKILL` if the
child does not exit. Child stdout and stderr stay bound to the transport
lifecycle; stderr is redacted before host callbacks or browser events see it.

Running-turn UX should map directly to App Server methods. App Server has no
dedicated `queue/message` API. Agent UI's default pending follow-up cards are
UI-local, thread-scoped state until the user chooses `Send now`; `Send now` and
Cmd/Ctrl+Enter call `turn/steer` with `threadId`, the active `expectedTurnId`,
and structured `input` only while a turn is running. Outside a running turn,
Cmd/Ctrl+Enter starts a normal new turn. A queued item is not sent if its stored
`expectedTurnId` differs from the current active turn. Stop calls only
`turn/interrupt` with the active `threadId` and `turnId`; the server may only
respond after the interrupted `turn/completed`/`TurnAborted` path finishes.
`turn/steer` is not an interrupt, and generic queue-after-completion behavior
is host-owned, not an App Server primitive.

Token usage is streamed independently through `thread/tokenUsage/updated`.
Current App Server payloads are nested under `tokenUsage.total.*`,
`tokenUsage.last.*`, and `tokenUsage.modelContextWindow`. Resume, fork, and
rejoin paths can replay restored usage where upstream supports it so the UI can
show context usage before the next turn starts; `thread/read` should be treated
as stored history hydration, not token-usage notification replay.

## Local Media Helper

Browsers hold `File` objects; Codex App Server reads local image inputs from
paths. The library therefore requires a host resolver for attachments.

`createAgentUiLocalMediaHelper()` is the local development helper:

- accepts `POST`; a missing `content-type` is accepted, and a present
  `content-type` must be `application/octet-stream`, non-SVG `image/*`, or
  `text/plain`
- rejects SVG uploads by declared content type, sanitized `.svg` filename, or
  leading SVG/XML body signature before registering a same-origin asset URL
- uses `x-agent-ui-filename` for a sanitized filename suffix and rejects
  malformed percent-encoding or control characters
- writes into a per-session temp directory under a host temp root, defaulting
  to the OS temp dir
- enforces a 16 MB default limit
- runs expired-session cleanup with a one hour default TTL
- preserves arbitrary sanitized extensions; images and non-images differ only
  in the host's resolver return value
- exposes `cleanup()` for explicit per-session cleanup and runs best-effort TTL
  cleanup for expired session directories before writes
- returns JSON with `path`, `url`, `id`, `name`, `displayName`,
  `redactedPath`, `mimeType`, `sizeBytes`, and `previewUrl`
- serves registered assets with `Cache-Control: no-store` and
  `X-Content-Type-Options: nosniff`
- creates browser URLs from registered asset IDs, not raw local paths
- exposes a constrained `serveAssetHandler` that hosts must explicitly wire if
  browser preview bytes should be served

If a host passes a relative `directory`, the returned path can also be relative
to the host process. Use an absolute upload root when the App Server process
needs absolute attachment paths. Use `path` only for explicit App Server input
construction and `url`/`previewUrl` only for browser rendering. Agent UI does
not derive image/video `src` values from raw filesystem paths.

Static serving is opt-in. The helper does not install routes on a server; the
host must route a path such as `/agent-ui/assets/:id` to `serveAssetHandler`.
The handler resolves only registered asset IDs, rejects path-like IDs before
filesystem access, refuses files outside the configured session directory, and
can call `serveAsset.admitRequest` before serving bytes. Loopback demos may use
the default admission behavior. Non-loopback or shared endpoints need
host-owned authentication, session admission, tenant/workspace isolation,
resource limits, and audit logging before routing the handler.

`createAgentUiLocalUploadHandler()` remains available as the upload-only entry
point. It is backed by the local media helper and returns the same structured
JSON while preserving the `path` field used by existing resolvers.

Preview cleanup is explicit. Call `releaseAsset(id)` to remove a registered
asset and delete its temporary file after browser preview use is finished. Do
not release an asset whose `path` was just sent to Codex App Server until the
server has finished reading it. Call `cleanup()` to remove the whole helper
session.

The React composer calls the host's `resolveLocalAttachment(file)` resolver.
The resolver may upload the file, then return structured metadata with an
explicit `input` field containing one Codex input or an array of Codex inputs.
Images should set `input` to `localImageInput(path)`. For arbitrary non-image
files, App Server has no generic `localFile` user input, so the host should set
`input` to explicit text such as `textInput("Attached file:
/absolute/local/path")`. The React package never treats a browser blob URL or
`File.name` as an App Server-readable path, and non-image files should not rely
only on `mentionInput`.

## Dynamic Tool Bridge

`item/tool/call` requests are normalized by the Codex adapter. The default core
server request queue does not retain them as normal approval items; they are
handled out of band by the bridge or by a host integration. The bridge does not
execute dynamic tool requests unless the host passes
`dynamicToolPolicy: { mode: "host-callback", handler }`. The exported
`createMcpDynamicToolHandler()` helper requires explicit namespace, server, and
tool mappings before it will forward a dynamic request to `mcpServer/tool/call`:

```ts
attachAgentUiWebSocketBridge({
  server,
  dynamicToolPolicy: {
    handler: createMcpDynamicToolHandler({
      tools: [
        {
          namespace: "mcp__browser",
          server: "browser",
          tools: ["snapshot"],
        },
      ],
    }),
    mode: "host-callback",
  },
});
```

Unknown namespaces or tools fail before Agent UI creates the helper thread or
calls `mcpServer/tool/call`. The legacy `defaultDynamicToolHandler` surface has
been removed; hosts should use the explicit factory or provide their own handler
inside `dynamicToolPolicy`. Allowed dynamic-tool requests may create a helper
thread with:

```text
approvalPolicy: "on-request"
sandbox: "workspace-write"
```

This is a host boundary, not a UI convenience. Hosts that do not understand the
risk should leave `dynamicToolPolicy` unset or set `{ mode: "disabled" }`, and
production hosts should provide explicit authorization, audit logging, workspace
isolation, and resource limits before enabling mapped dynamic tools.

Dynamic tool diagnostics are emitted through `hostEvents.onDynamicToolEvent`.
Events use phases `received`, `denied`, `helperThreadCreated`,
`mcpCallStarted`, `timeout`, `completed`, and `failed`. They include the
request id, call id, namespace, tool, thread id, turn id, optional server/helper
thread id, success flag, duration, redacted message, and
`audience: ["developer", "audit"]`. They intentionally do not include raw
dynamic tool arguments or MCP result content. These events are for
developer/audit logging by the host, not browser-visible approval UI.

Server request auto-resolution is controlled separately by
`serverRequestPolicy`. The default policy forwards approval-like requests to
the browser UI so the user can decide. The MCP tool approval shortcut only
accepts elicitations that carry `_meta.codex_approval_kind ===
"mcp_tool_call"`; generic MCP elicitations stay visible to the host/UI.

Hosts that need request-specific policy can provide
`serverRequestPolicy.decide(context)`. The callback receives the normalized
request kind, request id, thread id, turn id, full request object, and payload.
Return `{ action: "respond", response }` to resolve that request, return
`{ action: "manual" }` to force browser/UI handling and skip fallback shortcuts,
or return `undefined` to continue to the narrower built-in policies such as
`mcpToolApproval`, `commandExecution`, `fileChange`, and `permissions`.

Command and file-change approval auto-resolution is callback-only. Agent UI no
longer accepts generic `commandExecution: "accept"` or
`fileChange: "acceptForSession"` bridge policies because those strings approve
every matching request without inspecting command text, cwd, reason, grant root,
or thread context. Hosts that intentionally auto-approve these requests must
provide `serverRequestPolicy.commandExecution(context)` or
`serverRequestPolicy.fileChange(context)` and return `{ action: "accept" }`.
Set `scope: "session"` only when the host explicitly wants
`acceptForSession`; return `{ action: "manual" }`, `undefined`, or `null` to
leave the request visible to the UI.

Permission approval behavior depends on the surface. Dynamic helper-thread
permissions live under `dynamicToolPolicy.helperPermissions` and default to
`"manual"`, so the request stays visible to the browser/server-request path.
Hosts may choose `"deny"`, the unsafe explicit opt-in
`"grantRequestedForTurn"`, or a callback. Callback grants are checked against
the requested file-system and network families, structured filesystem grants are
checked against requested modes and paths where the helper understands that
shape, and dynamic helper grants are always turn-scoped in this release. The
helper is not a schema-wide permission sanitizer for every generated App Server
permission shape.

To auto-resolve normal permissions requests for the active browser session, the
host must provide a `serverRequestPolicy.permissions` callback:

```ts
attachAgentUiWebSocketBridge({
  server,
  serverRequestPolicy: {
    permissions(context) {
      if (
        context.cwd === "/Users/me/project" &&
        context.requested.fileSystem === "read-only"
      ) {
        return {
          action: "grant",
          permissions: {
            fileSystem: { mode: "read-only", paths: [context.cwd] },
          },
          scope: "turn",
        };
      }
      return { action: "manual" };
    },
  },
});
```

The callback receives `requestId`, `threadId`, `turnId`, `cwd`, requested
filesystem/network permissions, and the raw App Server request payload. The
normal policy path treats returned grants as trusted host policy but still
clamps them to the requested subset: unrequested permission families are
dropped, generic grants such as network must match the requested value,
protocol-shaped filesystem `read`, `write`, and `entries` grants must be
subsets of the request, and `globScanMaxDepth` cannot exceed the requested
value. `scope` defaults to `"turn"`; hosts may return `"session"` only when
they intentionally want the App Server to persist the bounded grant for later
turns in the same session.
Return `undefined`, `null`, or `{ action: "manual" }` to leave the request
pending for the UI.

## One-Shot HTTP RPC

`createAgentUiNextRpcRoute()` and `createAgentUiExpressMiddleware()` are narrow
HTTP RPC helpers. They are useful for calls such as `account/read`,
`model/list`, or a host-owned administrative request.

They are not chat bridges and they do not include built-in admission or
authentication callbacks. The host route must enforce authentication before it
calls the helper. Each accepted HTTP request starts one App Server process,
connects the transport, runs the requested allowlisted method, returns one
response, and closes the process. If `initialize` is configured, the transport
also sends the App Server `initialize` request and `initialized` notification
before the target method.

Request body:

```json
{ "method": "model/list", "params": {} }
```

Successful response:

```json
{ "result": {} }
```

Rejected or failed response:

```json
{ "error": { "code": -32601, "message": "Codex method is not allowed: fs/readFile" } }
```

One-shot helpers validate the requested method before spawning App Server. By
default they allow only read/list/status-shaped methods.

Default one-shot methods:

- `account/read`
- `account/rateLimits/read`
- `model/list`
- `thread/list`
- `thread/loaded/list`
- `thread/read`
- `skills/list`
- `hooks/list`
- `app/list`

`initialize`, auth mutations, thread mutations, turn control, configuration
writes, and skill writes are rejected with a JSON-RPC style `-32601` error
before App Server is spawned. Pass `allowedMethods` to narrow or expand the
explicit allowlist:

```ts
createAgentUiNextRpcRoute({
  allowedMethods: ["account/read", "model/list"],
});
```

The runnable `examples/next-rpc-route` uses exactly `account/read` and
`model/list`.

`allowedMethods: "all"` is an unsafe escape hatch for authenticated,
host-owned routes only. It removes the method policy entirely. Do not expose it
from a browser-copyable route without separate authorization and audit controls.

They are not chat bridges because a single HTTP response cannot represent:

- streaming App Server notifications
- long-running turns
- server approval requests
- browser approval responses
- reconnect and pending request semantics

Use `examples/next-rpc-route` for one-shot RPC. Use
`examples/next-with-bridge-sidecar` or `examples/codex-local-web` for full chat.

## Security Requirements

- Keep unauthenticated bridges bound to loopback.
- Add explicit auth before exposing non-loopback WebSocket endpoints.
- Do not put bearer tokens in query strings.
- Redact stderr, structured host events, and browser-forwarded transport
  envelopes before forwarding. The redaction policy covers bearer strings, API
  keys, token fields, passwords, secrets, and device/user codes with `=`,
  JSON-field, or colon-separated labels such as `x-api-key: ...`.
- Redact bridge-owned diagnostics and dynamic-tool failure text before sending
  them to host stderr callbacks or back to the App Server.
- Use one process/session/workspace boundary per user for multi-user hosts.
- Keep API keys server-side only.
- Keep one-shot `allowedMethods` narrow. Treat `allowedMethods: "all"` like a
  host admin endpoint, not a browser UI convenience.
