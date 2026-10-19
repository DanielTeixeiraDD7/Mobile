import { t } from '../i18n.js';
import { esc } from '../format.js';
import { currentUser } from '../auth.js';
import { isCouple, coupleIds, memberName } from '../sync.js';

// Sélecteurs « Payé par » et « Commun / Perso », affichés seulement dans un budget à deux.
export function whoControls(draft) {
  if (!isCouple()) return '';
  const payer = draft.paidBy || currentUser().id;
  return `<div class="who">
    <span class="label">${esc(t(draft.type === 'income' ? 'who.receivedBy' : 'who.paidBy'))}</span>
    <div class="seg small" data-who>
      ${coupleIds().map(id => `<button type="button" data-payer="${id}" class="${id === payer ? 'active' : ''}">${esc(memberName(id))}</button>`).join('')}
    </div>
    ${draft.type === 'expense' ? `<button type="button" class="chip ${draft.shared === false ? 'personal' : ''}" data-shared>${esc(t(draft.shared === false ? 'who.personal' : 'who.shared'))}</button>` : ''}
  </div>`;
}

export function bindWho(root, draft, onChange) {
  root.querySelector('.who')?.addEventListener('click', e => {
    const payer = e.target.closest('[data-payer]');
    if (payer) draft.paidBy = payer.dataset.payer;
    else if (e.target.closest('[data-shared]')) draft.shared = draft.shared === false;
    else return;
    onChange();
  });
}

export function whoFields(draft) {
  if (!isCouple()) return {};
  return { paidBy: draft.paidBy || currentUser().id, shared: draft.type === 'expense' ? draft.shared !== false : true };
}
