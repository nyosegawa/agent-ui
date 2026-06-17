---
"@nyosegawa/agent-ui-react": major
---

Remove the unused `composer.previewOnlyReason` i18n dictionary key now that
stored and preview threads are writable through automatic resume-before-submit.

Stored and preview thread submit now resumes before deciding whether to start a
new turn, queue a follow-up for a running turn, or block on approval input.
`AgentThreadResumeResult` also exposes raw-free `status`, `activity`,
`activeTurnId`, and `runSettings` metadata for hosts that call `resumeThread`
directly.

`AgentThreadSidebar` no longer accepts a host-supplied `threads` prop. The
default sidebar owns its scoped `thread/list` collection so stored-history row
order follows the App Server response and selection does not promote rows.
Hosts that need a fully custom list should compose `ThreadList` with
`useAgentThreadListController()` instead.
