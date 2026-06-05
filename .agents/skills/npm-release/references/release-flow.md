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

## Changesets And Version PR

1. Confirm package-facing changes have a changeset.
2. Confirm the Changesets version PR generated package versions and changelogs.
3. Review the version PR like any other PR; do not merge it only because it is
   generated.
4. Confirm required PR checks passed before merging the version PR.

Do not publish directly from a feature branch. The release commit should be a
reviewed Changesets version PR merge on `main`. Merging that PR is the human
approval to publish.

## Prepare Version PR

Run the `Release` GitHub Actions workflow manually from `main` only when
changesets should become a version PR.

Required input:

```text
prepare
```

The workflow first runs:

```sh
bun run validate:release
bun run validate:e2e
```

Only after validation passes does the workflow create or update the
`Release Agent UI packages` Changesets version PR.

## Automatic Publish

After the reviewed version PR is merged, the `Release` workflow runs on the
`main` push and first executes:

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

If prepare validation fails, inspect the uploaded artifacts and fix the
repository before re-running the workflow.

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
