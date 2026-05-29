# Docs Site Example

Directory:

```text
examples/docs-site
```

Purpose:

- executable package overview for Agent UI
- compile/style smoke surface for `@nyosegawa/agent-ui-react/styles.css`
- fixture-backed `AgentChat` preview for docs and release review

The docs-site example stays as a small Vite app. It is not the canonical
documentation source, not a markdown renderer, and not a host runtime. Product
documentation remains under `docs/`; this package exists so package overview
copy, stylesheet import, and fixture-backed React rendering stay covered by
typecheck, build, and style guard validation.

Run:

```sh
bun --filter @nyosegawa/agent-ui-docs-site dev
```
