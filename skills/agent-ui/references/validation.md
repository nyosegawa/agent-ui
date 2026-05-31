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
- check mobile width for overflow and reachable composer controls

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

## Finish Report Template

Report:

- selected profile: local single-user, host-owned remote, or debug/upgrade
- files changed
- package manager commands used
- bridge, upload, dynamic-tool, auth, and remote assumptions
- validation commands and results
- remaining host-owned production requirements
