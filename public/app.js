const list = document.getElementById('list');
const form = document.getElementById('form');
const titleInput = document.getElementById('title');
const filterBar = document.getElementById('filter-bar');
const clearFilter = document.getElementById('clear-filter');

const selectedTags = new Set();
let todos = [];

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function parseInput(raw) {
  const tokens = raw.split(/[\s,]+/).filter(Boolean);
  const tagSet = new Set();
  const titleParts = [];
  for (const tok of tokens) {
    if (tok.startsWith('#')) {
      const tag = tok.replace(/^#+/, '').trim();
      if (tag) tagSet.add(tag);
    } else {
      titleParts.push(tok);
    }
  }
  return { title: titleParts.join(' '), tags: [...tagSet] };
}

function renderFilterBar() {
  if (selectedTags.size === 0) {
    filterBar.hidden = true;
    clearFilter.hidden = true;
    filterBar.innerHTML = '';
    return;
  }
  filterBar.hidden = false;
  clearFilter.hidden = false;
  const chips = [...selectedTags].map(tag =>
    `<button type="button" class="tag-chip selected" data-filter-tag="${escapeHtml(tag)}">#${escapeHtml(tag)} ×</button>`
  ).join('');
  filterBar.innerHTML = `<span class="filter-label">Filter:</span>${chips}`;
}

function renderList() {
  const filtered = selectedTags.size === 0
    ? todos
    : todos.filter(t => [...selectedTags].every(sel => (t.tags || []).includes(sel)));

  list.innerHTML = '';
  for (const todo of filtered) {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    const tags = todo.tags || [];
    const tagChips = tags.map(tag =>
      `<button type="button" class="tag-chip${selectedTags.has(tag) ? ' selected' : ''}" data-filter-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`
    ).join('');
    const safeId = escapeHtml(todo.id);
    li.innerHTML = `
      <label>
        <input type="checkbox" ${todo.done ? 'checked' : ''} data-id="${safeId}">
        <span>${escapeHtml(todo.title)}</span>
      </label>
      <span class="tags">${tagChips}</span>
      <button type="button" class="delete-btn" data-delete="${safeId}" aria-label="delete">×</button>
    `;
    list.appendChild(li);
  }
}

async function loadTodos() {
  const res = await fetch('/api/todos');
  todos = await res.json();
  renderFilterBar();
  renderList();
}

function toggleTagFilter(tag) {
  if (selectedTags.has(tag)) selectedTags.delete(tag);
  else selectedTags.add(tag);
  renderFilterBar();
  renderList();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const raw = titleInput.value.trim();
  if (!raw) return;
  const { title, tags } = parseInput(raw);
  if (!title) {
    titleInput.setCustomValidity('Title required (tags alone are not enough)');
    titleInput.reportValidity();
    return;
  }
  titleInput.setCustomValidity('');
  await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, tags })
  });
  titleInput.value = '';
  loadTodos();
});

list.addEventListener('click', async e => {
  const tag = e.target.dataset.filterTag;
  if (tag) {
    toggleTagFilter(tag);
    return;
  }
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

filterBar.addEventListener('click', e => {
  const tag = e.target.dataset.filterTag;
  if (tag) toggleTagFilter(tag);
});

clearFilter.addEventListener('click', () => {
  selectedTags.clear();
  renderFilterBar();
  renderList();
});

loadTodos();
