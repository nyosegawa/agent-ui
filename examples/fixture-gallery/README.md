# Fixture Gallery

Deterministic Agent UI states for visual and browser review.

Implementation lives in `examples/local-react-vite` at `/fixture-gallery`
and `/qa`.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Smoke path:

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
open http://127.0.0.1:5174/fixture-gallery
```

Central automated checks are documented in
[`docs/architecture/testing.md`](../../docs/architecture/testing.md).
