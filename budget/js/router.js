const views = {};
let current = 'add';

export const register = (name, view) => (views[name] = view);
export const currentView = () => current;

export function go(name) {
  current = name;
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  render();
  window.scrollTo(0, 0);
}

export function render() {
  const main = document.getElementById('main');
  main.dataset.view = current;
  views[current](main);
}
