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
- `/host-workflow-recipe`: host integration reference shell with a host header,
  embedded `AgentChat`, host side panel, mobile drawer behavior, and a
  host-owned review sheet layered with public `--aui-z-*` tokens. The route
  also resolves browser file attachments through a host-owned resolver that
  returns structured, redacted resource metadata.
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

The host workflow route is the deterministic host integration reference for the
fixture app. It keeps workflow context, review sheet state, and product chrome
host-owned while embedding `AgentChat` as the reusable Codex App Server UI
surface. The route also proves that host-owned overlays can sit above Agent UI
drawers by choosing values relative to the public layer tokens, not by styling
private `.aui-*` implementation selectors. Its local attachment resolver is a
fixture-only stand-in for host upload storage: it returns id, MIME type, size,
preview, and redacted path metadata so the host side panel can display safe
resource details without exposing raw local paths.

`bun run test:e2e:fixtures` starts its own preview server on port 4173 for the
fixture browser checks. Do not rely on a manually running 5174 server for this
command.

Fixture browser checks are organized by product contract rather than by route or
file size. Keep maintainer details about e2e file ownership in
[Testing](../architecture/testing.md), and keep this page focused on the public
example purpose, routes, and run command.
