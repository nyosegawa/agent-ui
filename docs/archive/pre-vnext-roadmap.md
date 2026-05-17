# Roadmap

Status: this file records the completed pre-vNext buildout. The active vNext
execution plan is `PLAN.md` plus `TODO.md`; do not use the historical order
below to decide remaining implementation scope.

## Implementation Order

```text
1. repository scaffold
2. package workspaces
3. core event model
4. reducer tests
5. fake transport
6. Codex App Server schema generation
7. Codex stdio transport
8. Codex normalizer
9. React provider and hooks
10. minimal AgentChat
11. server local bridge helpers
12. approval UI
13. diff viewer
14. contextual command and file-change activity in the turn timeline
15. component accessibility and fixture coverage
16. real app-server smoke test
17. docs/TODO sync and package validation
```

## Release Criteria

The real local app release is complete when:

- Vite example can start a local Codex App Server through the bridge
- device-code login UI works
- user can start a thread
- user can send a turn
- streaming assistant text renders
- command output renders
- command/file approval can be answered
- diff preview renders
- thread can be resumed
- protocol conformance tests exist
- reducer fixture tests cover core event paths
- package exports pass validation
- browser smoke test passes

## Possible Future Work

This list is historical and non-authoritative. Use `PLAN.md` and `TODO.md` for
current implementation scope. Remaining future work should be revalidated
against the current code before being scheduled.

- websocket reconnection hardening
- richer thread sidebar
- Monaco/CodeMirror diff integration
- hosted demo app

## Explicitly Deferred

- full IDE
- file explorer
- Git UI
- plugin marketplace admin
- realtime/audio
- collaborative editing
- general-purpose chatbot abstraction
