import { state, saveCategory, addTransactions, uid, categoriesOf, PALETTE } from './store.js';
import { t, categoryName, allTranslations } from './i18n.js';

const BOM = '﻿';
const COLUMNS = ['date', 'type', 'amount', 'category', 'note'];
const ALIASES = {
  date: ['date', 'data', ...allTranslations('csv.date')],
  type: ['type', 'tipo', ...allTranslations('csv.type')],
  amount: ['amount', 'montant', 'valor', 'valeur', ...allTranslations('csv.amount')],
  category: ['category', 'categorie', 'catégorie', 'categoria', ...allTranslations('csv.category')],
  note: ['note', 'nota', 'libellé', 'libelle', 'description', 'descrição', ...allTranslations('csv.note')],
};
const INCOME_WORDS = ['income', 'revenu', 'recette', 'receita', 'entrada', 'crédit', 'credit', ...allTranslations('type.income')]
  .map(w => w.toLowerCase());

function cell(value) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(transactions = state.transactions) {
  const header = [t('csv.date'), t('csv.type'), t('csv.amount'), t('csv.category'), t('csv.note')];
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map(tx => [
      tx.date,
      t(`type.${tx.type}`),
      (tx.amount / 100).toFixed(2).replace('.', ','),
      categoryName(state.categories.find(c => c.id === tx.categoryId) || { key: 'cat.other' }),
      tx.note,
    ]);
  return BOM + [header, ...rows].map(r => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

export function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim()));
}

function parseDate(s) {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

function parseSignedAmount(s) {
  let v = s.replace(/^'/, '').replace(/[^\d,.\-]/g, '');
  const lastComma = v.lastIndexOf(','), lastDot = v.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) v = lastComma > lastDot ? v.replace(/\./g, '').replace(',', '.') : v.replace(/,/g, '');
  else v = v.replace(',', '.');
  const n = Number(v);
  return v && Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

function mapHeader(header) {
  const norm = header.map(h => h.trim().toLowerCase());
  const map = {};
  for (const col of COLUMNS) {
    const i = norm.findIndex(h => ALIASES[col].some(a => a && a.toLowerCase() === h));
    if (i >= 0) map[col] = i;
  }
  return map.date !== undefined && map.amount !== undefined ? map : null;
}

export async function importCSV(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('empty');
  let map = mapHeader(rows[0]);
  const body = map ? rows.slice(1) : rows;
  map ??= { date: 0, type: 1, amount: 2, category: 3, note: 4 };

  const existing = new Set(state.transactions.map(key));
  const added = [];
  let skipped = 0;

  for (const r of body) {
    const date = parseDate(r[map.date] ?? '');
    const signed = parseSignedAmount(r[map.amount] ?? '');
    if (!date || !signed) { skipped++; continue; }
    const typeCell = map.type !== undefined ? (r[map.type] ?? '').trim().toLowerCase() : '';
    const type = typeCell ? (INCOME_WORDS.includes(typeCell) ? 'income' : 'expense') : (signed > 0 && map.type === undefined ? 'income' : 'expense');
    const categoryId = await findOrCreateCategory((r[map.category] ?? '').trim(), type);
    const note = (r[map.note] ?? '').trim().replace(/^'(?=[=+\-@])/, '');
    const tx = { id: uid(), type, amount: Math.abs(signed), categoryId, date, note, createdAt: Date.now() + added.length };
    if (existing.has(key(tx))) { skipped++; continue; }
    existing.add(key(tx));
    added.push(tx);
  }
  await addTransactions(added);
  return { added: added.length, skipped };
}

const key = tx => [tx.date, tx.type, tx.amount, tx.categoryId, tx.note].join('|');

async function findOrCreateCategory(name, kind) {
  if (!name) return kind === 'income' ? 'other_income' : 'other';
  const found = categoriesOf(kind).find(c => categoryName(c).toLowerCase() === name.toLowerCase());
  if (found) return found.id;
  const cat = await saveCategory({ name, kind, color: PALETTE[state.categories.length % PALETTE.length] });
  return cat.id;
}
