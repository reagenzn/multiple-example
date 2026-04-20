const list = document.getElementById('list');
const form = document.getElementById('form');
const titleInput = document.getElementById('title');
const dueAtInput = document.getElementById('dueAt');

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDue(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

async function loadTodos() {
  const res = await fetch('/api/todos');
  const todos = await res.json();
  list.innerHTML = '';
  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    const dueHtml = todo.dueAt
      ? `<span class="due${todo.overdue ? ' overdue' : ''}">${escapeHtml(formatDue(todo.dueAt))}${todo.overdue ? ' <span class="badge">overdue</span>' : ''}</span>`
      : '';
    li.innerHTML = `
      <label>
        <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
        <span class="title">${escapeHtml(todo.title)}</span>
      </label>
      ${dueHtml}
      <button type="button" data-delete="${todo.id}" aria-label="delete">×</button>
    `;
    list.appendChild(li);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  const body = { title };
  if (dueAtInput.value) body.dueAt = dueAtInput.value;
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  titleInput.value = '';
  dueAtInput.value = '';
  loadTodos();
});

list.addEventListener('click', async e => {
  const deleteId = e.target.dataset.delete;
  if (!deleteId) return;
  await fetch(`/api/todos/${deleteId}`, { method: 'DELETE' });
  loadTodos();
});

list.addEventListener('change', async e => {
  const id = e.target.dataset.id;
  if (!id) return;
  await fetch(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: e.target.checked })
  });
  loadTodos();
});

loadTodos();
