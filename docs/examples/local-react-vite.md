# Local React Vite Fixture Example

Directory:

```text
examples/local-react-vite
```

Purpose:

- deterministic UI review without a real Codex process
- fixture-backed transcript, approval, command, diff, usage, and status states
- visual QA routes for component close-ups and full-page layouts

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Routes:

- `/`
- `/?state=kitchen`
- `/?state=empty`
- `/?state=unauth`
- `/?state=bridge-error`
- `/fixture-gallery`
- `/host-workflow-recipe`
- `/usage-only`
- `/scoped-thread-pane`
- `/app-connectors`

Playwright starts its own preview servers for automated checks. Do not rely on
a manually running 5174 server for `bun run test:e2e:playwright`.
