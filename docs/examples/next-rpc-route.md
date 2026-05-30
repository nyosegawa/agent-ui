# Next RPC Route Example

Directory:

```text
examples/next-rpc-route
```

Purpose:

- demonstrate `createAgentUiNextRpcRoute()`
- expose one allowlisted target App Server method per HTTP `POST`
- support allowlisted metadata calls such as `account/read` or `model/list`

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-rpc-route dev
```

Endpoint:

```text
POST /api/agent-ui
```

This example is not a chat bridge. Use the WebSocket sidecar for full chat.
The helper rejects host-only methods such as `fs/readFile`, `command/exec`, and
`mcpServer/tool/call` by default. Keep `allowedMethods` scoped to the calls this
route actually needs.

The runnable route narrows `allowedMethods` to `account/read` and `model/list`.
Requests use `{ "method": "...", "params": {} }`; responses are
`{ "result": ... }` or `{ "error": ... }`. Denied methods are rejected before an
App Server process is spawned. The helper has no built-in admission or
authentication, so production routes must add host-owned route authentication.
`allowedMethods: "all"` removes the method policy and should be treated as a
host-admin endpoint only.
