# Agent UI Docs

Agent UI is an embeddable UI library for applications built on OpenAI Codex App Server.

The docs are organized as implementation-facing specifications. They intentionally avoid market/competitor background and focus on the decisions needed to build the library.

## vNext Status

`PLAN.md` and `TODO.md` are the source of truth for Agent UI vNext scope,
completed milestones, and quality gates. The current docs reflect the later
UI-quality, refactor, real-local, and Next.js bridge cleanup gates recorded in
`TODO.md`.

## Documents

- [Product](./product.md): product name, scope, non-goals, and release definition.
- [Packages](./packages.md): monorepo layout and package responsibilities.
- [Architecture](./architecture.md): state, transport, adapter, and component boundaries.
- [Protocol](./protocol.md): Codex App Server integration contract.
- [Authentication](./authentication.md): local device-code login and remote constraints.
- [Toolchain](./toolchain.md): runtime, package manager, build, test, and dependency baseline.
- [Testing](./testing.md): protocol, reducer, transport, component, and e2e strategy.
- [Security](./security.md): filesystem, shell, auth, remote, and multi-user constraints.
- [Roadmap](./roadmap.md): implementation order and future expansion.
- [Remote Deployment](./remote-deployment.md): advanced remote/WebSocket constraints.
- [Protocol Drift](./protocol-drift.md): schema update and snapshot review workflow.
- [agent-browser Verification](./agent-browser.md): local browser verification workflow.
- [Completeness Audit](./completeness-audit.md): final vNext capability and boundary audit.
- [Theming](./theming.md): CSS variable customization.
- [Component API](./component-api.md): drop-in component reference.
- [Headless Hooks](./headless-hooks.md): hook reference for custom layouts.

## Real Local App

`examples/codex-local-web` is the primary local Codex web experience. It starts a same-origin host bridge, which starts `codex app-server --listen stdio://`, then renders the React package against real account, model, thread, turn, approval, and diff events. The default chat is transcript-first; usage and diagnostics are standalone primitives that hosts can opt into.

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Manual real-local layout audit. Start the port-5175 server first; the audit
script checks the already-running page and does not start the example server.

```sh
AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

## Fixture Package Smoke

`examples/local-react-vite` is the deterministic fixture QA target. It exposes
`/`, `/?state=kitchen`, `/usage-only`, `/scoped-thread-pane`, `/app-connectors`,
`/host-workflow-recipe`, and `/fixture-gallery` so UI, usage, approval, command
output, diff, host-slot, and Apps surfaces can be checked without starting
Codex.

```sh
bun run --cwd examples/local-react-vite dev
```

## Current Release Scope

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
@nyosegawa/agent-ui-web-components
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

`examples/next-with-bridge-sidecar` demonstrates the full-chat Next.js shape:
a custom Node server serves Next and attaches `attachAgentUiWebSocketBridge()`
to the same origin. `examples/next-rpc-route` demonstrates
`createAgentUiNextRpcRoute()` for one-shot requests only.
