const list = document.getElementById('list');
const form = document.getElementById('form');
const titleInput = document.getElementById('title');

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadTodos() {
  const res = await fetch('/api/todos');
  const todos = await res.json();
  list.innerHTML = '';
  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    li.innerHTML = `
      <label>
        <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
        <span>${escapeHtml(todo.title)}</span>
      </label>
      <button type="button" data-delete="${todo.id}" aria-label="delete">×</button>
    `;
    list.appendChild(li);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });
  titleInput.value = '';
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
