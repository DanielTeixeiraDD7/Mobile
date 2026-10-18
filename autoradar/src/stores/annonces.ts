import { defineStore } from 'pinia';
import type { Annonce, Pays } from '@/lib/types';
import { lire, ecrire } from '@/lib/stockage';
import { uid } from '@/lib/format';
import { siteDepuisUrl } from '@/lib/sites';

const CLE = 'autoradar:annonces';

export type NouvelleAnnonce = Omit<Annonce, 'id' | 'ajouteLe' | 'majLe' | 'site'> & { site?: string | null };

export const useAnnoncesStore = defineStore('annonces', () => {
  const liste = ref<Annonce[]>(lire<Annonce[]>(CLE, []));
  watch(liste, v => ecrire(CLE, v), { deep: true });

  const parId = (id: string) => liste.value.find(a => a.id === id) ?? null;
  const actives = computed(() => liste.value.filter(a => a.statut !== 'ecartee'));

  function ajouter(a: NouvelleAnnonce): Annonce {
    const site = a.site ?? siteDepuisUrl(a.url)?.id ?? null;
    const n: Annonce = { ...a, site, id: uid(), ajouteLe: Date.now(), majLe: Date.now() };
    liste.value.unshift(n);
    return n;
  }
  function modifier(id: string, p: Partial<Annonce>) {
    const i = liste.value.findIndex(a => a.id === id);
    if (i >= 0) liste.value[i] = { ...liste.value[i]!, ...p, majLe: Date.now() };
  }
  function supprimer(id: string) { liste.value = liste.value.filter(a => a.id !== id); }
  const existe = (url: string) => liste.value.some(a => a.url.trim() === url.trim());
  const parPays = (p: Pays) => liste.value.filter(a => a.pays === p);

  return { liste, actives, parId, ajouter, modifier, supprimer, existe, parPays };
});
