# Approvals

Codex App Server can pause a turn and ask the client to decide. Agent UI
normalizes those server requests and renders them through `AgentApprovalQueue`.

Supported request families include:

- command approval
- file-change approval
- user-input request
- MCP elicitation
- permissions approval
- dynamic-tool request
- auth refresh
- attestation
- legacy exec/apply-patch approval requests

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

Hosts can customize approval rendering through component slots, but should not
hide the context needed to make a safe decision.

## Headless Control

Use hooks for custom surfaces:

```tsx
const approvals = useAgentApprovals(threadId);
const requests = useAgentServerRequests(threadId);
```

See [reference/hooks.md](../reference/hooks.md) for hook details and
[architecture/security.md](../architecture/security.md) for security rules.
