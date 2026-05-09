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
- `AgentApprovalPrompt`
- `AgentRunControls`
- `AgentComposer`

`AgentMessageList` is the primary product surface. It renders user messages,
assistant messages, and reasoning as the readable conversation. Command output
and file-change diffs are grouped into a per-turn Work trace below the same
turn, so real Codex history is inspectable without terminal logs dominating the
chat. Work traces are contextual timeline content, not separate panels below
the chat.

## Thread Sidebar

`ThreadSidebar` includes a lightweight persisted-session browser. `Load` calls `thread/list` with optional search text, `limit: 25`, `sortKey: "updated_at"`, and descending order, then shows that returned page with loading and empty states. When the App Server returns `nextCursor` / `next_cursor`, the sidebar shows `Load more` and appends the next page without losing the current page. Stored-session rows show the user-facing title plus status and update time; internal Codex JSONL session paths are not shown in the default list. Selecting a stored thread calls `thread/read` with `includeTurns: true` and activates the hydrated snapshot.

When a stored thread is loaded as `notLoaded` or `loaded`, the thread header shows `Resume`. That action calls `thread/resume` with `excludeTurns: true` because the preview history is already hydrated. The default UI maps internal protocol statuses to product-facing labels such as `Stored`, `Preview`, `Running`, and `Needs approval`; raw status strings are not shown unless the status is unknown to Agent UI. Hosts that want a different history surface can use `useAgentThreadHistory()` and `useAgentThreadReader()` directly.

Hydrated history opens at the latest messages. Long persisted messages are preview-first with an explicit expand control, structured App Server content arrays are converted to readable text, and command-heavy histories show a compact Work trace summary with older steps collapsed inside the relevant turn. If a `thread/read` response includes turns but still reports `notLoaded`, the default UI treats the hydrated view as `loaded`; stale item-level `inProgress` labels in loaded history are rendered as completed.

## Approval Components

`AgentApprovalPrompt` reads pending server requests through `useAgentApprovals()`.

Default behavior:

- command approval responds with stable `{ decision: "accept" }`
- file-change approval responds with stable `{ decision: "accept" }`
- session approval responds with stable `{ decision: "acceptForSession" }`
- default decline responds with stable `{ decision: "decline" }`
- rejection sends a JSON-RPC error and clears local pending state

The default card shows request id plus structured command or file-change context. Command approvals show command, working directory, approval policy, and sandbox when present. File-change approvals show path, summary, and a diff preview when the request includes patch data. The default UI does not dump the raw normalized payload into the browser surface; use `renderApproval` for host-specific diagnostic rendering. Approval buttons include request kind and request id in their accessible names.

## Timeline Activity

`AgentDiffViewer` renders a read-only CodeMirror diff preview with line-level highlighting for file headers, hunks, additions, and removals. It accepts raw unified diff strings, turn-level `{ diff }` payloads, App Server thread item `changes: [{ path, kind, diff }]`, and apply-patch approval `fileChanges` maps. Structured payloads are summarized with changed file names and addition/removal counts before the read-only patch body. A textual fallback remains in the DOM before hydration and for non-browser rendering.

Command output and file changes render inside a per-turn Work trace in
`AgentMessageList`. The Work trace summary shows command and file-change counts.
For completed turns that already have readable conversation text, the trace is
collapsed by default; command-only or actively running turns keep it open so
new work remains visible. Individual command rows show command, status, line
count, and a short output preview; the full terminal output is collapsed until
the user expands it. The default UI keeps only the latest activity rows for
command-heavy historical turns and displays a collapsed-count notice for older
steps. For richer terminal behavior, build a host component with
`useAgentThread()` rather than exposing `thread/shellCommand` as a generic
browser component.

## Run Controls

`AgentRunControls` renders the controls expected in the chat window before sending a turn:

- execution mode: Review, Auto, Read-only, or Full access
- model: values from `model/list`
- effort: supported reasoning efforts from the selected model, with a model-default option
- working directory: optional `cwd` override for real local thread and turn requests

The selected values are stored in normalized run settings. `thread/start` receives `model` and `cwd`. `turn/start` receives `approvalPolicy`, `sandboxPolicy`, `model`, `effort`, and `cwd`.

Agent UI does not expose Codex collaboration/execution preset APIs in the local release. The built-in execution mode segmented control is a stable App Server convenience layer over documented `turn/start` fields only.

## Usage

`AgentUsage` renders account rate-limit windows from `account/rateLimits/updated` notifications or `account/rateLimits/read` responses. It supports the current App Server `usedPercent`/`windowDurationMins` shape and legacy fixture-style `used`/`limit` windows.

`normalizeUsageWindows()` is exported for hosts that want to render the same 5-hour and weekly windows in custom chrome.

`AgentChat` calls `useAgentBootstrap()` on startup so the real local app reads account and model state as soon as the bridge connects. Usage is read only after `account/read` confirms an authenticated account, so first-run unauthenticated screens do not show stale or misleading usage cards. Authenticated accounts suppress the login button; unauthenticated accounts show a first-run device-code login call to action. While account state is still unknown, the empty state shows `Preparing Codex` and keeps the start action disabled. If the bridge is closed or errors before connection, the empty state shows a bridge-unavailable message instead of a misleading Start thread action. `AgentRunControls` and `AgentUsage` still auto-refresh when rendered standalone; `AgentChat` disables their standalone refresh path to avoid duplicate startup requests.

The local fixture example has a `/qa` route that links to deterministic visual
QA states for empty history, first-run login, bridge diagnostics, and the
default approval/diff/work-trace screen without needing to mutate real Codex
auth or bridge state.

## Web Components

`@nyosegawa/agent-ui-web-components` exports `defineAgentChatElement()`. The custom element accepts `transport`, `initialState`, and `slots` as JavaScript properties and renders the standard React chat surface.

```ts
import "@nyosegawa/agent-ui-react/style.css";
import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();
document.querySelector("agent-chat").transport = transport;
```
