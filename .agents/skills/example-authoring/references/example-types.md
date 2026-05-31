# Example Types

## Deterministic Fixture App

Directory: `examples/local-react-vite`

Purpose:

- deterministic component and layout review
- fixture-backed transcript, approvals, command output, diffs, usage, status,
  apps, and thread history states
- visual QA routes such as `/fixture-gallery`, `/rich-transcript`,
  `/usage-only`, `/scoped-thread-pane`, and `/app-connectors`

Use fixture routes for repeatable UI states. Do not make them depend on a real
Codex process.

## Real Local Codex Web

Directory: `examples/codex-local-web`

Purpose:

- same-origin WebSocket bridge to `codex app-server --listen stdio://`
- real account, model, thread, turn, approval, usage, upload, steer, interrupt,
  and URL routing behavior
- loopback-first bridge defaults that host apps can learn from

Use this when testing App Server-backed behavior. Keep remote or multi-user use
explicitly host-owned.

## Next.js Examples

Use the WebSocket sidecar shape for full chat. Use one-shot Route Handlers only
for narrow read/list/admin RPCs that do not need streaming notifications,
approval requests, or browser responses.

## Recipes

Recipes should teach reusable host patterns, not repository maintenance
procedures. Keep them current-state oriented and implementation-facing.
