---
"@nyosegawa/agent-ui-core": minor
"@nyosegawa/agent-ui-codex": minor
"@nyosegawa/agent-ui-react": minor
"@nyosegawa/agent-ui-server": minor
"@nyosegawa/agent-ui-web-components": minor
---

Refresh the vendored Codex App Server schema and clean up compatibility-only
protocol surfaces. Legacy upstream approval requests now normalize to canonical
command and file-change approval kinds, preferred request builders expose
Agent UI-owned path aliases, and deprecated protocol fields remain adapter-only
fallback intake with current fields taking precedence.
