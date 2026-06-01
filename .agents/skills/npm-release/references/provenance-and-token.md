# Provenance And Token

## Token

Use a GitHub Actions secret named `NPM_TOKEN`. Prefer storing it as an
Environment secret on the `npm-release` Environment so the publish job cannot
access it before the Environment approval gate.

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

- `workflow_dispatch`

Do not publish from `push` to `main`. Do not use `NPM_TOKEN` from
`pull_request_target` with untrusted PR code. Fork PR workflows do not receive
repository secrets by default.

The publish job should declare:

```yaml
environment: npm-release
```

Configure that Environment in GitHub with required reviewers before treating the
workflow as protected.

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
