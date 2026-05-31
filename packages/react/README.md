# @nyosegawa/agent-ui-react

React hooks, components, and transcript-first UI primitives for Agent UI.

Use this package when a host application wants to compose Agent UI in a React
surface while keeping runtime ownership in the host.

## Install

```sh
bun add @nyosegawa/agent-ui-react @nyosegawa/agent-ui-core @nyosegawa/agent-ui-codex
```

Import the public stylesheet once:

```ts
import "@nyosegawa/agent-ui-react/styles.css";
```

## Package Boundary

This package renders UI primitives and provides React integration. It does not
own routing, persistence, credentials, process lifecycle, or host-specific
product workflows.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
