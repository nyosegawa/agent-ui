# Rollback And Deprecate

npm package versions are immutable. Do not attempt to overwrite a published
version.

## If Publish Partially Fails

1. Identify which packages published:

   ```sh
   npm view @nyosegawa/agent-ui-core@0.1.0 version
   ```

2. Re-run publish only after confirming unpublished packages and workflow state.
3. Do not bump versions just to hide an unclear failure. First inspect the
   Changesets and npm logs.

## If A Bad Version Published

Prefer a fixed patch release:

```sh
bunx changeset
bunx changeset version
```

Then validate and publish the new version.

Use deprecation only when a published version should actively warn users:

```sh
npm deprecate @nyosegawa/agent-ui-react@0.1.0 "Use 0.1.1 or newer."
```

Do not unpublish unless the user explicitly asks and accepts npm's unpublish
constraints.
