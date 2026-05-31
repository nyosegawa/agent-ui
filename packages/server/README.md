# @nyosegawa/agent-ui-server

Node local bridge helpers for Agent UI.

Use this package when a host application needs local WebSocket bridge helpers,
upload handling, or one-shot RPC utilities around Codex App Server.

## Install

```sh
bun add @nyosegawa/agent-ui-server @nyosegawa/agent-ui-core @nyosegawa/agent-ui-codex
```

## Package Boundary

This package provides bridge helpers. Host applications own process lifecycle,
authorization, network exposure, deployment topology, persistence, and resource
policy.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
