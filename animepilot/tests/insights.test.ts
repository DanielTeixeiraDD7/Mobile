import { describe, expect, it } from 'vitest';
import { activity, formatDuration, typeStats } from '../src/domain/stats';
import { buildProfile, cosine, entryWeight } from '../src/domain/taste';
import { nextFromPlanning, recommend, seeds } from '../src/domain/recommend';
import { answer, insights, parseMinutes, type Ctx } from '../src/domain/assistant';
import type { HistoryEvent } from '../src/domain/types';
import { entry, media } from './fixtures';

const NOW = new Date(2026, 9, 17, 20, 0).getTime();
const nowSec = NOW / 1000;

const action = entry({ media: media({ id: 1, genres: ['Action', 'Fantasy'], duration: 24, episodes: 12 }), status: 'COMPLETED', progress: 12, score: 9, completedAt: '2026-03-01' });
const drama = entry({ media: media({ id: 2, genres: ['Drama', 'Romance'], duration: null, episodes: 24 }), status: 'DROPPED', progress: 3, score: 3 });
const airing = entry({
  media: media({ id: 3, genres: ['Action'], status: 'RELEASING', episodes: null, duration: 23, nextAiring: { episode: 6, airingAt: nowSec + 3600 } }),
  status: 'CURRENT', progress: 2, updatedAt: NOW - 86400_000,
});
const planShort = entry({ media: media({ id: 4, genres: ['Action'], episodes: 6, averageScore: 80 }), status: 'PLANNING' });
const planLong = entry({ media: media({ id: 5, genres: ['Romance'], episodes: 50 }), status: 'PLANNING' });
const mangaE = entry({ media: media({ id: 6, type: 'MANGA', genres: ['Action'], episodes: null, duration: null, chapters: null }), type: 'MANGA', status: 'CURRENT', progress: 100.5, updatedAt: NOW - 40 * 86400_000 });
const all = [action, drama, airing, planShort, planLong, mangaE];
const ctx: Ctx = { entries: all, history: [], lang: 'romaji', now: NOW };

describe('statistiques', () => {
  it('sépare exact et estimé', () => {
    const s = typeStats(all, 'ANIME', new Date(NOW));
    expect(s.total).toBe(5);
    expect(s.units).toMatchObject({ value: 17, estimate: false });
    expect(s.minutes.estimate).toBe(true);
    expect(s.minutes.value).toBe(12 * 24 + 3 * 24 + 2 * 23); // durée inconnue → 24 min
    expect(s.minutes.note).toContain('1 titre(s) sans durée');
    expect(s.meanScore).toMatchObject({ value: 6, estimate: false });
    expect(s.completedThisYear).toBe(1);
    expect(s.remainingMinutes.note).toContain('1 série(s) sans total');
  });
  it('manga : chapitres décimaux et hypothèse de lecture', () => {
    const s = typeStats(all, 'MANGA');
    expect(s.units.value).toBe(100.5);
    expect(s.minutes.note).toContain('5 min');
  });
  it('activité exacte par jour, annulations exclues', () => {
    const ev = (at: number, from: number, to: number, undone = false): HistoryEvent => ({ id: String(at), entryId: action.id, at, kind: 'progress', before: { progress: from }, after: { progress: to }, undone });
    const a = activity([ev(NOW - 1000, 0, 3), ev(NOW - 2000, 3, 4, true), ev(NOW - 86400_000, 0, 2), ev(NOW - 100 * 86400_000, 0, 9)], all, 7, NOW);
    expect(a).toHaveLength(7);
    expect(a[6]!.anime).toBe(3);
    expect(a[5]!.anime).toBe(2);
  });
  it('durées lisibles', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(600)).toBe('10 h');
    expect(formatDuration(3000)).toBe('2 j 2 h');
  });
});

describe('goûts et recommandations', () => {
  it('la note prime sur le statut', () => {
    expect(entryWeight({ score: 10, status: 'DROPPED' })).toBe(2);
    expect(entryWeight({ score: null, status: 'DROPPED' })).toBeLessThan(0);
  });
  it('profil : genres aimés et rejetés', () => {
    const p = buildProfile(all, 'ANIME');
    expect(p.topGenres[0]!.name).toBe('Action');
    expect(p.disliked.map(d => d.name)).toContain('Drama');
    expect(p.weak).toBe(false);
  });
  it('cosinus', () => {
    expect(cosine(new Map([['a', 1]]), new Map([['a', 2]]))).toBeCloseTo(1);
    expect(cosine(new Map([['a', 1]]), new Map([['b', 1]]))).toBe(0);
    expect(cosine(new Map(), new Map([['b', 1]]))).toBe(0);
  });
  it('classe selon les goûts, exclut la bibliothèque, explique', () => {
    const recs = recommend(all, [
      { media: media({ id: 10, genres: ['Drama', 'Romance'], averageScore: 90 }), trending: true },
      { media: media({ id: 11, genres: ['Action', 'Fantasy'], averageScore: 70 }), from: action, rating: 200 },
      { media: media({ id: 11, genres: ['Action', 'Fantasy'], averageScore: 70 }), from: airing, rating: 50 },
      { media: media({ id: 1 }) },
      { media: media({ id: 12, isAdult: true, genres: ['Action'] }) },
      { media: media({ id: 13, type: 'MANGA', genres: ['Action'] }) },
    ], 'ANIME', 'romaji');
    expect(recs.map(r => r.media.id)).toEqual([11, 10]);
    expect(recs[0]!.reasons.join(' ')).toMatch(/Action.*Titre 1.*1 autre/);
  });
  it('points de départ et liste à regarder', () => {
    expect(seeds(all, 'ANIME').map(e => e.mediaId)).toEqual([1, 3]);
    expect(nextFromPlanning(all, 'ANIME')[0]!.mediaId).toBe(4);
  });
});

describe('assistant', () => {
  it('conseils proactifs', () => {
    const ids = insights(ctx).map(i => i.id);
    expect(ids).toContain('late:' + airing.id); // ép. 5 sorti, vu 2
    expect(ids).toContain('stale:' + mangaE.id);
    expect(insights(ctx).find(i => i.id === 'late:' + airing.id)!.text).toBe('3 épisodes sortis à rattraper sur Titre 3.');
  });
  it('durées dans la question', () => {
    expect(parseMinutes("j'ai 45 min")).toBe(45);
    expect(parseMinutes('1h30')).toBe(90);
    expect(parseMinutes('2 heures')).toBe(120);
    expect(parseMinutes('1,5h')).toBe(90);
    expect(parseMinutes('une heure devant moi')).toBe(60);
    expect(parseMinutes('rien')).toBeNull();
  });
  it('que regarder : priorité au retard', () => {
    expect(answer('Que regarder ce soir ?', ctx).text).toBe('Continue Titre 3 : 3 épisodes t\'attendent.');
  });
  it('temps disponible', () => {
    expect(answer("J'ai 50 min, quoi regarder ?", ctx).text).toBe('Avec 50 min : 2 épisodes de Titre 3 (23 min chacun).');
  });
  it('manga, retard, prochaines sorties, genres, terminés, court', () => {
    expect(answer('quel manga lire', ctx).text).toContain('au chapitre 100,5');
    expect(answer('où suis-je en retard', ctx).text).toBe('Titre 3 : 3 ép.');
    expect(answer('prochaines sorties ?', ctx).text).toMatch(/^Titre 3 ép\. 6 : aujourd'hui 21:00/);
    expect(answer('mes genres préférés', ctx).text).toMatch(/^Tes genres favoris : Action/);
    expect(answer("combien j'ai fini cette année", ctx).text).toBe('1 titre terminé en 2026, 1 au total.');
    expect(answer('un anime court', ctx).text).toContain('Titre 4 (6 ép.)');
  });
  it('bibliothèque vide et question incomprise : réponse honnête', () => {
    const empty = { ...ctx, entries: [] };
    expect(answer('que regarder', empty).text).toContain('ne contient rien');
    expect(answer('blablabla', ctx).text).toContain("pas une IA");
  });
});
