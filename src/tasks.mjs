export function addTask(tasks, title, id) {
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
