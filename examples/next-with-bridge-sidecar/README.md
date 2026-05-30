# Agent UI Next With WebSocket Bridge

This is the recommended Next.js integration for the full Agent UI chat
experience. It uses a custom Node server that serves Next.js and attaches
`/agent-ui/ws` to the same HTTP server with `attachAgentUiWebSocketBridge()`.

Detailed docs: [docs/examples/next-with-bridge-sidecar.md](../../docs/examples/next-with-bridge-sidecar.md).

The browser stays same-origin:

```text
Next UI -> /agent-ui/ws -> codex app-server --listen stdio://
Next UI -> POST /agent-ui/upload -> temp local path -> localImage / explicit text input
```

Do not implement full chat with a plain Next Route Handler. Route Handlers are
request/response only; streaming turns, approval requests, and browser approval
responses require a long-lived WebSocket bridge.

This example has no bridge `admission` hook. It is loopback-first development
infrastructure; add host-owned auth, admission, upload scoping, isolation,
resource limits, and audit logging before non-loopback use.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-with-bridge-sidecar dev
```
