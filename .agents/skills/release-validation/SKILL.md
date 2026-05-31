---
name: release-validation
description: Validate Agent UI release readiness, package boundaries, build output, API snapshots, package resolution, Node compatibility, CI status, and publish risk. Use before release, before npm publish, after package export or declaration changes, when validating a PR for merge, or when GitHub Actions/package validation fails.
---

# Release Validation

Use this skill when package output, release readiness, CI, or publish confidence
matters. This is a repository-maintainer skill, not a user-facing install guide.

## First Pass

1. Read [validation ladder](references/validation-ladder.md).
2. Inspect the changed paths and map them to the smallest safe validation set.
3. For package/export/declaration/build-output changes, use the ordered package
   path. Do not run build, `publint`, or `attw` in parallel.
4. For pushed changes, follow GitHub Actions to a concrete success or failure.
5. Do not publish packages unless the user explicitly asks for publication.

## Standard Commands

Use targeted commands while iterating:

```sh
bun run typecheck
bun run lint
bun run test
```

Use release gates when package boundaries, generated declarations, or publish
output can change:

```sh
bun run validate:release
bun run validate:e2e
```

## Failure Handling

- Inspect logs before changing timeouts or loosening tests.
- Reproduce locally when possible.
- Fix the root cause, rerun the focused failing gate, then rerun the relevant
  broader gate.
- After push, use `gh run list` and inspect failed run logs with `gh run view`.

## Completion

Report commands run, outcomes, skipped gates with reasons, CI status, and any
remaining release risk.
