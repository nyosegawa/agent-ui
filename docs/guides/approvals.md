# Approvals

Codex App Server can pause a turn and ask the client to decide. Agent UI
normalizes command and file-change decision requests as approvals for
`AgentApprovalQueue`.

Approval request families include:

- command approval
- file-change approval

Older upstream `execCommandApproval` and `applyPatchApproval` requests are
accepted at the Codex adapter boundary and normalize into `commandApproval` and
`fileChangeApproval`; they are not public approval families.

Other server requests, including user input, MCP elicitation, permissions, auth
refresh, and attestation, are host integration requests. Read them through
`useAgentServerRequests()` and render method-specific UI in the host; the
default approval queue does not send generic `{ decision }` responses for them.
Dynamic tool calls are also host integration requests, but the default queue
does not retain them because they must be handled out of band by the bridge or
host tool runner.

Keep approval decisions separate from broader server-request policy. Agent UI
can render approval cards and expose neutral `respond()` / `reject()` actions,
but hosts own permission grants, MCP elicitation payloads, user-input forms,
dynamic-tool authorization, audit logging, and any workspace or tenant policy
attached to a decision.

## Default Placement

The default thread view anchors approvals inside the transcript. When upstream
metadata includes `itemId` or `turnId`, the approval renders directly after the
matching item or turn. Requests without source metadata fall back to the
transcript tail. Both paths keep command/file context near the assistant output
and avoid creating a second competing scroll pane.

## Decision Surface

The default approval surface shows:

- request title and risk label
- command, file, patch, or request summary
- working directory and policy metadata when available
- explicit approve, approve-for-session, and decline actions when supported

Hosts can customize approval rendering through the `AgentChat.components` map,
but should not hide the context needed to make a safe decision.

`AgentChat.components.Approval` replaces the default approval card and its
actions for that rendered request. Custom components must wire decisions
through `useAgentApprovals()` or a host-owned response path; otherwise the
request will remain pending until the App Server resolves or rejects it.

## Headless Control

Use hooks for custom surfaces:

```tsx
const approvals = useAgentApprovals(threadId);
const { requests, respond, reject } = useAgentServerRequests(threadId);
```

`useAgentApprovals()` returns only command and file-change approval requests.
`useAgentServerRequests()` returns the broader normalized request queue and
intentionally uses neutral response names so hosts send method-specific
payloads instead of approval-shaped decisions.

See [reference/hooks.md](../reference/hooks.md) for hook details and
[architecture/security.md](../architecture/security.md) for security rules.
