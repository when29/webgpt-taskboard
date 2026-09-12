import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { addTask, toggleTask, removeTask, clearCompletedTasks, loadTasks, saveTasks, filterTasks, loadFilter, saveFilter } from '../src/tasks.mjs';

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

test('rejects blank titles and trims surrounding whitespace', () => {
  const original = addTask([], 'Existing task', 'existing');
  for (const title of ['', '   ', '\t\n', '\u00a0\u3000']) {
    assert.deepEqual(addTask(original, title, 'blank'), original);
  }
  const added = addTask(original, '  Read a book \n', 'trimmed');
  assert.equal(added[1].title, 'Read a book');
  assert.equal(original.length, 1);
});

test('filters preserve task state and follow completion changes', () => {
  const tasks = toggleTask(addTask(addTask([], 'First', 'a'), 'Second', 'b'), 'b');
  const snapshot = structuredClone(tasks);
  assert.deepEqual(filterTasks(tasks, 'all'), tasks);
  assert.deepEqual(filterTasks(tasks, 'active').map((task) => task.id), ['a']);
  assert.deepEqual(filterTasks(tasks, 'completed').map((task) => task.id), ['b']);
  assert.deepEqual(filterTasks(tasks, 'invalid'), tasks);
  assert.deepEqual(filterTasks([], 'completed'), []);
  assert.deepEqual(filterTasks(toggleTask(tasks, 'a'), 'active'), []);
  assert.deepEqual(tasks, snapshot);
});

test('clears completed tasks while preserving active tasks and previous state', () => {
  const tasks = [
    { id: 'a', title: 'First active', completed: false },
    { id: 'b', title: 'First done', completed: true },
    { id: 'c', title: 'Second active', completed: false },
    { id: 'd', title: 'Second done', completed: true }
  ];
  const snapshot = structuredClone(tasks);
  const remaining = clearCompletedTasks(tasks);
  assert.deepEqual(remaining.map((task) => task.id), ['a', 'c']);
  assert.deepEqual(tasks, snapshot);
  assert.deepEqual(clearCompletedTasks(remaining), remaining);
});

test('filter selection round-trips independently and tolerates invalid storage', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const tasks = addTask([], 'Keep me', 'kept');
  saveTasks(storage, tasks);
  assert.equal(loadFilter(storage), 'all');
  for (const filter of ['active', 'completed', 'all']) {
    saveFilter(storage, filter);
    assert.equal(loadFilter(storage), filter);
    assert.deepEqual(loadTasks(storage), tasks);
  }
  values.set('taskboard.filter', 'unknown');
  assert.equal(loadFilter(storage), 'all');
  assert.equal(loadFilter({ getItem() { throw new Error('Unavailable'); } }), 'all');
});

// Exercise the actual app event handlers using a minimal DOM and persistent storage.
function mountApp(storage) {
  class Element {
    constructor() {
      this.children = [];
      this.attributes = {};
      this.events = {};
      this.dataset = {};
      this.value = '';
      this.textContent = '';
      this.classList = { add() {} };
    }
    append(...children) { this.children.push(...children); }
    replaceChildren() { this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.events[name] = handler; }
    fire(name) { this.events[name]({ preventDefault() {} }); }
    setCustomValidity(message) { this.validationMessage = message; }
    reportValidity() { this.reported = true; }
    focus() {}
  }
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const elements = new Map();
  for (const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"/g)) {
    elements.set('#' + match[2], { tag: match[1], element: new Element() });
  }
  const buttons = [...html.matchAll(/<button\b[^>]*data-filter="([^"]+)"[^>]*>([^<]+)<\/button>/g)].map((match) => {
    const button = new Element();
    button.dataset.filter = match[1];
    button.textContent = match[2];
    return button;
  });
  assert.deepEqual(buttons.map((button) => button.textContent), ['전체', '진행 중', '완료']);
  const document = {
    querySelector: (selector) => elements.get(selector)?.element,
    querySelectorAll: (selector) => {
      assert.equal(selector, '[data-filter]');
      return buttons;
    },
    createElement: () => new Element()
  };
  let id = 0;
  const source = readFileSync(new URL('../src/app.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/, '');
  runInNewContext(source, {
    document, localStorage: storage, crypto: { randomUUID: () => 'new-' + ++id },
    addTask, toggleTask, removeTask, clearCompletedTasks, loadTasks, saveTasks, filterTasks, loadFilter, saveFilter
  });
  const byTag = (tag) => [...elements.values()].find((entry) => entry.tag === tag).element;
  return {
    form: byTag('form'), input: byTag('input'), list: byTag('ul'),
    summary: elements.get('#summary').element,
    clearCompleted: elements.get('#clear-completed').element,
    buttons
  };
}

test('clear completed action is disabled when empty and preserves active tasks', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  saveTasks(storage, [
    { id: 'active', title: 'Keep me', completed: false },
    { id: 'done', title: 'Remove me', completed: true }
  ]);
  const app = mountApp(storage);
  const titles = () => app.list.children.map((item) => item.children[1].textContent);
  assert.equal(app.clearCompleted.disabled, false);
  app.clearCompleted.fire('click');
  assert.deepEqual(titles(), ['Keep me']);
  assert.deepEqual(loadTasks(storage), [{ id: 'active', title: 'Keep me', completed: false }]);
  assert.equal(app.clearCompleted.disabled, true);
  app.list.children[0].children[0].fire('change');
  assert.equal(app.clearCompleted.disabled, false);
  app.clearCompleted.fire('click');
  assert.deepEqual(loadTasks(storage), []);
  assert.equal(app.clearCompleted.disabled, true);
});

test('app validates input, filters live tasks and restores selection on reload', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const initial = [
    { id: 'a', title: 'Open task', completed: false },
    { id: 'b', title: 'Done task', completed: true }
  ];
  saveTasks(storage, initial);
  let app = mountApp(storage);
  const titles = () => app.list.children.map((item) => item.children[1].textContent);
  assert.deepEqual(titles(), ['Open task', 'Done task']);
  app.input.value = '   ';
  app.form.fire('submit');
  assert.deepEqual(loadTasks(storage), initial);
  assert.equal(app.input.reported, true);
  app.input.value = '  <b>Safe title</b>  ';
  app.input.fire('input');
  assert.equal(app.input.validationMessage, '');
  app.form.fire('submit');
  assert.equal(loadTasks(storage)[2].title, '<b>Safe title</b>');
  assert.equal(app.input.value, '');
  app.buttons[1].fire('click');
  assert.deepEqual(titles(), ['Open task', '<b>Safe title</b>']);
  assert.equal(app.buttons[1].attributes['aria-pressed'], 'true');
  app = mountApp(storage);
  assert.deepEqual(titles(), ['Open task', '<b>Safe title</b>']);
  assert.equal(app.buttons[1].attributes['aria-pressed'], 'true');
  app.list.children[0].children[0].fire('change');
  assert.deepEqual(titles(), ['<b>Safe title</b>']);
  assert.equal(app.summary.textContent, '1 remaining');
  app.buttons[2].fire('click');
  app = mountApp(storage);
  assert.deepEqual(titles(), ['Open task', 'Done task']);
  assert.equal(app.buttons[2].attributes['aria-pressed'], 'true');
  app.list.children[0].children[2].fire('click');
  assert.deepEqual(titles(), ['Done task']);
  assert.equal(loadTasks(storage).length, 2);
  app.list.children[0].children[0].fire('change');
  assert.deepEqual(titles(), []);
  app.buttons[0].fire('click');
  app = mountApp(storage);
  assert.deepEqual(titles(), ['Done task', '<b>Safe title</b>']);
  assert.equal(app.buttons[0].attributes['aria-pressed'], 'true');
});
