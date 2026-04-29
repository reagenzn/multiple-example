const list = document.getElementById('list');
const form = document.getElementById('form');
const titleInput = document.getElementById('title');
const tagsInput = document.getElementById('tags');
const filterBar = document.getElementById('filter-bar');
const activeTagsEl = document.getElementById('active-tags');
const clearFilterBtn = document.getElementById('clear-filter');

const activeTags = new Set();

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function parseTagInput(str) {
  return str
    .split(/[\s,]+/)
    .map(t => t.trim().replace(/^#+/, ''))
    .filter(Boolean);
}

function toggleTag(tag) {
  if (activeTags.has(tag)) activeTags.delete(tag);
  else activeTags.add(tag);
  render();
}

function renderFilterBar() {
  if (activeTags.size === 0) {
    filterBar.hidden = true;
    activeTagsEl.innerHTML = '';
    return;
  }
  filterBar.hidden = false;
  activeTagsEl.innerHTML = [...activeTags]
    .map(t => `<span class="tag-chip active" data-filter-tag="${escapeHtml(t)}">#${escapeHtml(t)} ×</span>`)
    .join('');
}

function renderTodos(todos) {
  const filtered = activeTags.size === 0
    ? todos
    : todos.filter(t => [...activeTags].every(tag => t.tags.includes(tag)));

  list.innerHTML = '';
  for (const todo of filtered) {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    const chips = todo.tags.map(t => {
      const isActive = activeTags.has(t);
      return `<span class="tag-chip${isActive ? ' active' : ''}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</span>`;
    }).join('');
    li.innerHTML = `
      <label>
        <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${todo.id}">
        <span class="todo-title">${escapeHtml(todo.title)}</span>
      </label>
      <span class="tags">${chips}</span>
      <button type="button" data-delete="${todo.id}" aria-label="delete">×</button>
    `;
    list.appendChild(li);
  }
}

let cachedTodos = [];

function render() {
  renderFilterBar();
  renderTodos(cachedTodos);
}

async function loadTodos() {
  const res = await fetch('/api/todos');
  cachedTodos = await res.json();
  render();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  const tags = parseTagInput(tagsInput.value);
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, tags })
  });
  titleInput.value = '';
  tagsInput.value = '';
  loadTodos();
});

list.addEventListener('click', async e => {
  const deleteId = e.target.dataset.delete;
  if (deleteId) {
    await fetch(`/api/todos/${deleteId}`, { method: 'DELETE' });
    loadTodos();
    return;
  }
  const tag = e.target.dataset.tag;
  if (tag) {
    toggleTag(tag);
  }
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

filterBar.addEventListener('click', e => {
  const tag = e.target.dataset.filterTag;
  if (tag) toggleTag(tag);
});

clearFilterBtn.addEventListener('click', () => {
  activeTags.clear();
  render();
});

loadTodos();
