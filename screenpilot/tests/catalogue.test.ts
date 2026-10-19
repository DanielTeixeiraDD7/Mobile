import { describe, expect, it } from 'vitest';
import { paysDe, rangees } from '../src/lib/catalogue';
import { recommend, seeds } from '../src/domain/recommend';
import { entry, media } from './fixtures';

describe('catalogue par pays', () => {
  it('pays réglé prioritaire, sinon France par défaut', () => {
    expect(paysDe({ pays: 'PT' })).toBe('PT');
    expect(['FR', 'PT', 'BE', 'CH', 'CA']).toContain(paysDe({}));
  });
  it('films : sorties du pays et cinéma local avant les tendances mondiales', () => {
    const r = rangees('MOVIE', 'PT');
    expect(r[0]!.titre).toBe('Au cinéma au Portugal');
    expect(r.map(x => x.titre)).toContain('Cinéma portugais et brésilien');
    expect(r.at(-1)!.id).toBe('tendances');
    expect(rangees('ANIME', 'FR')).toHaveLength(1);
  });
});

describe('recommandations au démarrage', () => {
  const film = (id: number, genres: string[], o = {}) => media({ id, type: 'MOVIE', genres, episodes: 1, averageScore: 70, ...o });
  it('sans titre vu ni noté, les titres « à voir » servent de graines', () => {
    const e = [entry({ id: 'tmdb:MOVIE:1', mediaId: 1, type: 'MOVIE', status: 'PLANNING', media: film(1, ['Drame']) })];
    expect(seeds(e, 'MOVIE').map(x => x.mediaId)).toEqual([1]);
    const abandon = [entry({ id: 'tmdb:MOVIE:2', mediaId: 2, type: 'MOVIE', status: 'DROPPED', media: film(2, ['Drame']) })];
    expect(seeds(abandon, 'MOVIE')).toEqual([]);
  });
  it('raison affichée = la liste d’origine (« Cinéma français »)', () => {
    const r = recommend([], [{ media: film(5, ['Comédie']), trending: true, raison: 'Cinéma français' }], 'MOVIE', 'romaji');
    expect(r[0]!.reasons).toContain('Cinéma français');
  });
});
