export function addTask(tasks, title, id) {
  title = title.trim();
  if (!title) return tasks;
  return [...tasks, { id, title, completed: false }];
}

export function toggleTask(tasks, id) {
  return tasks.map((task) => task.id === id
    ? { ...task, completed: !task.completed }
    : task);
}

export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function clearCompletedTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function loadTasks(storage) {
  try {
    const parsed = JSON.parse(storage.getItem('taskboard.tasks') || '[]');
    return Array.isArray(parsed) ? parsed.filter((task) => task
      && typeof task.id === 'string' && typeof task.title === 'string'
      && typeof task.completed === 'boolean') : [];
  } catch {
    return [];
  }
}

export function saveTasks(storage, tasks) {
  storage.setItem('taskboard.tasks', JSON.stringify(tasks));
}

export function filterTasks(tasks, filter) {
  if (filter === 'active') return tasks.filter((task) => !task.completed);
  if (filter === 'completed') return tasks.filter((task) => task.completed);
  return tasks;
}

function validFilter(filter) {
  return ['all', 'active', 'completed'].includes(filter) ? filter : 'all';
}

export function loadFilter(storage) {
  try {
    return validFilter(storage.getItem('taskboard.filter'));
  } catch {
    return 'all';
  }
}

export function saveFilter(storage, filter) {
  storage.setItem('taskboard.filter', validFilter(filter));
}
