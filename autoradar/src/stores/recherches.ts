import { defineStore } from 'pinia';
import type { Criteres, Pays, Recherche } from '@/lib/types';
import { lire, ecrire } from '@/lib/stockage';
import { uid } from '@/lib/format';

const CLE = 'autoradar:recherches';

export const CRITERES_DEFAUT: Criteres = { modele: 'peugeot-e2008', prixMax: null, anneeMin: 2020, kmMax: null, tri: 'recent' };
const TOUS: Pays[] = ['PT', 'FR', 'DE', 'BE'];

const premiere = (): Recherche => ({ id: 'defaut', nom: 'Peugeot e-2008', criteres: { ...CRITERES_DEFAUT }, pays: [...TOUS], creeLe: Date.now() });

export const useRecherchesStore = defineStore('recherches', () => {
  const lu = lire<{ liste: Recherche[]; active: string } | null>(CLE, null);
  const liste = ref<Recherche[]>(lu?.liste?.length ? lu.liste : [premiere()]);
  const activeId = ref(lu?.active && liste.value.some(r => r.id === lu.active) ? lu.active : liste.value[0]!.id);
  watch([liste, activeId], () => ecrire(CLE, { liste: liste.value, active: activeId.value }), { deep: true });

  const active = computed(() => liste.value.find(r => r.id === activeId.value) ?? liste.value[0]!);

  function creer(nom: string, criteres: Criteres, pays: Pays[] = [...TOUS]): Recherche {
    const r: Recherche = { id: uid(), nom, criteres: { ...criteres }, pays, creeLe: Date.now() };
    liste.value.push(r);
    activeId.value = r.id;
    return r;
  }
  function modifier(id: string, p: Partial<Omit<Recherche, 'id'>>) {
    const i = liste.value.findIndex(r => r.id === id);
    if (i >= 0) liste.value[i] = { ...liste.value[i]!, ...p };
  }
  function supprimer(id: string) {
    if (liste.value.length <= 1) return;
    liste.value = liste.value.filter(r => r.id !== id);
    if (activeId.value === id) activeId.value = liste.value[0]!.id;
  }
  return { liste, activeId, active, creer, modifier, supprimer };
});
