import { state, setSetting, saveCategory, deleteCategory, categoriesOf, categoryById, fallbackCategory, replaceAll, PALETTE } from '../store.js';
import { t, categoryName } from '../i18n.js';
import { today, esc } from '../format.js';
import { toCSV, importCSV } from '../csv.js';
import { toJSON, restoreJSON } from '../backup.js';
import { sheet, toast, confirmSheet, shareOrDownload, readFile, $ } from '../ui.js';
import { render } from '../router.js';
import { sync } from '../sync.js';
import { shareSection, bindShare } from './share.js';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'BRL', 'CAD', 'AOA', 'CVE', 'MZN', 'XOF', 'MAD', 'JPY'];

export function renderSettings(main) {
  const s = state.settings;
  main.innerHTML = `
  <h1 class="page-title">${esc(t('tab.settings'))}</h1>

  ${shareSection()}

  <section class="card">
    <div class="field-row">
      <span class="label">${esc(t('settings.language'))}</span>
      <div class="seg small" id="lang">
        ${[['fr', 'Français'], ['pt', 'Português']].map(([v, l]) => `<button type="button" data-lang="${v}" class="${s.lang === v ? 'active' : ''}">${l}</button>`).join('')}
      </div>
    </div>
    <label class="field-row">
      <span class="label">${esc(t('settings.currency'))}</span>
      <select id="currency">
        ${[...new Set([s.currency, ...CURRENCIES])].map(c => `<option value="${c}" ${c === s.currency ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </label>
  </section>

  <h2 class="section-title">${esc(t('settings.categories'))}</h2>
  ${['expense', 'income'].map(kind => `
    <section class="card">
      <span class="label">${esc(t(`sum.${kind}`))}</span>
      <ul class="cat-list">
        ${categoriesOf(kind).map(c => `<li><button type="button" data-cat="${c.id}">
          <i class="dot" style="background:${c.color}"></i><span>${esc(categoryName(c))}</span><span class="chev">›</span></button></li>`).join('')}
      </ul>
      <button type="button" class="btn ghost full" data-new="${kind}">＋ ${esc(t('settings.addCategory'))}</button>
    </section>`).join('')}

  <h2 class="section-title">${esc(t('settings.data'))}</h2>
  <section class="card">
    <p class="small muted">${esc(t(sync.householdId ? 'settings.dataHelpShared' : 'settings.dataHelp'))}</p>
    <div class="btn-grid">
      <button type="button" class="btn" data-act="export-csv">⬇️ ${esc(t('settings.exportCsv'))}</button>
      <label class="btn">⬆️ ${esc(t('settings.importCsv'))}<input type="file" id="import-csv" accept=".csv,text/csv,text/plain" hidden></label>
      <button type="button" class="btn" data-act="export-json">💾 ${esc(t('settings.exportJson'))}</button>
      <label class="btn">♻️ ${esc(t('settings.importJson'))}<input type="file" id="import-json" accept=".json,application/json" hidden></label>
    </div>
    <button type="button" class="btn danger full" data-act="reset">${esc(t('settings.reset'))}</button>
  </section>

  <section class="card">
    <span class="label">${esc(t('settings.install'))}</span>
    <p class="small">${esc(t('settings.installHelp'))}</p>
  </section>`;

  bindShare();
  $('#lang').onclick = async e => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    await setSetting('lang', b.dataset.lang);
    document.documentElement.lang = b.dataset.lang;
    document.dispatchEvent(new Event('langchange'));
    render();
  };
  $('#currency').onchange = async e => { await setSetting('currency', e.target.value); render(); };
  main.querySelectorAll('[data-cat]').forEach(b => (b.onclick = () => editCategory(categoryById(b.dataset.cat))));
  main.querySelectorAll('[data-new]').forEach(b => (b.onclick = () => editCategory({ kind: b.dataset.new, color: PALETTE[state.categories.length % PALETTE.length] })));
  main.querySelectorAll('[data-act]').forEach(b => (b.onclick = () => actions[b.dataset.act]()));
  $('#import-csv').onchange = e => importFile(e.target, async text => {
    const r = await importCSV(text);
    toast(t('settings.imported', r));
  });
  $('#import-json').onchange = e => importFile(e.target, async text => {
    JSON.parse(text);
    if (sync.householdId) return toast(t('share.blocked'), { kind: 'warn' });
    if (!(await confirmSheet(t('settings.restoreConfirm'), { ok: t('settings.importJson') }))) return;
    await restoreJSON(text);
    document.documentElement.lang = state.settings.lang;
    document.dispatchEvent(new Event('langchange'));
    toast(t('settings.restored'));
  });
}

async function importFile(input, handler) {
  const file = input.files[0];
  input.value = '';
  if (!file) return;
  try {
    await handler(await readFile(file));
    render();
  } catch {
    toast(t('settings.badFile'), { kind: 'danger' });
  }
}

const actions = {
  'export-csv': () => shareOrDownload(`budget-${today()}.csv`, new Blob([toCSV()], { type: 'text/csv;charset=utf-8' })),
  'export-json': () => shareOrDownload(`budget-${today()}.json`, new Blob([toJSON()], { type: 'application/json' })),
  reset: async () => {
    if (sync.householdId) return toast(t('share.blocked'), { kind: 'warn' });
    if (!(await confirmSheet(t('settings.resetConfirm'), { ok: t('settings.reset') }))) return;
    await replaceAll({ settings: { lang: state.settings.lang } });
    toast(t('settings.resetDone'));
    render();
  },
};

function editCategory(cat) {
  const draft = { ...cat };
  const isNew = !cat.id;
  sheet(`
    <h2>${esc(isNew ? t('cat.new') : t('cat.editTitle'))}</h2>
    <form id="cat-form" class="form" novalidate>
      <label>${esc(t('cat.name'))}<input id="cat-name" maxlength="24" value="${esc(isNew ? '' : categoryName(cat))}" required></label>
      <div>
        <span class="label">${esc(t('cat.color'))}</span>
        <div class="swatches" id="swatches">
          ${PALETTE.map(c => `<button type="button" data-color="${c}" style="--c:${c}" class="${c === draft.color ? 'selected' : ''}" aria-label="${c}"></button>`).join('')}
        </div>
      </div>
      ${cat.locked ? `<p class="small muted">${esc(t('cat.locked'))}</p>` : ''}
      <div class="sheet-actions">
        <button type="submit" class="btn primary">${esc(t('save'))}</button>
        ${isNew || cat.locked ? '' : `<button type="button" class="btn danger" id="cat-delete">${esc(t('delete'))}</button>`}
      </div>
    </form>`, {
    onMount: (panel, close) => {
      $('#swatches').onclick = e => {
        const b = e.target.closest('[data-color]');
        if (!b) return;
        draft.color = b.dataset.color;
        panel.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('selected', x === b));
      };
      $('#cat-form').onsubmit = async e => {
        e.preventDefault();
        const name = $('#cat-name').value.trim();
        if (!name) return toast(t('cat.nameRequired'), { kind: 'warn' });
        const keepDefault = cat.key && name === t(cat.key);
        await saveCategory({ ...draft, name: keepDefault ? null : name });
        close();
        render();
      };
      $('#cat-delete')?.addEventListener('click', async () => {
        const count = state.transactions.filter(tx => tx.categoryId === cat.id).length;
        const fallback = fallbackCategory(cat.kind);
        close();
        const ok = await new Promise(r => setTimeout(() => confirmSheet(t('cat.deleteConfirm', {
          name: categoryName(cat), count, fallback: categoryName(fallback),
        })).then(r), 220));
        if (!ok) return;
        await deleteCategory(cat.id);
        render();
      });
    },
  });
}
