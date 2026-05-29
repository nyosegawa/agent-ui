# Agent UI Fix Plan

この計画は、`agent-ui` と upstream `/home/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` の調査、および 10 ラウンド・40 件の subagent レポートを統合した修正計画です。目的は、Agent UI を host runtime に広げず、Codex App Server 向け UI component library としての境界を保ったまま、protocol truth、core state invariant、React transcript UX、server bridge default を現在の App Server contract に揃えることです。

この文書は実装修正そのものではありません。upstream App Server の変更も含みません。

## Current Assessment

実装は全体として方向性が良く、特に以下は残すべき強い土台です。

- package boundary がきれいです。`@nyosegawa/agent-ui-core` は normalized state、`@nyosegawa/agent-ui-codex` は Codex protocol adaptation、`@nyosegawa/agent-ui-react` は composable UI、`@nyosegawa/agent-ui-server` は Node bridge helper に分かれています。
- React は transcript-first の思想に沿っています。通常メッセージは会話内に残り、重い command output / diff / diagnostics は disclosure に逃がし、approval も transcript 内に配置されています。
- generated Codex schema の所有権は比較的堅いです。生成メタデータ、package packlist、API snapshot、package resolution smoke など、public package と protocol surface を守る仕組みがあります。
- core state は reducer / selector / store helper によって読みやすく整理されています。`itemsView` など、snapshot merge で full item data を落とさない工夫も良いです。
- server bridge は example code としてはかなり強く、admission hook、browser method filtering、inbound size limit、slow consumer 対策、redaction の集中化が既にあります。
- design system は `--aui-*` token contract を中心に成熟しています。raw color/radius/selector drift を防ぐ style guard も既にあります。

一方で、残っている問題は「設計不在」ではなく、主に protocol drift、boundary mismatch、default-policy risk、docs/test が実装に追いついていない箇所です。優先順位はその前提で絞ります。

## Priority Model

### P0

P0 は、現行 public/default behavior が明確に誤る、または protocol support の説明に false confidence を生むものに限定します。

- **Protocol truth bundle**: Codex の type-only assertion が `tsc` によって検証されておらず、protocol method docs も `protocol.ts` と drift しています。field-level experimental fields は upstream schema/runtime にはありますが、Agent UI の stable typed facade には出していないため、raw/host-managed として明確化します。
- **React resume boundary**: `resumeThread()` が upstream response status を `ready` に上書きし、requested id/path を active にする可能性があります。App Server の `thread/resume` は canonical `response.thread.id` と active/running status を返しうるため、これは runtime correctness の P0 です。

### P1

P1 は、security、public API、UX contract、core invariant に影響する確認済みのリスクです。

- JSON-RPC-lite id type を消してしまう server request queue と fake transport close semantics。
- `serverRequest/resolved` を approval success のように扱える余地。
- empty Enter が running turn を interrupt しうる composer behavior。
- windowing により approval が source context から外れる transcript UX。
- `app/list` response/update の vocabulary drift と `hooks/list` identity の欠落。
- one-shot HTTP RPC default が broad すぎること、dynamic helper permission auto-grant、OAuth/snake_case redaction gap。

### P2

P2 は、実害はあるが P0/P1 より狭い correctness、validation、design-system、package runtime confidence です。

- file patch body eviction 後に synthetic patch-only `itemOrder` が残る retention gap。
- CodeMirror theme constants や TS/TSX inline visual style guard の不足。
- raw JSONL fixture manifest と実ファイル method list の機械的検証不足。
- validation docs と実 script order の drift。
- Next sidecar upload cleanup、built web-components consumer smoke、Node LTS floor proof。

### Deferred / Decision

以下は見つかったものの、product/API decision が先に必要です。

- field-level experimental typed API shape。
- paged resume / `thread/turns/list` cursor ownership。
- authoritative snapshot replacement for rollback/redaction/full snapshots。
- richer active flags / waiting-state public model。
- live thread entity retention policy。
- large diff / heavy body scroll contract。
- Node engines を `>=20` から上げるかどうか。
- store helper exports を public とみなすか internal とみなすか。

## Implementation Slices

### Slice 01 - P0 Protocol Truth Bundle

目的: Codex protocol surface を docs と typecheck の両方で実態に合わせ、false confidence をなくします。

主要ファイル:

- `packages/codex/package.json`
- `packages/codex/tsconfig.type-tests.json`
- `packages/codex/test/type-tests/*`
- `packages/codex/test/session-api.test.ts`
- `packages/codex/src/method-results.ts`
- `packages/codex/test/protocol.test.ts`
- `docs/reference/codex-protocol.md`
- `docs/architecture/testing.md`

作業:

- `tsc` が所有する Codex type-test gate を追加し、通常の typecheck path に組み込みます。
- runtime-only Vitest にある `Assert<Equal<...>>`、`satisfies`、`@ts-expect-error` 系の compile-only assertion を type-test に移します。
- stable helper が `thread/resume.excludeTurns` など field-level experimental params を受け取らないことを negative type test で固定します。
- field-level experimental fields は現時点では `requestRaw()` + `experimentalApi: true` による raw/host-managed surface として文書化します。
- protocol method docs を `protocol.ts` / capability metadata に合わせます。既知 correction は `thread/goal/*` の host-only への移動、`remoteControl/status/read`、`thread/search`、`thread/settings/update`、`permissionProfile/list`、`plugin/installed` の反映です。
- Markdown 全体を brittle に解析せず、固定 method-list section だけを見る focused docs drift test を追加します。
- method result map exactness は同じ bundle に入れられるなら入れます。churn が大きければ P1 validation hardening に分離します。

検証:

- `bun run --filter @nyosegawa/agent-ui-codex typecheck`
- `bun run test packages/codex/test/session-api.test.ts packages/codex/test/protocol.test.ts`
- `bun run test:protocol`
- `bun run typecheck`
- `bun run lint`

breaking candidate: runtime break は想定しません。docs/type truth correction です。

### Slice 02 - P0 React Resume Boundary

目的: React public hook の resume 処理を upstream App Server semantics と Codex normalizer に合わせます。

主要ファイル:

- `packages/react/src/hooks/thread.ts`
- `packages/react/src/thread-history.ts`
- `packages/react/src/request-options.ts`
- `packages/react/test/thread-history.vitest.ts`
- `packages/react/test/components.vitest.tsx`
- `docs/reference/hooks.md`
- `docs/reference/react-components.md`

作業:

- `resumeThread()` で `normalizeThreadResumeResponse(result, { activate: true })` の events を順序通り dispatch します。
- resume 後の synthetic `thread/status/changed` to `ready` を削除します。
- active thread は requested id/path ではなく canonical `response.thread.id` にします。
- runtime response に `initialTurnsPage` がある場合は normalized events として保持しますが、cursor storage や React pagination API は productize しません。
- `thread-history.ts` は public export として残し、Codex normalizer への薄い互換 wrapper にします。削除はしません。
- `readThread()` の normalizer delegation は boundary を揃える目的で近い slice に含めてもよいですが、P0 の核は resume status/id です。

検証:

- running/active resume status が `ready` に潰れない test。
- requested id/path と response thread id が異なるとき canonical id が active になる test。
- `thread-history.ts` wrapper parity test。
- `initialTurnsPage` event が runtime に来ても落ちない test。ただし cursor ownership は持たないことを明記します。
- `bun run test packages/react/test/thread-history.vitest.ts packages/react/test/components.vitest.tsx`
- `bun run typecheck`
- `bun run lint`

breaking candidate: correctness fix ですが、forced `ready` や requested-id activation に依存していた host には挙動変更です。

### Slice 03 - P1 Core Server Request Lifecycle And Fake Transport

目的: JSON-RPC-lite id semantics、server request replay/cleanup、fake transport close contract を揃えます。

主要ファイル:

- `packages/core/src/request-id-key.ts` または internal equivalent
- `packages/core/src/stores/server-request.ts`
- `packages/core/src/reducer/server-requests.ts`
- `packages/core/src/reducer/connection.ts`
- `packages/core/src/fake-transport.ts`
- `packages/codex/src/normalizers/server-requests.ts`
- `packages/core/test/reducer.test.ts`
- `packages/core/test/fake-transport.test.ts`
- `packages/codex/test/protocol.test.ts`

作業:

- internal queue key は `number:0` と `string:0` を区別する typed request id key にします。
- public `PendingServerRequest.id`、selector、`respond()`、`reject()` の id は元の型を維持します。
- same typed id + same thread の `serverRequest/created` は idempotent replay/refresh とします。
- same typed id + different thread は protocol invariant violation とし、diagnostic を出して ignore する方針を第一候補にします。
- `serverRequest/resolved` は cleanup tombstone として扱い、success/approval acceptance を推測しません。
- connection close/error では pending request を cleanup しますが、approval success は fabricate しません。
- `FakeAgentTransport.close()` は `connection/closed` を drain した後 iterator を complete し、pending waiter を解放し、stale iterator が reconnect event を消費しないようにします。

検証:

- numeric `0` と string `"0"` の distinction。
- same-thread replay、different-thread duplicate diagnostic/ignore。
- unknown/duplicate resolved no-op。
- resolved-before-turn-completed cleanup-only。
- connection close cleanup。
- fake transport close drain/done、pending `next()` release、reconnect isolation。
- `bun run test packages/core/test/reducer.test.ts packages/core/test/fake-transport.test.ts`
- `bun run test:protocol` if normalizer shape changes.
- `bun run typecheck`

breaking candidate: raw core state map key を直接読んでいる host には internal key の見え方が変わります。public selector と request id は維持します。

### Slice 04 - P2 Core Patch Retention Bound

目的: retained file patch body と transcript index の bounded behavior を一致させます。

主要ファイル:

- `packages/core/src/stores/item.ts`
- `packages/core/src/retention.ts`
- `packages/core/test/reducer.test.ts`
- retention docs if they claim bounded indexes

作業:

- patch body eviction で落ちた synthetic patch-only ids を把握します。
- authored item、command output、streaming/block、または別の retained transcript surface を持つ id は削除しません。
- evicted patch-only id だけを `turn.itemOrder` から pruning します。
- patch refresh ordering は first-observed を維持します。
- live thread retention や authoritative snapshot replacement はこの slice に入れません。

検証:

- `filePatchByItemId`、`itemOrder`、`transcriptItemIds()`、visible-window counts が一緒に bounded になる test。
- authored item id が patch body eviction で消えない test。
- `bun run test packages/core/test/reducer.test.ts`

breaking candidate: evicted synthetic patch-only ids が raw transcript index から消えます。既存 heavy-body retention の意図に合わせる変更です。

### Slice 05 - P1 React Transcript And Composer UX

目的: transcript-first UX の auditability と running composer semantics を直します。

主要ファイル:

- `packages/react/src/components/composer.tsx`
- `packages/react/src/transcript-window.ts`
- `packages/react/src/timeline/windowing.ts`
- `packages/react/src/timeline/approval-anchors.tsx`
- `packages/react/src/timeline/scroll-follow.ts`
- `packages/react/src/components/thread.tsx`
- `packages/react/test/components.vitest.tsx`
- `docs/reference/react-components.md`

作業:

- running + empty textarea + no attachments + normal Enter は no-op にします。
- non-empty Enter は既存通り local follow-up queue、Cmd/Ctrl+Enter は non-empty input の immediate steer、Stop button は明示的な `turn/interrupt` とします。
- pending approval に `itemId` / `turnId` metadata があり source が存在する場合、window 外でも source context を pin して approval を近くに表示します。
- tail fallback は metadata-free、source missing、または host が明示した tail placement に限定します。
- actual `threadId` change で follow mode と stale `Jump to latest` を reset します。
- same-anchor approval grouping は public API churn なしに小さく入る場合のみこの slice に含めます。group renderer が必要なら P2 follow-up に落とします。

検証:

- empty Enter no-op、non-empty follow-up、Cmd/Ctrl+Enter steer、Stop interrupt の component tests。
- windowed-but-existing source pinning、missing-source tail fallback、metadata-free tail fallback、turn-only anchor policy。
- follow-scroll reset test。
- DOM placement が変わる場合は `bun run test:e2e:fixtures` と desktop/mobile manual browser review。
- `bun run test packages/react/test/components.vitest.tsx`
- `bun run typecheck`
- `bun run lint`

breaking candidate: empty Enter で turn が止まらなくなります。approval placement と hidden count 表示も変わる可能性があります。

### Slice 06 - P1 Apps And Hooks Normalizer Boundary

目的: App Server の Apps/connectors surface と hook metadata を Agent UI の public state に正しく写します。

主要ファイル:

- `packages/codex/src/normalizers/apps.ts`
- `packages/react/src/hooks/apps.ts`
- `packages/react/src/hooks/models.ts`
- `packages/react/src/hooks/connectors.ts`
- `packages/core/src/state/apps.ts`
- `packages/core/src/state/hooks.ts`
- `packages/core/test/reducer.test.ts`
- `packages/codex/test/protocol.test.ts`
- `packages/react/test/components.vitest.tsx`
- `docs/reference/hooks.md`
- `docs/reference/codex-protocol.md`
- `examples/local-react-vite/src/fixtures/gallery.ts`

作業:

- `app/list` response と `app/list/updated` notification の normalized `AgentApp` fields を揃えます。
- `isAccessible -> accessible`、`isEnabled -> enabled`、`installUrl`、description、logos、labels、branding、metadata、必要なら `pluginDisplayNames` を保持します。
- `app/list` から `installed` / `needsAuth` を派生しません。auth/install vocabulary は plugin-specific / host-only surfaces に残します。
- core `apps/updated` は scoped replacement、React hook の pagination merge は hook 側の責務として分けます。
- upstream `HookMetadata.key` を `AgentHook.id` にします。`id: "undefined"` を出さないようにします。
- `AgentSkill` enrich は現時点では defer します。

検証:

- app normalizer response/update parity tests。
- `installed` / `needsAuth` absence tests。
- core scoped replacement tests。
- React app pagination/notification tests。
- hook key identity tests with upstream-shaped data。
- `bun run test packages/codex/test/protocol.test.ts packages/core/test/reducer.test.ts packages/react/test/components.vitest.tsx`
- `bun run typecheck`
- `bun run lint`
- `bun run test:api-snapshots` if `AgentApp` or `AgentHook` declarations change.

breaking candidate: `AgentApp.installed` / `needsAuth` を `app/list` state から読んでいた host は `enabled` / `accessible` または plugin-specific APIs に移行が必要です。

### Slice 07 - P1 Server Redaction And Startup Containment

目的: secret を含む diagnostics と startup failure を deterministic かつ redacted にします。

主要ファイル:

- `packages/server/src/redaction.ts`
- `packages/server/src/bridge.ts`
- `packages/server/src/express.ts`
- `packages/server/src/next.ts`
- `packages/server/src/websocket.ts`
- `packages/server/test/redaction.test.ts`
- `packages/server/test/express.test.ts`
- `packages/server/test/next.test.ts`
- `packages/server/test/websocket.test.ts`

作業:

- explicit credential-key table を拡張し、OAuth query keys、snake_case structured keys、bearer/API key/password/secret/device/user code families を扱います。
- URL query delimiter は保持し、値だけを redact します。
- `nextToken`、`pageToken`、`continuationToken`、`status_code`、`exit_code`、`id`、`code`、`cursor` など non-secret debug/pagination fields を broad suffix rule で潰さないよう guard tests を置きます。
- Express/Next one-shot bridge creation を redacted `try` path に入れます。
- WebSocket post-admission bridge creation/startup を wrap し、startup failure は close code `1011` と generic reason にします。
- partial child/bridge state は best-effort cleanup します。

検証:

- OAuth query、repeated params、mixed delimiters、nested host events、one-shot errors、bridge errors、dynamic-tool failure text の redaction tests。
- spawn throw、missing stdio、missing binary、secret-bearing startup error の Express/Next/WebSocket tests。
- `bun run test packages/server/test/redaction.test.ts packages/server/test/express.test.ts packages/server/test/next.test.ts packages/server/test/websocket.test.ts`
- `bun run typecheck`
- `bun run lint`

breaking candidate: error/log shape が変わります。security bugfix として扱います。

### Slice 08 - P1 Server One-Shot Defaults And WebSocket Policy

目的: one-shot HTTP RPC と full-chat WebSocket bridge の trust boundary を分け、browser-facing default を明示します。

主要ファイル:

- `packages/server/src/one-shot-rpc-policy.ts`
- `packages/server/src/websocket.ts`
- optional private `packages/server/src/browser-method-policy.ts`
- `packages/server/test/one-shot-rpc-policy.test.ts`
- `packages/server/test/express.test.ts`
- `packages/server/test/next.test.ts`
- `packages/server/test/websocket.test.ts`
- `docs/reference/server-bridge.md`
- `docs/architecture/security.md`

作業:

- one-shot defaults を read/list/status-shaped methods に狭めます。候補は `account/read`、`account/rateLimits/read`、`model/list`、`thread/list`、`thread/loaded/list`、`thread/read`、`skills/list`、`hooks/list`、`app/list` です。
- `initialize`、auth mutation、thread mutation、turn control、config/skill writes は default から外し、明示 `allowedMethods` または `"all"` を要求します。
- full-chat WebSocket default は productized full-chat path として維持し、`stableProductizedMethods` 由来または named delta として test します。one-shot と同じ read-only default にはしません。
- docs では direct upstream App Server WebSocket、Agent UI same-origin WebSocket bridge、one-shot HTTP RPC を明確に分けます。
- upstream direct WebSocket の browser `Origin` rejection が Agent UI bridge endpoint の protection ではないことを明記します。

検証:

- one-shot default allow exact safe set。
- mutation/turn/config/auth methods default deny before spawn。
- explicit allowlist と `"all"` の opt-in tests。
- WebSocket default equals productized source or named delta tests。
- `bun run test packages/server/test/one-shot-rpc-policy.test.ts packages/server/test/express.test.ts packages/server/test/next.test.ts packages/server/test/websocket.test.ts`
- `bun run typecheck`
- `bun run lint`

breaking candidate: one-shot default narrowing は behaviorally breaking な security default change です。

### Slice 09 - P1 Dynamic Helper Permission Policy

目的: internal helper thread の filesystem/network permission auto-grant をやめ、host-owned policy に戻します。

主要ファイル:

- `packages/server/src/dynamic-tools.ts`
- `packages/server/src/websocket.ts`
- `packages/server/src/server-request-policy.ts`
- `packages/server/test/dynamic-tools.test.ts`
- `packages/server/test/websocket.test.ts`
- `docs/reference/server-bridge.md`
- `docs/architecture/security.md`
- API snapshots if public option types change

作業:

- `_meta.codex_approval_kind === "mcp_tool_call"` の MCP tool approval shortcut は維持します。
- helper-thread `permissionsApproval` の unconditional grant を削除します。
- helper-specific policy を追加します。候補は `"manual" | "deny" | "grantRequestedForTurn" | callback` です。
- default は実装前に `manual` か `deny` を決めます。unsafe 旧挙動を残す場合は `grantRequestedForTurn` のように危険性が明確な名前にします。
- callback grants は requested subset に bound し、最初の実装では turn-scoped にします。
- docs に host authorization、workspace isolation、audit、resource-limit responsibility を書きます。

検証:

- no policy で auto-grant しない test。
- manual/deny behavior。
- bounded callback subset grant。
- unrequested permission family denial。
- timeout/bridge close behavior。
- unsafe opt-in if shipped。
- `bun run test packages/server/test/dynamic-tools.test.ts packages/server/test/websocket.test.ts`
- `bun run typecheck`
- `bun run lint`
- `bun run test:api-snapshots` if public option types change.

breaking candidate: helper permissions を暗黙 grant に依存していた host には behavioral break です。

### Slice 10 - P2 Fixture And Validation Docs Hardening

目的: release evidence と validation docs を機械的に信用できる状態にします。

主要ファイル:

- `packages/codex/test/raw-jsonrpc-fixtures.test.ts`
- raw fixture manifest files
- `docs/reference/codex-protocol.md`
- `docs/architecture/testing.md`
- `docs/architecture/toolchain.md`
- new or existing validation docs sync test
- `package.json`

作業:

- 各 raw JSONL fixture を parse し、sorted unique `method` values と manifest `methods` を比較します。
- small follow-up として収まるなら `stability` metadata を追加します。
- fixture coverage は product support を意味しないことを docs に明記します。
- `validate:packages` の説明を実 script order に合わせます: `build -> test:packlist -> test:node-compat -> publint -> attw`。
- major validation ladders の docs sync test を追加します。
- dead-code cleanup は `check:dead-code` を rerun し、public/internal export decision をしてから行います。

検証:

- `bun run test packages/codex/test/raw-jsonrpc-fixtures.test.ts`
- docs sync test。
- `bun run test:protocol`
- `bun run lint`
- `bun run check:dead-code` only for cleanup part.
- `bun run test:api-snapshots` if public exports change.

breaking candidate: fixture/docs tests 自体に runtime break はありません。

### Slice 11 - P2 Design-System And Browser-Visible Contracts

目的: visual guard gap を埋めつつ、transcript behavior を不用意に変えないようにします。

主要ファイル:

- `packages/react/src/diff-viewer.tsx`
- `packages/react/src/styles/tokens.css`
- `packages/react/src/styles/diff-utilities.css`
- `packages/react/test/style-duplication.vitest.ts`
- `packages/react/test/source-structure.vitest.ts` or package-resolution tests
- `examples/codex-local-web/index.html`
- `docs/guides/theming.md`
- `docs/reference/react-components.md`

作業:

- public stylesheet boundary を guard します。docs/examples の `@nyosegawa/agent-ui-react/dist/styles/*` deep import を禁止します。
- CodeMirror visual constants を既存 `--aui-*` tokens に寄せます。
- TS/TSX visual guard を `fontSize`、`fontFamily`、`lineHeight`、spacing、`gap`、`outline`、`outlineOffset`、duration へ拡張します。
- dark/system token parity と example HTML style guard を追加します。
- large diff/table/tall approval は heavy-body policy を決めるまで実装を急ぎません。
- menu trigger current-value a11y、context usage focus return、first-run localized cancel-login copy は scoped UI polish として扱います。

検証:

- `bun run test:styles`
- `bun run typecheck`
- `bun run lint`
- packaged CSS/export boundary が変わる場合は `bun run validate:packages` と `bun run test:package-resolution`
- visible layout/focus/overflow が変わる場合は `bun run test:e2e:fixtures` と manual desktop/mobile browser review.

breaking candidate: undocumented deep stylesheet imports を明示的に block する可能性があります。

### Slice 12 - P2 Package And Example Runtime Validation

目的: package output と examples の runtime confidence を強めます。

主要ファイル:

- `examples/next-with-bridge-sidecar/server.ts`
- example upload cleanup helper/tests
- package runtime smoke scripts
- `scripts/package-resolution-smoke.mjs`
- `scripts/node-compat-smoke.mjs`
- package metadata if Node engines change

作業:

- Next sidecar upload cleanup を server close、`SIGINT`、`SIGTERM` に wire します。
- build 後の web-components consumer smoke を追加します。`@nyosegawa/agent-ui-web-components` を import し、`defineAgentChatElement()` と no-transport render を確認します。
- Node LTS promise を決めます。`>=20` を維持するなら exact/current LTS package-runtime evidence を追加し、上げるなら別 compatibility change として扱います。
- docs-site viewport smoke は docs-site が release-facing visual QA になるまで defer します。

検証:

- focused example cleanup test。
- `bun run validate:packages`
- `bun run test:package-resolution`
- `bun run test:api-snapshots` if declarations, exports, or engines change.
- Node compatibility smoke only after Node floor decision.

breaking candidate: `engines.node` を上げる場合は package compatibility break です。

## Validation Strategy

常に全部を走らせるのではなく、slice に応じて trigger-based にします。

| Slice class | Focused validation | Add only when triggered |
|---|---|---|
| Protocol/type/docs truth | Codex typecheck including type tests, docs drift test, `bun run test:protocol`, root `bun run typecheck` | API snapshots only for exported API changes |
| React resume/read | React hook/component tests, `thread-history` parity, Codex normalizer tests, `typecheck`, `lint` | Fixture e2e only for visible routing/composer/sidebar behavior |
| Core reducer/transport | core reducer/fake transport tests, `bun run test:fixtures`, `typecheck` | Protocol tests if raw normalizer shape changes |
| React UX/layout | component tests, fixture Playwright for approval/composer/focus/scroll/mobile reachability | Manual browser review for desktop/mobile hit testing and overflow |
| Apps/hooks | Codex normalizer, core reducer, React hook/panel tests, `typecheck`, `lint` | API snapshots for `AgentApp` / `AgentHook` public fields |
| Server security | focused server tests, `typecheck`, `lint` | API snapshots for public dynamic-helper option types; real-local only for bridge/upload/routing lifecycle |
| Design/styles | `bun run test:styles`, `typecheck`, `lint` | `validate:packages` for packaged CSS/export boundary |
| Package/runtime | `bun run validate:packages`, `bun run test:package-resolution` | API snapshots and Node compatibility matrix for engines/package promises |

Broad integrated branch では CI に寄せて以下を走らせます。

```sh
bun run validate:fast
bun run validate:protocol
bun run validate:packages
bun run check:dead-code
bun run test:api-snapshots
bun run test:package-resolution
bun run test:e2e:fixtures
```

`bun run validate:e2e` は release confidence、または real-local App Server-backed bridge/upload/routing/resume/lifecycle behavior が scope に入る場合に追加します。

Package output では `build`、`publint`、`attw` を並列実行しません。`bun run validate:packages` に任せます。

## Explicit Breaking Change Candidates

- one-shot HTTP RPC default narrowing。
- dynamic helper permission auto-grant removal / default tightening。
- React resume status/id correction。
- `app/list` normalized state から plugin/auth vocabulary を外し、`enabled` / `accessible` に寄せること。
- `AgentHook.id` を upstream `HookMetadata.key` に直すこと。
- internal server request queue typed keys。
- WebSocket default narrowing を将来選ぶ場合。
- package `engines.node` を上げる場合。
- public store helper exports や `thread-history.ts` exports を削除する場合。今回の計画では削除しません。

## Decisions Before Implementation

- Dynamic helper permission default を `manual` にするか `deny` にするか。
- field-level experimental API は raw-only を維持するか、typed opt-in を別 surface として追加するか。
- paged resume cursor を hook-local state に持つか core state に持つか。
- authoritative snapshot replacement の deletion scope、audit retention、active/live turn protection。
- large diff / heavy body の transcript contract。
- Node LTS exact floor。
- store helper exports の public/internal status。

推奨は、まず Slice 01 と Slice 02 を green な小さな PR として実装し、その後 P1 security/core/UX を順番に進めることです。Deferred items は、関連 slice に入れる前に product/API decision と validation trigger を明文化してください。
