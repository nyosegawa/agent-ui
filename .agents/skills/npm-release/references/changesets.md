# Changesets

Agent UI uses Changesets for package versioning and changelogs.

## Policy

- Do not bump versions on every `main` push.
- Add a changeset only when a package behavior or public surface should be
  released.
- Normal changes accumulate until a version PR or explicit release commit.
- The first public release is `0.1.0` for all public packages.

## Version Meaning Before 1.0

- `patch`: bug fixes, docs that affect package guidance, small compatibility
  improvements.
- `minor`: new public APIs, components, hooks, package surfaces, or the first
  public release from `0.0.0` to `0.1.0`.
- `major`: generally reserved until the project reaches `1.0`; document any
  breaking `0.x` change clearly in the changelog.

## Workflow

Changesets can either:

- create a version PR when changeset files exist on `main`, or
- publish when versioned package manifests and changelogs are already committed
  and no unpublished changesets remain.

When using the workflow, ensure `GITHUB_TOKEN` or `CHANGESETS_GITHUB_TOKEN` can
create/update pull requests and `NPM_TOKEN` can publish `@nyosegawa` packages.
