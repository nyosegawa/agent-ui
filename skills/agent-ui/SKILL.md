---
name: agent-ui
description: Integrate, customize, debug, or upgrade Agent UI v3 in external Codex App Server applications. Use for new adopter, first host app, AgentChat preset, headless + primitives, same-origin bridge skeleton, Node >=22, local media helper uploads, thread lifecycle, canonical resume, host-gated workflows, dynamic tools, theming with --aui-* tokens, Agent UI errors, or when the user says Agent UI導入, 新規導入, 初回導入, 最小構成, Codex UI, ローカルCodexアプリ, bridge, attachments, approvals, resume, local media, or upgrade Agent UI.
---

# Agent UI

Use this skill as the entry point for external Agent UI application work. Agent
UI is a Codex App Server UI component library, not a hosted Codex service or a
generic chatbot kit.

## Start Here

1. Identify the user's job:
   - new local single-user Codex app integration, first host app, or 最小構成
     setup
   - choosing `AgentChat` preset, the `components` prop, or
     `headless + primitives`
   - same-origin bridge skeleton for Node >=22
   - host-owned remote or multi-user integration review
   - thread lifecycle, canonical resume, or history integration
   - server bridge, uploads, or dynamic tools
   - host-owned workflow composition around Agent UI primitives
   - local desktop bridge policy and admission
   - first-message `startThreadWithInput()` options or retry behavior
   - bearer WebSocket subprotocols for short-lived bridge tokens
   - local media preview fallback and static asset route behavior
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
4. For new adopters, start with the local single-user profile unless the host
   is already remote, authenticated, workspace-scoped, or multi-user. Explain
   the selected profile in user language. Do not ask the user whether "React
   only" or "server bridge" is needed; infer that from whether the app must
   actually talk to Codex App Server.
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
- Do not bypass structured bridge admission. Local-loopback and host-callback
  admission should reject before spawning Codex; non-loopback bridges need
  host-owned auth, workspace isolation, and audit policy.
- Do not put bridge bearer tokens in query strings. Browser WebSocket
  constructors cannot send custom headers; use same-origin cookies, server-side
  token exchange, or the Agent UI bearer subprotocol helper for short-lived
  tokens.
- Do not use private Agent UI CSS chunks. Import only
  `@nyosegawa/agent-ui-react/styles.css` and customize with `--aui-*` tokens.
- Do not target internal `.aui-*` selectors from a host app. Use public props
  such as `className`, the `components` map, host wrappers, and `--aui-*` token
  overrides.
- Do not expose local filesystem paths as browser preview URLs. Hosts should
  serve registered local media asset URLs, return `403` or `404` when access is
  denied or expired, and let Agent UI render the fallback card on load failure.
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
- For first-message starts from headless hosts, use
  `useAgentComposerController().startThreadWithInput(input, { threadOptions,
  turnOptions })` so thread options go to `thread/start`, turn options go to
  `turn/start`, and retry preserves the same host-supplied options.
- Treat `commandApproval` and `fileChangeApproval` as the canonical approval
  kinds. Older upstream approval methods are adapter compatibility inputs, not
  host-facing product kinds.
- Use `@nyosegawa/agent-ui-codex/request-builders` for App Server-shaped
  request inputs. Its path fields use host-owned string aliases such as
  `AgentWorkingDirectory`, `AgentResourcePath`, `AgentSkillPath`, and
  `AgentMentionPath`; do not expose generated path schema names in preferred
  host integration code.
- For host-gated workflows, compose `AgentThreadTimeline`, a host-owned gate,
  and a delayed composer. Keep plan/update state in the host and submit only
  after the host gate approves.

## Completion

Before finishing, report:

- selected profile and why
- packages and public imports used
- server bridge, upload, dynamic-tool, auth, and remote assumptions
- first-turn, resume, local-media, and bridge-admission assumptions when those
  surfaces are involved
- validation commands run or why they were skipped
- remaining host-owned production work, especially for remote or multi-user apps
