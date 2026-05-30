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

The capture script owns the current route and filename set. It should cover the
retained local React Vite visual QA route subset: `/`, `/rich-transcript`,
`/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`,
`/app-connectors`, and `/fixture-gallery`.
