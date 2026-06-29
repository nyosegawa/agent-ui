# First Host App

Use this path when you are adding Agent UI to a new host application and want
the default full-chat experience.

Agent UI provides reusable UI, transport, Codex request helpers, and a local
bridge helper. The host application still owns the HTTP server, authentication,
workspace selection, Codex App Server process policy, upload authorization,
persistence, routing, and deployment.

## Requirements

- Node.js `>=22` for published packages and local server helpers.
- React 18.3+ or React 19.
- A local `codex` CLI that can run `codex app-server --listen stdio://`.
- Local ChatGPT/Codex authentication for the account, model, thread, and turn
  APIs used by Codex App Server.
- A host-owned HTTP server that can serve the browser app and the Agent UI
  WebSocket route from the same origin.

## Install

Install the full-chat package set in the host app:

```sh
bun add @nyosegawa/agent-ui-react @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-server
```

Use the package manager already owned by the host project. With npm:

```sh
npm install @nyosegawa/agent-ui-react @nyosegawa/agent-ui-codex @nyosegawa/agent-ui-server
```

## Browser

Create a browser transport, import the single public stylesheet once, and
render `AgentChat` inside `AgentProvider`:

```tsx
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

const transport = createCodexWebSocketTransport({
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});

export function App() {
  return (
    <AgentProvider transport={transport}>
      <AgentChat />
    </AgentProvider>
  );
}
```

`@nyosegawa/agent-ui-react/styles.css` is the public stylesheet entry point.
Customize the preset with `--aui-*` tokens and public component replacement
props; do not import `dist/*`, source files, or internal selectors.

## Server

Attach a same-origin WebSocket bridge to the host HTTP server:

```ts
import { attachAgentUiWebSocketBridge } from "@nyosegawa/agent-ui-server";
import { createServer } from "node:http";

const server = createServer((request, response) => {
  response.statusCode = 404;
  response.end("Not found");
});

attachAgentUiWebSocketBridge({
  server,
  path: "/agent-ui/ws",
  cwd: process.cwd(),
  bridgePolicy: {
    admission: { mode: "local-loopback" },
  },
  browserMethodPolicy: "productized",
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

server.listen(5175, "127.0.0.1");
```

Only the full WebSocket bridge can power `AgentChat`. One-shot RPC helpers are
for a single allowlisted App Server method per HTTP request.

`local-loopback` is the default local development posture. Use
`host-callback` admission, session tokens, server-side workspace validation,
resource limits, and audit logging before exposing a bridge beyond private
loopback. Same-origin routing and `Origin` checks are not authentication.

## Choose A React Surface

| Need | Use |
| --- | --- |
| Default chat with transcript, composer, approvals, and optional sidebar | `AgentChat` |
| Replace visible pieces while keeping preset behavior | `AgentChat` `components` prop |
| Send from host-owned buttons or menus into preset chat | `useAgentChatController().sendMessage()` |
| Own the layout but keep Agent UI state/controllers | `@nyosegawa/agent-ui-react/headless` |
| Own the layout and render Agent UI visual building blocks | `@nyosegawa/agent-ui-react/primitives` |

Start with `AgentChat`. Move to `/headless` and `/primitives` only when the
host owns layout, routing, workflow gates, or surrounding product chrome.

## First Validation

Verify the first host app with host-appropriate checks:

- The browser can open the same origin that serves `/agent-ui/ws`.
- The bridge rejects disallowed sessions or workspaces before Codex App Server
  is spawned.
- The transcript can start a thread and complete a turn.
- Reloading the page can resume or rehydrate the selected thread as intended by
  the host.
- Pending command, file, permission, user-input, MCP, auth, or attestation
  requests stay visible to the host UI instead of being silently accepted.
- Attachments, if enabled, use host-owned upload authorization and return an
  App Server-readable local path plus a browser-safe preview URL.

For unit or component tests that should not spawn a real Codex App Server, use
the public success-path fixture from the Codex package:

```ts
import { createCodexSession } from "@nyosegawa/agent-ui-codex/session";
import { createCodexAppServerSuccessFixture } from "@nyosegawa/agent-ui-codex/test-fixtures";

const fixture = createCodexAppServerSuccessFixture();
await fixture.transport.connect();
const session = createCodexSession(fixture.transport);

const start = await session.thread.start({ cwd: "/repo" });
const threadId = start.thread.id;
await session.turn.start({ input: "hello", threadId });

expect(fixture.events.map((event) => event.type)).toContain("turn/completed");
```

This fixture covers the App Server success path: canonical thread ids,
`thread/start`, `thread/read`, `turn/start`, assistant deltas, queued
`turn/steer`, `turn/interrupt`, and `turn/completed`. It does not validate
bridge admission, bearer tokens, Codex process lifecycle, upload storage,
workspace authorization, or multi-user policy; keep separate host checks for
those production concerns.

For package-specific examples, see [React](./react.md),
[Host Integration](./host-integration.md), and
[Server Bridge](../reference/server-bridge.md).
