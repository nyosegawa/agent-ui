# Local React Vite Fixture Example

Directory:

```text
examples/local-react-vite
```

Purpose:

- deterministic UI review without a real Codex process
- fixture-backed transcript, approval, command, diff, usage, and status states
- visual QA routes for component close-ups and full-page layouts
- owner of fixture-gallery, host-workflow, close-up, and usage-only route CSS
  that should not ship through `@nyosegawa/agent-ui-react/styles.css`
- consumer of the same `--aui-*` design-system tokens used by the distributed
  React stylesheet, so examples exercise the library contract instead of an
  independent visual language

The example may use local class names for route structure and QA composition,
but host applications should treat those classes as example implementation
details. Public styling guidance remains: import
`@nyosegawa/agent-ui-react/styles.css` once and customize Agent UI through
`--aui-*` token overrides.

Run:

```sh
bun --filter @nyosegawa/agent-ui-example-local-react-vite dev -- --port 5174
```

Routes:

- `/`: baseline AgentChat fixture with transcript, approvals, command output,
  diff, usage, and automatic stored thread resume.
- `/rich-transcript`: intentionally dense transcript and approval stress
  fixture for renderer and interaction review.
- `/?state=empty`: authenticated first-run workspace with no stored threads.
- `/?state=unauth`: device-code login state.
- `/?state=bridge-error`: local bridge diagnostics state.
- `/fixture-gallery`: component close-ups plus route previews.
- `/host-workflow-recipe`: host-composed primitive layout.
- `/usage-only`: standalone usage primitive examples.
- `/scoped-thread-pane`: fixed-thread composition.
- `/app-connectors`: Codex Apps/connectors metadata.

Playwright starts its own preview servers for automated checks. Do not rely on
a manually running 5174 server for `bun run test:e2e:playwright`.

The fixture e2e suite is organized by product contract rather than by route or
file size. Baseline routing and blank-page protection live in `smoke.e2e.ts`,
layout reachability lives in `visual-layout.e2e.ts`, close-up gallery coverage
lives in `visual-closeups.e2e.ts`, approval behavior lives in
`visual-approvals.e2e.ts`, token-backed design-system invariants live in
`design-system-contract.e2e.ts`, and discoverability of transcript, approval,
composer, and menu surfaces lives in `accessibility-contract.e2e.ts`. Keep new
fixture browser checks in the file that owns the contract they protect, and put
only thin reusable assertions in `e2e/support/`.
