# Scoped Thread Pane

Generic fixed-thread composition for hosts that need one Codex thread without
following the global active thread selection.

Implementation lives in `examples/local-react-vite` at `/scoped-thread-pane`
and uses `AgentProvider` plus `AgentThreadView threadId="thread-fixed"`.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/scoped-thread-pane
```

Central automated checks are documented in
[`docs/architecture/testing.md`](../../docs/architecture/testing.md).
