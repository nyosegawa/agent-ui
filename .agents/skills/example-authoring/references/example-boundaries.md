# Example Boundaries

## Styling

- Use `@nyosegawa/agent-ui-react/styles.css` as the only public React stylesheet.
- Use `--aui-*` tokens for colors, spacing, type, controls, focus, motion,
  radii, borders, and elevation.
- Do not document internal `.aui-*` selectors as host contracts.
- Keep example-specific layout classes local to the example.

## Runtime Ownership

Examples may demonstrate host-owned behavior, but they should not move that
behavior into core packages unless it is a reusable primitive or documented
extension point.

Host-owned behavior includes:

- routing and product workflow state
- persistence policy
- process lifecycle and deployment topology
- authentication, admission, and workspace isolation
- upload storage and cleanup
- dynamic tool execution and MCP policy

## Documentation

When an example changes public guidance, update the matching docs page under
`docs/examples/` or `docs/recipes/`. Keep docs current-state oriented. Do not
include planning logs or historical migration notes in public docs.

## Tests

Add or update tests according to ownership:

- fixture UI behavior: fixture Playwright or React component tests
- fixture route inventory and viewport coverage: update
  `visual-qa-manifest.ts` and run `visual-route-matrix.e2e.ts`
- real App Server bridge behavior: real-local Playwright or bridge tests
- real-local desktop/mobile layout: `real-local-layout.e2e.ts`
- package import behavior: package-resolution smoke
- CSS token/selector behavior: style tests
