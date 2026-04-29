const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadTodos() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

function normalizeDueAt(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function annotateOverdue(todo, now) {
  if (!todo.dueAt || todo.done) return todo;
  return { ...todo, overdue: new Date(todo.dueAt).getTime() < now };
}

app.get('/api/todos', (req, res) => {
  const now = Date.now();
  res.json(loadTodos().map(t => annotateOverdue(t, now)));
});

app.post('/api/todos', (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title required' });
  const dueAt = normalizeDueAt(req.body.dueAt);
  if (dueAt === null) return res.status(400).json({ error: 'invalid dueAt' });
  const todos = loadTodos();
  const todo = {
    id: Date.now().toString(),
    title,
    done: false,
    createdAt: new Date().toISOString()
  };
  if (dueAt) todo.dueAt = dueAt;
  todos.push(todo);
  saveTodos(todos);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const todos = loadTodos();
  const idx = todos.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });

  const { dueAt, ...rest } = req.body;
  const updated = { ...todos[idx], ...rest, id: todos[idx].id };

  if ('dueAt' in req.body) {
    const normalized = normalizeDueAt(dueAt);
    if (normalized === null) return res.status(400).json({ error: 'invalid dueAt' });
    if (normalized) updated.dueAt = normalized;
    else delete updated.dueAt;
  }

  todos[idx] = updated;
  saveTodos(todos);
  res.json(updated);
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
