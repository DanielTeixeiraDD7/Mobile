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
