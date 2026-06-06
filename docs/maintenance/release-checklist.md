# Release Checklist

Use this checklist before publishing Agent UI packages to npm.

## Scope

- Confirm the release packages and versions.
- Confirm the release notes are generated from Changesets.
- Confirm docs changed with any public API, package boundary, security, example,
  or visual behavior change.
- Confirm every new or promoted public API has exactly one canonical reference
  doc, an importing example or recipe, and a focused validation gate recorded in
  the PR notes.
- Confirm `NPM_TOKEN` exists as a GitHub Actions repository secret for trusted
  `main` push workflows and can publish without an interactive OTP prompt.

## Local Validation

Run:

```sh
bun run validate:release
bun run validate:e2e
```

Do not run `bun run build` in parallel with `publint` or `attw`; use
`bun run validate:packages` or `bun run validate:release` so package output is
built and inspected in order.

## Package Preflight

- Public package manifests include `publishConfig.access: "public"`.
- Public package manifests include repository, bugs, homepage, license, exports,
  files, and Node engine metadata.
- Public package manifests use `workspace:^<version>` for internal Agent UI
  dependencies so workspace installers link locally and packed packages resolve
  to the released semver range.
- Changesets keeps all public Agent UI packages fixed-versioned together, so a
  release PR aligns package versions and internal `workspace:^<version>` ranges.
- Release workflow runs `bun run release:publish`, which builds package output
  and normalizes npm registry manifests before invoking Changesets publish so
  packages include `dist` and do not keep `workspace:` dependency ranges.
- Package READMEs are present.
- `npm view <package>@<version> version` does not already show the target
  version.
- `bun run test:packlist` and `bun run test:package-resolution` pass through the
  release validation ladder.
- `bun run test:api-snapshots` matches the intended package export map, and
  `docs/reference/package-exports.md` matches the public subpaths being
  published.

## Publish

Use `.agents/skills/npm-release/` for the release flow.

1. Create a release branch from the latest `main`.
2. Ensure package-facing changes have changesets, then run
   `bunx changeset version` locally.
3. Open one release PR whose title includes the target version.
4. Review and merge the release PR after required checks pass. The `Release`
   workflow runs on the resulting `main` push, detects unpublished public
   package versions, validates, and publishes automatically.
5. Confirm the workflow completed validation, publish, GitHub Release creation,
   and post-publish smoke for the intended commit and package versions.

## Post-Publish

- Verify every package with `npm view <package>@<version> version`.
- Install published packages in a temporary consumer project outside the
  workspace.
- Verify public ESM imports.
- Verify CJS entry points where package exports provide `require`.
- Confirm GitHub Releases exist for the published package tags.
- Confirm GitHub Actions completed successfully.
- If a package failed to publish, identify exactly which package versions exist
  on npm before re-running publish.
