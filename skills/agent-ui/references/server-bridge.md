# Server Bridge

Use this when a browser Agent UI surface must stream real Codex App Server
threads, turns, approvals, usage, apps, hooks, or skills.

Only the full chat bridge can power `AgentChat`.

## Full Chat Bridge

The productized browser path is:

```text
browser Agent UI
  -> same-origin host WebSocket bridge
    -> codex app-server --listen stdio://
```

Use `attachAgentUiWebSocketBridge()` on the host server and
`createCodexWebSocketTransport()` in the browser.

Important defaults:

- full chat requires the long-lived WebSocket bridge
- one-shot RPC helpers cannot power `AgentChat`
- `admission` runs before App Server spawn when a request object is provided
- browser requests are filtered by `browserMethodPolicy`
- slow browser consumers are closed by the backpressure guard
- inbound message size and rate limits are enforced
- bridge diagnostics should be redacted before host stderr or browser exposure

Minimal server shape:

```ts
import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";

attachAgentUiWebSocketBridge({
  server,
  path: "/agent-ui/ws",
  cwd: process.cwd(),
  initialize: {
    capabilities: {
      experimentalApi: false,
      requestAttestation: false,
    },
    clientInfo: {
      name: "agent_ui_host",
      title: "Agent UI Host",
      version: "0.1.0",
    },
  },
});
```

For non-loopback or authenticated hosts, add `admission(request)` before any
App Server process can be spawned. If using the lower-level
`handleAgentUiWebSocketConnection()`, pass the original request object whenever
`admission` is the security boundary.
Same-origin routing and upstream `Origin` checks are not authentication.

## One-Shot RPC

Use one-shot RPC only for narrow read/list/admin actions that do not need
streaming turns, approvals, or server requests. Keep `allowedMethods` narrow.
Treat `allowedMethods: "all"` as a security-sensitive host decision.

## Implementation Checks

- Does the browser use a same-origin URL such as `/agent-ui/ws`?
- Is the host route bound to loopback for unauthenticated local examples?
- Is `admission` present for anything beyond private local development?
- Does the host preserve App Server JSON-RPC error `code` and `data`?
- Are server requests and approval responses forwarded through the Agent UI
  transport path?
- Is upload handling explicitly host-owned when attachments are enabled?

## Next.js Decision

Use a custom Node server, sidecar, or reverse proxy that can attach a long-lived
WebSocket bridge for full chat. A Next Route Handler can only implement
one-shot RPC with `createAgentUiNextRpcRoute()`. It cannot stream turns, receive
approval requests, or carry browser approval responses.
