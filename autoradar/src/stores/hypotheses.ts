import { defineStore } from 'pinia';
import { HYPOTHESES_DEFAUT, type Hypotheses } from '@/lib/import';
import { lire, ecrire } from '@/lib/stockage';

const CLE = 'autoradar:hypotheses';

/** Frais estimés (transport, plaques…) ajustables par l'utilisateur ; les montants officiels restent fixes. */
export const useHypothesesStore = defineStore('hypotheses', () => {
  const valeurs = ref<Hypotheses>({ ...HYPOTHESES_DEFAUT, ...lire<Partial<Hypotheses>>(CLE, {}) });
  watch(valeurs, v => ecrire(CLE, v), { deep: true });
  const reinitialiser = () => { valeurs.value = { ...HYPOTHESES_DEFAUT }; };
  return { valeurs, reinitialiser };
});
