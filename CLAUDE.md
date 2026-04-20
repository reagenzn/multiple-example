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
- **Never `rebase`**. Integrate `main` with `git merge origin/main`.
  Rebase rewrites commit hashes and causes repeated conflicts with
  sibling PRs that share parent commits.
- Always branch from the latest `origin/main`, not a stale local `main`.

### Commit messages — Conventional Commits

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short summary>

<optional body — explain the *why*, wrap at ~72 chars>

<optional footer — e.g., Closes #<issue>, BREAKING CHANGE: ...>
```

Allowed `type`s in this repo:

| type       | use for                                                |
| ---------- | ------------------------------------------------------ |
| `feat`     | user-visible new feature                               |
| `fix`      | bug fix                                                |
| `chore`    | tooling, config, scaffolding, non-user-visible         |
| `docs`     | README / CLAUDE.md / other documentation only          |
| `refactor` | internal restructuring without behavior change         |
| `style`    | formatting / whitespace only (no logic)                |
| `test`     | add or update tests (future-proof; no tests yet)       |

Rules:

- Summary is imperative and lowercase (`add`, not `Added`/`Adds`).
- No trailing period.
- Squash unrelated changes into separate commits.
- When resolving an issue, add `Closes #<issue>` in the footer (not the
  subject).
- Breaking changes: add `!` after the type (`feat!: ...`) and a
  `BREAKING CHANGE:` footer.

### Pull request format

**Title** — same Conventional Commits shape as the squash target commit,
with the issue number in parentheses when applicable:

```
<type>(<scope>)?: <short summary> (#<issue>)
```

Examples:

- `feat: add optional due date and overdue flag (#1)`
- `fix: /api/todos PUT drops dueAt when other fields are patched (#4)`
- `chore: add CLAUDE.md and issue-implement skill`

**Body** — use this template via `gh pr create --body`:

```markdown
## Summary
- <2–4 bullets: what changed and why>

## Acceptance criteria
<!-- copy the checklist from the Issue, tick items that are met -->
- [x] ...
- [ ] ...

## Test plan
- [x] `curl` exercised the API contract (golden path + validation 400s)
- [x] Static assets (`/`, `/app.js`, `/style.css`) return 200
- [ ] Manual browser check of the golden path

## Known follow-ups
<!-- optional; list any code-review findings deferred to follow-up commits on this PR -->
- …

Closes #<issue>
```

Rules:

- `Closes #<issue>` appears in the body when the PR resolves an issue
  (GitHub auto-closes on merge). For PRs that only partially address an
  issue, use `Refs #<issue>`.
- Omit sections that don't apply (`Acceptance criteria` for pure chore
  PRs, `Known follow-ups` when empty).
- Keep the body scannable — bullets, no walls of prose.
- Don't paste full diffs; link to specific lines with
  `owner/repo#<PR>#discussion_rN` if needed.

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
