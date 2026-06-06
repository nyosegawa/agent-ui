# React Protocol Coverage

React protocol exposure is tracked separately from Codex protocol
classification. `packages/codex/src/protocol.ts` decides whether an App Server
method is productized, host-only, experimental, or unsupported. React exposure
decides whether a productized stable method is visible in default React UI,
available through headless hooks, available only through the Codex client, or
intentionally not exposed by React.

The source of truth is `packages/react/src/protocol-exposure.ts`.
`packages/react/test/protocol-exposure.vitest.ts` fails when a method is added
to `stableProductizedMethods` without an explicit React exposure decision. The
same test checks source evidence for those decisions: required evidence must
stay present for `default-ui` and `hook` decisions, and forbidden evidence must
stay absent for `client-only` and `no-default-ui` decisions.

Exposure values:

- `default-ui`: used by standard React components or default chat surfaces.
- `hook`: available through React hooks/controllers, but not necessarily shown
  by default components.
- `client-only`: available through the Codex client facade for host-owned UI.
- `no-default-ui`: intentionally outside React request surfaces.

Evidence policy:

- Use `required` evidence for default UI or hook/controller calls that should
  keep backing a productized method.
- Use `forbidden` evidence for client-only methods that must not quietly become
  part of React source without reclassification.
- Keep evidence specific to source files or `packages/react/src`; the registry
  file itself is excluded from source scans.

Current notable client-only decisions:

- `account/usage/read`: hosts can build account usage-history panels from the
  stable Codex client response, but default React UI only renders current
  rate-limit windows through `account/rateLimits/read`.
- `thread/inject_items`: the Codex client supports item injection, but default
  React UI does not provide an injection workflow.
- `thread/unsubscribe`: the Codex client supports unsubscribe, but default React
  UI does not expose a subscription workflow.
