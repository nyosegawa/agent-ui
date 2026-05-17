# Installation

Agent UI is split into small packages so hosts can choose the surfaces they
need.

## Packages

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

Most React hosts use:

```sh
bun add @nyosegawa/agent-ui-react @nyosegawa/agent-ui-codex
```

Local Node hosts that start or proxy Codex App Server also use:

```sh
bun add @nyosegawa/agent-ui-server
```

## React And CSS

React is a peer dependency. The package supports React 18.3+ and React 19.

Import the default style sheet once:

```ts
import "@nyosegawa/agent-ui-react/styles.css";
```

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
