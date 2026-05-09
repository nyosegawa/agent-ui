# Packages

## Package Set

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

Packages are split by responsibility, but the local bridge is included in the official package set.

## Monorepo Layout

```text
agent-ui/
  packages/
    core/
    codex/
    react/
    server/
    web-components/
  examples/
    codex-local-web/
    docs-site/
    local-react-vite/
    next-local-bridge/
    recipes/
  fixtures/
    app-server/
  docs/
```

## `@nyosegawa/agent-ui-core`

Core state and protocol-neutral primitives.

Responsibilities:

- normalized event model
- request/response abstraction
- reducer and state machine
- selectors
- transport interface
- fake transport
- fixture utilities
- optional OpenAI Agents SDK runner adapter for simple text streaming demos

Must not include:

- React
- Node child process management
- direct public exposure of Codex generated types

## `@nyosegawa/agent-ui-codex`

Codex App Server adapter.

Responsibilities:

- vendored generated schema
- stable protocol type mapping
- JSON-RPC-lite request correlation
- stdio transport
- optional websocket transport
- initialize handshake
- server request response handling
- App Server notifications to normalized events
- device-code login request helpers
- optional Codex SDK-like client adapter for hosts that already own a compatible client

Default support is stable App Server API only. Experimental API requires explicit opt-in.

The SDK adapter is not the primary integration path and does not add an `@openai/codex` runtime dependency.

## `@nyosegawa/agent-ui-react`

React UI and hooks.

Responsibilities:

- `AgentProvider`
- thread hooks
- turn hooks
- approval hooks
- composer hooks
- drop-in components
- headless customization API
- CSS variables and plain CSS theme

The default UI keeps the high-traffic surfaces split internally:

- `components.tsx`: shell, auth/status, run controls, approvals, usage, and thread history
- `timeline.tsx`: conversation messages, per-turn Work traces, command output, and file-change activity
- `diff-viewer.tsx`: read-only diff rendering and patch payload normalization

React must be a peer dependency.

## `@nyosegawa/agent-ui-server`

Node and framework integration.

Responsibilities:

- local bridge
- Codex App Server process lifecycle
- Next.js one-shot RPC Route Handler helper
- Express middleware
- auth/token forwarding recipes

Browser packages must not spawn child processes directly.

## `@nyosegawa/agent-ui-web-components`

Custom element wrapper for host applications that do not want to mount React directly.

Responsibilities:

- define `<agent-chat>` or a caller-supplied tag name
- accept `transport`, `initialState`, and `slots` as JavaScript properties
- render the standard React `AgentChat` inside `AgentProvider`

The wrapper does not create transports, spawn Codex, or include CSS automatically. Hosts should import `@nyosegawa/agent-ui-react/style.css`.

## Examples

- `examples/local-react-vite`: fixture-backed local component smoke target.
- `examples/codex-local-web`: real local Codex web app target using a same-origin WebSocket bridge to `codex app-server --listen stdio://`.
- `examples/next-local-bridge`: Next.js one-shot RPC Route Handler example. It is not the chat-capable bridge.
- `examples/recipes`: typed host integration recipes and remote deployment notes.
- `examples/docs-site`: static documentation and hosted-demo build target.

## Initial Public API

```tsx
import { AgentProvider, AgentChat } from "@nyosegawa/agent-ui-react";
import { createCodexStdioTransport } from "@nyosegawa/agent-ui-codex";

const transport = createCodexStdioTransport({
  command: "codex",
  args: ["app-server", "--listen", "stdio://"],
  clientInfo: {
    name: "agent_ui_example",
    title: "Agent UI Example",
    version: "0.1.0",
  },
});

export function App() {
  return (
    <AgentProvider transport={transport}>
      <AgentChat />
    </AgentProvider>
  );
}
```

Current local-process usage keeps spawning in the server package:

```ts
import { createCodexAppServerBridge } from "@nyosegawa/agent-ui-server";

const bridge = createCodexAppServerBridge({
  initialize: {
    clientInfo: {
      name: "agent_ui_host",
      title: "Agent UI Host",
      version: "0.1.0",
    },
  },
});

await bridge.transport.connect();
```

Headless usage:

```tsx
const thread = useAgentThread(threadId);
const approvals = useAgentApprovals(threadId);
const composer = useAgentComposer(threadId);
```
