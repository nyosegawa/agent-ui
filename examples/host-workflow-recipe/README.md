# Host Workflow Recipe

Host-owned workflow composition using generic Agent UI primitives.

Implementation lives in `examples/local-react-vite` at `/host-workflow-recipe`
and builds the thread column from `AgentThreadSurface`, `AgentThreadHeader`,
`AgentThreadTimeline`, `AgentApprovalQueue`, `AgentComposerPanel`, and status
and usage primitives. The host-owned context panel renders current thread
summary, validation status, pending requests, plan/context files, usage, and
non-interactive demo action state from generic Agent UI hooks.

Workflow-specific panel state, storage, registries, and app tools stay in the
host application. This route intentionally does not introduce app-specific core
APIs.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/host-workflow-recipe
bun run test:e2e:playwright
```
