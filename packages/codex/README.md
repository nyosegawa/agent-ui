# @nyosegawa/agent-ui-codex

Codex App Server transport, request builders, generated protocol metadata, and
normalization helpers for Agent UI.

Use this package when a host application connects Agent UI primitives to the
Codex App Server protocol.

## Install

```sh
bun add @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-core
```

## Common Imports

| Use case | Import |
| --- | --- |
| Browser WebSocket transport | `import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";` |
| Text, image, mention, and skill input builders | `import { textInput, localImageInput } from "@nyosegawa/agent-ui-codex/request-builders";` |
| Grouped productized clients | `import { createCodexClients } from "@nyosegawa/agent-ui-codex/clients";` |
| Session facade | `import { createCodexSession } from "@nyosegawa/agent-ui-codex/session";` |
| Stable generated method types | `import type { ThreadStartParams } from "@nyosegawa/agent-ui-codex/stable-types";` |
| Normalized event helpers | `import { normalizeCodexServerMessage } from "@nyosegawa/agent-ui-codex/normalizer";` |

## Package Boundary

This package models Codex App Server protocol behavior. It does not own the
Codex process lifecycle, user credentials, remote deployment policy, or
application-specific workflow orchestration.

Use the documented subpaths for browser-safe clients, request builders,
normalizers, stable generated types, the session facade, and WebSocket transport.
Generated schema files are source-owned implementation inputs, not deep-import
targets.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
