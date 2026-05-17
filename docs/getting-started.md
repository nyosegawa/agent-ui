# Getting Started

This page runs the two local apps used during development:

- the real Codex-backed local web app
- the deterministic fixture app for UI review

## Prerequisites

- Bun, using the version pinned in the repository `packageManager` field.
- A local `codex` CLI with `codex app-server --listen stdio://`.
- Local ChatGPT/Codex authentication if you want the real app to load account,
  model, thread, and turn state.

Install dependencies:

```sh
bun install
```

## Real Local Codex Web App

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Open the printed local URL. By default the app uses
`http://127.0.0.1:5175`.

The path is:

```text
browser UI -> same-origin WebSocket bridge -> codex app-server --listen stdio://
```

The server owns the Codex App Server child process and attachment upload
endpoint. The browser owns only the Agent UI surface.

## Fixture App

Run the deterministic fixture app separately:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful routes:

- `/`: default transcript-first surface
- `/rich-transcript`: intentionally dense transcript and approval stress fixture
- `/fixture-gallery`: visual QA gallery and component close-ups
- `/host-workflow-recipe`: host-composed primitive layout
- `/usage-only`: usage primitives without chat chrome
- `/scoped-thread-pane`: fixed-thread composition
- `/app-connectors`: Codex Apps/connectors metadata

The fixture app uses `FakeAgentTransport`; it is for deterministic browser
review and component QA, not real Codex behavior.

## Validation

For the normal local validation matrix, see
[architecture/testing.md](./architecture/testing.md).
