# Agent UI Documentation

Agent UI is an embeddable Codex App Server UI component library for host
applications. The docs are organized for a public library: start by running the
local app, then choose a guide, then use reference and architecture pages when
you need exact contracts.

## Start Here

- [Getting Started](./getting-started.md): run the real local Codex web app and
  the deterministic fixture app.
- [Installation](./installation.md): packages, peer dependencies, and the
  single public React stylesheet import.
- [Contributing](../CONTRIBUTING.md): pull requests, changesets, validation, and
  maintainer-owned release workflows.

## Public Packages

- `@nyosegawa/agent-ui-core`
- `@nyosegawa/agent-ui-codex`
- `@nyosegawa/agent-ui-react`
- `@nyosegawa/agent-ui-server`
- `@nyosegawa/agent-ui-web-components`

## Guides

- [React](./guides/react.md): compose `AgentProvider`, `AgentChat`, and
  primitives in a host app.
- [Web Components](./guides/web-components.md): wrap the React preset in a
  custom element when a host cannot mount React directly.
- [Approvals](./guides/approvals.md): default command and file-change
  approvals, plus host-owned handling for broader server requests such as user
  input.
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

## Maintenance

- [Codex Upstream Sync](./maintenance/codex-upstream-sync.md): Agent Skill,
  drift scripts, Codex Automation prompt, and PR review checklist for App Server
  updates.
- [Codex Hooks](./maintenance/codex-hooks.md): project-local hook policy,
  trust/review behavior, and validation for safer repository development.
- [CI/CD](./maintenance/ci-cd.md): PR checks, path-filtered CI, manual release,
  artifacts, and local fallback.
- [Installable Agent UI Skill](./maintenance/agent-ui-skills.md): public
  `skills/agent-ui` layout, install commands, references, and validation.
- [Repository Development Skills](./maintenance/repository-skills.md):
  maintainer-only `.agents/skills` for reviews, release validation, examples,
  and browser QA.
- [npm Release](./maintenance/npm-release.md): Changesets, provenance-enabled
  publishing, package metadata, and post-publish verification.
- [Release Checklist](./maintenance/release-checklist.md): pre-publish,
  publish, and post-publish gates.

## Examples

- [Real Codex Local Web](./examples/codex-local-web.md)
- [Fixture Gallery and Local Vite](./examples/local-react-vite.md)
- [Next RPC Route](./examples/next-rpc-route.md)
- [Next WebSocket Sidecar](./examples/next-with-bridge-sidecar.md)
- [Docs Site Example](./examples/docs-site.md)
- [Recipes](./examples/recipes.md)

## Design Rule

Agent UI is not a hosted Codex service, host runtime, credential provider, or
generic chatbot. The host application starts or connects to Codex App Server
using the user's own authentication, then composes Agent UI components around
that session. See [Product Boundary](./architecture/product-boundary.md) for
the canonical ownership split.

## Validation Owners

[Testing](./architecture/testing.md) owns validation tiers and release gates.
[Toolchain](./architecture/toolchain.md) owns package-output and runtime
compatibility policy.

Use [Package Exports](./reference/package-exports.md) for import boundaries and
[Theming](./guides/theming.md) for the public stylesheet and token contract.
