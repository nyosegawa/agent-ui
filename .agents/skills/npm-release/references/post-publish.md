# Post Publish

After publishing, verify the registry and a clean consumer install.

## Registry Checks

```sh
npm view @nyosegawa/agent-ui-core@0.1.0 version
npm view @nyosegawa/agent-ui-codex@0.1.0 version
npm view @nyosegawa/agent-ui-react@0.1.0 version
npm view @nyosegawa/agent-ui-server@0.1.0 version
npm view @nyosegawa/agent-ui-web-components@0.1.0 version
```

Check package metadata when needed:

```sh
npm view @nyosegawa/agent-ui-react@0.1.0 dist.tarball
npm view @nyosegawa/agent-ui-react@0.1.0 provenance
```

## Clean Consumer Smoke

Create a temporary project outside the workspace and install from npm:

```sh
npm install react react-dom \
  @nyosegawa/agent-ui-core@0.1.0 \
  @nyosegawa/agent-ui-codex@0.1.0 \
  @nyosegawa/agent-ui-react@0.1.0 \
  @nyosegawa/agent-ui-server@0.1.0 \
  @nyosegawa/agent-ui-web-components@0.1.0
```

Then verify ESM and CJS imports for public exports. Do not rely on workspace
symlinks for post-publish smoke.

## Documentation

After a successful first release, update install instructions only if the
published registry behavior differs from the documented commands.
