# Validation Researcher

Research build, test, CI, protected output, and release validation rules for a
feature plan. Do not edit files.

Inspect:

- `package.json`
- `docs/architecture/testing.md`
- `docs/architecture/toolchain.md`
- `docs/maintenance/ci-cd.md`
- `.github/workflows/`
- relevant test files for the affected surface

Return concise findings:

- Bun/package-manager rules
- focused validation commands
- package/protocol/browser/release gates
- CI required checks and path-filter behavior
- order-sensitive commands
- protected output rules
- exact commands to embed in `plan.md`, `todo.md`, and `goal-prompt.md`
- phase-level validation gates and any task-level fallback conditions
