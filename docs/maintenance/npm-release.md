# npm Release

Agent UI publishes public npm packages under the `@nyosegawa` organization:

- `@nyosegawa/agent-ui-core`
- `@nyosegawa/agent-ui-codex`
- `@nyosegawa/agent-ui-react`
- `@nyosegawa/agent-ui-server`
- `@nyosegawa/agent-ui-web-components`

The first public release was `0.1.0`. Releases use Changesets for versioning and
trusted `main` push automation for provenance-enabled publishing after one
reviewed release PR merges.

## Versioning Policy

Do not increment package versions on every `main` push. Add a changeset when a
package-facing change should be released, then create a release branch and run
`bunx changeset version` locally so one release PR contains package version
bumps, changelogs, and aligned internal workspace ranges. main push checks
whether already-versioned packages are unpublished; only reviewed release PR
merges should produce unpublished package versions.

Before `1.0`, use:

- `patch` for fixes and small compatibility/documentation updates.
- `minor` for new public APIs, new components/hooks, package surface changes,
  and the first public `0.1.0` release.
- `major` only when a future release policy explicitly needs it.

## Release Workflow

The `Release` GitHub Actions workflow publishes only from trusted `main`
pushes. It does not create release PRs.

Create a release PR locally:

1. Create a release branch from the latest `main`.
2. Ensure package-facing changes have changesets.
3. Run `bunx changeset version`.
4. Confirm `.changeset/*.md` files were consumed.
5. Confirm package versions, changelogs, and internal
   `workspace:^<version>` ranges.
6. Open one release PR whose title includes the target version, for example
   `Release Agent UI packages v0.4.1`.
7. Run `bun run validate:release` and `bun run validate:e2e`.
8. Review and merge that release PR after required checks pass.

After the reviewed release PR has merged, the `main` push workflow:

1. Runs `node scripts/check-release-targets.mjs` to compare local public package
   versions with npm.
2. Skips publishing when no public package has an unpublished version.
3. Fails before publishing if public package manifest versions diverge.
4. Fails before publishing if `.changeset/*.md` files remain alongside
   unpublished package versions.
5. Runs the same release validation ladder.
6. Runs `bun run release:publish`, which builds package `dist` output inside
   the publish job, normalizes npm publish manifests so internal `workspace:`
   dependencies become semver ranges, then runs `bunx changeset publish`.
7. Creates GitHub Releases for the package tags.
8. Runs `node scripts/post-publish-smoke.mjs` against the published registry
   packages.

The publish job uses `NPM_TOKEN` and grants `id-token: write` so npm can attach
provenance. Store `NPM_TOKEN` as a repository secret for trusted `main` push
workflows. Fork pull requests do not receive repository secrets by default, and
the publish workflow does not run untrusted PR code. `NPM_TOKEN` must be an
automation-capable token or otherwise able to publish without an OTP prompt; a
token that requires interactive 2FA fails in GitHub Actions with `EOTP`.

`CHANGESETS_GITHUB_TOKEN` is optional. If present, it can be used for GitHub
Release creation; otherwise the workflow falls back to GitHub Actions'
`GITHUB_TOKEN`.

## Required Local Gates

Run these before an intentional publish:

```sh
bun run validate:release
bun run validate:e2e
```

`validate:release` includes package build, package packlist checks,
package-resolution smoke, API snapshots, Node compatibility, dead-code checks,
lint, typecheck, and unit/protocol/fixture tests.

## Package Metadata

Each public package should keep:

- `publishConfig.access: "public"`
- internal Agent UI dependencies as `workspace:^<version>`, never
  `workspace:*`, so workspace installs use local packages and packed npm
  manifests resolve to the released semver range
- `repository.directory`
- `bugs.url`
- `homepage`
- `license`
- `engines.node`
- a package README
- a narrow `files` list for publish output

Package output must continue to pass `publint`, `attw`, and the local packlist
smoke. The packlist smoke checks npm's dry-run packlist and fails if a public
package would publish without `dist` files.

Public Agent UI packages are fixed-versioned together in Changesets. A release
PR should align all public package versions and internal `workspace:^<version>`
ranges so dependency-only packages do not drift to a patch version while their
dependencies point at a minor version.

The published npm manifests must not contain `workspace:` dependencies. The
release workflow handles this immediately before publishing; post-publish
consumer smoke verifies the registry package can install outside the workspace.

## Post-Publish Verification

After the workflow publishes, verify the registry:

```sh
npm view @nyosegawa/agent-ui-core@<version> version
npm view @nyosegawa/agent-ui-codex@<version> version
npm view @nyosegawa/agent-ui-react@<version> version
npm view @nyosegawa/agent-ui-server@<version> version
npm view @nyosegawa/agent-ui-web-components@<version> version
```

Then install the published packages in a temporary project outside the
workspace and verify public ESM and CJS imports. The workflow does this with
`node scripts/post-publish-smoke.mjs`. Do not rely on workspace symlinks for
post-publish smoke.

## Support Operations

npm versions are immutable. If a bad version is published, prefer a fixed patch
release. Use `npm deprecate` only when the published version should warn users.
Do not unpublish unless explicitly approved and npm's unpublish constraints are
understood.

Use `.agents/skills/npm-release` for repeatable release planning, validation,
post-publish smoke, rollback, and deprecation workflows.
