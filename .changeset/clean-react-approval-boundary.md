---
"@nyosegawa/agent-ui-core": major
"@nyosegawa/agent-ui-codex": major
"@nyosegawa/agent-ui-react": major
"@nyosegawa/agent-ui-server": major
"@nyosegawa/agent-ui-web-components": major
---

Redesign Agent UI public contracts around raw-free view models, controller
composition, and Codex-stable input shapes.

The core package now keeps reducer store shapes, raw protocol-normalized
entities, raw selectors, fixtures, and compatibility helpers behind
`@nyosegawa/agent-ui-core/internal`. The root core entrypoint exposes only the
stable reusable library surface. Hosts should consume React controllers,
primitives, or explicit core view models instead of depending on reducer
internals.

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

The codex package participates in the fixed-version major release so its
normalizers and request builders target the redesigned core and React public
contracts.

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

Recipes and integration docs now present the redesigned public composition
boundary as the source of truth: headless examples compose controllers and
primitives instead of reducer internals, arbitrary files send the absolute saved
path as explicit text input, and downstream product names are guarded from
public library documentation.
