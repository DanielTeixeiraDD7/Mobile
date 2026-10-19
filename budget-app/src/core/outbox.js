import * as db from './db.js';

// File d'attente des modifications locales à envoyer au serveur.
// Une entrée par ligne : la dernière version locale remplace la précédente.

let enabled = false;
let onQueued = () => {};

export function enable(callback) {
  enabled = true;
  onQueued = callback;
}

export function disable() {
  enabled = false;
  onQueued = () => {};
}

export const isEnabled = () => enabled;

export async function enqueue(table, id, row) {
  if (!enabled) return;
  await db.put('outbox', { key: `${table}:${id}`, table, id, row, rev: `${Date.now()}-${Math.random()}` });
  onQueued();
}

export async function enqueueMany(table, rows) {
  if (!enabled || !rows.length) return;
  await db.putMany('outbox', rows.map(row => ({ key: `${table}:${row.id}`, table, id: row.id, row, rev: `${Date.now()}-${Math.random()}` })));
  onQueued();
}

export const pending = () => db.getAll('outbox');

export async function acknowledge(items) {
  const current = new Map((await pending()).map(i => [i.key, i.rev]));
  await db.removeMany('outbox', items.filter(i => current.get(i.key) === i.rev).map(i => i.key));
}

export const clear = () => db.clear('outbox');
