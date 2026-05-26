# Usage And Status

Usage, status, and diagnostics are composable primitives. They are not required
rails in `AgentChat`.

## Usage

`AgentUsagePanel` renders normalized account rate-limit windows from
`account/rateLimits/read` and App Server usage notifications.

```tsx
<AgentUsagePanel />
```

Use `AgentUsageSummary` for compact host chrome and
`AgentContextUsageIndicator` for nonzero per-thread context usage restored from
`thread/tokenUsage/updated`.
`AgentStatusBar` also mounts `AgentUsagePanel` inside its authenticated account
dialog. This keeps rate-limit detail discoverable from account chrome without
requiring a persistent usage rail in the default transcript layout.

## Status

`AgentStatusSummary`, `AgentStatusDetails`, and `AgentCriticalNoticeList` share
the same normalized severity model. Background notices stay out of the primary
transcript. Critical account, config, MCP OAuth, and rate-limit conditions can
be placed near the thread.

## Diagnostics

`AgentDiagnosticsPanel` renders bridge/account/model startup diagnostics after
redaction. It should not replace the transcript or approval UI.

For the state model, see [architecture/overview.md](../architecture/overview.md).
