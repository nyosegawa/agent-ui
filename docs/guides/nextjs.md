# Next.js

Agent UI supports two Next.js shapes. They are intentionally different.

## Full Chat: WebSocket Sidecar

Use `examples/next-with-bridge-sidecar` when the app needs streaming turns,
approvals, attachment uploads, diagnostics, and browser responses.

```text
Next UI -> /agent-ui/ws -> codex app-server --listen stdio://
Next UI -> /agent-ui/upload -> host temp path -> localImage input
```

The example uses a custom Node server that serves Next and attaches
`attachAgentUiWebSocketBridge()` to the same HTTP server.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-with-bridge-sidecar dev
```

## One-Shot RPC: Route Handler

Use `examples/next-rpc-route` only for one App Server request per HTTP `POST`,
such as `account/read` or `model/list`.

```text
POST /api/agent-ui -> one App Server request -> one response
```

It cannot power chat because it cannot represent streaming notifications,
server approval requests, or browser approval responses.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-rpc-route dev
```

See [reference/server-bridge.md](../reference/server-bridge.md) for exact
bridge boundaries.
