import { state, saveCategory, setSetting } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { money, percent, parseAmount, centsToInput, currencySymbol, currentMonth, daysInMonth, esc } from '../format.js';
import { budgetStatus } from '../calc.js';
import { sheet, toast, $ } from '../ui.js';
import { render } from '../router.js';
import { month, monthNav, bindMonthNav } from './month.js';
import { splitCard, bindSplit } from './split.js';

function progress({ spent, cap, level }) {
  if (!cap) return '';
  return `<div class="progress ${level}"><i style="width:${Math.min(100, (spent / cap) * 100)}%"></i></div>`;
}

function remainingLine(spent, cap) {
  if (spent > cap) return `<p class="small over-text">${esc(t('budget.over', { amount: money(spent - cap) }))}</p>`;
  const isCurrent = month.value === currentMonth();
  const daysLeft = isCurrent ? daysInMonth(month.value) - new Date().getDate() + 1 : 0;
  const left = cap - spent;
  return `<p class="small muted">${isCurrent
    ? esc(t('budget.remaining', { amount: money(left), perDay: money(Math.floor(left / daysLeft)) }))
    : esc(money(left))}</p>`;
}

export function renderBudget(main) {
  const status = budgetStatus(month.value);
  const g = status.global;
  const alerts = status.categories.filter(c => c.level === 'warn' || c.level === 'over');
  if (g.level === 'warn' || g.level === 'over') alerts.unshift({ ...g, cat: null });

  main.innerHTML = `
  ${monthNav()}
  ${splitCard(month.value)}
  <button type="button" class="card budget-global ${g.level}" data-edit="global">
    <div class="row between"><span class="label">${esc(t('budget.global'))}</span>${g.cap ? `<b class="pct">${percent(g.spent / g.cap)}</b>` : ''}</div>
    <p class="big">${money(g.spent)}${g.cap ? ` <small>/ ${money(g.cap)}</small>` : ''}</p>
    ${g.cap ? progress(g) + remainingLine(g.spent, g.cap) : `<p class="small link">＋ ${esc(t('budget.setCap'))}</p>`}
  </button>

  ${alerts.length ? `<div class="card alerts">
    <span class="label">${esc(t('budget.alerts'))}</span>
    ${alerts.map(a => `<p class="${a.level}">${a.level === 'over' ? '🚨' : '⚠️'} ${esc(a.cat ? categoryName(a.cat) : t('budget.all'))} · ${percent(a.spent / a.cap)}</p>`).join('')}
  </div>` : ''}

  <h2 class="section-title">${esc(t('budget.categories'))}</h2>
  <ul class="budget-list">
    ${status.categories.map(c => `<li>
      <button type="button" class="budget-row ${c.level}" data-edit="${c.cat.id}">
        <div class="row between">
          <span class="cat-name"><i class="dot" style="background:${c.cat.color}"></i>${esc(categoryName(c.cat))}</span>
          <span class="amounts">${money(c.spent)}${c.cap ? ` <small>/ ${money(c.cap)}</small>` : ''}</span>
        </div>
        ${c.cap ? progress(c) : `<p class="small muted">${esc(t('budget.noCap'))} · <span class="link">${esc(t('budget.setCap'))}</span></p>`}
      </button>
    </li>`).join('')}
  </ul>`;

  bindMonthNav(main, render);
  bindSplit(main, month.value);
  main.querySelectorAll('[data-edit]').forEach(b => (b.onclick = () => editCap(b.dataset.edit)));
}

function editCap(id) {
  const cat = id === 'global' ? null : state.categories.find(c => c.id === id);
  const current = cat ? cat.budget : state.settings.monthlyBudget;
  sheet(`
    <h2>${esc(cat ? t('budget.capFor', { name: categoryName(cat) }) : t('budget.globalCap'))}</h2>
    <form id="cap-form" class="form" novalidate>
      <label>${esc(t('form.amount'))} (${esc(currencySymbol())})
        <input id="cap-amount" inputmode="decimal" autocomplete="off" value="${current ? centsToInput(current) : ''}" placeholder="0">
      </label>
      <p class="small muted">${esc(t('budget.capHelp'))}</p>
      <div class="sheet-actions"><button type="submit" class="btn primary">${esc(t('save'))}</button></div>
    </form>`, {
    onMount: (panel, close) => {
      const input = $('#cap-amount');
      input.focus();
      $('#cap-form').onsubmit = async e => {
        e.preventDefault();
        const raw = input.value.trim();
        const value = raw ? parseAmount(raw) : null;
        if (raw && !value) return toast(t('form.invalidAmount'), { kind: 'warn' });
        if (cat) await saveCategory({ ...cat, budget: value });
        else await setSetting('monthlyBudget', value);
        close();
        render();
      };
    },
  });
}
