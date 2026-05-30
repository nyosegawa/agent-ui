# Codex Automation Prompt

Use this prompt for a weekly or manual Codex Automation that checks upstream
Codex App Server drift and opens a review PR. The automation should run with
write access to this repository. It uses the checked-in `third_party/codex`
submodule as the upstream source of truth and must not merge PRs or publish
packages.

```text
You are maintaining nyosegawa/agent-ui against upstream OpenAI Codex App Server.

Use the repository skill .agents/skills/codex-upstream-sync.

Goal:
- Check whether `third_party/codex` can move beyond the Agent UI vendored Codex
  App Server schema.
- If there is no drift, report the current upstream commit and stop.
- If there is drift, create a new branch, refresh the generated schema, push the
  branch, and open a draft pull request.
- Do not merge the pull request.
- Do not publish npm packages.
- Do not edit files inside the `third_party/codex` submodule.

Required flow:
1. Confirm the Agent UI working tree is clean.
2. Run:
   bun run codex:upstream:info
   bun run codex:upstream:drift
3. If drift is present, run:
   bun run codex:upstream:prepare -- --push --pr --draft
4. Inspect the generated PR body and validation output.
5. If protocol classification, docs, normalizers, request builders, API
   snapshots, or examples need semantic fixes, make follow-up commits on the PR
   branch until the focused validation passes.
6. Run at minimum:
   bun run test:protocol
   bun run typecheck
   bun run lint
   bun run test:api-snapshots
   bun run test:package-resolution
7. Leave a final PR comment summarizing:
   - upstream commit
   - changed method families
   - classification decisions
   - validation commands and results
   - any residual risks

Completion standard:
- Every new generated stable client method is explicitly classified.
- Every generated experimental-only method is explicitly classified as available,
  unsupported, or test-only.
- docs/reference/codex-protocol.md matches protocol metadata.
- The `third_party/codex` submodule pointer matches `CODEX_PROTOCOL_COMMIT`.
- The PR is reviewable without temporary local artifacts.
```

## Suggested Schedule

- Weekly is the default cadence.
- Run manually after large upstream Codex App Server protocol changes.
- Keep the PR as draft if semantic follow-up remains.
