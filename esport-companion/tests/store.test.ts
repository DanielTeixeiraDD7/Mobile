import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as store from '../src/data/store';
import { http } from '../src/core/http';
import { fakeMatch } from './fixtures/fake';

let name = '';
beforeEach(async () => { name = `t-${Math.random()}`; await store.init(name); });
afterEach(() => store.reset());

describe('stockage local', () => {
  it('favoris persistés et retirables', async () => {
    expect(await store.toggleFavorite({ id: 'lol:ALP', kind: 'team', game: 'lol', name: 'Test Alpha', image: null })).toBe(true);
    store.reset(); await store.init(name);
    expect(store.isFavorite('lol:ALP')).toBe(true);
    expect(await store.toggleFavorite({ id: 'lol:ALP', kind: 'team', game: 'lol', name: 'Test Alpha', image: null })).toBe(false);
    store.reset(); await store.init(name);
    expect(store.getState().favorites).toEqual([]);
  });
  it('réglages et compétitions suivies transmises aux adaptateurs', async () => {
    await store.updateSettings({ followed: { lol: ['lec'] }, theme: 'light' });
    store.reset(); await store.init(name);
    expect(store.getState().settings).toMatchObject({ followed: { lol: ['lec'] }, theme: 'light', games: ['lol', 'dota2', 'valorant'] });
    const { getPrefs } = await import('../src/core/prefs');
    expect(getPrefs().followed.lol).toEqual(['lec']);
  });
  it('historique des matchs consultés borné et sans doublon', async () => {
    for (let i = 0; i < store.VIEWED_MAX + 5; i++) await store.markViewed(fakeMatch({ id: `lol:${i}` }));
    await store.markViewed(fakeMatch({ id: 'lol:3' }));
    expect(store.getState().viewed).toHaveLength(store.VIEWED_MAX);
    expect(store.getState().viewed[0]!.id).toBe('lol:3');
    store.reset(); await store.init(name);
    expect(store.getState().viewed.length).toBeLessThanOrEqual(store.VIEWED_MAX);
  });
  it('résultats importés : ajout, remplacement par id, suppression', async () => {
    const m = fakeMatch({ id: 'cs2:import-1', prov: { source: 'import', kind: 'imported', fetchedAt: 0, confidence: 'low' } });
    await store.saveManual([{ id: m.id, match: m, importedAt: 1, origin: 'a.csv' }]);
    await store.saveManual([{ id: m.id, match: m, importedAt: 2, origin: 'b.csv' }]);
    store.reset(); await store.init(name);
    expect(store.getState().manual.map(x => x.origin)).toEqual(['b.csv']);
    await store.deleteManual(m.id);
    expect(store.getState().manual).toEqual([]);
  });
  it('le cache HTTP est branché sur IndexedDB', async () => {
    const db = store.getDb();
    await db.put('cache', { key: 'p:x', data: { v: 1 }, at: Date.now() });
    const r = await http.peek<{ v: number }>({ id: 'p', name: 'p', baseUrl: '', rpm: 1 }, 'x');
    expect(r?.data.v).toBe(1);
    await store.clearCache();
    expect(await db.count('cache')).toBe(0);
  });
});
