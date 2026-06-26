# Example Types

## Deterministic Fixture App

Directory: `examples/local-react-vite`

Purpose:

- deterministic component and layout review
- fixture-backed transcript, approvals, command output, diffs, usage, status,
  apps, and thread history states
- public showcase routes split by intent: `/showcase` for starting points,
  `/showcase/components` for snippet-facing APIs, and `/showcase/patterns` for
  workflow and advanced recipes
- public route examples such as `/showcase/composed-shell`,
  `/showcase/composer-primitives`, `/showcase/transcript-content`,
  `/showcase/approvals-status`, `/showcase/thread-navigation`,
  `/showcase/rich-transcript`, `/showcase/usage-only`,
  `/showcase/scoped-thread-pane`, and `/showcase/app-connectors`
- maintainer-only visual QA routes under `/maintainer-gallery` and
  `/maintainer/*`
- a typed visual QA manifest that owns route inventory, docs screenshots,
  preview eligibility, and viewport matrix coverage

Use fixture routes for repeatable UI states. Do not make them depend on a real
Codex process.
Keep public showcase catalog guidance separate from maintainer close-ups:
user-facing snippets belong in `public-component-catalog.ts`, while exhaustive
primitive specimens belong in the close-up catalog.

## Real Local Codex Web

Directory: `examples/codex-local-web`

Purpose:

- same-origin WebSocket bridge to `codex app-server --listen stdio://`
- real account, model, thread, turn, approval, usage, upload, steer, interrupt,
  and URL routing behavior
- deterministic real-local layout checks for first-run and stored-thread
  desktop/mobile containment
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
