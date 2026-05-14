# Component API

The React package exposes composable Agent UI vNext primitives backed by
headless hooks and normalized core state. Generated Codex App Server protocol
types stay behind adapters, request builders, and normalizers; visual
components consume stable Agent UI state.

## Provider

```tsx
<AgentProvider transport={transport} initialState={optionalState}>
  <AgentChat />
</AgentProvider>
```

`AgentProvider` accepts an `AgentTransport` plus optional `initialState` for
fixtures, tests, or restored local state.

## Preset Chat

`AgentChat` is a preset composition, not the only supported layout.

```tsx
<AgentChat
  sidebar={false}
  usage={false}
  diagnostics={false}
  slots={{
    renderApproval: (approval) => <CustomApproval approval={approval} />,
    renderItem: (item, turn) => <CustomItem item={item} turn={turn} />,
  }}
/>
```

The preset composes `AgentShell`, optional `AgentThreadSidebar`,
`AgentStatusBar`, optional `AgentDiagnosticsPanel`, optional `AgentUsagePanel`,
and `AgentThreadView`. Hosts can suppress the sidebar, usage, and diagnostics
when those surfaces live elsewhere in the application.

## Layout Primitives

Use these primitives when embedding Agent UI into existing product chrome:

- `AgentShell`: app viewport layout with an optional sidebar slot.
- `AgentThreadSidebar`: persisted Codex thread history browser.
- `AgentThreadView`: one thread with header, timeline, approvals, and composer.
- `AgentThreadHeader`: title, cwd/session context, resume, stop, and new-thread actions.
- `AgentThreadTimeline`: normalized turn and item renderer.
- `AgentContentBlockView`: standalone renderer for normalized thinking, plan,
  command, file-change, tool, web search, image, and system-info blocks.
- `AgentApprovalQueue`: pending server-request approval cards.
- `AgentComposerPanel`: run settings and turn composer.
- `AgentStatusBanners`: model reroute, deprecation, config, account, MCP OAuth,
  and rate-limit banners.
- `AgentUsagePanel`: account rate-limit windows, renderable inside or outside a shell.
- `AgentRateLimitBar`: one normalized rate-limit window.
- `AgentTokenUsageBar`: per-thread input/output token usage.
- `AgentDiagnosticsPanel`: bridge/account/model startup diagnostics.
- `AgentSkillsPanel`: skill list and enable/disable controls.
- `AgentAppsPanel`: connected app list.
- `AgentWorkerPane`: focused single-thread worker surface for embedded panes.
- `AgentWorkspace`: chat plus optional skill/app side panel.
- `SkillAppPanel`: local controller for skills/apps panel placement.

`ThreadSidebar`, `AgentUsage`, `AgentDiagnostics`, and `AgentApprovalPrompt`
remain as compatible aliases where the names still map cleanly to the vNext
primitives.

## Composition Examples

Render a fixed thread without following the globally active thread:

```tsx
<AgentThreadView threadId="thread_123" />
```

Render usage in host chrome while the chat stays sidebar-free:

```tsx
<AgentShell>
  <AgentUsagePanel />
  <AgentChat sidebar={false} usage={false} />
</AgentShell>
```

Render a worker pane:

```tsx
<AgentWorkerPane
  threadId="thread_123"
  renderApproval={(approval) => <HostApproval approval={approval} />}
/>
```

Render a full workspace with a right-side skill/app panel:

```tsx
<AgentWorkspace
  panel={{ kind: "skills", open: true }}
  sidePanel={<AgentSkillsPanel cwd={cwd} />}
/>
```

## Timeline And Approvals

`AgentThreadTimeline` renders user messages, assistant messages, reasoning,
commands, file changes, diffs, and structured App Server items from normalized
state. Host renderers receive normalized `AgentItemState` and `TurnState`
values through `renderItem`; they do not need generated protocol payloads.

The default timeline uses `AgentContentBlockView` for the vNext block taxonomy:
thinking summaries, plans, command execution with cwd/output/exit status,
file-change summaries, MCP/dynamic/collab tool calls, web search queries,
images, and system info. This renderer consumes `AgentItemBlock` values from
core state, so hosts can keep visual components free of generated App Server
types while still preserving protocol-derived detail in adapters and reducers.

`AgentApprovalQueue` reads pending server requests through
`useAgentServerRequests()` / `useAgentApprovals()`. Default approval cards show
structured command, cwd, policy, file-change, patch, user-input, MCP
elicitation, dynamic-tool, permissions, auth-refresh, and attestation context
before sending stable approval or rejection responses.

Thread actions are exposed through the default header and
`useAgentThreadActions()`: rename, fork, archive, unarchive, compact, and
rollback call generated-method request builders. Resume remains part of
`AgentThreadHeader` because it depends on thread registry state and the loaded
session lifecycle.

Composer attachments are represented as visible chips for local image/file
mentions, paste/drop files, and `app://` / `plugin://` mentions. The Milestone 4
UI is intentionally state-local; Milestone 5 wires these chips into structured
turn-start input items.

## Usage

`AgentUsagePanel` renders normalized account rate-limit windows from
`account/rateLimits/updated` notifications or explicit reads. It is safe to use
standalone in product chrome; pass `autoRefresh={false}` when another bootstrap
surface already owns startup reads.

`AgentTokenUsageBar` renders per-thread token usage as an embeddable primitive
for full-shell, worker-pane, or usage-only host chrome.

`normalizeUsageWindows()` is exported for hosts that need the same window model
inside custom UI.

## Web Components

`@nyosegawa/agent-ui-web-components` exports `defineAgentChatElement()`. The
custom element accepts `transport`, `initialState`, and `slots` as JavaScript
properties and renders the standard preset chat.

```ts
import "@nyosegawa/agent-ui-react/style.css";
import { defineAgentChatElement } from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();
document.querySelector("agent-chat")!.transport = transport;
```
