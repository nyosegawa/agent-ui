# Server Bridge

Agent UI has two different server integration shapes. Keep them separate:

- full chat bridge: long-lived WebSocket session to a local App Server process
- one-shot RPC helper: one HTTP request maps to one App Server JSON-RPC request

Only the full chat bridge can power `AgentChat`.

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
  admission(request) {
    return request.headers.origin === "http://127.0.0.1:5175";
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
closes the process when the socket closes or the idle timeout expires. Slow
browser consumers are closed with WebSocket code `1013` when the outbound
buffer exceeds the configured backpressure limit.

Inbound browser messages are checked before JSON parsing. The default maximum
message size is 256 KB; oversized input closes the browser socket with code
`1009`. Each connection also has a default rate limit of 60 messages per
second; exceeding it closes the socket with code `1008`. Hosts may tune these
limits through `inbound.maxMessageBytes`, `inbound.rateLimitMessages`, and
`inbound.rateLimitIntervalMs`.

`admission` runs before the Codex child process is spawned. Use it for
same-origin, session, or explicit local-token checks on any bridge that is not a
private loopback-only development endpoint. Browser JSON-RPC requests are
filtered by `browserMethodPolicy`; the default allows only productized UI
methods such as account/model/thread/turn/skills/hooks/apps calls. Host-only
methods such as `fs/readFile`, `command/exec`, `mcpServer/tool/call`, and
configuration writes require an explicit host policy. Rejected methods return a
JSON-RPC error with `code: -32601` and `data.method`. When an allowed App
Server request fails, the bridge preserves the App Server error `code` and
`data` in the browser response instead of collapsing it to a message string.
Browser request `trace` is forwarded as JSON-RPC-lite top-level `trace` to the
underlying transport.

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
`tokenUsage.last.*`, and `tokenUsage.modelContextWindow`. `thread/resume`,
`thread/read`-style hydration, and `thread/fork` can replay restored usage so
the UI can show context usage before the next turn starts.

## Upload Handler

Browsers hold `File` objects; Codex App Server reads local image inputs from
paths. The library therefore requires a host resolver for attachments.

`createAgentUiLocalUploadHandler()` is the local development helper:

- accepts `POST` with `application/octet-stream`, `image/*`, or `text/plain`
- uses `x-agent-ui-filename` for a sanitized filename suffix and rejects
  malformed percent-encoding or control characters
- writes into a per-session temp directory under a host temp root, defaulting
  to the OS temp dir
- enforces a 16 MB default limit
- preserves arbitrary sanitized extensions; images and non-images differ only
  in the host's resolver return value
- exposes `cleanup()` for explicit per-session cleanup and runs best-effort TTL
  cleanup for expired session directories before writes
- returns JSON `{ "path": "/absolute/local/path" }`

The React composer calls the host's `resolveLocalAttachment(file)` resolver.
The resolver may upload the file, then return one Codex input or an array of
Codex inputs. Images should return `localImageInput(path)`. For arbitrary
non-image files, App Server has no generic `localFile` user input, so the host
should return explicit text such as `textInput("Attached file:
/absolute/local/path")`. The React package never treats a browser blob URL or
`File.name` as an App Server-readable path, and non-image files should not rely
only on `mentionInput`.

## Dynamic Tool Bridge

`attachAgentUiWebSocketBridge()` does not execute dynamic tool requests unless
the host passes a `dynamicToolHandler`. The exported
`createMcpDynamicToolHandler()` helper requires explicit namespace, server, and
tool mappings before it will forward a dynamic request to `mcpServer/tool/call`:

```ts
attachAgentUiWebSocketBridge({
  server,
  dynamicToolHandler: createMcpDynamicToolHandler({
    tools: [
      {
        namespace: "mcp__browser",
        server: "browser",
        tools: ["snapshot"],
      },
    ],
  }),
});
```

Unknown namespaces or tools fail before Agent UI creates the helper thread or
calls `mcpServer/tool/call`. The legacy `defaultDynamicToolHandler` no longer
derives server names from namespace strings; hosts should use the explicit
factory. Allowed dynamic-tool requests may create a helper thread with:

```text
approvalPolicy: "on-request"
sandbox: "workspace-write"
```

This is a host boundary, not a UI convenience. Hosts that do not understand the
risk should disable or override `dynamicToolHandler`, and production hosts
should provide explicit authorization, logging, and workspace isolation.

Server request auto-resolution is controlled separately by
`serverRequestPolicy`. The default policy forwards approval-like requests to
the browser UI so the user can decide. The MCP tool approval shortcut only
accepts elicitations that carry `_meta.codex_approval_kind ===
"mcp_tool_call"`; generic MCP elicitations stay visible to the host/UI.

Permission approvals are never blanket-granted. To auto-resolve a permissions
request, the host must provide a callback:

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
filesystem/network permissions, and the raw App Server request payload. Only
the bounded permissions returned by the callback are granted; `undefined`,
`null`, or `{ action: "manual" }` leaves the request pending for the UI.

## One-Shot HTTP RPC

`createAgentUiNextRpcRoute()` and `createAgentUiExpressMiddleware()` are narrow
HTTP RPC helpers. They are useful for calls such as `account/read`,
`model/list`, or a host-owned administrative request.

One-shot helpers validate the requested method before spawning App Server. By
default they allow only Agent UI productized methods, matching the WebSocket
bridge's default browser posture. Host-only methods such as `fs/readFile`,
`command/exec`, `mcpServer/tool/call`, and configuration writes are rejected
with a JSON-RPC style `-32601` error. Pass `allowedMethods` to narrow or expand
the explicit allowlist:

```ts
createAgentUiNextRpcRoute({
  allowedMethods: ["account/read", "model/list"],
});
```

`allowedMethods: "all"` is an unsafe escape hatch for authenticated,
host-owned routes only. Do not expose it from a browser-copyable route without
separate authorization and audit controls.

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
- Use one process/session/workspace boundary per user for multi-user hosts.
- Keep API keys server-side only.
- Keep one-shot `allowedMethods` narrow. Treat `allowedMethods: "all"` like a
  host admin endpoint, not a browser UI convenience.
