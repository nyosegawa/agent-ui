# Agent UI

Embeddable UI for Codex-powered coding agents.

Active planning and quality gates live in [`PLAN.md`](./PLAN.md) and
[`TODO.md`](./TODO.md). Those files are the source of truth for Agent UI vNext,
including the reopened UI-quality review for Milestones 4, 7, 8, and 10.

Agent UI provides React components, headless hooks, state management, and transport adapters for applications built on OpenAI Codex App Server. `AgentChat` is a convenience preset; the core value is the primitive set that lets host apps place thread, status, usage, approvals, composer, apps, skills, and diagnostics surfaces in their own product shell.

The visual design system is intentionally typography-led, not card-heavy. User
messages render as right-aligned chat bubbles, assistant output flows as
markdown without a bubble, reasoning is a muted blockquote, plan blocks use a
primary-tinted callout, and command/diff blocks share a dark code surface inline
with the transcript.

The composer is the primary input surface: an auto-resizing textarea, removable
attachment chips, and an inline toolbar that carries attach/image pickers,
optional App/Plugin mention buttons, compact **mode** and **model · effort**
menus, and a primary Send button. There is no separate "Run settings" panel.
Working directory is chosen at thread start and shown read-only afterward.
Image and file attachments work through paste, drag-and-drop, and the file
pickers when the host wires `resolveLocalAttachment`.

`AgentApprovalQueue` is a compact pending-decision surface rendered as the
final item of the transcript scroll area — one expanded card plus compact
picker rows. It is a transcript item, not a pane wedged between the transcript
and the composer, and it has no scroll pane of its own. The transcript scrolls
so the decision footer stays reachable on desktop and mobile. On mobile, chat
and composer are the primary surface and thread history is an off-canvas drawer
opened from a `Threads` trigger.

`AgentChat` defaults to the transcript plus optional sidebar; usage and
diagnostics are opt-in secondary chrome for host composition. The same
primitives are exported individually so host apps can rebuild this layout, add
their own usage/status rail, or use any other shell without the preset. The
`/host-workflow-recipe` example is the canonical proof of that composition;
`/fixture-gallery` is the visual QA surface for every state. Saved evidence
lives under `docs/screenshots/`.

## Status

The real local app path is the primary release target: browser UI -> same-origin host bridge -> `codex app-server --listen stdio://` -> real Codex account, usage, model, thread, turn, approval, and diff events.

The core library is a Codex App Server UI component system. External host
applications compose their own workflows from generic primitives; app-specific
proposal flows, panel runtimes, storage, and sidecars do not live in the core
packages.

## Public API Shape

Primary React surfaces:

- `AgentProvider`
- `AgentShell`
- `AgentChat`
- `AgentWorkspace`
- `AgentThreadSurface`
- `AgentThreadView`
- `AgentThreadHeader`
- `AgentThreadTimeline`
- `AgentTranscript`
- `AgentTurn`
- `AgentMessageItem`
- `AgentReasoningItem`
- `AgentToolCallItem`
- `AgentCommandItem`
- `AgentCommandOutputItem`
- `AgentFileChangeItem`
- `AgentDiffItem`
- `AgentThreadSidebar`
- `AgentComposerPanel`
- `AgentRunSettingsPanel`
- `AgentApprovalQueue`
- `AgentStatusSummary`
- `AgentStatusDetails`
- `AgentCriticalNoticeList`
- `AgentUsagePanel`
- `AgentUsageSummary`
- `AgentTokenUsageBar`
- `AgentDiagnosticsPanel`
- `AgentSkillsPanel`
- `AgentAppsPanel`

Headless hooks include `useAgentThreadController`,
`useAgentTurnController`, `useAgentServerRequests`, `useAgentUsage`,
`useAgentSkills`, and `useAgentApps`.

## Local Release Scope

```text
local-only
single-user
stdio Codex App Server
ChatGPT managed auth
device-code login UI
React components and hooks
stable App Server API only
```

## Packages

```text
@nyosegawa/agent-ui-core
@nyosegawa/agent-ui-codex
@nyosegawa/agent-ui-react
@nyosegawa/agent-ui-server
@nyosegawa/agent-ui-web-components
```

## Docs

Start with [docs/README.md](./docs/README.md).

Generic examples:

- [examples/codex-local-web](./examples/codex-local-web/README.md): real local Codex web app.
- [examples/scoped-thread-pane](./examples/scoped-thread-pane/README.md): fixed-thread composition.
- [examples/usage-only](./examples/usage-only/README.md): standalone usage panel.
- [examples/app-connectors](./examples/app-connectors/README.md): Codex Apps/connectors.
- [examples/host-workflow-recipe](./examples/host-workflow-recipe/README.md): host-owned side panel slot.
- [examples/fixture-gallery](./examples/fixture-gallery/README.md): deterministic browser QA states.

## Quickstart

Run the real local Codex web app:

```sh
bun install
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Then open the printed `http://127.0.0.1:5174` URL. The app starts a local Codex App Server through `@nyosegawa/agent-ui-server`.

For the real local layout gate used during release work, start the app on the
canonical audit port and run the browser audit against the already-running
server. `bun run test:e2e:real-local-web-layout` only audits the running page;
it does not start `examples/codex-local-web`.

```sh
AGENT_UI_PORT=5175 \
AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev

bun run test:e2e:real-local-web-layout
```

Run the fixture-backed package smoke demo separately:

```sh
bun run --cwd examples/local-react-vite dev
```

Then open `/`, `/?state=kitchen`, `/host-workflow-recipe`, and
`/fixture-gallery` for deterministic visual QA states. The host-workflow route
is built from primitives rather than the `AgentChat` preset, and the gallery
loads desktop/mobile previews with reload controls for browser QA.
The fixture route metadata lives under `examples/local-react-vite/src/fixtures`
so visual QA fixtures stay separate from the real Codex-backed
`examples/codex-local-web` app.
`examples/docs-site` is documentation-oriented and is not the primary fixture
QA surface.

The Next.js example is a one-shot RPC Route Handler only. Use the local web app's WebSocket bridge for streaming chat, approvals, and live diagnostics.
