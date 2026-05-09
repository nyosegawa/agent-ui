# Architecture

## Layers

```text
codex app-server
  -> @nyosegawa/agent-ui-codex
  -> @nyosegawa/agent-ui-core
  -> @nyosegawa/agent-ui-react
  -> host web app
```

## Principles

- UI components must not depend directly on Codex generated protocol types.
- Codex protocol messages are normalized in the adapter layer.
- UI state is owned by `@nyosegawa/agent-ui-core`.
- Transport and rendering are separate.
- Experimental protocol support is isolated behind explicit opt-in.
- The local bridge is Node-side only.
- Optional SDK adapters adapt host-owned clients/runners into `AgentTransport`; they do not replace the App Server protocol as the primary path.

## Host Bridges

The chat-capable local bridge is `attachAgentUiWebSocketBridge()`. It keeps one App Server process alive for the browser session, streams App Server notifications, forwards server approval requests, and carries browser approval responses back to stdio.

`createAgentUiNextRpcRoute()` is intentionally narrower: it starts an App Server process for one HTTP `POST`, sends one JSON-RPC-lite request, returns one response, and closes the process. It is useful for host-owned one-shot calls, but it cannot represent streaming turns, server approval requests, or browser approval responses. Next.js apps that need the full chat experience should host a WebSocket bridge in a Node server or use a separate same-origin bridge process.

## Core State

```ts
type AgentSessionState = {
  connection: ConnectionState;
  account: AccountState;
  threads: Record<ThreadId, ThreadState>;
  activeThreadId?: ThreadId;
  pendingServerRequests: Record<RequestId, PendingServerRequest>;
  models: ModelState;
  configWarnings: WarningState[];
};

type ThreadState = {
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
};

type TurnState = {
  turn: AgentTurn;
  itemOrder: string[];
  items: Record<string, AgentItemState>;
  streamingTextByItemId: Record<string, string>;
  commandOutputByItemId: Record<string, string>;
  filePatchByItemId: Record<string, unknown>;
  plan?: TurnPlanState;
};
```

## Reducer Rules

- `thread/started`: upsert thread
- `thread/status/changed`: update thread status
- `thread/name/updated`: update thread name
- `thread/tokenUsage/updated`: update token usage
- `turn/started`: create or update in-progress turn
- `turn/plan/updated`: attach latest plan to the turn
- `account/rateLimits/updated`: attach latest account rate-limit snapshot
- `item/started`: create in-progress item
- delta notifications: append or update transient state
- `item/completed`: replace item with authoritative item
- `turn/completed`: replace terminal turn state
- server request: create pending interaction
- server request resolved/rejected: clear pending interaction
- JSON-RPC error: attach request/global error state

`item/completed` and `turn/completed` are authoritative.

## UI Model

The drop-in UI is a convenience layer over the headless API.

Default components:

- `AgentProvider`
- `AgentChat`
- `AgentComposer`
- `AgentMessageList`
- `AgentApprovalPrompt`
- `AgentDiffViewer`
- `AgentStatusBar`
- `ThreadList`
- `ThreadSidebar`

Customization:

- CSS variables
- `className`
- slots
- render props
- headless hooks

`AgentMessageList` owns the real Codex session timeline. User messages,
assistant messages, reasoning, command execution summaries, and file-change
diff summaries render in turn order. Command output and diffs are not rendered
as detached bottom panels because that separates the work from the assistant
context and makes stored Codex sessions unreadable.

## Fixed UI Decisions

- Approval UX defaults to inline cards in the chat stream.
- Modal and side-panel approvals are supported through slots.
- Diff viewer uses a read-only CodeMirror surface with a textual fallback.
- Monaco is deferred because it requires heavier worker and asset configuration from hosts.
- `ThreadList` / `ThreadSidebar` ship as minimal components.
- Full navigation layouts live in examples.
- `thread/shellCommand` is host-only in the local release.
