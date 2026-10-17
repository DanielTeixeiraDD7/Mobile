import * as db from './db.js';
import * as outbox from './outbox.js';

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

export const SHARED_SETTINGS = ['currency', 'monthlyBudget'];

export const state = { transactions: [], categories: [], settings: { ...DEFAULT_SETTINGS } };

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

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
  await outbox.enqueue('transactions', item.id, item);
  return item;
}

export async function deleteTransaction(id) {
  const item = state.transactions.find(t => t.id === id);
  state.transactions = state.transactions.filter(t => t.id !== id);
  await db.remove('transactions', id);
  await outbox.enqueue('transactions', id, null);
  return item;
}

export async function saveCategory(cat) {
  const item = { id: uid(), budget: null, order: state.categories.length, ...cat };
  const i = state.categories.findIndex(c => c.id === item.id);
  i >= 0 ? (state.categories[i] = item) : state.categories.push(item);
  await db.put('categories', item);
  await outbox.enqueue('categories', item.id, item);
  return item;
}

export async function deleteCategory(id) {
  const cat = categoryById(id);
  if (!cat || cat.locked) return;
  const fallback = fallbackCategory(cat.kind).id;
  const moved = state.transactions.filter(t => t.categoryId === id).map(t => ({ ...t, categoryId: fallback }));
  state.transactions = state.transactions.map(t => moved.find(m => m.id === t.id) || t);
  state.categories = state.categories.filter(c => c.id !== id);
  await db.putMany('transactions', moved);
  await db.remove('categories', id);
  await outbox.enqueueMany('transactions', moved);
  await outbox.enqueue('categories', id, null);
}

export async function setSetting(key, value) {
  state.settings[key] = value;
  await db.put('settings', { key, value });
  if (SHARED_SETTINGS.includes(key)) await outbox.enqueue('household', 'settings', sharedSettings());
}

const sharedSettings = () => Object.fromEntries(SHARED_SETTINGS.map(k => [k, state.settings[k]]));

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
  await outbox.enqueueMany('transactions', list);
}

// Remplace catégories et opérations par celles du foyer partagé, en conservant les réglages locaux.
export async function adoptData({ transactions, categories }) {
  await db.replaceAll({ transactions, categories }, ['transactions', 'categories']);
  state.transactions = transactions;
  state.categories = categories;
}

// Applique les changements reçus du serveur (sauf les lignes modifiées localement et pas encore envoyées).
export async function applyRemote({ transactions = [], categories = [], settings }, pendingKeys) {
  const merge = (list, rows, table) => {
    const byId = new Map(list.map(x => [x.id, x]));
    const put = [], del = [];
    for (const { row, deleted } of rows) {
      if (pendingKeys.has(`${table}:${row.id}`)) continue;
      if (deleted) { byId.delete(row.id); del.push(row.id); }
      else { byId.set(row.id, row); put.push(row); }
    }
    return { list: [...byId.values()], put, del };
  };
  const tx = merge(state.transactions, transactions, 'transactions');
  const cat = merge(state.categories, categories, 'categories');
  state.transactions = tx.list;
  state.categories = cat.list;
  await db.putMany('transactions', tx.put);
  await db.removeMany('transactions', tx.del);
  await db.putMany('categories', cat.put);
  await db.removeMany('categories', cat.del);
  if (settings && !pendingKeys.has('household:settings')) {
    Object.assign(state.settings, settings);
    await db.putMany('settings', Object.entries(settings).map(([key, value]) => ({ key, value })));
  }
  return tx.put.length + tx.del.length + cat.put.length + cat.del.length;
}

export const fallbackCategory = kind =>
  state.categories.find(c => c.key === (kind === 'income' ? 'cat.otherIncome' : 'cat.other'))
  || state.categories.find(c => c.kind === kind);

export const categoryById = id => state.categories.find(c => c.id === id) || fallbackCategory('expense');

export const categoriesOf = kind => state.categories
  .filter(c => c.kind === kind)
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
