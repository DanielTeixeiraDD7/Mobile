import { state, saveTransaction, deleteTransaction, categoriesOf } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { money, signedMoney, currencySymbol, parseAmount, today, isoDate, shortDate, currentMonth, esc, percent } from '../format.js';
import { budgetStatus } from '../calc.js';
import { toast, vibrate, $ } from '../ui.js';
import { render } from '../router.js';
import { whoControls, bindWho, whoFields } from './who.js';

const draft = { amount: '', type: 'expense', date: today(), note: '', paidBy: null, shared: true };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];

function dateChipLabel(date) {
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (date === today()) return t('add.today');
  if (date === isoDate(yesterday)) return t('add.yesterday');
  return shortDate(date);
}

function monthLine() {
  const { global } = budgetStatus(currentMonth());
  if (!global.cap) return `<p class="month-line">${esc(t('add.monthSpentNoCap', { spent: money(global.spent) }))}</p>`;
  const pct = Math.min(100, (global.spent / global.cap) * 100);
  return `<div class="month-line ${global.level}">
    <span>${esc(t('add.monthSpent', { spent: money(global.spent), cap: money(global.cap) }))}</span>
    <div class="progress"><i style="width:${pct}%"></i></div>
  </div>`;
}

export function renderAdd(main) {
  const cats = categoriesOf(draft.type);
  main.innerHTML = `
  <section class="add">
    <div class="seg" role="tablist">
      ${['expense', 'income'].map(type => `<button type="button" role="tab" data-type="${type}" class="${draft.type === type ? 'active ' + type : ''}">${t(`type.${type}`)}</button>`).join('')}
    </div>
    <output class="amount ${draft.type}" id="amount">${amountHtml()}</output>
    ${draft.type === 'expense' ? monthLine() : ''}
    ${whoControls(draft)}
    <div class="meta">
      <label class="chip date-chip">📅 <span>${esc(dateChipLabel(draft.date))}</span>
        <input type="date" id="add-date" value="${draft.date}" max="${today()}" aria-label="${esc(t('form.date'))}">
      </label>
      <input type="text" id="add-note" class="note" maxlength="80" placeholder="${esc(t('add.note'))}" value="${esc(draft.note)}">
    </div>
    <p class="hint">${esc(t('add.hint'))}</p>
    <div class="cats">
      ${cats.map(c => `<button type="button" class="cat" data-cat="${c.id}" style="--c:${c.color}">
        <i></i><span>${esc(categoryName(c))}</span></button>`).join('')}
    </div>
    <div class="keypad">
      ${KEYS.map(k => `<button type="button" data-key="${k}" aria-label="${k === 'back' ? '⌫' : k}">${k === 'back' ? '⌫' : k}</button>`).join('')}
    </div>
  </section>`;

  main.querySelector('.seg').onclick = e => {
    const b = e.target.closest('[data-type]');
    if (b) { draft.type = b.dataset.type; render(); }
  };
  main.querySelector('.keypad').onclick = e => {
    const b = e.target.closest('[data-key]');
    if (b) press(b.dataset.key);
  };
  main.querySelector('.cats').onclick = e => {
    const b = e.target.closest('[data-cat]');
    if (b) submit(b.dataset.cat);
  };
  bindWho(main, draft, render);
  $('#add-date').onchange = e => { draft.date = e.target.value || today(); render(); };
  $('#add-note').oninput = e => (draft.note = e.target.value);
}

function amountHtml() {
  return `<span>${esc(draft.amount || '0')}</span><small>${esc(currencySymbol())}</small>`;
}

function press(key) {
  let a = draft.amount;
  if (key === 'back') a = a.slice(0, -1);
  else if (key === ',') a = a.includes(',') ? a : (a || '0') + ',';
  else {
    const [int, dec] = a.split(',');
    if (dec !== undefined && dec.length >= 2) return vibrate(30);
    if (dec === undefined && int.replace(/^0+/, '').length >= 7) return vibrate(30);
    a = a === '0' ? key : a + key;
  }
  draft.amount = a;
  $('#amount').innerHTML = amountHtml();
}

async function submit(categoryId) {
  const amount = parseAmount(draft.amount.replace(/,$/, ''));
  if (!amount) {
    const el = $('#amount');
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    vibrate(60);
    return toast(t('add.enterAmount'), { kind: 'warn' });
  }
  const before = budgetStatus(currentMonth());
  const tx = await saveTransaction({ type: draft.type, amount, categoryId, date: draft.date, note: draft.note.trim(), ...whoFields(draft) });
  Object.assign(draft, { amount: '', note: '', date: today(), paidBy: null, shared: true });
  vibrate(20);
  render();

  const cat = state.categories.find(c => c.id === categoryId);
  const alert = tx.type === 'expense' && budgetAlert(before, budgetStatus(currentMonth()), categoryId);
  toast(alert?.text || t('add.saved', { amount: signedMoney(amount, tx.type), cat: categoryName(cat) }), {
    kind: alert?.kind || '',
    action: t('undo'),
    onAction: async () => { await deleteTransaction(tx.id); render(); },
  });
  if (alert) vibrate([80, 60, 80]);
}

function budgetAlert(before, after, categoryId) {
  const rank = { none: 0, ok: 0, warn: 1, over: 2 };
  const checks = [
    { b: before.global, a: after.global, name: t('budget.all') },
    ...after.categories.filter(c => c.cat.id === categoryId).map(a => ({
      b: before.categories.find(c => c.cat.id === categoryId), a, name: categoryName(a.cat),
    })),
  ];
  const hit = checks.filter(c => rank[c.a.level] > rank[c.b.level]).sort((x, y) => rank[y.a.level] - rank[x.a.level])[0];
  if (!hit) return null;
  return hit.a.level === 'over'
    ? { kind: 'danger', text: t('budget.overToast', { name: hit.name }) }
    : { kind: 'warn', text: t('budget.warnToast', { name: hit.name, pct: percent(hit.a.spent / hit.a.cap) }) };
}

export function handleKey(e) {
  if (e.target.matches('input, textarea, select')) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === ',' || e.key === '.') press(',');
  else if (e.key === 'Backspace') press('back');
}
