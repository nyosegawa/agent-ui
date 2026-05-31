# First Release

The M9 target is the first public npm release:

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
- each public package has a README.
- `NPM_TOKEN` is configured as a GitHub Actions repository secret.
- release workflow uses trusted `push` to `main` or `workflow_dispatch`, not
  untrusted pull request code.

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

Prefer the release workflow. It validates the repo, then uses Changesets to
publish with provenance from GitHub Actions.

Local publish is allowed only when the user explicitly requests it and accepts
that provenance or token behavior may differ from the workflow.
