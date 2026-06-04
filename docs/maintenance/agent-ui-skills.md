# Agent UI Skill

Agent UI keeps a reusable Agent Skill source at `skills/agent-ui/SKILL.md`.
The skill helps external users integrate, customize, debug, and upgrade Agent UI
in Codex App Server host applications.

Codex discovers checked-in repository skills from `.agents/skills`, not from
`skills/`. Treat `skills/agent-ui` as the distributable skill source for users
and plugin packaging. Repository-maintainer skills stay under `.agents/skills`.

## Current Codex Model

The latest Codex skill model is:

- A skill is a directory with `SKILL.md`, optional references, optional scripts,
  and optional `agents/openai.yaml` metadata.
- `SKILL.md` must include `name` and `description`; Codex initially loads only
  the skill name, description, and file path, then reads the full instructions
  through progressive disclosure.
- Codex scans repository skills from `.agents/skills` from the current working
  directory up to the repository root, user skills from `$HOME/.agents/skills`,
  admin skills from `/etc/codex/skills`, and bundled system skills.
- Direct skill folders are for local authoring and repo-scoped workflows.
  Reusable distribution should use a plugin when the skill is shared beyond one
  local checkout or bundled with apps/MCP.
- Local experimentation should use `$skill-installer`; reusable distribution
  should prefer plugins.

## Distribution

For local testing, ask Codex to use `$skill-installer` against this checkout or
copy the skill into an isolated user-skill directory. Do not overwrite a real
user's installed skills during smoke tests.

For external reuse, package `skills/agent-ui` in an Agent UI plugin. A plugin
can carry the skill plus future app or MCP integrations without making those
integrations part of Agent UI core.

The skill also includes `skills/agent-ui/agents/openai.yaml` so the Codex app can
show stable UI metadata and keep implicit invocation enabled for Agent UI
integration prompts.

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

For distribution-sensitive changes, also smoke the plugin or isolated local
skill install path that will be documented for users.
