import { init, state } from './store.js';
import { initSync, onSyncChange } from './sync.js';
import { t } from './i18n.js';
import { register, go, render, currentView } from './router.js';
import { renderAdd, handleKey } from './views/add.js';
import { renderList } from './views/list.js';
import { renderBudget } from './views/budget.js';
import { renderStats } from './views/stats.js';
import { renderSettings } from './views/settings.js';

const ICONS = {
  add: '<path d="M12 5v14M5 12h14"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  budget: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  stats: '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
};

const TABS = [
  ['add', renderAdd],
  ['list', renderList],
  ['budget', renderBudget],
  ['stats', renderStats],
  ['settings', renderSettings],
];

function renderTabbar() {
  const nav = document.querySelector('.tabbar');
  nav.innerHTML = TABS.map(([name]) => `
    <button type="button" data-tab="${name}" class="${name === currentView() ? 'active' : ''}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>${t(`tab.${name}`)}
    </button>`).join('');
}

async function start() {
  TABS.forEach(([name, view]) => register(name, view));
  try {
    await init();
  } catch {
    document.getElementById('main').innerHTML = '<p class="empty">IndexedDB indisponible / indisponível.</p>';
    return;
  }
  await initSync().catch(() => {});
  document.documentElement.lang = state.settings.lang;
  renderTabbar();
  render();

  const typing = () => document.activeElement?.matches('input, textarea, select') || !document.getElementById('sheet').hidden;
  document.addEventListener('remotechange', () => !typing() && render());
  onSyncChange(() => currentView() === 'settings' && !typing() && render());

  document.querySelector('.tabbar').onclick = e => {
    const b = e.target.closest('[data-tab]');
    if (b) go(b.dataset.tab);
  };
  document.addEventListener('langchange', renderTabbar);
  document.addEventListener('keydown', e => currentView() === 'add' && handleKey(e));
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && render());

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && document.getElementById('sheet').hidden) location.reload();
      hadController = true;
    });
  }
}

start();
