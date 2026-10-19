import { t as tCore, categoryName } from '@/core/i18n.js';
import { useBudgetStore } from '@/stores/budget';
import type { Category } from '@/core/types';

/** Traduction réactive : relit le dictionnaire quand la langue change (dépend de `tick`). */
export function useT() {
  const budget = useBudgetStore();
  const t = (cle: string, p?: Record<string, string | number>) => (budget.tick, tCore(cle, p));
  const nomCat = (c: Pick<Category, 'name' | 'key'>) => (budget.tick, categoryName(c));
  return { t, nomCat };
}
