import { state } from './store.js';

export const locale = () => (state.settings.lang === 'pt' ? 'pt-PT' : 'fr-FR');

const formatters = new Map();
function currencyFormat() {
  const key = `${locale()}|${state.settings.currency}`;
  if (!formatters.has(key)) {
    let f;
    try { f = new Intl.NumberFormat(locale(), { style: 'currency', currency: state.settings.currency }); }
    catch { f = new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }); }
    formatters.set(key, f);
  }
  return formatters.get(key);
}

export const money = cents => currencyFormat().format(cents / 100);

export const compactMoney = cents =>
  new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(cents / 100);

export const signedMoney = (cents, type) => (type === 'income' ? '+' : '−') + money(Math.abs(cents));

export const currencySymbol = () =>
  currencyFormat().formatToParts(0).find(p => p.type === 'currency')?.value ?? state.settings.currency;

export function parseAmount(input) {
  const clean = String(input).replace(/[\s ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(clean)) return NaN;
  return Math.round(Number(clean) * 100);
}

export const centsToInput = cents => (cents / 100).toFixed(2).replace('.', ',').replace(/,00$/, '');

export const percent = ratio => `${Math.round(ratio * 100)} %`;

const pad = n => String(n).padStart(2, '0');
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate();
export const parseIso = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d || 1); };

export const monthOf = iso => iso.slice(0, 7);
export const currentMonth = () => monthOf(today());
export function addMonths(ym, n) {
  const d = parseIso(`${ym}-01`);
  d.setMonth(d.getMonth() + n);
  return isoDate(d).slice(0, 7);
}
export const daysInMonth = ym => { const d = parseIso(`${ym}-01`); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };

export const monthLabel = (ym, short = false) =>
  parseIso(`${ym}-01`).toLocaleDateString(locale(), short ? { month: 'short' } : { month: 'long', year: 'numeric' });

export const dateLabel = iso => parseIso(iso).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
export const shortDate = iso => parseIso(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
