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

`AgentChat` is a transcript-first convenience preset, not the primary
abstraction. By default it renders the thread transcript, approvals, composer,
and optional sidebar. Usage and diagnostics are off by default because they are
host-composition primitives; opt into them only when the preset should own that
secondary chrome.

```tsx
<AgentChat
  sidebar={false}
  usage={false}
  diagnostics={false}
  onRequestAppMention={openAppPicker}
  onRequestPluginMention={openPluginPicker}
  resolveLocalAttachment={(file) => localImageInput(`/uploads/${file.name}`)}
  slots={{
    renderApproval: (approval) => <CustomApproval approval={approval} />,
    renderItem: (item, turn) => <CustomItem item={item} turn={turn} />,
  }}
/>
```

The preset composes `AgentShell`, optional `AgentThreadSidebar`,
`AgentStatusBar`, `AgentThreadSurface`, and `AgentThreadView`. When hosts pass
`usage` or `diagnostics`, the preset adds a secondary context rail; otherwise
the primary transcript column is the whole experience. Low-priority
account/model/MCP/rate-limit notices do not stack above the timeline.

## Transcript Primitives

`AgentTranscript` / `AgentMessageList` render App Server turn items in order.
The default path does not regroup command execution, tool calls, or file-change
diffs into UI-owned buckets.

Large stored threads are rendered incrementally. The initial hydrated history
mounts only the latest transcript items, keeps order intact, and exposes
`Show earlier items` to reveal older items in batches. Heavy bodies such as
command output, JSON/tool results, long markdown, and CodeMirror-backed diffs
stay unmounted until their details disclosure is opened.

Transcript item primitives are exported for host composition and close-up QA:

- `AgentTurn`
- `AgentMessageItem`
- `AgentReasoningItem`
- `AgentToolCallItem`
- `AgentCommandItem`
- `AgentCommandOutputItem`
- `AgentFileChangeItem`
- `AgentDiffItem`

### Visual design system

The default style sheet is warm and typography-led, not card-heavy. The
2026-05-15 craftsmanship pass rebuilt every interactive primitive (button,
input, composer, approval) so the visual quality no longer depends on the
overall layout — it lives in the parts themselves:

- **Composer**: the primary input surface — a single bordered rounded card
  containing attachment chips, an auto-resizing textarea, and an inline
  toolbar. The toolbar carries attach/image icon buttons, optional App/Plugin
  mention buttons, the **mode** and **model · effort** menus, and a circular
  primary Send icon button with an `Enter to send` hint. Attach file and
  Attach image use a paperclip and a dedicated image icon and appear only
  when the host wires `resolveLocalAttachment`. App and Plugin appear only
  when the host supplies `onRequestAppMention` / `onRequestPluginMention` —
  the library never opens a browser `prompt()` dialog. There is no separate
  "Run settings" disclosure: mode, model, and effort are compact toolbar
  menus (see below). Pending-approval and preview-only states show a warm
  notice strip without hiding the field.
- **Mode / model / effort menus**: `AgentComposer` renders execution mode and
  a combined model · effort selector as compact anchored menus in the toolbar.
  Each trigger shows the current short value; clicking opens a menu of
  `icon + label + selected check` items. The menu opens anchored above the
  trigger on desktop and as a bottom sheet on mobile, and supports
  `Esc`, outside-click, and arrow-key navigation. Working directory is **not**
  in this menu — cwd is a thread-start setting (see below).
- **Button system**: `aui-btn` plus `aui-btn-primary | -secondary | -ghost |
  -danger | -subtle` and `aui-btn-sm | -lg | -icon-only`. `Approve` is the
  highest-contrast affordance in the surface, `Decline` is a danger button,
  `Approve for session` is a scoped secondary outline, `New thread` and the
  thread-action menu are icon-led ghosts, and link-style work (`Refresh`,
  `Load`, `Hide`) uses the subtle variant.
- **Inputs / selects / segmented**: a shared `aui-input-shell` with an
  optional leading icon, a unified `aui-select` with a custom chevron, and a
  refined segmented control with elevated pressed state. None of these read
  as browser defaults.
- **Approvals**: `AgentApprovalQueue` is a compact pending-decision surface
  directly above the composer, not a large independent scroll pane. The first
  request is an expanded card (shield icon, humanized title and one-line
  reason, `LOW / MED / HIGH` risk pill, command on a dark code surface,
  compact inline metadata, and three explicit decisions on a divider footer —
  green primary `Approve`, secondary `Approve for session`, danger
  `Decline`). Any remaining requests collapse into compact picker rows; click
  a row to expand it. The card colour rail switches with risk.
- **Timeline**: user messages are right-aligned bubbles tinted with the
  primary accent and a tail; assistant text flows as full-width markdown
  without a bubble; reasoning is a muted italic blockquote; plan blocks use
  a primary-tinted callout; command and diff blocks share a single dark
  code surface. `COMPLETED` status labels are suppressed on user/assistant
  bubbles so they stop competing with the content.
- **Sidebar**: a leading-icon search input that auto-loads the first history
  page and debounce-filters as you type — there is no standalone Load button;
  pagination is an IntersectionObserver sentinel with a single subtle
  `Load more` fallback. Refined thread list items with a coloured status dot.
  On mobile the sidebar is an off-canvas drawer opened from the `Threads`
  trigger in the status bar.
- **Status / usage / status pills**: pill-shape summary chips in the rail
  with a pulsing dot for `running`; the details disclosure is a separately
  styled card so the two never read as a duplicate.
- **Component close-ups**: `/fixture-gallery` now ends with a
  `Component close-ups` section that renders the composer, approval cards,
  command/diff surfaces, sidebar, chips, buttons, and inputs as live
  primitives (no iframes) so reviewers can inspect part quality, not just
  layout.

Saved screenshot evidence lives under `docs/screenshots/`. The host workflow
recipe (`examples/local-react-vite` `/host-workflow-recipe`) is the canonical
proof that the same primitives compose into a real product surface without the
preset, and the fixture gallery (`/fixture-gallery`) is the visual QA index for
every state plus the component-level close-ups.

## Layout Primitives

Use these primitives when embedding Agent UI into existing product chrome:

- `AgentShell`: app viewport layout with an optional sidebar slot.
- `AgentThreadSidebar`: persisted Codex thread history browser. It follows
  `thread/list` cursors with an IntersectionObserver sentinel and keeps the
  visible fallback to a single Load more action.
- `AgentThreadSurface`: unopinionated thread column surface for host-arranged
  header, notices, timeline, approvals, and composer primitives.
- `AgentThreadView`: one thread with header, timeline, approvals, and composer.
- `AgentThreadHeader`: title, cwd/session context, resume, stop, and new-thread actions.
- `AgentThreadTimeline`: normalized turn and item renderer.
- `AgentContentBlockView`: standalone renderer for normalized thinking, plan,
  command, file-change, tool, web search, image, and system-info blocks.
- `AgentApprovalQueue`: compact pending-decision surface — one expanded
  approval card plus compact picker rows for any other pending requests.
- `AgentComposerPanel`: turn composer with inline mode / model / effort menus.
- `AgentRunSettingsPanel`: thread-start settings panel with model, effort,
  cwd, and execution-mode
  settings primitive for popovers, sheets, or host-owned settings panels.
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
`useAgentServerRequests()` / `useAgentApprovals()` and renders them as a
compact pending-decision surface directly above the composer — one expanded
card plus compact picker rows for any other pending requests, never a large
independent scroll pane. The expanded card shows structured command, cwd,
policy, file-change, patch, user-input, MCP elicitation, dynamic-tool,
permissions, auth-refresh, and attestation context before sending stable
approval or rejection responses, and its decision footer stays reachable on
desktop and mobile.

Thread actions are exposed through the default header and
`useAgentThreadActions()`: rename, fork, archive, unarchive, compact, and
rollback call generated-method request builders. Resume remains part of
`AgentThreadHeader` because it depends on thread registry state and the loaded
session lifecycle.

Composer attachments are represented as visible chips for `app://` and
`plugin://` mentions. The library does not invoke `globalThis.prompt` for any
mention flow — instead, hosts supply `onRequestAppMention` and
`onRequestPluginMention` resolvers (`AgentComposerProps`,
`AgentChatProps`, `AgentThreadViewProps`). Each resolver is called when the
user clicks the matching toolbar button and may return (or asynchronously
resolve to) `{ label, value, input?, id? }`. When no resolver is provided, the
matching toolbar button is hidden so an embedder cannot end up with a button
that does nothing. This lets a host wire the flow into a command palette,
picker dialog, MCP tool, or workspace registry without the library shipping
an opinion about that picker's UI.

```tsx
<AgentChat
  onRequestAppMention={async () => {
    const app = await openAppPicker();
    return app && { label: app.name, value: app.uri };
  }}
  onRequestPluginMention={async () => openPluginPalette()}
/>
```

Local image and file attachments are only enabled when the host supplies
`resolveLocalAttachment`. The composer then accepts attachments through three
paths — clipboard paste, drag and drop, and the toolbar attach/image file
pickers — and shows each as a removable chip above the textarea. On send, each
chip's resolved `CodexUserInput` is appended to the `turn/start` input items
after the text. The resolver must turn a `File` into a real Codex input such
as a `localImage` path or uploaded image URL; the library does not treat
browser-only `File.name` values as App Server-readable paths, and a resolver
returning `null` (or throwing) surfaces an inline "could not be attached"
notice. `examples/codex-local-web` shows the full host responsibility: a
`POST /agent-ui/upload` endpoint persists the browser `File` next to the App
Server and returns an absolute path, which the resolver wraps with
`localImageInput`. The attach-image button and image attachment chip use a
dedicated image icon, not the `@`-mention icon.

### Working directory is a thread-start setting

cwd is chosen when a thread starts — the empty-state / first-run
`AgentRunControls` panel exposes a working-directory field. An existing thread
shows its cwd read-only in `AgentThreadHeader`; the composer toolbar never
offers a cwd editor, because changing the working directory mid-thread is not
a meaningful Codex operation.

### Mobile shell policy

`AgentChat` keeps chat and composer as the mobile primary surface. Thread
history is an off-canvas drawer opened from the `Threads` trigger in the
status bar, not a permanently stacked panel. Mode / model / effort menus open
as bottom sheets that stay inside the viewport, the approval surface stays
directly above the composer, and the secondary rail (status, usage,
diagnostics) is a compact horizontally-scrolling strip rather than hidden.

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
