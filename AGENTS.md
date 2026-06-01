# Agent UI Agent Guide

This file is the short, always-read entry point for agents working in this
repository. Keep durable details in docs and skills, then link them here instead
of expanding this file.

## Start Here

- Product scope and non-goals: `docs/architecture/product-boundary.md`
- Repository docs index: `docs/README.md`
- Contributor flow: `CONTRIBUTING.md`
- Validation matrix: `docs/architecture/testing.md`
- CI/CD and required checks: `docs/maintenance/ci-cd.md`
- Package exports and publish surface: `docs/reference/package-exports.md`
- Theming and CSS tokens: `docs/guides/theming.md`
- Browser verification: `docs/guides/browser-verification.md`
- npm release operations: `docs/maintenance/npm-release.md` and the
  `npm-release` skill
- Codex upstream sync: `docs/maintenance/codex-upstream-sync.md` and the
  `codex-upstream-sync` skill

## Non-Negotiables

- Agent UI is a reusable Codex App Server UI component library, not a hosted app
  runtime. Keep host-specific workflow, auth, persistence, process lifecycle,
  billing, and deployment policy outside the core library.
- Use Bun as the package manager and day-to-day runner.
- Keep published packages and server integrations compatible with Node.js LTS.
- Use Codex App Server as the primary protocol surface. When protocol behavior,
  generated schema, or stable versus experimental status is unclear, inspect
  `third_party/codex/codex-rs/app-server`.
- Do not edit files inside the upstream Codex submodule unless the user
  explicitly asks for that repository to be changed. Routine sync work may update
  only the submodule pointer through the `codex-upstream-sync` flow.
- When writing a name in a license file, use `{year} Sakasegawa`; confirm the
  year with `date +%Y`.

## Working Pattern

- Start by reading the relevant implementation, tests, examples, docs, and
  skills. Do not rely on filenames or memory alone when changing public surface.
- Keep edits scoped to the package, example, docs page, or validation gate that
  owns the behavior. Avoid compatibility shims for unshipped branch work.
- Add or update focused tests when changing public APIs, reducers, protocol
  normalizers, bridge behavior, package exports, release automation, or visible
  UI state.
- Update docs in the same change when behavior, public API, package boundaries,
  release operations, security posture, examples, screenshots, or validation
  policy changes.
- Use purpose-based branch, fixture, route, screenshot, test, and commit names.
  Prefer concise imperative commit subjects that describe the shipped outcome.
- Work through pull requests for `main`. Do not push directly to `main` unless
  the user explicitly requests an emergency repository operation.

## Validation

- Use targeted validation while iterating; use
  `docs/architecture/testing.md` and `docs/maintenance/ci-cd.md` to choose the
  right gate.
- Prefer `bun run validate:packages` for package output because build,
  `publint`, and `attw` must stay ordered.
- For browser-visible changes, run the relevant Playwright suite and verify real
  interaction when layout, hit testing, focus, scrolling, or overflow matters.
- Before claiming a pushed branch is ready, inspect GitHub Actions and follow
  running workflows to a concrete success or failure.

## Release And Upstream Work

- npm publishing is manual and Environment-gated. Do not treat `main` pushes as
  releases. Use the `npm-release` skill for release preparation, publish, and
  post-publish smoke.
- Weekly Codex App Server drift checks are owned by Codex App Automation using
  the `codex-upstream-sync` skill. Do not replace that cadence with a scheduled
  GitHub Actions workflow unless the user explicitly asks for that model change.
- Do not publish npm packages, merge upstream sync PRs, or move the Codex
  submodule pointer from an automation unless the relevant skill and user request
  explicitly allow that step.
