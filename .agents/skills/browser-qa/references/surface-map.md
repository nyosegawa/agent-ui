# Surface Map

## Fixture App

Use for deterministic component and layout states:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Routes:

- `/showcase`: public starting-point catalog with live previews and copyable
  snippets. `/` is an alias.
- `/showcase/components`: snippet-facing public API catalog.
- `/showcase/patterns`: workflow and advanced pattern catalog.
- `/showcase/component-preview?api=AgentChat`: generated component preview
  surface used by the component catalog.
- `/showcase/default-conversation`: baseline chat surface.
- `/showcase/rich-transcript`: dense transcript and approval stress.
- `/maintainer-gallery`: maintainer-only component close-ups, probes,
  specimens, and previews.
- `/showcase/composed-shell`: neutral composed shell route for sidebar history,
  status, and thread view.
- `/showcase/host-workflow-recipe`: advanced host-composed primitive layout.
- `/showcase/composer-primitives`: normal composer slot.
- `/showcase/transcript-content`: transcript pane primitive route.
- `/showcase/approvals-status`: review rail for status and pending approvals.
- `/showcase/thread-navigation`: host-owned thread selection composition.
- `/showcase/usage-only`: usage primitives without chat assumptions.
- `/showcase/scoped-thread-pane`: fixed-thread composition.
- `/showcase/app-connectors`: Codex Apps/connectors metadata.

CI gate:

```sh
bun run test:e2e:fixtures
```

Broad route/viewport layout gate:

```sh
bunx playwright test examples/local-react-vite/e2e/visual-route-matrix.e2e.ts \
  --config playwright.fixtures.config.ts
```

The matrix consumes `visual-qa-manifest.ts`; update the manifest instead of
duplicating route and viewport lists.

## Real Local App

Use for App Server-backed behavior:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Default URL: `http://127.0.0.1:5175/`.

CI/release gate:

```sh
bun run test:e2e:real-local
```

Deterministic layout gate:

```sh
bunx playwright test examples/codex-local-web/e2e/real-local-layout.e2e.ts \
  --config playwright.real-local.config.ts
```

Manual layout audit after starting the server:

```sh
bun run test:e2e:real-local-web-layout
```

## Route Ownership

Use fixture routes for deterministic visual states. Use real-local for
WebSocket bridge, account/model/thread/turn, uploads, streaming, steer,
interrupt, approval, and token usage behavior.
