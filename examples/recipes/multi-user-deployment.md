# Multi-User Deployment Recipe

Multi-user deployment is outside the default local release. Use this only for a host application that already owns authentication, authorization, workspace assignment, and audit logging.

## Shape

```text
browser
  -> host app session
  -> authenticated same-origin WebSocket or HTTP bridge
  -> per-user/per-workspace Codex App Server process
  -> assigned workspace root
```

Required boundaries:

- one App Server process per user/session/workspace
- one credential context per user
- one explicit workspace root per bridge
- host authorization before every bridge connection
- strict stderr/log redaction before logs leave the host
- resource limits for process count, wall time, idle time, and output size

Do not share a personal OAuth session across users.

## Bridge Policy

The host bridge should:

- accept only authenticated same-origin browser sessions
- derive workspace roots server-side
- start `codex app-server --listen stdio://` server-side
- expose a narrow JSON-RPC-lite bridge to the browser
- reject unknown App Server methods unless the host explicitly allows them
- terminate the child process when the browser session ends or idles out

Browser code should use `createCodexWebSocketTransport()` only against that host-owned endpoint. The browser must not spawn Codex and must not receive raw tokens.

## Minimum Audit Events

Record host-owned audit events for:

- bridge connection accepted/rejected
- process started/stopped
- workspace selected
- command approval displayed/resolved
- file-change approval displayed/resolved
- reconnect attempts
- transport errors after token redaction

Do not log raw prompts, file contents, bearer tokens, device codes, or API keys unless the host product has explicit user-facing data-retention controls.

## Shutdown

Use aggressive cleanup:

- idle timeout for inactive sockets
- maximum turn timeout
- maximum process lifetime
- child process kill on WebSocket close
- bounded reconnect attempts from the browser

This keeps remote use closer to the local release bridge semantics.
