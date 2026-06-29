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
- in-memory success-path smoke with
  `@nyosegawa/agent-ui-codex/test-fixtures` when host tests should not spawn a
  real App Server

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
- wait for a successful `thread/start` through `turn/completed` path when a
  real or fake App Server is available
- stop a running turn
- queue a running-turn follow-up
- steer a running turn when the host exposes follow-up controls
- approve and decline a pending approval when available
- attach image and non-image files when uploads are wired
- verify upload failures show a host-visible composer error and successful
  uploads return a validated `path` plus browser-safe `previewUrl` or `url`
- open and close the mobile thread history drawer
- open host sheets or dialogs over Agent UI overlays and verify focus returns
- preview stored history with `thread/read`, then resume and verify the
  canonical thread id the host should persist
- verify stored-history preview or status updates do not reorder the visible
  thread list; rows should keep the scoped `thread/list` collection order unless
  a collection refresh, pagination response, or new thread changes that
  collection
- create a new thread, wait for the first title update and assistant response,
  reload its `/threads/<threadId>` URL, and verify the title, transcript, and
  editable composer remain available
- verify MCP startup failures stay in developer/audit diagnostics unless the
  host intentionally promotes them in host-owned UI
- verify transcript local media uses structured asset URLs and missing media
  renders the fallback
- verify bridge admission accepts and rejects the expected connections before
  App Server spawn
- verify reload/resume keeps the canonical thread id and does not silently start
  a new session
- check mobile and tablet widths for overflow, reachable composer controls, and
  secondary status/usage/diagnostics opening from an explicit context trigger
- in an external host app, build a small host-local route and viewport smoke
  that checks document overflow, visible composer controls, hit-testable primary
  actions, mobile history drawer reachability when used, and host overlays/focus
  return if the host composes sheets or dialogs around Agent UI

Use `createCodexAppServerSuccessFixture()` from
`@nyosegawa/agent-ui-codex/test-fixtures` for host-owned unit or component tests
that need canonical thread ids, `thread/start`, `thread/read`, `turn/start`,
assistant deltas, queued `turn/steer`, `turn/interrupt`, and `turn/completed`
without spawning Codex. Do not treat this fixture as validation for bridge
admission, bearer tokens, process lifecycle, upload storage, workspace
authorization, or multi-user policy; those checks remain host-owned.

Public boundary check:

- Search changed host files for private React stylesheet deep imports and
  `.aui-`.
- Replace private CSS imports with `@nyosegawa/agent-ui-react/styles.css`.
- Replace internal selector styling with `className`, slots, host wrappers, or
  `--aui-*` token overrides.

## Finish Report Template

Report:

- selected profile: local single-user, host-owned remote, or debug/upgrade
- files changed
- package manager commands used
- bridge, upload, dynamic-tool, auth, and remote assumptions
- validation commands and results
- remaining host-owned production requirements
