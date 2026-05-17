# agent-browser Verification

Use `agent-browser` as the local agent-driven browser verification gate.
Playwright remains the deterministic CI gate.

## Required Setup

Read the installed core guide before using the CLI:

```bash
agent-browser skills get core
```

Run examples from the repo root unless a package README says otherwise.

## Standard Local Flow

```bash
bun run --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
agent-browser open http://127.0.0.1:5174/fixture-gallery
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-fixture-gallery-desktop.png
agent-browser set viewport 390 900
agent-browser open http://127.0.0.1:5174/usage-only
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-usage-only-mobile.png
agent-browser close
```

For the real local Codex app:

```bash
AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD=/Users/sakasegawa/src/github.com/nyosegawa/agent-ui \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
agent-browser open http://127.0.0.1:5175/
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-codex-local-web.png
agent-browser close
```

## What To Check

- No document-level horizontal overflow.
- Composer remains visible and enabled after completed turns.
- Fixed-thread examples ignore unrelated active-thread selection.
- Usage-only examples render without chat, composer, or sidebar assumptions.
- Host-owned panels render through generic `AgentWorkspace` slots.
- Approval cards are reachable from the accessibility snapshot.

Record the checked URL, commands, and screenshot path in `docs/testing.md` when
layout or browser-visible behavior changes.
