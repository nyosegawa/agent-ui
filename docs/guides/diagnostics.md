# Diagnostics

Agent UI keeps diagnostics separate from chat content. Diagnostics are
normalized state, status banners, warnings, errors, raw protocol notifications,
and server bridge health/debug events that help a host explain or investigate
the UI.

Diagnostic entries carry an `AgentDiagnosticAudience`:

- `user`: safe for visible UI such as `AgentDiagnosticsPanel`,
  `AgentStatusSummary`, `AgentStatusDetails`, and `AgentCriticalNoticeList`
- `developer`: redacted bridge, protocol, and integration diagnostics for
  host support tools
- `audit`: redacted events a host may copy into its own audit trail

`useAgentDiagnostics()` returns the full state plus audience-filtered views:

```tsx
const {
  auditDiagnostics,
  developerDiagnostics,
  userDiagnostics,
} = useAgentDiagnostics();
```

The default visible React surfaces consume `userDiagnostics`. Redacted App
Server stderr, bridge health phases, raw protocol notifications, unsupported
notification warnings, and dynamic-tool debug phases default to developer/audit
audiences. Agent UI does not persist those logs, attach tenant or workspace
meaning, send them to hosted storage, or choose retention/alerting policy for a
host.

App-scoped MCP server startup failures are developer/audit diagnostics by
default. They can explain why a configured Codex MCP server failed to start, but
they are not shown as primary chat status unless the failure is tied to the
current thread and mapped to a user warning banner. When the App Server later
reports a non-failed startup state for that thread, Agent UI removes the banner.

## Redaction And Host Events

Server-side redaction helpers are exported from
`@nyosegawa/agent-ui-server`: `redactSecrets()`, `redactStructuredValue()`, and
`redactTransportEvent()`. The local bridge redacts stderr and structured
diagnostics before forwarding them to browser events, host callbacks, or bridge
health/debug event sinks.

Bridge health and dynamic-tool events are host diagnostics. They include
redacted messages and audience metadata so a host can route them to support or
audit tooling. Agent UI does not provide auth, tenant isolation, persistence,
audit storage, incident routing, or hosted observability.

## Visible UI

Enable the optional diagnostics rail on the preset only when the host wants
visible startup or user-safe warning context:

```tsx
<AgentChat diagnostics />
```

For host chrome, render diagnostics primitives explicitly:

```tsx
const bootstrap = useAgentBootstrap();

<AgentDiagnosticsPanel bootstrap={bootstrap} />;
<AgentStatusSummary />;
<AgentStatusDetails />;
```

Diagnostics should not replace transcript, approval, or server-request UI. Use
`useAgentServerRequests()` for pending host integration requests and
`useAgentApprovals()` for approval decisions.

See [Security](../architecture/security.md), [Server Bridge](../reference/server-bridge.md),
and [Hooks](../reference/hooks.md) for the exact redaction, bridge, and
diagnostic hook contracts.
