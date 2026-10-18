import { describe, expect, it, vi } from 'vitest';
import { Http, RETRY_DELAYS, type CacheStore, type ProviderConfig } from '../src/core/http';
import { ApiError, errorText } from '../src/core/errors';
import { json } from './fixtures/fake';

const P: ProviderConfig = { id: 'p', name: 'Source test', baseUrl: 'https://test.invalid/', rpm: 5 };

function setup(fetchImpl: (url: string) => Promise<Response>, online = true) {
  let t = 1_000_000;
  const map = new Map<string, { data: unknown; at: number }>();
  const cache: CacheStore = { get: async k => map.get(k), put: async (k, data, at) => void map.set(k, { data, at }) };
  const slept: number[] = [];
  const h = new Http({ fetch: (u => fetchImpl(String(u))) as typeof fetch, cache, now: () => t, sleep: async ms => { slept.push(ms); t += ms; }, online: () => online });
  return { h, map, slept, advance: (ms: number) => (t += ms) };
}

describe('client HTTP commun', () => {
  it('cache frais : pas de requête', async () => {
    const f = vi.fn(async () => json({ a: 1 }));
    const { h, advance } = setup(f);
    await h.get(P, 'x', { ttl: 60_000 });
    advance(30_000);
    const r = await h.get(P, 'x', { ttl: 60_000 });
    expect(r.fromCache).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('requêtes identiques simultanées dédupliquées', async () => {
    const f = vi.fn(async () => json({ a: 1 }));
    const { h } = setup(f);
    await Promise.all([h.get(P, 'x', { ttl: 0 }), h.get(P, 'x', { ttl: 0 }), h.get(P, 'x', { ttl: 0 })]);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('5xx : réessais avec attente croissante puis succès', async () => {
    let n = 0;
    const { h, slept } = setup(async () => (++n < 3 ? json({}, 503) : json({ ok: true })));
    const r = await h.get<{ ok: boolean }>(P, 'x', { ttl: 0 });
    expect(r.data.ok).toBe(true);
    expect(slept).toEqual(RETRY_DELAYS);
  });
  it('échec réseau : dernières données valides marquées périmées', async () => {
    let up = true;
    const { h, advance } = setup(async () => { if (!up) throw new TypeError('Failed to fetch'); return json({ v: 1 }); });
    await h.get(P, 'x', { ttl: 1000 });
    advance(5000); up = false;
    const r = await h.get<{ v: number }>(P, 'x', { ttl: 1000 });
    expect(r).toMatchObject({ stale: true, data: { v: 1 } });
  });
  it('429 : délai Retry-After respecté, plus aucune requête pendant le blocage', async () => {
    const f = vi.fn(async () => json({}, 429, { 'Retry-After': '120' }));
    const { h } = setup(f);
    await expect(h.get(P, 'x', { ttl: 0 })).rejects.toMatchObject({ kind: 'rate_limited', retryAfter: 120_000 });
    await expect(h.get(P, 'y', { ttl: 0 })).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it('limite par minute de la source respectée', async () => {
    const f = vi.fn(async () => json({}));
    const { h } = setup(f);
    for (let i = 0; i < 5; i++) await h.get(P, `k${i}`, { ttl: 0 });
    await expect(h.get(P, 'k6', { ttl: 0, maxWait: 1000 })).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(f).toHaveBeenCalledTimes(5);
  });
  it('quota journalier presque épuisé : pause d\'une heure', async () => {
    const f = vi.fn(async () => json({}, 200, { 'x-rate-limit-remaining-day': '10' }));
    const { h } = setup(f);
    await h.get(P, 'a', { ttl: 0 });
    expect(h.limiter(P).blockedFor).toBe(3_600_000);
  });
  it('404 : pas de données périmées servies', async () => {
    let first = true;
    const { h, advance } = setup(async () => { if (first) { first = false; return json({ v: 1 }); } return json({}, 404); });
    await h.get(P, 'x', { ttl: 10 });
    advance(100);
    await expect(h.get(P, 'x', { ttl: 10 })).rejects.toMatchObject({ kind: 'not_found' });
  });
  it('hors-ligne : aucune requête, erreur claire', async () => {
    const f = vi.fn();
    const { h } = setup(f as never, false);
    await expect(h.get(P, 'x', { ttl: 0 })).rejects.toMatchObject({ kind: 'offline' });
    expect(f).not.toHaveBeenCalled();
    expect(errorText(new ApiError('offline', '', 0, 'Source test'))).toContain('Hors-ligne');
  });
  it('JSON invalide → format changé', async () => {
    const { h } = setup(async () => new Response('<html>', { status: 200 }));
    await expect(h.get(P, 'x', { ttl: 0 })).rejects.toMatchObject({ kind: 'bad_data' });
  });
  it('annulation', async () => {
    const ac = new AbortController();
    ac.abort();
    const { h } = setup(async () => json({}));
    await expect(h.get(P, 'x', { ttl: 0, signal: ac.signal })).rejects.toMatchObject({ kind: 'aborted' });
  });
  it('données définitives : jamais rechargées (ttl infini)', async () => {
    const f = vi.fn(async () => json({ v: 1 }));
    const { h, advance } = setup(f);
    await h.get(P, 'x', { ttl: Infinity });
    advance(365 * 86_400_000);
    await h.get(P, 'x', { ttl: Infinity });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
