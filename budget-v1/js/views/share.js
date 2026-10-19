import { t } from '../i18n.js';
import { esc, ago } from '../format.js';
import { currentUser, signIn, signUp } from '../auth.js';
import { sync, syncNow, resumeHousehold, createHousehold, joinHousehold, createInvitation, disconnect } from '../sync.js';
import { toast, confirmSheet, $ } from '../ui.js';
import { render } from '../router.js';

const ui = { email: '', busy: false, invite: null, confirm: false };

function errorMessage(e) {
  if (e.status === 0) return t('share.err.offline');
  if (e.status === 429 || /rate/i.test(e.code || '')) return t('share.err.rate');
  const byCode = {
    invalid_credentials: 'share.err.credentials', email_not_confirmed: 'share.err.notConfirmed',
    user_already_exists: 'share.err.exists', weak_password: 'share.err.weak', signup_disabled: 'share.err.closed',
  };
  if (byCode[e.code]) return t(byCode[e.code]);
  if (/invalid or expired code/i.test(e.message)) return t('share.err.code');
  return t('share.err.generic', { error: e.message });
}

async function action(fn) {
  if (ui.busy) return;
  ui.busy = true;
  render();
  try {
    await fn();
  } catch (e) {
    toast(errorMessage(e), { kind: 'danger' });
  } finally {
    ui.busy = false;
    render();
  }
}

function statusLine() {
  const text = {
    idle: t('share.status.idle', { when: sync.lastSync ? ago(sync.lastSync) : t('share.never') }),
    syncing: t('share.status.syncing'),
    offline: t('share.status.offline'),
    error: t('share.status.error', { error: sync.error || '' }),
  }[sync.status] || '';
  return `<p class="sync-status ${sync.status}"><i></i>${esc(text)}${sync.pending ? ` · ${esc(t('share.pending', { count: sync.pending }))}` : ''}</p>`;
}

export function shareSection() {
  const user = currentUser();
  const disabled = ui.busy ? 'disabled' : '';
  let body;

  if (!user) {
    body = `
      <p class="small muted">${esc(t('share.intro'))}</p>
      ${ui.confirm ? `<p class="notice">${esc(t('share.confirmEmail'))}</p>` : ''}
      <form id="share-login" class="form" novalidate>
        <label>${esc(t('share.email'))}<input id="share-email-input" type="email" autocomplete="email" inputmode="email" value="${esc(ui.email)}" required></label>
        <label>${esc(t('share.password'))}<input id="share-password" type="password" autocomplete="current-password" minlength="6" required></label>
        <button type="submit" class="btn primary" ${disabled}>${esc(t('share.signIn'))}</button>
        <button type="button" class="btn" id="share-signup" ${disabled}>${esc(t('share.signUp'))}</button>
        <p class="small muted">${esc(t('share.passwordHelp'))}</p>
      </form>`;
  } else if (!sync.householdId) {
    body = `
      <p class="small muted">${esc(user.email)}</p>
      <form id="share-setup" class="form" novalidate>
        <label>${esc(t('share.name'))}<input id="share-name" maxlength="30" autocomplete="given-name" required></label>
        <button type="button" class="btn primary" id="share-create" ${disabled}>${esc(t('share.create'))}</button>
        <p class="small muted">${esc(t('share.createHelp'))}</p>
        <p class="label center">${esc(t('share.or'))}</p>
        <div class="row">
          <input id="share-join-code" class="code-input" placeholder="${esc(t('share.inviteCode'))}" maxlength="10" autocapitalize="characters" autocomplete="off">
          <button type="button" class="btn" id="share-join" ${disabled}>${esc(t('share.join'))}</button>
        </div>
      </form>
      <button type="button" class="btn ghost full" id="share-signout">${esc(t('share.signOut'))}</button>`;
  } else {
    body = `
      ${statusLine()}
      <span class="label">${esc(t('share.members'))}</span>
      <ul class="members">
        ${sync.members.map(m => `<li><i class="avatar">${esc(m.display_name.slice(0, 1).toUpperCase())}</i>${esc(m.display_name)}
          ${m.user_id === user.id ? `<small class="muted">${esc(t('share.you'))}</small>` : ''}</li>`).join('')}
      </ul>
      ${ui.invite ? `
        <div class="invite">
          <output class="invite-code" id="invite-code">${esc(ui.invite)}</output>
          <p class="small muted">${esc(t('share.inviteHelp'))}</p>
          <button type="button" class="btn" id="share-copy">📋 ${esc(t('share.copy'))}</button>
        </div>` : `<button type="button" class="btn" id="share-invite" ${disabled}>＋ ${esc(t('share.invite'))}</button>`}
      <div class="btn-grid">
        <button type="button" class="btn" id="share-sync" ${disabled}>⟳ ${esc(t('share.syncNow'))}</button>
        <button type="button" class="btn ghost" id="share-signout">${esc(t('share.signOut'))}</button>
      </div>`;
  }
  return `<h2 class="section-title">${esc(t('share.title'))}</h2><section class="card share">${body}</section>`;
}

export function bindShare() {
  const credentials = () => {
    const email = $('#share-email-input').value.trim().toLowerCase();
    const password = $('#share-password').value;
    ui.email = email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast(t('share.err.email'), { kind: 'warn' }); return null; }
    if (password.length < 6) { toast(t('share.err.weak'), { kind: 'warn' }); return null; }
    return { email, password };
  };
  const afterLogin = async () => {
    ui.confirm = false;
    if (await resumeHousehold()) toast(t('share.joined'));
  };
  $('#share-login')?.addEventListener('submit', e => {
    e.preventDefault();
    const c = credentials();
    if (c) action(async () => { await signIn(c.email, c.password); await afterLogin(); });
  });
  $('#share-signup')?.addEventListener('click', () => {
    const c = credentials();
    if (c) action(async () => {
      if (await signUp(c.email, c.password)) await afterLogin();
      else ui.confirm = true;
    });
  });

  const name = () => {
    const value = $('#share-name').value.trim();
    if (!value) toast(t('share.err.name'), { kind: 'warn' });
    return value;
  };
  $('#share-create')?.addEventListener('click', () => {
    const n = name();
    if (n) action(async () => { await createHousehold(n); toast(t('share.joined')); });
  });
  $('#share-join')?.addEventListener('click', () => {
    const n = name();
    const code = $('#share-join-code').value.trim();
    if (!n) return;
    if (code.length < 6) return toast(t('share.err.code'), { kind: 'warn' });
    action(async () => { await joinHousehold(code, n); toast(t('share.joined')); });
  });

  $('#share-invite')?.addEventListener('click', () => action(async () => { ui.invite = await createInvitation(); }));
  $('#share-copy')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(ui.invite).then(() => toast(t('share.copied')))
      .catch(() => getSelection().selectAllChildren($('#invite-code')));
  });
  $('#share-sync')?.addEventListener('click', () => syncNow().then(render));
  $('#share-signout')?.addEventListener('click', async () => {
    const message = t('share.signOutConfirm') + (sync.pending ? ` ${t('share.signOutPending', { count: sync.pending })}` : '');
    if (!(await confirmSheet(message, { ok: t('share.signOut') }))) return;
    ui.invite = null;
    await disconnect();
    render();
  });
}
