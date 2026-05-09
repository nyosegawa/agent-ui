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

`ThreadSidebar` includes a lightweight persisted-session browser. `Load` calls `thread/list` with optional search text, `limit: 25`, `sortKey: "updated_at"`, and descending order, then shows that returned page with loading and empty states. Selecting a stored thread calls `thread/read` with `includeTurns: true` and activates the hydrated snapshot.

When a stored thread is loaded as `notLoaded` or `loaded`, the thread header shows `Resume`. That action calls `thread/resume` with `excludeTurns: true` because the preview history is already hydrated. Hosts that want a different history surface can use `useAgentThreadHistory()` and `useAgentThreadReader()` directly.

Hydrated history opens at the latest messages. Long persisted messages are preview-first with an explicit expand control, and very large command-output histories render the latest entries with a count summary so old sessions stay usable in the browser.

## Approval Components

`AgentApprovalPrompt` reads pending server requests through `useAgentApprovals()`.

Default behavior:

- command approval responds with stable `{ decision: "accept" }`
- file-change approval responds with stable `{ decision: "accept" }`
- session approval responds with stable `{ decision: "acceptForSession" }`
- default decline responds with stable `{ decision: "decline" }`
- rejection sends a JSON-RPC error and clears local pending state

The default card shows request id, command or file path context, and the raw normalized payload. Approval buttons include request kind and request id in their accessible names.

## Diff And Work Log

`AgentDiffViewer` renders a read-only CodeMirror diff preview with line-level highlighting for file headers, hunks, additions, and removals. It accepts raw unified diff strings, turn-level `{ diff }` payloads, App Server thread item `changes: [{ path, kind, diff }]`, and apply-patch approval `fileChanges` maps. Structured payloads are summarized with changed file names and addition/removal counts before the read-only patch body. A textual fallback remains in the DOM before hydration and for non-browser rendering.

`AgentWorkLog` renders command output grouped by thread turn. Large stored histories are capped in the default UI and each terminal entry can be expanded independently. For richer terminal behavior, build a host component with `useAgentThread()` rather than exposing `thread/shellCommand` as a generic browser component.

## Run Controls

`AgentRunControls` renders the controls expected in the chat window before sending a turn:

- execution mode: Review, Auto, Read-only, or Full access
- model: values from `model/list`
- effort: supported reasoning efforts from the selected model, with a model-default option
- working directory: optional `cwd` override for real local thread and turn requests

The selected values are stored in normalized run settings. `thread/start` receives `model` and `cwd`. `turn/start` receives `approvalPolicy`, `sandboxPolicy`, `model`, `effort`, and `cwd`.

Agent UI does not expose Codex collaboration/execution preset APIs in the MVP. The built-in execution mode segmented control is a stable App Server convenience layer over documented `turn/start` fields only.

## Usage

`AgentUsage` renders account rate-limit windows from `account/rateLimits/updated` notifications or `account/rateLimits/read` responses. It supports the current App Server `usedPercent`/`windowDurationMins` shape and legacy fixture-style `used`/`limit` windows.

`normalizeUsageWindows()` is exported for hosts that want to render the same 5-hour and weekly windows in custom chrome.

`AgentChat` calls `useAgentBootstrap()` on startup so the real local app reads account, model, and usage state as soon as the bridge connects. Authenticated accounts suppress the login button; unauthenticated accounts show a first-run device-code login call to action. `AgentRunControls` and `AgentUsage` still auto-refresh when rendered standalone; `AgentChat` disables their standalone refresh path to avoid duplicate startup requests.

## Web Components

`@nyosegawa/agent-ui-web-components` exports `defineAgentChatElement()`. The custom element accepts `transport`, `initialState`, and `slots` as JavaScript properties and renders the standard React chat surface.

```ts
import "@nyosegawa/agent-ui-react/style.css";
import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();
document.querySelector("agent-chat").transport = transport;
```
