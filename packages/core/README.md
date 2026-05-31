# @nyosegawa/agent-ui-core

Protocol-neutral state and transport primitives for Agent UI.

Use this package when a host application needs the normalized thread state,
transport contracts, reducer behavior, or shared types without rendering React
components.

## Install

```sh
bun add @nyosegawa/agent-ui-core
```

## Package Boundary

This package does not start Codex, own persistence, manage credentials, or
orchestrate host workflows. Host applications connect it to their own runtime
and transport policy.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
