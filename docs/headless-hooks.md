# Headless Hooks

Headless hooks are the stable customization surface for hosts that need their own layout.

## Thread Hooks

```tsx
const { thread, turns, startThread, resumeThread } = useAgentThread();
const { threads, activeThreadId, setActiveThread } = useAgentThreads();
```

Use `startThread()` for a new Codex thread and `resumeThread(threadId)` for an existing one. `useAgentThreads()` returns ordered normalized thread state for navigation.

## Turn Hook

```tsx
const { startTurn, interruptTurn } = useAgentTurn(threadId);
```

`startTurn(input)` sends a `turn/start` request for the active or supplied thread.

## Composer Hook

```tsx
const composer = useAgentComposer(threadId);
```

`useAgentComposer()` owns text input state and calls `startTurn()` on submit.

## Approval Hook

```tsx
const { approvals, approve, reject } = useAgentApprovals(threadId);
```

Approvals are normalized server requests. Hosts should show command, cwd, file path, patch, and policy context before calling `approve()`.

## Auth And Models

```tsx
const auth = useAgentAuth();
const models = useAgentModels();
```

`useAgentAuth().login()` starts ChatGPT device-code login. The hook stores only normalized account/login state and never stores raw tokens.

