# Layout Composition

Agent UI's default experience is transcript-first. Preserve this when building
or reviewing host layouts.

## Preset Or Primitives

Use `AgentChat` when the host wants a complete chat surface.

Use primitives when the host needs custom placement of:

- transcript
- composer
- pending approvals
- usage and status
- diagnostics
- apps and skills
- thread history
- scoped thread panes

Keep surfaces independently composable. Do not turn Agent UI into a host
runtime, sidecar manager, or workflow orchestrator.

## UX Rules

- User messages, assistant messages, tool calls, command output, file changes,
  approvals, and usage context belong in the conversation flow.
- Keep the composer as the primary bottom-anchored interaction surface.
- Running state should turn the send affordance into Stop.
- Normal Enter while running should queue a UI-local follow-up; Cmd/Ctrl+Enter
  or `Send now` should steer the active turn.
- Pending approvals belong near the relevant transcript point and must remain
  reachable on desktop and mobile.
- Hosts should control transcript density and visibility with
  `transcriptDisplay`. Use `default`, `byCategory`, and `byRole` rules;
  resolution is `default` -> `byCategory` -> `byRole`. Use
  `transcriptDisplay="answer-focused"` anywhere a display policy is accepted, or
  `transcriptMode="answer-focused"` on `AgentChat` and Web Components. Do not
  branch on raw protocol item kinds or block kinds to decide transcript density.
- Avoid nested vertical scroll traps. The transcript should own normal reading
  scroll.
- Thread history should preserve readable titles and metadata.
- On mobile, the thread history drawer owns its own focus/close behavior and
  should leave the transcript/composer reachable after close.
- Use public layer tokens such as `--aui-z-drawer`, `--aui-z-popover`,
  `--aui-z-dialog`, `--aui-z-sheet`, and `--aui-z-toast` when placing
  host-owned sheets or modals relative to Agent UI overlays.
- Keep host-owned workflow gates outside Agent UI core. Gate host actions around
  public controllers/primitives; do not add workflow-specific state machines,
  plan approval semantics, persistence, or modal managers to Agent UI.

## Regression Checks

Look for:

- horizontal page overflow
- clipped thread titles
- hidden composer controls
- unreachable approval actions
- drawers, dialogs, or menus that trap focus after close
- host sheets hidden behind Agent UI drawers or popovers
- markdown/code blocks that trap the page scroll
- token usage that dominates the header instead of supporting the active
  conversation context
