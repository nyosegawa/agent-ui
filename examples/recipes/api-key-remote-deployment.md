# API-Key Remote Deployment Recipe

API-key remote operation is an advanced host-owned deployment pattern. It is not the local release default. The default remains ChatGPT managed auth through local `codex app-server --listen stdio://`.

Use this recipe only when the host application owns the API key, billing boundary, authorization model, and deployment environment.

## Shape

```text
browser
  -> host app session
  -> same-origin bridge
  -> server-side Codex App Server process or compatible App Server endpoint
  -> API key available only in the server environment
```

Rules:

- never send the API key to the browser
- never put API keys in WebSocket URLs or query strings
- prefer short-lived server-side sessions over long-lived bridge tokens
- redact API-key-shaped values from stdout, stderr, and structured logs
- isolate workspace roots exactly as in the multi-user recipe

## Server Environment

If the selected Codex App Server build supports API-key authentication, inject the key only into the child process environment:

```ts
import { createCodexAppServerBridge } from "@nyosegawa/agent-ui-server";

const bridge = createCodexAppServerBridge({
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  initialize: {
    clientInfo: {
      name: "agent_ui_api_key_host",
      title: "Agent UI API Key Host",
      version: "0.1.0",
    },
  },
});
```

If the local Codex App Server build does not support API-key auth for the required workflow, keep using device-code login and do not emulate auth in Agent UI.

## Browser Transport

Browser code should connect only to a host-owned same-origin bridge:

```ts
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";

const transport = createCodexWebSocketTransport({
  reconnect: {
    initialDelayMs: 500,
    maxAttempts: 5,
    maxDelayMs: 10_000,
  },
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});
```

The host session authenticates the browser. The API key remains on the server.

## Operational Checks

Before enabling this deployment:

- verify App Server auth mode in the target Codex version
- verify no raw API key appears in process logs
- verify command/file-change approvals are still visible in the browser
- verify bridge shutdown removes the child process
- verify billing/project ownership is visible in host admin tools
