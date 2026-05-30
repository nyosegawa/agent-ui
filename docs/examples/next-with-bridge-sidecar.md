# Next WebSocket Sidecar Example

Directory:

```text
examples/next-with-bridge-sidecar
```

Purpose:

- demonstrate full-chat Next.js integration
- serve Next and `/agent-ui/ws` from the same origin
- expose `POST /agent-ui/upload` for browser `File` persistence
- support streaming turns, approvals, uploads, and diagnostics

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-with-bridge-sidecar dev
```

Use this shape when a Next app needs `AgentChat`.
The sidecar binds to `127.0.0.1` by default and rejects non-loopback
`AGENT_UI_HOST` values unless `AGENT_UI_ALLOW_NON_LOOPBACK=1` is set. Only use
that opt-in on trusted host-owned networks after adding the auth controls your
deployment needs.

The custom Node server owns both Next routing and Agent UI bridge routes. It
does not configure a bridge `admission` hook. `/agent-ui/ws` starts
`codex app-server --listen stdio://` for the browser session. `POST
/agent-ui/upload` writes to a local temp upload directory. Images become
`localImageInput(path)` in the React resolver; non-images become explicit text
such as `Attached file: /absolute/path`. Upload cleanup runs when the HTTP
server closes and on `SIGINT` or `SIGTERM`.

For exact bridge security defaults and non-loopback requirements, see
[Server Bridge](../reference/server-bridge.md).
