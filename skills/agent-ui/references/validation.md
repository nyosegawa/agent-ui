# Validation

Use the host app's validation ladder, not the Agent UI repository's maintainer
commands, unless the user is working inside Agent UI itself.

## External Host Checks

Run the closest available commands:

- install check from the host package manager
- typecheck
- lint
- unit/component tests
- production build
- local browser smoke against the Agent UI route
- real Codex App Server smoke when local auth and `codex` are available

Package manager check:

- `bun.lock` means use Bun commands.
- `package-lock.json` means use npm commands.
- `pnpm-lock.yaml` means use pnpm commands.
- `yarn.lock` means use Yarn commands.
- If no lockfile exists, follow the package manager in `packageManager` or the
  user's instruction.
- If you accidentally create the wrong lockfile, remove it before finishing and
  rerun install with the selected package manager.

For browser-visible work, verify interactions, not only screenshots:

- send a message
- stop a running turn
- queue a running-turn follow-up
- approve and decline a pending approval when available
- attach image and non-image files when uploads are wired
- open and close the mobile thread history drawer
- open host sheets or dialogs over Agent UI overlays and verify focus returns
- preview stored history with `thread/read`, then resume and verify the
  canonical thread id the host should persist
- verify stored-history preview or status updates do not reorder the visible
  thread list unless a collection refresh or new thread actually changes
  recency
- create a new thread, wait for the first title update and assistant response,
  reload its `/threads/<threadId>` URL, and verify the title, transcript, and
  editable composer remain available
- verify app-scoped MCP startup failures stay in developer/audit diagnostics
  unless the host intentionally promotes them
- verify transcript local media uses structured asset URLs and missing media
  renders the fallback
- verify bridge admission accepts and rejects the expected connections before
  App Server spawn
- check mobile and tablet widths for overflow, reachable composer controls, and
  secondary status/usage/diagnostics opening from an explicit context trigger

Public boundary check:

- Search changed host files for private React stylesheet deep imports and
  `.aui-`.
- Replace private CSS imports with `@nyosegawa/agent-ui-react/styles.css`.
- Replace internal selector styling with `className`, slots, host wrappers, or
  `--aui-*` token overrides.

## Agent UI Repository Checks

Only when changing this repository, use its Bun scripts:

```sh
bun run typecheck
bun run lint
bun run test
```

For package or CSS changes, follow the repository docs for broader package,
style, Playwright, and build validation.

For Agent UI changes touching thread history, diagnostics, or responsive chat
chrome, include the focused reducer/protocol/component tests plus the real-local
thread lifecycle Playwright spec. Browser-visible layout changes should also run
the relevant fixture or real-local layout gate for desktop, tablet, and mobile
widths.

## Finish Report Template

Report:

- selected profile: local single-user, host-owned remote, or debug/upgrade
- files changed
- package manager commands used
- bridge, upload, dynamic-tool, auth, and remote assumptions
- validation commands and results
- remaining host-owned production requirements
