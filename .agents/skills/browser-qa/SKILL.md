---
name: browser-qa
description: Verify Agent UI browser-visible behavior with Playwright and agent-browser. Use for UI, CSS, layout, transcript, composer, approvals, usage, diagnostics, thread history, examples, mobile, overflow, focus, keyboard, click, hit-test, screenshot, accessibility snapshot, or real-local browser QA work.
---

# Browser QA

Use this skill for browser-visible Agent UI changes. Playwright is the
deterministic CI gate; agent-browser is for exploratory, human-like interaction
checks and evidence.

## First Pass

1. Read [surface map](references/surface-map.md) and select fixture, real-local,
   or both.
2. Read [agent-browser workflow](references/agent-browser-workflow.md) before
   using `agent-browser`.
3. If a Playwright run was interrupted or ports may be stale, run
   `bun run test:e2e:clean-ports` before targeted browser tests.
4. Verify interactions, not only screenshots.

## What To Check

- document-level horizontal overflow
- composer visibility, focus, keyboard behavior, and bottom anchoring
- running-turn follow-up queue, Send now, Stop, and Cmd/Ctrl+Enter semantics
- pending approval reachability and hit testing on desktop and mobile
- menus, dialogs, sheets, outside click, Escape, focus return, and internal scroll
- markdown, code, command output, and diffs do not create nested scroll traps
- usage/status/diagnostics remain secondary to transcript content
- thread titles and metadata stay readable

## Completion

Report routes checked, viewport sizes, automated tests, agent-browser actions,
screenshots or snapshots captured, failures, and remaining browser risk.
