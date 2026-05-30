# Agent UI Fix Todo

この checklist は `FIX_PLAN.md` と同じ 12 slices に沿っています。各項目は実装 PR で green にしてから完了扱いにします。

## P0

### S01 - Protocol Truth Bundle

- [x] `tsc` が所有する Codex type-test gate を追加する。
- [x] Codex type-test gate を通常の package/root typecheck path に組み込む。
- [x] runtime-only Vitest から compile-only protocol/request-builder assertions を移す。
- [x] stable helper が `thread/resume.excludeTurns` など field-level experimental params を reject する negative type tests を追加する。
- [x] field-level experimental policy を raw/host-managed として文書化する。
- [x] `StableMethodResultMap` / `ExperimentalMethodResultMap` の exact-key coverage を追加する。churn が大きい場合は P1 validation hardening に分ける。
- [x] `docs/reference/codex-protocol.md` の method lists を `protocol.ts` / capability metadata に合わせて修正する。
- [x] `thread/goal/*` を host-only docs に移す。
- [x] `remoteControl/status/read`、`thread/search`、`thread/settings/update` を experimental docs に反映する。
- [x] `permissionProfile/list`、`plugin/installed` を host-only docs に反映する。
- [x] 固定 method-list sections だけを見る focused docs drift test を追加する。
- [x] `docs/architecture/testing.md` に type-only assertions の置き場所を明記する。
- [x] Completion: old false assertions/docs drift が typecheck/docs drift test で検出され、修正後に `bun run typecheck` と protocol tests が通る。

### S02 - React Resume Status And Canonical Thread Id

- [x] `resumeThread()` で `normalizeThreadResumeResponse(result, { activate: true })` の events を順序通り dispatch する。
- [x] resume 後の synthetic `thread/status/changed` to `ready` を削除する。
- [x] requested id/path ではなく canonical `response.thread.id` を active にする。
- [x] React resume params は stable-only のまま維持し、`excludeTurns`、`initialTurnsPage`、cursor ownership、paged resume defaults を追加しない。
- [x] `thread-history.ts` の public exports を維持する。
- [x] `thread-history.ts` を Codex normalizer への薄い compatibility wrapper にする。
- [x] active/running resume status が `ready` に上書きされない test を追加する。
- [x] requested id/path と response thread id が違う場合、canonical returned id が active になる test を追加する。
- [x] runtime `initialTurnsPage` events が落ちないことを test する。ただし cursor storage/API は追加しない。
- [x] hook/component docs の resume status/id 説明を更新する。
- [x] Completion: running/active App Server resume が React state でも running/active のまま残り、resume-by-path は returned canonical thread id を active にする。

## P1

### S03 - React Read And Thread History Normalizer Boundary

- [x] React `thread/read` handling を `normalizeThreadReadResponse()` に委譲する。
- [x] `readThread({ activate: false })` が active thread を置き換えず state update できることを維持する。
- [x] `thread-history.ts` compatibility helpers と Codex normalizer output の parity test を追加する。
- [x] duplicate React snapshot normalizer が item aliases、`itemsView`、command output、file patches、text extraction で drift しないようにする。
- [x] Completion: React read/snapshot path が Codex normalizer と同じ events を出し、public wrapper exports と hook signatures は維持される。

### S04 - Core Server Request Lifecycle And Fake Transport

- [x] core server request queue 用の typed JSON-RPC request id key helper を追加する。
- [x] internal key では numeric `0` と string `"0"` を区別する。
- [x] public pending request objects、selectors、hooks、`respond()`、`reject()` では元の request id 型を維持する。
- [x] same typed id + same thread の `serverRequest/created` を replay/idempotent refresh として扱う。
- [x] same typed id + different thread の behavior を diagnostics + ignore として実装する。
- [x] unknown `serverRequest/resolved` を no-op にする。
- [x] duplicate `serverRequest/resolved` を no-op にする。
- [x] `serverRequest/resolved` を cleanup-only とし、approval success や terminal turn success を推測しない。
- [x] connection close/error で pending requests を cleanup する。
- [x] stable server request kinds すべてで id type preservation の normalizer coverage を追加する。
- [x] `FakeAgentTransport.close()` が `connection/closed` を drain してから iterator を complete するようにする。
- [x] fake transport close で pending `next()` waiters を release する。
- [x] stale fake transport iterator が reconnect events を消費しないようにする。
- [x] fake responses/rejections maps も typed request id key を使う。
- [x] Completion: numeric/string id が end-to-end で区別され、replay は idempotent、resolved は success を意味せず、fake close は real transports に近い semantics になる。

### S05 - Core Patch Retention Bound

- [x] patch body eviction で落ちた synthetic patch-only ids を検出できるようにする。
- [x] evicted synthetic patch-only ids を `turn.itemOrder` から prune する。
- [x] authored item ids、command output ids、streaming/block ids、別の retained transcript surface を持つ ids は削除しない。
- [x] patch refresh ordering は first-observed を維持する。
- [x] live thread retention と authoritative snapshot replacement はこの slice に含めない。
- [x] `filePatchByItemId`、`itemOrder`、`transcriptItemIds()`、visible-window counts が一緒に bounded になる test を追加する。
- [x] authored item id が patch body eviction で消えない test を追加する。
- [x] retention docs が bounded heavy bodies/indexes を主張している場合だけ更新する。
- [x] Completion: patch-only retention が invisible stale ids を残して hidden counts や window slots を膨らませない。

### S06 - React Transcript And Composer UX

- [x] running + empty textarea + no attachments + normal Enter を no-op にする。
- [x] running + non-empty Enter は local follow-up queue のまま維持する。
- [x] running + non-empty Cmd/Ctrl+Enter は immediate `turn/steer` のまま維持する。
- [x] Stop button だけを explicit `turn/interrupt` path にする。
- [x] pending approval に source metadata があり source が存在する場合、window 外でも source context を pin する。
- [x] tail fallback を metadata-free、genuinely missing-source、explicit host-tail placement に限定する（explicit host-tail public API は無いため今回の実装対象は metadata-free / missing-source）。
- [x] `turnId` だけの approval anchor policy を決めて test する。
- [x] actual `threadId` change で follow mode を reset する。
- [x] actual `threadId` change で stale `Jump to latest` を clear する。
- [x] same-anchor approval grouping を public API churn なしに入れられるか判断する（今回は grouping 変更なし。既存 picker rows を維持）。
- [x] grouping を入れる場合、one `AgentApprovalQueue` per item/turn anchor の compact rows を test する（N/A: 今回は grouping 変更なし）。
- [x] empty Enter no-interrupt test を追加する。
- [x] running follow-up queue regression test を追加する。
- [x] Stop button interrupt regression test を追加する。
- [x] source-outside-window approval pinning test を追加する。
- [x] source-missing tail fallback test を追加する。
- [x] metadata-free tail fallback test を追加する。
- [x] follow-scroll reset test を追加する。
- [x] DOM placement が変わる場合、fixture Playwright で mobile reachability / hit testing を確認する。
- [x] Completion: approval は transcript context で監査可能になり、empty Enter は running turn を止めず、thread switch は latest content を追う。

### S07 - Apps And Hooks Normalizer Boundary

- [x] Codex `app/list` response normalization を `AgentApp.accessible` / `AgentApp.enabled` vocabulary に揃える。
- [x] Codex `app/list/updated` notification normalization を response path と同じ fields に揃える。
- [x] `installUrl`、description、logos、labels、branding、metadata、必要な plugin display metadata を保持する。
- [x] `app/list` から `installed` を派生しない。
- [x] `app/list` から `needsAuth` を派生しない。
- [x] auth/install vocabulary は plugin host-only / plugin-specific APIs に残す。
- [x] core `apps/updated` は scoped full replacement として維持する。
- [x] cursor-page merge は React `useAgentApps()` 側の責務として維持する。
- [x] React hooks から corrected Codex app/model normalizers を再利用する。
- [x] upstream `HookMetadata.key` を `AgentHook.id` として normalize する。
- [x] hooks が `id: "undefined"` を emit しないようにする。
- [x] app response/update parity tests を追加する。
- [x] core app replacement vs pagination merge tests を追加する。
- [x] React app panel tests for accessible-but-disabled and inaccessible-but-enabled apps を追加する。
- [x] upstream-shaped `HookMetadata` を使った hook key identity tests を追加する。
- [x] docs/examples の stale install/auth wording を enabled/accessibility wording に更新する。
- [x] `AgentApp` / `AgentHook` public fields が変わる場合は API snapshots を更新する（確認済み、snapshot 更新は不要）。
- [x] Completion: refresh と notification が同じ connector state を生成し、real upstream hooks が stable ids を持つ。

### S08 - Server Redaction And Startup Containment

- [x] redaction credential-key table に OAuth query keys を追加する。
- [x] structured snake_case keys の redaction を追加する。
- [x] `access_token`、`refresh_token`、`id_token`、`client_secret` を cover する。
- [x] bearer/API key/password/secret/device/user code families の既存 coverage を維持する。
- [x] URL query delimiters を保持し、値だけ redact する。
- [x] `status_code`、`exit_code`、`nextToken`、`pageToken`、`continuationToken`、`id`、`code`、`cursor` など non-secret guard tests を追加する。
- [x] Express one-shot bridge creation を redacted `try` path に移す。
- [x] Next one-shot bridge creation を redacted `try` path に移す。
- [x] WebSocket post-admission bridge creation/startup を wrap する。
- [x] WebSocket startup failure は close code `1011` と generic reason にする。
- [x] partial child/bridge state を best-effort cleanup する。
- [x] query strings、repeated params、mixed delimiters、nested host events、one-shot errors、bridge errors、dynamic-tool failures の redaction tests を追加する。
- [x] spawn throw、missing stdio、missing binary、secret-bearing startup errors の tests を Express/Next/WebSocket に追加する。
- [x] Completion: startup failure が unhandled/framework error として漏れず、OAuth-like secret が diagnostics、JSON errors、stderr、close reason に出ない。

### S09 - Server Security Defaults And Bridge Policy

- [x] one-shot default narrowing を intentional security-sensitive breaking behavior として扱う。
- [x] `DEFAULT_ONE_SHOT_METHODS` を read/list/status-shaped methods に狭める。
- [x] default candidate に `account/read`、`account/rateLimits/read`、`model/list`、`thread/list`、`thread/loaded/list`、`thread/read`、`skills/list`、`hooks/list`、`app/list` を含める。
- [x] `initialize` を one-shot default から外すか、外す理由と migration を明記する。
- [x] auth mutations、thread mutations、turn control、config/skill writes を default deny にする。
- [x] explicit `allowedMethods` と `"all"` opt-in を維持する。
- [x] one-shot default-deny tests for mutation/turn/config/auth methods を追加する。
- [x] one-shot explicit allowlist / `"all"` tests を追加する。
- [x] full-chat WebSocket default は productized path として維持する。
- [x] WebSocket browser request defaults を `stableProductizedMethods` 由来、または named tested delta にする（named tested delta: full-chat turn/start forwarding と host-only rejection を固定）。
- [x] WebSocket default を one-shot と同じ read/list/status に狭めない。
- [x] WebSocket source-of-truth / sensitive-family tests を追加する。
- [x] direct upstream App Server WebSocket、Agent UI same-origin WebSocket bridge、one-shot HTTP RPC の trust boundary docs を書き直す。
- [x] upstream browser `Origin` rejection が Agent UI bridge endpoint を守るものではないことを docs に明記する。
- [x] Completion: one-shot は omission で安全になり、WebSocket は single source of truth に基づく full-chat path として維持され、docs が trust boundaries を混同しない。

### S10 - Dynamic Helper Permission Policy

- [x] helper-thread `permissionsApproval` の unconditional grant を削除する。
- [x] helper-specific permission policy option を追加する。
- [x] default を `manual` にするか `deny` にするか決める（`manual`）。
- [x] unsafe 旧挙動を残す場合は `grantRequestedForTurn` のような明示名にする。
- [x] MCP tool approval auto-accept は `_meta.codex_approval_kind === "mcp_tool_call"` に限定して維持する。
- [x] callback grants は requested permission subset に bound する。
- [x] helper permission grants は最初の実装では turn-scoped にする。
- [x] no-policy behavior test を追加する。
- [x] manual/deny behavior tests を追加する。
- [x] bounded callback subset grant tests を追加する。
- [x] unrequested permission family denial tests を追加する。
- [x] timeout and bridge close behavior tests を追加する（既存 dynamic tool timeout / bridge close coverage を維持して再検証）。
- [x] unsafe opt-in を ship する場合、その tests を追加する（`grantRequestedForTurn` は explicit opt-in として実装、callback/subset と default manual に加えて focused suite で保護）。
- [x] dynamic-tool docs と migration notes を更新する。
- [x] public option types が変わる場合は API snapshots を更新する（snapshot check 済み、差分なし）。
- [x] Completion: helper permissions は host-owned policy または明示 unsafe opt-in がない限り grant されない。

## P2

### S11 - Fixture, Validation Docs, And Release Evidence

- [x] raw JSON-RPC fixtures の JSONL を parse し、sorted unique methods と manifest `methods` を比較する test を追加する。
- [x] fixture `stability` metadata を追加するか、別 follow-up に分けるか決める（追加済み）。
- [x] fixture coverage が Agent UI product support を意味しないことを docs に書く。
- [x] `validate:packages` docs を `build -> test:packlist -> test:node-compat -> publint -> attw` に合わせる。
- [x] `validate:packages` script order と package export docs の focused docs sync tests を追加する（major validation ladders 全体を固定する test ではない）。
- [x] `check:dead-code` を rerun してから cleanup 対象を決める（cleanup は本 slice では実施せず、最終 broad gate で rerun）。
- [x] store helper exports を public/internal どちらとして扱うか決めてから export cleanup する（cleanup 対象外、現 public/internal 形を維持）。
- [x] public export を消す場合は breaking-change decision と API snapshots を伴わせる（N/A: public export 削除なし）。
- [x] Completion: fixture と validation docs が実 script/fixture に機械的に追従し、release evidence が過剰主張しない。

### S12 - Design System, Browser Contracts, And Package Runtime

- [x] public stylesheet boundary guard を追加する。
- [x] docs/examples で `@nyosegawa/agent-ui-react/dist/styles/*` deep import を禁止する。
- [x] feasible なら private style chunks の package-resolution negative coverage を追加する（既存 `blockedSubpathsForPackage()` coverage を確認・維持）。
- [x] CodeMirror visual constants を既存 `--aui-*` tokens に寄せる。
- [x] TS/TSX visual style guard を hard-coded font、spacing、line-height、outline、duration values に拡張する。
- [x] dark/system token parity test を追加する。
- [x] example HTML style-block guard coverage を追加する。
- [x] same-anchor approval grouping が S06 に入らなかった場合、この slice で scoped follow-up にする（S06 approval placement coverage 済み、追加 grouping 変更なし）。
- [x] menu trigger current-value accessible name を追加する。
- [x] context usage disclosure の focus return を補強する。
- [x] first-run cancel-login copy を locale-owned key にする。
- [x] large diff/table/tall approval behavior を決めるまで diff body scroll/height 変更や Playwright fixture を追加しない。
- [x] Next sidecar upload cleanup を server close、`SIGINT`、`SIGTERM` に wire する。
- [x] idempotent upload cleanup helper/test を追加する。
- [x] build 後の web-components consumer smoke を追加する。
- [x] Node LTS exact floor を決める（`>=20` 維持）。
- [x] `>=20` を維持する場合は package-runtime evidence を追加する（`validate:packages` と built web-components/package-resolution smoke）。
- [x] `engines.node` を上げる場合は package metadata、docs、validation expectations を更新する（N/A: `>=20` 維持）。
- [x] Completion: visual/package guard gaps が埋まり、heavy-body、Node、public package contracts を偶然変えない。

## Deferred / Decisions

- [x] Field-level experimental API policy: current recommendation は stable helpers stable-only、raw/host-managed usage を docs に書く。typed opt-in は paged resume productization が決まった後。
- [x] Paged resume / `thread/turns/list` cursor ownership: hook-local cursor state か core cursor state かを決めるまで public cursor API は追加しない。
- [x] Authoritative snapshot replacement: rollback、redaction、complete snapshots の deletion scope、audit retention、active/live turn protection を設計してから実装する。
- [x] Active flags / waiting-state public shape: forced `ready` は消すが、rich active/waiting model は additive status model として別途設計する。
- [x] Live thread retention exception and orphan ordering: active/live/pending exception を維持するか、backing entities まで bounded にするかを決める。
- [x] Large diff body policy: transcript-owned readable preview と explicit expansion の contract を決めてから CodeMirror height/scroll mechanics を変える。
- [x] Dynamic helper permission default: `manual` と `deny` のどちらを default にするか決める。auto-grant は default にしない（S10 で `manual` に決定）。
- [x] Security-sensitive default release policy: one-shot narrowing と dynamic helper tightening は TypeScript API が additive でも behavioral breaking として扱う。
- [x] WebSocket narrowing: deferred。current recommendation は productized full-chat default を `stableProductizedMethods` 由来にすること。
- [x] Node LTS minimum: exact floor/engines change は package runtime work の中で別判断にする（S12 で `>=20` 維持）。
- [x] Store helper exports: public/internal status を決めるまで dead-code cleanup で削除しない。
- [x] Generated README absolute local path normalization: protocol import maintenance pass まで defer。
- [x] Personal absolute paths in fixtures/demos: 触るタイミングで opportunistic に直す。
- [x] Docs-site viewport smoke: docs-site が release-facing visual QA になるまで defer。
- [x] Rich `AgentSkill` metadata: current primitive が必要とするまで defer。
- [x] Plugin marketplace/install UI: Agent UI default product surface には入れない。
- [x] MCP management panels and raw MCP tool/resource methods: host-owned として扱う。
- [x] Realtime、process、remote control、thread settings/search、`thread/turns/items/list` など experimental/unsupported surfaces: default productized Agent UI scope には入れない。

## Validation Checklist

- [x] Protocol/type/docs truth: Codex typecheck including type tests、protocol docs drift test、`bun run test:protocol`、root `bun run typecheck` を実行する。
- [x] React resume/read: focused React hook/component tests、`thread-history` wrapper parity tests、relevant Codex normalizer tests、`bun run typecheck`、`bun run lint` を実行する。
- [x] Core reducer/transport: core reducer/fake transport tests、`bun run test:fixtures`、`bun run typecheck` を実行する。wire normalizer shape が変わる場合は protocol tests も実行する。
- [x] React UX/layout: focused React component tests を実行し、approval placement、composer behavior、focus、scrolling、mobile reachability が変わる場合は `bun run test:e2e:fixtures` を追加する。
- [x] Apps/hooks: Codex normalizer tests、core reducer tests、React hook/panel tests、`bun run typecheck` を実行し、`AgentApp` / `AgentHook` declarations が変わる場合は API snapshots を実行する。
- [x] Server security: WebSocket、Express、Next、redaction、one-shot policy、dynamic tools の focused server tests を実行し、public dynamic-helper option types が変わる場合は API snapshots を実行する。
- [x] Design/styles: `bun run test:styles`、`bun run typecheck`、`bun run lint` を実行する。visible layout/overflow/focus behavior が変わる場合は fixture Playwright を追加する。
- [x] Package/runtime: package output、export maps、copied CSS、built consumer smoke、Node engines、publish output が変わる場合は `bun run validate:packages` と `bun run test:package-resolution` を実行する。
- [x] Broad integrated branch gate: `bun run validate:fast` を実行する。
- [x] Broad integrated branch gate: `bun run validate:protocol` を実行する。
- [x] Broad integrated branch gate: `bun run validate:packages` を実行する。
- [x] Broad integrated branch gate: `bun run check:dead-code` を実行する。
- [x] Broad integrated branch gate: `bun run test:api-snapshots` を実行する。
- [x] Broad integrated branch gate: `bun run test:package-resolution` を実行する。
- [x] Broad integrated branch gate: `bun run test:e2e:fixtures` を実行する。
- [x] `bun run validate:e2e` は release confidence、または real-local bridge/upload/routing/resume/lifecycle behavior が scope に入る場合だけ追加する（N/A: real-local bridge/upload/routing/resume/lifecycle の追加変更なし、fixture e2e を実行）。
- [x] Package output validation では `build`、`publint`、`attw` を並列実行せず、`bun run validate:packages` を使う。
