# Theming

`@nyosegawa/agent-ui-react/styles.css` ships complete light, dark, and system
themes. Hosts own the active theme and can apply it either with the `theme`
prop on `AgentChat` / `AgentShell` or by placing `data-aui-theme` on a wrapper.
Omit the prop when Agent UI should inherit the host application's theme scope.

## Import

```ts
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
`packages/react/src/styles/tokens.css`. Use the current token names below;
older `--aui-text`, `--aui-muted`, `--aui-accent`, and
`--aui-accent-strong` names are not part of the current contract.

Agent UI treats tokens as the design-system API. Distributed component CSS and
the bundled fixture/docs examples use these tokens for color, radius, type
scale, spacing, control height, motion, and focus styling. Avoid styling host
surfaces by targeting internal `.aui-*` selectors when a token override or a
component slot can express the same change.

The public stylesheet exposes one CSS entry point:
`@nyosegawa/agent-ui-react/styles.css`. The files copied under
`dist/styles/*` are private chunks used by that entry point.

Surfaces:

```css
.my-agent-ui {
  --aui-bg: #f6f7f9;
  --aui-bg-soft: #eef2f5;
  --aui-panel: #ffffff;
  --aui-panel-alt: #f0f3f6;
  --aui-panel-quiet: #fafbfc;
}
```

Borders and rules:

```css
.my-agent-ui {
  --aui-border: #dfe5eb;
  --aui-border-soft: #e8edf2;
  --aui-border-strong: #c7d1db;
  --aui-rule: #e6ebf0;
}
```

Text:

```css
.my-agent-ui {
  --aui-fg: #171a1f;
  --aui-fg-strong: #0b0d10;
  --aui-fg-muted: #5e6875;
  --aui-fg-faint: #8a95a3;
}
```

Interaction and semantic color:

```css
.my-agent-ui {
  --aui-primary: #0d9488;
  --aui-primary-strong: #0b7a70;
  --aui-primary-fg: #ffffff;
  --aui-primary-soft: #d8efed;
  --aui-primary-border: rgba(13, 148, 136, 0.32);
  --aui-primary-border-soft: rgba(13, 148, 136, 0.18);
  --aui-accent-blue: #2563eb;
  --aui-accent-green: #15803d;
  --aui-accent-blue-soft: #e3edf7;
  --aui-accent-blue-border: rgba(37, 99, 235, 0.22);
  --aui-accent-green-soft: rgba(21, 128, 61, 0.22);
  --aui-accent-green-fg: #15803d;
  --aui-danger: #b91c1c;
  --aui-danger-strong: #991b1b;
  --aui-danger-soft: #fde8e7;
  --aui-danger-border: rgba(185, 28, 28, 0.3);
  --aui-danger-code-fg: #fecaca;
  --aui-warn: #b45309;
  --aui-warn-strong: #7a4b00;
  --aui-warn-soft: #fbeed5;
  --aui-warn-soft-strong: #fff5e6;
  --aui-warn-soft-faint: #fff9ee;
  --aui-warn-border: #f1d6a3;
  --aui-warn-border-soft: rgba(241, 214, 163, 0.65);
  --aui-info-soft: #e3edf7;
  --aui-success: #15803d;
  --aui-success-strong: #126331;
  --aui-success-soft: #dcefe1;
}
```

Code surfaces:

```css
.my-agent-ui {
  --aui-code-bg: #161a20;
  --aui-code-fg: #e7e5e0;
  --aui-code-muted: #9aa1ab;
  --aui-code-rule: #2a3038;
  --aui-code-gutter-fg: #98a2b3;
  --aui-code-gutter-rule: #344054;
  --aui-code-file-fg: #d0d5dd;
  --aui-code-hunk-bg: rgba(84, 121, 255, 0.22);
  --aui-code-hunk-fg: #b8c7ff;
  --aui-code-add-bg: rgba(18, 135, 91, 0.22);
  --aui-code-add-fg: #a7f3c8;
  --aui-code-remove-bg: rgba(180, 35, 24, 0.24);
  --aui-code-remove-fg: #fecaca;
}
```

Shape, focus, and elevation:

```css
.my-agent-ui {
  --aui-overlay: rgba(15, 14, 12, 0.42);
  --aui-shadow-card: 0 1px 0 rgba(15, 23, 42, 0.04);
  --aui-shadow-lift: 0 10px 32px -16px rgba(15, 23, 42, 0.22);
  --aui-shadow-focus: 0 0 0 3px var(--aui-primary-border-soft);
  --aui-focus-ring: 0 0 0 3px rgba(13, 148, 136, 0.28);
  --aui-focus-ring-danger: 0 0 0 3px var(--aui-danger-border);
  --aui-elevation-1: 0 1px 0 rgba(15, 23, 42, 0.05);
  --aui-elevation-2: 0 6px 22px -14px rgba(15, 23, 42, 0.22);
  --aui-control-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  --aui-color-scheme: light;
  --aui-radius: 10px;
  --aui-radius-xs: 4px;
  --aui-radius-sm: 6px;
  --aui-radius-md: 8px;
  --aui-radius-lg: 12px;
  --aui-radius-xl: 16px;
  --aui-radius-2xl: 20px;
  --aui-radius-pill: 999px;
}
```

Spacing:

```css
.my-agent-ui {
  --aui-space-0: 0;
  --aui-space-025: 1px;
  --aui-space-050: 2px;
  --aui-space-075: 3px;
  --aui-space-100: 4px;
  --aui-space-125: 5px;
  --aui-space-150: 6px;
  --aui-space-175: 7px;
  --aui-space-200: 8px;
  --aui-space-225: 9px;
  --aui-space-250: 10px;
  --aui-space-275: 11px;
  --aui-space-300: 12px;
  --aui-space-325: 13px;
  --aui-space-350: 14px;
  --aui-space-400: 16px;
  --aui-space-450: 18px;
  --aui-space-500: 20px;
  --aui-space-550: 22px;
  --aui-space-600: 24px;
  --aui-space-700: 28px;
  --aui-space-800: 32px;
  --aui-space-900: 36px;
  --aui-space-1000: 40px;
  --aui-space-1200: 48px;
  --aui-space-1600: 64px;
}
```

Type and controls:

```css
.my-agent-ui {
  --aui-font-size-2xs: 10px;
  --aui-font-size-2xs-plus: 10.5px;
  --aui-font-size-xs: 11px;
  --aui-font-size-xs-plus: 11.5px;
  --aui-font-size-sm: 12px;
  --aui-font-size-sm-plus: 12.5px;
  --aui-font-size-md: 13px;
  --aui-font-size-md-plus: 13.5px;
  --aui-font-size-lg: 14px;
  --aui-font-size-lg-plus: 14.5px;
  --aui-font-size-xl: 15px;
  --aui-font-size-xl-half: 15.5px;
  --aui-font-size-xl-plus: 16px;
  --aui-font-size-2xl: 17px;
  --aui-font-size-2xl-plus: 19px;
  --aui-font-size-3xl: 22px;
  --aui-font-size-4xl: 24px;
  --aui-line-tight: 1;
  --aui-line-snug: 1.2;
  --aui-line-normal: 1.3;
  --aui-line-relaxed: 1.45;
  --aui-line-prose: 1.5;
  --aui-line-loose: 1.55;
  --aui-line-reading: 1.62;
  --aui-control-height-xs: 26px;
  --aui-control-height-sm: 28px;
  --aui-control-height-md: 30px;
  --aui-control-height-lg: 36px;
  --aui-control-height-lg-plus: 38px;
  --aui-control-height-xl: 40px;
  --aui-tap-target: var(--aui-control-height-lg);
  --aui-easing: cubic-bezier(0.22, 0.61, 0.36, 1);
  --aui-duration-fast: 80ms;
  --aui-duration-normal: 140ms;
  --aui-duration-focus: 160ms;
  --aui-duration-meter: 200ms;
  --aui-duration-spin: 0.9s;
  --aui-duration-pulse: 1.4s;
  --aui-letter-spacing: 0;
  --aui-letter-spacing-code: 0.005em;
  --aui-letter-spacing-label: 0.04em;
  --aui-letter-spacing-meta: 0.06em;
  --aui-letter-spacing-wide: 0.08em;
  --aui-font: ui-sans-serif, system-ui, sans-serif;
  --aui-font-mono: ui-monospace, "SF Mono", monospace;
}
```

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

Use slots for approval cards and thread items when the default UI is not
enough. Keep approval decisions explicit and keep command, tool, and file-change
context in the transcript order so restored sessions remain auditable.
