# Recipes

Directory:

```text
examples/recipes
```

Purpose:

- typed snippets for custom component slots
- headless hook composition
- theming
- optional same-origin WebSocket transport wiring
- advanced deployment notes

Files:

- `src/custom-components.tsx`
- `src/headless-hooks.tsx`
- `src/themed.tsx`
- `src/themed.css`
- `src/websocket-remote-demo.tsx`
- `multi-user-deployment.md`
- `api-key-remote-deployment.md`

Recipes show host composition patterns within the
[Product Boundary](../architecture/product-boundary.md). They should not
introduce workflow-specific APIs into the core library.

`src/themed.css` intentionally demonstrates host theming by overriding `--aui-*`
tokens on a wrapper. It should not be read as permission to import
`dist/styles/*` chunks or target internal `.aui-*` selectors as a public
contract; hosts still import `@nyosegawa/agent-ui-react/styles.css` once.

Keep these recipes in `examples/recipes` for now. A future `docs/recipes/` tree
is not needed unless these pages stop being executable examples or need a
separate narrative structure.
