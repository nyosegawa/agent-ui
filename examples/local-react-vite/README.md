# Agent UI Local React Vite Fixture

Deterministic fixture app for component, layout, transcript, approval, usage,
and visual QA states without a real Codex process.

Detailed docs: [docs/examples/local-react-vite.md](../../docs/examples/local-react-vite.md).

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful routes include `/showcase` for the public component catalog with
copyable React snippets, `/showcase/components` for the direct public API
catalog, `/showcase/patterns` for host workflow patterns,
`/showcase/default-conversation`, `/showcase/rich-transcript`,
`/maintainer-gallery` for maintainer visual QA,
`/showcase/composed-shell` for neutral shell composition,
`/showcase/host-workflow-recipe` for the advanced host integration reference shell,
`/showcase/composer-primitives`, `/showcase/transcript-content`,
`/showcase/approvals-status`, `/showcase/thread-navigation`,
`/showcase/usage-only`, and
`/showcase/app-connectors`.
