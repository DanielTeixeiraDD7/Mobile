import { t } from './i18n.js';
import { esc } from './format.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const vibrate = pattern => navigator.vibrate?.(pattern);

let toastTimer;
export function toast(message, { action, onAction, kind = '' } = {}) {
  const el = $('#toast');
  el.className = `toast show ${kind}`;
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  if (action) $('button', el).onclick = () => { hideToast(); onAction(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 5000 : 2600);
}
const hideToast = () => $('#toast').classList.remove('show');

let sheetTimer;
export function sheet(html, { onMount } = {}) {
  const root = $('#sheet');
  clearTimeout(sheetTimer);
  root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet-panel" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${html}</div>`;
  root.hidden = false;
  requestAnimationFrame(() => root.classList.add('open'));
  const close = () => {
    root.classList.remove('open');
    sheetTimer = setTimeout(() => { root.hidden = true; root.innerHTML = ''; }, 200);
  };
  $('.sheet-backdrop', root).onclick = close;
  onMount?.($('.sheet-panel', root), close);
  return close;
}

export function confirmSheet(message, { ok = t('delete'), danger = true } = {}) {
  return new Promise(resolve => {
    let answered = false;
    const close = sheet(`
      <p class="sheet-text">${esc(message)}</p>
      <div class="sheet-actions">
        <button type="button" class="btn ${danger ? 'danger' : 'primary'}" data-answer="1">${esc(ok)}</button>
        <button type="button" class="btn" data-answer="0">${esc(t('cancel'))}</button>
      </div>`, {
      onMount: panel => panel.addEventListener('click', e => {
        const b = e.target.closest('[data-answer]');
        if (!b) return;
        answered = true;
        close();
        resolve(b.dataset.answer === '1');
      }),
    });
    $('.sheet-backdrop').addEventListener('click', () => !answered && resolve(false));
  });
}

export function gestures(el, { onSwipeLeft, onLongPress, onTap }) {
  const content = $('.row-content', el);
  let startX = 0, startY = 0, dx = 0, swiping = false, pressTimer = null, moved = false, longPressed = false;

  const reset = () => { content.style.transform = ''; el.classList.remove('swiping'); };

  el.addEventListener('pointerdown', e => {
    startX = e.clientX; startY = e.clientY; dx = 0; swiping = false; moved = false; longPressed = false;
    pressTimer = setTimeout(() => { longPressed = true; vibrate(15); onLongPress(); }, 500);
  });
  el.addEventListener('pointermove', e => {
    const mx = e.clientX - startX, my = e.clientY - startY;
    if (Math.abs(mx) > 8 || Math.abs(my) > 8) { moved = true; clearTimeout(pressTimer); }
    if (!swiping && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my) * 1.5) {
      swiping = true;
      el.classList.add('swiping');
      el.setPointerCapture(e.pointerId);
    }
    if (swiping) { dx = Math.min(0, mx); content.style.transform = `translateX(${dx}px)`; }
  });
  const end = () => {
    clearTimeout(pressTimer);
    if (swiping) {
      if (dx < -Math.min(120, el.offsetWidth * 0.35)) {
        content.style.transform = 'translateX(-110%)';
        setTimeout(onSwipeLeft, 180);
      } else reset();
    } else if (!moved && !longPressed) onTap();
    swiping = false;
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', () => { clearTimeout(pressTimer); reset(); swiping = false; });
  el.addEventListener('contextmenu', e => e.preventDefault());
}

export function shareOrDownload(filename, blob) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    return navigator.share({ files: [file], title: filename }).catch(() => {});
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const readFile = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(r.error);
  r.readAsText(file, 'utf-8');
});
