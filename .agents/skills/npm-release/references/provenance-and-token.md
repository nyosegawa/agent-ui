# Provenance And Token

## Token

Use a GitHub Actions repository secret named `NPM_TOKEN`. The publish job runs
only after a reviewed Changesets version PR merge to `main`; there is no
separate `npm-release` Environment approval gate in the standard flow.

Recommended npm granular token:

- owner account: `sakasegawa`
- scope: `@nyosegawa`
- package permission: read and write
- automation or 2FA-bypass publish capability; a token that requires OTP will
  fail GitHub Actions with `EOTP`
- organization permission: no access, or the minimum `nyosegawa` org access npm
  requires for scoped package publishing
- no IP allowlist for GitHub Actions
- finite expiration

Never print the token, commit an `.npmrc`, or upload token-bearing files as
artifacts.

## Workflow Safety

The publish job must run only from trusted code:

- `push` to `main`

Do not use `NPM_TOKEN` from `pull_request_target` with untrusted PR code. Fork
PR workflows do not receive repository secrets by default. Treat branch
protection, required PR checks, and reviewed version PR merges as the human
release gate.

## Provenance

The release workflow should grant:

```yaml
permissions:
  id-token: write
```

and publish through Changesets while provenance is enabled in npm config:

```sh
bunx changeset publish
```

Set `NPM_CONFIG_PROVENANCE=true` for the publish step.
