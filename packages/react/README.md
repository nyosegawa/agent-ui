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

Customize the preset through public props, hooks, controllers, tokens, and the
`components` map. Import `@nyosegawa/agent-ui-react/styles.css` once; do not
depend on private style chunks, internal `.aui-*` selectors, source modules, or
generated Codex payloads as React API.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
