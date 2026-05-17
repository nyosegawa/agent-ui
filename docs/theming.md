# Theming

`@nyosegawa/agent-ui-react/styles.css` ships a complete default theme. Hosts
can override CSS variables globally or under a wrapper class.

## Import

```ts
import "@nyosegawa/agent-ui-react/styles.css";
```

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
  --aui-accent-blue: #2563eb;
  --aui-accent-green: #15803d;
  --aui-danger: #b91c1c;
  --aui-danger-soft: #fde8e7;
  --aui-warn: #b45309;
  --aui-warn-soft: #fbeed5;
  --aui-info-soft: #e3edf7;
  --aui-success: #15803d;
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
}
```

Shape, focus, and type:

```css
.my-agent-ui {
  --aui-shadow-card: 0 1px 0 rgba(20, 18, 14, 0.04);
  --aui-shadow-lift: 0 10px 32px -16px rgba(20, 18, 14, 0.22);
  --aui-shadow-focus: 0 0 0 3px rgba(13, 148, 136, 0.22);
  --aui-focus-ring: 0 0 0 3px rgba(13, 148, 136, 0.28);
  --aui-focus-ring-danger: 0 0 0 3px rgba(185, 28, 28, 0.28);
  --aui-elevation-1: 0 1px 0 rgba(20, 18, 14, 0.05);
  --aui-elevation-2: 0 6px 22px -14px rgba(20, 18, 14, 0.22);
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
