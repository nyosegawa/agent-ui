# Agent UI Local React Vite Fixture

Deterministic fixture app for component, layout, transcript, approval, usage,
and visual QA states without a real Codex process.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful routes include `/` for the showcase index,
`/showcase/default-conversation`, `/showcase/rich-transcript`,
`/maintainer-gallery` for maintainer visual QA,
`/showcase/host-workflow-recipe` for the host integration reference shell,
`/showcase/usage-only`, `/showcase/scoped-thread-pane`, and `/showcase/app-connectors`.
