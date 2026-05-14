# Fixture Gallery

Deterministic Agent UI states for visual and browser review.

Implementation lives in `examples/local-react-vite` at `/fixture-gallery`
and `/qa`. The gallery renders desktop and mobile iframe previews for default,
empty, unauthenticated, bridge-error, kitchen-quality, scoped-thread,
usage-only, app-connectors, and host-workflow states. It is a visual QA surface,
not just a navigation index.

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/fixture-gallery
bun run test:e2e:playwright
```
