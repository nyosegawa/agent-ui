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

`@nyosegawa/agent-ui-react/styles.css` is the only public stylesheet import for
React hosts. It includes the default component CSS and the `--aui-*`
design-system tokens from `packages/react/src/styles/tokens.css`. Override
tokens on a host wrapper for theming; avoid depending on `dist/styles/*` files
or internal `.aui-*` selectors.

`AgentChat` is a convenience preset. It renders the transcript, composer,
approvals, and optional thread sidebar. Usage and diagnostics are opt-in
secondary chrome because many host apps already have their own shell.
Customize the preset with `components`, not source imports or private slots.
`Shell`, `Sidebar`, `EmptyState`, `ComposerPanel`, `Approval`, and `blocks` are
the replacement points. Use `renderItem` or `blocks` for transcript
customization; raw item/turn replacement components are not part of the public
API.

## Compose From Primitives

Use primitives when the host owns layout:

```tsx
import {
  AgentComposer,
  AgentCriticalNoticeList,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadTimeline,
} from "@nyosegawa/agent-ui-react/primitives";

<AgentThreadSurface>
  <AgentThreadHeader thread={threadView} threadId={threadId} transcript={transcriptView} />
  <AgentCriticalNoticeList />
  <AgentThreadTimeline threadId={threadId} />
  <AgentComposer threadId={threadId} />
</AgentThreadSurface>
```

`AgentThreadTimeline` receives `threadId` so pending approvals render inside
the transcript, anchored after source metadata when available and at the
transcript tail otherwise, not as a separate pane.

`AgentComposer` owns the default running-turn follow-up UX. App Server has
no `queue/message` method, so queued follow-ups are UI-local until `Send now`.
`Send now` and Cmd/Ctrl+Enter use `turn/steer`; Stop uses only
`turn/interrupt`.

## Fixed Thread

Render a specific thread without following global active selection:

```tsx
<AgentThreadView threadId="thread_123" />
```

## Host Chrome

Usage, status, apps, skills, and diagnostics can sit outside the chat column:

```tsx
import { AgentChat, AgentProvider } from "@nyosegawa/agent-ui-react";
import {
  AgentShell,
  AgentThreadSidebar,
  AgentUsagePanel,
} from "@nyosegawa/agent-ui-react/primitives";
import { useAgentThreads } from "@nyosegawa/agent-ui-react/headless";

function HostChrome() {
  const { activeThreadId, setActiveThread } = useAgentThreads();

  return (
    <AgentShell
      sidebar={
        <AgentThreadSidebar
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThread}
        />
      }
    >
      <AgentUsagePanel />
      <AgentChat sidebar={false} usage={false} diagnostics={false} />
    </AgentShell>
  );
}
```

There is no generic workspace preset. Compose `AgentShell`, `AgentChat`, and
the primitives directly so host panels, routing, persistence, and product
workflow state stay in the host application.

Host chrome stays host-owned. Agent UI does not persist panel state, create app
registries, choose navigation or routing policy, authenticate users, map
tenants/workspaces, or deploy a hosted chat service. Pass transports,
resolvers, theme state, locale overrides, and host panels in through the public
React props and hooks.

`AgentChat threadUrlRouting` keeps direct thread URLs in sync. The root route
stays on the start screen; selecting a stored thread pushes
`/threads/<threadId>`, and the `Agent UI` brand or sidebar `+` returns to the
configured home path (`/` by default) without eagerly creating a thread.

For exact component props and visual contracts, see
[reference/react-components.md](../reference/react-components.md).
