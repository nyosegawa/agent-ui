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

## Real Local App

`examples/codex-local-web` is the primary local Codex web experience. It starts a same-origin host bridge, which starts `codex app-server --listen stdio://`, then renders the React package against real account, usage, model, thread, turn, approval, and diff events.

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

## Fixture Package Smoke

`examples/docs-site` is the static documentation and fixture-backed hosted-demo target. It renders implementation notes next to a fixture-backed `AgentChat`, so UI, usage, approval, command output, and diff surfaces can be checked without starting Codex.

```sh
bun run --cwd examples/docs-site dev
```
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

Run the real local Codex web app:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Run the fixture-backed Vite smoke example:

```sh
bun run --cwd examples/local-react-vite dev
```

The fixture example uses a `FakeAgentTransport` for browser-only smoke testing of thread navigation, streaming text, command output, diff preview, and approval cards. It is not the real local app release gate.

Additional typed recipes live in `examples/recipes` for custom component slots, headless hooks, theming, and optional WebSocket wiring.

## Next.js Note

`examples/next-local-bridge` demonstrates `createAgentUiNextRpcRoute()`, a one-shot RPC Route Handler. It is not the real local chat bridge because plain Route Handlers do not keep a browser session connected for streaming notifications and approval round-trips. Use `examples/codex-local-web` or another Node WebSocket host for the full local Codex web experience.
