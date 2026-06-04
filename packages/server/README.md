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

Use explicit bridge admission, browser method policy, one-shot method policy,
dynamic-tool policy, local media serving, redaction, and host event sinks.
Non-loopback bridges, upload/static authorization, tenant/workspace isolation,
audit storage, billing, and deployment policy remain host-owned.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
