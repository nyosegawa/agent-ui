# Agent UI Progress

This file is the current progress ledger. The completed migration milestone log is
archived at
[`docs/archive/2026-vnext-completion-log.md`](./docs/archive/2026-vnext-completion-log.md).

## Current Status

- Core package architecture is implemented.
- React UI is transcript-first and primitive-composable.
- Real local Codex web app and deterministic fixture app exist.
- Next.js integration is split between full-chat WebSocket sidecar and
  one-shot RPC route.
- Docs are being reorganized so active docs describe current behavior and
  historical milestone logs live under `docs/archive/`.

## Completed Major Work

- Generated stable/experimental Codex App Server types and protocol drift tests.
- Core normalized state, reducer, fixtures, selectors, and transport interface.
- Codex stdio/WebSocket transports, request builders, session facade, auth,
  protocol metadata, and normalizers.
- React provider, hooks, transcript renderer, composer, approvals, usage,
  status, skills, apps, thread sidebar, fixed-thread view, and host workspace.
- Server local bridge, same-origin WebSocket bridge, Next/Express one-shot RPC
  helpers, upload helper, redaction, dynamic-tool helper bridge, and
  agent-browser detection.
- Web Components wrapper.
- Fixture gallery, host workflow route, usage-only route, scoped-thread route,
  app connectors route, real Codex local web example, Next RPC example, and
  Next WebSocket sidecar example.
- UI rebuilds covering composer, approval placement, thread history, mobile
  layout, transcript-first rendering, stored-session loss awareness, and docs
  screenshots.

## Open Work

- [x] Redesign the docs information architecture after design research:
      decide which docs are active runbooks, which are API references, and which
      remain archived history.
- [x] Add `docs/server-bridge.md` covering WebSocket bridge lifecycle,
      `createAgentUiLocalUploadHandler()`, dynamic-tool helper risk,
      server-request policy, Next/Express one-shot RPC boundaries, and host
      responsibilities.
- [x] Consolidate remote deployment, security, authentication, API-key, and
      multi-user guidance so there is one authoritative deployment/security
      boundary.
- [x] Rewrite `docs/testing.md` as a current validation matrix and keep dated
      evidence in `docs/archive/testing-history-2026-05.md`.
- [x] Refresh `docs/toolchain.md` from repo-pinned package/workflow versions,
      not only upstream latest versions.
- [x] Fix docs for theming tokens against
      `packages/react/src/styles/tokens.css`.
- [x] Clarify Web Components limitations and supported properties in a focused
      doc or package section.
- [x] Thin example READMEs to purpose, owning package, route/endpoint, manual
      command, and central testing link.
- [x] Align all browser WebSocket recipe imports with
      `@nyosegawa/agent-ui-codex/websocket`.
- [x] Document protocol metadata refresh steps, including
      `CODEX_PROTOCOL_COMMIT`, generated timestamp, and package metadata.

## Remaining Follow-Up

- [ ] If package exports change again, update this ledger and the docs map in
      the same commit.
- [ ] If the design research produces a new visual system direction, update
      `docs/theming.md`, `docs/component-api.md`, fixture screenshots, and the
      visual QA routes together.

## Working Rules

- Keep `README.md` and `docs/README.md` as the entry points.
- Keep `PLAN.md` as the current direction, not historical migration notes.
- Keep this file short and only use unchecked tasks for real remaining work.
- When a task changes public API, package boundaries, examples, validation, or
  security behavior, update the relevant docs in the same change.
