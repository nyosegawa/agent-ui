# Agent UI Documentation

Agent UI is an embeddable UI library for applications built on OpenAI Codex App
Server. The docs are organized for a public library: start by running the local
app, then choose a guide, then use reference and architecture pages when you
need exact contracts.

## Start Here

- [Getting Started](./getting-started.md): run the real local Codex web app and
  the deterministic fixture app.
- [Installation](./installation.md): packages, peer dependencies, and the
  single public React stylesheet import.

## Guides

- [React](./guides/react.md): compose `AgentProvider`, `AgentChat`, and
  primitives in a host app.
- [Approvals](./guides/approvals.md): command, file-change, user-input, and
  other pending decisions.
- [Attachments](./guides/attachments.md): paste, drag/drop, upload, and local
  path resolution.
- [Usage and Status](./guides/usage-and-status.md): account rate limits,
  thread token usage, diagnostics, and status chrome.
- [Theming](./guides/theming.md): `--aui-*` tokens and visual customization.
- [Internationalization](./guides/i18n.md): built-in locales, host-controlled
  locale state, and copy overrides.
- [Authentication](./guides/authentication.md): local device-code login and
  account state.
- [Next.js](./guides/nextjs.md): full chat sidecar versus one-shot Route
  Handler.
- [Remote Deployment](./guides/remote-deployment.md): advanced network,
  multi-user, and API-key constraints.
- [Browser Verification](./guides/browser-verification.md): local visual QA
  with `agent-browser`.

## Reference

- [React Components](./reference/react-components.md): component API and visual
  contracts.
- [Hooks](./reference/hooks.md): headless hook surface.
- [Server Bridge](./reference/server-bridge.md): WebSocket bridge, upload
  helper, dynamic tool policy, and one-shot RPC helpers.
- [Codex Protocol](./reference/codex-protocol.md): productized App Server
  methods, generated schemas, and smoke paths.
- [Package Exports](./reference/package-exports.md): package responsibilities
  and public exports.

## Architecture

- [Overview](./architecture/overview.md): layers, normalized state, reducer
  rules, and UI model.
- [Product Boundary](./architecture/product-boundary.md): scope, non-goals, and
  naming.
- [Security](./architecture/security.md): shell, filesystem, auth, remote, and
  multi-user constraints.
- [Testing](./architecture/testing.md): validation matrix and release gates.
- [Protocol Drift](./architecture/protocol-drift.md): schema refresh workflow.
- [Toolchain](./architecture/toolchain.md): Bun, Node, package validation, and
  release automation.

## Examples

- [Real Codex Local Web](./examples/codex-local-web.md)
- [Fixture Gallery and Local Vite](./examples/local-react-vite.md)
- [Next RPC Route](./examples/next-rpc-route.md)
- [Next WebSocket Sidecar](./examples/next-with-bridge-sidecar.md)
- [Recipes](./examples/recipes.md)

## Design Rule

Agent UI is not a hosted Codex service. The host application starts or connects
to Codex App Server using the user's own authentication, then composes Agent UI
components around that session.

## Release Gates

Use the ordered package path for publish checks:

```sh
bun run validate:packages
bun run test:api-snapshots
bun run test:package-resolution
bun run test:node-compat
```

The React package exposes one public stylesheet entry point:
`@nyosegawa/agent-ui-react/styles.css`. Design-system tokens in
`packages/react/src/styles/tokens.css` are the host customization API; copied
`dist/styles/*` chunks and internal `.aui-*` selectors are private
implementation details. Fixture and route CSS belongs to examples as visual QA,
and recipe theming intentionally overrides tokens. Generated stable Codex App
Server types are available only from the advanced
`@nyosegawa/agent-ui-codex/stable-types` subpath.
