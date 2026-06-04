# Theming

`@nyosegawa/agent-ui-react/styles.css` ships complete light, dark, and system
themes. Hosts own the active theme and can apply it either with the `theme`
prop on `AgentChat` / `AgentShell` or by placing `data-aui-theme` on a wrapper.
Omit the prop when Agent UI should inherit the host application's theme scope.

## Import

```ts
import { useState } from "react";
import { AgentChat, AgentThemeToggle, type AgentTheme } from "@nyosegawa/agent-ui-react";
import "@nyosegawa/agent-ui-react/styles.css";
```

## Theme Scope

Use one of `light`, `dark`, or `system`.

```tsx
function HostAgentSurface() {
  const [theme, setTheme] = useState<AgentTheme>("system");

  return (
    <section data-aui-theme={theme}>
      <AgentThemeToggle value={theme} onChange={setTheme} />
      <AgentChat />
    </section>
  );
}
```

For preset-only embeds, pass the same value directly:

```tsx
<AgentChat theme="dark" />
```

`AgentChat` does not render an internal theme switcher and does not create
theme state. `AgentThemeToggle` is a controlled primitive for hosts that want a
library-styled switcher in their own chrome. The root default is light, and
`data-aui-theme="system"` follows `prefers-color-scheme`.

## Token Groups

The active token source is
`packages/react/src/styles/tokens.css`. It is the source of truth for exact
token names and default values. This guide describes the stable token groups and
override pattern instead of copying the full value catalog.

Agent UI treats `--aui-*` tokens as the design-system API. Distributed component
CSS and bundled fixture/docs examples use these tokens for color, radius, type
scale, spacing, control height, motion, and focus styling. Avoid styling host
surfaces by targeting internal `.aui-*` selectors when a token override or a
component slot can express the same change.

The public stylesheet exposes one CSS entry point:
`@nyosegawa/agent-ui-react/styles.css`. The files copied under
`dist/styles/*` are private chunks used by that entry point.

Current token families:

- Surface and panel colors: `--aui-bg`, `--aui-panel`, and related soft or
  quiet surface tokens.
- Text colors: foreground, strong, muted, and faint text tokens.
- Semantic colors: primary, danger, warning, success, info, and accent tokens.
- Code surfaces: background, foreground, gutter, hunk, add, and remove tokens.
- Borders, rules, elevation, overlays, focus rings, and shadows.
- Radius, spacing, font family, type scale, line height, control height, tap
  target, motion duration, easing, and letter-spacing tokens.

Small override example:

```css
.my-agent-ui {
  --aui-primary: oklch(0.62 0.15 185);
  --aui-primary-strong: oklch(0.52 0.14 185);
  --aui-primary-fg: white;
  --aui-radius-md: 0.75rem;
  --aui-control-height-md: 2rem;
}
```

Use exact token values from `tokens.css` when reviewing defaults. If docs ever
need to publish a full exact token table, generate or test that table against
`tokens.css` rather than copying values by hand.

## Maintenance Rules

Use tokens before selectors. Prefer overriding token values on a wrapper over
targeting `.aui-*` internals. If a slot or render prop exists for the surface,
use it for structural customization and keep tokens for the visual system.

Add a token only when the value represents a reusable design decision. One-off
layout constraints such as fixed preview iframe heights, responsive breakpoints,
and grid track widths can remain local CSS values because they describe a
specific composition rather than the shared visual language.

Distributed component CSS and bundled visual examples should not introduce raw
colors, negative letter spacing, or pixel `border-radius` values outside
`tokens.css`. The normal radius exceptions are `0` for flush joins and `50%`
for circular indicators. `examples/recipes/src/themed.css` is intentionally a
host override recipe and may define concrete token values.

## Layout

`AgentChat` is transcript-first by default. Usage, diagnostics, status, apps,
skills, and host panels are composition primitives, not mandatory shell chrome.

Hosts can set `className` on `AgentChat`, `AgentShell`, or a wrapper and
constrain height with normal CSS:

```tsx
<div className="my-agent-ui">
  <AgentChat />
</div>
```

## Custom Rendering

Use the `AgentChat.components` map when token changes are not enough.
`Approval`, `ComposerPanel`, `EmptyState`, `Shell`, `Sidebar`, and `blocks`
are the preferred replacement points for vNext customization. `Item` remains a
legacy replacement point whose props still expose core item/turn state in this
draft, so prefer `blocks` or transcript controllers for raw-free custom
rendering. Keep approval decisions explicit and keep command, tool, and
file-change context in the transcript order so restored sessions remain
auditable.
