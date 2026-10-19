import { categoryById } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { money, compactMoney, percent, monthLabel, addMonths, esc } from '../format.js';
import { totals, byCategory, lastMonths, change } from '../calc.js';
import { donut, bars } from '../chart.js';
import { render } from '../router.js';
import { month, monthNav, bindMonthNav } from './month.js';

const view = { type: 'expense' };

function delta(now, before, { goodWhenDown }) {
  const c = change(now, before);
  if (c === null) return `<small class="muted">${esc(t('stats.noPrev'))}</small>`;
  const up = c > 0;
  const good = goodWhenDown ? !up : up;
  return `<small class="${c === 0 ? 'muted' : good ? 'good' : 'bad'}">${up ? '▲' : c < 0 ? '▼' : '='} ${percent(Math.abs(c))} ${esc(t('stats.vsPrev', { month: monthLabel(addMonths(month.value, -1), true) }))}</small>`;
}

export function renderStats(main) {
  const prevYm = addMonths(month.value, -1);
  const now = totals(month.value), prev = totals(prevYm);
  const sums = byCategory(month.value, view.type), prevSums = byCategory(prevYm, view.type);
  const total = view.type === 'expense' ? now.expense : now.income;
  const segments = [...sums]
    .map(([id, value]) => ({ cat: categoryById(id), id, value }))
    .sort((a, b) => b.value - a.value)
    .map(s => ({ ...s, color: s.cat.color, label: `${categoryName(s.cat)} · ${money(s.value)}` }));
  const trend = lastMonths(month.value, 6).map(m => ({
    label: monthLabel(m.ym, true).replace('.', ''),
    value: view.type === 'expense' ? m.expense : m.income,
    highlight: m.ym === month.value,
  }));

  main.innerHTML = `
  ${monthNav()}
  <div class="kpis">
    <div class="card kpi"><span class="label">${esc(t('sum.expense'))}</span><b class="expense">${money(now.expense)}</b>${delta(now.expense, prev.expense, { goodWhenDown: true })}</div>
    <div class="card kpi"><span class="label">${esc(t('sum.income'))}</span><b class="income">${money(now.income)}</b>${delta(now.income, prev.income, { goodWhenDown: false })}</div>
    <div class="card kpi wide"><span class="label">${esc(t('sum.balance'))}</span><b class="${now.balance < 0 ? 'expense' : ''}">${money(now.balance)}</b></div>
  </div>

  <div class="seg">
    ${['expense', 'income'].map(type => `<button type="button" data-type="${type}" class="${view.type === type ? 'active ' + type : ''}">${t(`sum.${type}`)}</button>`).join('')}
  </div>

  <section class="card">
    <h2>${esc(t('stats.byCategory'))}</h2>
    ${segments.length ? `
      ${donut(segments, `<b>${money(total)}</b>`)}
      <ul class="legend">
        ${segments.map(s => {
          const before = prevSums.get(s.id) || 0;
          const c = change(s.value, before);
          const good = view.type === 'expense' ? c < 0 : c > 0;
          return `<li>
            <i class="dot" style="background:${s.color}"></i>
            <span class="legend-name">${esc(categoryName(s.cat))}</span>
            <span class="legend-pct">${percent(s.value / total)}</span>
            <b>${money(s.value)}</b>
            <small class="${c === null || c === 0 ? 'muted' : good ? 'good' : 'bad'}">${c === null ? '–' : `${c > 0 ? '▲' : '▼'} ${percent(Math.abs(c))}`}</small>
          </li>`;
        }).join('')}
      </ul>` : `<p class="muted">${esc(t('stats.empty'))}</p>`}
  </section>

  <section class="card">
    <h2>${esc(t('stats.trend'))}</h2>
    ${bars(trend, compactMoney)}
  </section>`;

  bindMonthNav(main, render);
  main.querySelector('.seg').onclick = e => {
    const b = e.target.closest('[data-type]');
    if (b) { view.type = b.dataset.type; render(); }
  };
}
