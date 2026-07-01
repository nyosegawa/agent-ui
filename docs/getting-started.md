# Getting Started

This page is for contributors working in the Agent UI repository checkout. If
you are adding Agent UI to a separate host app, start with
[First Host App](./guides/first-host-app.md) instead.

This repository flow gets a checkout into the normal local development loop:

- install dependencies
- run the deterministic fixture app for UI review
- the real Codex-backed local web app
- verify browser-visible behavior with `agent-browser` when needed

## Prerequisites

- Node.js `>=22`, matching the published package engine range.
- Bun, using the version pinned in the repository `packageManager` field.
- `agent-browser` for local agent-driven browser checks. Install it with the
  commands below if it is not already available.
- A local `codex` CLI with `codex app-server --listen stdio://` if you want to
  run the real Codex-backed app.
- Local ChatGPT/Codex authentication if you want the real app to load account,
  model, thread, and turn state.

Install dependencies:

```sh
bun install
```

## Install agent-browser

Agent UI uses [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)
for local exploratory browser review, accessibility-tree inspection,
screenshots, and interaction checks. Playwright remains the deterministic CI
browser gate.

Install `agent-browser` globally, install its browser runtime, then read the
installed version's core guide:

```sh
npm i -g agent-browser
agent-browser install
agent-browser skills get core
```

Confirm the CLI is on your `PATH`:

```sh
agent-browser --version
```

If you plan to run Playwright e2e locally on a fresh machine, install the
browser runtime once:

```sh
bunx playwright install --with-deps chromium
```

Run the fast local validation gate:

```sh
bun run validate:fast
```

## Fixture App

Use the deterministic fixture app first. It does not require Codex
authentication and is the fastest way to review Agent UI surfaces.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Useful routes:

- `/showcase`: public component catalog with live examples and copyable React snippets
- `/showcase/components`: snippet-facing public API catalog
- `/showcase/patterns`: workflow-oriented host pattern catalog
- `/showcase/default-conversation`: default transcript-first surface
- `/showcase/rich-transcript`: intentionally dense transcript and approval stress fixture
- `/showcase/composed-shell`: neutral composed shell for sidebar history, status,
  and thread view inside host-owned layout
- `/showcase/host-workflow-recipe`: advanced host integration reference shell with embedded
  `AgentChat`, side panel, mobile drawer, local attachment metadata, transcript
  local-media preview/fallback metadata, scoped thread history loading,
  host-owned workflow gate, first-message optimistic mode, and host-owned review
  sheet
- `/showcase/composer-primitives`: normal composer primitive placement without retry-only state
- `/showcase/transcript-content`: transcript and content primitive rendering without transcript display overrides
- `/showcase/approvals-status`: review rail for status summaries, detailed
  notices, and pending approvals
- `/showcase/thread-navigation`: host-owned thread selection composed from `ThreadList`
  and `AgentThreadView`
- `/showcase/usage-only`: usage primitives without chat chrome
- `/showcase/app-connectors`: Codex Apps/connectors metadata

The fixture app uses `FakeAgentTransport`; it is for deterministic browser
review and component QA, not real Codex behavior.

Keep the fixture app running, then use another terminal to inspect it with
`agent-browser`:

```sh
agent-browser open http://127.0.0.1:5174/showcase/rich-transcript
agent-browser snapshot -i
agent-browser close
```

For the full local browser-check flow, see
[Browser Verification](./guides/browser-verification.md).

## Real Local Codex Web App

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Open the printed local URL. By default the app uses
`http://127.0.0.1:5175`.

The path is:

```text
browser UI -> same-origin WebSocket bridge -> codex app-server --listen stdio://
```

The server owns the Codex App Server child process and attachment upload
endpoint. The browser owns only the Agent UI surface.

## Validation

Use these tiers while developing:

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run validate:e2e
```

For the full validation matrix and release gate, see
[Testing](./architecture/testing.md). Playwright remains the deterministic CI
browser gate; `agent-browser` is the local agent-driven browser review tool.
