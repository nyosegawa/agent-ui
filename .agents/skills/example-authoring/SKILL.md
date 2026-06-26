---
name: example-authoring
description: Add, update, or review Agent UI examples, recipes, fixture routes, docs-site examples, Next.js/Vite integrations, local Codex web demos, theming recipes, uploads examples, dynamic tools examples, or example documentation. Use when working in examples/, docs/examples/, docs/recipes/, fixture routes, or browser-visible sample apps.
---

# Example Authoring

Use this skill for examples, recipes, fixture routes, and example docs. Examples
are validation surfaces for the library, not independent product experiments.

## First Pass

1. Classify the example using [example types](references/example-types.md).
2. Read the existing example README and matching docs page.
3. Keep the product boundary in [example boundaries](references/example-boundaries.md).
4. Use `--aui-*` tokens and the public stylesheet contract.
5. Add or update focused tests/docs when the example changes public guidance or
   browser-visible contracts.

## Implementation Rules

- Use package public imports only.
- Import `@nyosegawa/agent-ui-react/styles.css` once.
- Keep route/example CSS token-based.
- Keep fixture routes deterministic and separate from real App Server coverage.
- Register fixture routes, docs screenshots, preview eligibility, and viewport
  coverage in the visual QA manifest instead of duplicating route lists.
- Keep real-local examples focused on bridge, auth/account/model/thread/turn,
  approvals, uploads, streaming, steer, interrupt, and token usage behavior.
- Keep host-owned runtime decisions in examples or docs, not public package
  internals.

## Validation

Run the example's typecheck/build when available. For visible fixture changes,
run the route-specific spec plus the visual route matrix when route layout or
viewport coverage can drift. For real-local layout changes, run
`real-local-layout.e2e.ts` or the full real-local suite. For package export or
stylesheet changes, use release-validation guidance.

Report the example type, changed routes, public guidance updated, commands run,
and any remaining manual browser checks.
