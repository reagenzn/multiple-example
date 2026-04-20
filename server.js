const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function normalizeTags(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const result = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const t = raw.trim().replace(/^#+/, '');
    if (!t || seen.has(t)) continue;
    seen.add(t);
    result.push(t);
  }
  return result;
}

function withTags(todo) {
  return { ...todo, tags: Array.isArray(todo.tags) ? todo.tags : [] };
}

function loadTodos() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return Array.isArray(raw) ? raw.map(withTags) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

app.get('/api/todos', (req, res) => {
  res.json(loadTodos());
});

app.post('/api/todos', (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title required' });
  const todos = loadTodos();
  const todo = {
    id: Date.now().toString(),
    title,
    done: false,
    tags: normalizeTags(req.body.tags),
    createdAt: new Date().toISOString()
  };
  todos.push(todo);
  saveTodos(todos);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todos = loadTodos();
  const idx = todos.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const patch = { ...req.body };
  if ('tags' in patch) patch.tags = normalizeTags(patch.tags);
  todos[idx] = { ...todos[idx], ...patch, id: todos[idx].id };
  saveTodos(todos);
  res.json(todos[idx]);
});

app.delete('/api/todos/:id', (req, res) => {
  const todos = loadTodos();
  const filtered = todos.filter(t => t.id !== req.params.id);
  saveTodos(filtered);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`TODO app running at http://localhost:${PORT}`);
});
