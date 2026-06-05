# First Release

The M9 target was the first public npm release:

- `@nyosegawa/agent-ui-core@0.1.0`
- `@nyosegawa/agent-ui-codex@0.1.0`
- `@nyosegawa/agent-ui-react@0.1.0`
- `@nyosegawa/agent-ui-server@0.1.0`
- `@nyosegawa/agent-ui-web-components@0.1.0`

## Preflight

Confirm:

- `npm view <package> version` returns `E404` before the first release.
- package manifests include `license`, `description`, `repository`, `bugs`,
  `homepage`, `publishConfig.access`, `files`, `exports`, and `engines`.
- internal Agent UI package dependencies use `workspace:^<version>`, not
  `workspace:*`, and published manifests resolve them to the matching semver
  range.
- release workflow runs `bun run release:publish`, which normalizes package
  manifests before Changesets publish so published npm manifests never retain
  `workspace:` ranges.
- each public package has a README.
- `NPM_TOKEN` is configured for GitHub Actions.
- release workflow uses trusted release code, not untrusted pull request code.

## Required Validation

Run before publishing:

```sh
bun run validate:release
bun run validate:e2e
```

For additional local package confidence:

```sh
bun run test:packlist
bun run test:package-resolution
```

## Publish

Current releases use reviewed Changesets version PRs. After the version PR
merge, the trusted `main` push workflow validates the repo, publishes with
provenance from GitHub Actions, creates GitHub Releases, and runs post-publish
smoke.

Local publish is allowed only when the user explicitly requests it and accepts
that provenance or token behavior may differ from the workflow.
