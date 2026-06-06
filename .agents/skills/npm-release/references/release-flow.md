# Release Flow

Use this flow for normal Agent UI npm releases after M8.

## Release Candidate

Confirm the change should be released to npm package consumers. Release-worthy
changes include:

- public API, component, hook, adapter, protocol, export, type, or CSS package
  surface changes
- bug fixes or compatibility fixes that package consumers should receive
- package README or installation guidance changes that should ship with the
  package metadata

Repository-only CI, maintenance docs, tests, and internal refactors do not
require an npm release unless they affect the published package surface or
support policy.

## Single Release PR

1. Confirm package-facing changes have a changeset.
2. Create a release branch from the latest `main`.
3. Run `bunx changeset version` locally on that branch.
4. Confirm generated package versions, changelogs, and internal
   `workspace:^<version>` ranges.
5. Confirm `.changeset/*.md` files were consumed and removed.
6. Open one release PR whose title includes the target version, for example
   `Release Agent UI packages v0.4.1`.
7. Review the release PR like any other PR and confirm required PR checks passed
   before merging.

Do not publish directly from a feature branch. The release commit should be a
reviewed release PR merge on `main`. Merging that PR is the human approval to
publish.

## Local Release PR Creation

Run these from the release branch before opening or updating the release PR:

```sh
bunx changeset version
bun run validate:release
bun run validate:e2e
```

If the release PR needs a different bump level or changelog wording, edit the
changeset before running `bunx changeset version`, or reset the release branch
and regenerate. Do not hand-edit package versions as a substitute for
Changesets.

## Automatic Publish

After the reviewed release PR is merged, the `Release` workflow runs on the
`main` push. GitHub Actions does not create release PRs. The workflow first
executes:

```sh
node scripts/check-release-targets.mjs
```

The workflow publishes only when:

- no `.changeset/*.md` files remain
- at least one public package manifest version is not already published on npm
- the release validation job passes

The publish job then runs `bun run release:publish`, creates GitHub Releases for
the package tags, and runs `node scripts/post-publish-smoke.mjs`.

`NPM_TOKEN` is available only to the trusted `main` push workflow. Do not use
`pull_request_target` for publishing.

## Failure Handling

If local release validation fails, fix the release branch and update the same
release PR. Do not create a second generated PR.

If publish fails, do not blindly rerun. First inspect npm registry state:

```sh
npm view @nyosegawa/agent-ui-core version
npm view @nyosegawa/agent-ui-codex version
npm view @nyosegawa/agent-ui-react version
npm view @nyosegawa/agent-ui-server version
npm view @nyosegawa/agent-ui-web-components version
```

Then decide whether to rerun the same workflow, create a fix release, or use the
rollback/deprecation playbook.
