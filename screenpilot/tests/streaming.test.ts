import { describe, expect, it } from 'vitest';
import { TmdbClient } from '../src/api/tmdb';
import { liensOfficiels } from '../src/lib/streaming';

const rep = (b: unknown) => new Response(JSON.stringify(b), { status: 200 });
const f = (id: number, nom: string, prio = 1) => ({ provider_id: id, provider_name: nom, logo_path: `/${id}.png`, display_priority: prio });

describe('où regarder (TMDB / JustWatch)', () => {
  it('par pays, pays de l’app seulement, gratuit = gratuit + avec pub', async () => {
    let url = '';
    const c = new TmdbClient('cle', async u => { url = String(u); return rep({ results: {
      FR: { link: 'https://www.themoviedb.org/movie/1/watch?locale=FR', flatrate: [f(2, 'HBO Max', 2), f(1, 'Netflix', 1)], ads: [f(3, 'Pluto')], rent: [f(4, 'Canal VOD')] },
      PT: { link: 'https://x/PT', flatrate: [f(9, 'Prime Video')] },
      US: { flatrate: [f(5, 'Hulu')] },
    } }); });
    const r = (await c.disponibilites('MOVIE', 1, ['FR', 'PT', 'BE'])).data;
    expect(url).toContain('/movie/1/watch/providers');
    expect(Object.keys(r)).toEqual(['FR', 'PT']);
    expect(r.FR!.abonnement.map(p => p.nom)).toEqual(['Netflix', 'HBO Max']);
    expect(r.FR!.gratuit.map(p => p.nom)).toEqual(['Pluto']);
    expect(r.FR!.abonnement[0]!.logo).toBe('https://image.tmdb.org/t/p/w92/1.png');
    expect(r.PT!.abonnement.map(p => p.nom)).toEqual(['Prime Video']);
  });

  it('anime retrouvé dans TMDB : bon titre japonais plutôt qu’un spin-off de la même année ; saisons → série ; sinon rien', async () => {
    const resultats = [
      { id: 224499, name: 'ちみキャラ劇場', original_name: 'ちみキャラ劇場', original_language: 'ja', genre_ids: [16], first_air_date: '2013-07-17', popularity: 5 },
      { id: 63510, name: 'L’Attaque des Titans - Junior High School', original_name: '進撃！巨人中学校', original_language: 'ja', genre_ids: [16], first_air_date: '2015-10-04', popularity: 12 },
      { id: 1429, name: 'L’Attaque des Titans', original_name: '進撃の巨人', original_language: 'ja', genre_ids: [16, 10759], first_air_date: '2013-04-07', popularity: 59 },
    ];
    const c = new TmdbClient('cle', async () => rep({ results: resultats }));
    expect((await c.trouverAnime({ id: 16498, format: 'TV', title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin', native: '進撃の巨人' }, startYear: 2013 })).data).toEqual({ id: 1429, nom: 'L’Attaque des Titans' });
    expect((await c.trouverAnime({ id: 20958, format: 'TV', title: { english: 'Attack on Titan Season 2', romaji: 'Shingeki no Kyojin 2', native: '進撃の巨人 Season2' }, startYear: 2017 })).data?.id).toBe(1429);
    expect((await c.trouverAnime({ id: 1, format: 'TV', title: { english: 'Frieren', romaji: 'Sousou no Frieren', native: '葬送のフリーレン' }, startYear: 2023 })).data).toBeNull();
  });
});

describe('liens officiels (manga, anime)', () => {
  const L = (site: string, langue: string | null) => ({ site, url: `https://${site}.example/${langue}`, langue, couleur: null });
  it('langue du pays d’abord, puis sans langue, puis anglais ; autres langues retirées', () => {
    const l = [L('VIZ', 'English'), L('Shonen Jump', 'Japanese'), L('MANGA Plus', 'French'), L('Crunchyroll', null), L('MANGA Plus', 'Portuguese')];
    expect(liensOfficiels(l, 'FR').map(x => `${x.site}/${x.langue}`)).toEqual(['MANGA Plus/French', 'Crunchyroll/null', 'VIZ/English']);
    expect(liensOfficiels(l, 'PT')[0]).toMatchObject({ site: 'MANGA Plus', langue: 'Portuguese' });
  });
});
