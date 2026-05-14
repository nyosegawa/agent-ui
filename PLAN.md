# Agent UI vNext Plan

This document defines the ideal direction for `agent-ui` as the primary UI
component system for Codex App Server. Backward compatibility with the current
Watcher and `skill-with-app` experiments is not a constraint. The goal is to
make `agent-ui` the source of truth, then absorb the useful Codex-specific
implementation patterns from `agent-kitchen`.

## Product Goal

`agent-ui` should be a local-first, App Server-first UI toolkit for embedding a
Codex-powered coding agent into other applications.

The public API must support all of these without host-side reimplementation:

- A full Codex chat/workspace shell.
- A single fixed thread view for host workflows such as Watcher worker panes.
- A usage-only panel.
- A thread list/sidebar without a chat body.
- Skill/app side panels driven by agent actions.
- Browser-verification workflows for coding agents through `agent-browser`.

## Completion Contract

This is not an MVP plan. The work is complete only when `TODO.md` is fully
checked off and the resulting library can replace the current `agent-ui`,
Watcher worker pane, and `skill-with-app` prototype responsibilities without
host-side workaround code.

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

Current gaps:

- `AgentChat` is still a monolithic preset. Usage, sidebar, diagnostics, header,
  thread body, approvals, and composer are fixed together.
- There is no first-class `AgentThreadView` that owns only one thread and its
  approvals/composer.
- Usage can be displayed standalone, but the default shell hardcodes usage and
  can cause duplicated panels.
- Protocol drift exists: the vendored App Server schema lags the local upstream
  App Server checkout, and productized method lists are partly hand-maintained.
- Skill and app APIs are present in generated protocol types but not productized
  as public hooks/components.

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

### Watcher

Watcher proves that host apps need a scoped worker pane, not just a full chat.

Current integration uses `AgentProvider`, `useAgentThread`, `useAgentTurn`,
`AgentMessageList`, `AgentApprovalPrompt`, and `AgentComposer` directly. This
works, but it leaks too much library internals into the host:

- Thread id extraction and localStorage session mapping.
- Plan-only first turn and approved continuation orchestration.
- Pending server request payload classification.
- Worker usage/lifecycle events not flowing back into Watcher state.
- Hardcoded bridge URL and cwd.
- Browser/computer verification expressed only as prompt convention.

Ideal direction: `agent-ui` should expose `AgentWorkerPane` and
`useAgentWorkerSession` so Watcher passes proposal/context/attachments and
receives lifecycle, usage, and server-request events.

### skill-with-app

`skill-with-app` proves that agent UI often needs a right-side app panel.

Current integration uses `@agent-kitchen/codex` for chat and a separate
`:5191` HTTP/SSE server for app panel updates. Agents drive the panel by
running `curl` commands. That is useful as a prototype but should not be the
ideal architecture.

Ideal direction: `agent-ui` should own a first-class skill/app workspace:

- `AgentWorkspace` for chat plus app panel layout.
- `SkillAppRegistry` from static manifests, Vite globs, or remote manifests.
- `SkillAppPanel` and `useSkillAppPanel`.
- Client-side tools such as `open_skill_app`, `update_skill_app`, and
  `request_skill_app_feedback`.
- `SkillDataStore` for JSON/blob data with path guards and change watching.
- App-to-agent feedback as thread input or structured tool response, not
  polling a side file.

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
- Skill data store for local skill/app examples.

`@nyosegawa/agent-ui-web-components`

- Thin wrapper around stable React presets after the React API is settled.

### Public React API

The React package should expose three levels:

1. Presets:
   - `AgentChat`
   - `AgentWorkspace`
   - `AgentWorkerPane`

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
   - `SkillAppPanel`

3. Headless hooks/controllers:
   - `useAgentThreadController(threadId?)`
   - `useAgentThreads()`
   - `useAgentThreadHistory(threadId)`
   - `useAgentTurnController(threadId?)`
   - `useAgentServerRequests(threadId?)`
   - `useAgentUsage()`
   - `useAgentSkills()`
   - `useAgentApps()`
   - `useAgentWorkerSession(sessionKey)`
   - `useSkillAppPanel()`

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
- Host apps can provide extra usage sources, for example Watcher monitor cost,
  worker execution cost, and weekly budget projection.

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
- `AgentWorkspace.SkillDirectory` for manual app/skill browsing.
- Client tool bridge for skill app panels, with reserved namespace validation.

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
- `examples/scoped-thread-pane`: Watcher-style single thread worker pane.
- `examples/usage-only`: account/rate-limit panel with no chat shell.
- `examples/skill-app-workspace`: skill/app right-panel workflow replacing
  `skill-with-app`.
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
- Skill/app panel can open, update, receive feedback, and close.
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
6. Add Watcher and `skill-with-app` replacement examples.
7. Wire `agent-browser` into implementation-time and acceptance-time browser
   verification.
8. Update docs only after code and tests define the final API.
