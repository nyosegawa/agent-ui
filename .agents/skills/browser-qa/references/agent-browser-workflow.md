# Agent Browser Workflow

Use `agent-browser` for exploratory QA, accessibility-tree inspection,
screenshots, and real interactions. It complements Playwright; it does not
replace deterministic tests.

## Before Running Commands

Read `.agents/skills/agent-browser/SKILL.md`, then load the installed CLI guide:

```sh
agent-browser skills get core
```

If the CLI is missing, install and initialize it:

```sh
npm i -g agent-browser
agent-browser install
agent-browser --version
```

## Typical Fixture Check

After starting the fixture app:

```sh
agent-browser open http://127.0.0.1:5174/fixture-gallery
agent-browser snapshot -i
agent-browser eval 'document.documentElement.scrollWidth - document.documentElement.clientWidth'
agent-browser screenshot /tmp/agent-ui-fixture-gallery-desktop.png
agent-browser set viewport 390 900
agent-browser open http://127.0.0.1:5174/rich-transcript
agent-browser snapshot -i
agent-browser screenshot /tmp/agent-ui-rich-transcript-mobile.png
agent-browser close
```

Prefer visible roles, labels, and text over implementation selectors. Do not use
private generated component classes as browser-verification selectors.

## Interaction Standard

When interaction matters, perform real clicks, keyboard input, scrolling, and
focus checks. Screenshots alone are not enough for approval actions, composer
controls, menus, dialogs, thread navigation, or mobile reachability.
