import * as db from './db.js';

export const PALETTE = ['#2f9e6e', '#3478f6', '#e8590c', '#d6336c', '#7048e8', '#0c8599',
  '#f59f00', '#c2255c', '#5c940d', '#495057', '#1098ad', '#ae3ec9'];

const DEFAULT_CATEGORIES = [
  { id: 'groceries', key: 'cat.groceries', kind: 'expense', color: '#2f9e6e' },
  { id: 'transport', key: 'cat.transport', kind: 'expense', color: '#3478f6' },
  { id: 'rent', key: 'cat.rent', kind: 'expense', color: '#e8590c' },
  { id: 'leisure', key: 'cat.leisure', kind: 'expense', color: '#7048e8' },
  { id: 'health', key: 'cat.health', kind: 'expense', color: '#d6336c' },
  { id: 'other', key: 'cat.other', kind: 'expense', color: '#495057', locked: true },
  { id: 'salary', key: 'cat.salary', kind: 'income', color: '#2f9e6e' },
  { id: 'other_income', key: 'cat.otherIncome', kind: 'income', color: '#0c8599', locked: true },
];

const defaultCategories = () => DEFAULT_CATEGORIES.map((c, i) => ({ ...c, order: i, budget: null }));

const DEFAULT_SETTINGS = {
  lang: (navigator.language || 'fr').toLowerCase().startsWith('pt') ? 'pt' : 'fr',
  currency: 'EUR',
  monthlyBudget: null,
};

export const state = { transactions: [], categories: [], settings: { ...DEFAULT_SETTINGS } };

export const uid = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export async function init() {
  navigator.storage?.persist?.().catch(() => {});
  const [transactions, categories, settings] = await Promise.all(db.STORES.map(db.getAll));
  state.transactions = transactions;
  state.categories = categories.length ? categories : defaultCategories();
  if (!categories.length) await db.putMany('categories', state.categories);
  settings.forEach(({ key, value }) => (state.settings[key] = value));
}

export async function saveTransaction(tx) {
  const item = { id: uid(), createdAt: Date.now(), note: '', ...tx };
  const i = state.transactions.findIndex(t => t.id === item.id);
  i >= 0 ? (state.transactions[i] = item) : state.transactions.push(item);
  await db.put('transactions', item);
  return item;
}

export async function deleteTransaction(id) {
  const item = state.transactions.find(t => t.id === id);
  state.transactions = state.transactions.filter(t => t.id !== id);
  await db.remove('transactions', id);
  return item;
}

export async function saveCategory(cat) {
  const item = { id: uid(), budget: null, order: state.categories.length, ...cat };
  const i = state.categories.findIndex(c => c.id === item.id);
  i >= 0 ? (state.categories[i] = item) : state.categories.push(item);
  await db.put('categories', item);
  return item;
}

export async function deleteCategory(id) {
  const cat = categoryById(id);
  if (!cat || cat.locked) return;
  const fallback = cat.kind === 'income' ? 'other_income' : 'other';
  const moved = state.transactions.filter(t => t.categoryId === id).map(t => ({ ...t, categoryId: fallback }));
  state.transactions = state.transactions.map(t => moved.find(m => m.id === t.id) || t);
  state.categories = state.categories.filter(c => c.id !== id);
  await db.putMany('transactions', moved);
  await db.remove('categories', id);
}

export async function setSetting(key, value) {
  state.settings[key] = value;
  await db.put('settings', { key, value });
}

export async function replaceAll({ transactions = [], categories = [], settings = {} }) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  const cats = categories.length ? categories : defaultCategories();
  await db.replaceAll({
    transactions,
    categories: cats,
    settings: Object.entries(merged).map(([key, value]) => ({ key, value })),
  });
  state.transactions = transactions;
  state.categories = cats;
  state.settings = merged;
}

export async function addTransactions(list) {
  state.transactions.push(...list);
  await db.putMany('transactions', list);
}

export const categoryById = id => state.categories.find(c => c.id === id)
  || state.categories.find(c => c.id === 'other');

export const categoriesOf = kind => state.categories
  .filter(c => c.kind === kind)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
