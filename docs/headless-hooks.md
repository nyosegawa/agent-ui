# Headless Hooks

Headless hooks are the stable customization surface for hosts that need their own layout.

## Thread Hooks

```tsx
const { thread, turns, startThread, resumeThread } = useAgentThread();
const { threads, activeThreadId, setActiveThread } = useAgentThreads();
```

Use `startThread()` for a new Codex thread and `resumeThread(threadId)` for an existing one. `resumeThread()` hydrates returned thread snapshots through the same history normalizer used by `thread/read`. `useAgentThreads()` returns ordered normalized thread state for navigation.

## History Hooks

```tsx
const history = useAgentThreadHistory();
const reader = useAgentThreadReader();
```

`useAgentThreadHistory().listThreads()` calls `thread/list`, supports search and pagination cursor inputs, and upserts returned thread metadata without activating it.

`useAgentThreadReader().readThread(threadId, { includeTurns: true })` calls `thread/read` and hydrates persisted turns/items before activation. This is the preferred preview path when a user clicks an older session but has not explicitly resumed it yet.

## Turn Hook

```tsx
const { startTurn, interruptTurn } = useAgentTurn(threadId);
```

`startTurn(input)` sends a `turn/start` request for the active or supplied thread. It merges normalized run settings into the request so the selected execution mode, model, and reasoning effort are carried to Codex.

## Composer Hook

```tsx
const composer = useAgentComposer(threadId);
```

`useAgentComposer()` owns text input state and calls `startTurn()` on submit.

## Run Settings Hook

```tsx
const run = useAgentRunSettings();
```

`useAgentRunSettings()` exposes execution modes, available models, supported efforts, current selections, and setters. Execution modes map to stable App Server `approvalPolicy` and `sandboxPolicy` turn overrides.

## Approval Hook

```tsx
const { approvals, approve, reject } = useAgentApprovals(threadId);
```

Approvals are normalized server requests. Hosts should show command, cwd, file path, patch, and policy context before calling `approve()`.

## Auth And Models

```tsx
const auth = useAgentAuth();
const models = useAgentModels();
const usage = useAgentUsage();
```

`useAgentAuth().login()` starts ChatGPT device-code login. The hook stores only normalized account/login state and never stores raw tokens.

`useAgentUsage().refreshUsage()` calls `account/rateLimits/read` and stores the returned snapshot for UI components such as `AgentUsage`.

## SDK Adapter Notes

`@nyosegawa/agent-ui-codex` exports `createCodexSdkTransportAdapter()` for hosts that already own a Codex SDK-like client with request, response, and event methods.

`@nyosegawa/agent-ui-core` exports `createOpenAIAgentsSdkTransportAdapter()` for host-owned OpenAI Agents SDK runners that only need simple thread start and text streaming. This adapter is intentionally narrower than Codex App Server and does not support command or file approvals.
