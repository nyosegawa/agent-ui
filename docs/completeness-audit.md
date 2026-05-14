# Completeness Audit

Audit date: 2026-05-14.

## Scope Boundary

Agent UI core is a Codex App Server UI component library. External host apps can
compose scoped proposal flows, host-owned panels, storage, and sidecars from
generic primitives, but those workflows are not core package APIs.

Confirmed absent from public exports and docs as library APIs:

- `AgentWorkerPane`
- `useAgentWorkerSession`
- `SkillAppRegistry`
- `SkillAppPanel`
- `useSkillAppPanel`
- `SkillDataStore`
- `createSkillAppClientTools`
- `open_skill_app`
- `update_skill_app`
- `request_skill_app_feedback`

## PLAN Capability Coverage

- Full Codex shell: `AgentChat`, `AgentShell`, `AgentProvider`, and
  `examples/codex-local-web`.
- Fixed thread view: `AgentThreadView threadId`, controller hooks, component
  tests, and `examples/scoped-thread-pane`.
- Usage-only panel: `AgentUsagePanel`, component tests, Playwright coverage, and
  `examples/usage-only`.
- Thread/sidebar primitives: `AgentThreadSidebar`, history hooks, stored-thread
  Playwright smoke.
- Host-owned extension slot: `AgentWorkspace panel`, component tests, and
  `examples/host-workflow-recipe`.
- Skills and Apps/connectors: `useAgentSkills`, `AgentSkillsPanel`,
  `useAgentApps`, `AgentAppsPanel`, protocol tests, and `examples/app-connectors`.
- Browser verification: `detectAgentBrowser`, structured skill injection,
  `docs/agent-browser.md`, Playwright, and recorded `agent-browser` evidence in
  `docs/testing.md`.

## Protocol Audit

The generated protocol source of truth is
`/Users/sakasegawa/src/github.com/openai/codex` commit
`6a225e4005209f2325ab3c681c7c6beba2907d4d`, matching
`CODEX_PROTOCOL_COMMIT`.

`packages/codex/test/protocol.test.ts` verifies:

- generated stable methods match `stableAvailableMethods`
- generated experimental-only methods match `experimentalAvailableMethods`
- productized stable methods include account/rate-limit, skills, apps, thread,
  turn, and model surfaces used by the public API
- host-only and experimental methods are not silently treated as productized
- stable notifications that are not yet rendered as specialized UI are retained
  as neutral protocol notifications instead of being downgraded to unsupported
  warnings

## agent-kitchen Audit

Imported from `agent-kitchen/packages/codex`:

- wider session surface for thread/turn actions
- active-thread-independent registry updates
- plan, diff, usage, status banner, and approval state
- block taxonomy for thinking, plan, command execution, file changes, tool calls,
  web search, images, and system info
- richer default Codex UI treatment

Rejected:

- hand-written App Server wire types
- WebSocket-first protocol assumptions
- monolithic chat component boundaries
- host-app-specific workflow APIs

## Validation Evidence

Latest Milestone 10 validation passed:

- `bun run typecheck`
- `bun run lint`
- `bun test`
- `bun run test`
- `bun run build`
- `bun run test:protocol`
- `bun run test:fixtures`
- `bun run publint`
- `bun run attw`
- `bun run check:exports`
- `bun run test:e2e:playwright`
- `bun run test:node-compat`
- `bun run test:e2e:real-codex`
- `bun run test:e2e:real-codex:approval`

Browser evidence is recorded in `docs/testing.md`.

## Independent Review

Read-only review command:

```sh
codex exec --cd /Users/sakasegawa/src/github.com/nyosegawa/agent-ui --sandbox read-only --output-last-message /tmp/agent-ui-m10-independent-review.md "Review this repository for Agent UI vNext completeness. Focus only on missing public component APIs, host integration gaps, protocol drift, stale docs, and demo-only shortcuts. Do not modify files. Return concise findings with file paths and line numbers where possible; say 'No findings' if none."
```

Findings fixed in this audit slice:

- stable but unspecialized App Server notifications are retained in diagnostics
  as raw protocol notifications
- local browser file attachments now require a host resolver before becoming
  Codex `localImage` or upload-style inputs
- `useAgentTurnController()` exposes `steerTurn()` for `turn/steer`
- `useAgentApps(threadId)` stores Apps/connectors lists by scope so fixed
  thread panes do not overwrite each other
