# Remote Deployment

Remote deployment is advanced and outside the default MVP runtime. The MVP remains local-first: a host process starts `codex app-server --listen stdio://` and exposes only the UI surface it owns.

## Recommended MVP Shape

Use one of these before exposing a network listener:

- local browser UI plus local bridge
- SSH port forwarding to a loopback bridge
- host-owned reverse proxy with explicit authentication

Do not expose a personal Codex App Server directly to the open network.

## WebSocket Transport

`@nyosegawa/agent-ui-codex` includes `createCodexWebSocketTransport()` for hosts that already provide an authenticated WebSocket endpoint that speaks the same JSON-RPC-lite App Server message shape.

```ts
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex";

const transport = createCodexWebSocketTransport({
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});
```

Authentication is a host responsibility. The transport intentionally does not put bearer tokens in query strings. Prefer same-origin cookies, a reverse proxy session, or a server-side token exchange.

## Process Isolation

For any remote recipe:

- run one Codex App Server process per user/session/workspace
- keep ChatGPT managed auth on the server side
- keep API keys server-side if a future recipe uses API keys
- do not share a personal OAuth session across users
- keep workspace filesystem access explicit

## Non-Goals

The package does not provide:

- hosted Codex access
- multi-user authorization
- credential storage
- public production websocket hosting

