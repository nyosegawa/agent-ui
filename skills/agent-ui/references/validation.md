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

For browser-visible work, verify interactions, not only screenshots:

- send a message
- stop a running turn
- queue a running-turn follow-up
- approve and decline a pending approval when available
- attach image and non-image files when uploads are wired
- check mobile width for overflow and reachable composer controls

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
