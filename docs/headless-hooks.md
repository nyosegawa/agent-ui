# Headless Hooks

Headless hooks are the stable customization surface for hosts that need their own layout.

## Thread Hooks

```tsx
const { thread, turns, startThread, resumeThread } = useAgentThread();
const { threads, activeThreadId, setActiveThread } = useAgentThreads();
```

Use `startThread()` for a new Codex thread and `resumeThread(threadId)` for an existing one. `startThread()` carries the selected model and working directory from run settings into stable `thread/start` params. `resumeThread()` hydrates returned thread snapshots through the same history normalizer used by `thread/read`. `useAgentThreads()` returns ordered normalized thread state for navigation.

## History Hooks

```tsx
const history = useAgentThreadHistory();
const reader = useAgentThreadReader();
```

`useAgentThreadHistory().listThreads()` calls `thread/list`, supports search and pagination cursor inputs, tracks the latest returned cursor, and upserts returned thread metadata without activating it. The default `ThreadSidebar` uses the same hook for `Load more` pagination.

`useAgentThreadReader().readThread(threadId, { includeTurns: true })` calls `thread/read` and hydrates persisted turns/items before activation. This is the preferred preview path when a user clicks an older session but has not explicitly resumed it yet.

## Turn Hook

```tsx
const { startTurn, interruptTurn } = useAgentTurn(threadId);
```

`startTurn(input)` sends a `turn/start` request for the active or supplied thread. It merges normalized run settings into the request so the selected execution mode, model, reasoning effort, and working directory are carried to Codex.

## Composer Hook

```tsx
const composer = useAgentComposer(threadId);
```

`useAgentComposer()` owns text input state and calls `startTurn()` on submit.

## Run Settings Hook

```tsx
const run = useAgentRunSettings();
```

`useAgentRunSettings()` exposes execution modes, available models, supported efforts, working directory, current selections, and setters. Execution modes map to stable App Server `approvalPolicy` and `sandboxPolicy` turn overrides.

## Approval Hook

```tsx
const { approvals, approve, reject } = useAgentApprovals(threadId);
```

Approvals are normalized server requests. Hosts should show command, cwd, file path, patch, and policy context before calling `approve()`.

## Auth And Models

```tsx
const bootstrap = useAgentBootstrap();
const auth = useAgentAuth();
const models = useAgentModels();
const usage = useAgentUsage();
```

`useAgentBootstrap()` runs the real local app startup reads after the transport connects: `account/read { refreshToken: false }`, `model/list {}`, and, only for authenticated accounts, `account/rateLimits/read` without params. It skips data already provided by `initialState`, so fixture smoke tests do not overwrite their seeded model or usage state.

`useAgentAuth().login()` starts ChatGPT device-code login with `{ type: "chatgptDeviceCode" }`. The hook stores only normalized account/login state (`loginId`, `verificationUrl`, and `userCode`) and never stores raw tokens. `useAgentAuth().cancelLogin()` sends `{ loginId }` to `account/login/cancel` when a login is in progress.

`useAgentUsage().refreshUsage()` calls `account/rateLimits/read` without params and stores the returned snapshot for UI components such as `AgentUsage`.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for hosts that already own a Codex SDK-like client with request, response, and event methods.

`@nyosegawa/agent-ui-core` exports `createOpenAIAgentsSdkTransportAdapter()` for host-owned OpenAI Agents SDK runners that only need simple thread start and text streaming. This adapter is intentionally narrower than Codex App Server and does not support command or file approvals.
