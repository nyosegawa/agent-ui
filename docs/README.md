# Agent UI Docs

Agent UI is an embeddable UI library for applications built on OpenAI Codex App Server.

The docs are organized as implementation-facing specifications. They intentionally avoid market/competitor background and focus on the decisions needed to build the library.

## Documents

- [Product](./product.md): product name, scope, non-goals, and MVP definition.
- [Packages](./packages.md): monorepo layout and package responsibilities.
- [Architecture](./architecture.md): state, transport, adapter, and component boundaries.
- [Protocol](./protocol.md): Codex App Server integration contract.
- [Authentication](./authentication.md): local device-code login and remote constraints.
- [Toolchain](./toolchain.md): runtime, package manager, build, test, and dependency baseline.
- [Testing](./testing.md): protocol, reducer, transport, component, and e2e strategy.
- [Security](./security.md): filesystem, shell, auth, remote, and multi-user constraints.
- [Roadmap](./roadmap.md): implementation order and post-MVP expansion.
- [Remote Deployment](./remote-deployment.md): advanced remote/WebSocket constraints.
- [Protocol Drift](./protocol-drift.md): schema update and snapshot review workflow.
- [Theming](./theming.md): CSS variable customization.
- [Component API](./component-api.md): drop-in component reference.
- [Headless Hooks](./headless-hooks.md): hook reference for custom layouts.

## Current MVP

```text
local-only
single-user
stdio Codex App Server
ChatGPT managed auth
device-code login UI
React components and hooks
stable App Server API only
```

## Package Names

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
```

## Primary Design Rule

Agent UI is not a hosted Codex service and does not provide Codex access, credentials, or billing. The host application starts or connects to Codex App Server using the user's own authentication.

## Local Quickstart

```sh
bun install
bun run typecheck
bun run lint
bun test
bun run build
bun run test:e2e:playwright
```

Run the local Vite example:

```sh
bun run --cwd examples/local-react-vite dev
```

The example uses a fixture-backed `FakeAgentTransport` for browser-only smoke testing of thread navigation, streaming text, command output, diff preview, and approval cards. Node hosts should start Codex through `@nyosegawa/agent-ui-server`.
