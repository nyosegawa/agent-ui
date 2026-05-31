# Surface Map

## Fixture App

Use for deterministic component and layout states:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Routes:

- `/`: baseline chat surface
- `/rich-transcript`: dense transcript and approval stress
- `/fixture-gallery`: component close-ups and previews
- `/host-workflow-recipe`: host-composed primitive layout
- `/usage-only`: usage primitives without chat assumptions
- `/scoped-thread-pane`: fixed-thread composition
- `/app-connectors`: Codex Apps/connectors metadata

CI gate:

```sh
bun run test:e2e:fixtures
```

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

Manual layout audit after starting the server:

```sh
bun run test:e2e:real-local-web-layout
```

## Route Ownership

Use fixture routes for deterministic visual states. Use real-local for
WebSocket bridge, account/model/thread/turn, uploads, streaming, steer,
interrupt, approval, and token usage behavior.
