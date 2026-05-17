# Usage Only

Standalone account/rate-limit usage rendering with no chat chrome, composer, or
thread sidebar.

Implementation lives in `examples/local-react-vite` at `/usage-only` and uses
`AgentProvider` plus `AgentUsagePanel`.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/usage-only
```

Central automated checks are documented in
[`docs/architecture/testing.md`](../../docs/architecture/testing.md).
