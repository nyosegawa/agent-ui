# Installation

Agent UI is split into small packages so hosts can choose the surfaces they
need.

## Requirements

- Node.js `>=22` for published packages and local server helpers.
- Bun, npm, pnpm, or another package manager that honors package export maps.

## Packages

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

Full-chat React hosts use:

```sh
bun add @nyosegawa/agent-ui-react @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-server
```

With npm:

```sh
npm install @nyosegawa/agent-ui-react @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-server
```

Hosts that use the custom element wrapper also install:

```sh
bun add @nyosegawa/agent-ui-web-components
```

Hosts that only render against an already-owned transport may omit the server
package. Local Node hosts that start or proxy Codex App Server need:

```sh
bun add @nyosegawa/agent-ui-server
```

For a complete browser and server setup, see
[First Host App](./guides/first-host-app.md).

## React And CSS

React is a peer dependency. The package supports React 18.3+ and React 19.
`@nyosegawa/agent-ui-web-components` also depends on the React peer packages
because it renders the React preset inside the custom element.

Import the default stylesheet once:

```ts
import "@nyosegawa/agent-ui-react/styles.css";
```

This is the only public React stylesheet entry point. Do not import copied
package chunks such as `@nyosegawa/agent-ui-react/dist/styles/*`; they are
private files used by `styles.css`.

The design-system API is the public `--aui-*` token set. Override those tokens
on a host wrapper or theme scope when customizing color, type, spacing, radii,
elevation, control sizing, focus, or motion. Internal `.aui-*` selectors can
change with component implementation and are not a stable host styling
contract.

## Browser Transport

Browser code should import the WebSocket transport from the browser-safe
subpath:

```ts
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
```

The package root also exports Node stdio functionality, so browser bundles
should prefer the subpath.

## Local Server Bridge

Node hosts use `@nyosegawa/agent-ui-server` to start or attach a bridge. Full
chat requires a long-lived WebSocket bridge; one-shot HTTP helpers are for
single App Server requests only. See
[reference/server-bridge.md](./reference/server-bridge.md).
