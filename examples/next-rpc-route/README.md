# Agent UI Next RPC Route Example

This example exposes a Next.js Route Handler for one allowlisted target App Server method per HTTP `POST`.

It is useful for host-owned one-shot calls such as `model/list` or `account/read`. It is not the chat-capable Agent UI bridge because a single HTTP response cannot carry long-lived App Server notifications, server approval requests, or browser approval responses.

Detailed docs: [docs/examples/next-rpc-route.md](../../docs/examples/next-rpc-route.md).

Use `examples/next-with-bridge-sidecar` or `examples/codex-local-web` with
`attachAgentUiWebSocketBridge()` for the real local web app experience:

```text
browser UI -> same-origin WebSocket bridge -> codex app-server --listen stdio://
```

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-rpc-route dev
```

Endpoint:

```text
POST /api/agent-ui
```

The route accepts `{ "method": "...", "params": {} }` and returns
`{ "result": ... }` or `{ "error": ... }`. It narrows `allowedMethods` to
`account/read` and `model/list`; denied methods fail before an App Server
process is spawned.

For full chat, streaming turns, approvals, or attachments, use
`examples/next-with-bridge-sidecar` instead.
