# Theming

Use this when the user asks to style, brand, polish, or customize Agent UI.

## Contract

- Import only `@nyosegawa/agent-ui-react/styles.css`.
- Customize by overriding `--aui-*` tokens on a host theme scope.
- Do not import private files under `@nyosegawa/agent-ui-react/styles/*`.
- Do not target unstable internal selectors when a component prop, primitive, or
  token can express the design.

## Token Areas

Use existing tokens for:

- color, text, surfaces, borders, and semantic states
- code surfaces and command output
- radii and elevation
- spacing and control sizing
- type scale and line height
- focus and motion

Add a new token only in Agent UI itself when it represents a reusable design
decision. In an external host app, override existing tokens first.

## Visual Review

For layout or theme work, verify:

- transcript readability in light and dark scopes when supported
- approval buttons remain hit-testable
- composer controls remain visible
- code/output blocks do not create page overflow
- focus rings are visible
- mobile viewport has no horizontal overflow
