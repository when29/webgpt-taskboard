import { addTask, toggleTask, removeTask, loadTasks, saveTasks } from './tasks.mjs';

const form = document.querySelector('#task-form');
const input = document.querySelector('#task-title');
const list = document.querySelector('#task-list');
const summary = document.querySelector('#summary');
let tasks = loadTasks(localStorage);

function render() {
  list.replaceChildren();
  summary.textContent = `${tasks.filter((task) => !task.completed).length} remaining`;
  for (const task of tasks) {
    const item = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark ${task.title} complete`);
    checkbox.addEventListener('change', () => update(toggleTask(tasks, task.id)));
    const title = document.createElement('span');
    title.textContent = task.title;
    if (task.completed) title.classList.add('completed');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.setAttribute('aria-label', `Delete ${task.title}`);
    remove.addEventListener('click', () => update(removeTask(tasks, task.id)));
    item.append(checkbox, title, remove);
    list.append(item);
  }
}

function update(next) {
  tasks = next;
  saveTasks(localStorage, tasks);
  render();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  update(addTask(tasks, input.value, crypto.randomUUID()));
  input.value = '';
  input.focus();
});

render();
