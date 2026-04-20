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
  todos[idx] = { ...todos[idx], ...req.body, id: todos[idx].id };
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
