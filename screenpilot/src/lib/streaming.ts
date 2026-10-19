import { tmdb, type Disponibilite } from '@/api/tmdb';
import { PAYS, type MediaSnapshot, type Pays } from '@/domain/types';

/**
 * Où regarder / lire un titre, selon le pays.
 * Films, séries et anime : plateformes par pays (JustWatch via TMDB ; l'anime est d'abord retrouvé dans TMDB).
 * Manga : sites de lecture officiels donnés par AniList, dans la langue du pays d'abord.
 */
export interface OuRegarder {
  parPays: Record<string, Disponibilite>;
  /** Anime : série TMDB utilisée (pour vérifier que c'est la bonne). */
  correspondance: string | null;
}

export async function ouRegarder(m: MediaSnapshot, signal?: AbortSignal): Promise<OuRegarder | null> {
  if (m.type === 'MOVIE' || m.type === 'TV') return { parPays: (await tmdb.disponibilites(m.type, m.id, PAYS, signal)).data, correspondance: null };
  if (m.type === 'ANIME') {
    const t = (await tmdb.trouverAnime(m, signal)).data;
    if (!t) return null;
    return { parPays: (await tmdb.disponibilites(m.format === 'MOVIE' ? 'MOVIE' : 'TV', t.id, PAYS, signal)).data, correspondance: t.nom };
  }
  return null;
}

const LANGUE: Record<Pays, string[]> = { FR: ['French'], BE: ['French'], CH: ['French', 'German', 'Italian'], CA: ['French', 'English'], PT: ['Portuguese'] };

/** Liens officiels AniList triés : langue du pays, puis anglais, puis le reste ; un lien par site et langue. */
export function liensOfficiels(liens: { site: string; url: string; langue: string | null; couleur: string | null }[], pays: Pays) {
  const rang = (l: string | null) => (l && LANGUE[pays].includes(l) ? 0 : !l ? 1 : l === 'English' ? 2 : 3);
  const vus = new Set<string>();
  return [...liens].sort((a, b) => rang(a.langue) - rang(b.langue))
    .filter(l => { const k = `${l.site}|${l.langue}`; if (vus.has(k)) return false; vus.add(k); return true; })
    .filter(l => rang(l.langue) <= 2)
    .slice(0, 8);
}
