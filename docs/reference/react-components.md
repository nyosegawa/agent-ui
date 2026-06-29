# React Components

The React package exposes composable Agent UI primitives backed by
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
fixtures, tests, or restored local state. Transport ownership is scoped to the
provider lifetime, with close deferred across same-tick remounts so React
StrictMode probing does not prematurely close non-reconnectable local bridges.
It also owns the effective run policy list for child controls. By default the
provider offers safe local policies only: `review`, `auto`, and `read-only`.
Dangerous full local access is opt-in by adding `AGENT_FULL_ACCESS_RUN_POLICY`
to `runPolicies`.

```tsx
import {
  AgentChat,
  AgentProvider,
} from "@nyosegawa/agent-ui-react";
import {
  AGENT_FULL_ACCESS_RUN_POLICY,
  DEFAULT_AGENT_RUN_POLICIES,
  type AgentRunPolicy,
} from "@nyosegawa/agent-ui-react/headless";

const runPolicies: AgentRunPolicy[] = [
  ...DEFAULT_AGENT_RUN_POLICIES,
  AGENT_FULL_ACCESS_RUN_POLICY,
];

<AgentProvider
  defaultRunPolicyId="review"
  runPolicies={runPolicies}
  transport={transport}
>
  <AgentChat />
</AgentProvider>;
```

`defaultRunPolicyId` selects the initial policy when no restored state is
present. If restored state contains a stale or unavailable policy id, the
provider normalizes it to the first effective policy instead of rendering or
applying an unavailable policy.

## Preset Chat

`AgentChat` is a transcript-first convenience preset, not the primary
abstraction. By default it renders the thread transcript, approvals, composer,
and optional sidebar. Usage and diagnostics are off by default because they are
host-composition primitives; opt into them only when the preset should own that
secondary chrome.

The public preset customization API is `AgentChatProps.components:
AgentComponents`, plus the exported default map `defaultAgentComponents`. The
old slot-oriented shape is not part of the public contract. Replacement
components should import preset APIs from `@nyosegawa/agent-ui-react` and
visual building blocks from `@nyosegawa/agent-ui-react/primitives`, not from
source modules. They receive a `Default` renderer for the surface they replace.
`Shell`, `Sidebar`, `EmptyState`, `StatusBar`, `ThreadHeader`,
`ComposerPanel`, `Approval`, and `blocks` are the raw-free preset replacement
targets. Transcript item customization uses `renderItem(entry, Default)` or
block replacements; there is no raw `components.Item` boundary.
Internal component state, CSS implementation selectors, attachment mutation
objects, transcript window bookkeeping, and generated protocol payloads stay
inside Agent UI.

```tsx
import { localImageInput, textInput } from "@nyosegawa/agent-ui-codex/request-builders";

const localMediaUrlsByPath = new Map<string, string>();

<AgentChat
  locale="ja"
  sidebar={false}
  theme="system"
  usage={false}
  diagnostics={false}
  startOptions={{
    threadOptions: {
      cwd: "/workspace/fixed-project",
      sandbox: "workspace-write",
      threadSource: "user",
    },
    turnOptions: {
      model: "gpt-5-codex",
      effort: "high",
    },
  }}
  composerIntegrations={[
    {
      id: "workspace-context",
      label: "Workspace context",
      resolve: async () => {
        const context = await openWorkspaceContextPicker();
        return context
          ? { label: context.label, input: textInput(context.prompt) }
          : null;
      },
    },
  ]}
  onRequestWorkingDirectory={openDirectoryPicker}
  resolveLocalAttachment={async (file, kind) => {
    const asset = await uploadAttachmentToLocalMedia(file);
    const previewUrl = asset.previewUrl ?? asset.url;
    if (typeof asset.path === "string" && typeof previewUrl === "string") {
      localMediaUrlsByPath.set(asset.path, previewUrl);
    }
    return {
      ...asset,
      input:
        kind === "image"
          ? localImageInput(asset.path)
          : textInput(`Attached file: ${asset.path}`),
    };
  }}
  resolveLocalMediaUrl={(path) => {
    const previewUrl = localMediaUrlsByPath.get(path);
    return previewUrl ? { kind: "url", previewUrl } : null;
  }}
  messages={{
    "composer.placeholder": "フォローアップの変更を求める",
  }}
  components={{
    StatusBar: ({ Default, end, ...props }) => (
      <Default {...props} end={<><WorkspaceSwitcher />{end}</>} />
    ),
    ThreadHeader: ({ Default, ...props }) => <Default {...props} />,
    Approval: ({ approval }) => <CustomApproval approval={approval} />,
    blocks: {
      text: ({ block, Default }) => (
        <CustomTextBlock block={block} Default={Default} />
      ),
    },
  }}
  threadHeaderEnd={({ thread }) => <ThreadActions threadId={thread.id} />}
/>;
```

The preset composes `AgentShell`, optional `AgentThreadSidebar`,
`AgentStatusBar`, `AgentThreadSurface`, and `AgentThreadView`. When hosts pass
`usage` or `diagnostics`, the preset adds a secondary context rail; otherwise
the primary transcript column is the whole experience. Low-priority
account/model/MCP/rate-limit notices do not stack above the timeline.
The optional `theme` prop accepts `light`, `dark`, or `system` and only applies
`data-aui-theme` to the preset shell. Leave it unset when the preset should
inherit a theme from host chrome. Agent UI does not render an internal theme
switcher; hosts that want one can place the controlled `AgentThemeToggle`
primitive beside their own navigation or settings UI, or pass it through
`statusBarEnd` when using the `AgentChat` preset.

`startOptions` lets a preset host fix first-thread policy without bypassing the
chat lifecycle. `threadOptions` are passed to `thread/start`; `turnOptions` are
passed through the shared `useAgentChatController().sendMessage()` first-message
path, so optimistic state, active-thread reconciliation, and error handling stay
the same as the default composer. A string `threadOptions.cwd` also renders the
starter working-directory control as fixed read-only state instead of exposing
the directory picker.

`controls` exposes the preset-owned mobile drawer and context sheet as
controlled state. Use `sidebarCollapsed` /
`onSidebarCollapsedChange` and `contextSheetOpen` /
`onContextSheetOpenChange` when host chrome needs to coordinate its own drawer,
sheet, or overlay with Agent UI. Agent UI still owns focus return, Escape
handling, inert background state, and relative overlay order through the
documented layer tokens.

The optional `locale` prop accepts `en`, `ja`, `ko`, `zh-CN`, `es`, or `fr`.
When omitted, Agent UI normalizes `navigator.language` and falls back to
English. `messages` is a partial override map for host product copy and is
merged over the built-in dictionary. Transcript content, tool output, command
output, model messages, and server diagnostics are not machine-translated by
Agent UI.

`AgentStatusBar` keeps the persistent brand row to connection/auth status. When
used through `AgentChat`, the `Agent UI` brand returns to the start screen
without creating a thread; with `threadUrlRouting`, it also pushes the configured
home path (`/` by default). The bar does not render the authenticated email
inline. Authenticated account details, plan, usage windows, and logout are
available from the account dialog in the status actions so host applications can
keep personal identity in profile or settings chrome.

`components.Approval` replaces the default approval card and its default
actions for each rendered approval request. Custom approval components must
call `useAgentApprovals()` or a host-owned response path to send decisions.
`components.blocks` replaces individual transcript block renderers by block
kind. Block replacement components receive a narrow `Default` renderer so hosts
can wrap or annotate the default UI without depending on private reducer state.
The initial components map also supports `Shell`, `Sidebar`, `EmptyState`,
`StatusBar`, `ThreadHeader`, and `ComposerPanel`; each receives the documented
public props for that surface plus `Default`.

Replacement points are intentionally limited to surfaces whose accessibility,
scroll, and approval-anchor contracts can be preserved:

- `Shell` may wrap `AgentShell`, but the preset still owns the transcript column
  and sidebar drawer state.
- `Sidebar` receives the default sidebar props and `Default`; it should delegate
  to `Default` unless the host accepts responsibility for thread navigation and
  history search accessibility.
- `StatusBar` receives `end`, navigation callbacks, and `Default`. Prefer this
  replacement when the host needs to add product chrome beside the preset status
  row while preserving the default history, home, account, and connection
  behavior.
- `ThreadHeader` receives the active thread view, optional transcript view, an
  `end` render area, and `Default`. Use `threadHeaderEnd` for simple per-thread
  actions; replace `ThreadHeader` only when the whole header surface needs a
  host wrapper.
- `EmptyState` and `ComposerPanel` receive public starter/composer props and
  `Default`; low-level toolbar, submit, attachment, and textarea behavior stays
  inside the styled parts so Enter/Shift+Enter, stop, queue, and attachment
  restore semantics remain tested in one place.
- `Approval` replaces only the approval card body rendered at an existing
  transcript anchor. It does not move approvals out of the transcript scroll
  area or own approval placement.
- `blocks` and `renderItem` are wrapped by the default transcript
  list/turn/message containers. Replacing one block or item does not replace
  the list, turn ordering, approval anchor nodes, density attributes, or
  scroll-follow behavior.

Rejected replacement points for this gate include the transcript scroll
container, approval anchor placement, composer toolbar internals, individual
attachment mutation controls, sidebar pagination internals, and low-level
generated block normalization. Hosts that need those policies should compose
headless hooks and primitives directly instead of widening `AgentChat`.
Host applications also keep ownership of any product shell, navigation model,
auth gate, persistent panel state, tenant/workspace mapping, custom registry,
or deployment policy they compose around the preset.

## Transcript Primitives

`AgentTranscript` / `AgentMessageList` render App Server turn items in order.
The default path does not regroup command execution, tool calls, or file-change
diffs into UI-owned buckets.

`useAgentTranscriptController(threadId, options)` exposes the transcript view
model that backs the default list. It returns `AgentTranscriptEntry` objects
with a raw-free normalized item view, a raw-free synthesized block view, role,
status, display status, density, approval anchors, and public pending metadata.
The public controller does not return `ThreadState`, `TurnState`, internal
optimistic operation records, or raw generated protocol payload fields.

Transcript density is a render preference, not lifecycle state. Pass
`density="compact"` or `density="verbose"` to `AgentMessageList`, or pass
`density` to `useAgentTranscriptController()` as a mode or as `{ default,
byBlockKind }`. `critical-only` hides entries without a failed/in-progress
status or an anchored approval; per-block overrides can keep specific block
kinds expanded or dense while the rest of the transcript stays compact.

Large stored threads are rendered incrementally. The initial hydrated history
mounts only the latest transcript items, keeps order intact, and exposes
`Show earlier items` to reveal older items in batches. User and assistant
messages always render expanded. Heavy non-chat bodies such as command output,
JSON/tool results, and CodeMirror-backed diffs stay unmounted until their
details disclosure is opened.

`useAgentTranscriptScrollController()` is the public scroll controller for
custom transcript compositions. The default `AgentMessageList` uses it for
follow-scroll, Jump to latest, Jump to pending approval, host-owned scroll
container refs, and the show-earlier action that delegates to the transcript
controller. Replacing `AgentChat` components does not expose the default
transcript scroll container as a component replacement point; hosts that need
custom scroll layout should compose the transcript and scroll controllers
directly.

Live App Server streams and stored `thread/read` history are not identical
surfaces. A live browser connection can receive per-item notifications such as
command output deltas and approvals. A restored thread can only render the
`ThreadItem`s returned by `thread/read`; some command-like activity may be
absent or represented as `mcpToolCall` / dynamic tool items. When a hydrated
turn ends with file changes, the transcript window keeps command/tool context
from the same turn visible with the diff so restored sessions do not degrade
into a stack of file-change cards.

Local media transcript blocks require the host to pass
`resolveLocalMediaUrl(path, item)`. The `path` is the App Server local resource
reference and is never used directly as an image or video `src`. Return a
structured `AgentResolvedResource` with `previewUrl` or `url` from a same-origin
helper or static asset route. Returning `null`/`undefined`, omitting the
resolver, or a failed image/video load renders the default local-media fallback
card instead of a broken media element.

Internally, transcript block synthesis and closed-card preview text are pure
helpers under `packages/react/src/timeline/`, while windowing is owned by the
transcript controller. Public visual imports should continue to come from
`@nyosegawa/agent-ui-react/primitives`; the helper modules are implementation
details for tests and maintenance, not new public API.

Transcript item primitives are exported for host composition and close-up QA:

- `AgentTurn`
- `AgentMessageItem`
- `AgentReasoningItem`
- `AgentToolCallItem`
- `AgentCommandItem`
- `AgentCommandOutputItem`
- `AgentFileChangeItem`
- `AgentDiffItem`

### Visual Design System

The public React stylesheet is
`@nyosegawa/agent-ui-react/styles.css`. Its design-system API is the
`--aui-*` token set defined in `packages/react/src/styles/tokens.css`. Hosts
should theme Agent UI by overriding tokens on their wrapper or by using
documented props, the `components` map, render props, and `className`
attachment points.
Copied `dist/styles/*` files and internal `.aui-*` selectors are private
implementation details, not stable host imports or styling contracts.

Shared Agent UI overlay order is exposed as public layer tokens instead of raw
z-index numbers or private selectors:

- `--aui-z-backdrop`
- `--aui-z-drawer`
- `--aui-z-popover`
- `--aui-z-sheet`
- `--aui-z-dialog`
- `--aui-z-toast`

Agent UI owns the relative order of its own backdrops, drawers, popovers,
sheets, dialogs, and toasts through those tokens. Hosts own their own
modal/sheet managers and should place host surfaces above or below Agent UI by
choosing values relative to the tokens. Do not style host integration behavior
by targeting private `.aui-*` selectors.

The default stylesheet is warm and typography-led, not card-heavy. Every
interactive primitive (button, input, composer, approval) owns its visual
quality directly instead of depending on a page-level shell:

- **Composer**: the primary input surface, a single bordered rounded card
  containing attachment chips, an auto-resizing textarea, and an inline
  toolbar. The toolbar carries a single attach button, optional host-supplied
  composer integration buttons, the **run policy** and **model · effort** menus,
  and a circular primary Send icon button with an `Enter to send` hint. The standalone
  form is named "Message composer", the textarea references that visible
  shortcut hint as its accessible description, and pending attachment chips
  expose their filenames through list item labels. While a regular turn is
  running, the textarea remains editable and the primary button becomes Stop.
  Enter with non-empty input or attachments adds a UI-local follow-up card above the
  composer; empty Enter is a no-op. Cmd/Ctrl+Enter sends non-empty input as
  `turn/steer` immediately with the active `expectedTurnId`, and `Send now` on
  a queued card also sends `turn/steer`; outside a running turn,
  Cmd/Ctrl+Enter starts a normal new turn. Queued cards are scoped to the
  active thread, keep attachment chips restorable through Edit, and compact
  older queued items instead of creating a nested scroll pane. Stop calls only
  `turn/interrupt`; `turn/steer` is not an interrupt. The attach control
  appears only when the host wires `resolveLocalAttachment`; image and
  non-image files differ after selection through chip previews and the
  resolved Codex payload. Integration buttons appear only when the host supplies
  `composerIntegrations`; the composer never derives App Server input from a
  label, URI, App, or Plugin concept and never opens a browser `prompt()`
  dialog. There is no separate
  stacked settings disclosure: policy, model, and effort are compact toolbar
  menus (see below). Pending-approval and preview-only states show a warm
  notice strip without hiding the field.
- **Run policy / model / effort menus**: `AgentComposer` renders run policy and
  a combined model · effort selector as compact anchored menus in the toolbar.
  Each trigger shows the current short value; clicking opens a menu of
  `icon + label + selected check` items. The menu opens anchored above the
  trigger on desktop and as a bottom sheet on mobile, and supports
  `Esc`, outside-click, focus return, Arrow/Home/End navigation, and internal
  panel scroll without closing. Working directory is **not** in this menu;
  cwd is a thread-start setting (see below). Hosts that want a native folder
  picker can pass `AgentChat.onRequestWorkingDirectory`, which must return the
  absolute cwd path selected by the user. `AgentRunControls` uses
  radiogroup semantics for run policy selection rather than mixing pressed
  buttons and tablist roles.
- **Buttons**: the internal button primitives provide primary, secondary,
  ghost, danger, subtle, size, and icon-only variants. `Approve` is the
  highest-contrast affordance in the surface, `Decline` is a danger button,
  `Approve for session` is a scoped secondary outline, the history `New thread`
  action and the thread-action menu are icon-led ghosts, and link-style work
  (`Refresh`, `Load`, `Hide`) uses the subtle treatment.
- **Inputs / selects / segmented controls**: the internal form primitives share
  tokenized shells, leading-icon support, custom chevrons, and refined pressed
  states. None of these read as browser defaults.
- **Approvals**: `AgentApprovalQueue` is a compact pending-decision surface
  rendered in the transcript scroll area, not a separate pane stacked between
  the transcript and the composer, and never an independent scroll pane.
  Requests with upstream `itemId` or `turnId` metadata are anchored immediately
  after that item or turn, even when that source must be pinned back into a
  windowed transcript. If that anchored decision is outside the current scroll
  viewport, the thread exposes a distinct "Jump to pending approval" affordance
  instead of relying on "Jump to latest". Metadata-free requests, or requests whose source no
  longer exists, render at the transcript tail. The first request in each anchor is an expanded card (shield
  icon, humanized title and one-line reason, `LOW / MED / HIGH` risk pill,
  command on a dark code surface, compact inline metadata that wraps instead
  of overflowing, and three explicit decisions on a divider footer: green
  primary `Approve`, secondary `Approve for session`, danger `Decline`). Any
  remaining requests in that same anchor collapse into compact picker rows;
  click a row to expand it. The card colour rail switches with risk.
- **Timeline**: user messages are right-aligned bubbles tinted with the
  primary accent and a tail; assistant text flows as full-width markdown
  without a bubble; reasoning is a muted italic blockquote; plan blocks use
  a primary-tinted callout; command and diff blocks share a single dark
  code surface. `COMPLETED` status labels are suppressed on user/assistant
  bubbles so they stop competing with the content.
- **Sidebar**: a leading-icon search input that loads the first history page
  without selecting a thread and debounce-filters as you type. Rows follow the
  scoped `thread/list` collection order, defaulting to App Server
  `updated_at` descending, and selecting or preview-hydrating a stored thread
  does not promote it. There is no standalone Load button; pagination is an
  IntersectionObserver sentinel with a single subtle `Load more` fallback. The
  header includes a `+` new-thread action that returns to the start screen
  without creating a thread. Refined thread list items with a coloured status
  dot. On mobile the sidebar is an
  off-canvas drawer opened from the `Threads` trigger in the status bar. The
  drawer closes on backdrop click, Escape, and thread selection; focus returns
  to the trigger after close; the chat/composer surface behind the drawer is
  inert or equivalently non-interactive while the drawer is open; drawer search
  and selection remain reachable.
- **Context / status / usage / status pills**: per-thread context usage appears
  as a compact percent indicator beside the composer controls when
  `thread/tokenUsage/updated` has nonzero restored or live usage. Opening it
  shows used/context window, input/output/cached/reasoning breakdown, and a
  compaction note. Disclosure surfaces close on Escape and outside click,
  return focus to their trigger, support Arrow/Home/End navigation where they
  contain menu items, and stay open during internal scroll. Account rate-limit usage remains a separate host rail
  primitive. Pill-shape summary chips in the rail
  with a pulsing dot for `running`; the details disclosure is a separately
  styled card so the two never read as a duplicate.
- **Component close-ups**: `/maintainer-gallery` starts with a
  `Component close-ups` section that renders the composer, approval cards,
  command/diff surfaces, sidebar, chips, buttons, and inputs as live
  primitives (no iframes) so reviewers can inspect part quality, not just
  layout.

Visual QA route ownership lives in [Testing](../architecture/testing.md).
Screenshot policy lives in [Documentation Screenshots](../screenshots/README.md).
The token override contract lives in [Theming](../guides/theming.md).

## Layout Primitives

Use these primitives when embedding Agent UI into existing product chrome:

- `AgentShell`: app viewport layout with an optional sidebar slot.
- `AgentThreadSidebar`: persisted Codex thread history browser. It renders the
  scoped collection owned by `useAgentThreadListController()`, follows
  `thread/list` cursors with an IntersectionObserver sentinel, and keeps the
  visible fallback to a single Load more action. The row order is the
  `thread/list` response order; the default request asks for `updated_at`
  descending, and stored-thread selection does not reorder the collection. Its
  optional new-thread action is a host navigation callback; it should return the
  user to the thread-start screen rather than eagerly calling `thread/start`.
  Selecting stored history uses `thread/read` preview hydration, not
  `thread/resume`.
- `AgentThreadSurface`: unopinionated thread column surface for a host-arranged
  header, notices, timeline, and composer. Its grid rows are header, optional
  critical notices, the transcript scroll area, then the composer; pending
  approvals are not a row here. Full-height hosts should give the shell a real
  height so the provided transcript area owns reading scroll while the
  composer stays bottom anchored.
- `AgentThreadView`: one thread with header, transcript (with embedded
  approvals), and composer.
- `AgentThreadHeader`: title, preview/running status, and thread action menu
  from `AgentThreadSummaryView`.
- `AgentThreadTimeline`: normalized turn and item renderer. Pass `threadId` to
  anchor that thread's pending approvals by source metadata, with transcript
  tail fallback for metadata-free or missing-source requests.
- `AgentContentBlockView`: standalone renderer for normalized thinking, plan,
  command, file-change, tool, web search, image, and system-info blocks.
- `AgentApprovalQueue`: compact pending-decision surface with one expanded
  approval card plus compact picker rows for any other pending requests.
  `AgentThreadView` / `AgentChat` anchor it after source item or turn metadata
  when available, with a transcript-tail fallback for metadata-free or
  missing-source requests. Hosts can also place it standalone.
- `AgentComposerPanel`: turn composer with inline policy / model / effort menus,
  running-turn steering, composer-local Stop, and compact context usage.
- `AgentComposerInput`, `AgentComposerToolbar`, `AgentAttachmentChips`,
  `AgentComposerSubmitButton`, and `AgentStartComposer`: composer styled parts
  for host composition. These preserve the default composer class names and
  accessibility contract without exposing attachment mutation internals or
  first-message operation maps.
- `AgentRunControls`: policy and model/effort primitive for popovers, sheets, or
  host-owned settings panels. It never edits cwd; working directory selection is
  owned by `AgentStarterCwd` at thread start.
- `AgentStatusSummary`, `AgentStatusDetails`, and `AgentCriticalNoticeList`:
  severity-normalized model reroute, deprecation, config, account, MCP OAuth,
  and rate-limit notices. Info/background notices stay in secondary chrome,
  warnings stay visible without interrupting the timeline, and only genuinely
  blocking or dangerous critical notices render near the thread.
- `AgentUsagePanel`: account rate-limit windows, renderable inside or outside a shell.
- `AgentUsageSummary`: compact usage primitive for host chrome.
- `AgentRateLimitBar`: one normalized rate-limit window.
- `AgentThemeToggle`: controlled light / dark / system segmented control for
  host-owned theme state. It is not rendered by `AgentChat` automatically.
- `AgentLocaleSelect`: controlled compact locale menu for hosts that want an
  Agent UI-native language switcher. It opens as a compact header menu on
  desktop and as a bottom sheet on mobile. It is not rendered by `AgentChat`
  automatically.
- `AgentContextUsageIndicator`: compact per-thread context usage popover for
  App Server `thread/tokenUsage/updated` totals.
- `AgentDiagnosticsPanel`: user-audience bridge/account/model startup
  diagnostics. Redacted stderr, raw protocol notifications, bridge health, and
  dynamic-tool debug phases stay available through
  `useAgentDiagnostics().developerDiagnostics` and `.auditDiagnostics` for
  host-owned support or audit surfaces.
- `AgentSkillsPanel`: skill list and enable/disable controls.
- `AgentAppsPanel`: Codex Apps/connectors list from `app/list`, using upstream
  enabled/accessibility vocabulary rather than treating connector availability
  as install or auth state.

## Composition Examples

Render a fixed thread without following the globally active thread:

```tsx
import { AgentThreadView } from "@nyosegawa/agent-ui-react/primitives";

<AgentThreadView threadId="thread_123" />
```

Render usage in host chrome while the chat stays sidebar-free:

```tsx
import { AgentChat } from "@nyosegawa/agent-ui-react";
import { AgentShell, AgentUsagePanel } from "@nyosegawa/agent-ui-react/primitives";

<AgentShell>
  <AgentUsagePanel />
  <AgentChat sidebar={false} usage={false} />
</AgentShell>
```

Render a host-owned thread layout without the preset. `AgentThreadTimeline`
receives `threadId`, so pending approvals with source metadata are anchored
after the matching source item or turn. Metadata-free approvals fall back to
the transcript tail; there is no separate approval row between the transcript
and the composer:

```tsx
import {
  AgentComposerPanel,
  AgentCriticalNoticeList,
  AgentThreadHeader,
  AgentThreadSurface,
  AgentThreadTimeline,
} from "@nyosegawa/agent-ui-react/primitives";

<AgentThreadSurface>
  <AgentThreadHeader thread={threadView} threadId={threadId} transcript={transcriptView} />
  <AgentCriticalNoticeList />
  <AgentThreadTimeline threadId={threadId} />
  <AgentComposerPanel thread={thread} threadId={threadId} />
</AgentThreadSurface>
```

## Timeline And Approvals

`AgentThreadTimeline` renders user messages, assistant messages, reasoning,
commands, file changes, diffs, and structured App Server items from normalized
state. Host renderers receive `AgentTranscriptEntry` view models through
`renderItem`; they do not receive generated protocol payloads or raw reducer
item/turn entities.

The default timeline uses `AgentContentBlockView` for the normalized block taxonomy:
thinking summaries, plans, command execution with cwd/output/exit status,
file-change summaries, MCP/dynamic/collab tool calls, web search queries,
images, and system info. This renderer consumes `AgentTranscriptBlock` values
from the transcript view model, so hosts can keep visual components free of
generated App Server types while still preserving protocol-derived detail in
adapters and reducers. For media blocks, `block.resource` separates browser-safe
`previewUrl`/`url` metadata from local `path` values. Local paths are passed to
`resolveLocalMediaUrl(path, item)` before rendering; they are not used as image
or video `src` values.

`AgentApprovalQueue` reads pending approvals through `useAgentApprovals()` and
renders them as a compact pending-decision surface. In `AgentThreadView` and
`AgentChat`, pending approvals with `itemId` or `turnId` metadata render
immediately after that source context, including source items outside the
current visible window. Off-screen anchored decisions expose a pending-approval
jump control so their actions remain reachable while tail follow-scroll is
active. Requests without source metadata, or whose source no
longer exists, are appended to the end of the transcript scroll area. Both placements are
transcript items, not rows stacked between the transcript and the composer, and
have no `max-height` or `overflow` of their own (the transcript owns scrolling).
One expanded card plus compact picker rows for any other pending requests at
the same anchor. Decision actions are limited to `commandApproval`,
`fileChangeApproval`. Older upstream `execCommandApproval` and
`applyPatchApproval` requests are normalized to those canonical kinds by the
Codex adapter. Broader App Server requests such as user input, MCP elicitation,
permissions, auth refresh, and attestation are exposed through
`useAgentServerRequests()` for host-owned integration UI and do not receive generic accept /
accept-for-session / decline responses from the default approval queue. Dynamic
tool calls are host integration requests too, but they are handled out of band
and are not retained in the default queue. The pending-approval jump centers the
anchored card when it is outside the viewport. It is a navigation affordance,
not a guarantee that every footer in a very tall custom approval remains visible
without additional scrolling.

Thread actions are exposed through the default header and
`useAgentThreadActions()`: rename, fork, archive, unarchive, compact, and
rollback call generated-method request builders. Stored threads opened from the
default sidebar use `thread/read` preview hydration, while URL routing hydrates
and then resumes the conversation. The default header does not expose a separate
manual Resume button. Resume state follows the App Server response:
active/running status remains running, idle resumed threads become ready for new
messages, and if the response contains a canonical thread id different from the
requested path/id, the returned id becomes the active thread.

Composer integrations are host-owned buttons represented as visible chips after
the user chooses something. Hosts supply `composerIntegrations`
(`AgentComposerProps`, `AgentChatProps`, `AgentThreadViewProps`). Each
integration has `{ id, label, title?, resolve }`; `resolve()` may return
`{ label, input, id?, value? }`, where `input` is an explicit
`AgentUserInput | AgentUserInput[]`. The composer does not infer protocol
mentions from labels or URI strings, does not expose App/Plugin-specific picker
props, and does not invoke `globalThis.prompt`. When no integrations are
provided, no integration buttons are shown.

Thread rename is a separate header action and may use a minimal browser
prompt in the default component until a host overrides that interaction. That
does not affect composer integrations or attachment resolution.

```tsx
<AgentChat
  composerIntegrations={[
    {
      id: "browser-context",
      label: "Browser context",
      resolve: async () => {
        const selection = await openBrowserContextPicker();
        return selection
          ? {
              label: selection.title,
              input: {
                name: selection.title,
                path: selection.resourceUri,
                type: "mention",
              },
            }
          : null;
      },
    },
  ]}
/>
```

Local image and file attachments are only enabled when the host supplies
`resolveLocalAttachment`. The composer accepts attachments through clipboard
paste, drag and drop, and one toolbar attach file picker, then shows each as a
removable chip above the textarea. Image chips render a local thumbnail. File
chips render an attachment icon, filename, extension, and size. The resolver
returns structured metadata for each browser `File`: `input` is the explicit
Codex App Server input item or items, while `previewUrl`/`url`, `displayName`,
and `redactedPath` are browser/UI metadata. Agent UI never derives browser
image/video `src` values from raw filesystem paths. If a structured attachment
preview URL fails to load, the chip falls back to its attachment icon and keeps
the resolved Codex `input` unchanged.

Resource resolution uses the shared `AgentResolvedResource` object shape.
Composer file attachments require `AgentResolvedLocalAttachment` so each
resolved file has explicit Codex input. Transcript local media returns
`AgentResolvedResource | null | undefined`; string URL shorthand is not part of
the public contract. Use `previewUrl`/`url` for browser rendering and
`displayName` for safe captions. `mimeType` controls video rendering for
opaque local-media paths. This keeps browser rendering metadata
separate from App Server local paths without adding a public attachment
controller.

When a turn is running, normal Enter queues non-empty follow-ups locally and
empty Enter does not interrupt the turn. `Send now`
appears only while the queued item's expected turn is still the active turn that
can be steered. If that turn completes, stops, or is replaced before the queued
item is sent, the item stays visible with Edit and Remove actions so the draft
and attachments can be recovered instead of sending stale `turn/steer` params.

Codex App Server stable v2 has `text`, `image`, `localImage`, `skill`, and
`mention` user inputs; it does not have a generic local-file input type.
Hosts must therefore persist arbitrary files themselves. Images should become
`{ input: localImageInput(path), previewUrl }`. Non-image files should include
explicit text such as `{ input: textInput("Attached file: /absolute/path") }`
so the model can see the saved path; do not rely only on `mentionInput`. A
resolver returning `null` or throwing surfaces an inline composer error.

`examples/codex-local-web` shows the full host responsibility: a
`POST /agent-ui/upload` endpoint persists any extension, including unknown
extensions such as `.3mf`, next to the App Server and returns an absolute path.

### Start Screen

The empty-state / first-run surface is a starter composer: a large prompt card
whose prompt, lower toolbar, and submit control reuse the same public composer
styled parts as the normal composer (`AgentComposerInput`,
`AgentComposerToolbar`, `ComposerRunControls`, and
`AgentComposerSubmitButton`). Hosts can render that starter composer directly
through `AgentStartComposer`. The working directory is a thread-start setting, so it
sits beneath the card as a compact context picker instead of inside the toolbar.
The collapsed picker shows only the selected folder name; opening it shows
recent thread cwd values by folder name, keeps the full absolute path in the
selection title and request params, and marks the selected cwd with a check.
`Open folder...` invokes the
host-provided `onRequestWorkingDirectory` resolver; without one, the component
falls back to a path prompt so browser-only fixtures can still set a cwd. The
`examples/codex-local-web` wires that resolver to a local macOS folder picker
endpoint and returns the absolute selected path. Canceling that native picker
is a no-op: the resolver returns `null`, the current cwd selection is preserved,
and no fallback prompt or error is shown. The start button stays disabled until
the first-turn prompt has text. Starting from this surface creates the thread
and immediately sends the first turn. An existing thread shows its cwd read-only
in `AgentThreadHeader`; the normal composer toolbar never offers a cwd editor,
because changing the working directory mid-thread is not a meaningful Codex
operation.
Stored session JSONL paths are internal storage locations, not working
directories; when App Server supplies a real cwd, Agent UI may display that as
thread context, but internal `.codex/sessions/*.jsonl` paths stay out of
user-facing chrome.

### Mobile shell policy

`AgentChat` keeps chat and composer as the mobile primary surface. Thread
history is an off-canvas drawer opened from the `Threads` trigger in the
status bar, not a permanently stacked panel. Mode / model / effort menus open
as bottom sheets that stay inside the viewport, the approval surface stays
inside the transcript scroll area (so it never crushes the message list), and
secondary context (status, usage, diagnostics) opens from the status bar as a
sheet below tablet width instead of becoming a persistent strip below the chat.
Desktop keeps secondary context as a rail beside the transcript. While the
drawer or context sheet is open, the
background chat region does not accept pointer or keyboard interaction. Drawer
content owns its own scroll area; Agent UI does not impose global page scroll
policy outside the preset shell. Host-owned mobile sheets or modals should be
layered relative to the public `--aui-z-*` tokens, not by depending on drawer
DOM structure.

## Usage

`AgentUsagePanel` renders normalized account rate-limit windows from
`account/rateLimits/updated` notifications or explicit reads. It is safe to use
standalone in product chrome; pass `autoRefresh={false}` when another bootstrap
surface already owns startup reads.

`AgentStatusSummary` and `AgentStatusDetails` use the same normalized severity
model as `AgentCriticalNoticeList`. Codex App Server does not expose a generic
status-banner protocol or severity field; Agent UI synthesizes banners from
structured notifications. Prefer explicit `severity` on host-provided banners
or structured rate-limit fields such as `usedPercent` and
`rateLimitReachedType`. English message parsing is only a compatibility
fallback for older host banners that do not carry structured severity.

`AgentContextUsageIndicator` renders nonzero per-thread context usage from
`thread/tokenUsage/updated`. The default composer places it next to the primary
button instead of in the thread header.

`normalizeUsageWindows()` is exported for hosts that need the same window model
inside custom UI.

## Web Components

`@nyosegawa/agent-ui-web-components` exports `defineAgentChatElement()`,
`AgentChatElement`, and the related element option/instance types. The custom
element accepts `transport`, `initialState`, `components`, or the combined
`agentOptions` object as JavaScript properties and renders the standard preset
chat. Use the `chat-class` attribute or `agentOptions.className` to pass a class
name to the rendered `AgentChat`. `agentOptions` is a complete replacement, and
replacing `transport` or `initialState` remounts the underlying provider.

```ts
import "@nyosegawa/agent-ui-react/styles.css";
import {
  defineAgentChatElement,
  type AgentChatWebComponentElement,
} from "@nyosegawa/agent-ui-web-components";

defineAgentChatElement();
document.querySelector<AgentChatWebComponentElement>("agent-chat")!.transport = transport;
```
