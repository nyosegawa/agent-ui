# Local React Vite Fixture Example

Directory:

```text
examples/local-react-vite
```

Purpose:

- deterministic UI review without a real Codex process
- fixture-backed transcript, approval, command, diff, usage, and status states
- visual QA routes for component close-ups and full-page layouts
- owner of fixture-gallery, host-workflow, close-up, and usage-only route CSS
  that should not ship through `@nyosegawa/agent-ui-react/styles.css`
- consumer of the same `--aui-*` design-system tokens used by the distributed
  React stylesheet, so examples exercise the library contract instead of an
  independent visual language

The example may use local class names for route structure and QA composition,
but host applications should treat those classes as example implementation
details. Public styling guidance remains: import
`@nyosegawa/agent-ui-react/styles.css` once and customize Agent UI through
`--aui-*` token overrides.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Routes:

- `/`: baseline AgentChat fixture with transcript, approvals, command output,
  diff, usage, and stored thread preview hydration.
- `/rich-transcript`: intentionally dense transcript and approval stress
  fixture for renderer and interaction review.
- `/?state=empty`: authenticated first-run workspace with no stored threads.
- `/?state=unauth`: device-code login state.
- `/?state=bridge-error`: local bridge diagnostics state.
- `/fixture-gallery`: component close-ups plus route previews.
- `/host-workflow-recipe`: host-composed primitive layout.
- `/composer-retry`: failed optimistic first-message retry through the public
  composer controller.
- `/transcript-density`: compact transcript route with verbose command/file
  blocks and chat text filtered out.
- `/resource-resolution`: local media rendered from structured browser-safe
  resource metadata instead of raw local paths.
- `/scoped-thread-lists`: independent scoped history collections for host-owned
  list panes.
- `/usage-only`: standalone usage primitive examples.
- `/scoped-thread-pane`: fixed-thread composition.
- `/app-connectors`: Codex Apps/connectors metadata.

The fixture gallery renders component close-ups directly rather than through
iframes. Its critical-state section covers the mobile empty state, start
composer, sidebar drawer selection, local media fallback, and optimistic
pending message examples used for visual review. Its component close-up section
covers primitive renderers including the custom command/transcript block
example.

`bun run test:e2e:fixtures` starts its own preview server on port 4173 for the
fixture browser checks. Do not rely on a manually running 5174 server for this
command.

Fixture browser checks are organized by product contract rather than by route or
file size. Keep maintainer details about e2e file ownership in
[Testing](../architecture/testing.md), and keep this page focused on the public
example purpose, routes, and run command.
