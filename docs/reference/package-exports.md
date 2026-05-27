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
transport, SDK adapter, and auth helpers. Browser
code should import the WebSocket transport from
`@nyosegawa/agent-ui-codex/websocket` so Node stdio code stays out of the browser
bundle.

Default support is stable App Server API only. Experimental API requires
explicit opt-in. Generated stable App Server types are an advanced public
surface at `@nyosegawa/agent-ui-codex/stable-types`; they are useful for hosts
that intentionally track protocol drift, but they are not re-exported from the
package root. Undocumented deep imports such as
`@nyosegawa/agent-ui-codex/generated/stable` are blocked by the export map.

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
- `--aui-*` design-system tokens and the bundled plain CSS theme

The package root also exports lower-level surfaces for advanced hosts:
`AgentStatusBar`, `AgentFirstRun`, `AgentRunControls`, `ComposerRunSettings`,
`AgentThemeToggle`, `AgentDiffViewer`, thread-history helpers,
transcript-window helpers, and sidebar/status formatting utilities. The
documented components below are the recommended host-facing primitives; these
helpers remain public because they are re-exported by the package barrel.

React does not export Codex request builders such as `threadStartParams()`,
`turnStartParams()`, `textInput()`, `localImageInput()`, or generated Codex
method parameter types. Hosts that need to construct App Server request params
or structured user input should import them from
`@nyosegawa/agent-ui-codex/request-builders` or use a host-provided Codex
session/controller.

The default UI is transcript-first. Usage, diagnostics, status summaries, run
settings, and side panels are exported as host-composition primitives instead
of being mandatory chat chrome.
Theme and locale state are also host-owned: `AgentChat` and `AgentShell`
accept an optional `theme` prop, `AgentChat` accepts `locale` and `messages`,
and `AgentThemeToggle` / `AgentLocaleSelect` are controlled primitives hosts
can render outside the transcript surface.

The only public stylesheet export is
`@nyosegawa/agent-ui-react/styles.css`. That file imports private source chunks
from `packages/react/src/styles/*`; package builds copy those chunks under
`dist/styles/*` for the bundled stylesheet only. Hosts should not import
`dist/styles/*` or rely on internal `.aui-*` selectors as a styling contract.
The stable customization surface is the token set in
`packages/react/src/styles/tokens.css`, plus documented component props,
slots, render props, and `className` attachment points.

The default UI keeps the high-traffic surfaces split internally:

- `components.ts`: public barrel; `components/chat.tsx`, `components/thread.tsx`, `components/composer.tsx`, `components/run-settings.tsx`, `components/status.tsx`, `components/sidebar.tsx`, `components/approvals.tsx`, and `components/locale.tsx`: responsibility-scoped React surfaces
- `i18n.tsx`: compatibility barrel for the i18n public API
- `i18n/`: locale normalization, interpolation, provider runtime, i18n types, and built-in locale dictionaries
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

The wrapper does not create transports, spawn Codex, or include CSS
automatically. Hosts should import `@nyosegawa/agent-ui-react/styles.css`.
Token overrides on the custom element or a wrapper are the supported styling
path.

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
    capabilities: {
      experimentalApi: false,
      requestAttestation: false,
    },
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

await bridge.transport.connect();
```

Headless usage:

```tsx
const thread = useAgentThread(threadId);
const approvals = useAgentApprovals(threadId);
const composer = useAgentComposer(threadId);
```

## Export Boundary Gates

The package boundary is mechanically checked after `bun run build`:

- `bun run test:api-snapshots` reads every package `exports` map and compares
  only public declaration targets with `test/api-snapshots/*`. Missing,
  changed, and stale snapshots fail unless `bun run test:api-snapshots:update`
  is run intentionally. Internal declaration chunks generated by the bundler,
  including hashed `.d.ts` files, are not public API snapshots unless they are
  reachable from an export map.
- `bun run test:package-resolution` reads the same export maps, verifies
  `import.meta.resolve`, ESM import, CJS `require`/`require.resolve`, and
  rejects undocumented deep imports such as package `dist/*`, `src/*`, generated
  Codex schema subpaths, and private CSS chunks.
- `bun run test:node-compat` checks important named exports and every public
  JavaScript export target from the built ESM/CJS output on Node.js LTS. Asset
  exports such as `@nyosegawa/agent-ui-react/styles.css` are resolver-checked,
  not executed as JavaScript.

Only these subpaths are public today:

- `@nyosegawa/agent-ui-core`
- `@nyosegawa/agent-ui-codex`
- `@nyosegawa/agent-ui-codex/request-builders`
- `@nyosegawa/agent-ui-codex/stable-types`
- `@nyosegawa/agent-ui-codex/websocket`
- `@nyosegawa/agent-ui-react`
- `@nyosegawa/agent-ui-react/styles.css`
- `@nyosegawa/agent-ui-server`
- `@nyosegawa/agent-ui-web-components`

React style chunks under `dist/styles/*` are copied package internals used by
`styles.css`, not host imports. Internal `.aui-*` selectors are likewise
implementation details; the design-system contract is the `--aui-*` token set
from `packages/react/src/styles/tokens.css`.
