# Codex Upstream Sync

Use this skill when maintaining Agent UI against upstream OpenAI Codex App
Server changes, especially when the user asks to check protocol drift, refresh
generated schemas, update `CODEX_PROTOCOL_COMMIT`, classify new App Server
methods, or create a PR for Codex App Server updates.

## Intent

Keep Agent UI aligned with Codex App Server without turning upstream updates
into unattended merges. This skill is for interactive or scheduled Codex
Automation runs that detect drift, open a reviewable PR, and leave semantic UI
work to a Codex agent or human reviewer.

## Hard Rules

- Do not edit files inside `third_party/codex`; update only the submodule pointer.
- Do not push directly to `main`.
- Do not publish npm packages.
- Do not merge the PR created by this skill.
- Treat generated schema changes as the beginning of review, not the completed
  update.
- Classify every new stable and experimental method before calling the PR done.

## First Checks

1. Read [`references/protocol-review.md`](references/protocol-review.md).
2. Read [`references/codex-automation-prompt.md`](references/codex-automation-prompt.md)
   if the task is a scheduled or manual Codex Automation run.
3. Confirm `third_party/codex` is initialized and matches the checked-in
   generated schema commit before starting.
4. Confirm this repository has a clean working tree.
5. Run the drift report:

   ```sh
   bun run codex:upstream:drift
   ```

   The drift report compares generated schema against `third_party/codex`
   `origin/main` through a temporary worktree without moving the checked-in
   submodule pointer.

## Standard Update Flow

1. Inspect the upstream commit and method drift:

   ```sh
   bun run codex:upstream:info
   bun run codex:upstream:drift
   ```

2. If drift exists, create a branch and PR:

   ```sh
   bun run codex:upstream:prepare -- --push --pr --draft
   ```

3. Review generated schema changes in:

   - `packages/codex/src/generated/`
   - `packages/codex/src/protocol.ts`
   - `packages/codex/package.json`

4. Fix all semantic fallout:

   - Protocol method classification.
   - Request builders and method result helpers.
   - Normalizers and reducer expectations.
   - Server-request handling and approval surfaces.
   - React hooks, examples, and docs when a user-facing behavior changed.

5. Run focused validation before pushing follow-up commits:

   ```sh
   bun run test:protocol
   bun run typecheck
   bun run lint
   bun run test:api-snapshots
   bun run test:package-resolution
   ```

6. For visible behavior changes, also run the relevant fixture or real local
   Playwright suite.

## Completion Criteria

The PR is ready for review only when:

- `packages/codex/test/protocol.test.ts` passes the classification gate.
- `docs/reference/codex-protocol.md` matches the updated method surface.
- Generated metadata is consistent across `protocol.ts`, package metadata, and
  generated README.
- The `third_party/codex` submodule pointer matches `CODEX_PROTOCOL_COMMIT`.
- Every new method has an explicit owner decision: productized, host-only,
  experimental available, experimental unsupported, or test-only.
- No automation artifacts or temporary reports are committed unless a reviewer
  explicitly asks for them.

## Repository Scripts

- `scripts/codex-upstream/collect-upstream-info.mjs`: prints current and upstream commit
  metadata.
- `scripts/codex-upstream/summarize-protocol-drift.mjs`: exports upstream
  protocol schema to a temporary directory and compares generated method lists
  without changing the repository.
- `scripts/codex-upstream/prepare-update-branch.mjs`: creates an update branch,
  imports schema, records validation status, optionally pushes, and optionally
  opens a draft PR.

The script implementations are intentionally outside this skill directory. The
skill owns judgment, sequence, and review criteria; repository maintenance
commands live under `scripts/`.
