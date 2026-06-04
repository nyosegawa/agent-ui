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
sets `bridgePolicy.admission: { mode: "local-loopback" }` and
`browserMethodPolicy: "productized"` explicitly before attaching `/agent-ui/ws`.
The WebSocket bridge is the full-chat boundary: it starts
`codex app-server --listen stdio://`, streams turn events, forwards approval
responses, and emits bridge health phases to the host. A plain Next Route
Handler cannot replace this path for `AgentChat` because request/response RPC
does not carry long-lived turns or server requests.

`POST /agent-ui/upload` writes to a local temp upload directory and
`/agent-ui/assets/<id>` serves browser-safe previews. Images become
`localImageInput(path)` in the React resolver; non-images become explicit text
such as `Attached file: /absolute/path`. The page stores the returned preview
URL by local path and passes `resolveLocalMediaUrl` to `AgentChat`, so transcript
local media renders through the same-origin asset route instead of raw local
paths. Upload cleanup runs when the HTTP server closes and on `SIGINT` or
`SIGTERM`.

Bridge health logging is a host-side developer/audit hook only. This example
does not add hosted-service auth, tenant isolation, persistence, upload
authorization, process isolation, billing, or deployment policy to Agent UI
core.

For exact bridge security defaults and non-loopback requirements, see
[Server Bridge](../reference/server-bridge.md).
