---
"@nyosegawa/agent-ui-core": minor
"@nyosegawa/agent-ui-codex": minor
"@nyosegawa/agent-ui-react": minor
---

Harden public Agent UI contracts by removing raw protocol payload exposure from core thread, turn, item, app, hook, skill, model, and token-usage state types.

Codex normalizers now map App Server payload details into structured metadata while keeping unknown protocol fields internal. Public thread status is a closed Agent UI union derived from App Server state, and React local media resolvers now return explicit resource objects instead of string shorthands.
