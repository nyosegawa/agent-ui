---
name: npm-release
description: Operate Agent UI npm releases for @nyosegawa public packages with Changesets, manual GitHub Actions release workflow, npm-release Environment approval, provenance, version PR review, post-publish install smoke, rollback, and deprecation. Use when preparing or running an npm release, adding changesets, reviewing version PRs, publishing packages, or debugging release workflow failures.
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
- Do not treat `main` push as an npm release. Publishing is a manual
  `workflow_dispatch` operation.
- Use the `npm-release` GitHub Environment for the publish job. Prefer storing
  `NPM_TOKEN` as an Environment secret and requiring a reviewer before publish.
- First public release is `0.1.0`.
- Do not run canary or prerelease channels until a future design adds them.
- Keep `build`, `publint`, and `attw` ordered through
  `bun run validate:packages`.

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

Report package versions, npm org/scope status, validation commands, publish
method, package URLs, post-publish smoke results, and any remaining support
risk.
