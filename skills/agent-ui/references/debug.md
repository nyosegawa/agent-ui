# Debugging And Upgrades

Use this when an existing Agent UI integration is broken, stale, or being moved
to a newer version.

## Inspect First

Check:

- installed `@nyosegawa/agent-ui-*` versions
- duplicate package copies or lockfile conflicts
- public import paths
- single global stylesheet import
- React client/server boundaries
- transport URL and WebSocket upgrade route
- App Server startup command and cwd
- bridge admission and method policy errors
- upload route behavior
- structured local media resolution and missing-media fallback
- `thread/read` preview hydration versus `thread/resume` activation
- canonical thread id returned after resume
- mobile drawer open/close, tablet context sheet behavior, and composer
  reachability
- whether app-scoped MCP startup failures are being surfaced as user status
  instead of developer/audit diagnostics
- whether preview hydration, status updates, or resume are reordering the
  sidebar instead of preserving the scoped `thread/list` collection order
- approval and server-request events
- browser console, network frames, and server stderr

## Common Fixes

- Replace private CSS imports with
  `@nyosegawa/agent-ui-react/styles.css`.
- Use `createCodexWebSocketTransport()` for full chat.
- Use `attachAgentUiWebSocketBridge()` for a Node same-origin bridge.
- Keep one-shot RPC helpers out of streaming chat flows.
- Do not bypass method policy by exposing every App Server method to the
  browser.
- If resume opens the wrong thread, verify the host persists the canonical
  `threadId` returned by Agent UI instead of a stale requested id.
- If browsing history changes the active thread unexpectedly, check whether the
  host used preview hydration or resume activation. If it changes row order,
  check whether the sidebar is rendering a fallback thread list instead of the
  scoped history controller.
- If local media is broken, return structured resources from
  `resolveLocalMediaUrl(path, item)` and avoid raw filesystem `src` values.
- If bridge admission rejects, inspect the configured admission mode and any
  per-connection resolver output before changing browser code.
- Rebuild or restart host dev servers after package or export changes.

## Upgrade Flow

1. Read current Agent UI docs for the target version.
2. Update package versions together.
3. Fix public import paths.
4. Re-run typecheck and build.
5. Smoke real App Server startup locally.
6. Browser-check transcript, composer, approvals, uploads when used, and
   overflow.
7. Document any remaining host-owned migration work.
