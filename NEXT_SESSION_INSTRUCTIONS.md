# Next Session Instructions

次のセッションに貼る短い開始プロンプトは `NEXT_SESSION_PROMPT.md` に分離している。このファイルは、開始後に agent が読む詳細な運用ルールと完了条件を定義する。

目的は `FIX_PLAN.md` と `FIX_TODO.md` に従い、`FIX_TODO.md` の未完了チェックボックスがなくなるまで、順番に実装修正・テスト・ドキュメント更新・検証・チェック更新を継続すること。

## 必ず読むもの

- `AGENTS.md`
- `CLAUDE.md`
- `FIX_PLAN.md`
- `FIX_TODO.md`
- 関連する実装、テスト、docs

## 実行方針

### 1. `FIX_TODO.md` を唯一の進捗台帳にする

- `FIX_TODO.md` の checkbox が作業の source of truth。
- slice 内で追加作業が見つかった場合は、必要なら `FIX_TODO.md` に checkbox を追加してから作業する。
- 完了していない checkbox を先に check しない。
- 実装したが検証していない項目は未完了のままにする。
- N/A の項目は `- [x] ... (N/A: 理由)` のように、理由を残して完了扱いにする。
- Decision/Deferred 項目も未完了のまま残さない。実装しない判断をした場合は、理由と将来の扱いを同じ行に追記して `- [x]` にする。

### 2. slice 順序を守る

原則として以下の順番で進める。

1. S01 - Protocol Truth Bundle
2. S02 - React Resume Status And Canonical Thread Id
3. S03 - React Read And Thread History Normalizer Boundary
4. S04 - Core Server Request Lifecycle And Fake Transport
5. S05 - Core Patch Retention Bound
6. S06 - React Transcript And Composer UX
7. S07 - Apps And Hooks Normalizer Boundary
8. S08 - Server Redaction And Startup Containment
9. S09 - Server Security Defaults And Bridge Policy
10. S10 - Dynamic Helper Permission Policy
11. S11 - Fixture, Validation Docs, And Release Evidence
12. S12 - Design System, Browser Contracts, And Package Runtime
13. Deferred / Decisions
14. Validation Checklist

例外:

- ある slice の実装に前の slice の未完了作業が必要だと分かった場合、前の slice に戻って先に完了する。
- unrelated な大規模 refactor は行わない。
- public API 変更、security default 変更、browser-visible UX 変更は docs/tests/validation を同じ slice に含める。

### 3. Decision 項目は止まらず conservative default を採用する

ユーザーに確認しないと危険な product decision 以外は、`FIX_PLAN.md` の推奨に従って判断し、`FIX_TODO.md` に判断結果を記録する。

既定の判断:

- Field-level experimental API: stable helpers は stable-only のまま。field-level experimental fields は raw/host-managed として docs に書く。typed opt-in は paged resume productization まで defer。
- Paged resume / cursor ownership: public cursor API は追加しない。runtime event は落とさないが cursor storage は持たない。
- Authoritative snapshot replacement: 実装しない。rollback/redaction/full snapshot の deletion scope と audit retention が決まるまで defer。
- Active flags / waiting-state model: forced `ready` は削除するが、rich public status model は additive future work とする。
- Live thread retention: first batch では変更しない。patch-only retention だけ直す。
- Large diff body policy: CodeMirror tokenization は進めてもよいが、height/scroll mechanics は heavy-body contract 決定まで変えない。
- Dynamic helper permission default: fail-safe を優先し、built-in helper の default は `deny` を第一候補にする。host が helper-thread approvals を表示したい場合の `manual` option は提供してよい。旧 auto-grant は explicit unsafe opt-in に隔離する。
- WebSocket default: full-chat productized default を維持し、`stableProductizedMethods` 由来または named delta として test する。one-shot と同じ read/list/status に狭めない。
- Node LTS floor: `engines.node` は安易に上げない。`>=20` を維持するなら package-runtime evidence を追加する。上げる必要がある場合は別 compatibility decision として docs/API snapshots/validation を伴わせる。
- Store helper exports: API snapshots/export maps で public reachability を確認するまで削除しない。

### 4. validation は trigger-based だが、最後は broad gate を通す

slice 中は focused validation を優先する。

- Protocol/type/docs: Codex typecheck including type tests、protocol docs drift test、`bun run test:protocol`、root `bun run typecheck`。
- React resume/read: focused React hook/component tests、`thread-history` parity、Codex normalizer tests、`bun run typecheck`、`bun run lint`。
- Core reducer/transport: core reducer/fake transport tests、`bun run test:fixtures`、`bun run typecheck`。
- React UX/layout: component tests。approval placement、composer behavior、focus、scrolling、mobile reachability が変わる場合は `bun run test:e2e:fixtures`。
- Apps/hooks: Codex normalizer tests、core reducer tests、React hook/panel tests、`bun run typecheck`。public `AgentApp` / `AgentHook` declarations が変わる場合は API snapshots。
- Server security: focused server tests、`bun run typecheck`、`bun run lint`。public dynamic-helper option types が変わる場合は API snapshots。
- Design/styles: `bun run test:styles`、`bun run typecheck`、`bun run lint`。
- Package/runtime: `bun run validate:packages`、`bun run test:package-resolution`。

最後に broad integrated branch gate を実行する。

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run check:dead-code
bun run test:api-snapshots
bun run test:package-resolution
bun run test:e2e:fixtures
```

`bun run validate:e2e` は release confidence、または real-local App Server-backed bridge/upload/routing/resume/lifecycle behavior が scope に入る場合だけ追加する。追加しない場合は `FIX_TODO.md` の該当 checkbox に N/A 理由を記録する。

Package output validation では `build`、`publint`、`attw` を並列実行しない。必ず `bun run validate:packages` に任せる。

### 5. docs と tests を実装と同じ slice に含める

- public API、protocol behavior、server bridge default、security default、UX contract を変えたら docs を同じ slice で更新する。
- public declarations、exports、props、hooks、option types、package metadata が変わったら API snapshots を更新・検証する。
- CSS/design-system を変えたら `tokens.css` と style guard の関係を確認し、raw color/pixel radius/deep style import を増やさない。
- Browser-visible changes は component tests だけで終えない。必要に応じて fixture Playwright と desktop/mobile manual browser review を行う。

### 6. upstream App Server は変更しない

- `/home/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` は protocol semantics を確認するために読むだけ。
- upstream に合わせる必要がある場合は Agent UI 側の generated metadata、normalizers、docs、tests、request builders、server bridge policy を直す。
- upstream App Server を変更する必要があると判断した場合は作業を止め、理由を報告してユーザー確認を取る。

### 7. security default changes は breaking として扱う

以下は TypeScript API が additive でも behaviorally breaking として扱う。

- one-shot HTTP RPC default narrowing。
- dynamic helper permission auto-grant removal / default tightening。
- React resume status/id correction。
- `app/list` vocabulary cleanup。
- `AgentHook.id` を upstream `HookMetadata.key` に直すこと。
- internal server request queue typed keys。
- package `engines.node` を上げること。

docs には migration path と explicit opt-in を書く。unsafe old behavior を残す場合は、名前で危険性が分かる opt-in にする。

### 8. 中断・再開時の手順

再開時は毎回以下を行う。

1. `git status --short` を確認する。
2. `FIX_TODO.md` の最初の `- [ ]` を探す。
3. その checkbox が属する slice の `FIX_PLAN.md` section を読む。
4. 直近の変更ファイルと該当 tests/docs を読む。
5. 未完了 checkbox から再開する。

既に通した validation は、変更範囲が広がった場合は再実行する。古い validation 結果だけで checkbox を check しない。

### 9. 最終報告に含めるもの

最終的に `FIX_TODO.md` の未完了 checkbox がなくなったら、以下を報告する。

- 完了した slices の概要。
- 実行して pass した validation commands。
- N/A とした validation/Decision 項目と理由。
- breaking change candidate と migration docs の場所。
- upstream App Server は変更していないこと。
- commit/push をしていない場合は、その旨。
- 残リスクがあれば、`FIX_TODO.md` には未完了 checkbox を残さず、別途「残リスク」として報告する。

## チェック完了の基準

checkbox を `- [x]` にできるのは、以下のいずれかを満たした場合だけ。

- 実装、テスト、docs、focused validation が完了した。
- 明示的に N/A と判断し、理由を checkbox 行に追記した。
- Decision/Deferred 項目について、今回の batch では実装しない理由と将来条件を記録した。

以下の場合は check してはいけない。

- 実装したが test がない。
- test を追加したが validation を走らせていない。
- validation が失敗している。
- public API/docs/security default が変わったのに docs/API snapshots/migration note がない。
- browser-visible behavior が変わったのに必要な e2e/manual check をしていない。
- 「あとでやる」とだけ書いている。

## 最初に取り組むべき具体タスク

次セッションの最初の実装対象は S01。

開始直後は以下を行う。

1. `package.json` と `packages/codex/package.json` の scripts/typecheck 構成を読む。
2. `packages/codex/tsconfig.json`、既存の test tsconfig があれば読む。
3. `packages/codex/test/session-api.test.ts` の compile-only assertions を特定する。
4. `packages/codex/src/protocol.ts` と `docs/reference/codex-protocol.md` の method sections を比較する。
5. type-test gate の最小設計を決める。
6. S01 の tests/docs 実装を green にする。
7. S01 の checkbox を完了した分だけ `FIX_TODO.md` で check する。

S01 が完了したら S02 に進む。S02 では `resumeThread()` の forced `ready` と requested-id activation を最小 P0 として先に直し、その後 `thread-history.ts` wrapper parity と `readThread()` delegation を S03 へ続ける。
