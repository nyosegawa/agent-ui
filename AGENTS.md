# AGENTS.md

## Rules

- When writing a name in a license file, use `{year} Sakasegawa`. Confirm the current year using `date +%Y`.
- Unless explicitly instructed otherwise, create repositories under `nyosegawa/{reponame}`.
- Keep docs implementation-facing. Do not include competitor-research background in product docs.
- Use the Codex App Server protocol as the primary integration surface.
- Keep the MVP local-first, single-user, stdio-first, and stable-API-first.
- Use Bun as the primary package manager and development runner.
- Keep Node.js LTS compatibility for published packages and server integrations.

## TODO.md Operations

- Treat `TODO.md` as the source of truth for project execution.
- Keep all MVP and post-MVP work in checklist form.
- When starting work, pick the highest unchecked item that is not blocked.
- When a task is completed, update `TODO.md` in the same change.
- Do not delete completed items; keep them checked for project history.
- If a task becomes too large, split it into smaller checklist items before implementation.
- If a decision changes scope or priority, update both `TODO.md` and the relevant file under `docs/`.
