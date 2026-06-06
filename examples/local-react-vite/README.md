# Agent UI Local React Vite Fixture

Deterministic fixture app for component, layout, transcript, approval, usage,
and visual QA states without a real Codex process.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful routes include `/`, `/rich-transcript`, `/fixture-gallery`,
`/host-workflow-recipe` for the host integration reference shell,
`/usage-only`, `/scoped-thread-pane`, and `/app-connectors`.
