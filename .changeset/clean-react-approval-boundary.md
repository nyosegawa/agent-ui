---
"@nyosegawa/agent-ui-react": major
"@nyosegawa/agent-ui-server": major
"@nyosegawa/agent-ui-web-components": major
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

Composer sends on idle threads now create optimistic user messages with
`clientUserMessageId` before `turn/start` resolves, and failed idle sends remain
visible as failed transcript items while the optimistic turn is completed so the
composer returns to send mode. First-message retry/cancel runtime state is
provider-scoped instead of module-global, and failed pending messages expose
whether they are still retryable after remount.

`AgentComposerSubmitMode` is now `"send" | "stop"`; queued follow-ups are
represented by the queued-follow-up controller state and send results, not by a
submit-button mode.

The server package root now exposes only the high-level bridge, one-shot RPC,
local media, policy, dynamic-tool mapping, host-event, and redaction surfaces.
Raw stdio process helpers (`createCodexAppServerBridge`, child-process spawn
types, and dynamic-tool helper-thread internals) moved to
`@nyosegawa/agent-ui-server/advanced`. Bridge admission must be configured via
`bridgePolicy.admission`; the legacy top-level `admission` option is removed.

The Web Components wrapper now has deterministic lifecycle semantics:
SSR/no-DOM registration returns `undefined`, same-tag registration is
idempotent, foreign tag collisions throw, `agentOptions` is a full replacement
for the element configuration, `chat-class` is the only observed attribute, and
changing `transport` or `initialState` remounts the underlying provider.
