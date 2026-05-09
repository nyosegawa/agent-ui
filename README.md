# Agent UI

Embeddable UI for Codex-powered coding agents.

Agent UI provides React components, headless hooks, state management, and transport adapters for applications built on OpenAI Codex App Server.

## Status

The real local app path is the primary release target: browser UI -> same-origin host bridge -> `codex app-server --listen stdio://` -> real Codex account, usage, model, thread, turn, approval, and diff events.

## Local Release Scope

```text
local-only
single-user
stdio Codex App Server
ChatGPT managed auth
device-code login UI
React components and hooks
stable App Server API only
```

## Packages

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

## Docs

Start with [docs/README.md](./docs/README.md).

## Quickstart

Run the real local Codex web app:

```sh
bun install
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Then open the printed `http://127.0.0.1:5174` URL. The app starts a local Codex App Server through `@nyosegawa/agent-ui-server`.

Run the fixture-backed package smoke demo separately:

```sh
bun run --cwd examples/docs-site dev
```

The Next.js example is a one-shot RPC Route Handler only. Use the local web app's WebSocket bridge for streaming chat, approvals, and live diagnostics.
