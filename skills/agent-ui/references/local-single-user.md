# Local Single-User Integration

Use this for localhost or personal Agent UI apps that should actually talk to
Codex App Server.

## Workflow

1. Detect the stack: Next.js App Router, custom Node server, Vite, or another
   React host.
2. Confirm the runtime can use Node.js `>=22` for published Agent UI packages
   and server helpers.
3. Respect the host package manager. Match the existing lockfile and do not
   create a second lockfile. Use published Agent UI packages from the registry
   unless the user explicitly asks for a local checkout or tarball smoke.
4. Add the needed packages:
   - `@nyosegawa/agent-ui-react`
   - `@nyosegawa/agent-ui-codex`
   - `@nyosegawa/agent-ui-server` when the host owns a Node bridge
5. Import `@nyosegawa/agent-ui-react/styles.css` once in the host's public style
   entry.
6. Add a same-origin WebSocket bridge with a fixed local path such as
   `/agent-ui/ws`.
7. Use `createCodexWebSocketTransport()` in the browser and wrap the UI in
   `AgentProvider`.
8. Start with the `AgentChat` preset unless the user asks for a custom product
   layout. Use `headless + primitives` only when the host owns the layout,
   routing, workflow gates, or surrounding product chrome.
9. Run the host's typecheck/build and a local browser smoke when possible.

## Browser Code Shape

Use the browser-safe transport subpath:

```tsx
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";

const transport = createCodexWebSocketTransport({
  url: new URL("/agent-ui/ws", window.location.origin.replace(/^http/, "ws")),
});

export function AgentUiSurface() {
  return (
    <AgentProvider transport={transport}>
      <AgentChat />
    </AgentProvider>
  );
}
```

## Same-Origin Bridge Skeleton

Use the root server API for the normal local bridge. Do not start with
`@nyosegawa/agent-ui-server/advanced` unless the host deliberately owns raw
stdio process composition.

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

Use the package root for React components, and use
`@nyosegawa/agent-ui-codex/request-builders` for Codex-shaped inputs such as
`localImageInput()` and `textInput()`. Prefer request-builder option names and
path aliases such as `AgentWorkingDirectory`, `AgentResourcePath`,
`AgentSkillPath`, and `AgentMentionPath` when host code prepares App
Server-shaped request inputs.

## Local Safety Defaults

- Bind unauthenticated examples to loopback.
- Use `bridgePolicy.admission` with the `local-loopback` default for local
  desktop sidecars.
- Keep non-loopback binding opt-in and noisy.
- For non-loopback use, require host-owned auth/session admission, explicit
  browser method policy, upload isolation, and an audit reason before exposing
  the bridge.
- Choose a specific `cwd`; do not derive arbitrary local paths from browser
  input.
- Keep dynamic tools disabled unless the user asks for host-owned tool
  execution.
- Add upload storage only when attachments are required.
- Do not put bearer tokens in WebSocket query strings.
- Treat `Origin` checks as a development convenience, not authentication.

## Explain To The User

Say "local single-user integration" rather than asking whether "server bridge"
is needed. Explain that a browser UI needs a same-origin route when it must send
real turns to Codex App Server.
