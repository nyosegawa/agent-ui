# Next WebSocket Sidecar Example

Directory:

```text
examples/next-with-bridge-sidecar
```

Purpose:

- demonstrate full-chat Next.js integration
- serve Next and `/agent-ui/ws` from the same origin
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
