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
  initialize: {
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

Running-turn UX should map directly to App Server methods. Additional
instructions for an active regular turn call `turn/steer` with `threadId`,
`expectedTurnId`, and structured `input`. Stop calls `turn/interrupt` with the
active `threadId` and `turnId`; the server may only respond after the
interrupted `turn/completed`/`TurnAborted` path finishes. A generic
queue-after-completion feature is host-owned behaviour, not an App Server
primitive.

Token usage is streamed independently through `thread/tokenUsage/updated`.
Current App Server payloads are nested under `tokenUsage.total.*`,
`tokenUsage.last.*`, and `tokenUsage.modelContextWindow`. `thread/resume`,
`thread/read`-style hydration, and `thread/fork` can replay restored usage so
the UI can show context usage before the next turn starts.

## Upload Handler

Browsers hold `File` objects; Codex App Server reads local image inputs from
paths. The library therefore requires a host resolver for attachments.

`createAgentUiLocalUploadHandler()` is the local development helper:

- accepts a request body containing the file bytes
- uses `x-agent-ui-filename` for a sanitized filename suffix
- writes into a host temp directory, defaulting to the OS temp dir
- enforces a 16 MB default limit
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

`attachAgentUiWebSocketBridge()` defaults to
`defaultDynamicToolHandler` for App Server dynamic-tool requests. That helper
may create a helper thread and run with:

```text
approvalPolicy: "never"
sandbox: "danger-full-access"
```

This is a host boundary, not a UI convenience. Hosts that do not understand the
risk should disable or override `dynamicToolHandler`, and production hosts
should provide explicit authorization, logging, and workspace isolation.

Server request auto-resolution is controlled separately by
`serverRequestPolicy`. The default policy forwards approval-like requests to
the browser UI so the user can decide.

## One-Shot HTTP RPC

`createAgentUiNextRpcRoute()` and `createAgentUiExpressMiddleware()` are narrow
HTTP RPC helpers. They are useful for calls such as `account/read`,
`model/list`, or a host-owned administrative request.

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
- Redact stderr and structured logs before browser forwarding.
- Use one process/session/workspace boundary per user for multi-user hosts.
- Keep API keys server-side only.
