# CI/CD

Agent UI keeps local commands as the source of truth and uses hosted CI to make
PRs, releases, and package compatibility reviewable without turning every change
into a full release rehearsal.

## Development Flow

Normal development is PR based:

1. Open a PR from a feature branch.
2. Let path-filtered CI run the relevant checks.
3. Review the PR and required checks.
4. Merge to `main`.
5. Treat `main` as integrated code, not as an npm release trigger.

For contributor-facing branch, changeset, validation, and PR template guidance,
see [Contributing](../../CONTRIBUTING.md).

Configure GitHub branch protection outside the repository so direct pushes to
`main` are avoided and the required checks below must pass before merge.

## Required PR Checks

The `CI` workflow is the normal PR gate. Stable job names are intended for branch
protection:

- `Repository policy`
- `Typecheck`
- `Lint`
- `Unit tests`
- `Protocol and fixtures`
- `Package validation`
- `API snapshots`
- `Package resolution`
- `Playwright fixtures`

Path filters skip expensive jobs when the changed files cannot affect that
surface. Root config, workflow, lockfile, shared script, package, protocol, or
Playwright config changes are conservative and run broader checks.

Docs-only changes run the repository policy gate. Package README and changelog
changes are package-surface changes, so they are not treated as docs-only.
Docs that change documented example gates, package exports, protocol
classification, bridge policy, or browser-visible contracts should still run
the focused local validations named in [Testing](../architecture/testing.md)
before review, even when hosted CI treats the PR as docs-only.

The `Compatibility` workflow covers Node 20, 22, and 24 smoke checks plus pnpm
workspace smoke for package and toolchain compatibility-sensitive changes.
Docs-only and unrelated non-package surfaces skip it.

`Package Validation` is a manual workflow for rerunning package checks without
duplicating every PR run.

## Release Flow

npm publishing is not triggered by `main` push. Use `.agents/skills/npm-release/`
for the standard release procedure:

1. Confirm a release is needed.
2. Ensure changesets exist for package consumer changes.
3. Run the `Release` workflow in `prepare` mode to create or update the
   Changesets version PR.
4. Review and merge the version PR after required checks pass.
5. Run the `Release` workflow in `publish` mode from `main`.
6. Approve the `npm-release` Environment.
7. Verify the published packages with registry and clean consumer smoke.

The publish job is the only job with npm provenance permissions. Store
`NPM_TOKEN` as an `npm-release` Environment secret when possible and configure
required reviewers on that Environment before treating the gate as protected.

## Codex Upstream Automation

Weekly Codex App Server drift checks are owned by Codex App Automation, not a
scheduled GitHub Actions workflow. Use
`.agents/skills/codex-upstream-sync/references/codex-automation-prompt.md` for
that automation.

The automation may detect drift and open a draft PR. It must not merge the PR,
publish npm packages, or edit files inside the upstream submodule. Humans review
and merge upstream sync PRs.

## Artifacts

Hosted CI uploads diagnostic artifacts on failure where logs are otherwise hard
to reconstruct:

- package validation logs
- package resolution logs
- Playwright HTML reports
- Playwright `test-results` traces and screenshots
- release validation and e2e logs

Do not upload token-bearing files, local `.npmrc` files, or unpublished package
archives that include credentials.

## Local Fallback

When hosted CI capacity is unavailable, run the local commands that map to the
affected surface:

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:e2e:fixtures
```

For docs that document a narrower surface, use the focused example, protocol,
package, or browser gates from [Testing](../architecture/testing.md), then
record the exact commands in the PR notes.

Before npm publish, always run:

```sh
bun run validate:release
bun run validate:e2e
```
