# Component API

The React package exposes drop-in components backed by headless hooks. Components accept normalized core state, not generated Codex protocol types.

## Provider

```tsx
<AgentProvider transport={transport}>
  <AgentChat />
</AgentProvider>
```

`AgentProvider` accepts:

- `transport`: an `AgentTransport`
- `initialState`: optional `AgentSessionState` for fixtures, tests, or restored local state

## AgentChat

```tsx
<AgentChat
  className="my-agent-ui"
  slots={{
    renderApproval: (approval) => <MyApprovalCard approval={approval} />,
    renderItem: (item, turn) => <MyItem item={item} turn={turn} />,
  }}
/>
```

`AgentChat` composes:

- `ThreadSidebar`
- `AgentStatusBar`
- `AgentUsage`
- `AgentMessageList`
- `AgentWorkLog`
- `AgentDiffPanel`
- `AgentApprovalPrompt`
- `AgentRunControls`
- `AgentComposer`

## Thread Sidebar

`ThreadSidebar` includes a lightweight persisted-session browser. `Load` calls `thread/list` with optional search text and upserts returned threads without changing the active thread. Selecting a stored thread calls `thread/read` with `includeTurns: true` and activates the hydrated snapshot.

When a stored thread is loaded as `notLoaded` or `loaded`, the thread header shows `Resume`. That action calls `thread/resume` with `excludeTurns: true` because the preview history is already hydrated. Hosts that want a different history surface can use `useAgentThreadHistory()` and `useAgentThreadReader()` directly.

## Approval Components

`AgentApprovalPrompt` reads pending server requests through `useAgentApprovals()`.

Default behavior:

- command approval currently needs schema-backed response payload verification before the real local app release gate can be closed
- file-change approval currently needs schema-backed response payload verification before the real local app release gate can be closed
- rejection sends a JSON-RPC error and clears local pending state

The default card shows request id, command or file path context, and the raw normalized payload.

## Diff And Work Log

`AgentDiffViewer` renders a read-only CodeMirror diff preview with line-level highlighting for file headers, hunks, additions, and removals. A textual fallback remains in the DOM before hydration and for non-browser rendering.

`AgentWorkLog` renders command output grouped by thread turn. For richer terminal behavior, build a host component with `useAgentThread()` rather than exposing `thread/shellCommand` as a generic browser component.

## Run Controls

`AgentRunControls` renders the controls expected in the chat window before sending a turn:

- execution mode: Review, Auto, Read-only, or Full access
- model: values from `model/list`
- effort: supported reasoning efforts from the selected model, with a model-default option

The selected values are stored in normalized run settings and are merged into `turn/start` as `approvalPolicy`, `sandboxPolicy`, `model`, and `effort`.

## Usage

`AgentUsage` renders account rate-limit windows from `account/rateLimits/updated` notifications or `account/rateLimits/read` responses. It supports the current App Server `usedPercent`/`windowDurationMins` shape and legacy fixture-style `used`/`limit` windows.

`normalizeUsageWindows()` is exported for hosts that want to render the same 5-hour and weekly windows in custom chrome.

## Web Components

`@nyosegawa/agent-ui-web-components` exports `defineAgentChatElement()`. The custom element accepts `transport`, `initialState`, and `slots` as JavaScript properties and renders the standard React chat surface.

```ts
import "@nyosegawa/agent-ui-react/style.css";
import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();
document.querySelector("agent-chat").transport = transport;
```
