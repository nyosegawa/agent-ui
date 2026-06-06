# Changesets

Agent UI uses Changesets for package versioning and changelogs.

## Policy

- Do not bump versions on every `main` push.
- `main` push runs release target detection. It publishes only when a reviewed
  release PR merge leaves public package versions that are not yet on npm.
- Add a changeset only when a package behavior or public surface should be
  released.
- Normal changes accumulate until an intentional release PR.
- The first public release is `0.1.0` for all public packages.
- Public Agent UI packages are fixed-versioned together so internal
  `workspace:^<version>` dependency ranges stay aligned.

## Version Meaning Before 1.0

- `patch`: bug fixes, docs that affect package guidance, small compatibility
  improvements.
- `minor`: new public APIs, components, hooks, package surfaces, or the first
  public release from `0.0.0` to `0.1.0`.
- `major`: generally reserved until the project reaches `1.0`; document any
  breaking `0.x` change clearly in the changelog.

## Workflow

The operator creates one release PR:

1. Ensure package-facing changes have changesets.
2. Create a release branch from `main`.
3. Run `bunx changeset version` locally.
4. Review the generated package versions, changelogs, and
   `workspace:^<version>` ranges.
5. Open a release PR whose title includes the target version.

The Release workflow publishes automatically after that reviewed release PR
merge when versioned package manifests and changelogs are already committed, no
unpublished changesets remain, and npm does not already have the target
versions.

When using the workflow, ensure `NPM_TOKEN` is available as a repository secret
for publishing `@nyosegawa` packages from trusted `main` pushes.
`CHANGESETS_GITHUB_TOKEN` is optional for GitHub Release creation; the workflow
falls back to GitHub Actions' `GITHUB_TOKEN`.
