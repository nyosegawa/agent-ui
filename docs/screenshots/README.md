# Documentation Screenshots

This directory is the opt-in output target for documentation screenshot capture.
PNG files are not refreshed for wording-only documentation changes.

Regenerate screenshots only after an intentional visual contract change:

```sh
CAPTURE_DOCS_SCREENSHOTS=1 bunx playwright test \
  examples/local-react-vite/e2e/capture-docs-screenshots.e2e.ts \
  --config playwright.fixtures.config.ts
```

The capture script owns the current route and filename set. It should cover the
retained local React Vite visual QA routes: `/`, `/rich-transcript`,
`/host-workflow-recipe`, `/usage-only`, `/scoped-thread-pane`,
`/app-connectors`, and `/fixture-gallery`.
