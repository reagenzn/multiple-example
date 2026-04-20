---
name: issue-implement
description: Implement a GitHub issue in this repo using the worktree flow — branch from `origin/main` inside a free worktree, implement + manually test, code-review, commit, push, and open a PR. Trigger when the user invokes `/issue-implement <number>` or asks to "implement issue #N" / "issue #N を実装して".
---

# Issue 実装ワークフロー (multiple-example)

引数: Issue 番号（例: `1`）または Issue URL。

## 概要

指定された Issue を worktree 上で実装し、CLAUDE.md の規約に沿って PR を作成するまでを一気通貫で担当する。

---

## 鉄則

- **wt0（メインリポ）で実装しない** — 必ず worktree（wt1〜wt5）を使う
- **rebase 禁止** — `main` の取り込みは `git merge` のみ。`git pull --rebase` / `git rebase` は絶対に使わない
- **ブランチは常に `origin/main` 最新から分岐** — ローカル `main` は古い可能性あり
- **`data.json` / `package-lock.json` / `scripts/` など無関係な変更を混ぜない**

---

## フェーズ1: 準備

1. **main を最新化**（wt0 で実行）

   ```bash
   cd /Users/natsuki.fukazawa/study/multiple-example
   git fetch origin main
   ```

2. **Issue の内容を取得**

   ```bash
   gh issue view <番号>
   ```

   タイトル、本文、受入条件（acceptance criteria）、ラベルを読む。

3. **空き worktree を選択**

   ```bash
   git worktree list
   ```

   `worktree/wtN`（初期ブランチ）のまま、かつ作業中でないものが空き。
   既に `feat/...` / `fix/...` がチェックアウトされている worktree は
   他セッションが使用中の可能性があるため避ける。空きがなければユーザに報告して停止。

4. **作業ブランチを作成**（worktree 内で実行）

   ブランチ名:
   - `feat/#<番号>-<slug>` — 機能追加
   - `fix/#<番号>-<slug>` — バグ修正
   - `chore/#<番号>-<slug>` — その他

   slug は Issue タイトルから英語ケバブケースで生成（短く、内容が分かる名前）。

   ```bash
   cd /Users/natsuki.fukazawa/study/multiple-example-worktrees/wtN
   git fetch origin main
   git checkout -b <ブランチ名> origin/main
   ```

5. **worktree パスを変数として記録**

   ```bash
   WT_DIR=/Users/natsuki.fukazawa/study/multiple-example-worktrees/wtN
   ```

   以降すべての操作は絶対パス (`$WT_DIR/...`) で行う。セッション切り替えは不要。

---

## フェーズ2: 実装

1. **依存インストール**（worktree ごとに独立）

   ```bash
   cd $WT_DIR && npm install
   ```

2. **受入条件を todo に分解** — 受入条件ごとに TodoWrite で管理する

3. **実装**

   - `server.js` — API 変更、バリデーションは 400 で返す
   - `public/index.html` — マークアップ追加
   - `public/app.js` — クライアントロジック（XSS 注意: ユーザ入力は `escapeHtml` を通すか `textContent` を使う）
   - `public/style.css` — スタイル追加

4. **後方互換**: 既存 `data.json` のスキーマを壊さない（任意フィールドは optional）

---

## フェーズ3: 動作確認（テスト）

本プロジェクトにテストフレームワークは無い。以下を必ず実施:

1. **ポート競合を解消**

   ```bash
   lsof -ti:<port> | xargs kill -9 2>/dev/null
   ```

   wt1=3100 / wt2=3200 / wt3=3300 / wt4=3400 / wt5=3500 を推奨（CLAUDE.md 参照）。

2. **サーバ起動**

   ```bash
   cd $WT_DIR
   rm -f data.json   # クリーンな状態で始めたい場合のみ
   PORT=<port> nohup node server.js > /tmp/wtN-server.log 2>&1 &
   sleep 1 && tail -3 /tmp/wtN-server.log    # "TODO app running" を確認
   ```

3. **API を curl で網羅テスト**

   - ゴールデンパス（正常系）
   - 受入条件に記載された境界
   - バリデーションエラー（400 が返ることの確認）
   - 既存データ互換（既存フィールドのみの POST/PUT が通ること）

4. **UI 確認**

   ```bash
   curl -s http://localhost:<port>/ | grep -E 'input|form'
   curl -s -o /dev/null -w "HTTP:%{http_code}\n" http://localhost:<port>/app.js
   curl -s -o /dev/null -w "HTTP:%{http_code}\n" http://localhost:<port>/style.css
   ```

   可能ならブラウザでもゴールデンパスを目視確認する。

5. **サーバ停止**

   ```bash
   lsof -ti:<port> | xargs kill -9
   ```

---

## フェーズ4: 品質チェック

1. **code-reviewer エージェント**で worktree 内の差分をレビューさせる

   ```
   git -C $WT_DIR diff
   ```

   を渡し、XSS・バリデーション欠落・API 契約不整合・エッジケースを重点確認。

2. Critical / Important の指摘があれば修正してフェーズ3に戻る。
   修正コストが高い場合はユーザに報告して判断を仰ぐ（PR で follow-up する選択肢もある）。

3. 結果をユーザに報告し、**ユーザの承認を待つ**。

---

## フェーズ5: PR 作成

ユーザの承認後:

1. **main の最新を取り込む**

   ```bash
   cd $WT_DIR
   git fetch origin main
   git merge origin/main
   ```

   コンフリクト時は手動解決後にフェーズ3 の API テストを再実行。

2. **ステージング**（無関係なファイルを混ぜないよう明示）

   ```bash
   git add server.js public/app.js public/index.html public/style.css
   # package-lock.json / data.json / scripts/ は add しない
   ```

3. **コミット**（Conventional Commits）

   ```bash
   git commit -m "feat: <short summary> (#<番号>)"
   ```

4. **プッシュ**

   ```bash
   git push -u origin <ブランチ名>
   ```

   reject された場合は `git fetch origin && git merge origin/<ブランチ名>` で解消（`pull --rebase` は禁止）。

5. **PR 作成**

   ```bash
   gh pr create --base main \
     --title "<conventional commit 形式> (#<番号>)" \
     --body "$(cat <<'EOF'
   ## Summary
   <要点2〜3行>

   ## Acceptance criteria
   - [x] ...

   ## Test plan
   - [x] curl で ...
   - [ ] ブラウザで ...

   Closes #<番号>
   EOF
   )"
   ```

6. PR URL をユーザに報告。

---

## フェーズ6: レビュー対応

1. CI/レビュアの指摘を取得

   ```bash
   gh pr view <PR番号> --comments
   gh api repos/{owner}/{repo}/pulls/<PR番号>/comments
   ```

2. 指摘をユーザに報告し、方針を確認する

3. 指示に従い修正 → コミット → プッシュ

### コンフリクト対応

PR が `CONFLICTING` になったら:

```bash
cd $WT_DIR
git fetch origin main
git merge origin/main
# コンフリクトを解決
git add <解決済みファイル>
git commit
# テスト再実行
git push
```

**⚠️ `git rebase` は絶対に使わない。**

---

## フェーズ7: クリーンアップ

ユーザが「片付けて」等と指示したら:

1. worktree を初期ブランチに戻す

   ```bash
   cd $WT_DIR
   git checkout worktree/wtN
   ```

2. 作業ブランチをローカルから削除

   ```bash
   git branch -d <ブランチ名>
   ```

3. worktree の初期ブランチを `origin/main` と同期

   ```bash
   git fetch origin main
   git merge origin/main
   ```

4. wt0 の `main` も最新化

   ```bash
   cd /Users/natsuki.fukazawa/study/multiple-example
   git pull origin main
   ```

---

## 注意事項

- 各フェーズの区切りでユーザに状況を報告する
- フェーズ4 の承認とフェーズ7 の開始はユーザの明示的な指示を待つ
- worktree では `node_modules` は独立（シンボリックリンクではない）
- `push` が reject された場合: `git pull --rebase` ではなく `git fetch origin && git merge origin/<ブランチ名>`
- 無関係なファイル（`package-lock.json` の副次更新、`scripts/` 配下など）を間違って commit しない
