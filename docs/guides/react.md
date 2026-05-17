# React Guide

The smallest React app provides a transport, wraps the tree in
`AgentProvider`, and renders `AgentChat`.

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

`AgentChat` is a convenience preset. It renders the transcript, composer,
approvals, and optional thread sidebar. Usage and diagnostics are opt-in
secondary chrome because many host apps already have their own shell.

## Compose From Primitives

Use primitives when the host owns layout:

```tsx
<AgentThreadSurface>
  <AgentThreadHeader thread={thread} threadId={threadId} />
  <AgentCriticalNoticeList />
  <AgentThreadTimeline thread={thread} threadId={threadId} />
  <AgentComposerPanel thread={thread} threadId={threadId} />
</AgentThreadSurface>
```

`AgentThreadTimeline` receives `threadId` so pending approvals render as the
final item in the transcript, not as a separate pane.

## Fixed Thread

Render a specific thread without following global active selection:

```tsx
<AgentThreadView threadId="thread_123" />
```

## Host Chrome

Usage, status, apps, skills, and diagnostics can sit outside the chat column:

```tsx
<AgentShell sidebar={<AgentThreadSidebar />}>
  <AgentWorkspace panel={<AgentUsagePanel />}>
    <AgentChat sidebar={false} usage={false} diagnostics={false} />
  </AgentWorkspace>
</AgentShell>
```

For exact component props and visual contracts, see
[reference/react-components.md](../reference/react-components.md).
