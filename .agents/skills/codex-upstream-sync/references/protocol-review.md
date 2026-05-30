# Protocol Review Guide

This guide turns a generated Codex App Server schema diff into a reviewed Agent
UI update. Use it after `codex:upstream:prepare` creates a branch or whenever a
human has already refreshed the generated schema.

## Classification

Every generated stable client method must be explicitly classified in
`packages/codex/src/protocol.ts`.

- Productized: Agent UI exposes a supported library path for the method.
- Host-only: the method is useful to a host application or local tool, but Agent
  UI must not expose it as a general product surface.
- Experimental available: the method is generated only under the upstream
  experimental API and Agent UI intentionally allows advanced callers to use it.
- Experimental unsupported: the method exists upstream but Agent UI does not
  expose it yet.
- Test-only: generated mock protocol used by tests, not a public product
  capability.

Do not rely on a generated list alone as classification. The protocol tests must
fail when a new generated method lacks an explicit decision.

## Review Surfaces

For every added, removed, or changed method, inspect:

- Generated request and result shapes in `packages/codex/src/generated/`.
- Hand-written builders in `packages/codex/src/request-builders.ts`.
- Method result helpers in `packages/codex/src/method-results.ts`.
- Normalizers under `packages/codex/src/normalizers/`.
- State and reducer behavior under `packages/core/src/`.
- Server bridge request handling under `packages/server/src/`.
- React hooks and components under `packages/react/src/`.
- Public docs under `README.md` and `docs/`.
- Examples under `examples/` when behavior is visible to host apps.

## Stable Method Decisions

Prefer productizing only the App Server surfaces that Agent UI can support as a
reusable component library. Do not productize a method just because it exists
upstream.

Productized methods need focused coverage:

- Request builder or typed transport usage.
- Normalizer coverage if the method produces UI state.
- Reducer or hook coverage when state changes.
- Documentation for the public behavior.

Host-only methods need a clear boundary in `docs/reference/codex-protocol.md`.
Examples include filesystem, terminal, marketplace, config, or local tooling
methods that a host can call directly but Agent UI should not own.

## Experimental Method Decisions

Experimental methods must remain opt-in. If a generated experimental method is
useful for advanced callers but not ready for a supported product surface, place
it in `experimentalAvailableMethods` and document the limitation. If it should
not be reachable, place it in `experimentalUnsupportedMethods`.

## Validation

Run these before calling the update complete:

```sh
bun run test:protocol
bun run typecheck
bun run lint
bun run test:api-snapshots
bun run test:package-resolution
```

Add focused Vitest or Playwright coverage when the update changes UI behavior,
normalization, reducer semantics, server-request handling, or bridge behavior.
