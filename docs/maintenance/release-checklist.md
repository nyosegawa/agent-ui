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
- Confirm `NPM_TOKEN` exists as a GitHub Actions repository secret and can
  publish without an interactive OTP prompt.

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
- Release workflow runs `bun run release:publish`, which normalizes npm registry
  manifests before invoking Changesets publish so packages do not keep
  `workspace:` dependency ranges.
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

1. Run the `Release` GitHub Actions workflow in `prepare` mode when changesets
   should become a version PR.
2. Review and merge the version PR after required checks pass.
3. Run the `Release` workflow in `publish` mode from `main`.
4. Confirm the workflow completed validation before approving the `npm-release`
   Environment.
5. Approve the Environment only for the intended commit and package versions.

## Post-Publish

- Verify every package with `npm view <package>@<version> version`.
- Install published packages in a temporary consumer project outside the
  workspace.
- Verify public ESM imports.
- Verify CJS entry points where package exports provide `require`.
- Confirm GitHub Actions completed successfully.
- If a package failed to publish, identify exactly which package versions exist
  on npm before re-running publish.
