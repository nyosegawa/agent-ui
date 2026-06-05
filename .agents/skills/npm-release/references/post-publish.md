# Post Publish

After publishing, verify the registry and a clean consumer install.

## Registry Checks

```sh
npm view @nyosegawa/agent-ui-core@<version> version
npm view @nyosegawa/agent-ui-codex@<version> version
npm view @nyosegawa/agent-ui-react@<version> version
npm view @nyosegawa/agent-ui-server@<version> version
npm view @nyosegawa/agent-ui-web-components@<version> version
```

Check package metadata when needed:

```sh
npm view @nyosegawa/agent-ui-react@<version> dist.tarball
npm view @nyosegawa/agent-ui-react@<version> provenance
```

## Clean Consumer Smoke

Create a temporary project outside the workspace and install from npm:

```sh
bun add react react-dom \
  @nyosegawa/agent-ui-core@<version> \
  @nyosegawa/agent-ui-codex@<version> \
  @nyosegawa/agent-ui-react@<version> \
  @nyosegawa/agent-ui-server@<version> \
  @nyosegawa/agent-ui-web-components@<version>
```

Then verify ESM and CJS imports for public exports. Do not rely on workspace
symlinks for post-publish smoke.

The release workflow runs the same shape through:

```sh
node scripts/post-publish-smoke.mjs
```

## Documentation

After a successful first release, update install instructions only if the
published registry behavior differs from the documented commands.
