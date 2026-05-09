# Agent UI Next One-Shot RPC Example

This example exposes a Next.js Route Handler for one App Server request per HTTP `POST`.

It is useful for host-owned one-shot calls such as `model/list` or `account/read`. It is not the chat-capable Agent UI bridge because a single HTTP response cannot carry long-lived App Server notifications, server approval requests, or browser approval responses.

Use `examples/codex-local-web` and `attachAgentUiWebSocketBridge()` for the real local web app experience:

```text
browser UI -> same-origin WebSocket bridge -> codex app-server --listen stdio://
```

Run:

```sh
bun run dev
```
