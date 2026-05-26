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

- `custom-components.tsx`
- `headless-hooks.tsx`
- `themed.tsx`
- `themed.css`
- `websocket-remote-demo.tsx`
- `multi-user-deployment.md`
- `api-key-remote-deployment.md`

Recipes show host composition patterns. They should not introduce
workflow-specific APIs into the core library.

`themed.css` intentionally demonstrates host theming by overriding `--aui-*`
tokens on a wrapper. It should not be read as permission to import
`dist/styles/*` chunks or target internal `.aui-*` selectors as a public
contract; hosts still import `@nyosegawa/agent-ui-react/styles.css` once.
