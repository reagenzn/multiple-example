# multiple-example — project guide for Claude

Public companion demo for the Claude parallel-development slide deck.
A minimal TODO app (Express + vanilla JS) designed to be extended by
multiple Claude Code sessions running in parallel via `git worktree`.

## Layout

- `server.js` — Express API (`/api/todos` CRUD), stores to `data.json`
- `public/` — frontend (`index.html`, `app.js`, `style.css`)
- `data.json` — local JSON store (gitignored; created at first write)
- `scripts/setup-worktrees.sh` — worktree bootstrap helper
- `.claude/skills/` — repo-scoped Claude Code skills

## Run locally

```bash
npm install
npm start                 # http://localhost:3000
PORT=3100 npm start       # override port for parallel instances
```

No test framework is set up. Verify features via `curl` + browser.

## Parallel development

Canonical layout on this machine:

- Main repo (wt0): `/Users/natsuki.fukazawa/study/multiple-example` → branch `main`
- Worktrees: `/Users/natsuki.fukazawa/study/multiple-example-worktrees/wt{1..5}`
  - Initial branches: `worktree/wtN` (tracks `origin/main`)

Each worktree is self-contained — run `npm install` inside the worktree
rather than sharing `node_modules` with wt0.

## Git conventions

- Base branch: **`main`**
- Branch names: `feat/#<issue>-<slug>`, `fix/#<issue>-<slug>`, `chore/<slug>`
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:` …)
- PR body includes `Closes #<issue>` when resolving an issue
- **Never `rebase`**. Integrate `main` with `git merge origin/main`.
  Rebase rewrites commit hashes and causes repeated conflicts with
  sibling PRs that share parent commits.
- Always branch from the latest `origin/main`, not a stale local `main`.

## Ports when running in parallel

Give each worktree a distinct port so you can run them side-by-side:

| Worktree | Suggested port |
| -------- | -------------- |
| wt0      | 3000           |
| wt1      | 3100           |
| wt2      | 3200           |
| wt3      | 3300           |
| wt4      | 3400           |
| wt5      | 3500           |

Stop a lingering server with `lsof -ti:<port> | xargs kill -9`.

## Safety rules for Claude

- Don't commit `data.json`, `node_modules`, `package-lock.json`
  changes unrelated to the task, or `scripts/` helpers that aren't the
  subject of the PR.
- Don't touch other worktrees' branches; they may be in use by parallel
  sessions.
- Don't run destructive git commands (`reset --hard`, `push --force`,
  `branch -D`) without explicit user confirmation.

## Workflow skills

- `/issue-implement <issue-number>` — scaffold a worktree, implement the
  issue, run manual tests, open a PR. See
  [.claude/skills/issue-implement/SKILL.md](.claude/skills/issue-implement/SKILL.md).
