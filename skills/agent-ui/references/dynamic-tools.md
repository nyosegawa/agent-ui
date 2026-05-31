# Dynamic Tools

Use this when the host wants custom tool calls, app actions, workflow buttons,
or host-side integrations beyond Codex App Server's built-in behavior.

## Policy

Dynamic tools are host-owned. Agent UI may display tool state and route
requests through the App Server protocol, but the host owns execution,
permissions, side effects, and auditability.

The bridge does not execute dynamic tool requests unless the host passes a
`dynamicToolHandler`. Prefer the explicit MCP mapping helper when forwarding
selected dynamic tools:

```ts
import {
  attachAgentUiWebSocketBridge,
  createMcpDynamicToolHandler,
} from "@nyosegawa/agent-ui-server";

attachAgentUiWebSocketBridge({
  server,
  dynamicToolHandler: createMcpDynamicToolHandler({
    tools: [
      {
        namespace: "mcp__browser",
        server: "browser",
        tools: ["snapshot"],
      },
    ],
  }),
});
```

Unknown namespaces or tools should fail before any helper thread or
`mcpServer/tool/call` request is created.

Before implementing, identify:

- tool name and user-facing description
- exact input schema
- execution environment
- side effects
- permission review model
- grant lifetime and scope
- result shape and error redaction
- tests for approval, denial, and execution failure

## Safe Defaults

- Require manual permission review for side-effecting tools.
- Keep grants bounded by tool, thread/session, workspace, and time when
  possible.
- Treat shell, filesystem, network, browser automation, and credential access as
  sensitive.
- Leave `dynamicToolHelperPermissions` at `"manual"` unless the host has a
  reviewed policy for `"deny"`, `"grantRequestedForTurn"`, or a callback.
- Do not add tools only because one host app happens to need them if the user is
  asking for reusable Agent UI library work.

## Validation

Test:

- schema validation rejects malformed input
- permission denial is visible and does not execute
- approval executes once
- errors are rendered without leaking secrets
- transcript order remains understandable
