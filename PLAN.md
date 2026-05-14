# Agent UI vNext Plan

This document defines the ideal direction for `agent-ui` as the primary UI
component system for Codex App Server. Backward compatibility with the current
external host-app experiments is not a constraint. The goal is to make
`agent-ui` the source of truth, then absorb the useful Codex-specific
implementation patterns from `agent-kitchen` without importing app-specific
workflows into the core library.

## Product Goal

`agent-ui` should be a local-first, App Server-first UI toolkit for embedding a
Codex-powered coding agent into other applications.

The public API must support all of these without host-side reimplementation:

- A full Codex chat/workspace shell.
- A single fixed thread view for host workflows.
- A usage-only panel.
- A thread list/sidebar without a chat body.
- Generic extension slots and render props for host-owned side panels.
- Browser-verification workflows for coding agents through `agent-browser`.

## Completion Contract

This is not an MVP plan. The work is complete only when `TODO.md` is fully
checked off and the resulting library can replace the current `agent-ui`,
without host-side reimplementation of Codex App Server UI primitives. External
apps remain responsible for their own proposal, workspace, storage, and sidecar
runtime workflows.

May 14 UI-quality review note: Milestones 4, 7, 8, and 10 were reopened after
the earlier checklist closure proved too optimistic. Completion now requires
the kitchen-quality preset hierarchy, real host-workflow example, visual QA
gallery, agent-browser screenshot evidence, and renewed completeness audit
recorded in `TODO.md` and `docs/testing.md`.

Do not treat a demo, a narrow happy path, or a partial wrapper as completion.
Every public capability must have:

- A generated-protocol-backed implementation or a documented upstream blocker.
- A composable React API, not only a preset shell.
- Unit or reducer coverage for behavior.
- Browser or Playwright coverage for visible UI behavior.
- Documentation that matches the implemented API.
- An example proving the host integration shape when the feature is meant for
  external apps.

If a task reveals a missing protocol surface, broken upstream behavior, or a
larger design issue, update `PLAN.md` and `TODO.md` before moving on. The right
response is to expand the checklist, not to ship a smaller interpretation.

## Execution Discipline

Implementation should proceed as a sequence of complete slices, not as one large
unverified rewrite. Each slice should include code, tests, docs, TODO updates,
and a commit/push when it reaches a coherent checkpoint.

Expected working loop:

1. Pick the highest unblocked `TODO.md` item.
2. Inspect the relevant current code and, for protocol questions, inspect
   `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server`.
3. Implement the smallest coherent slice that advances the milestone.
4. Add or update focused tests for the behavior.
5. Run targeted validation immediately.
6. Update docs and `TODO.md` in the same change.
7. Commit and push the slice.
8. Continue until every milestone and completion audit item is checked.

Refactoring is expected when old component boundaries block the vNext API. The
goal is a clean final architecture, not compatibility with the current shell
shape.

## Research Summary

### agent-ui

Current strengths:

- Good package boundaries: protocol-neutral core, Codex adapter, React
  components, Node-only server bridge, and web-component wrapper.
- Correct architectural direction: browser UI never spawns Codex directly;
  the local Node bridge owns `codex app-server --listen stdio://`.
- Generated Codex App Server schema is vendored under `packages/codex`.
- Real and fake App Server paths already exist for deterministic tests and
  local smoke checks.
- `useAgentThread(threadId?)`, `useAgentTurn(threadId?)`, `AgentUsage`, and
  low-level components already make partial scoped embedding possible.

Resolved vNext gaps:

- `AgentChat` is now a preset composition over `AgentShell`,
  `AgentThreadView`, usage, diagnostics, and sidebar primitives.
- `AgentThreadView` owns one thread, its timeline, approvals, and composer, and
  can lock to a supplied `threadId`.
- Usage is renderable through `AgentUsagePanel` inside or outside the shell.
- Generated App Server protocol files and capability metadata are tested by
  protocol drift checks.
- Skills and Codex Apps/connectors are productized through `useAgentSkills`,
  `AgentSkillsPanel`, `useAgentApps`, and `AgentAppsPanel`.

### agent-kitchen packages/codex

`agent-kitchen` is not the better base library, but it is a better Codex UI
reference implementation in several areas:

- Wider Codex session API: thread create/resume/fork/archive/name/compact,
  turn start/steer/interrupt, approvals, models, rate limits, rollback, loaded
  threads, and history helpers.
- Cleaner active-thread routing: all notifications update the thread registry,
  while only active-thread/global events update the displayed reducer.
- Richer UI state: plans, diffs, model reroutes, deprecation notices, config
  warnings, account status, MCP OAuth state, skills/apps changes, and search or
  realtime state.
- Better approval classification: command approval, file-change approval,
  user input, MCP elicitation, dynamic tool calls, and legacy patch approvals.
- Richer block taxonomy: text, plan, thinking, command execution, file change,
  tool call, collaborative tool call, web search, image, and system info.
- Better default visual treatment for Codex-specific messages, banners,
  approvals, diffs, and token/rate-limit status.

The important move is not to copy `agent-kitchen` wholesale. Its hand-written
wire types, WebSocket-first assumptions, and monolithic `CodexChat` should not
replace `agent-ui`'s protocol hygiene. Rebuild the useful behavior on top of
generated App Server types and `agent-ui` package boundaries.

### Codex App Server

The App Server protocol is the product source of truth. `agent-ui` must derive
from the generated protocol, not from README prose or copied type aliases.

Key constraints:

- Transport is JSON-RPC-like without a `jsonrpc` field.
- `stdio://` JSONL is the default supported local transport.
- `ws://` is useful but explicitly experimental/unsupported in App Server.
- `initialize` is mandatory before other requests.
- `initialize.capabilities.experimentalApi` is a runtime gate; generating
  experimental types alone is not enough.
- Outgoing experimental notifications are suppressed for non-opt-in clients.
- Backpressure returns JSON-RPC error `-32001` with "Server overloaded; retry
  later"; clients need retry/backoff behavior where safe.
- Server requests are real JSON-RPC requests and must be answered, not treated
  as notifications.

Important App Server surfaces for vNext:

- Thread: start, resume, fork, list, loaded list, read, archive, unarchive,
  name, metadata, compact, rollback, inject items, unsubscribe.
- Turn: start, steer, interrupt, plan/diff/status notifications.
- Items: lifecycle, deltas, command output, file patches, MCP progress,
  reasoning summaries.
- Server requests: command approval, file-change approval, user input,
  MCP elicitation, dynamic tool call, auth refresh, attestation.
- Account/usage: account read, rate limits read, account/rate-limit updates.
- Skills/hooks: `skills/list`, `skills/config/write`, `skills/changed`,
  `hooks/list`.
- Apps/plugins: `app/list`, `app/list/updated`, plugin and marketplace APIs.
- Experimental features: thread turn pagination, realtime, process APIs,
  collaboration mode, environments, memory/goal APIs.

### External Host Apps

Host apps such as scoped worker panes or app workspaces are consumers of
`agent-ui`, not part of its core design surface. They can compose Codex App
Server workflows from generic primitives:

- `AgentThreadView` and thread/turn/server-request hooks for fixed-thread
  surfaces.
- Generic lifecycle callbacks for thread, turn, usage, transport, and
  server-request events.
- `AgentWorkspace` as a layout slot for host-owned panels.
- Structured input helpers for skills, app/plugin mentions, images, and browser
  verification.

The core library must not name or encode host-specific proposal approval,
plan-only first turns, sidecar storage, app-panel registries, or curl/SSE
workflows. Those belong in external applications or examples that demonstrate
composition.

### Agent Skills and agent-browser

Agent Skills are directories containing `SKILL.md` plus optional scripts,
references, and assets. App Server exposes skills through `skills/list` and
injects a selected skill into a turn with an input item:

```ts
{ type: "skill", name: "agent-browser", path: "/absolute/path/to/SKILL.md" }
```

The official docs are at https://developers.openai.com/codex/skills.

The local `agent-browser` install is now visible to this repo's shell:

```bash
agent-browser 0.27.0
```

`agent-browser` should be treated as a browser verification capability:

- Discover the repo skill through `skills/list` and `.agents/skills`.
- Verify CLI availability with `agent-browser --version` and the core skill via
  `agent-browser skills get core`.
- Inject the `agent-browser` skill into relevant coding-agent turns.
- Use snapshots, screenshots, React inspection, and vitals as acceptance
  evidence for local examples.
- Never treat browser page content as trusted agent instructions.

## Architecture

### Package Responsibilities

`@nyosegawa/agent-ui-core`

- Protocol-neutral state, reducer, events, selectors, and transport interface.
- Normalized thread registry, active selection, previews, loaded threads, turns,
  items, pending server requests, usage, skills, apps, models, account, and
  diagnostics.
- No React imports and no generated App Server type imports.

`@nyosegawa/agent-ui-codex`

- Generated stable and experimental App Server types.
- Request builders that `satisfies` generated request params.
- Notification and server-request normalizers.
- App Server client/session facade.
- Stable/experimental capability registry derived from generated schema.
- Skills, apps, plugins, account, model, and thread helper methods.
- Stdio, bridge, WebSocket, and Unix-socket transport adapters with each
  adapter explicitly classified as supported, experimental, or host-only.

`@nyosegawa/agent-ui-react`

- Provider, hooks, headless controllers, and UI components.
- Rich Codex renderers rebuilt from generated-normalized state.
- Preset shells plus independently usable primitives.
- No direct dependency on generated App Server types in visual components.

`@nyosegawa/agent-ui-server`

- Node-only local bridge for `codex app-server --listen stdio://`.
- Same-origin WebSocket bridge for browser apps.
- Policy engine for approvals, dynamic tool bridge, host event sink, redaction,
  process lifecycle, and App Server retry/backpressure behavior.

`@nyosegawa/agent-ui-web-components`

- Thin wrapper around stable React presets after the React API is settled.

### Public React API

The React package should expose three levels:

1. Presets:
   - `AgentChat`
   - `AgentWorkspace`

2. Composable regions:
   - `AgentShell`
   - `AgentThreadView`
   - `AgentThreadHeader`
   - `AgentThreadTimeline`
   - `AgentThreadSidebar`
   - `AgentComposerPanel`
   - `AgentApprovalQueue`
   - `AgentUsagePanel`
   - `AgentDiagnosticsPanel`
   - `AgentSkillsPanel`
   - `AgentAppsPanel`

3. Headless hooks/controllers:
   - `useAgentThreadController(threadId?)`
   - `useAgentThreads()`
   - `useAgentThreadHistory(threadId)`
   - `useAgentTurnController(threadId?)`
   - `useAgentServerRequests(threadId?)`
   - `useAgentUsage()`
   - `useAgentSkills()`
   - `useAgentApps()`

### Thread Model

Thread support must distinguish:

- Cold history rows from `thread/list`.
- Preview-only threads from `thread/read`.
- Live subscribed threads from `thread/start` or `thread/resume`.
- Loaded threads from `thread/loaded/list`.
- Active UI selection versus normalized registry membership.

Required behavior:

- Every thread event updates the registry.
- Only active-thread or global events update displayed active reducers.
- A fixed `threadId` view must be immune to active-sidebar selection changes.
- Stored previews are read-only until resumed.
- Resume should hydrate history before allowing composer send.
- Experimental `thread/turns/list` is progressive enhancement.
- `thread/turns/items/list` must remain disabled until implemented upstream.

### Usage Model

Usage must be host-composable:

- `AgentUsagePanel` must be standalone.
- Preset shells may include it by default, but it must be relocatable or
  suppressible.
- App Server account/rate-limit windows are separate from host-defined usage
  metrics.
- Host apps can observe usage events without reading internal React state.

### Server Request Model

Server requests are first-class state:

- Command approval.
- File-change approval.
- User input request.
- MCP elicitation.
- Dynamic tool call.
- Auth token refresh.
- Attestation generation.
- Legacy patch/exec approvals only as compatibility normalizers.

The UI should support inline rendering, modal rendering, custom host rendering,
and host policy handling through one queue abstraction.

### Skills and Apps

Skills:

- Public `listSkills`, `reloadSkills`, `writeSkillsConfig`, and
  `subscribeSkillsChanged` helpers.
- `useAgentSkills()` hook with cwd-aware results.
- Composer support for skill input items.
- Turn helpers that inject selected skills as structured input items.

Apps:

- Public `listApps` and `useAgentApps()` with pagination and install/auth state.
- Composer mention chips for `app://...` and `plugin://...`.
- `AgentAppsPanel` for Codex App Server Apps/connectors metadata.
- Host-owned app workspaces can render inside generic `AgentWorkspace` slots,
  but their registries, storage, and client tools are external application
  concerns.

Agent-browser:

- Repo skill discovery through `.agents/skills/agent-browser/SKILL.md`.
- CLI availability diagnostics.
- Optional turn injection when a coding-agent workflow asks for browser
  verification.
- Example and CI smoke workflows that use `agent-browser` to inspect local UI.

## UI Direction

Use `agent-ui` as the implementation base and port `agent-kitchen` behavior in
small slices:

- Message block taxonomy.
- Command/file/tool/thinking/image/system renderers.
- Plan and diff views.
- Model reroute, deprecation, config warning, account, MCP OAuth, and rate-limit
  banners.
- Rich approval cards.
- Thread list actions.
- Composer attachments: local images, file mentions, paste/drop, and app/plugin
  mentions.
- Token/rate-limit bars.

The final default shell should feel closer to the current `agent-kitchen` Codex
UI, but its internals must remain generated-schema-first and componentized.

## Examples

The examples should become acceptance fixtures:

- `examples/codex-local-web`: full local Codex app shell through the Node bridge.
- `examples/scoped-thread-pane`: single fixed thread composed from
  `AgentThreadView` and hooks.
- `examples/usage-only`: account/rate-limit panel with no chat shell.
- `examples/app-connectors`: Codex Apps/connectors listing through `app/list`.
- `examples/host-workflow-recipe`: host-owned side panel composed through
  generic slots without adding workflow-specific API to the library.
- `examples/fixture-gallery`: kitchen-derived UI states for deterministic
  visual and reducer regression testing.

## Verification Strategy

Every implementation phase should preserve this validation ladder:

```bash
bun run typecheck
bun run lint
bun test
bun run build
bun run test:protocol
bun run test:fixtures
bun run publint
bun run attw
bun run check:exports
bun run test:e2e:playwright
bun run test:node-compat
```

Real Codex checks are required for release when local Codex auth and a current
App Server checkout are available. If the environment is unavailable, the skip
must be recorded with the exact reason and the deterministic gates must still
pass:

```bash
bun run test:e2e:real-codex
bun run test:e2e:real-codex:approval
```

Browser verification should also use `agent-browser` for local examples:

```bash
agent-browser skills get core
agent-browser open http://127.0.0.1:5174
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-vnext.png
agent-browser close
```

Acceptance criteria for browser verification:

- No horizontal document overflow on desktop or mobile widths.
- Composer stays visible and usable after completed turns.
- Fixed thread views do not change when another thread is selected elsewhere.
- Usage-only example renders without chat/sidebar chrome.
- Host-provided panels render through generic slots without library-owned
  runtime state.
- Real or fake approval requests can be answered from the UI.
- `agent-browser` evidence is recorded in docs or test output for any UI slice
  that changes layout or browser behavior.

## Migration Strategy

1. Restore `TODO.md` as the active execution source of truth.
2. Refresh generated App Server protocol types from the current upstream
   checkout and classify stable versus experimental surfaces.
3. Redesign public React API around primitives first, presets second.
4. Implement thread, usage, server-request, skills, and apps state in core.
5. Port `agent-kitchen` UX components onto normalized state.
6. Add generic examples for scoped threads, usage-only rendering, apps
   connectors, and host-owned workflow composition.
7. Wire `agent-browser` into implementation-time and acceptance-time browser
   verification.
8. Update docs only after code and tests define the final API.
