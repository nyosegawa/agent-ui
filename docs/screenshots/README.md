# Documentation Screenshots

This directory is the opt-in output target for documentation screenshot capture.
PNG files are committed only as release/review evidence and are not refreshed for
wording-only documentation changes. Screenshot capture is not part of the normal
CI validation ladder.

Regenerate screenshots only after an intentional visual contract change. The
canonical command is the direct Playwright invocation with the fixture config:

```sh
CAPTURE_DOCS_SCREENSHOTS=1 bunx playwright test \
  examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts \
  --config playwright.fixtures.config.ts
```

The local React Vite visual QA manifest owns the current route and filename set.
The capture script reads entries marked for docs screenshots from
`examples/local-react-vite/src/fixtures/visual-qa-manifest.ts`; update that
manifest instead of duplicating route lists in screenshot tooling. If the
intentional docs screenshot set changes, update the stable screenshot assertion
in `visual-qa-manifest.e2e.ts` as part of the same change.
Run `visual-route-matrix.e2e.ts` before refreshing screenshots when the changed
route layout could affect viewport containment.
