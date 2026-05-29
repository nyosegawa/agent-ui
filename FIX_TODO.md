# Agent UI Fix Todo

この checklist は `FIX_PLAN.md` と同じ 12 slices に沿っています。各項目は実装 PR で green にしてから完了扱いにします。

## P0

### S01 - Protocol Truth Bundle

- [ ] `tsc` が所有する Codex type-test gate を追加する。
- [ ] Codex type-test gate を通常の package/root typecheck path に組み込む。
- [ ] runtime-only Vitest から compile-only protocol/request-builder assertions を移す。
- [ ] stable helper が `thread/resume.excludeTurns` など field-level experimental params を reject する negative type tests を追加する。
- [ ] field-level experimental policy を raw/host-managed として文書化する。
- [ ] `StableMethodResultMap` / `ExperimentalMethodResultMap` の exact-key coverage を追加する。churn が大きい場合は P1 validation hardening に分ける。
- [ ] `docs/reference/codex-protocol.md` の method lists を `protocol.ts` / capability metadata に合わせて修正する。
- [ ] `thread/goal/*` を host-only docs に移す。
- [ ] `remoteControl/status/read`、`thread/search`、`thread/settings/update` を experimental docs に反映する。
- [ ] `permissionProfile/list`、`plugin/installed` を host-only docs に反映する。
- [ ] 固定 method-list sections だけを見る focused docs drift test を追加する。
- [ ] `docs/architecture/testing.md` に type-only assertions の置き場所を明記する。
- [ ] Completion: old false assertions/docs drift が typecheck/docs drift test で検出され、修正後に `bun run typecheck` と protocol tests が通る。

### S02 - React Resume Status And Canonical Thread Id

- [ ] `resumeThread()` で `normalizeThreadResumeResponse(result, { activate: true })` の events を順序通り dispatch する。
- [ ] resume 後の synthetic `thread/status/changed` to `ready` を削除する。
- [ ] requested id/path ではなく canonical `response.thread.id` を active にする。
- [ ] React resume params は stable-only のまま維持し、`excludeTurns`、`initialTurnsPage`、cursor ownership、paged resume defaults を追加しない。
- [ ] `thread-history.ts` の public exports を維持する。
- [ ] `thread-history.ts` を Codex normalizer への薄い compatibility wrapper にする。
- [ ] active/running resume status が `ready` に上書きされない test を追加する。
- [ ] requested id/path と response thread id が違う場合、canonical returned id が active になる test を追加する。
- [ ] runtime `initialTurnsPage` events が落ちないことを test する。ただし cursor storage/API は追加しない。
- [ ] hook/component docs の resume status/id 説明を更新する。
- [ ] Completion: running/active App Server resume が React state でも running/active のまま残り、resume-by-path は returned canonical thread id を active にする。

## P1

### S03 - React Read And Thread History Normalizer Boundary

- [ ] React `thread/read` handling を `normalizeThreadReadResponse()` に委譲する。
- [ ] `readThread({ activate: false })` が active thread を置き換えず state update できることを維持する。
- [ ] `thread-history.ts` compatibility helpers と Codex normalizer output の parity test を追加する。
- [ ] duplicate React snapshot normalizer が item aliases、`itemsView`、command output、file patches、text extraction で drift しないようにする。
- [ ] Completion: React read/snapshot path が Codex normalizer と同じ events を出し、public wrapper exports と hook signatures は維持される。

### S04 - Core Server Request Lifecycle And Fake Transport

- [ ] core server request queue 用の typed JSON-RPC request id key helper を追加する。
- [ ] internal key では numeric `0` と string `"0"` を区別する。
- [ ] public pending request objects、selectors、hooks、`respond()`、`reject()` では元の request id 型を維持する。
- [ ] same typed id + same thread の `serverRequest/created` を replay/idempotent refresh として扱う。
- [ ] same typed id + different thread の behavior を diagnostics + ignore として実装する。
- [ ] unknown `serverRequest/resolved` を no-op にする。
- [ ] duplicate `serverRequest/resolved` を no-op にする。
- [ ] `serverRequest/resolved` を cleanup-only とし、approval success や terminal turn success を推測しない。
- [ ] connection close/error で pending requests を cleanup する。
- [ ] stable server request kinds すべてで id type preservation の normalizer coverage を追加する。
- [ ] `FakeAgentTransport.close()` が `connection/closed` を drain してから iterator を complete するようにする。
- [ ] fake transport close で pending `next()` waiters を release する。
- [ ] stale fake transport iterator が reconnect events を消費しないようにする。
- [ ] fake responses/rejections maps も typed request id key を使う。
- [ ] Completion: numeric/string id が end-to-end で区別され、replay は idempotent、resolved は success を意味せず、fake close は real transports に近い semantics になる。

### S05 - Core Patch Retention Bound

- [ ] patch body eviction で落ちた synthetic patch-only ids を検出できるようにする。
- [ ] evicted synthetic patch-only ids を `turn.itemOrder` から prune する。
- [ ] authored item ids、command output ids、streaming/block ids、別の retained transcript surface を持つ ids は削除しない。
- [ ] patch refresh ordering は first-observed を維持する。
- [ ] live thread retention と authoritative snapshot replacement はこの slice に含めない。
- [ ] `filePatchByItemId`、`itemOrder`、`transcriptItemIds()`、visible-window counts が一緒に bounded になる test を追加する。
- [ ] authored item id が patch body eviction で消えない test を追加する。
- [ ] retention docs が bounded heavy bodies/indexes を主張している場合だけ更新する。
- [ ] Completion: patch-only retention が invisible stale ids を残して hidden counts や window slots を膨らませない。

### S06 - React Transcript And Composer UX

- [ ] running + empty textarea + no attachments + normal Enter を no-op にする。
- [ ] running + non-empty Enter は local follow-up queue のまま維持する。
- [ ] running + non-empty Cmd/Ctrl+Enter は immediate `turn/steer` のまま維持する。
- [ ] Stop button だけを explicit `turn/interrupt` path にする。
- [ ] pending approval に source metadata があり source が存在する場合、window 外でも source context を pin する。
- [ ] tail fallback を metadata-free、genuinely missing-source、explicit host-tail placement に限定する。
- [ ] `turnId` だけの approval anchor policy を決めて test する。
- [ ] actual `threadId` change で follow mode を reset する。
- [ ] actual `threadId` change で stale `Jump to latest` を clear する。
- [ ] same-anchor approval grouping を public API churn なしに入れられるか判断する。
- [ ] grouping を入れる場合、one `AgentApprovalQueue` per item/turn anchor の compact rows を test する。
- [ ] empty Enter no-interrupt test を追加する。
- [ ] running follow-up queue regression test を追加する。
- [ ] Stop button interrupt regression test を追加する。
- [ ] source-outside-window approval pinning test を追加する。
- [ ] source-missing tail fallback test を追加する。
- [ ] metadata-free tail fallback test を追加する。
- [ ] follow-scroll reset test を追加する。
- [ ] DOM placement が変わる場合、fixture Playwright で mobile reachability / hit testing を確認する。
- [ ] Completion: approval は transcript context で監査可能になり、empty Enter は running turn を止めず、thread switch は latest content を追う。

### S07 - Apps And Hooks Normalizer Boundary

- [ ] Codex `app/list` response normalization を `AgentApp.accessible` / `AgentApp.enabled` vocabulary に揃える。
- [ ] Codex `app/list/updated` notification normalization を response path と同じ fields に揃える。
- [ ] `installUrl`、description、logos、labels、branding、metadata、必要な plugin display metadata を保持する。
- [ ] `app/list` から `installed` を派生しない。
- [ ] `app/list` から `needsAuth` を派生しない。
- [ ] auth/install vocabulary は plugin host-only / plugin-specific APIs に残す。
- [ ] core `apps/updated` は scoped full replacement として維持する。
- [ ] cursor-page merge は React `useAgentApps()` 側の責務として維持する。
- [ ] React hooks から corrected Codex app/model normalizers を再利用する。
- [ ] upstream `HookMetadata.key` を `AgentHook.id` として normalize する。
- [ ] hooks が `id: "undefined"` を emit しないようにする。
- [ ] app response/update parity tests を追加する。
- [ ] core app replacement vs pagination merge tests を追加する。
- [ ] React app panel tests for accessible-but-disabled and inaccessible-but-enabled apps を追加する。
- [ ] upstream-shaped `HookMetadata` を使った hook key identity tests を追加する。
- [ ] docs/examples の stale install/auth wording を enabled/accessibility wording に更新する。
- [ ] `AgentApp` / `AgentHook` public fields が変わる場合は API snapshots を更新する。
- [ ] Completion: refresh と notification が同じ connector state を生成し、real upstream hooks が stable ids を持つ。

### S08 - Server Redaction And Startup Containment

- [ ] redaction credential-key table に OAuth query keys を追加する。
- [ ] structured snake_case keys の redaction を追加する。
- [ ] `access_token`、`refresh_token`、`id_token`、`client_secret` を cover する。
- [ ] bearer/API key/password/secret/device/user code families の既存 coverage を維持する。
- [ ] URL query delimiters を保持し、値だけ redact する。
- [ ] `status_code`、`exit_code`、`nextToken`、`pageToken`、`continuationToken`、`id`、`code`、`cursor` など non-secret guard tests を追加する。
- [ ] Express one-shot bridge creation を redacted `try` path に移す。
- [ ] Next one-shot bridge creation を redacted `try` path に移す。
- [ ] WebSocket post-admission bridge creation/startup を wrap する。
- [ ] WebSocket startup failure は close code `1011` と generic reason にする。
- [ ] partial child/bridge state を best-effort cleanup する。
- [ ] query strings、repeated params、mixed delimiters、nested host events、one-shot errors、bridge errors、dynamic-tool failures の redaction tests を追加する。
- [ ] spawn throw、missing stdio、missing binary、secret-bearing startup errors の tests を Express/Next/WebSocket に追加する。
- [ ] Completion: startup failure が unhandled/framework error として漏れず、OAuth-like secret が diagnostics、JSON errors、stderr、close reason に出ない。

### S09 - Server Security Defaults And Bridge Policy

- [ ] one-shot default narrowing を intentional security-sensitive breaking behavior として扱う。
- [ ] `DEFAULT_ONE_SHOT_METHODS` を read/list/status-shaped methods に狭める。
- [ ] default candidate に `account/read`、`account/rateLimits/read`、`model/list`、`thread/list`、`thread/loaded/list`、`thread/read`、`skills/list`、`hooks/list`、`app/list` を含める。
- [ ] `initialize` を one-shot default から外すか、外す理由と migration を明記する。
- [ ] auth mutations、thread mutations、turn control、config/skill writes を default deny にする。
- [ ] explicit `allowedMethods` と `"all"` opt-in を維持する。
- [ ] one-shot default-deny tests for mutation/turn/config/auth methods を追加する。
- [ ] one-shot explicit allowlist / `"all"` tests を追加する。
- [ ] full-chat WebSocket default は productized path として維持する。
- [ ] WebSocket browser request defaults を `stableProductizedMethods` 由来、または named tested delta にする。
- [ ] WebSocket default を one-shot と同じ read/list/status に狭めない。
- [ ] WebSocket source-of-truth / sensitive-family tests を追加する。
- [ ] direct upstream App Server WebSocket、Agent UI same-origin WebSocket bridge、one-shot HTTP RPC の trust boundary docs を書き直す。
- [ ] upstream browser `Origin` rejection が Agent UI bridge endpoint を守るものではないことを docs に明記する。
- [ ] Completion: one-shot は omission で安全になり、WebSocket は single source of truth に基づく full-chat path として維持され、docs が trust boundaries を混同しない。

### S10 - Dynamic Helper Permission Policy

- [ ] helper-thread `permissionsApproval` の unconditional grant を削除する。
- [ ] helper-specific permission policy option を追加する。
- [ ] default を `manual` にするか `deny` にするか決める。
- [ ] unsafe 旧挙動を残す場合は `grantRequestedForTurn` のような明示名にする。
- [ ] MCP tool approval auto-accept は `_meta.codex_approval_kind === "mcp_tool_call"` に限定して維持する。
- [ ] callback grants は requested permission subset に bound する。
- [ ] helper permission grants は最初の実装では turn-scoped にする。
- [ ] no-policy behavior test を追加する。
- [ ] manual/deny behavior tests を追加する。
- [ ] bounded callback subset grant tests を追加する。
- [ ] unrequested permission family denial tests を追加する。
- [ ] timeout and bridge close behavior tests を追加する。
- [ ] unsafe opt-in を ship する場合、その tests を追加する。
- [ ] dynamic-tool docs と migration notes を更新する。
- [ ] public option types が変わる場合は API snapshots を更新する。
- [ ] Completion: helper permissions は host-owned policy または明示 unsafe opt-in がない限り grant されない。

## P2

### S11 - Fixture, Validation Docs, And Release Evidence

- [ ] raw JSON-RPC fixtures の JSONL を parse し、sorted unique methods と manifest `methods` を比較する test を追加する。
- [ ] fixture `stability` metadata を追加するか、別 follow-up に分けるか決める。
- [ ] fixture coverage が Agent UI product support を意味しないことを docs に書く。
- [ ] `validate:packages` docs を `build -> test:packlist -> test:node-compat -> publint -> attw` に合わせる。
- [ ] major validation ladders の docs sync test を追加する。
- [ ] `check:dead-code` を rerun してから cleanup 対象を決める。
- [ ] store helper exports を public/internal どちらとして扱うか決めてから export cleanup する。
- [ ] public export を消す場合は breaking-change decision と API snapshots を伴わせる。
- [ ] Completion: fixture と validation docs が実 script/fixture に機械的に追従し、release evidence が過剰主張しない。

### S12 - Design System, Browser Contracts, And Package Runtime

- [ ] public stylesheet boundary guard を追加する。
- [ ] docs/examples で `@nyosegawa/agent-ui-react/dist/styles/*` deep import を禁止する。
- [ ] feasible なら private style chunks の package-resolution negative coverage を追加する。
- [ ] CodeMirror visual constants を既存 `--aui-*` tokens に寄せる。
- [ ] TS/TSX visual style guard を hard-coded font、spacing、line-height、outline、duration values に拡張する。
- [ ] dark/system token parity test を追加する。
- [ ] example HTML style-block guard coverage を追加する。
- [ ] same-anchor approval grouping が S06 に入らなかった場合、この slice で scoped follow-up にする。
- [ ] menu trigger current-value accessible name を追加する。
- [ ] context usage disclosure の focus return を補強する。
- [ ] first-run cancel-login copy を locale-owned key にする。
- [ ] large diff/table/tall approval behavior を決めるまで diff body scroll/height 変更や Playwright fixture を追加しない。
- [ ] Next sidecar upload cleanup を server close、`SIGINT`、`SIGTERM` に wire する。
- [ ] idempotent upload cleanup helper/test を追加する。
- [ ] build 後の web-components consumer smoke を追加する。
- [ ] Node LTS exact floor を決める。
- [ ] `>=20` を維持する場合は package-runtime evidence を追加する。
- [ ] `engines.node` を上げる場合は package metadata、docs、validation expectations を更新する。
- [ ] Completion: visual/package guard gaps が埋まり、heavy-body、Node、public package contracts を偶然変えない。

## Deferred / Decisions

- [ ] Field-level experimental API policy: current recommendation は stable helpers stable-only、raw/host-managed usage を docs に書く。typed opt-in は paged resume productization が決まった後。
- [ ] Paged resume / `thread/turns/list` cursor ownership: hook-local cursor state か core cursor state かを決めるまで public cursor API は追加しない。
- [ ] Authoritative snapshot replacement: rollback、redaction、complete snapshots の deletion scope、audit retention、active/live turn protection を設計してから実装する。
- [ ] Active flags / waiting-state public shape: forced `ready` は消すが、rich active/waiting model は additive status model として別途設計する。
- [ ] Live thread retention exception and orphan ordering: active/live/pending exception を維持するか、backing entities まで bounded にするかを決める。
- [ ] Large diff body policy: transcript-owned readable preview と explicit expansion の contract を決めてから CodeMirror height/scroll mechanics を変える。
- [ ] Dynamic helper permission default: `manual` と `deny` のどちらを default にするか決める。auto-grant は default にしない。
- [ ] Security-sensitive default release policy: one-shot narrowing と dynamic helper tightening は TypeScript API が additive でも behavioral breaking として扱う。
- [ ] WebSocket narrowing: deferred。current recommendation は productized full-chat default を `stableProductizedMethods` 由来にすること。
- [ ] Node LTS minimum: exact floor/engines change は package runtime work の中で別判断にする。
- [ ] Store helper exports: public/internal status を決めるまで dead-code cleanup で削除しない。
- [ ] Generated README absolute local path normalization: protocol import maintenance pass まで defer。
- [ ] Personal absolute paths in fixtures/demos: 触るタイミングで opportunistic に直す。
- [ ] Docs-site viewport smoke: docs-site が release-facing visual QA になるまで defer。
- [ ] Rich `AgentSkill` metadata: current primitive が必要とするまで defer。
- [ ] Plugin marketplace/install UI: Agent UI default product surface には入れない。
- [ ] MCP management panels and raw MCP tool/resource methods: host-owned として扱う。
- [ ] Realtime、process、remote control、thread settings/search、`thread/turns/items/list` など experimental/unsupported surfaces: default productized Agent UI scope には入れない。

## Validation Checklist

- [ ] Protocol/type/docs truth: Codex typecheck including type tests、protocol docs drift test、`bun run test:protocol`、root `bun run typecheck` を実行する。
- [ ] React resume/read: focused React hook/component tests、`thread-history` wrapper parity tests、relevant Codex normalizer tests、`bun run typecheck`、`bun run lint` を実行する。
- [ ] Core reducer/transport: core reducer/fake transport tests、`bun run test:fixtures`、`bun run typecheck` を実行する。wire normalizer shape が変わる場合は protocol tests も実行する。
- [ ] React UX/layout: focused React component tests を実行し、approval placement、composer behavior、focus、scrolling、mobile reachability が変わる場合は `bun run test:e2e:fixtures` を追加する。
- [ ] Apps/hooks: Codex normalizer tests、core reducer tests、React hook/panel tests、`bun run typecheck` を実行し、`AgentApp` / `AgentHook` declarations が変わる場合は API snapshots を実行する。
- [ ] Server security: WebSocket、Express、Next、redaction、one-shot policy、dynamic tools の focused server tests を実行し、public dynamic-helper option types が変わる場合は API snapshots を実行する。
- [ ] Design/styles: `bun run test:styles`、`bun run typecheck`、`bun run lint` を実行する。visible layout/overflow/focus behavior が変わる場合は fixture Playwright を追加する。
- [ ] Package/runtime: package output、export maps、copied CSS、built consumer smoke、Node engines、publish output が変わる場合は `bun run validate:packages` と `bun run test:package-resolution` を実行する。
- [ ] Broad integrated branch gate: `bun run validate:fast` を実行する。
- [ ] Broad integrated branch gate: `bun run validate:protocol` を実行する。
- [ ] Broad integrated branch gate: `bun run validate:packages` を実行する。
- [ ] Broad integrated branch gate: `bun run check:dead-code` を実行する。
- [ ] Broad integrated branch gate: `bun run test:api-snapshots` を実行する。
- [ ] Broad integrated branch gate: `bun run test:package-resolution` を実行する。
- [ ] Broad integrated branch gate: `bun run test:e2e:fixtures` を実行する。
- [ ] `bun run validate:e2e` は release confidence、または real-local bridge/upload/routing/resume/lifecycle behavior が scope に入る場合だけ追加する。
- [ ] Package output validation では `build`、`publint`、`attw` を並列実行せず、`bun run validate:packages` を使う。
