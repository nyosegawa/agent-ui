# Roadmap

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

## MVP Exit Criteria

MVP is complete when:

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

## Post-MVP

Add after MVP:

- remote WebSocket deployment guide
- websocket reconnection hardening
- custom component examples
- headless hooks examples
- themed examples
- SDK adapter
- OpenAI Agents SDK adapter
- Web Components wrapper
- richer thread sidebar
- Monaco/CodeMirror diff integration
- multi-user deployment recipes
- hosted demo app

## Explicitly Deferred

- full IDE
- file explorer
- Git UI
- plugin marketplace admin
- realtime/audio
- collaborative editing
- general-purpose chatbot abstraction
