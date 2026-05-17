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

- `/`: baseline AgentChat fixture with transcript, approvals, command output,
  diff, usage, and stored thread preview.
- `/rich-transcript`: intentionally dense transcript and approval stress
  fixture for renderer and interaction review.
- `/?state=empty`: authenticated first-run workspace with no stored threads.
- `/?state=unauth`: device-code login state.
- `/?state=bridge-error`: local bridge diagnostics state.
- `/fixture-gallery`: component close-ups plus route previews.
- `/host-workflow-recipe`: host-composed primitive layout.
- `/usage-only`: standalone usage primitive examples.
- `/scoped-thread-pane`: fixed-thread composition.
- `/app-connectors`: Codex Apps/connectors metadata.

Playwright starts its own preview servers for automated checks. Do not rely on
a manually running 5174 server for `bun run test:e2e:playwright`.
