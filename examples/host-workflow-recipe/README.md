# Host Workflow Recipe

Host-owned workflow composition using generic Agent UI slots.

Implementation lives in `examples/local-react-vite` at `/host-workflow-recipe`
and uses `AgentWorkspace panel={...}`. Workflow-specific panel state, storage,
registries, and app tools stay in the host application.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/host-workflow-recipe
bun run test:e2e:playwright
```
