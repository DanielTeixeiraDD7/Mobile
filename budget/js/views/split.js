import { saveSettlement, deleteSettlement } from '../store.js';
import { t } from '../i18n.js';
import { money, shortDate, isoDate, currentMonth, esc } from '../format.js';
import { split } from '../calc.js';
import { isCouple, coupleIds, memberName } from '../sync.js';
import { confirmSheet } from '../ui.js';
import { render } from '../router.js';

export function splitCard(ym) {
  if (!isCouple()) return '';
  const ids = coupleIds();
  const s = split(ym, ids);
  const name = id => esc(memberName(id));
  const pct = id => (s.total ? (s.paid[id] / s.total) * 100 : 50);

  return `<section class="card split">
    <div class="row between">
      <span class="label">${esc(t('split.title'))}</span>
      <span class="small muted">${esc(t('split.common', { amount: money(s.total) }))}</span>
    </div>
    ${s.total ? `
      <div class="split-bar" role="img" aria-label="${ids.map(id => `${memberName(id)} ${money(s.paid[id])}`).join(', ')}">
        ${ids.map((id, i) => `<i class="p${i}" style="width:${pct(id)}%"></i>`).join('')}
        <b class="half"></b>
      </div>
      <div class="split-people">
        ${ids.map((id, i) => `<div class="p${i}"><span>${esc(t('split.paid', { name: memberName(id) }))}</span><b>${money(s.paid[id])}</b></div>`).join('')}
      </div>
      <p class="small muted center">${esc(t('split.share', { amount: money(Math.round(s.total / 2)) }))}</p>
      <p class="small center">${esc(s.month.amount
        ? t('split.monthOwes', { debtor: memberName(s.month.debtor), amount: money(s.month.amount), creditor: memberName(s.month.creditor) })
        : t('split.monthEven'))}</p>`
    : `<p class="small muted">${esc(t('split.empty'))}</p>`}
    <div class="due">
      <span class="label">${esc(t('split.due'))}</span>
      ${s.due.amount ? `
        <p class="split-result">${esc(t('split.owes', { debtor: memberName(s.due.debtor), amount: money(s.due.amount), creditor: memberName(s.due.creditor) }))}</p>
        <button type="button" class="btn primary" data-settle>${esc(t('split.settle'))}</button>`
      : `<p class="split-result ok">${esc(t('split.allSettled'))}</p>`}
    </div>
    ${s.settlements.length ? `
      <div class="refunds">
        <span class="label">${esc(t('split.refunds'))}</span>
        ${s.settlements.map(r => `<div class="refund">
          <span>${name(r.from)} → ${name(r.to)} · <b>${money(r.amount)}</b> <small class="muted">${esc(shortDate(isoDate(new Date(r.createdAt))))}</small></span>
          <button type="button" class="icon-btn small" data-unsettle="${r.id}" aria-label="${esc(t('delete'))}">✕</button>
        </div>`).join('')}
      </div>` : ''}
    <div class="split-extra">
      <span></span>${ids.map(id => `<b>${name(id)}</b>`).join('')}
      <span>${esc(t('split.income'))}</span>${ids.map(id => `<span>${money(s.income[id])}</span>`).join('')}
      <span>${esc(t('split.personal'))}</span>${ids.map(id => `<span>${money(s.personal[id])}</span>`).join('')}
    </div>
  </section>`;
}

export function bindSplit(root, ym) {
  root.querySelector('[data-settle]')?.addEventListener('click', async () => {
    const { due } = split(ym, coupleIds());
    const message = t('split.settleConfirm', { debtor: memberName(due.debtor), amount: money(due.amount), creditor: memberName(due.creditor) });
    if (!(await confirmSheet(message, { ok: t('split.settle'), danger: false }))) return;
    await saveSettlement({ month: currentMonth(), from: due.debtor, to: due.creditor, amount: due.amount });
    render();
  });
  root.querySelectorAll('[data-unsettle]').forEach(b => b.addEventListener('click', async () => {
    if (!(await confirmSheet(t('split.undoConfirm')))) return;
    await deleteSettlement(b.dataset.unsettle);
    render();
  }));
}
