# @nyosegawa/agent-ui-core

Protocol-neutral state and transport primitives for Agent UI.

Use this package when a host application needs the normalized thread state,
transport contracts, reducer behavior, or shared types without rendering React
components.

## Install

```sh
bun add @nyosegawa/agent-ui-core
```

## Package Boundary

This package does not start Codex, own persistence, manage credentials, or
orchestrate host workflows. Host applications connect it to their own runtime
and transport policy.

Use documented selectors and view models for host-facing reads. Reducer
reconciliation, optimistic operation maps, retention internals, and raw
diagnostic payload handling are implementation details unless the package
exports and docs explicitly promote them.

Thread runtime state is explicit: active flags, active turn, last turn result,
and pending server-request summaries are exposed through selectors such as
`selectThreadExecutionState`, `selectThreadSummaryView`, and
`selectThreadTranscriptView`. Hosts should use those read models instead of
inspecting reducer entity maps.

See the repository docs for current package exports and integration guidance:
https://github.com/nyosegawa/agent-ui
