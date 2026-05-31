# Host-Owned Remote Integration

Agent UI provides components, transports, and bridge helpers. It does not
provide a managed remote Codex hosting runtime.

Use this reference when a host app is deployed beyond loopback, has accounts, or
serves more than one user or workspace.

## Required Host Decisions

Before implementing a remote bridge, identify:

- how users authenticate
- how each WebSocket connection is admitted before App Server spawn
- how user, session, workspace, and tenant boundaries map to Codex cwd/processes
- where credentials live and how they are scoped
- how App Server processes are started, stopped, rate limited, and audited
- how uploads are stored, isolated, expired, and redacted
- which browser JSON-RPC methods are allowed
- how stderr and structured bridge errors are redacted

If any of these are unknown, do not expose the bridge. Produce a design note and
ask the user for the missing host policy.

## Allowed Implementation Scope

It is reasonable to add Agent UI React surfaces and a bridge skeleton when the
host already has auth/session middleware and clear process policy. Keep all
security assumptions visible in comments or docs local to the host app.

Avoid:

- public unauthenticated WebSocket bridges
- `allowedMethods: "all"` without a host-owned policy review
- using `Origin` as authentication
- shared cwd or upload directories across users
- logging bearer tokens, file paths with secrets, or raw App Server stderr

## Output Standard

For remote work, finish with a checklist of host-owned items that were verified
and items still outside Agent UI's responsibility.
