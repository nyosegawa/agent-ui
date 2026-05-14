# Headless Hooks

Headless hooks are the stable customization surface for hosts that need custom
layout, product chrome, or embedded worker panes. Hooks return normalized Agent
UI state and stable actions; generated Codex App Server payloads stay behind
request builders and normalizers.

## Thread Controllers

```tsx
const thread = useAgentThreadController(threadId);
const turns = useAgentTurnController(threadId);
```

`useAgentThreadController()` is the vNext name for `useAgentThread()`. It can
follow the active thread or lock to a supplied `threadId`. Use `startThread()`
for a new Codex thread and `resumeThread(threadId)` for a stored session.

`useAgentTurnController()` is the vNext name for `useAgentTurn()`. It sends
`turn/start` with normalized run settings and sends `turn/interrupt` for the
visible stop action.

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
controller. It disables submission while the target thread is running, waiting
for approval, or displaying a stored read-only preview.

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
const worker = useAgentWorkerSession(threadId);
const panel = useSkillAppPanel({ kind: "skills", open: true });
```

`useAgentSkills()` calls `skills/list`, stores normalized skills, and exposes
`setSkillEnabled()` through stable `skills/config/write` params.

`useAgentHooks()` calls `hooks/list` and stores normalized hook metadata.

`useAgentApps()` calls `app/list` and stores connected app state.

`useAgentWorkerSession()` combines thread, turn, approvals, and queued server
requests for worker-pane integrations.

`useSkillAppPanel()` is a local controller for opening, closing, and switching
skill/app side panels without coupling panel placement to `AgentChat`.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for
hosts that already own a Codex SDK-like client with request, response, and event
methods.

`@nyosegawa/agent-ui-core` exports
`createOpenAIAgentsSdkTransportAdapter()` for host-owned OpenAI Agents SDK
runners that only need simple thread start and text streaming. This adapter is
intentionally narrower than Codex App Server and does not support command or
file approvals.
