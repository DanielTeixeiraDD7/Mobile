import { describe, expect, it } from 'vitest';
import { toSnapshot, TmdbClient } from '../src/api/tmdb';
import { ApiError } from '../src/api/anilist';
import { episodeLabel } from '../src/domain/labels';
import movie from './fixtures/tmdb-movie.json';
import tv from './fixtures/tmdb-tv.json';
import airing from './fixtures/tmdb-tv-airing.json';

describe('TMDB → copie locale', () => {
  it('film : durée, statut, titre français et original', () => {
    const m = toSnapshot(movie as never, 'MOVIE', 0);
    expect(m).toMatchObject({ id: 438631, type: 'MOVIE', episodes: 1, duration: 155, status: 'FINISHED', startYear: 2021 });
    expect(m.title.english).toBe('Dune');
    expect(m.cover).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/w342\//);
    expect(m.siteUrl).toBe('https://www.themoviedb.org/movie/438631');
    expect(m.seasons).toBeUndefined();
  });

  it('série terminée : saisons hors spéciaux, total = somme, durée du dernier épisode', () => {
    const s = toSnapshot(tv as never, 'TV', 0);
    expect(s.seasons).toHaveLength(8);
    expect(s.seasons![0]).toEqual({ number: 1, episodes: 10 });
    expect(s.episodes).toBe(73);
    expect(s.duration).toBe(80);
    expect(s.status).toBe('FINISHED');
    expect(s.nextAiring).toBeNull();
    expect(s.genres).toContain('Drame');
  });

  it('série en cours : prochain épisode en numéro cumulé (pour le calendrier et le retard)', () => {
    const s = toSnapshot(airing as never, 'TV', 0);
    expect(s.status).toBe('RELEASING');
    expect(s.episodes).toBe(466);
    expect(s.nextEpisode).toEqual({ season: 23, episode: 2, date: '2026-10-22' });
    expect(s.nextAiring).toEqual({ episode: 462, airingAt: Date.parse('2026-10-22T12:00:00Z') / 1000 });
    expect(episodeLabel(s, 462)).toBe('S23 É2');
    expect(episodeLabel(s, 1)).toBe('S1 É1');
    expect(episodeLabel(s, 10)).toBe('S2 É1');
  });
});

describe('TmdbClient', () => {
  const reponse = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('recherche multi : garde films et séries, ignore personnes et adultes', async () => {
    const urls: string[] = [];
    const c = new TmdbClient('cle', async u => {
      urls.push(String(u));
      return reponse(200, { page: 1, total_pages: 1, results: [
        { id: 1, media_type: 'movie', title: 'A' }, { id: 2, media_type: 'tv', name: 'B' },
        { id: 3, media_type: 'person', name: 'C' }, { id: 4, media_type: 'movie', title: 'D', adult: true },
      ] });
    });
    const r = await c.search('  dune  ');
    expect(r.data.items.map(m => [m.id, m.type])).toEqual([[1, 'MOVIE'], [2, 'TV']]);
    expect(urls[0]).toContain('query=dune');
    expect(urls[0]).toContain('language=fr-FR');
  });

  it('détails + recommandations', async () => {
    const c = new TmdbClient('cle', async () => reponse(200, movie));
    const r = await c.details('MOVIE', 438631);
    expect(r.data.media.duration).toBe(155);
    expect(r.data.recommendations.length).toBeGreaterThan(0);
    expect(r.data.recommendations.length).toBeLessThanOrEqual(12);
    expect(r.data.recommendations.every(x => x.media.type === 'MOVIE')).toBe(true);
  });

  it('clé refusée → erreur lisible', async () => {
    const c = new TmdbClient('mauvaise', async () => reponse(401, { status_message: 'Invalid API key' }));
    await expect(c.search('x')).rejects.toBeInstanceOf(ApiError);
    await expect(c.search('y')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('réseau coupé → copie en cache (marquée ancienne)', async () => {
    const store = new Map<string, { data: unknown; at: number }>();
    const cache = { get: async (k: string) => store.get(k), put: async (k: string, data: unknown, at: number) => { store.set(k, { data, at }); } };
    const enLigne = new TmdbClient('cle', async () => reponse(200, { results: [{ id: 9, title: 'T' }] }), () => 0);
    enLigne.setCache(cache);
    await enLigne.trending('MOVIE');
    const horsLigne = new TmdbClient('cle', async () => { throw new TypeError('fetch failed'); }, () => 10 ** 12);
    await expect(horsLigne.trending('MOVIE')).rejects.toMatchObject({ kind: 'offline' });
    horsLigne.setCache(cache);
    const r = await horsLigne.trending('MOVIE');
    expect(r.stale).toBe(true);
    expect(r.data[0]!.id).toBe(9);
  });
});

describe('listes TMDB (catalogue par pays)', () => {
  const reponse = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
  it('genres déduits des identifiants, anime japonais et adultes exclus', async () => {
    let url = '';
    const c = new TmdbClient('cle', async u => { url = String(u); return reponse({ results: [
      { id: 1, title: 'Polar', genre_ids: [80, 53], original_language: 'fr' },
      { id: 2, title: 'Anime', genre_ids: [16, 28], original_language: 'ja' },
      { id: 3, title: 'Pixar', genre_ids: [16, 10751], original_language: 'en' },
      { id: 4, title: 'X', adult: true },
    ] }); });
    const r = await c.liste('MOVIE', 'discover/movie', { with_original_language: 'fr', watch_region: 'FR' });
    expect(r.data.map(m => m.id)).toEqual([1, 3]);
    expect(r.data[0]!.genres).toEqual(['Crime', 'Thriller']);
    expect(url).toContain('with_original_language=fr');
    expect(url).toContain('watch_region=FR');
  });
});
