import * as db from './db.js';
import * as outbox from './outbox.js';
import { rest, rpc, restAll } from './api.js';
import { loadSession, currentUser, signOut as authSignOut } from './auth.js';
import { state, uid, adoptData, applyRemote, SHARED_SETTINGS } from './store.js';

const OVERLAP_MS = 2 * 60 * 1000;
const POLL_MS = 30 * 1000;

export const sync = {
  householdId: null,
  lastPull: null,
  lastSync: null,
  members: [],
  status: 'off',      // off | idle | syncing | offline | error
  pending: 0,
};

const listeners = new Set();
export const onSyncChange = fn => listeners.add(fn);
const emit = () => listeners.forEach(fn => fn());

const saveMeta = () => db.put('sync', {
  key: 'meta',
  value: { householdId: sync.householdId, lastPull: sync.lastPull, lastSync: sync.lastSync, members: sync.members },
});

const toServerTx = (t, hid) => ({
  id: t.id, household_id: hid, category_id: t.categoryId ?? null, type: t.type,
  amount: t.amount, date: t.date, note: t.note || '', deleted_at: null,
});
const fromServerTx = r => ({
  id: r.id, type: r.type, amount: Number(r.amount), categoryId: r.category_id, date: r.date,
  note: r.note, createdAt: Date.parse(r.created_at), createdBy: r.created_by,
});
const toServerCat = (c, hid) => ({
  id: c.id, household_id: hid, key: c.key ?? null, name: c.name ?? null, kind: c.kind, color: c.color,
  budget: c.budget ?? null, position: c.order ?? 0, locked: !!c.locked, deleted_at: null,
});
const fromServerCat = r => ({
  id: r.id, key: r.key, name: r.name, kind: r.kind, color: r.color,
  budget: r.budget === null ? null : Number(r.budget), order: r.position, locked: r.locked,
});

export async function initSync() {
  await loadSession();
  Object.assign(sync, (await db.get('sync', 'meta'))?.value ?? {});
  if (!currentUser() || !sync.householdId) {
    sync.status = 'off';
    return;
  }
  start();
  syncNow();
}

let listening = false;
function start() {
  outbox.enable(schedule);
  sync.status = 'syncing';
  if (listening) return;
  listening = true;
  window.addEventListener('online', syncNow);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && syncNow());
  setInterval(() => document.visibilityState === 'visible' && syncNow(), POLL_MS);
}

let timer;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(syncNow, 1200);
  refreshPending();
}

async function refreshPending() {
  sync.pending = (await outbox.pending()).length;
  emit();
}

let running = null;
export function syncNow() {
  if (!sync.householdId || !currentUser()) return Promise.resolve();
  running ??= (async () => {
    sync.status = 'syncing';
    emit();
    try {
      await push();
      const changed = await pull();
      sync.status = 'idle';
      sync.lastSync = new Date().toISOString();
      await saveMeta();
      if (changed) document.dispatchEvent(new Event('remotechange'));
    } catch (e) {
      sync.status = e.status === 0 ? 'offline' : 'error';
      sync.error = e.message;
      if (e.status === 401 && !currentUser()) await disconnect();
    } finally {
      running = null;
      await refreshPending();
    }
  })();
  return running;
}

const chunks = (list, size = 200) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, (i + 1) * size));
const UPSERT = 'resolution=merge-duplicates,return=minimal';

async function push() {
  const items = await outbox.pending();
  if (!items.length) return;
  const hid = sync.householdId;
  const of = table => items.filter(i => i.table === table);
  const now = new Date().toISOString();

  for (const part of chunks(of('categories').filter(i => i.row))) {
    await rest('categories?on_conflict=id', { method: 'POST', body: part.map(i => toServerCat(i.row, hid)), prefer: UPSERT });
  }
  for (const part of chunks(of('transactions').filter(i => i.row))) {
    await rest('transactions?on_conflict=id', { method: 'POST', body: part.map(i => toServerTx(i.row, hid)), prefer: UPSERT });
  }
  for (const part of chunks(of('transactions').filter(i => !i.row))) {
    await rest(`transactions?id=in.(${part.map(i => i.id).join(',')})`, { method: 'PATCH', body: { deleted_at: now }, prefer: 'return=minimal' });
  }
  for (const part of chunks(of('categories').filter(i => !i.row))) {
    await rest(`categories?id=in.(${part.map(i => i.id).join(',')})`, { method: 'PATCH', body: { deleted_at: now }, prefer: 'return=minimal' });
  }
  const settings = of('household').at(-1)?.row;
  if (settings) {
    await rest(`households?id=eq.${hid}`, {
      method: 'PATCH',
      body: { currency: settings.currency, monthly_budget: settings.monthlyBudget ?? null },
      prefer: 'return=minimal',
    });
  }
  await outbox.acknowledge(items);
}

async function pull() {
  const hid = sync.householdId;
  const since = sync.lastPull ? new Date(Date.parse(sync.lastPull) - OVERLAP_MS).toISOString() : null;
  const filter = since ? `&updated_at=gt.${encodeURIComponent(since)}` : '';
  const [txRows, catRows, households, members] = await Promise.all([
    restAll(`transactions?household_id=eq.${hid}${filter}&order=updated_at.asc`),
    restAll(`categories?household_id=eq.${hid}${filter}&order=updated_at.asc`),
    rest(`households?id=eq.${hid}&select=currency,monthly_budget`),
    rest(`household_members?household_id=eq.${hid}&select=user_id,display_name,role`),
  ]);

  if (!members.some(m => m.user_id === currentUser().id)) {
    await disconnect();
    return true;
  }
  sync.members = members;

  const pendingKeys = new Set((await outbox.pending()).map(i => i.key));
  const h = households[0];
  const changed = await applyRemote({
    transactions: txRows.map(r => ({ row: fromServerTx(r), deleted: !!r.deleted_at })),
    categories: catRows.map(r => ({ row: fromServerCat(r), deleted: !!r.deleted_at })),
    settings: h && { currency: h.currency, monthlyBudget: h.monthly_budget === null ? null : Number(h.monthly_budget) },
  }, pendingKeys);

  const latest = [...txRows, ...catRows].map(r => r.updated_at).sort().at(-1);
  if (latest && (!sync.lastPull || latest > sync.lastPull)) sync.lastPull = latest;
  return changed > 0 || !since;
}

// Après connexion : rattache l'appareil au foyer existant de l'utilisateur, s'il en a un.
export async function resumeHousehold() {
  const rows = await rest(`household_members?user_id=eq.${currentUser().id}&select=household_id`);
  if (!rows.length) return false;
  await attach(rows[0].household_id, { owner: false });
  return true;
}

export async function createHousehold(displayName) {
  const hid = await rpc('create_household', { p_display_name: displayName, p_currency: state.settings.currency });
  await attach(hid, { owner: true });
}

export async function joinHousehold(code, displayName) {
  const hid = await rpc('join_household', { p_code: code, p_display_name: displayName });
  await attach(hid, { owner: false });
}

export const createInvitation = () => rpc('create_invitation');

// Fusionne les données locales existantes dans le foyer puis lance la synchronisation.
async function attach(hid, { owner }) {
  const serverCats = (await restAll(`categories?household_id=eq.${hid}&deleted_at=is.null`)).map(fromServerCat);
  const sameCategory = (local, remote) => remote.kind === local.kind && (
    (local.key && remote.key === local.key) ||
    (local.name && remote.name && remote.name.toLowerCase() === local.name.toLowerCase()));

  const idMap = new Map();
  const toUpload = [];
  const categories = [...serverCats];
  for (const local of state.categories) {
    const match = serverCats.find(r => sameCategory(local, r));
    if (match) {
      idMap.set(local.id, match.id);
      if (owner && (local.name || local.budget || local.color !== match.color)) {
        Object.assign(match, { name: local.name ?? null, budget: local.budget ?? null, color: local.color });
        toUpload.push(match);
      }
    } else {
      const created = { ...local, id: uid() };
      idMap.set(local.id, created.id);
      categories.push(created);
      toUpload.push(created);
    }
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const transactions = state.transactions.map(t => ({
    ...t,
    id: uuid.test(t.id) ? t.id : uid(),
    categoryId: idMap.get(t.categoryId) ?? t.categoryId,
  }));

  await outbox.clear();
  await adoptData({ transactions, categories });
  Object.assign(sync, { householdId: hid, lastPull: null, members: [] });
  await saveMeta();
  start();
  await outbox.enqueueMany('categories', toUpload);
  await outbox.enqueueMany('transactions', transactions);
  if (owner) await outbox.enqueue('household', 'settings', Object.fromEntries(SHARED_SETTINGS.map(k => [k, state.settings[k]])));
  await syncNow();
}

export async function disconnect() {
  outbox.disable();
  await outbox.clear();
  await authSignOut();
  Object.assign(sync, { householdId: null, lastPull: null, lastSync: null, members: [], status: 'off', pending: 0 });
  await db.remove('sync', 'meta');
  emit();
}

export const memberName = userId => sync.members.find(m => m.user_id === userId)?.display_name;
