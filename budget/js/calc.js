import { state, categoriesOf } from './store.js';
import { monthOf, addMonths } from './format.js';

export const WARN = 0.8;

export const txOfMonth = ym => state.transactions.filter(t => monthOf(t.date) === ym);

export function totals(ym) {
  let expense = 0, income = 0;
  for (const t of txOfMonth(ym)) t.type === 'income' ? (income += t.amount) : (expense += t.amount);
  return { expense, income, balance: income - expense };
}

export function byCategory(ym, type = 'expense') {
  const sums = new Map();
  for (const t of txOfMonth(ym)) if (t.type === type) sums.set(t.categoryId, (sums.get(t.categoryId) || 0) + t.amount);
  return sums;
}

export function level(spent, cap) {
  if (!cap) return 'none';
  const r = spent / cap;
  return r >= 1 ? 'over' : r >= WARN ? 'warn' : 'ok';
}

export function budgetStatus(ym) {
  const spent = byCategory(ym);
  const total = totals(ym).expense;
  const cap = state.settings.monthlyBudget;
  return {
    global: { spent: total, cap, level: level(total, cap) },
    categories: categoriesOf('expense').map(c => {
      const s = spent.get(c.id) || 0;
      return { cat: c, spent: s, cap: c.budget, level: level(s, c.budget) };
    }),
  };
}

export function lastMonths(ym, count) {
  return Array.from({ length: count }, (_, i) => addMonths(ym, i - count + 1))
    .map(m => ({ ym: m, ...totals(m) }));
}

export const change = (now, before) => (before ? (now - before) / before : null);

// Qui doit combien à qui : chaque dépense commune payée par A donne à A une créance de la moitié.
// Les remboursements de A vers B augmentent ce que B doit à A.
function balance(txs, settlements, [a, b]) {
  let aheadTwice = 0;
  for (const t of txs) {
    if (t.type !== 'expense' || t.shared === false) continue;
    const payer = t.paidBy ?? t.createdBy;
    if (payer === a) aheadTwice += t.amount;
    else if (payer === b) aheadTwice -= t.amount;
  }
  for (const s of settlements) {
    if (s.from === a && s.to === b) aheadTwice += 2 * s.amount;
    if (s.from === b && s.to === a) aheadTwice -= 2 * s.amount;
  }
  const ahead = Math.round(aheadTwice / 2);
  return { amount: Math.abs(ahead), creditor: ahead >= 0 ? a : b, debtor: ahead >= 0 ? b : a };
}

// Partage 50/50 entre deux membres : détail du mois + total cumulé à régler (tous les mois).
export function split(ym, ids) {
  const [a, b] = ids;
  const payer = t => t.paidBy ?? t.createdBy;
  const txs = txOfMonth(ym);
  const sum = (who, type, shared) => txs
    .filter(t => t.type === type && payer(t) === who && (shared === undefined || (t.shared !== false) === shared))
    .reduce((n, t) => n + t.amount, 0);
  const paid = { [a]: sum(a, 'expense', true), [b]: sum(b, 'expense', true) };
  return {
    total: paid[a] + paid[b],
    paid,
    personal: { [a]: sum(a, 'expense', false), [b]: sum(b, 'expense', false) },
    income: { [a]: sum(a, 'income'), [b]: sum(b, 'income') },
    month: balance(txs, [], ids),
    due: balance(state.transactions, state.settlements, ids),
    settlements: state.settlements.filter(s => s.month === ym),
  };
}
