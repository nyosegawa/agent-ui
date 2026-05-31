# Validation Ladder

## Fast Path

Use for normal implementation changes:

```sh
bun run validate:fast
```

This runs typecheck, lint, and the normal Vitest suite.

## Protocol Path

Use when Codex generated schema, method classification, normalizers, request
builders, or reducer fixtures change:

```sh
bun run validate:protocol
```

Also inspect `docs/reference/codex-protocol.md` and generated metadata.

## Package Path

Use when package exports, declarations, `files`, build output, package CSS, or
runtime importability changes:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

`validate:packages` runs `build`, `test:packlist`, `test:node-compat`,
`publint`, then `attw` in order. Keep this order. Build cleans package `dist`
directories, so do not run `build`, `publint`, or `attw` in parallel.

`test:package-resolution` performs a fresh build before checking consumer
resolution, so it is the right smoke for stale `dist` concerns.

## E2E Path

Use for browser-visible behavior, bridge behavior, and release confidence:

```sh
bun run validate:e2e
```

This cleans Playwright ports and runs deterministic fixture and real-local
browser suites. For targeted manual real-local layout checks, start the
`examples/codex-local-web` server first and run:

```sh
bun run test:e2e:real-local-web-layout
```

## Clean-State Path

Before claiming clean-workspace typecheck after package boundary, TypeScript
config, declaration, build-output, or example import changes, remove ignored
build output and rerun typecheck:

```sh
find packages examples -name dist -type d -prune -exec rm -rf {} +
find examples -name .next -type d -prune -exec rm -rf {} +
bun run typecheck
```

Do not run destructive cleanup while a dev server or build is active.

## CI Follow-Through

After pushing, inspect GitHub Actions:

```sh
gh run list --limit 10
```

If workflows are running, wait for final status. If a workflow fails, inspect the
logs, reproduce locally when possible, fix the cause, commit, push, and watch
the replacement run.
