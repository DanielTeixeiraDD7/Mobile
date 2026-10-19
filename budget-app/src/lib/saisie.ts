import type { Kind, Transaction } from '@/core/types';
import { isCouple } from '@/core/sync.js';
import { currentUser } from '@/core/auth.js';
import { budgetStatus } from '@/core/calc.js';

/** Champs « qui » d'une opération (identique à la v1) : seulement dans un budget à deux. */
export function champsQui(d: { type: Kind; paidBy?: string | null; shared?: boolean }) {
  if (!isCouple()) return {};
  return { paidBy: d.paidBy || currentUser()!.id, shared: d.type === 'expense' ? d.shared !== false : true };
}

type Statut = ReturnType<typeof budgetStatus>;
const RANG = { none: 0, ok: 0, warn: 1, over: 2 } as const;

/** Seuil de budget franchi par la dernière dépense (même règle que la v1). */
export function alerteBudget(avant: Statut, apres: Statut, categoryId: string) {
  const tests = [
    { b: avant.global, a: apres.global, cat: null as null | Statut['categories'][number]['cat'] },
    ...apres.categories.filter(c => c.cat.id === categoryId).map(a => ({ b: avant.categories.find(c => c.cat.id === categoryId)!, a, cat: a.cat })),
  ];
  const hit = tests.filter(c => RANG[c.a.level] > RANG[c.b.level]).sort((x, y) => RANG[y.a.level] - RANG[x.a.level])[0];
  if (!hit) return null;
  return { niveau: hit.a.level as 'warn' | 'over', cat: hit.cat, ratio: hit.a.cap ? hit.a.spent / hit.a.cap : 1 };
}

/** Saisies récentes distinctes (catégorie + note + montant), pour les refaire d'un geste. */
export function recents(txs: Transaction[], type: Kind, max = 6) {
  const vus = new Set<string>();
  const out: Transaction[] = [];
  for (const t of [...txs].sort((a, b) => b.createdAt - a.createdAt)) {
    if (t.type !== type || !t.note) continue;
    const k = `${t.categoryId}|${t.note.toLowerCase()}|${t.amount}`;
    if (vus.has(k)) continue;
    vus.add(k);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Notes déjà utilisées (auto-complétion), les plus fréquentes d'abord. */
export function notesConnues(txs: Transaction[], max = 40) {
  const n = new Map<string, number>();
  for (const t of txs) if (t.note) n.set(t.note, (n.get(t.note) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).slice(0, max).map(([k]) => k);
}
