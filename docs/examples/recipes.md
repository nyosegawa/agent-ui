# Recipes

Directory:

```text
examples/recipes
```

Purpose:

- typed snippets for the custom components map
- custom transcript block rendering
- headless hook composition
- public controller composition
- scoped thread lists
- host-owned composer controls
- local media upload/static resolution
- bridge policy and diagnostics composition
- host integration checklist
- theming
- optional same-origin WebSocket transport wiring
- advanced deployment notes

Files:

- `src/custom-components.tsx`
- `src/custom-transcript-blocks.tsx`
- `src/headless-chat-controller.tsx`
- `src/headless-hooks.tsx`
- `src/scoped-thread-list.tsx`
- `src/host-owned-composer.tsx`
- `src/local-media-helper.tsx`
- `src/bridge-policy.ts`
- `src/diagnostics-panel.tsx`
- `src/host-integration-checklist.ts`
- `src/themed.tsx`
- `src/themed.css`
- `src/websocket-remote-demo.tsx`
- `multi-user-deployment.md`
- `api-key-remote-deployment.md`

Recipes show host composition patterns within the
[Product Boundary](../architecture/product-boundary.md). They should not
introduce workflow-specific APIs into the core library.

The bridge, diagnostics, and local-media recipes intentionally stop at typed
integration points. Host applications still own authentication, bridge
admission, tenant and workspace scoping, upload authorization, audit sinks,
Codex process lifecycle, persistence, billing, and deployment policy.

`src/themed.css` intentionally demonstrates host theming by overriding `--aui-*`
tokens on a wrapper. It should not be read as permission to import
`dist/styles/*` chunks or target internal `.aui-*` selectors as a public
contract; hosts still import `@nyosegawa/agent-ui-react/styles.css` once.

Keep these recipes in `examples/recipes` for now. A future `docs/recipes/` tree
is not needed unless these pages stop being executable examples or need a
separate narrative structure.
