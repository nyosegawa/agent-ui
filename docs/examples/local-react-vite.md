# Local React Vite Fixture Example

Directory:

```text
examples/local-react-vite
```

Purpose:

- deterministic UI review without a real Codex process
- fixture-backed transcript, approval, command, diff, usage, and status states
- visual QA routes for component close-ups and full-page layouts
- owner of route-gallery, host-workflow, close-up, and usage-only route CSS
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

- `/showcase`: public component catalog with ownership notes, live example
  links, and copyable React snippets. `/` is an alias for this index.
- `/showcase/components`: direct public API catalog for snippet-facing React
  APIs.
- `/showcase/patterns`: workflow-oriented pattern catalog that links each host
  use case back to the snippet and deterministic route.
- `/showcase/default-conversation`: baseline AgentChat fixture with transcript,
  approvals, command output, diff, usage, and stored thread preview hydration.
- `/showcase/rich-transcript`: intentionally dense transcript and approval stress
  fixture for renderer and interaction review.
- `/showcase/empty-authenticated-workspace`: authenticated first-run workspace with no stored threads.
- `/showcase/unauthenticated-first-run`: device-code login state.
- `/showcase/bridge-error`: local bridge diagnostics state.
- `/maintainer-gallery`: maintainer-only component close-ups, probes,
  specimens, critical states, and route previews.
- `/showcase/composed-shell`: neutral composed shell route for sidebar history,
  status, and thread view inside host-owned layout.
- `/showcase/host-workflow-recipe`: advanced host integration reference shell with a host header,
  embedded `AgentChat`, host side panel, mobile drawer behavior, and a
  host-owned review sheet layered with public `--aui-z-*` tokens. The route
  also resolves browser file attachments through a host-owned resolver that
  returns structured, redacted resource metadata, and resolves transcript local
  media through browser-safe preview and missing-media fallback records. Add
  `?firstMessage=optimistic` to start from an empty host shell with delayed
  first-message reconciliation. The side panel also includes a scoped thread
  history loader that refreshes, paginates, and previews stored sessions through
  `useAgentThreadListController`, plus a host-owned workflow gate that toggles
  host actions without taking over Agent UI transcript, composer, approval, or
  history behavior.
- `/showcase/composer-retry`: failed optimistic first-message retry through the public
  composer controller.
- `/showcase/composer-primitives`: normal composer primitive placement for a
  host-owned input slot.
- `/showcase/transcript-content`: default transcript and content primitive
  rendering without density overrides.
- `/showcase/approvals-status`: review rail composition for status summaries,
  detailed notices, and pending approval actions.
- `/showcase/transcript-density`: compact transcript route with verbose command/file
  blocks and chat text filtered out.
- `/showcase/resource-resolution`: local media rendered from structured browser-safe
  resource metadata instead of raw local paths.
- `/showcase/usage-only`: standalone usage primitive examples.
- `/showcase/thread-navigation`: host-owned thread selection composed from
  `ThreadList` and `AgentThreadView`.
- `/showcase/scoped-thread-pane`: fixed-thread composition.
- `/showcase/app-connectors`: Codex Apps/connectors metadata.
- `/maintainer/scoped-thread-lists`: maintainer-only contract fixture for
  independent scoped history collections.

The maintainer gallery and `/maintainer/*` routes render component close-ups and
contract probes directly rather than through iframes. Their critical-state
section covers the mobile empty state, start composer, sidebar drawer selection,
local media fallback, and optimistic pending message examples used for visual
review. The component close-up section covers primitive renderers including the
custom command/transcript block example.

The public showcase index is intentionally separate from the maintainer gallery.
It exposes only the five primary starting points: the default `AgentChat`
preset, a composed shell, a composer slot, a transcript pane, and a review rail.
Advanced capabilities such as thread navigation, usage/diagnostics,
apps/skills metadata, and first-run controls move to the pattern and component
pages instead of competing with the main integration choices. The public
hierarchy is:

- `/showcase`: start here, with preview/code cards for the primary paths.
- `/showcase/components`: look up snippet-facing APIs grouped by setup,
  presets, layout primitives, status/review, usage, onboarding, and advanced
  capability metadata.
- `/showcase/patterns`: choose by host workflow or advanced capability instead
  of component name.

Each path documents the Agent UI versus host ownership split, shows only the API
names used directly by its snippet, and includes a public-API code snippet that
can be copied from the page. Embedded previews use `embed=1`, so iframe content
shows the component or pattern specimen itself while the explanation stays on
the catalog page.
The showcase pages preserve `theme` and `locale` query parameters across their
internal navigation and iframe previews so display settings stay consistent while
moving between `/showcase`, `/showcase/components`, and `/showcase/patterns`.
`test/public-showcase-catalog.test.ts` keeps that catalog synchronized with the
public visual component surface so newly exported components must be classified
for user-facing guidance through non-UI coverage metadata while catalog entries
cannot regress to empty or stale copy examples.

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

The maintainer gallery, docs screenshot capture, and route reachability checks use
one maintainer-owned visual route inventory so example routes do not drift from
browser coverage. When adding or removing a fixture route, follow the
repository-level workflow in [Testing](../architecture/testing.md). Keep this
page focused on the public example purpose, routes, and run command.
