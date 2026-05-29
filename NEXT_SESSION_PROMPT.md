# Next Session Prompt

次のセッションでは、以下をそのまま貼って開始してください。

```text
/home/sakasegawa/src/github.com/nyosegawa/agent-ui で作業してください。

最初に必ず `NEXT_SESSION_INSTRUCTIONS.md` を全文読んで、その指示に従ってください。
あわせて `AGENTS.md`、`CLAUDE.md`、`FIX_PLAN.md`、`FIX_TODO.md` も読んでください。

目的:
`FIX_PLAN.md` と `FIX_TODO.md` に従い、`FIX_TODO.md` の未完了チェックボックスがなくなるまで、S01 から順番に実装・テスト・docs更新・検証・チェック更新を継続してください。

重要:
- 日本語で報告してください。
- Bun を使ってください。
- upstream `/home/sakasegawa/src/github.com/openai/codex/codex-rs/app-server` は参照だけにし、変更しないでください。
- Agent UI を host runtime に広げないでください。
- 既存の未コミット変更を勝手に戻さないでください。
- commit/push は明示的に依頼されるまで行わないでください。
- `FIX_TODO.md` の checkbox は、実装・テスト・docs・必要な検証が完了したものだけ `- [x]` にしてください。
- 条件付き/N/A/Deferred/Decision の項目も未完了のまま残さず、理由を同じ行に追記して `- [x]` にしてください。
- 1 slice だけで止まらず、未完了 checkbox がなくなるまで継続してください。

作業手順:
1. `git status --short` と `FIX_TODO.md` の未完了 checkbox を確認する。
2. 先頭の未完了 slice を選ぶ。
3. 関連実装・テスト・docs を読んでから修正する。
4. focused validation を実行し、失敗したら直して再実行する。
5. 完了した checkbox だけ `FIX_TODO.md` で check する。
6. 次の未完了 checkbox に進む。

終了条件:
- `FIX_TODO.md` に `- [ ]` が 1 つも残っていない。
- 最終 Validation Checklist がすべて完了または理由付き N/A になっている。
- `git diff --check` が通っている。
- 実行した検証、変更内容、N/A 理由、残リスクを最終報告する。
```
