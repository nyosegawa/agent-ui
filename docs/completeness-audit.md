# Completeness Audit

Audit date: 2026-05-15. Reopened again on 2026-05-15 to finish the
transcript-first contract. The default chat now treats the Codex App Server
transcript as the product: usage and diagnostics are opt-in host-composition
primitives, large hydrated histories render incrementally, heavy transcript
bodies are lazy-mounted, and the real `examples/codex-local-web` app has a
port-5175 layout audit gate. Evidence is recorded in `docs/testing.md`.

## Scope Boundary

Agent UI core is a Codex App Server UI component library. External host apps can
compose scoped proposal flows, host-owned panels, storage, and sidecars from
generic primitives, but those workflows are not core package APIs.

Confirmed absent from public exports, docs, and examples as library APIs: the
reviewed worker-pane and app-panel runtime keyword set requested for the
boundary audit. The core library documents only generic primitives, hooks,
slots, Codex Apps/connectors metadata, and host-owned composition boundaries.

## PLAN Capability Coverage

- Full Codex shell: `AgentChat`, `AgentShell`, `AgentProvider`, and
  `examples/codex-local-web`. The preset now defaults to transcript-first
  chrome with optional sidebar; usage, diagnostics, and status details are
  standalone primitives or opt-in secondary chrome.
- Primitive-first thread/status/usage composition: `AgentThreadSurface`,
  `AgentThreadHeader`, `AgentThreadTimeline`, `AgentApprovalQueue`,
  `AgentComposerPanel`, `AgentStatusSummary`, `AgentStatusDetails`,
  `AgentCriticalNoticeList`, `AgentUsageSummary`, `AgentUsagePanel`, and
  `AgentTokenUsageBar`.
- Fixed thread view: `AgentThreadView threadId`, controller hooks, component
  tests, and `examples/scoped-thread-pane`.
- Usage-only panel: `AgentUsagePanel`, component tests, Playwright coverage, and
  `examples/usage-only`.
- Thread/sidebar primitives: `AgentThreadSidebar`, history hooks, stored-thread
  Playwright smoke.
- Host-owned composition: component tests plus `examples/host-workflow-recipe`,
  which now builds the thread column from primitives and places host context,
  pending requests, validation status, changed files, usage, and status details
  in host-owned chrome.
- Skills and Apps/connectors: `useAgentSkills`, `AgentSkillsPanel`,
  `useAgentApps`, `AgentAppsPanel`, protocol tests, and `examples/app-connectors`.
- Browser verification: `detectAgentBrowser`, structured skill injection,
  `docs/agent-browser.md`, Playwright, and recorded `agent-browser` evidence in
  `docs/testing.md`.
- Large history rendering: `AgentMessageList` reveals hydrated transcript
  history in batches and lazy-mounts command output, long markdown, JSON/tool
  bodies, and CodeMirror diffs.

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
- severity-normalized rate-limit status, where normal/below-threshold messages
  remain background notices instead of critical thread warnings
- host panel composition as application-owned UI rather than core workflow
  runtime

Rejected:

- hand-written App Server wire types
- WebSocket-first protocol assumptions
- monolithic chat component boundaries
- host-app-specific workflow APIs

Still deferred after the reopened quality pass:

- protocol-shaped approval decision metadata and MCP/user-input forms beyond
  the current normalized summaries
- fuzzy-file-search state and renderer support

## Validation Evidence

Latest primitive-first UI validation passed:

- `bun run typecheck`
- `bunx vitest run packages/react/test/components.vitest.tsx`
- `bunx vitest run packages/react/test/style-duplication.vitest.ts`
- `bun run --cwd examples/local-react-vite build`
- `bun run test:e2e:playwright`
- `bun run test:e2e:real-local-web-layout`
- Playwright screenshot-buffer smoke for kitchen desktop and host workflow
  mobile routes

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

Public export, docs, and example searches found no core library API for the
requested host-specific worker-pane or app-panel runtime keyword set.

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

## 2026-05-15 Primitive craftsmanship audit (later pass)

A follow-up external review after the visual-quality rebuild diagnosed the
remaining problem as *primitive craftsmanship*, not layout: the composer
read as a row of form controls rather than as the product's centerpiece,
button hierarchy was unclear, `App / Plugin` chips looked careless, the
approval card lacked decision affordance, and the message timeline relied on
labels rather than typography.

This pass rebuilt the interactive layer in place rather than re-arranging
the screen. The relevant rebuilds (composer, button system, inputs / selects
/ segmented, approval card, timeline, sidebar, status / usage chips,
command/diff surface, component close-up gallery, and the duplicate-status
guard for the host workflow recipe) are captured in the new checklist items
under Milestone 4 in `TODO.md` and in the 2026-05-15 "Primitive
craftsmanship rebuild" entry in `docs/testing.md`.

Verification: 67 vitest tests + 60 bun tests + 19 Playwright tests pass
locally; all 14 `docs/screenshots/agent-ui-*-{desktop,mobile}.png` files
were regenerated against the new primitives; Claude-in-Chrome browser
verification at `http://127.0.0.1:5184` confirmed `/`, `/?state=kitchen`,
`/host-workflow-recipe`, `/usage-only`, and `/fixture-gallery` at desktop
1280×900 and mobile 390×900 without horizontal overflow and with the
composer staying primary.

Boundary re-audit: a fresh grep across `packages/`, `docs/`, and `examples/`
for `AgentWorkerPane`, `useAgentWorkerSession`, `SkillAppRegistry`,
`SkillAppPanel`, `useSkillAppPanel`, `SkillDataStore`,
`createSkillAppClientTools`, `open_skill_app`, `update_skill_app`, and
`request_skill_app_feedback` returned zero hits.
