# Agent UI Repository Instructions

## Rules

- When writing a name in a license file, use `{year} Sakasegawa`. Confirm the current year using `date +%Y`.
- Unless explicitly instructed otherwise, create repositories under `nyosegawa/{reponame}`.
- Keep docs implementation-facing. Do not include competitor-research background in product docs.
- Use the Codex App Server protocol as the primary integration surface.
- Treat `README.md` and `docs/README.md` as the documentation entry points.
- Do not implement MVP shortcuts. The target is a complete Codex App Server UI
  component system with composable thread, usage, skills, apps, and browser
  verification surfaces.
- Keep external app workflows outside the core library. Proposal/session
  orchestration, app-specific panel runtimes, storage, and sidecar behavior
  belong in host applications that compose Agent UI primitives.
- Keep the default runtime local-first, single-user, stdio-first, and
  stable-API-first unless the active docs explicitly mark a surface as
  experimental or host-only.
- Use Bun as the primary package manager and development runner.
- Keep Node.js LTS compatibility for published packages and server integrations.

## Documentation Operations

- If a decision changes scope, public API, package boundary, validation,
  security, or host integration behavior, update the relevant file under
  `docs/` in the same change.
- Keep public docs current-state oriented. Do not add planning logs,
  migration diaries, or dated validation transcripts to the public docs.
- Do not leave stale README, docs, examples, or AGENTS instructions behind a
  code change. If the implementation changes public API, package boundaries,
  validation, or host integration behavior, update the corresponding docs in
  the same change.

## Implementation Discipline

- Work in small, reviewable implementation slices. After each coherent slice,
  update the relevant docs, run the relevant tests, commit, push, and verify
  the branch is clean.
- Do not batch many unrelated changes into one commit. Prefer commits that
  map to one protocol surface, component boundary, example, or validation gate.
- Add or update tests with the behavior change. A public API, reducer path,
  protocol normalizer, bridge behavior, or visible UI state is not complete
  without focused test coverage.
- Run targeted validation after each slice and the full validation ladder before
  marking broad work complete.
- Refactor when implementation complexity starts hiding protocol, state, UI, or
  bridge behavior. Do not preserve awkward old shapes for compatibility when
  the active docs call for a cleaner API.
- Use `/Users/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` as
  the local App Server source of truth whenever protocol behavior, generated
  schema, stable versus experimental status, or runtime semantics are unclear.
