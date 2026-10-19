import { describe, expect, it } from 'vitest';
import { bilan, bornes, duree, joursEcoules, minutesParUnite, serie, sessions } from '../src/domain/screentime';
import type { HistoryEvent } from '../src/domain/types';
import { entry, media } from './fixtures';

const R = { minutesPerChapter: 5 };
const t = (s: string) => new Date(s).getTime();
let n = 0;
const ev = (o: Partial<HistoryEvent> & Pick<HistoryEvent, 'entryId' | 'kind' | 'at'>): HistoryEvent => ({ id: 'e' + ++n, before: {}, after: {}, undone: false, ...o });

const anime = entry({ id: 'anilist:ANIME:1', mediaId: 1, type: 'ANIME', media: media({ id: 1, duration: 24 }) });
const manga = entry({ id: 'anilist:MANGA:2', mediaId: 2, type: 'MANGA', media: media({ id: 2, type: 'MANGA', episodes: null, chapters: 100, duration: null }) });
const film = entry({ id: 'tmdb:MOVIE:3', mediaId: 3, type: 'MOVIE', source: 'tmdb', media: media({ id: 3, type: 'MOVIE', episodes: 1, duration: 155 }) });
const serieTv = entry({ id: 'tmdb:TV:4', mediaId: 4, type: 'TV', source: 'tmdb', media: media({ id: 4, type: 'TV', episodes: 20, duration: null }) });

describe('durée par unité', () => {
  it('source, sinon valeur par défaut, manga = réglage', () => {
    expect(minutesParUnite(anime, R)).toEqual({ minutes: 24, supposee: false });
    expect(minutesParUnite(serieTv, R)).toEqual({ minutes: 40, supposee: true });
    expect(minutesParUnite(manga, { minutesPerChapter: 7 })).toEqual({ minutes: 7, supposee: true });
  });
});

describe('sessions', () => {
  it('compte les épisodes ajoutés, pas les retours en arrière ni les annulations', () => {
    const h = [
      ev({ entryId: anime.id, kind: 'progress', at: 1, before: { progress: 0 }, after: { progress: 1 } }),
      ev({ entryId: anime.id, kind: 'progress', at: 2, before: { progress: 1 }, after: { progress: 3 } }),
      ev({ entryId: anime.id, kind: 'progress', at: 3, before: { progress: 3 }, after: { progress: 2 } }),
      ev({ entryId: anime.id, kind: 'progress', at: 4, before: { progress: 2 }, after: { progress: 5 }, undone: true }),
      ev({ entryId: manga.id, kind: 'progress', at: 5, before: { progress: 10 }, after: { progress: 12.5 } }),
    ];
    const s = sessions(h, [anime, manga], R);
    expect(s.map(x => x.minutes)).toEqual([24, 48, 12.5]);
    expect(s.map(x => x.unites)).toEqual([1, 2, 2.5]);
  });

  it('« Terminé » : compte la fin d’un titre en cours et un film vu, pas un rattrapage ni un ajout', () => {
    const h = [
      ev({ entryId: anime.id, kind: 'status', at: 1, before: { status: 'CURRENT', progress: 10 }, after: { status: 'COMPLETED', progress: 12 } }),
      ev({ entryId: serieTv.id, kind: 'status', at: 2, before: { status: 'PLANNING', progress: 0 }, after: { status: 'COMPLETED', progress: 20 } }),
      ev({ entryId: film.id, kind: 'status', at: 3, before: { status: 'PLANNING', progress: 0 }, after: { status: 'COMPLETED', progress: 1 } }),
      ev({ entryId: film.id, kind: 'add', at: 4, after: { status: 'COMPLETED', progress: 1 } }),
    ];
    const s = sessions(h, [anime, serieTv, film], R);
    expect(s.map(x => [x.type, x.minutes])).toEqual([['ANIME', 48], ['MOVIE', 155]]);
  });

  it('titre retiré depuis : durée par défaut du type', () => {
    const h = [ev({ entryId: 'tmdb:TV:99', kind: 'progress', at: 1, before: { progress: 0 }, after: { progress: 2 } })];
    expect(sessions(h, [], R)[0]).toMatchObject({ type: 'TV', minutes: 80 });
  });
});

describe('périodes', () => {
  it('semaine du lundi au dimanche', () => {
    const { debut, fin } = bornes('semaine', new Date('2026-10-19T15:00:00')); // lundi
    expect(debut.getDay()).toBe(1);
    expect(debut.getDate()).toBe(19);
    expect((fin.getTime() - debut.getTime()) / 86_400_000).toBeCloseTo(7, 0);
    const dimanche = bornes('semaine', new Date('2026-10-25T23:00:00'));
    expect(dimanche.debut.getDate()).toBe(19);
    expect(bornes('semaine', new Date('2026-10-19T15:00:00'), -1).debut.getDate()).toBe(12);
  });

  it('mois et jour', () => {
    const m = bornes('mois', new Date('2026-10-19T15:00:00'), -1);
    expect([m.debut.getMonth(), m.debut.getDate(), m.fin.getMonth()]).toEqual([8, 1, 9]);
    const j = bornes('jour', new Date('2026-10-19T15:00:00'));
    expect([j.debut.getHours(), j.fin.getDate()]).toEqual([0, 20]);
  });

  it('bilan : total, par type, par jour, titres', () => {
    const liste = [
      { at: t('2026-10-19T21:00:00'), entryId: anime.id, type: 'ANIME' as const, unites: 2, minutes: 48 },
      { at: t('2026-10-21T20:00:00'), entryId: film.id, type: 'MOVIE' as const, unites: 1, minutes: 155 },
      { at: t('2026-10-21T22:00:00'), entryId: anime.id, type: 'ANIME' as const, unites: 1, minutes: 24 },
      { at: t('2026-10-27T10:00:00'), entryId: anime.id, type: 'ANIME' as const, unites: 1, minutes: 24 }, // semaine suivante
    ];
    const { debut, fin } = bornes('semaine', new Date('2026-10-20T12:00:00'));
    const b = bilan(liste, 'semaine', debut, fin);
    expect(b.total).toBe(227);
    expect(b.parType).toMatchObject({ ANIME: 72, MOVIE: 155, TV: 0, MANGA: 0 });
    expect(b.tranches).toHaveLength(7);
    expect(b.tranches.map(x => x.minutes)).toEqual([48, 0, 179, 0, 0, 0, 0]);
    expect(b.titres[0]).toEqual({ entryId: film.id, minutes: 155, unites: 1 });
    expect(b.joursActifs).toBe(2);
    const jour = bornes('jour', new Date('2026-10-21T12:00:00'));
    const bj = bilan(liste, 'jour', jour.debut, jour.fin);
    expect(bj.tranches).toHaveLength(24);
    expect(bj.tranches[20]!.minutes).toBe(155);
    expect(bj.tranches[22]!.minutes).toBe(24);
  });

  it('jours écoulés et série', () => {
    const { debut, fin } = bornes('semaine', new Date('2026-10-21T12:00:00'));
    expect(joursEcoules(debut, fin, new Date('2026-10-21T12:00:00'))).toBe(3);
    expect(joursEcoules(debut, fin, new Date('2026-11-21T12:00:00'))).toBe(7);
    const s = (d: string) => ({ at: t(d), entryId: 'x', type: 'ANIME' as const, unites: 1, minutes: 24 });
    expect(serie([s('2026-10-19T10:00'), s('2026-10-20T10:00'), s('2026-10-21T10:00')], new Date('2026-10-21T23:00'))).toBe(3);
    expect(serie([s('2026-10-19T10:00'), s('2026-10-20T10:00')], new Date('2026-10-21T23:00'))).toBe(2);
    expect(serie([s('2026-10-18T10:00')], new Date('2026-10-21T23:00'))).toBe(0);
  });

  it('format des durées', () => {
    expect(duree(45)).toBe('45 min');
    expect(duree(125)).toBe('2 h 05');
    expect(duree(120)).toBe('2 h');
    expect(duree(60 * 50)).toBe('2 j 2 h');
  });
});
