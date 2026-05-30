# Agent UI Documentation Audit

This audit summarizes the 12-round documentation review captured under `tmp/`.
It focuses on correcting unsafe claims, assigning canonical documentation owners,
and preparing a practical rewrite plan for the docs baseline.

## Executive Findings

- [P0] Public safety claims must be corrected before broad rewrites. The most
  important issues are the `codex-local-web` admission claim and normal
  `serverRequestPolicy.permissions` wording. The example does not configure
  bridge admission, and normal permission callbacks are trusted host policy
  today rather than requested-subset bounded by implementation.
- [P0] Public Markdown must have an automated no-em-dash guard. Current public
  docs already violate the requested style in `docs/reference/react-components.md`
  and `docs/architecture/overview.md`.
- [P1] The docs need canonical owners before final entry-page polish. Product
  boundary, protocol semantics, server bridge security, validation ownership,
  package exports, and theming should be stable before README-style pages become
  final.
- [P1] Agent UI must be described consistently as an embeddable Codex App Server
  UI component library. Host applications own auth, sessions, routing,
  persistence, workspace and tenant isolation, sidecar lifecycle, audit logging,
  resource limits, product workflows, and deployment topology.
- [P1] Security docs need precise integration shapes. Productized browser chat is
  browser Agent UI to a same-origin host WebSocket bridge to local
  `codex app-server --listen stdio://`. Same-origin routing and Origin checks are
  not authentication. Direct upstream App Server WebSocket remains experimental
  and unsupported for the productized browser path.
- [P1] Public API examples need immediate correction where they are invalid or
  misleading. `AgentWorkspace` is a preset around `AgentChat` with an optional
  `panel`, not a children wrapper. Standalone `AgentDiagnosticsPanel` requires
  `bootstrap`.
- [P1] No public docs file should be deleted outright in the first cleanup. Most
  problems are section moves, targeted rewrites, and consolidation.

## P0 Findings

### `codex-local-web` Admission Overclaim

`docs/examples/codex-local-web.md` says the example exercises admission before
process spawn. The source calls `attachAgentUiWebSocketBridge()` without an
`admission` option. The example has loopback bind protection, default browser
method filtering, inbound limits, idle timeout, backpressure handling, upload and
directory-picker routes, and dynamic tools disabled by default. It does not have
per-connection admission.

Required correction: describe the example as loopback-first and unauthenticated
unless a host adds explicit admission or auth.

### Permission Bounding Overclaim

Normal `serverRequestPolicy.permissions` is documented too strongly. The server
policy path drops nullish permission families and forwards callback-provided
grants. It does not clamp normal grants to the requested permission subset.

Required correction: describe the normal callback as trusted host policy, or
change the implementation and tests before keeping bounded-language claims.

Dynamic helper permission docs also need care. Current helper bounding is not
schema-wide for generated stable filesystem permission shapes such as `read`,
`write`, `entries`, and `globScanMaxDepth`.

### Public Markdown Typography

Public docs contain em dash characters despite the requested style. Add a small
public Markdown lint and remove current hits before large rewrites continue.
Exclude `tmp/**/*.md` because audit reports can quote rejected text.

## P1 Findings

### Product Boundary

`docs/architecture/product-boundary.md` should become the canonical source for:

- what Agent UI owns
- what host applications own
- the local-first default
- bridge helper scope
- protocol productization policy
- `app/list` as Codex Apps/connectors metadata

Current docs repeat boundary wording in many places. Some wording can make core
state or examples sound broader than intended.

### Entry Docs

`README.md`, `docs/README.md`, and `docs/getting-started.md` mix first-reader
orientation with validation ladders, release gates, package internals, and
maintainer detail. They need early triage now, then final polish after canonical
owners settle.

Immediate fixes:

- Fix approval index wording so user input is not treated as a normal approval.
- Add Web Components to docs navigation and install paths.
- Link to validation owners instead of repeating stale command ladders.
- Prefer deterministic fixture exploration before requiring real Codex setup.

### Server Bridge And Security

`docs/reference/server-bridge.md` should own exact API behavior and defaults:

- same-origin WebSocket bridge shape
- admission boundary
- browser method policy
- WebSocket limits and close codes
- reconnect limitations
- server request policy
- dynamic tool execution
- uploads
- one-shot RPC
- redaction
- direct handler caveats

Security, auth, remote deployment, Next, and example docs should summarize risk
and link back instead of duplicating risky details.

### One-Shot RPC

One-shot RPC docs need stronger security framing. The helpers are not chat, have
no built-in admission or authentication, start one App Server process per allowed
request, reject denied methods before spawn, and accept `{ method, params? }`.

The default allowlist is:

- `account/read`
- `account/rateLimits/read`
- `model/list`
- `thread/list`
- `thread/loaded/list`
- `thread/read`
- `skills/list`
- `hooks/list`
- `app/list`

The runnable Next RPC example narrows this to `account/read` and `model/list`.
`allowedMethods: "all"` removes the method policy and must be documented as an
authenticated host-admin escape hatch.

### Protocol Reference

`docs/reference/codex-protocol.md` should not read like a release diary. Keep
protocol semantics, method classification, server requests, user input variants,
running-turn semantics, Apps/connectors metadata, and direct WebSocket warnings.

Move or relabel:

- schema refresh mechanics
- generated metadata workflow
- current commit values
- local smoke evidence
- `Deferred:` backlog wording

Do not delete `Local Smoke` or `Deferred:` facts until a replacement owner
preserves their useful boundary and validation content.

### React API And UX Docs

High-confidence React docs issues:

- `docs/guides/react.md` shows invalid `AgentWorkspace` children usage.
- `AgentWorkspace` should not be described as a generic slots surface.
- Standalone `AgentDiagnosticsPanel` docs must show the required `bootstrap`
  prop.
- `renderApproval` replaces the default card and actions. Custom renderers must
  wire decisions through `useAgentApprovals()` or a host-owned response path.
- One stale approval placement sentence says approvals are embedded at the end
  of the transcript. Source-metadata approvals render after the matching source
  item or turn. Metadata-free or missing-source approvals fall back to the tail.

`docs/reference/react-components.md` is overloaded. It should remain the API and
behavior reference, but visual QA, screenshot policy, token details, attachment
depth, and route evidence should move to owner pages.

### Theming

`docs/guides/theming.md` manually duplicates token values from
`packages/react/src/styles/tokens.css` and is already stale. The guide should
teach token groups, theme scope, override examples, private selector warnings,
and `tokens.css` as the source of truth. If exact values stay in docs, generate
or test them.

### Validation Ownership

`docs/architecture/testing.md` should own validation tiers. Some docs still have
stale `validate:packages` wording that omits `test:packlist` and
`test:node-compat`. Entry docs and example READMEs should link to the validation
owner instead of repeating the ladder.

## P2 Findings

- `thread/read` should not be documented as replaying token usage notifications.
  Replay belongs to resume, fork, and attaching to already loaded threads where
  upstream supports it.
- Device-code login docs should branch on `account/login/completed.success`.
  `account/updated` follows successful account changes, not every completion.
- Dynamic tool registration is not productized through the stable facade in this
  checkout. Stable `thread/start` and React `ThreadStartOptions` do not expose
  `dynamicTools`; generated experimental `thread/start` does.
- Dynamic tool calls are normalized but handled out of band by the bridge or host
  integration. They are not retained in the default core server request queue.
- Upload docs should state that missing `content-type` is accepted. Present
  content types must be `application/octet-stream`, `image/*`, or `text/plain`
  with optional parameters.
- Upload docs need exact defaults: local temp root by default, 16 MB default
  limit, one hour default TTL, session-directory cleanup, and no automatic
  redaction of local attachment paths.
- Next sidecar docs understate behavior. The example uses a custom Node HTTP
  server, defaults to `http://127.0.0.1:5174`, exposes `/agent-ui/ws` and
  `POST /agent-ui/upload`, has no admission hook, maps images to
  `localImageInput(path)`, maps non-images to explicit text, and cleans uploads
  on server close plus `SIGINT` and `SIGTERM`.
- Browser QA docs should avoid public `.aui-*` selectors and broad DOM probes.
  Public guidance should prefer roles, labels, text, accessibility snapshots,
  keyboard behavior, real clicks, focus return, mobile checks, and overflow
  checks.
- Web Components docs should list `transport`, `initialState`, `slots`, and
  `agentOptions`, including `agentOptions.className` and `chat-class`. `chat-class`
  should not be presented as a broad reactive observed attribute API.
- `@nyosegawa/agent-ui-codex/stable-types` is a public type-only subpath. Runtime
  export policy should add a type-only exemption or resolver smoke rather than
  expecting runtime named exports.
- `docs/examples/local-react-vite.md` should remain the public route inventory.
  Screenshot docs should say their route set is a retained capture subset.
- `examples/local-react-vite/README.md` is absent while other runnable examples
  have local run cards.
- Recipe docs list typed files without `src/`. They should reference
  `examples/recipes/src/*` paths and document the recipe package typecheck/build
  command if recipes stay typed examples.

## P3 Findings

- Keep `/host-workflow-recipe` as a route path if needed, but visible labels and
  prose should move toward host composition wording.
- `docs-site` should remain clearly documented as an executable package overview
  and compile/style smoke surface, not the Markdown docs source and not a host
  runtime.
- Use "headless React hooks" for `useAgent*` APIs, "Codex hook metadata" for
  `hooks/list` and `useAgentHooks()`, and "Codex lifecycle hooks" only for
  upstream lifecycle behavior.
- Lowercase `app-server` should stay in commands and paths. In prose, use
  "Codex App Server" or "App Server".
- `mock/experimentalMethod` is accurate but product-noisy. Only mention it if
  explicitly documenting generated test fixtures.

## Confirmed Non-Issues And Cautions

- No public docs file should be deleted outright in the first cleanup.
- The audited generated Codex metadata matched upstream commit
  `577ec03bf82fb52e7041fb6b684e694b1e53451a`.
- Preserve the running-turn truth: there is no App Server `queue/message`;
  follow-ups are UI-local; `Send now` and Cmd/Ctrl+Enter use `turn/steer` with
  `expectedTurnId`; Stop uses `turn/interrupt`.
- Preserve stable input truth: `UserInput` variants are `text`, `image`,
  `localImage`, `skill`, and `mention`; there is no generic local-file input.
- Preserve Apps/connectors truth: `AppInfo` has metadata such as `isAccessible`,
  `isEnabled`, `installUrl`, labels, branding, and plugin display names. It has
  no `installed` or `needsAuth` field.
- Preserve direct WebSocket truth: upstream has WebSocket support, but marks it
  experimental and unsupported for the productized Agent UI browser path.
- Keep deployment recipes concrete. The remote guide can summarize and link, but
  multi-user and API-key remote recipe files contain important operational
  checklists.
- Do not replace the theming guide with only "see tokens.css". Host users still
  need token groups, theme scope usage, private selector warnings, and override
  examples.

## Evidence Source

This audit was synthesized from the temporary round 11 and round 12 audit
reports generated during the documentation review. Those temporary reports were
not kept as durable repository documentation; the durable follow-up owners are
this audit, `DOCS_REWRITE_PLAN.md`, and `DOCS_TODO.md`.
