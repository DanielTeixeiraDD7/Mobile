import { tmdb, type TmdbType } from '@/api/tmdb';
import { anilist } from '@/api/anilist';
import { PAYS, type MediaType, type Pays, type Settings } from '@/domain/types';

/**
 * Rangées « À découvrir » par catégorie. Les tendances mondiales de TMDB sont surtout américaines :
 * on met d'abord ce qui sort dans ton pays, le cinéma local et le cinéma du monde.
 */
export const NOM_PAYS: Record<Pays, { nom: string; en: string; langue: string; cinema: string; series: string }> = {
  FR: { nom: 'France', en: 'en France', langue: 'fr', cinema: 'Cinéma français', series: 'Séries françaises' },
  PT: { nom: 'Portugal', en: 'au Portugal', langue: 'pt', cinema: 'Cinéma portugais et brésilien', series: 'Séries portugaises et brésiliennes' },
  BE: { nom: 'Belgique', en: 'en Belgique', langue: 'fr', cinema: 'Cinéma francophone', series: 'Séries francophones' },
  CH: { nom: 'Suisse', en: 'en Suisse', langue: 'fr', cinema: 'Cinéma francophone', series: 'Séries francophones' },
  CA: { nom: 'Canada', en: 'au Canada', langue: 'fr', cinema: 'Cinéma francophone', series: 'Séries francophones' },
};

/** Pays réglé, sinon déduit de la langue du téléphone (pt-PT → Portugal, fr-BE → Belgique…), sinon France. */
export function paysDe(s: Pick<Settings, 'pays'>): Pays {
  if (s.pays) return s.pays;
  const region = (typeof navigator !== 'undefined' ? navigator.language : '').split('-')[1]?.toUpperCase();
  return (PAYS as readonly string[]).includes(region ?? '') ? (region as Pays) : 'FR';
}

/** Langues hors anglais (le japonais d'animation est filtré par le client TMDB). */
const MONDE = 'fr|es|it|de|ko|ja|zh|pt|da|sv|no|fi|nl|pl|tr|hi|fa|ar|he|th|cs|ro|hu|el';
const SANS_TELE = '10763|10764|10766|10767'; // actualités, téléréalité, feuilletons, talk-shows
const ilYa = (ans: number) => { const d = new Date(); d.setFullYear(d.getFullYear() - ans); return d.toISOString().slice(0, 10); };
const tri = { sort_by: 'popularity.desc' };

export interface Rangee { id: string; titre: string; charger: (signal?: AbortSignal) => Promise<{ data: import('@/domain/types').MediaSnapshot[]; stale: boolean }> }

export function rangees(type: MediaType, pays: Pays): Rangee[] {
  const p = NOM_PAYS[pays];
  const t = type as TmdbType;
  if (type === 'MOVIE') return [
    { id: 'affiche', titre: `Au cinéma ${p.en}`, charger: s => tmdb.liste(t, 'movie/now_playing', { region: pays }, s) },
    { id: 'streaming', titre: `Nouveautés en streaming ${p.en}`, charger: s => tmdb.liste(t, 'discover/movie', { ...tri, watch_region: pays, with_watch_monetization_types: 'flatrate', 'vote_count.gte': 150, 'primary_release_date.gte': ilYa(1) }, s) },
    { id: 'local', titre: p.cinema, charger: s => tmdb.liste(t, 'discover/movie', { ...tri, with_original_language: p.langue, 'vote_count.gte': 20, 'primary_release_date.gte': ilYa(3) }, s) },
    { id: 'monde', titre: 'Cinéma du monde', charger: s => tmdb.liste(t, 'discover/movie', { ...tri, with_original_language: MONDE, 'vote_count.gte': 100, 'primary_release_date.gte': ilYa(3) }, s) },
    { id: 'classiques', titre: 'Les mieux notés', charger: s => tmdb.liste(t, 'discover/movie', { sort_by: 'vote_average.desc', 'vote_count.gte': 3000 }, s) },
    { id: 'tendances', titre: 'Tendances mondiales', charger: s => tmdb.trending(t, s) },
  ];
  if (type === 'TV') return [
    { id: 'streaming', titre: `Populaires en streaming ${p.en}`, charger: s => tmdb.liste(t, 'discover/tv', { ...tri, watch_region: pays, with_watch_monetization_types: 'flatrate', 'vote_count.gte': 100, without_genres: SANS_TELE, 'first_air_date.gte': ilYa(3) }, s) },
    { id: 'local', titre: p.series, charger: s => tmdb.liste(t, 'discover/tv', { ...tri, with_original_language: p.langue, 'vote_count.gte': 30, without_genres: `${SANS_TELE}|10762`, 'first_air_date.gte': ilYa(10) }, s) },
    { id: 'monde', titre: 'Séries du monde', charger: s => tmdb.liste(t, 'discover/tv', { ...tri, with_original_language: MONDE, 'vote_count.gte': 100, without_genres: SANS_TELE, 'first_air_date.gte': ilYa(4) }, s) },
    { id: 'classiques', titre: 'Les mieux notées', charger: s => tmdb.liste(t, 'discover/tv', { sort_by: 'vote_average.desc', 'vote_count.gte': 2000, without_genres: SANS_TELE }, s) },
    { id: 'tendances', titre: 'Tendances mondiales', charger: s => tmdb.trending(t, s) },
  ];
  return [{ id: 'tendances', titre: type === 'ANIME' ? 'Anime du moment' : 'Manga du moment', charger: s => anilist.trending(type, s) }];
}
