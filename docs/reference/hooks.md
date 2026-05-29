# Hooks

Headless hooks are the stable customization surface for hosts that need custom
layout, product chrome, fixed thread views, or host-owned panels. Hooks return
normalized Agent UI state and stable actions. React exposes Agent UI option
types for hook inputs; generated Codex App Server params and request builders
stay inside the Codex package boundary.

## Thread Controllers

```tsx
const thread = useAgentThreadController(threadId);
const turns = useAgentTurnController(threadId);
```

`useAgentThreadController()` is the preferred name for `useAgentThread()`. It can
follow the active thread or lock to a supplied `threadId`. Use `startThread()`
for a new Codex thread and `resumeThread(threadId)` only when the host explicitly
wants to rejoin a stored session.

`useAgentTurnController()` is the preferred name for `useAgentTurn()`. It sends
`turn/start` with normalized run settings, `turn/steer` for continuing an active
turn, and `turn/interrupt` for the visible stop action.

`turn/steer` is the Codex App Server same-turn continuation path. It requires
an active regular turn and the matching `expectedTurnId`; review and manual
compact turns reject steering. Hosts that want generic "queue this after the
current turn finishes" behaviour must own that queue themselves because App
Server does not provide it. Agent UI's default follow-up queue is exactly that:
UI-local state, not an App Server queue API.

## Thread Collection And History

```tsx
const { threads, activeThreadId, setActiveThread } = useAgentThreads();
const history = useAgentThreadHistory();
const reader = useAgentThreadReader();
```

`useAgentThreads()` returns ordered normalized thread state for navigation.

`useAgentThreadHistory().listThreads()` calls `thread/list`, supports search and
pagination cursor inputs, tracks the latest cursor, and upserts returned thread
metadata without forcing activation.

`useAgentThreadReader().readThread(threadId, { includeTurns: true })` calls
`thread/read` and hydrates persisted turns/items before activation. This is the
preferred preview path for stored sessions. Stored turn outcomes remain visible
on the hydrated turns, but they do not replace the thread-level preview status;
for example, a stored session whose last turn was interrupted still hydrates as
a resumable preview instead of an interrupted live thread.

The default `AgentChat` history sidebar uses `thread/read` so browsing a stored
transcript from the list does not imply `thread/resume`. A direct
`threadUrlRouting` URL such as `/threads/<id>` first hydrates with
`thread/read includeTurns: true`, then resumes that thread because direct links
represent opening the live conversation. The root route stays a no-thread start
state.

## Composer And Run Settings

```tsx
const composer = useAgentComposer(threadId);
const run = useAgentRunSettings();
```

`useAgentComposer()` owns input text and submits turns through the turn
controller. Idle threads submit `turn/start`. Running threads keep the textarea
editable: Enter adds to `queuedFollowUps`, Cmd/Ctrl+Enter calls `turn/steer`
immediately, and `sendQueuedFollowUp(id)` calls `turn/steer` for that item with
its stored `expectedTurnId`. Cmd/Ctrl+Enter on an idle or complete thread still
submits through `turn/start`. Queued items are scoped by thread, retain
structured attachment metadata for Edit, and remain queued with an item error
if the active turn no longer matches their stored `expectedTurnId`. `Stop`
calls only `turn/interrupt` and does not clear unsent queued follow-ups. The
hook keeps queue state separate from App Server pending input with
`queuedFollowUps`, `sendingFollowUpIds`, `followUpErrors`, and `activeTurnId`.
The default `AgentComposerPanel` still blocks submission for approval-waiting
threads and stored read-only previews.

`useAgentRunSettings()` exposes execution modes, available models, supported
efforts, cwd, current selections, and setters. Execution modes map to React-owned
`TurnStartOptions`; the hook layer converts those options to Codex params before
calling App Server.

## Server Requests And Approvals

```tsx
const { requests, respond, reject } = useAgentServerRequests(threadId);
const { approvals, approve } = useAgentApprovals(threadId);
```

`useAgentServerRequests()` returns the queued normalized server requests for the
active or supplied thread, including host integration requests such as
permissions, MCP elicitation, user input, dynamic tools, auth refresh, and
attestation. It exposes neutral `respond(requestId, result)` and
`reject(requestId, errorOrMessage)` actions so hosts can send method-specific
payloads instead of approval-shaped decisions.

`useAgentApprovals()` is approval-only: it returns only `commandApproval`,
`fileChangeApproval`, `legacyExecApproval`, and `legacyPatchApproval` requests
with stable `approve()` and `reject()` actions for decision flows.

Migration note: broad server-request handling should use
`useAgentServerRequests().respond()` / `.reject()`. The broad hook no longer
returns `approvals` or an `approve()` alias, so non-approval requests cannot
accidentally receive generic `{ decision }` responses.

## Auth, Models, And Usage

```tsx
const bootstrap = useAgentBootstrap();
const account = useAgentAccount();
const diagnostics = useAgentDiagnostics();
const models = useAgentModels();
const usage = useAgentUsage();
```

`useAgentBootstrap()` performs local startup reads after the transport connects:
`account/read`, `model/list`, and authenticated `account/rateLimits/read`.

`useAgentAccount()` starts and cancels ChatGPT device-code login while storing only
normalized account/login state.

`useAgentDiagnostics()` exposes normalized diagnostic banners, warnings, errors,
and protocol notifications for host-owned status surfaces.

`useAgentUsage().refreshUsage()` calls `account/rateLimits/read` and stores the
normalized rate-limit snapshot used by `AgentUsagePanel`.

## Skills, Hooks, Apps, And Panels

```tsx
const skills = useAgentSkills(cwd);
const hooks = useAgentHooks(cwd);
const apps = useAgentApps(threadId);
```

`useAgentSkills()` calls `skills/list`, stores normalized skills, and exposes
`setSkillEnabled()` through React-owned skill config options.

`useAgentHooks()` calls `hooks/list` and stores normalized hook metadata.

`useAgentApps()` calls `app/list`, preserves `nextCursor`, scopes state by
`threadId`, and exposes `loadMoreApps()` so hosts can page through connector/app
metadata while keeping install/auth state visible.

Host-specific workflows can compose `useAgentThreadController()`,
`useAgentTurnController()`, `useAgentServerRequests()`, and `AgentWorkspace`
slots. The core library does not own app registries, sidecar storage, plan-only
turn orchestration, or workflow-specific panel state.

Hosts that need lower-level Codex protocol construction should use
`@nyosegawa/agent-ui-codex` directly. The React package keeps generated params
out of its public API and accepts Agent UI input/options instead.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for
hosts that already own a Codex SDK-like client with request, response, and event
methods.
