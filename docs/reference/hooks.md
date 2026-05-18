# Hooks

Headless hooks are the stable customization surface for hosts that need custom
layout, product chrome, fixed thread views, or host-owned panels. Hooks return
normalized Agent UI state and stable actions; generated Codex App Server
payloads stay behind request builders and normalizers.

## Thread Controllers

```tsx
const thread = useAgentThreadController(threadId);
const turns = useAgentTurnController(threadId);
```

`useAgentThreadController()` is the preferred name for `useAgentThread()`. It can
follow the active thread or lock to a supplied `threadId`. Use `startThread()`
for a new Codex thread and `resumeThread(threadId)` for a stored session.

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
preferred preview path for stored sessions.

## Composer And Run Settings

```tsx
const composer = useAgentComposer(threadId);
const run = useAgentRunSettings();
```

`useAgentComposer()` owns input text and submits turns through the turn
controller. Idle threads submit `turn/start`. Running threads keep the textarea
editable: Enter adds to `queuedFollowUps`, Cmd/Ctrl+Enter calls `turn/steer`
immediately, and `sendQueuedFollowUp(id)` calls `turn/steer` for that item with
its stored `expectedTurnId`. Queued items are scoped by thread, retain
structured attachment metadata for Edit, and remain queued with an item error
if the active turn no longer matches their stored `expectedTurnId`. `Stop`
calls only `turn/interrupt` and does not clear unsent queued follow-ups. The
hook keeps queue state separate from App Server pending input with
`queuedFollowUps`, `sendingFollowUpIds`, `followUpErrors`, and `activeTurnId`.
The default `AgentComposerPanel` still blocks submission for approval-waiting
threads and stored read-only previews.

`useAgentRunSettings()` exposes execution modes, available models, supported
efforts, cwd, current selections, and setters. Execution modes map to stable App
Server `approvalPolicy` and `sandboxPolicy` fields.

## Server Requests And Approvals

```tsx
const requests = useAgentServerRequests(threadId);
const approvals = useAgentApprovals(threadId);
```

`useAgentServerRequests()` returns the queued normalized server requests for the
active or supplied thread. `useAgentApprovals()` adds stable `approve()` and
`reject()` actions for command, file-change, and session approval flows.

## Auth, Models, And Usage

```tsx
const bootstrap = useAgentBootstrap();
const auth = useAgentAuth();
const models = useAgentModels();
const usage = useAgentUsage();
```

`useAgentBootstrap()` performs local startup reads after the transport connects:
`account/read`, `model/list`, and authenticated `account/rateLimits/read`.

`useAgentAuth()` starts and cancels ChatGPT device-code login while storing only
normalized account/login state.

`useAgentUsage().refreshUsage()` calls `account/rateLimits/read` and stores the
normalized rate-limit snapshot used by `AgentUsagePanel`.

## Skills, Hooks, Apps, And Panels

```tsx
const skills = useAgentSkills(cwd);
const hooks = useAgentHooks(cwd);
const apps = useAgentApps(threadId);
```

`useAgentSkills()` calls `skills/list`, stores normalized skills, and exposes
`setSkillEnabled()` through stable `skills/config/write` params.

`useAgentHooks()` calls `hooks/list` and stores normalized hook metadata.

`useAgentApps()` calls `app/list`, preserves `nextCursor`, scopes state by
`threadId`, and exposes `loadMoreApps()` so hosts can page through connector/app
metadata while keeping install/auth state visible.

Host-specific workflows can compose `useAgentThreadController()`,
`useAgentTurnController()`, `useAgentServerRequests()`, and `AgentWorkspace`
slots. The core library does not own app registries, sidecar storage, plan-only
turn orchestration, or workflow-specific panel state.

`@nyosegawa/agent-ui-codex/request-builders` also exports structured input
helpers for skills, mentions, images, and the `agent-browser` verification
workflow. Hosts can pass the returned `UserInput[]` directly to
`turnStartParams()` or `useAgentTurn().startTurn()`.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for
hosts that already own a Codex SDK-like client with request, response, and event
methods.

`@nyosegawa/agent-ui-core` exports
`createOpenAIAgentsSdkTransportAdapter()` for host-owned OpenAI Agents SDK
runners that only need simple thread start and text streaming. This adapter is
intentionally narrower than Codex App Server and does not support command or
file approvals.
