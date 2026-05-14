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

`AgentChat` is a preset composition, not the primary abstraction. The React
package is primitive-first: host apps can place thread, status, usage,
approvals, composer, diagnostics, skills, and Apps/connectors surfaces in their
own shell without adopting the default chat layout.

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
`AgentStatusBar`, `AgentThreadSurface`, `AgentThreadView`, and a secondary
context rail for compact status, usage, and diagnostics. The conversation, work
trace, approvals, and composer stay in the primary column; low-priority
account/model/MCP/rate-limit notices do not stack above the timeline. Hosts can
suppress the sidebar, usage, and diagnostics when those surfaces live elsewhere
in the application. On mobile the secondary chrome is not hidden; it remains
reachable through compact details/summary affordances.

### Visual design system

The default style sheet is warm and typography-led, not card-heavy:

- User messages are right-aligned chat bubbles tinted blue; assistant text
  flows as full-width markdown without a bubble.
- Reasoning is a muted italic block with a left rule; plan blocks use a
  green-tinted callout; command and diff blocks share a single dark code
  surface.
- The approval card is the highest-contrast affordance in the surface, with a
  strong primary `Approve` button and outline secondaries for session-approve
  and decline.
- Status, usage, and diagnostics live in a compact secondary rail with
  cohesive cards on a warm `bg-soft` strip — never a stack of disconnected
  bordered boxes.
- The mobile rail collapses into a horizontally scrollable strip below the
  thread so status, usage, and diagnostics stay reachable.
- Item-kind labels are humanized (`MCP tool`, `Web search`, `Compaction`,
  `Command`, `File change`) so the timeline never exposes camelCase protocol
  identifiers.

Saved screenshot evidence lives under `docs/screenshots/`. The host workflow
recipe (`examples/local-react-vite` `/host-workflow-recipe`) is the canonical
proof that the same primitives compose into a real product surface without the
preset, and the fixture gallery (`/fixture-gallery`) is the visual QA index for
every state.

## Layout Primitives

Use these primitives when embedding Agent UI into existing product chrome:

- `AgentShell`: app viewport layout with an optional sidebar slot.
- `AgentThreadSidebar`: persisted Codex thread history browser.
- `AgentThreadSurface`: unopinionated thread column surface for host-arranged
  header, notices, timeline, approvals, and composer primitives.
- `AgentThreadView`: one thread with header, timeline, approvals, and composer.
- `AgentThreadHeader`: title, cwd/session context, resume, stop, and new-thread actions.
- `AgentThreadTimeline`: normalized turn and item renderer.
- `AgentContentBlockView`: standalone renderer for normalized thinking, plan,
  command, file-change, tool, web search, image, and system-info blocks.
- `AgentApprovalQueue`: pending server-request approval cards.
- `AgentComposerPanel`: run settings and turn composer.
- `AgentStatusSummary`, `AgentStatusDetails`, and `AgentCriticalNoticeList`:
  severity-normalized model reroute, deprecation, config, account, MCP OAuth,
  and rate-limit notices. Info/background notices stay in secondary chrome,
  warnings stay visible without interrupting the timeline, and only genuinely
  blocking or dangerous critical notices render near the thread.
- `AgentUsagePanel`: account rate-limit windows, renderable inside or outside a shell.
- `AgentUsageSummary`: compact usage primitive for host chrome.
- `AgentRateLimitBar`: one normalized rate-limit window.
- `AgentTokenUsageBar`: per-thread input/output token usage.
- `AgentDiagnosticsPanel`: bridge/account/model startup diagnostics.
- `AgentSkillsPanel`: skill list and enable/disable controls.
- `AgentAppsPanel`: Codex Apps/connectors list from `app/list`.
- `AgentWorkspace`: chat plus optional host-owned side panel slot.

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

Render a full workspace with a host-owned side panel:

```tsx
<AgentWorkspace
  panel={<HostPanel threadId="thread_123" />}
/>
```

The side panel is a generic render slot. Host applications own any app runtime,
panel state, storage, registry, or custom tool workflow they place inside it.

Render a host-owned thread layout without the preset:

```tsx
<AgentThreadSurface>
  <AgentThreadHeader thread={thread} threadId={threadId} />
  <AgentCriticalNoticeList />
  <AgentThreadTimeline thread={thread} />
  <AgentApprovalQueue threadId={threadId} />
  <AgentComposerPanel thread={thread} threadId={threadId} />
</AgentThreadSurface>
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

Composer attachments are represented as visible chips for `app://` and
`plugin://` mentions by default. Local browser files are only enabled when the
host supplies `resolveLocalAttachment`; that resolver must turn a `File` into a
real Codex input such as a `localImage` path or uploaded image URL. The library
does not treat browser-only `File.name` values as App Server-readable paths.

## Usage

`AgentUsagePanel` renders normalized account rate-limit windows from
`account/rateLimits/updated` notifications or explicit reads. It is safe to use
standalone in product chrome; pass `autoRefresh={false}` when another bootstrap
surface already owns startup reads.

`AgentStatusSummary` and `AgentStatusDetails` use the same normalized severity
model as `AgentCriticalNoticeList`. A rate-limit notice is not critical merely
because its protocol kind is `rateLimit`; normal and below-threshold messages
remain background status, near-threshold messages are warnings, and only
reached/exceeded/blocked limit messages become critical.

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
