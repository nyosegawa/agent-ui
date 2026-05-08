# Toolchain

Checked on 2026-05-09 JST against npm registry, Node.js release index, and Bun GitHub releases.

Adoption decisions must use upstream latest/LTS data. Local installed versions are diagnostic only and are not evidence of latest availability.

## Runtime and Package Manager

Decision:

```text
primary CI/runtime target: Node.js LTS
primary package manager: Bun
Bun: primary development runner
Node.js: published package and server compatibility baseline
```

Upstream version snapshot:

```text
Node.js current: v26.1.0
Node.js latest LTS: v24.15.0 Krypton
pnpm latest: 11.0.8
Bun latest: 1.3.13
```

Local environment snapshot:

```text
local Node.js: v22.19.0
local pnpm: 10.15.0
local Bun: 1.3.13
local npm: 11.11.0
```

## Bun Policy

Bun is the primary package manager and development runner.

Rules:

- use `packageManager: bun@<latest checked version>`
- use package.json `workspaces`
- use `bun install` and `bun test` for the default local workflow
- isolate Node-specific APIs in `@nyosegawa/agent-ui-server`
- avoid Bun-specific APIs in browser/core/react packages
- keep Node.js LTS compatibility for published packages
- run Node.js compatibility smoke tests in CI
- keep pnpm compatibility as optional smoke only
- use `bun.lock` as the primary lockfile

Implemented CI:

- `CI`: Bun install, typecheck, lint, tests, build, protocol/fixture tests, package validation
- `Package Validation`: build, `publint`, `arethetypeswrong`
- `Compatibility`: Node.js 20/22/24 import/require smoke against built packages, plus optional pnpm workspace install/build smoke

## Core Dependencies

Decision:

```text
core has minimal dependencies
zod is allowed at runtime validation boundaries
execa is allowed only in server/process code
```

Version snapshot:

```text
zod: 4.4.3
execa: 9.6.1
```

## React and App Examples

Decision:

```text
React 19 peer dependency
Vite example
Next.js example
Next.js Node runtime Route Handlers first-class
```

Version snapshot:

```text
react: 19.2.6
react-dom: 19.2.6
@types/react: 19.2.14
@types/react-dom: 19.2.3
next: 16.2.6
vite: 8.0.11
```

## TypeScript and Build

Decision:

```text
TypeScript 6 baseline
tsup first build candidate
```

Version snapshot:

```text
typescript: 6.0.3
tsup: 8.5.1
```

If package exports, declaration maps, or ESM/CJS output become awkward, evaluate `tsdown`, `unbuild`, or raw `tsc`.

## Tests

Decision:

```text
unit/integration: Vitest
DOM tests: Testing Library + jsdom
browser smoke: Playwright
a11y: axe-core / jest-axe
```

Version snapshot:

```text
vitest: 4.1.5
playwright: 1.59.1
@testing-library/react: 16.3.2
@testing-library/user-event: 14.6.1
@testing-library/jest-dom: 6.9.1
jsdom: 29.1.1
axe-core: 4.11.4
jest-axe: 10.0.0
```

## Repo Tooling

Decision:

```text
monorepo orchestration: bun workspaces first, turbo optional
versioning/release: changesets
lint/format: eslint + prettier
package validation: publint + arethetypeswrong
```

Version snapshot:

```text
turbo: 2.9.10
changesets: 1.0.2
@changesets/cli: 2.31.0
eslint: 10.3.0
prettier: 3.8.3
publint: 0.3.20
attw: 1.0.0
```

Use Bun workspace scripts first. Add `turbo` when task graph caching is useful.

## Codex-Related Packages

Version snapshot:

```text
@openai/codex: 0.129.0
codex: 0.2.3
@ai-sdk/react: 3.0.178
```

`@openai/codex` is a CLI/App Server reference. The primary integration is `codex app-server --listen stdio://`, not an npm package API.

`@ai-sdk/react` is not a direct dependency for MVP. Agent UI needs Codex-specific approval, diff, shell output, and thread item semantics.
