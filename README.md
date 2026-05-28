# Agent UI

Embeddable UI components for applications built on OpenAI Codex App Server.

Agent UI provides React components, headless hooks, normalized state,
transports, and local bridge helpers for building Codex-powered coding-agent
interfaces inside a host web application.

```text
browser UI -> host bridge -> codex app-server --listen stdio://
```

`AgentChat` is a convenience preset. The main API is the primitive set that lets
host apps place thread, status, usage, approvals, composer, apps, skills, and
diagnostics surfaces inside their own product shell.

## Packages

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

## Quickstart

Install dependencies:

```sh
bun install
```

Run the real local Codex web app:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Open the printed local URL. By default this example uses
`http://127.0.0.1:5175`.

Run the deterministic fixture app:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful fixture routes:

- `/`
- `/rich-transcript`
- `/fixture-gallery`
- `/host-workflow-recipe`
- `/usage-only`
- `/scoped-thread-pane`
- `/app-connectors`

Running-turn follow-ups follow Codex Desktop semantics. App Server has no
`queue/message` API; Agent UI keeps `queuedFollowUps` as UI-local state. Enter
while a turn is running adds a pending follow-up card above the composer,
scoped to the current thread and retaining structured attachments. `Send now`
and Cmd/Ctrl+Enter call `turn/steer` with the active `expectedTurnId`; queued
items stay unsent if the active turn changes. Stop calls only `turn/interrupt`.

## React

```tsx
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

const transport = createCodexWebSocketTransport({
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});

export function App() {
  return (
    <AgentProvider transport={transport}>
      <AgentChat />
    </AgentProvider>
  );
}
```

The browser transport expects a host-owned WebSocket endpoint. Use
`@nyosegawa/agent-ui-server` to attach a local bridge to a Node HTTP server.

Import `@nyosegawa/agent-ui-react/styles.css` once for the bundled design
system. Hosts customize the default UI by overriding `--aui-*` tokens from
`packages/react/src/styles/tokens.css` on their own theme scope. The copied
`dist/styles/*` files and internal `.aui-*` selectors are implementation
details of that stylesheet, not public host import paths or styling contracts.

## Design

- User and assistant messages stay in transcript order.
- Tool, command, output, and file-change items render inline with the
  surrounding conversation.
- The design-system API is the `--aui-*` token set; example route CSS uses
  those tokens as visual QA for library surfaces, while recipe theming
  intentionally demonstrates host token overrides.
- Pending approvals render inside the transcript, anchored after source
  item/turn metadata when present and at the transcript tail only when source
  metadata is absent. They stay pending until App Server sends
  `serverRequest/resolved`.
- Usage, diagnostics, skills, apps, and status are composable primitives, not
  mandatory side rails.
- Attachments are host-resolved. Images use `localImage` paths; arbitrary
  files are uploaded by the host and sent as explicit `Attached file:
/absolute/path` text because App Server has no generic local-file input type.

## Documentation

Start with [docs/README.md](./docs/README.md).

## Validation

Package and API boundaries are checked with:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

`validate:packages` is intentionally ordered: build, `publint`, then
`arethetypeswrong`.

Key pages:

- [Getting Started](./docs/getting-started.md)
- [React Guide](./docs/guides/react.md)
- [Server Bridge](./docs/reference/server-bridge.md)
- [React Components](./docs/reference/react-components.md)
- [Hooks](./docs/reference/hooks.md)
- [Testing](./docs/architecture/testing.md)
- [Browser Verification](./docs/guides/browser-verification.md)
- [Security](./docs/architecture/security.md)

## Examples

- [Real Codex Local Web](./docs/examples/codex-local-web.md)
- [Fixture Gallery and Local Vite](./docs/examples/local-react-vite.md)
- [Next RPC Route](./docs/examples/next-rpc-route.md)
- [Next WebSocket Sidecar](./docs/examples/next-with-bridge-sidecar.md)
- [Docs Site Example](./docs/examples/docs-site.md)
- [Recipes](./docs/examples/recipes.md)

## Scope

Agent UI is a local-first Codex App Server UI library. It is not a hosted Codex
service, credential provider, billing layer, IDE, or generic chatbot library.
The host application owns authentication, deployment, workspace access, and any
product-specific workflow state.
