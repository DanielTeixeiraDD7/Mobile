import { state, replaceAll } from './store.js';

const FORMAT = 'budget-local';

export function toJSON() {
  return JSON.stringify({
    format: FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    categories: state.categories,
    transactions: state.transactions,
  }, null, 2);
}

const validTx = tx => tx && typeof tx.id === 'string'
  && ['expense', 'income'].includes(tx.type)
  && Number.isInteger(tx.amount) && tx.amount > 0
  && /^\d{4}-\d{2}-\d{2}$/.test(tx.date)
  && typeof tx.categoryId === 'string';

const validCat = c => c && typeof c.id === 'string' && ['expense', 'income'].includes(c.kind)
  && typeof c.color === 'string' && (c.name || c.key);

export async function restoreJSON(text) {
  const data = JSON.parse(text);
  if (data.format !== FORMAT || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
    throw new Error('format');
  }
  const transactions = data.transactions.filter(validTx);
  const categories = data.categories.filter(validCat);
  await replaceAll({ transactions, categories, settings: data.settings || {} });
  return transactions.length;
}
