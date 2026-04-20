#!/bin/bash

set -e

# === Worktree セットアップスクリプト ===
# 指定したローカルgitリポジトリに対して5つのworktree (wt1〜wt5) を作成する
#
# 使い方:
#   setup-worktrees <リポジトリパス> [ベースブランチ]
#
# 例:
#   setup-worktrees ~/aix_workspace/aix-aq-ai-datalake-builder-analysis
#   setup-worktrees ~/aix_workspace/aix-aq-ai-datalake-builder-analysis develop

REPO_PATH="$1"
BASE_BRANCH="${2:-main}"
WORKTREE_COUNT=5

if [ -z "$REPO_PATH" ]; then
  echo "Usage: setup-worktrees <リポジトリパス> [ベースブランチ(default: main)]"
  echo ""
  echo "例:"
  echo "  setup-worktrees ~/projects/my-app"
  echo "  setup-worktrees ~/projects/my-app develop"
  exit 1
fi

# 絶対パスに変換
REPO_PATH=$(cd "$REPO_PATH" 2>/dev/null && pwd)
if [ ! -d "$REPO_PATH/.git" ]; then
  echo "Error: $REPO_PATH はgitリポジトリではありません"
  exit 1
fi

REPO_NAME=$(basename "$REPO_PATH")
REPO_PARENT=$(dirname "$REPO_PATH")
WORKTREES_DIR="$REPO_PARENT/${REPO_NAME}-worktrees"

echo "=== Worktree セットアップ ==="
echo "リポジトリ: $REPO_PATH"
echo "ベースブランチ: $BASE_BRANCH"
echo "Worktree格納先: $WORKTREES_DIR"
echo ""

# ベースブランチを最新化
echo ">>> ベースブランチ ($BASE_BRANCH) を最新化..."
cd "$REPO_PATH"
git fetch origin "$BASE_BRANCH"
git checkout "$BASE_BRANCH" 2>/dev/null || true
git pull origin "$BASE_BRANCH"

# worktrees ディレクトリ作成
mkdir -p "$WORKTREES_DIR"

# コピー対象の env ファイルを再帰的に収集（node_modules, .git, dist, .next, cdk.out は除外）
ENV_FILES=()
while IFS= read -r envpath; do
  # リポジトリルートからの相対パス
  rel="${envpath#$REPO_PATH/}"
  ENV_FILES+=("$rel")
done < <(find "$REPO_PATH" \
  -path "*/node_modules" -prune -o \
  -path "*/.git" -prune -o \
  -path "*/dist" -prune -o \
  -path "*/.next" -prune -o \
  -path "*/cdk.out" -prune -o \
  \( -name ".env" -o -name ".env.development" -o -name ".env.local" \) -type f -print)

if [ ${#ENV_FILES[@]} -gt 0 ]; then
  echo ">>> ハードリンク対象の環境変数ファイル:"
  for f in "${ENV_FILES[@]}"; do
    echo "    - $f"
  done
  echo ""
fi

# wt1〜wt5 を作成
for i in $(seq 1 $WORKTREE_COUNT); do
  WT_NAME="wt${i}"
  WT_PATH="$WORKTREES_DIR/$WT_NAME"
  WT_BRANCH="worktree/$WT_NAME"

  echo ">>> [$WT_NAME] 作成中..."

  if [ -d "$WT_PATH" ]; then
    echo "    スキップ: $WT_PATH は既に存在します"
    continue
  fi

  # worktree 用のブランチを作成（既存なら再利用）
  cd "$REPO_PATH"
  if git show-ref --verify --quiet "refs/heads/$WT_BRANCH"; then
    echo "    ブランチ $WT_BRANCH は既に存在します（再利用）"
  else
    git branch "$WT_BRANCH" "origin/$BASE_BRANCH"
  fi

  # worktree を追加
  git worktree add "$WT_PATH" "$WT_BRANCH"

  # env ファイルをハードリンク
  for envfile in "${ENV_FILES[@]}"; do
    src="$REPO_PATH/$envfile"
    dest="$WT_PATH/$envfile"
    dest_dir=$(dirname "$dest")
    mkdir -p "$dest_dir"
    ln "$src" "$dest"
    echo "    リンク: $envfile"
  done

  # node_modules をメインリポジトリから再帰的にシンボリックリンク
  while IFS= read -r nm; do
    rel="${nm#$REPO_PATH/}"
    dest="$WT_PATH/$rel"
    dest_dir=$(dirname "$dest")
    if [ -d "$dest_dir" ] && [ ! -e "$dest" ]; then
      ln -s "$nm" "$dest"
      echo "    シンボリックリンク: $rel"
    fi
  done < <(find "$REPO_PATH" \
    -path "*/.git" -prune -o \
    -path "*/dist" -prune -o \
    -path "*/.next" -prune -o \
    -path "*/cdk.out" -prune -o \
    -name "node_modules" -type d -not -path "*/node_modules/*" -print)

  # .husky/_ をメインリポジトリからシンボリックリンク
  if [ -d "$REPO_PATH/.husky/_" ] && [ ! -e "$WT_PATH/.husky/_" ]; then
    mkdir -p "$WT_PATH/.husky"
    ln -s "$REPO_PATH/.husky/_" "$WT_PATH/.husky/_"
    echo "    シンボリックリンク: .husky/_"
  fi

  echo "    完了: $WT_PATH"
  echo ""
done

echo "=== セットアップ完了 ==="
echo ""
echo "Worktree 一覧:"
cd "$REPO_PATH"
git worktree list
echo ""
echo "使い方:"
echo "  cd $WORKTREES_DIR/wt1"
echo "  git checkout -b feat/#123-my-feature origin/$BASE_BRANCH"
