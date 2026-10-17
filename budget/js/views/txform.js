import { state, saveTransaction, deleteTransaction, categoriesOf } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { parseAmount, centsToInput, currencySymbol, today, esc } from '../format.js';
import { sheet, toast, $ } from '../ui.js';
import { render } from '../router.js';
import { whoControls, bindWho, whoFields } from './who.js';

export function editTransaction(tx) {
  const draft = { ...tx };

  const catButtons = () => categoriesOf(draft.type).map(c => `
    <button type="button" class="cat small ${c.id === draft.categoryId ? 'selected' : ''}" data-cat="${c.id}" style="--c:${c.color}">
      <i></i><span>${esc(categoryName(c))}</span></button>`).join('');

  sheet(`
    <h2>${esc(t('form.editTitle'))}</h2>
    <form id="tx-form" class="form" novalidate>
      <div class="seg" id="tx-type">
        ${['expense', 'income'].map(type => `<button type="button" data-type="${type}" class="${draft.type === type ? 'active ' + type : ''}">${t(`type.${type}`)}</button>`).join('')}
      </div>
      <label>${esc(t('form.amount'))} (${esc(currencySymbol())})
        <input id="tx-amount" inputmode="decimal" autocomplete="off" value="${centsToInput(draft.amount)}" required>
      </label>
      <div id="tx-who">${whoControls(draft)}</div>
      <div>
        <span class="label">${esc(t('form.category'))}</span>
        <div class="cats compact" id="tx-cats">${catButtons()}</div>
      </div>
      <div class="grid2">
        <label>${esc(t('form.date'))}<input id="tx-date" type="date" value="${draft.date}" max="${today()}" required></label>
        <label>${esc(t('form.note'))}<input id="tx-note" maxlength="80" value="${esc(draft.note)}"></label>
      </div>
      <div class="sheet-actions">
        <button type="submit" class="btn primary">${esc(t('save'))}</button>
        <button type="button" class="btn danger" id="tx-delete">${esc(t('delete'))}</button>
      </div>
    </form>`, {
    onMount: (panel, close) => {
      const refreshWho = () => ($('#tx-who').innerHTML = whoControls(draft));
      bindWho(panel, draft, refreshWho);
      $('#tx-type').onclick = e => {
        const b = e.target.closest('[data-type]');
        if (!b || b.dataset.type === draft.type) return;
        draft.type = b.dataset.type;
        draft.categoryId = categoriesOf(draft.type)[0]?.id;
        panel.querySelectorAll('#tx-type button').forEach(x => (x.className = x.dataset.type === draft.type ? `active ${draft.type}` : ''));
        $('#tx-cats').innerHTML = catButtons();
        refreshWho();
      };
      $('#tx-cats').onclick = e => {
        const b = e.target.closest('[data-cat]');
        if (!b) return;
        draft.categoryId = b.dataset.cat;
        $('#tx-cats').innerHTML = catButtons();
      };
      $('#tx-form').onsubmit = async e => {
        e.preventDefault();
        const amount = parseAmount($('#tx-amount').value);
        if (!amount) return toast(t('form.invalidAmount'), { kind: 'warn' });
        await saveTransaction({ ...draft, ...whoFields(draft), amount, date: $('#tx-date').value || draft.date, note: $('#tx-note').value.trim() });
        close();
        render();
      };
      $('#tx-delete').onclick = () => { close(); removeWithUndo(tx); };
    },
  });
}

export async function removeWithUndo(tx) {
  await deleteTransaction(tx.id);
  render();
  toast(t('list.deleted'), { action: t('undo'), onAction: async () => { await saveTransaction(tx); render(); } });
}

export function transactionActions(tx) {
  const close = sheet(`
    <div class="sheet-actions">
      <button type="button" class="btn" data-act="edit">✏️ ${esc(t('edit'))}</button>
      <button type="button" class="btn danger" data-act="delete">🗑️ ${esc(t('delete'))}</button>
      <button type="button" class="btn ghost" data-act="close">${esc(t('close'))}</button>
    </div>`, {
    onMount: panel => panel.addEventListener('click', e => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (!act) return;
      close();
      if (act === 'edit') setTimeout(() => editTransaction(tx), 220);
      if (act === 'delete') removeWithUndo(tx);
    }),
  });
}

export const findTx = id => state.transactions.find(t => t.id === id);
