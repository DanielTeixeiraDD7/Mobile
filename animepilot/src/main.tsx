import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { anilist } from './api/anilist';
import { idbCache } from './api/cache';
import * as store from './data/store';
import { refreshLibrary } from './data/refresh';
import './styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

store.init().then(() => {
  try { anilist.setCache(idbCache(store.getDb())); } catch { /* stockage indisponible : pas de cache */ }
  const refresh = () => { if (navigator.onLine) refreshLibrary().catch(() => {}); };
  refresh();
  window.addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && refresh());
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
