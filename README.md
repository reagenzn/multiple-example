# multiple-example

Public companion demo for the Claude parallel-development slide deck.

A minimal TODO app (Express + vanilla JS) designed to be extended by
multiple Claude Code sessions running in parallel via `git worktree`.

## Run

```bash
npm install
npm start
# → http://localhost:3000
```

Override the port to run multiple instances side by side:

```bash
PORT=3001 npm start
PORT=3002 npm start
PORT=3003 npm start
```

## Structure

- `server.js` — Express API (`/api/todos` CRUD)
- `public/` — frontend (vanilla HTML/CSS/JS)
- `data.json` — local JSON store (gitignored)

## License

MIT
