---
name: npm-release
description: Operate Agent UI npm releases for @nyosegawa public packages with one reviewed release PR, local Changesets versioning, automatic main-push publishing, provenance, GitHub Releases, post-publish install smoke, rollback, and deprecation. Use when preparing or running an npm release, adding changesets, creating or reviewing release PRs, publishing packages, or debugging release workflow failures.
---

# npm Release

Use this skill for Agent UI npm release operations. This skill may plan or
validate release steps, but it must not publish packages unless the user
explicitly asks to publish.

## Release Policy

- Publish public packages under the `@nyosegawa` npm scope.
- The npm account may be `sakasegawa`; publish authority comes from membership
  in the `nyosegawa` npm organization.
- Use Changesets. Do not bump package versions on every push to `main`.
- Treat a reviewed release PR merge as the human release approval.
  The release PR is created by the operator from a branch, not by GitHub Actions.
  It must include the consumed changeset output: package version bumps,
  changelogs, and aligned internal workspace ranges. It must not leave
  `.changeset/*.md` files behind.
  The `Release` workflow checks every `main` push and publishes only when local
  public package versions are not already on npm and no `.changeset/*.md` files
  remain.
- Do not add a second GitHub Environment approval gate unless the release policy
  changes. Store `NPM_TOKEN` as a repository secret for the trusted `main` push
  publish workflow.
- First public release is `0.1.0`.
- Do not run canary or prerelease channels until a future design adds them.
- Keep `build`, `publint`, and `attw` ordered through
  `bun run validate:packages`.
- Public Agent UI packages are fixed-versioned together. If one public package
  releases, the release PR should align all public package versions and internal
  `workspace:^<version>` ranges.
- Release PR titles must include the target version, for example
  `Release Agent UI packages v0.4.1`.

## First Pass

1. Read [release flow](references/release-flow.md).
2. Read [changesets](references/changesets.md).
3. Read [provenance and token](references/provenance-and-token.md).
4. Read [post publish](references/post-publish.md) before declaring success.
5. For historical first-release context, read
   [first release](references/first-release.md).
6. If rollback or deprecation is requested, read
   [rollback and deprecate](references/rollback-and-deprecate.md).

## Completion

Report package versions, npm org/scope status, validation commands, release PR
URL, publish workflow URL, package URLs, GitHub Release/tag status,
post-publish smoke results, and any remaining support risk.
