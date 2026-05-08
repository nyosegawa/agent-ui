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
- `AgentMessageList`
- `AgentWorkLog`
- `AgentDiffPanel`
- `AgentApprovalPrompt`
- `AgentComposer`

## Approval Components

`AgentApprovalPrompt` reads pending server requests through `useAgentApprovals()`.

Default behavior:

- command approval responds with `{ decision: "approved" }`
- file-change approval responds with `{ decision: "approved" }`
- rejection sends a JSON-RPC error and clears local pending state

The default card shows request id, command or file path context, and the raw normalized payload.

## Diff And Work Log

`AgentDiffViewer` renders a lightweight textual diff preview.

`AgentWorkLog` renders command output grouped by thread turn. For richer terminal behavior, build a host component with `useAgentThread()` rather than exposing `thread/shellCommand` as a generic browser component.

