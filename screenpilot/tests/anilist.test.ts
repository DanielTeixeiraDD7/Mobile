import { describe, expect, it, vi } from 'vitest';
import { AniListClient, ApiError, errorMessage, type CacheStore } from '../src/api/anilist';
import { RateLimiter } from '../src/api/limiter';
import { plainText, toSnapshot, type RawMedia } from '../src/api/mapper';

const raw = (id: number, over: Partial<RawMedia> = {}): RawMedia => ({
  id, type: 'ANIME', isAdult: false, format: 'TV', status: 'FINISHED', episodes: 12, duration: 24, chapters: null, volumes: null,
  title: { romaji: 'R' + id, english: null, native: null }, coverImage: { large: 'https://s4.anilist.co/x.jpg', color: '#fff' },
  genres: ['Action'], tags: [], season: 'FALL', seasonYear: 2023, startDate: { year: 2023 }, averageScore: 80, siteUrl: null, nextAiringEpisode: null,
  ...over,
});

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

function memCache(): CacheStore & { map: Map<string, { data: unknown; at: number }> } {
  const map = new Map<string, { data: unknown; at: number }>();
  return { map, get: async k => map.get(k), put: async (k, data, at) => void map.set(k, { data, at }) };
}

function client(fetchImpl: typeof fetch, extra: Partial<ConstructorParameters<typeof AniListClient>[0]> = {}) {
  let t = 1_000_000;
  const now = () => t;
  return {
    c: new AniListClient({ fetch: fetchImpl, now, online: () => true, limiter: new RateLimiter(25, 60_000, now, async ms => void (t += ms)), ...extra }),
    advance: (ms: number) => (t += ms),
  };
}

describe('mapper', () => {
  it('écarte les tags spoilers, adultes ou peu pertinents', () => {
    const s = toSnapshot(raw(1, { tags: [
      { name: 'Magie', rank: 90, isMediaSpoiler: false, isAdult: false },
      { name: 'Twist', rank: 95, isMediaSpoiler: true, isAdult: false },
      { name: 'Faible', rank: 20, isMediaSpoiler: false, isAdult: false },
      null,
    ] }));
    expect(s.tags).toEqual([{ name: 'Magie', rank: 90 }]);
    expect(s.startYear).toBe(2023);
  });
  it('nettoie la description', () => {
    expect(plainText('Bonjour<br><br><br><i>monde</i> &amp; cie')).toBe('Bonjour\n\nmonde & cie');
  });
});

describe('client AniList', () => {
  it('recherche, normalise la saisie et met en cache', async () => {
    const f = vi.fn(async (_u: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init!.body));
      expect(body.variables).toMatchObject({ search: 'One Piece', type: 'ANIME' });
      return json({ data: { Page: { pageInfo: { hasNextPage: false }, media: [raw(21), raw(99, { isAdult: true })] } } });
    });
    const cache = memCache();
    const { c } = client(f as typeof fetch, { cache });
    const r = await c.search('ANIME', '  One   Piece ');
    expect(r.data.items.map(m => m.id)).toEqual([21]);
    await c.search('ANIME', 'one piece');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('429 : erreur typée avec délai, puis blocage local sans appel réseau', async () => {
    const f = vi.fn(async () => json({ errors: [{ message: 'Too Many Requests.', status: 429 }] }, 429, { 'Retry-After': '30' }));
    const { c } = client(f as typeof fetch);
    await expect(c.search('ANIME', 'a')).rejects.toMatchObject({ kind: 'rate_limited', retryAfter: 30_000 });
    await expect(c.search('ANIME', 'b')).rejects.toMatchObject({ kind: 'rate_limited' });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('403 = API indisponible', async () => {
    const { c } = client((async () => json({ errors: [{ message: 'disabled' }], data: null }, 403)) as typeof fetch);
    await expect(c.details(1)).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('hors-ligne : sert le cache périmé en le signalant', async () => {
    const cache = memCache();
    let up = true;
    const f = vi.fn(async () => {
      if (!up) throw new TypeError('Failed to fetch');
      return json({ data: { Page: { pageInfo: { hasNextPage: false }, media: [raw(1)] } } });
    });
    const { c, advance } = client(f as typeof fetch, { cache });
    await c.search('ANIME', 'x');
    advance(7 * 3600_000);
    up = false;
    const r = await c.search('ANIME', 'x');
    expect(r.stale).toBe(true);
    expect(r.data.items).toHaveLength(1);
    await expect(c.search('ANIME', 'jamais vu')).rejects.toMatchObject({ kind: 'offline' });
  });

  it('navigateur hors-ligne : aucune requête', async () => {
    const f = vi.fn();
    const { c } = client(f as unknown as typeof fetch, { online: () => false });
    await expect(c.search('ANIME', 'x')).rejects.toMatchObject({ kind: 'offline' });
    expect(f).not.toHaveBeenCalled();
  });

  it('annulation', async () => {
    const ac = new AbortController();
    const f = vi.fn((_u: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_, rej) => {
      if (init!.signal!.aborted) return rej(new DOMException('aborted', 'AbortError'));
      init!.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
    }));
    const { c } = client(f as typeof fetch);
    const p = c.search('ANIME', 'x', 1, ac.signal);
    ac.abort();
    await expect(p).rejects.toMatchObject({ kind: 'aborted' });
  });

  it('erreurs GraphQL', async () => {
    const { c } = client((async () => json({ errors: [{ message: 'Validation error' }] })) as typeof fetch);
    await expect(c.details(1)).rejects.toBeInstanceOf(ApiError);
  });

  it('détails : recommandations sans contenu adulte, description en texte', async () => {
    const { c } = client((async () => json({ data: { Media: { ...raw(1), description: 'A<br>B', recommendations: { nodes: [
      { rating: 50, mediaRecommendation: raw(2) }, { rating: 10, mediaRecommendation: raw(3, { isAdult: true }) }, { rating: 5, mediaRecommendation: null },
    ] } } } })) as typeof fetch);
    const r = await c.details(1);
    expect(r.data.description).toBe('A\nB');
    expect(r.data.recommendations.map(x => x.media.id)).toEqual([2]);
  });

  it('diffusions : pagination et tri', async () => {
    let calls = 0;
    const { c } = client((async () => {
      calls++;
      return json({ data: { Page: { pageInfo: { hasNextPage: calls === 1 }, airingSchedules: calls === 1
        ? [{ id: 2, mediaId: 1, episode: 5, airingAt: 200 }] : [{ id: 1, mediaId: 1, episode: 4, airingAt: 100 }] } } });
    }) as typeof fetch);
    const r = await c.airing([1], 0, 1000);
    expect(r.data.map(a => a.episode)).toEqual([4, 5]);
    expect(calls).toBe(2);
  });

  it('messages en français', () => {
    expect(errorMessage(new ApiError('rate_limited', '', 12_300))).toContain('13 s');
    expect(errorMessage(new ApiError('offline', ''))).toContain('Hors-ligne');
  });
});

describe('limiteur', () => {
  it('25 requêtes puis attente de la fenêtre', async () => {
    let t = 0;
    const slept: number[] = [];
    const l = new RateLimiter(3, 60_000, () => t, async ms => { slept.push(ms); t += ms; });
    for (let i = 0; i < 3; i++) await l.acquire();
    expect(slept).toEqual([]);
    t += 10_000;
    await l.acquire();
    expect(slept).toEqual([50_000]);
  });
  it('refuse sans attendre au-delà de maxWait', async () => {
    let t = 0;
    const l = new RateLimiter(1, 60_000, () => t, async () => {});
    expect(await l.acquire()).toBe(true);
    expect(await l.acquire(undefined, 1000)).toBe(false);
  });
});
