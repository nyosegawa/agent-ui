# Next.js

Agent UI supports two Next.js shapes. They are intentionally different.

## Full Chat: WebSocket Sidecar

Use `examples/next-with-bridge-sidecar` when the app needs streaming turns,
approvals, attachment uploads, diagnostics, and browser responses.

```text
Next UI -> /agent-ui/ws -> codex app-server --listen stdio://
Next UI -> POST /agent-ui/upload -> host temp path -> localImage input
```

The example uses a custom Node server that serves Next and attaches
`attachAgentUiWebSocketBridge()` to the same HTTP server. It binds to
`127.0.0.1` by default, exposes `/agent-ui/ws` and `POST /agent-ui/upload`, and
does not configure a bridge `admission` hook. Non-loopback use requires
host-owned auth, admission, upload scoping, process isolation, resource limits,
and audit logging.

Image uploads are mapped to `localImageInput(path)`. Non-image uploads are
mapped to explicit text such as `Attached file: /absolute/path`. The example
cleans its upload directory when the custom server closes and on `SIGINT` or
`SIGTERM`.

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
server approval requests, or browser approval responses. The runnable example
narrows `allowedMethods` to `account/read` and `model/list`; denied methods are
rejected before an App Server process is spawned. The helper accepts
`{ "method": "...", "params": {} }` and returns either `{ "result": ... }` or
`{ "error": ... }`.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-rpc-route dev
```

See [reference/server-bridge.md](../reference/server-bridge.md) for exact
bridge boundaries.
