# Changesets

Agent UI uses Changesets for package versioning and changelogs.

## Policy

- Do not bump versions on every `main` push.
- `main` push runs release target detection. It publishes only when a reviewed
  version PR merge leaves public package versions that are not yet on npm.
- Add a changeset only when a package behavior or public surface should be
  released.
- Normal changes accumulate until a version PR or explicit release commit.
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

The Release workflow can either:

- create a version PR when manually dispatched in `prepare` mode, or
- publish automatically after a reviewed version PR merge when versioned package
  manifests and changelogs are already committed, no unpublished changesets
  remain, and npm does not already have the target versions.

When using the workflow, ensure `GITHUB_TOKEN` or `CHANGESETS_GITHUB_TOKEN` can
create/update pull requests and GitHub Releases, and `NPM_TOKEN` is available as
a repository secret for publishing `@nyosegawa` packages from trusted `main`
pushes.
