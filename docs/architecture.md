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

## Codex Session Facade

`@nyosegawa/agent-ui-codex` owns the stable Codex product API boundary:

- request builders live in `request-builders.ts` and are checked against
  generated stable App Server params
- `createCodexSession()` exposes account, model, thread, turn, skills, hooks,
  and app helpers
- React imports request builders through the Codex package instead of carrying
  hand-written protocol copies
- experimental methods require explicit `experimental: true` opt-in
- `thread/turns/items/list` is disabled even with opt-in until upstream
  implements it

The stdio transport retries overload error `-32001` only for read-only,
idempotent methods such as `thread/read`, `thread/list`, `skills/list`,
`hooks/list`, `app/list`, `model/list`, `account/read`, and
`account/rateLimits/read`.

## Core State

```ts
type AgentSessionState = {
  connection: ConnectionState;
  account: AccountState;
  usage: UsageState;
  skills: SkillsState;
  apps: AppsState;
  hooks: HooksState;
  threads: Record<ThreadId, ThreadState>;
  threadRegistry: ThreadRegistryState;
  activeThreadId?: ThreadId;
  pendingServerRequests: Record<RequestId, PendingServerRequest>;
  serverRequestQueue: ServerRequestQueueState;
  models: ModelState;
  diagnostics: DiagnosticsState;
  configWarnings: WarningState[];
};

type ThreadState = {
  thread: AgentThread;
  turns: Record<TurnId, TurnState>;
  orderedTurnIds: TurnId[];
  tokenUsage?: ThreadTokenUsage;
  status: ThreadStatus;
  registryStatus: "cold" | "preview" | "live" | "loaded";
};

type TurnState = {
  turn: AgentTurn;
  itemOrder: string[];
  items: Record<string, AgentItemState>;
  blocksByItemId: Record<string, AgentItemBlock>;
  streamingTextByItemId: Record<string, string>;
  commandOutputByItemId: Record<string, string>;
  filePatchByItemId: Record<string, unknown>;
  plan?: TurnPlanState;
  diff?: TurnDiffState;
};
```

The reducer keeps compatibility aliases such as `activeThreadId`,
`pendingServerRequests`, `account.rateLimits`, `configWarnings`, and `errors`,
but new vNext code should use the normalized stores: `threadRegistry`,
`serverRequestQueue`, `usage`, and `diagnostics`.

## Reducer Rules

- `thread/started`: upsert thread
- `thread/upserted`: update registry state without stealing active selection
- `thread/status/changed`: update thread status
- `thread/name/updated`: update thread name
- `thread/tokenUsage/updated`: update token usage
- `turn/started`: create or update in-progress turn
- `turn/plan/updated`: attach latest plan to the turn
- `turn/diff/updated`: attach latest turn diff to the turn
- `account/rateLimits/updated`: attach latest account rate-limit snapshot to
  both account compatibility state and `usage.accountRateLimits`
- `skills/updated`, `apps/updated`, and `hooks/updated`: update normalized
  host capability stores
- `skills/changed`: add a refresh banner because the App Server notification is
  an invalidation signal, not a full skills payload
- `status/banner/*`: update model reroute, deprecation, config, account, MCP
  OAuth, rate-limit, and system banners
- `item/started`: create in-progress item
- delta notifications: append or update transient state
- `item/completed`: replace item with authoritative item
- `turn/completed`: replace terminal turn state
- server request: create pending interaction in both map and FIFO queue
- server request resolved/rejected: clear pending interaction
- JSON-RPC error: attach request/global error state

`item/completed` and `turn/completed` are authoritative.

## UI Model

The drop-in UI is a convenience layer over the headless API.

Default primitives:

- `AgentProvider`
- `AgentShell`
- `AgentChat`
- `AgentThreadView`
- `AgentThreadHeader`
- `AgentThreadTimeline`
- `AgentApprovalQueue`
- `AgentComposerPanel`
- `AgentUsagePanel`
- `AgentDiagnosticsPanel`
- `AgentSkillsPanel`
- `AgentAppsPanel`
- `AgentThreadSidebar`
- `AgentWorkspace`

Customization:

- CSS variables
- `className`
- slots
- render props
- headless hooks

`AgentChat` is a transcript-first convenience preset over the same primitives.
Hosts can render a single fixed thread, move usage/status/diagnostics into host
chrome, hide the built-in sidebar, or embed their own side panels without
depending on the preset shell.

`AgentTranscript` / `AgentMessageList` own the real Codex session timeline.
User messages, assistant messages, reasoning, tool calls, command output, and
file-change diffs render in App Server turn/item order. Command output and
diffs are not grouped into a UI-owned activity bucket or rendered as detached
bottom panels because either choice separates the work from the assistant
context and makes stored Codex sessions harder to audit.

Pending approvals are part of that same transcript. `AgentThreadView` and
`AgentChat` append `AgentApprovalQueue` as the final item of the transcript
scroll area, so an approval reads as the last pending-decision item of the
thread rather than a separate pane wedged between the transcript and the
composer. `AgentThreadSurface` therefore has exactly four grid rows — header,
optional critical notices, transcript, composer — and the transcript scroll
area is the only scroll container. The approval surface never carries its own
`max-height` or `overflow`.

Hydrated history is intentionally incremental. `AgentMessageList` starts from
the newest transcript items, reveals older items through `Show earlier items`,
and always renders user and assistant message bodies expanded. Expensive
non-chat bodies such as command output, JSON, and CodeMirror diff bodies stay
unmounted until the user opens the corresponding details disclosure.
Because `thread/read` is a stored-history API, it can differ from the live
WebSocket stream that originally drove a turn. Agent UI therefore treats every
returned execution-shaped item as first-class transcript context:
`commandExecution` when present, plus `mcpToolCall`, dynamic tool calls, and
`fileChange`. If the newest window includes a file-change item, command/tool
items from that same turn remain visible with it even when they fall outside
the raw item-count window.

The transcript renderer keeps public primitives exported from
`packages/react/src/timeline.tsx`, while pure internal logic lives under
`packages/react/src/timeline/`: `blocks.ts` synthesizes normalized transcript
blocks from stored App Server items, `formatters.ts` owns labels/status/text
formatting, and `previews.ts` owns closed-card previews. This keeps App Server
item-kind handling centralized instead of scattering it through visual
components.

The React package keeps zero-dependency visual primitives internal. Shared
icons and the button class helper live in
`packages/react/src/components-internal.tsx`; `components.tsx` remains the
public component surface and should not grow another local icon/button system.

The Vite fixture app is split by intent. Route composition stays in
`examples/local-react-vite/src/main.tsx`, visual close-ups live under
`examples/local-react-vite/src/closeups/`, and deterministic demo state /
transport fixtures live under `examples/local-react-vite/src/fixtures/`. Keep
this separation so fake visual QA data does not leak into the real
`examples/codex-local-web` App Server integration.

## Fixed UI Decisions

- Approval UX defaults to inline cards in the chat stream.
- Modal and side-panel approvals are supported through slots.
- Diff viewer uses a read-only CodeMirror surface with a textual fallback.
- Monaco is deferred because it requires heavier worker and asset configuration from hosts.
- `ThreadList` / `AgentThreadSidebar` ship as minimal components.
- Full navigation layouts live in examples.
- `thread/shellCommand` is host-only in the local release.
