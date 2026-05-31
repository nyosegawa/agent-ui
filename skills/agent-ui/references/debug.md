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
