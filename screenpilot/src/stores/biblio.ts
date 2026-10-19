import { defineStore } from 'pinia';
import * as store from '@/data/store';
import { anilist } from '@/api/anilist';
import { tmdb } from '@/api/tmdb';
import { idbCache } from '@/api/cache';
import { refreshLibrary } from '@/data/refresh';
import { sessions } from '@/domain/screentime';
import type { State } from '@/data/store';

/**
 * Pont entre le store d'origine (IndexedDB « animepilot », historique, annulation)
 * et Vue : un instantané immuable remplacé à chaque changement.
 */
export const useBiblio = defineStore('biblio', () => {
  const etat = shallowRef<State>(store.getState());
  store.subscribe(() => { etat.value = store.getState(); });

  async function demarrer() {
    await store.init();
    try {
      const cache = idbCache(store.getDb());
      anilist.setCache(cache);
      tmdb.setCache(cache);
    } catch { /* stockage indisponible : pas de cache */ }
    const rafraichir = () => { if (navigator.onLine) refreshLibrary().catch(() => {}); };
    rafraichir();
    window.addEventListener('online', rafraichir);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && rafraichir());
  }

  const pret = computed(() => etat.value.ready);
  const erreur = computed(() => etat.value.error);
  const entries = computed(() => etat.value.entries);
  const history = computed(() => etat.value.history);
  const settings = computed(() => etat.value.settings);
  /** Sessions de visionnage / lecture estimées (base du temps d'écran). */
  const sessionsVues = computed(() => sessions(etat.value.history, etat.value.entries, etat.value.settings));
  const parId = (id: string) => etat.value.entries.find(e => e.id === id);

  return { etat, pret, erreur, entries, history, settings, sessionsVues, parId, demarrer };
});
