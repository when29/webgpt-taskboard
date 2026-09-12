import test from 'node:test';
import assert from 'node:assert/strict';
import { addTask, toggleTask, removeTask, loadTasks, saveTasks } from '../src/tasks.mjs';

test('add, complete and remove a task without mutating the previous state', () => {
  const original = [];
  const added = addTask(original, 'Read a book', 'one');
  assert.deepEqual(original, []);
  assert.deepEqual(added, [{ id: 'one', title: 'Read a book', completed: false }]);
  const done = toggleTask(added, 'one');
  assert.equal(done[0].completed, true);
  assert.equal(added[0].completed, false);
  assert.deepEqual(removeTask(done, 'one'), []);
});

test('load tolerates malformed storage and round-trips valid tasks', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  assert.deepEqual(loadTasks(storage), []);
  values.set('taskboard.tasks', '{bad');
  assert.deepEqual(loadTasks(storage), []);
  const tasks = addTask([], 'Plan the week', 'two');
  saveTasks(storage, tasks);
  assert.deepEqual(loadTasks(storage), tasks);
});
