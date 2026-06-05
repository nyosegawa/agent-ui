# Contributing

Thanks for helping improve Agent UI. This repository is a reusable Codex App
Server UI component library; it is not a hosted agent runtime or product-specific
workflow engine. Start with the [Product Boundary](./docs/architecture/product-boundary.md)
when you are unsure whether a change belongs here.

## Development Setup

Use the repository-pinned Bun version and Node.js LTS-compatible package code.

```sh
bun install
bun run validate:fast
```

Useful docs:

- [Documentation index](./docs/README.md)
- [Testing](./docs/architecture/testing.md)
- [CI/CD](./docs/maintenance/ci-cd.md)
- [Package Exports](./docs/reference/package-exports.md)
- [Theming](./docs/guides/theming.md)

## Pull Request Flow

1. Create a purpose-based branch from `main`.
2. Make focused changes with matching tests and docs.
3. Use concise imperative commit subjects, for example
   `Fix package resolution smoke`.
4. Open a pull request.
5. Wait for required checks and address review comments.

Do not push directly to `main`. Maintainers merge through pull requests.

## Changesets

Add a changeset when a change should be released to npm package consumers.

Usually needs a changeset:

- public API, component, hook, adapter, export, type, or CSS package surface
  changes
- Codex protocol adapter behavior that package consumers receive
- bug fixes or compatibility fixes that should be published
- package README or installation guidance changes that affect npm consumers

Usually does not need a changeset:

- repository-only CI maintenance
- tests that do not change shipped behavior
- internal refactors with no package-facing behavior change
- contributor documentation such as this file

If you are unsure, call it out in the pull request under release impact.

## Validation

Run the narrowest useful gate while iterating, then broaden based on risk.

Common local commands:

```sh
bun run typecheck
bun run lint
bun run test
bun run validate:protocol
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:e2e:fixtures
```

Use `bun run validate:packages` for package output because build, `publint`, and
`attw` must run in order. For browser-visible changes, run the relevant
Playwright suite and verify real interactions when layout, focus, hit testing,
scrolling, or overflow is involved.

Before publishing or changing package boundaries, maintainers run:

```sh
bun run validate:release
bun run validate:e2e
```

## Maintainer-Owned Workflows

npm publishing is maintainer-only and version-PR driven. Use the `npm-release`
skill to prepare and review a Changesets version PR. Merging that reviewed
version PR to `main` lets the trusted `Release` workflow publish unpublished
package versions automatically.

Codex App Server upstream sync is also maintainer-owned. Weekly drift checks are
run by Codex App Automation with the `codex-upstream-sync` skill. Automation may
open a draft PR, but humans review and merge it.

## Security And Secrets

Never include credentials, npm tokens, local `.npmrc` files, private workspace
paths, or unpublished package archives containing secrets in a pull request.

For security-sensitive reports, avoid public issue details and contact a
maintainer privately until a disclosure path is agreed.
