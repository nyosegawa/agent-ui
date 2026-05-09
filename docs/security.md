# Security

## Security Model

Codex App Server can access powerful filesystem and shell surfaces. Agent UI must make those surfaces explicit and avoid hiding risk behind a friendly chat UI.

## Local App Server

Default:

```text
codex app-server --listen stdio://
```

This keeps the initial integration local, process-bound, and single-user.

## Shell Commands

`thread/shellCommand` is host-only in MVP.

Agent UI must not ship a default component that lets arbitrary browser users run shell commands through a generic chat input.

Reasons:

- shell command execution is high risk
- command behavior may not inherit thread sandbox assumptions
- host applications need their own authorization rules

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

`createCodexAppServerBridge()` is the single stderr redaction point for the local App Server process. It consumes raw `child.stderr`, redacts it once, forwards the redacted text to the optional host callback, and passes a redacted stderr stream to the transport. Browser WebSocket events and React diagnostics must therefore only receive redacted stderr.

The default React diagnostics surface keeps App Server warnings out of the primary chat transcript. Non-blocking plugin manifest warnings remain available in a compact diagnostics disclosure, while fatal bridge and request errors still surface as visible diagnostics.

Current redaction covers:

- `Authorization: Bearer ...`
- bare `Bearer ...`
- `token=...`
- `api_key=...` and `OPENAI_API_KEY=...`
- `password=...`
- `secret=...`
- labeled `device_code=...`, `user_code=...`, and `userCode=...`
- JSON string fields with token, secret, password, API key, or labeled device-code names

## Remote Use

Remote deployment is advanced.

Requirements:

- explicit auth for non-loopback WebSocket
- TLS when crossing machine boundaries
- per-user or per-workspace isolation
- no unauthenticated public App Server
- strict log redaction

## Multi-User

Multi-user support is outside MVP.

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
