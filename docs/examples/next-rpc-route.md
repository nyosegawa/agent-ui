# Next RPC Route Example

Directory:

```text
examples/next-rpc-route
```

Purpose:

- demonstrate `createAgentUiNextRpcRoute()`
- expose one App Server request per HTTP `POST`
- support host-owned metadata calls such as `account/read` or `model/list`

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-next-rpc-route dev
```

Endpoint:

```text
POST /api/agent-ui
```

This example is not a chat bridge. Use the WebSocket sidecar for full chat.
