# @nyosegawa/agent-ui-react

React preset, headless controllers, and transcript-first UI primitives for Agent UI.

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

This package provides three public entrypoints:

- `@nyosegawa/agent-ui-react` for the default `AgentProvider` / `AgentChat`
  preset.
- `@nyosegawa/agent-ui-react/primitives` for visual building blocks.
- `@nyosegawa/agent-ui-react/headless` for hooks, controllers, and stable
  input/resource types.

It does not own routing, persistence, credentials, process lifecycle, or
host-specific product workflows.

Customize the preset through public props, the `components` map, primitives,
headless controllers, and tokens. Import
`@nyosegawa/agent-ui-react/styles.css` once; do not depend on private style
chunks, internal `.aui-*` selectors, source modules, or generated Codex
payloads as React API.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
