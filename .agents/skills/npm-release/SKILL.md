---
name: npm-release
description: Prepare and operate Agent UI npm releases for @nyosegawa public packages, Changesets versioning, first 0.1.0 release, NPM_TOKEN and provenance setup, version PRs, npm publish, post-publish install smoke, rollback, and deprecation. Use when preparing npm release, adding changesets, reviewing version PRs, publishing packages, or debugging release workflow failures.
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
- First public release is `0.1.0`.
- Do not run canary or prerelease channels until a future design adds them.
- Keep `build`, `publint`, and `attw` ordered through
  `bun run validate:packages`.

## First Pass

1. Read [first release](references/first-release.md).
2. Read [changesets](references/changesets.md).
3. Read [provenance and token](references/provenance-and-token.md).
4. Read [post publish](references/post-publish.md) before declaring success.
5. If rollback or deprecation is requested, read
   [rollback and deprecate](references/rollback-and-deprecate.md).

## Completion

Report package versions, npm org/scope status, validation commands, publish
method, package URLs, post-publish smoke results, and any remaining support
risk.
