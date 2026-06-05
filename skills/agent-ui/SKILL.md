---
name: agent-ui
description: Integrate, customize, debug, or upgrade Agent UI in external Codex App Server applications. Use when adding Agent UI, building a Codex UI, wiring a same-origin WebSocket bridge, composing React primitives, theming with --aui-* tokens, handling uploads, enabling dynamic tools, fixing Agent UI errors, or when the user says Agent UI導入, Codex UI, ローカルCodexアプリ, bridge, attachments, approvals, or upgrade Agent UI.
---

# Agent UI

Use this skill as the entry point for external Agent UI application work. Agent
UI is a Codex App Server UI component library, not a hosted Codex service or a
generic chatbot kit.

## Start Here

1. Identify the user's job:
   - new local single-user Codex app integration
   - host-owned remote or multi-user integration review
   - server bridge, uploads, or dynamic tools
   - custom layout or theme work
   - debugging or upgrading an existing integration
2. Inspect the host app before changing files. Read package manifests,
   lockfiles, app routes, server entry points, existing WebSocket or upload
   routes, auth/session middleware, current Agent UI imports, and project
   validation commands.
3. Choose the narrow reference file needed for the job:
   - [integration profiles](references/integration-profiles.md)
   - [local single-user integration](references/local-single-user.md)
   - [host-owned remote integration](references/host-owned-remote.md)
   - [server bridge](references/server-bridge.md)
   - [layout composition](references/layout-composition.md)
   - [theming](references/theming.md)
   - [uploads](references/uploads.md)
   - [dynamic tools](references/dynamic-tools.md)
   - [debugging and upgrades](references/debug.md)
   - [validation](references/validation.md)
4. Explain the selected profile in user language. Do not ask the user whether
   "React only" or "server bridge" is needed; infer that from whether the app
   must actually talk to Codex App Server.
5. Implement only after the integration boundary is clear. If a remote or
   multi-user app lacks auth, admission, workspace isolation, or process policy,
   stop and ask for those host decisions before exposing a bridge.
6. Prefer the host app's existing framework and package manager. Match
   `bun.lock`, `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`; do not
   create a second lockfile unless the user explicitly asks to switch package
   managers.
7. Self-review before finishing: search the changed files for private Agent UI
   CSS imports, internal `.aui-*` selectors, raw protocol payload dependencies,
   string-returning local media resolvers, and package-manager drift. Fix
   violations instead of only reporting them.

## Non-Goals

- Do not build UI-only mock previews as the main outcome. External Agent UI
  integrations should connect to Codex App Server unless the user explicitly
  asks for fixtures or visual-only exploration.
- Do not move host runtime ownership into Agent UI. The host owns routing,
  authentication, workspace selection, App Server lifecycle, upload storage,
  dynamic tool execution, and deployment topology.
- Do not expose host-only App Server methods to the browser unless the host
  explicitly defines a policy for them.
- Do not use private Agent UI CSS chunks. Import only
  `@nyosegawa/agent-ui-react/styles.css` and customize with `--aui-*` tokens.
- Do not target internal `.aui-*` selectors from a host app. Use public props
  such as `className`, slots, host wrappers, and `--aui-*` token overrides.
- Do not tell production users that Agent UI supplies hosting, accounts,
  credential storage, multi-user authorization, or process orchestration.

## Default Decisions

- Prefer a local single-user profile for localhost apps, personal tools, and
  development sidecars.
- Treat remote, non-loopback, authenticated, workspace-scoped, or multi-user
  apps as host-owned advanced integrations.
- Start with `AgentChat` when the host wants a full chat surface. Use the React
  primitives when the host needs custom placement of transcript, composer,
  approvals, usage, apps, skills, hooks, diagnostics, or thread history.
- Keep uploads and dynamic tools off unless the user asks for them or the app
  already has host-owned policies for storage and execution.
- For Next.js full chat, use a custom Node server or sidecar that can attach a
  WebSocket bridge. A plain Route Handler is only for one-shot RPC.

## Completion

Before finishing, report:

- selected profile and why
- packages and public imports used
- server bridge, upload, dynamic-tool, auth, and remote assumptions
- validation commands run or why they were skipped
- remaining host-owned production work, especially for remote or multi-user apps
