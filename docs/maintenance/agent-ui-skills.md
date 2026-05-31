# Installable Agent UI Skill

Agent UI publishes a user-installable Agent Skill at
`skills/agent-ui/SKILL.md`. The skill helps external users integrate, customize,
debug, and upgrade Agent UI in Codex App Server host applications.

## Install

Use either `gh skill install` or `npx skills add` after reviewing the source:

```sh
gh skill install nyosegawa/agent-ui agent-ui --agent cursor --scope project
gh skill install nyosegawa/agent-ui skills/agent-ui/SKILL.md --agent codex --scope project
npx skills add nyosegawa/agent-ui --skill agent-ui -a cursor -y
```

For a local checkout during development:

```sh
gh skill install . agent-ui --from-local --agent cursor --scope project --force
npx skills add . --skill agent-ui -a cursor -y
```

The canonical source layout is `skills/*/SKILL.md`. Do not move public skills to
`.agents/skills`; that directory is reserved for repository-maintainer skills.

## Shape

`skills/agent-ui/SKILL.md` is an orchestrator skill. It should stay concise and
route agents to focused references under `skills/agent-ui/references/`:

- `integration-profiles.md`: local single-user, host-owned remote, and
  debug/upgrade classification.
- `local-single-user.md`: localhost or personal Codex App Server app setup.
- `host-owned-remote.md`: auth, admission, isolation, upload, and process
  policy requirements for remote or multi-user apps.
- `server-bridge.md`: full-chat WebSocket bridge, one-shot RPC boundaries, and
  Next.js decisions.
- `layout-composition.md`: transcript-first composition and layout regressions.
- `theming.md`: `@nyosegawa/agent-ui-react/styles.css` and `--aui-*` token
  customization.
- `uploads.md`: host-resolved attachment paths and local upload helper behavior.
- `dynamic-tools.md`: host-owned dynamic tool execution and permission policy.
- `debug.md`: existing integration diagnosis and upgrade flow.
- `validation.md`: external host validation and finish report guidance.

## Public Boundary

The skill is for external Agent UI users, not Agent UI maintainers. It should:

- prefer host app context over repository-maintainer assumptions
- respect the host package manager instead of forcing Bun
- describe Agent UI as a component library, not a hosted Codex service
- keep remote and multi-user deployment as host-owned advanced integration work
- route full chat through a same-origin WebSocket bridge
- describe Next Route Handlers as one-shot RPC only
- keep private React CSS chunks and internal `.aui-*` selectors out of host
  contracts

## Validation

Run the focused skill gate after changing public skills:

```sh
bun run test:skills
```

Before publishing or shipping broader repo changes, run:

```sh
bun run typecheck
bun run lint
bun run test
```

Manual distribution checks should cover both installers when possible:

```sh
gh skill install . agent-ui --from-local --agent cursor --scope project --force
npx skills add . --skill agent-ui -a cursor -y
```

Use temporary repositories or isolated home directories for installer smoke
tests so local user skills are not overwritten accidentally.
