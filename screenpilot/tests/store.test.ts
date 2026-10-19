import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as store from '../src/data/store';
import * as repo from '../src/data/repo';
import { openDatabase } from '../src/data/db';
import { media } from './fixtures';

let n = 0;
let name = '';
beforeEach(async () => {
  name = `test-${++n}-${Math.random()}`;
  await store.init(name);
});
afterEach(() => store.reset());

const one = () => store.getState().entries[0]!;

describe('bibliothèque', () => {
  it('ajoute sans doublon', async () => {
    const m = media({ id: 21 });
    expect((await store.addToLibrary(m)).created).toBe(true);
    expect((await store.addToLibrary(m)).created).toBe(false);
    expect(store.getState().entries).toHaveLength(1);
    expect(one().id).toBe('anilist:ANIME:21');
    expect(store.getState().history[0]!.kind).toBe('add');
  });

  it('persiste après rechargement', async () => {
    await store.addToLibrary(media({ id: 5 }));
    await store.increment(one().id);
    store.reset();
    await store.init(name);
    expect(one().progress).toBe(1);
    expect(one().status).toBe('CURRENT');
    expect(store.getState().history.map(h => h.kind)).toEqual(['progress', 'add']);
  });

  it('pas de double incrément : appuis simultanés', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    const r = await Promise.all([store.increment(id, 0), store.increment(id, 0), store.increment(id, 0)]);
    expect(r.filter(x => x.ok)).toHaveLength(1);
    expect(one().progress).toBe(1);
  });

  it('pas de double incrément : événement rejoué avec une valeur vue périmée', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    await store.increment(id, 0, 1000);
    const again = await store.increment(id, 0, 5000);
    expect(again.ok).toBe(false);
    expect(one().progress).toBe(1);
  });

  it('rebond de doigt < 300 ms ignoré, appui suivant accepté', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    await store.increment(id, undefined, 1000);
    expect((await store.increment(id, undefined, 1100)).ok).toBe(false);
    expect((await store.increment(id, undefined, 1400)).ok).toBe(true);
    expect(one().progress).toBe(2);
  });

  it('conflit si la base a changé ailleurs (autre onglet)', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    const other = await openDatabase(name);
    await repo.applyPatch(other, id, { progress: 0 }, { progress: 5 }, 'progress');
    other.close();
    const r = await store.setProgress(id, 1);
    expect(r).toMatchObject({ ok: false, reason: 'conflict' });
    expect(one().progress).toBe(5); // rechargé depuis la base
  });

  it('chapitres décimaux', async () => {
    await store.addToLibrary(media({ id: 2, type: 'MANGA', chapters: null, episodes: null }));
    const id = one().id;
    await store.setProgress(id, 10.5);
    expect(one().progress).toBe(10.5);
    await store.increment(id);
    expect(one().progress).toBe(11);
  });

  it('annulation d\'une progression et refus d\'une annulation périmée', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    const a = await store.setProgress(id, 3);
    const b = await store.setProgress(id, 4);
    if (!a.ok || !b.ok) throw new Error('écriture');
    expect((await store.undo(a.event!.id)).ok).toBe(false); // l'état a changé depuis
    expect((await store.undo(b.event!.id)).ok).toBe(true);
    expect(one().progress).toBe(3);
    expect((await store.undo(b.event!.id)).ok).toBe(false); // déjà annulée
    expect((await store.undo(a.event!.id)).ok).toBe(true);
    expect(one()).toMatchObject({ progress: 0, status: 'PLANNING', startedAt: null });
  });

  it('terminer puis annuler restaure statut et dates', async () => {
    await store.addToLibrary(media({ id: 1, episodes: 2 }));
    const id = one().id;
    await store.setProgress(id, 1);
    const r = await store.increment(id);
    expect(one().status).toBe('COMPLETED');
    if (!r.ok) throw new Error();
    await store.undo(r.event!.id);
    expect(one()).toMatchObject({ progress: 1, status: 'CURRENT', completedAt: null });
  });

  it('suppression annulable', async () => {
    await store.addToLibrary(media({ id: 1 }));
    const id = one().id;
    await store.setProgress(id, 4);
    const r = await store.remove(id);
    expect(store.getState().entries).toHaveLength(0);
    if (!r.ok) throw new Error();
    await store.undo(r.event!.id);
    expect(one().progress).toBe(4);
  });

  it('réglages persistés', async () => {
    await store.updateSettings({ titleLanguage: 'english', onboarded: true });
    store.reset();
    await store.init(name);
    expect(store.getState().settings).toMatchObject({ titleLanguage: 'english', onboarded: true, reminderMinutes: 15 });
  });

  it('historique borné', async () => {
    const db = store.getDb();
    await store.addToLibrary(media({ id: 1, episodes: null }));
    for (let i = 1; i <= 15; i++) await repo.applyPatch(db, one().id, {}, { progress: i }, 'progress', i);
    await repo.trimHistory(db, 10);
    expect(await db.count('history')).toBe(10);
  });
});

describe('ajout direct avec statut', () => {
  beforeEach(async () => { await store.init(`direct-${Math.random()}`); });
  afterEach(() => store.reset());
  it('« Terminé » remplit la progression et les dates, annulable', async () => {
    const r = await store.addToLibrary(media({ id: 3, episodes: 28 }), 'COMPLETED');
    expect(store.getState().entries[0]).toMatchObject({ status: 'COMPLETED', progress: 28 });
    expect(store.getState().entries[0]!.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((await store.undo(r.event!.id)).ok).toBe(true);
    expect(store.getState().entries).toHaveLength(0);
  });
  it('« En cours » date le début', async () => {
    await store.addToLibrary(media({ id: 4 }), 'CURRENT');
    expect(store.getState().entries[0]!.startedAt).not.toBeNull();
  });
});
