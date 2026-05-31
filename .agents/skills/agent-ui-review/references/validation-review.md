# Validation Review

Use this to judge whether a change ran enough validation.

## Minimum Expectations

- Runtime TypeScript changes: `bun run typecheck`, `bun run lint`, relevant
  Vitest coverage.
- Protocol/generated changes: `bun run test:protocol`, `bun run test:fixtures`,
  method classification docs, generated metadata checks.
- Public package or export changes: `bun run validate:packages`,
  `bun run test:api-snapshots`, `bun run test:package-resolution`,
  `bun run test:node-compat`.
- CSS/design-system changes: `bun run test:styles`, typecheck, lint, relevant
  browser-visible checks.
- Browser-visible UI changes: relevant React tests plus Playwright or
  agent-browser evidence for layout, hit testing, focus, scrolling, and mobile.
- Example or recipe changes: build/typecheck for the example, docs updates, and
  route-specific browser checks when visible.
- Hook or skill changes: focused hook or skill tests and a smoke that proves the
  agent-facing workflow loads.

## Red Flags

- Validation claims only "not run" without risk explanation.
- Build/package commands are run in parallel with `publint` or `attw`.
- Browser-visible changes have screenshots but no interaction, focus, or hit-test
  verification.
- Docs claim retention, bounded behavior, or policy guarantees without tests for
  the real backing store or enforcement path.
- CI is mentioned before the pushed workflows have completed.
