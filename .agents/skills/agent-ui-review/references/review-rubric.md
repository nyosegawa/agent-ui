# Review Rubric

Use this rubric for Agent UI repository reviews.

## Findings

Report only actionable issues. Order by severity:

- P0: data loss, secret exposure, unsafe remote exposure, broken package
  publication, or unusable main workflow.
- P1: likely user-visible regression, public API break, protocol misclassification,
  bridge security flaw, or missing required validation.
- P2: edge-case bug, stale docs that mislead integrators, incomplete tests, or
  maintainability issue that can realistically cause follow-up defects.
- P3: low-risk cleanup only when it improves reviewability.

For each finding include:

- file or symbol reference
- what breaks
- why the change causes it
- concrete fix direction

Do not list compliments before findings. If no issues are found, say "No
findings" and then mention test gaps or residual risk.

## Repository-Specific Checks

- Public package exports and API snapshots stay aligned.
- Public controller/component/resource types do not expose `raw?: unknown`,
  generated App Server payloads, first-message operation maps, or string
  shorthand local-media resolvers.
- Generated Codex schema changes are reviewed semantically, not accepted as
  mechanical output.
- Browser method policy does not expose host-only App Server methods by default.
- Bridge admission, redaction, backpressure, message size, rate limits, and
  shutdown semantics remain intact.
- Transcript-first UX is preserved for messages, tool calls, command output,
  diffs, approvals, and usage context.
- Composer running-state semantics remain: Stop interrupts, Enter queues
  locally, and Cmd/Ctrl+Enter or Send now steers the active turn.
- Pending approvals stay in transcript flow and remain reachable on mobile.
- CSS uses `--aui-*` tokens and the single public stylesheet import.
- Examples use Agent UI package boundaries instead of adding app-specific
  runtime behavior to public packages.
- Docs, README entries, package export docs, API snapshots, and tests change
  together when a public surface changes.
