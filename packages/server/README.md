# @nyosegawa/agent-ui-server

Node local bridge helpers for Agent UI.

Use this package when a host application needs local WebSocket bridge helpers,
upload handling, or one-shot RPC utilities around Codex App Server.

## Install

```sh
bun add @nyosegawa/agent-ui-server @nyosegawa/agent-ui-core @nyosegawa/agent-ui-codex
```

## Common Imports

| Use case | Import |
| --- | --- |
| Full-chat WebSocket bridge | `import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";` |
| Lower-level upgraded-socket handler | `import { handleAgentUiWebSocketConnection } from "@nyosegawa/agent-ui-server";` |
| Local media upload/static helper | `import { createAgentUiLocalMediaHelper } from "@nyosegawa/agent-ui-server";` |
| One-shot RPC helpers | `import { createAgentUiNextRpcRoute, createAgentUiExpressMiddleware } from "@nyosegawa/agent-ui-server";` |
| Bearer WebSocket subprotocol verification | `import { verifyAgentUiBearerSubprotocol } from "@nyosegawa/agent-ui-server";` |
| Raw stdio/process ownership | `import { createCodexAppServerBridge } from "@nyosegawa/agent-ui-server/advanced";` |

## Package Boundary

Use the package root for normal host integration: WebSocket bridges, local
media, one-shot RPC, method policy, server-request policy, dynamic-tool policy,
redaction, and host-event helpers. Use `/advanced` only when the host
deliberately owns raw stdio process composition.

This package provides bridge helpers. Host applications own process lifecycle,
authorization, network exposure, deployment topology, persistence, and resource
policy.

Use explicit bridge admission, browser method policy, one-shot method policy,
dynamic-tool policy, local media serving, redaction, and host event sinks.
Non-loopback bridges, upload/static authorization, tenant/workspace isolation,
audit storage, billing, and deployment policy remain host-owned.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
