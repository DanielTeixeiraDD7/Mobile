import { defineStore } from 'pinia';
import { lire, ecrire } from '@/lib/stockage';

export type Theme = 'auto' | 'clair' | 'sombre';
const CLE = 'autoradar:reglages';

export const useReglagesStore = defineStore('reglages', () => {
  const lu = lire<{ theme?: Theme; checklist?: Record<string, boolean> }>(CLE, {});
  const theme = ref<Theme>(lu.theme ?? 'auto');
  /** Cases cochées des listes de vérification (guide, import). */
  const checklist = ref<Record<string, boolean>>(lu.checklist ?? {});
  watch([theme, checklist], () => ecrire(CLE, { theme: theme.value, checklist: checklist.value }), { deep: true });
  const basculer = (id: string) => { checklist.value[id] = !checklist.value[id]; };
  return { theme, checklist, basculer };
});
