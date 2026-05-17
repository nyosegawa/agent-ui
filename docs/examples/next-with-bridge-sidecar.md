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
