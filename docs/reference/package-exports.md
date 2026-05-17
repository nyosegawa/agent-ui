# Package Exports

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
    next-rpc-route/
    next-with-bridge-sidecar/
    recipes/
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

The package root exports these building blocks directly: state/event/transport
types, reducer and selector helpers, `FakeAgentTransport`, fixture utilities,
and `createOpenAIAgentsSdkTransportAdapter()`. JSON-RPC framing is Codex
adapter responsibility, not core responsibility.

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
- generated-schema-backed input helpers for text, images, mentions, skills, and
  agent-browser verification turns

The package root exports JSON-RPC helpers, protocol capability metadata,
normalizers, request builders, session helpers, stdio transport, WebSocket
transport, SDK adapter, auth helpers, and `CodexStable` generated types. Browser
code should import the WebSocket transport from
`@nyosegawa/agent-ui-codex/websocket` so Node stdio code stays out of the browser
bundle.

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

The package root also exports lower-level surfaces for advanced hosts:
`AgentStatusBar`, `AgentFirstRun`, `AgentRunControls`, `ComposerRunSettings`,
`AgentDiffViewer`, thread-history helpers, transcript-window helpers, and
sidebar/status formatting utilities. The documented components below are the
recommended host-facing primitives; these helpers remain public because they are
re-exported by the package barrel.

The default UI is transcript-first. Usage, diagnostics, status summaries, run
settings, and side panels are exported as host-composition primitives instead
of being mandatory chat chrome.

The default UI keeps the high-traffic surfaces split internally:

- `components.ts`: public barrel; `components/chat.tsx`, `components/thread.tsx`, `components/composer.tsx`, `components/run-settings.tsx`, `components/status.tsx`, `components/sidebar.tsx`, and `components/approvals.tsx`: responsibility-scoped React surfaces
- `timeline.tsx`: transcript item primitives for messages, reasoning, tool calls, command output, and file-change diffs in App Server item order
- `transcript-window.ts`: large hydrated transcript item ordering and incremental window policy
- `diff-viewer.tsx`: read-only diff rendering and patch payload normalization

React must be a peer dependency.

## `@nyosegawa/agent-ui-server`

Node and framework integration.

Responsibilities:

- local bridge
- Codex App Server process lifecycle
- Next.js one-shot RPC Route Handler helper
- same-origin WebSocket bridge helpers for full chat integrations
- local upload helper for browser `File` to App Server-readable path adapters
- Express middleware
- dynamic tool helper thread utilities, server-request policy helpers,
  host-event sinks, and redaction utilities
- auth/token forwarding recipes
- `detectAgentBrowser()` for repo skill path, CLI version, and core skill checks

Browser packages must not spawn child processes directly.

## `@nyosegawa/agent-ui-web-components`

Custom element wrapper for host applications that do not want to mount React directly.

Responsibilities:

- define `<agent-chat>` or a caller-supplied tag name
- accept `transport`, `initialState`, and `slots` as JavaScript properties
- render the standard React `AgentChat` inside `AgentProvider`

The wrapper does not create transports, spawn Codex, or include CSS automatically. Hosts should import `@nyosegawa/agent-ui-react/styles.css`.

## Examples

- `examples/local-react-vite`: fixture-backed local component smoke target.
- `examples/codex-local-web`: real local Codex web app target using a same-origin WebSocket bridge to `codex app-server --listen stdio://`.
- `examples/next-rpc-route`: Next.js one-shot RPC Route Handler example. It is not the chat-capable bridge.
- `examples/next-with-bridge-sidecar`: Next.js full-chat example using a custom Node server with `attachAgentUiWebSocketBridge()`.
- `examples/recipes`: typed host integration recipes and remote deployment notes.
- `examples/docs-site`: small package-overview/demo landing page. It is not a markdown documentation renderer.

The route-focused example directories `examples/app-connectors`,
`examples/fixture-gallery`, `examples/host-workflow-recipe`,
`examples/scoped-thread-pane`, and `examples/usage-only` contain README
handoffs for routes implemented by `examples/local-react-vite`.

## Browser Public API

```tsx
import { AgentProvider, AgentChat } from "@nyosegawa/agent-ui-react";
import { createCodexWebSocketTransport } from "@nyosegawa/agent-ui-codex/websocket";

const transport = createCodexWebSocketTransport({
  url: "ws://127.0.0.1:5175/agent-ui/ws",
  initialize: {
    clientInfo: {
      name: "agent_ui_example",
      title: "Agent UI Example",
      version: "0.1.0",
    },
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

Browser hosts connect to a host-owned WebSocket endpoint. Node hosts that own
the local process use the server package:

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
