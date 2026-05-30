# Authentication

## Local Personal Use

Default flow:

```text
Browser UI
  -> local Agent UI bridge
    -> codex app-server --listen stdio://
      -> ChatGPT managed auth
```

For the server boundary around this bridge, see
[Server Bridge](../reference/server-bridge.md).

Login sequence:

```text
1. account/read { refreshToken: false }
2. If unauthenticated, call account/login/start { type: "chatgptDeviceCode" }
3. Store loginId, display verificationUrl and userCode
4. Optionally cancel with account/login/cancel { loginId }
5. Wait for account/login/completed and account/updated
6. Start or resume a thread
```

Agent UI provides these authentication primitives:

- device-code login component
- auth status hook
- account display
- logout action

Implemented surface:

- `useAgentBootstrap()` calls `account/read` after the transport connects and stores the normalized account state.
- `useAgentAccount()` exposes `readAccount`, `login`, and `logout`.
- `login()` calls `account/login/start` with stable params `{ type: "chatgptDeviceCode" }`.
- Device-code login state stores `loginId`, `verificationUrl`, and `userCode`; `loginId` is used only for `account/login/cancel`.
- `cancelLogin()` calls `account/login/cancel` with stable params `{ loginId }`.
- `AgentStatusBar` exposes a login action only when account state is confirmed unauthenticated.
- When authenticated, `AgentStatusBar` keeps the header label to account status and moves email, plan, usage windows, and logout into an account dialog opened from the status actions. Host chrome should follow the same pattern instead of persistently rendering personal account identifiers in the main brand area.
- `AgentChat` shows a first-run device-code login state for unauthenticated local users.
- After `account/login/completed`, `AgentChat` re-reads `account/read` and `account/rateLimits/read` so account details and usage windows update without a page refresh.
- `logout()` calls `account/logout` without params and clears local account state after the request succeeds.
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

API-key based remote operation is an advanced host-owned deployment pattern,
not default Agent UI package behavior. The local browser UI should continue to
use the Codex App Server's ChatGPT-managed account flow.

Hosts that expose a remote App Server with API-key credentials must:

- keep keys server-side
- do not expose keys to browser code
- separate per-user or per-workspace credentials
- verify the target App Server auth mode and document account/model behavior
- use an explicit authorization layer before opening any non-loopback bridge

See [Remote Deployment](./remote-deployment.md) and the
[API-key remote deployment recipe](../../examples/recipes/api-key-remote-deployment.md)
for the host-owned boundary.

## Multi-User

Multi-user production hosting is host-owned advanced integration work, not
default Agent UI package behavior.

Any multi-user host must enforce:

- separate App Server process per user/session/workspace
- separate credentials
- separate filesystem workspace
- explicit authorization layer in the host application
- no shared personal OAuth session
