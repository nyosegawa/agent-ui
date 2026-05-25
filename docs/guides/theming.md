# Theming

`@nyosegawa/agent-ui-react/styles.css` ships complete light, dark, and system
themes. Hosts own the active theme and can apply it either with the `theme`
prop on `AgentChat` / `AgentShell` or by placing `data-aui-theme` on a wrapper.
Omit the prop when Agent UI should inherit the host application's theme scope.

## Import

```ts
import {
  AgentChat,
  AgentThemeToggle,
  type AgentTheme,
} from "@nyosegawa/agent-ui-react";
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

Surfaces:

```css
.my-agent-ui {
  --aui-bg: #f7f6f1;
  --aui-bg-soft: #f3f1ea;
  --aui-panel: #ffffff;
  --aui-panel-alt: #f0eee6;
  --aui-panel-quiet: #faf9f4;
}
```

Borders and rules:

```css
.my-agent-ui {
  --aui-border: #e7e4da;
  --aui-border-soft: #efece3;
  --aui-border-strong: #d0ccc0;
  --aui-rule: #ece9df;
}
```

Text:

```css
.my-agent-ui {
  --aui-fg: #1a1916;
  --aui-fg-strong: #0f0e0c;
  --aui-fg-muted: #6b6660;
  --aui-fg-faint: #98948b;
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

Shape, focus, and type:

```css
.my-agent-ui {
  --aui-overlay: rgba(15, 14, 12, 0.42);
  --aui-shadow-card: 0 1px 0 rgba(20, 18, 14, 0.04);
  --aui-shadow-lift: 0 10px 32px -16px rgba(20, 18, 14, 0.22);
  --aui-shadow-focus: 0 0 0 3px var(--aui-primary-border-soft);
  --aui-focus-ring: 0 0 0 3px rgba(13, 148, 136, 0.28);
  --aui-focus-ring-danger: 0 0 0 3px var(--aui-danger-border);
  --aui-elevation-1: 0 1px 0 rgba(20, 18, 14, 0.05);
  --aui-elevation-2: 0 6px 22px -14px rgba(20, 18, 14, 0.22);
  --aui-control-shadow: 0 1px 2px rgba(20, 18, 14, 0.06);
  --aui-radius: 10px;
  --aui-radius-sm: 6px;
  --aui-radius-md: 8px;
  --aui-radius-lg: 12px;
  --aui-radius-xl: 16px;
  --aui-radius-pill: 999px;
  --aui-easing: cubic-bezier(0.22, 0.61, 0.36, 1);
  --aui-tap-target: 36px;
  --aui-font: ui-sans-serif, system-ui, sans-serif;
  --aui-font-mono: ui-monospace, "SF Mono", monospace;
}
```

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
