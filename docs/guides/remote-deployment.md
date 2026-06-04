# Remote Deployment

Remote deployment is advanced host-owned integration work. Agent UI defaults to
local-first browser UI: a host process starts
`codex app-server --listen stdio://` and exposes only the UI surface it owns.
Agent UI packages provide transports, bridge helpers, redaction helpers,
resource helpers, and React components. They do not provide a hosted Codex
service, authentication system, persistence layer, tenant isolation model,
billing boundary, or deployment controller.

The canonical bridge contract is documented in
[Server Bridge](../reference/server-bridge.md).
Same-origin routing and upstream `Origin` checks are not authentication.

## Recommended Local Shape

Use one of these before exposing a network listener:

- local browser UI plus local bridge
- SSH port forwarding to a loopback bridge
- host-owned reverse proxy with explicit authentication and bridge admission

Do not expose a personal Codex App Server directly to the open network.

## WebSocket Transport

`@nyosegawa/agent-ui-codex` includes `createCodexWebSocketTransport()` for hosts that already provide an authenticated WebSocket endpoint that speaks the same JSON-RPC-lite App Server message shape.

```ts
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";

const transport = createCodexWebSocketTransport({
  reconnect: {
    initialDelayMs: 500,
    maxAttempts: 5,
    maxDelayMs: 10_000,
  },
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});
```

Authentication is a host responsibility. The transport intentionally does not put bearer tokens in query strings. Prefer same-origin cookies, a reverse proxy session, or a server-side token exchange.
The browser transport is only a client for a host-owned endpoint. It does not
prove that an upstream App Server WebSocket is safe to expose directly.

Reconnect is disabled unless `reconnect` is provided. When enabled, the transport rejects in-flight requests on close, emits `connection/connecting`, and reopens the socket with bounded backoff. Hosts should keep server requests idempotent enough that users can retry after reconnect.

## Next.js Route Handlers

`createAgentUiNextRpcRoute()` is a one-shot HTTP RPC helper. Each request starts a local bridge, sends one App Server method, returns the response, and shuts the process down. It does not support streaming notifications, App Server approval requests, or browser approval responses.

For a Next.js product that needs the full Agent UI chat experience, keep the
browser on `createCodexWebSocketTransport()` and host a same-origin WebSocket
bridge in a Node server, custom Next server, reverse proxy sidecar, or another
process owned by the application. `examples/next-with-bridge-sidecar` shows the
custom-server shape. Do not describe the one-shot Route Handler as a chat
bridge.

## Process Isolation

For any remote recipe:

- run one Codex App Server process per user/session/workspace
- keep ChatGPT managed auth on the server side
- keep API keys server-side when using the API-key remote pattern
- do not share a personal OAuth session across users
- keep workspace filesystem access explicit
- scope upload directories per user/session/workspace
- derive cwd/workspace roots server-side and reject browser-supplied roots that
  the authenticated session cannot access
- enforce process count, idle time, turn time, and output-size limits
- audit bridge connection, workspace, approval, and shutdown events

See
[`examples/recipes/multi-user-deployment.md`](../../examples/recipes/multi-user-deployment.md)
for the concrete multi-user bridge checklist.

## API-Key Remote Pattern

API-key remote operation is allowed only as a host-owned server-side deployment pattern. Agent UI does not move API keys through browser packages.

Rules:

- keep API keys in the server environment only
- never put API keys in WebSocket URLs, query strings, local storage, or browser-visible logs
- verify that the target Codex App Server build supports the intended API-key auth mode
- fall back to device-code login when API-key auth is not supported by the target App Server
- keep the same process/workspace isolation required for multi-user use

See
[`examples/recipes/api-key-remote-deployment.md`](../../examples/recipes/api-key-remote-deployment.md)
for the concrete API-key bridge checklist.

## Non-Goals

The package does not provide:

- hosted Codex access
- multi-user authorization
- credential storage
- public production websocket hosting
- direct upstream App Server WebSocket as the productized browser path
