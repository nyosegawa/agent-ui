# Theming

Status: this page documents the vNext composable shell, fixed-thread view,
usage-only panel, generic workspace slot, skills, apps/connectors, and browser
verification surfaces tracked in `PLAN.md` and `TODO.md`.

`@nyosegawa/agent-ui-react/style.css` ships a practical default theme and CSS variables. Hosts can override variables globally or within a wrapper.

## Import

```ts
import "@nyosegawa/agent-ui-react/style.css";
```

## Variables

The default components use `--aui-*` tokens for surfaces, borders, text, accents, and focus states.

```css
.my-agent-ui {
  --aui-bg: #f8fafc;
  --aui-panel: #ffffff;
  --aui-border: #d8dee8;
  --aui-text: #111827;
  --aui-muted: #667085;
  --aui-accent: #176b87;
  --aui-accent-strong: #0e4f64;
  --aui-danger: #b42318;
  --aui-radius: 8px;
}
```

## Layout

`AgentShell` renders the shared shell contract used by `AgentChat` and custom
host layouts:

- optional sidebar thread list
- main thread header, incrementally rendered transcript timeline with inline command/diff/tool items, approvals, composer
- optional standalone usage, diagnostics, skills, apps, or workspace panels
- CodeMirror diff surfaces inherit `--aui-code-bg`, `--aui-code-fg`, and the package monospace stack

Hosts can set `className` on `AgentChat`, `AgentShell`, or a host wrapper and
constrain height with normal CSS.

```tsx
<AgentChat className="my-agent-ui" />
```

## Custom Rendering

Use slots for approval cards and thread items when the default UI is not enough. Keep approval decisions explicit and do not hide command or file-change context.
