# Provenance And Token

## Token

Use a GitHub Actions repository secret named `NPM_TOKEN`. The publish job runs
only after a reviewed release PR merge to `main`; there is no separate
`npm-release` Environment approval gate in the standard flow.

If a previous workflow used `environment: npm-release`, confirm the publishable
token was copied from that Environment secret to the repository secret. A
same-named Environment secret is not visible to jobs that no longer declare the
Environment.

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

npm can report `E404 Not Found` on `PUT` when the token can read a scoped
package but cannot publish to that scope or package. Treat that as a token or
organization permission failure until registry state proves otherwise.

Never print the token, commit an `.npmrc`, or upload token-bearing files as
artifacts.

## Workflow Safety

The publish job must run only from trusted code:

- `push` to `main`

Do not use `NPM_TOKEN` from `pull_request_target` with untrusted PR code. Fork
PR workflows do not receive repository secrets by default. Treat branch
protection, required PR checks, and reviewed release PR merges as the human
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
