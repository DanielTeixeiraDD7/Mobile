import { categoryById } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { money, signedMoney, dateLabel, today, esc } from '../format.js';
import { txOfMonth, totals } from '../calc.js';
import { gestures, $$ } from '../ui.js';
import { render } from '../router.js';
import { sync, memberName } from '../sync.js';
import { currentUser } from '../auth.js';
import { month, monthNav, bindMonthNav } from './month.js';
import { editTransaction, transactionActions, removeWithUndo, findTx } from './txform.js';

export function renderList(main) {
  const list = txOfMonth(month.value).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const sum = totals(month.value);
  const days = list.reduce((m, tx) => m.set(tx.date, [...(m.get(tx.date) || []), tx]), new Map());

  main.innerHTML = `
  ${monthNav()}
  <div class="summary">
    <div><span>${esc(t('sum.income'))}</span><b class="income">${money(sum.income)}</b></div>
    <div><span>${esc(t('sum.expense'))}</span><b class="expense">${money(sum.expense)}</b></div>
    <div><span>${esc(t('sum.balance'))}</span><b class="${sum.balance < 0 ? 'expense' : ''}">${money(sum.balance)}</b></div>
  </div>
  ${list.length ? `<p class="help">${esc(t('list.help'))}</p>` : `
    <div class="empty"><p>${esc(t('list.empty'))}</p><p class="muted">${esc(t('list.emptyHint'))}</p></div>`}
  ${[...days].map(([date, items]) => {
    const net = items.reduce((s, tx) => s + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return `<section class="day">
      <header><span>${esc(date === today() ? t('add.today') : dateLabel(date))}</span><span class="${net < 0 ? 'expense' : 'income'}">${net < 0 ? '−' : '+'}${money(Math.abs(net))}</span></header>
      <ul>${items.map(row).join('')}</ul>
    </section>`;
  }).join('')}`;

  bindMonthNav(main, render);
  $$('.tx', main).forEach(el => {
    const tx = findTx(el.dataset.id);
    gestures(el, {
      onSwipeLeft: () => removeWithUndo(tx),
      onLongPress: () => transactionActions(tx),
      onTap: () => editTransaction(tx),
    });
  });
}

function subtitle(tx) {
  const author = sync.members.length > 1 && tx.createdBy && tx.createdBy !== currentUser()?.id && memberName(tx.createdBy);
  return [tx.note, author && t('share.by', { name: author })].filter(Boolean).join(' · ');
}

function row(tx) {
  const cat = categoryById(tx.categoryId);
  return `<li class="tx" data-id="${tx.id}">
    <div class="row-bg">🗑️ ${esc(t('delete'))}</div>
    <div class="row-content">
      <i class="dot" style="background:${cat.color}"></i>
      <div class="tx-text"><b>${esc(categoryName(cat))}</b>${subtitle(tx) ? `<small>${esc(subtitle(tx))}</small>` : ''}</div>
      <span class="tx-amount ${tx.type}">${signedMoney(tx.amount, tx.type)}</span>
    </div>
  </li>`;
}
