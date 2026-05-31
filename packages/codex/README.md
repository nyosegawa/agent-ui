# @nyosegawa/agent-ui-codex

Codex App Server transport, request builders, generated protocol metadata, and
normalization helpers for Agent UI.

Use this package when a host application connects Agent UI primitives to the
Codex App Server protocol.

## Install

```sh
bun add @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-core
```

## Package Boundary

This package models Codex App Server protocol behavior. It does not own the
Codex process lifecycle, user credentials, remote deployment policy, or
application-specific workflow orchestration.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
