# App Connectors

Codex App Server Apps/connectors listing through `app/list`.

Implementation lives in `examples/local-react-vite` at `/app-connectors` and
uses `AgentAppsPanel`. This example is about Codex Apps/connectors metadata,
not a host-owned app runtime.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/app-connectors
bun run test:e2e:playwright
```
