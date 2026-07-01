---
"@nyosegawa/agent-ui-react": major
"@nyosegawa/agent-ui-web-components": major
---

Replace transcript `density` options with the semantic `transcriptDisplay` policy.

React hosts should pass `transcriptDisplay` to `AgentChat`, `AgentThreadView`,
`AgentMessageList`, or `useAgentTranscriptController()` and can use the
`answer-focused` preset through `transcriptMode` on `AgentChat`.

Web Component hosts can pass `transcriptDisplay` or `transcriptMode` through
element properties or `agentOptions`.
