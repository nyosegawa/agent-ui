# Theming

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

`AgentChat` renders a two-column shell:

- sidebar thread list
- main thread header, conversation timeline, per-turn Work traces for command/diff activity, approvals, composer
- CodeMirror diff surfaces inherit `--aui-code-bg`, `--aui-code-fg`, and the package monospace stack

Hosts can set `className` on `AgentChat` and constrain height with normal CSS.

```tsx
<AgentChat className="my-agent-ui" />
```

## Custom Rendering

Use slots for approval cards and thread items when the default UI is not enough. Keep approval decisions explicit and do not hide command or file-change context.
