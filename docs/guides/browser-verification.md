# Browser Verification

Use [`agent-browser`](https://github.com/vercel-labs/agent-browser) as the
local agent-driven browser verification gate. It is the tool for exploratory UI
review, accessibility-tree inspection, screenshots, and interaction checks.
Playwright remains the deterministic CI gate.

## Install agent-browser

Install `agent-browser` globally from npm:

```bash
npm i -g agent-browser
```

Install the browser runtime that the CLI controls:

```bash
agent-browser install
```

Confirm the CLI is available:

```bash
agent-browser --version
```

Read the workflow guide served by the installed CLI before relying on command
details:

```bash
agent-browser skills get core
```

The CLI-served guide matches the installed version, so prefer it over copied
command references when troubleshooting.

Run examples from the repo root unless a package README says otherwise.

## Standard Local Flow

Start the deterministic fixture app:

```bash
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Then inspect representative routes with `agent-browser`:

```bash
agent-browser open http://127.0.0.1:5174/fixture-gallery
agent-browser snapshot -i
agent-browser eval 'document.documentElement.scrollWidth - document.documentElement.clientWidth'
agent-browser screenshot /tmp/agent-ui-fixture-gallery-desktop.png
agent-browser open http://127.0.0.1:5174/rich-transcript
agent-browser snapshot -i
agent-browser eval '({ composer: !!document.querySelector(".aui-composer"), approvals: document.querySelectorAll(".aui-approval").length })'
agent-browser set viewport 390 900
agent-browser open http://127.0.0.1:5174/usage-only
agent-browser snapshot -i
agent-browser eval '({ composer: !!document.querySelector(".aui-composer"), usagePanels: document.querySelectorAll(".aui-usage").length })'
agent-browser screenshot /tmp/agent-ui-usage-only-mobile.png
agent-browser close
```

For the real local Codex app:

```bash
AGENT_UI_PORT=5175 AGENT_UI_HOST=127.0.0.1 \
AGENT_UI_CODEX_CWD="$PWD" \
bun --filter @nyosegawa/agent-ui-example-codex-local-web dev
```

Then inspect the app in the same browser session:

```bash
agent-browser open http://127.0.0.1:5175/
agent-browser snapshot -i
agent-browser eval '({ composer: !!document.querySelector(".aui-composer"), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })'
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
- Primary buttons, menus, approvals, composer controls, and thread navigation
  are actually clickable or keyboard reachable.

Record durable browser evidence in the relevant PR or release note when it is
useful for review. Keep `docs/architecture/testing.md` focused on the current
validation matrix.
