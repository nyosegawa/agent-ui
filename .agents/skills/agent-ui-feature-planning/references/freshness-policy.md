# Freshness Policy

Use this policy before every Agent UI feature-planning run.

## Fast Freshness Check

Read `references/freshness-manifest.json`, then compare the current repo state
with the manifest.

Preferred command from the repository root:

```sh
node .agents/skills/agent-ui-feature-planning/scripts/check-freshness.mjs
```

The check compares `git rev-parse HEAD`, watched file hashes, and watched glob
fingerprints. If nothing changed, continue planning with the existing
`references/repo-research-summary.md`.

## Targeted Refresh

Use targeted refresh when watched inputs changed but the repo shape is still the
same. Read only changed files or glob members, update the affected sections of
`references/repo-research-summary.md`, and update
`references/freshness-manifest.json`.

Targeted refresh examples:

- `AGENTS.md`, `CLAUDE.md`, or `.agents/skills/**` changed: refresh agent
  guidance and skill conventions.
- `package.json`, `bun.lock`, or toolchain docs changed: refresh package
  manager and validation commands.
- `.github/workflows/**` or CI docs changed: refresh CI names, path filters, and
  follow-through expectations.
- architecture, testing, release, security, or package-export docs changed:
  refresh the corresponding repo-specific constraints.

## Full Refresh

Use full refresh only when structural inputs changed materially or the user asks
for re-research. Structural changes include package layout changes, build system
replacement, CI model replacement, protected/generated-file policy changes,
submodule/schema workflow changes, or major agent guidance rewrites.

Full refresh reruns repo discovery across implementation, docs, examples,
tests, workflows, skills, protected files, and current external facts where
needed.

## Research Recording

Every generated `research.md` must include:

- manifest path,
- last full research commit,
- current commit,
- watched input result,
- refresh mode,
- changed files or globs,
- whether the manifest was updated,
- reason if live/current research was skipped.
