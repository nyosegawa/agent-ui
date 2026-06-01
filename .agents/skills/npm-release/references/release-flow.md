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

Do not publish directly from a feature branch. The release commit should be
reviewed, merged, and present on `main` before running the release workflow.

## Manual Release Workflow

Run the `Release` GitHub Actions workflow manually from `main`.

Required input:

```text
publish
```

The workflow first runs:

```sh
bun run validate:release
bun run validate:e2e
```

Only after validation passes does the `Publish npm packages` job start. That job
uses the `npm-release` GitHub Environment. Configure the Environment with a
required reviewer so publishing stops for human approval before `NPM_TOKEN` is
available to the job.

## Publish Gate

Before approving the `npm-release` Environment:

- confirm the workflow was manually started for the intended commit on `main`
- confirm the validation job passed
- confirm the package versions do not already exist on npm
- confirm no unexpected package manifest, changelog, or README changes are in
  the release commit

Then approve the Environment and let the workflow run `bun run release:publish`.

## Failure Handling

If validation fails, inspect the uploaded artifacts and fix the repository
before re-running the workflow.

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
