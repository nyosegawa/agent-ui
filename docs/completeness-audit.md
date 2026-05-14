# Completeness Audit

Audit date: 2026-05-14. Reopened UI-quality review completed after the earlier
Milestone 4/7/8/10 closure was found too optimistic.

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
  `examples/codex-local-web`. The preset now keeps thread/timeline/work trace
  in the primary column and moves status, usage, and diagnostics to compact
  secondary chrome.
- Fixed thread view: `AgentThreadView threadId`, controller hooks, component
  tests, and `examples/scoped-thread-pane`.
- Usage-only panel: `AgentUsagePanel`, component tests, Playwright coverage, and
  `examples/usage-only`.
- Thread/sidebar primitives: `AgentThreadSidebar`, history hooks, stored-thread
  Playwright smoke.
- Host-owned extension slot: `AgentWorkspace panel`, component tests, and
  `examples/host-workflow-recipe`, which now renders a concrete workflow panel
  with thread summary, workflow status, pending requests, plan/context files,
  usage, and host actions.
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
- compact treatment of background account/model/MCP/rate-limit status so the
  timeline remains the primary surface
- host panel composition as application-owned UI rather than core workflow
  runtime

Rejected:

- hand-written App Server wire types
- WebSocket-first protocol assumptions
- monolithic chat component boundaries
- host-app-specific workflow APIs

Still deferred after the reopened quality pass:

- a grouped `TimelineMessage` selector that renders assistant text and ordered
  work blocks as one cohesive message model
- protocol-shaped approval decision metadata and MCP/user-input forms beyond
  the current normalized summaries
- fuzzy-file-search state and renderer support

## Validation Evidence

Latest reopened UI-quality validation passed:

- `bun run typecheck`
- `bunx vitest run packages/react/test/components.vitest.tsx`
- `bun run --cwd examples/local-react-vite build`
- `bun run test:e2e:playwright`
- `agent-browser` desktop/mobile screenshots for `/`, `/?state=kitchen`,
  `/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`,
  `/app-connectors`, and `/fixture-gallery`

Historical full release validation, including protocol, package, Node
compatibility, and real Codex smoke, remains recorded in `docs/testing.md`.
Browser visual-quality evidence for the reopened gate is recorded there as
well.

## Protocol And Boundary Re-Audit

The reopened audit regenerated the current local App Server stable protocol and
diffed the Apps/connectors surface. `AppsListParams`, `AppsListResponse`,
`AppInfo`, `AppMetadata`, `AppListUpdatedNotification`, `AppBranding`,
`AppReview`, `AppScreenshot`, `AppToolsConfig`, and `AppsDefaultConfig` match
the vendored generated files for the checked surface.

Important caveat: the generated upstream Apps types still carry experimental
wording, so docs should keep describing `app/list` as Codex Apps/connectors
metadata support rather than a mature external app runtime contract.

Public export and docs searches found no core library API for Watcher-specific
or skill-with-app-specific runtime concepts such as `AgentWorkerPane`,
`SkillAppRegistry`, `SkillAppPanel`, `SkillDataStore`,
`createSkillAppClientTools`, `open_skill_app`, `update_skill_app`, or
`request_skill_app_feedback`.

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
