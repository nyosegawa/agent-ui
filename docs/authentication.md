# Authentication

## Local Personal Use

Default flow:

```text
Browser UI
  -> local Agent UI bridge
    -> codex app-server --listen stdio://
      -> ChatGPT managed auth
```

Login sequence:

```text
1. account/read
2. If unauthenticated, call account/login/start with chatgptDeviceCode
3. Display verificationUrl and userCode
4. Wait for account/login/completed
5. Apply account/updated
6. Start or resume a thread
```

Agent UI may provide:

- device-code login component
- auth status hook
- account display
- logout action

Implemented surface:

- `useAgentBootstrap()` calls `account/read` after the transport connects and stores the normalized account state.
- `useAgentAuth()` exposes `readAccount`, `login`, and `logout`.
- `login()` calls `account/login/start` with `chatgptDeviceCode`.
- `AgentStatusBar` exposes a login action only when account state is confirmed unauthenticated.
- `AgentChat` shows a first-run device-code login state for unauthenticated local users.
- The helper does not store or log raw tokens.

Agent UI must not:

- issue OpenAI OAuth tokens
- store raw ChatGPT tokens
- share one user's auth session with another user
- hide the current account state from the host app

## Remote Personal Use

Remote personal use is advanced.

Preferred constraints:

- keep App Server bound to loopback when possible
- use SSH port forwarding when practical
- use explicit bearer auth for non-loopback WebSocket exposure
- avoid putting bearer tokens in command-line logs

## API Key

API-key based remote operation may be useful for controlled deployments, but it is not the MVP default.

If supported later:

- document the exact model/account behavior
- keep keys server-side
- do not expose keys to browser code
- separate per-user or per-workspace credentials

## Multi-User

Multi-user use is outside MVP.

Required constraints for future support:

- separate App Server process per user/session/workspace
- separate credentials
- separate filesystem workspace
- explicit authorization layer in the host application
- no shared personal OAuth session
