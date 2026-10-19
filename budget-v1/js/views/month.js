import { currentMonth, addMonths, monthLabel, esc } from '../format.js';

let shownCurrent = currentMonth();
export const month = { value: shownCurrent };

// Passe au nouveau mois si l'app est restée ouverte pendant le changement de mois.
export function followCalendar() {
  if (currentMonth() === shownCurrent) return;
  if (month.value === shownCurrent) month.value = currentMonth();
  shownCurrent = currentMonth();
}

export function monthNav() {
  const isCurrent = month.value >= currentMonth();
  return `<div class="month-nav">
    <button type="button" class="icon-btn" data-month="-1" aria-label="◀">‹</button>
    <h1>${esc(monthLabel(month.value))}</h1>
    <button type="button" class="icon-btn" data-month="1" aria-label="▶" ${isCurrent ? 'disabled' : ''}>›</button>
  </div>`;
}

export function bindMonthNav(root, onChange) {
  root.querySelector('.month-nav').onclick = e => {
    const b = e.target.closest('[data-month]');
    if (!b || b.disabled) return;
    month.value = addMonths(month.value, Number(b.dataset.month));
    onChange();
  };
}
