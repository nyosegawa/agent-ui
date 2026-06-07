# Codex Hooks For Repository Development

Agent UI uses project-local Codex hooks to make repository maintenance safer.
These hooks are for development of this repository only. They are not part of
the public Agent UI component API and should not be documented as host
integration features.

## Source Files

- `.codex/hooks.json` declares project-local hook handlers.
- `scripts/codex-hooks/repo-policy.mjs` is the command entry point Codex runs.
- `scripts/codex-hooks/repo-policy-lib.mjs` contains deterministic policy logic
  covered by `bun run test:hooks`.
- `test/codex-hooks-repo-policy.test.ts` is the focused hook fixture suite.

The hooks never edit files. They either add model-visible context, deny a small
set of unsafe actions, or remind the agent which validation commands are likely
needed for the current dirty working tree.

## Codex Runtime Facts

Hooks are enabled by default through the canonical `[features].hooks` flag. The
legacy `codex_hooks` feature key still exists upstream but should not be used in
this repository.

Codex discovers hooks next to active config layers, including project-local
`.codex/hooks.json`. Project-local hooks run only after the project `.codex`
layer is trusted. Review changed hooks with `/hooks`; Codex records trust
against the current hook definition hash, so edits to `.codex/hooks.json` or the
command string require review again. For one-off automation that already vets
the repository state, `codex exec --dangerously-bypass-hook-trust ...` can run
enabled hooks without persisted trust.

Only `type: "command"` handlers execute today. `prompt`, `agent`, and `async`
handlers are parsed by Codex but skipped or unsupported. Command hooks receive a
single JSON object on stdin, run in the session `cwd`, capture stdout/stderr,
and time out according to the handler `timeout` value.

Multiple matching hooks can run concurrently. Do not rely on one hook preventing
another matching hook from starting.

## Installed Hook Behavior

`SessionStart` adds a short repository policy context: read `AGENTS.md`, keep
Agent UI as reusable primitives, avoid editing `third_party/codex`, use
generators for generated files, use Bun, and report validation.

`UserPromptSubmit` adds context when a request appears to involve upstream Codex
checkout edits, package publication, or host-runtime behavior such as watcher or
skill-with-app logic.

`PreToolUse` blocks a narrow set of unsafe tool calls before they run:

- destructive git cleanup/reset commands
- force pushes
- package publish commands
- non-Bun repository package-manager mutations
- direct mutation inside `third_party/codex`
- direct mutation of generated schema or package `dist` output

For patch-style tools, protection is based on the file targets declared by the
patch header, not arbitrary prose in the patch body. This lets docs and skills
mention protected paths while still blocking patches that actually target them.

`PermissionRequest` applies the same deny policy before elevated tool approval.
When it denies, Codex does not show the normal approval prompt.

`PostToolUse` intentionally stays quiet. Earlier versions emitted validation
reminders after tool calls, but that made normal editing noisy because the same
dirty-tree checklist repeated after almost every patch. `Stop` and
`SubagentStop` now summarize validation-sensitive dirty paths before the agent
finishes.

`SubagentStart` adds review context for repository-focused subagents.

`SubagentStop` emits the same dirty-tree validation reminder for subagent
turns, without asking Codex to continue the subagent.

`Stop` emits a JSON `systemMessage` when the working tree is dirty, reminding
the agent to report validation, changed files, and remaining risk before ending.
It does not block completion.

## Validation

Run the focused hook suite after changing hook policy:

```sh
bun run test:hooks
```

Run the broader repository gates when the hook behavior or docs touch shared
policy:

```sh
bun run typecheck
bun run lint
bun run test
```

For manual Codex verification, use a harmless prompt and bypass trust only for
the verification run:

```sh
codex exec --dangerously-bypass-hook-trust "In this repo, respond with OK after reading the project hooks."
```

Then review `/hooks` in an interactive Codex session before relying on the hooks
for normal development.

## Maintenance Rules

- Keep hook behavior conservative. Block only actions that are clearly unsafe
  for this repository.
- Keep reminders short and actionable. Hooks run inside the agent loop and can
  become noise if they repeat low-value advice.
- Keep hook scripts deterministic and side-effect free.
- Update this document, `.codex/hooks.json`, and
  `test/codex-hooks-repo-policy.test.ts` together when changing policy.
- Do not use hooks as a substitute for tests, review, or CI.
