---
"@nyosegawa/agent-ui-react": major
---

Redesign the React approval and input public contracts around raw-free view
models and Codex-stable input shapes.

`AgentImageInput` now uses `{ type: "image", url }`. The old `image_url` shape
is removed from the React public API.

`useAgentApprovals()`, `AgentApprovalQueue`, `AgentChat.components.Approval`,
`AgentThreadTimeline.renderApproval`, and transcript approval anchors now use
`AgentApprovalRequest` views instead of internal pending server-request payloads.
File-change approval views include renderable patch data for structured changed
files.
Approval decisions are sent with `AgentApprovalDecision` values:
`accept`, `acceptForSession`, or `decline`.

Broad server-request handling remains separate on `useAgentServerRequests()`
with method-specific `respond()` / `reject()` actions.
