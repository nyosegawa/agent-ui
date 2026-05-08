# Agent UI

Embeddable UI for Codex-powered coding agents.

Agent UI provides React components, headless hooks, state management, and transport adapters for applications built on OpenAI Codex App Server.

## Status

MVP implementation is in place. Core state, Codex App Server transports, React components, server bridge helpers, examples, fixtures, browser smoke tests, and package validation are available.

## MVP

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
```

## Docs

Start with [docs/README.md](./docs/README.md).

## Demo

Run the fixture-backed docs and hosted-demo site:

```sh
bun run --cwd examples/docs-site dev
```
