import { defineStore } from 'pinia';
import * as core from '@/core/store.js';
import * as synchro from '@/core/sync.js';
import { currentUser } from '@/core/auth.js';
import { currentMonth } from '@/core/format.js';
import type { Transaction } from '@/core/types';

/**
 * Pont entre le cœur de données de la v1 (IndexedDB + synchro Supabase, repris tel quel)
 * et Vue : le cœur reste en objets simples (aucun Proxy n'atteint IndexedDB) et chaque
 * changement incrémente `tick`, dont dépendent tous les computed de l'interface.
 */
export const useBudgetStore = defineStore('budget', () => {
  const tick = ref(0);
  const bump = () => { tick.value++; };
  const pret = ref(false);
  const erreur = ref(false);

  // Mois affiché, partagé entre les écrans ; suit le calendrier si l'app reste ouverte.
  const mois = ref(currentMonth());
  let moisCourant = currentMonth();
  function suivreCalendrier() {
    if (currentMonth() === moisCourant) return;
    if (mois.value === moisCourant) mois.value = currentMonth();
    moisCourant = currentMonth();
  }

  async function demarrer() {
    try {
      await core.init();
    } catch {
      erreur.value = true;
      return;
    }
    await synchro.initSync().catch(() => {});
    synchro.onSyncChange(bump);
    document.addEventListener('remotechange', bump);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { suivreCalendrier(); bump(); }
    });
    document.documentElement.lang = core.state.settings.lang;
    pret.value = true;
    bump();
  }

  // Lecture : copies superficielles pour que Vue voie de nouveaux tableaux à chaque changement.
  const transactions = computed(() => (tick.value, [...core.state.transactions]));
  const categories = computed(() => (tick.value, [...core.state.categories]));
  const settlements = computed(() => (tick.value, [...core.state.settlements]));
  const settings = computed(() => (tick.value, { ...core.state.settings }));
  const etatSync = computed(() => (tick.value, { ...synchro.sync, members: [...synchro.sync.members] }));
  const couple = computed(() => (tick.value, synchro.isCouple()));
  const moi = computed(() => (tick.value, currentUser()));

  // Écriture : toujours via le cœur (IndexedDB + file d'envoi), puis rafraîchissement.
  const ecrire = <A extends unknown[], R>(fn: (...a: A) => Promise<R>) => async (...a: A): Promise<R> => {
    try { return await fn(...a); } finally { bump(); }
  };
  const enregistrer = ecrire(core.saveTransaction);
  const supprimer = ecrire(core.deleteTransaction);
  const enregistrerCategorie = ecrire(core.saveCategory);
  const supprimerCategorie = ecrire(core.deleteCategory);
  const enregistrerReglement = ecrire(core.saveSettlement);
  const supprimerReglement = ecrire(core.deleteSettlement);
  const reglage = ecrire(async (key: string, value: unknown) => {
    await core.setSetting(key, value);
    if (key === 'lang') document.documentElement.lang = String(value);
  });
  const toutRemplacer = ecrire(core.replaceAll);
  const synchroniser = ecrire(synchro.syncNow);

  /** Rétablit une opération supprimée (annuler). */
  const restaurer = (tx: Transaction) => enregistrer({ ...tx });

  return {
    tick, bump, pret, erreur, mois, suivreCalendrier, demarrer,
    transactions, categories, settlements, settings, etatSync, couple, moi,
    enregistrer, supprimer, restaurer, enregistrerCategorie, supprimerCategorie,
    enregistrerReglement, supprimerReglement, reglage, toutRemplacer, synchroniser, ecrire,
  };
});
