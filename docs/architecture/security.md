# Security

## Security Model

Codex App Server can access powerful filesystem and shell surfaces. Agent UI must make those surfaces explicit and avoid hiding risk behind a friendly chat UI.
The ownership split between Agent UI and host applications is defined in
[Product Boundary](./product-boundary.md).

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
  `bridgePolicy.admission` or equivalent host session checks
- one-shot HTTP RPC helpers, which default to read/list/status-shaped methods
  and do not power chat

Do not rely on upstream direct-WebSocket origin rejection to protect an Agent UI
bridge route. Same-origin routing and `Origin` checks are not authentication.
The bridge defaults to `local-loopback` admission. Non-loopback or shared
endpoints must choose `host-callback` admission or an equivalent host boundary;
`unsafe-no-admission` requires a reason and should only be used when another
host-owned layer supplies authentication, isolation, and audit logging.

`browserMethodPolicy` narrows which productized App Server methods the browser
can call through the full-chat bridge. The productized default is broader than
one-shot RPC because `AgentChat` needs browser-callable account, model,
thread-history, thread-lifecycle, turn, skills, hooks, and app methods.
Host-only browser methods such as filesystem reads, shell execution, and broad
configuration writes require explicit host policy and must not be enabled by a
public browser route without authorization and audit controls.

The same bridge also carries App Server notifications, server approval
requests, browser JSON-RPC responses for those requests, and usage events.
Those surfaces are governed by the bridge lifecycle, server-request policy,
and normalized event handling, not by treating them as browser-callable
methods. Dynamic tool server requests are governed by `dynamicToolPolicy`.

One-shot HTTP RPC helpers are for one allowlisted method per request. They
cannot power `AgentChat`, streaming turns, App Server notifications, server
approval requests, browser approval responses, attachments, or full chat.

## Shell Commands

`thread/shellCommand` is host-owned and not part of the default UI surface.

Agent UI must not ship a default component that lets arbitrary browser users run shell commands through a generic chat input.

Reasons:

- shell command execution is high risk
- command behavior may not inherit thread sandbox assumptions
- host applications need their own authorization rules

Dynamic-tool bridge helpers are also privileged. Agent UI does not execute them
unless the host provides `dynamicToolPolicy: { mode: "host-callback",
handler }`, and helper-thread permission requests are manual by default. Hosts
that opt into mapped dynamic tools must own authorization, workspace isolation,
audit logging, and resource limits.

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

`createCodexAppServerBridge()` is the single stderr redaction point for the local App Server process. It consumes raw `child.stderr`, redacts it once, forwards the redacted text to the optional host callback, and passes a redacted stderr stream to the transport. Bridge-owned WebSocket diagnostics, dynamic-tool failure text, dynamic-tool debug event messages, and bridge health diagnostics are redacted before they reach host stderr callbacks, App Server responses, or host event sinks. Dynamic-tool debug events carry phase metadata for host developer/audit logs and intentionally omit raw tool arguments and MCP result content. Bridge health events carry lifecycle state and pending request counts for host developer/audit logs, but Agent UI does not persist them or attach tenant/workspace meaning. Browser WebSocket events and React diagnostics must therefore only receive redacted stderr.

Diagnostic entries carry an `AgentDiagnosticAudience` classification:
`user`, `developer`, or `audit`. User diagnostics are appropriate for visible
UI. Developer and audit diagnostics are for host-owned logs, support tools, or
review trails. Agent UI supplies the classification and redaction, but it does
not decide retention, alerting, tenant/workspace mapping, or audit storage.

The default React diagnostics surface keeps App Server warnings out of the primary chat transcript. Known low-value Codex plugin manifest warnings about `interface.defaultPrompt` and skill icon path warnings about `interface.icon_small` / `interface.icon_large` are suppressed from visible diagnostics because they are not actionable from Agent UI. Fatal bridge errors and request errors with the `user` audience still surface as visible diagnostics. Redacted stderr, admission phases, bridge health events, raw protocol notifications, unsupported notification warnings, and dynamic-tool debug phases default to `developer` and `audit`, not `user`.

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

## Local Media And Uploads

Attachment upload and transcript local-media serving are host endpoints.
`createAgentUiLocalMediaHelper()` writes to a per-session temp directory,
returns structured metadata, and serves only registered asset IDs when the host
wires `serveAssetHandler`. It does not authenticate browsers, authorize static
asset reads, persist uploads, or assign tenant/workspace meaning.

Loopback examples may route `/agent-ui/upload` and `/agent-ui/assets/<id>`
without additional auth for local development. Non-loopback or shared hosts
must add session admission, workspace/upload scoping, static route
authorization, cleanup policy, and audit logging before exposing those routes.
Browser UI must render preview URLs from structured metadata and must not
derive asset URLs from raw filesystem paths.

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
- bridge admission before spawning Codex App Server
- workspace and upload scoping
- process and output resource limits
- audit logging for bridge, workspace, approval, and shutdown events
- no unauthenticated public App Server
- strict log redaction

## Multi-User

Multi-user production hosting is host-owned advanced integration work, not
default Agent UI package behavior.

Any multi-user host requires:

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
