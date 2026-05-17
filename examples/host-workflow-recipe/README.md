# Host Workflow Recipe

Host-owned workflow composition using generic Agent UI primitives.

Implementation lives in `examples/local-react-vite` at `/host-workflow-recipe`
and builds the thread column from primitives instead of the `AgentChat` preset.

Workflow-specific panel state, storage, registries, and app tools stay in the
host application. This route intentionally does not introduce app-specific core
APIs.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/host-workflow-recipe
```

Central automated checks are documented in
[`docs/architecture/testing.md`](../../docs/architecture/testing.md).
