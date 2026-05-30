# Security

## Security Model

Codex App Server can access powerful filesystem and shell surfaces. Agent UI must make those surfaces explicit and avoid hiding risk behind a friendly chat UI.

## Local App Server

Default:

```text
codex app-server --listen stdio://
```

This keeps the initial integration local, process-bound, and single-user.

Bridge lifecycle and upload/dynamic-tool boundaries are documented in
[Server Bridge](../reference/server-bridge.md).

There are three separate browser-facing boundaries:

- direct upstream App Server WebSocket, whose own browser `Origin` checks apply
  only to that upstream endpoint
- Agent UI's same-origin WebSocket bridge, which is a host endpoint and must use
  `admission` or equivalent host session checks
- one-shot HTTP RPC helpers, which default to read/list/status-shaped methods
  and do not power chat

Do not rely on upstream direct-WebSocket origin rejection to protect an Agent UI
bridge route.

## Shell Commands

`thread/shellCommand` is host-only in the local release.

Agent UI must not ship a default component that lets arbitrary browser users run shell commands through a generic chat input.

Reasons:

- shell command execution is high risk
- command behavior may not inherit thread sandbox assumptions
- host applications need their own authorization rules

Dynamic-tool bridge helpers are also privileged. Agent UI does not execute them
unless the host provides a dynamic tool handler, and helper-thread permission
requests are manual by default. Hosts that opt into mapped dynamic tools must
own authorization, workspace isolation, audit logging, and resource limits.

## Approvals

Approval UI must show enough context for the user to make a decision.

Default approval display:

- command text
- working directory when available
- sandbox/approval policy when available
- file path and patch summary for file changes
- explicit approve/reject actions

Approval state is a pending obligation. It must be resolved, rejected, or cleared on disconnect.

## Authentication

Rules:

- no raw ChatGPT token storage in Agent UI
- no browser exposure of server-side tokens
- no token logging
- no stderr or diagnostic forwarding before redaction
- no shared personal OAuth session for multi-user use
- account state must be visible to the host application

Device-code login displays only the App Server `verificationUrl` and `userCode` returned for the user to complete login. It stores `loginId` only long enough to send `account/login/cancel` and never logs the code, raw tokens, API keys, bearer tokens, passwords, or secrets.

## Diagnostics

`createCodexAppServerBridge()` is the single stderr redaction point for the local App Server process. It consumes raw `child.stderr`, redacts it once, forwards the redacted text to the optional host callback, and passes a redacted stderr stream to the transport. Bridge-owned WebSocket diagnostics and dynamic-tool failure text are redacted before they reach host stderr callbacks or App Server responses. Browser WebSocket events and React diagnostics must therefore only receive redacted stderr.

The default React diagnostics surface keeps App Server warnings out of the primary chat transcript. Known low-value Codex plugin manifest warnings about `interface.defaultPrompt` and skill icon path warnings about `interface.icon_small` / `interface.icon_large` are suppressed from visible diagnostics because they are not actionable from Agent UI. Fatal bridge errors, request errors, and other redacted stderr warnings still surface as visible diagnostics.

React diagnostics store formatted diagnostic strings only. They do not retain the raw transport stderr event in React state, so browser devtools and custom renderers do not receive a second copy of host diagnostic payloads.

Current redaction covers:

- `Authorization: Bearer ...`
- bare `Bearer ...`
- `token=...` and `token: ...`
- `api_key=...`, `api_key: ...`, `api-key: ...`, `x-api-key: ...`, and `OPENAI_API_KEY: ...`
- `password=...` and `password: ...`
- `secret=...` and `secret: ...`
- labeled `device_code`, `user_code`, and `userCode` values with `=` or `:` separators
- JSON string fields with token, secret, password, API key, or labeled device-code names

## Markdown Rendering

User and assistant messages are Markdown because real Codex sessions often
contain lists, code, tables, and links. The default renderer is intentionally
safe-by-default:

- message text becomes React text nodes unless a supported Markdown construct is recognized
- raw HTML such as `<script>` is displayed as text, not inserted into the DOM
- links are limited to `http:`, `https:`, and `mailto:`
- links open with `rel="noreferrer"` and do not get access to the opener
- command output remains in `<pre>` text content and is not parsed as Markdown

Hosts replacing `AgentMessageList` or `renderItem` are responsible for keeping
the same no-raw-HTML policy.

## Remote Use

Remote deployment is advanced.

Requirements:

- explicit auth for non-loopback WebSocket
- TLS when crossing machine boundaries
- per-user or per-workspace isolation
- no unauthenticated public App Server
- strict log redaction

## Multi-User

Multi-user support is outside the local release.

Future multi-user support requires:

- separate process/session boundaries
- separate credentials
- separate workspace roots
- host application authorization
- audit logging
- resource limits

The deployment recipe in `examples/recipes/multi-user-deployment.md` is the minimum acceptable shape for moving beyond single-user local use.

## API Keys

API keys are server-side only.

Rules:

- do not expose API keys to React, browser transports, local storage, or URL parameters
- inject API keys only into a host-owned server process when the target App Server supports that auth mode
- redact API-key-shaped strings from stderr and structured logs
- document billing/project ownership in the host application
