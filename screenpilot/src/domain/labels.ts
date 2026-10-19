import type { EntryStatus, MediaSnapshot, MediaType, TitleLanguage } from './types';

const STATUS_LABELS: Record<MediaType, Record<EntryStatus, string>> = {
  ANIME: { CURRENT: 'En cours', PLANNING: 'À regarder', PAUSED: 'En pause', COMPLETED: 'Terminé', DROPPED: 'Abandonné', REWATCH: 'À revoir' },
  MANGA: { CURRENT: 'En cours', PLANNING: 'À lire', PAUSED: 'En pause', COMPLETED: 'Terminé', DROPPED: 'Abandonné', REWATCH: 'À relire' },
  MOVIE: { CURRENT: 'En cours', PLANNING: 'À voir', PAUSED: 'En pause', COMPLETED: 'Vu', DROPPED: 'Abandonné', REWATCH: 'À revoir' },
  TV: { CURRENT: 'En cours', PLANNING: 'À regarder', PAUSED: 'En pause', COMPLETED: 'Terminée', DROPPED: 'Abandonnée', REWATCH: 'À revoir' },
};

export const TYPE_LABELS: Record<MediaType, { un: string; plusieurs: string; couleur: string; icone: string }> = {
  MOVIE: { un: 'Film', plusieurs: 'Films', couleur: '#f5a524', icone: 'film' },
  TV: { un: 'Série', plusieurs: 'Séries', couleur: '#3b82f6', icone: 'tv' },
  ANIME: { un: 'Anime', plusieurs: 'Anime', couleur: '#a855f7', icone: 'anime' },
  MANGA: { un: 'Manga', plusieurs: 'Manga', couleur: '#ec4899', icone: 'livre' },
};

export const statusLabel = (type: MediaType, s: EntryStatus) => STATUS_LABELS[type][s];
const UNITS: Record<MediaType, [string, string, string]> = {
  ANIME: ['épisode', 'épisodes', 'ép.'], TV: ['épisode', 'épisodes', 'ép.'], MANGA: ['chapitre', 'chapitres', 'ch.'], MOVIE: ['film', 'films', 'film'],
};
export const unitLabel = (type: MediaType, n = 2) => UNITS[type][n > 1 ? 1 : 0];
export const unitShort = (type: MediaType) => UNITS[type][2];

export function mediaTitle(m: Pick<MediaSnapshot, 'title'>, lang: TitleLanguage): string {
  const t = m.title;
  return t[lang] || t.romaji || t.english || t.native || 'Sans titre';
}

const FORMATS: Record<string, string> = {
  TV: 'Série', TV_SHORT: 'Format court', MOVIE: 'Film', SPECIAL: 'Spécial', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Clip',
  MANGA: 'Manga', NOVEL: 'Light novel', ONE_SHOT: 'One shot',
};
export const formatLabel = (f: string | null) => (f ? FORMATS[f] ?? f : '');

const MEDIA_STATUS: Record<string, string> = {
  FINISHED: 'Terminé', RELEASING: 'En diffusion', NOT_YET_RELEASED: 'À venir', CANCELLED: 'Annulé', HIATUS: 'En pause',
};
export const mediaStatusLabel = (s: string | null) => (s ? MEDIA_STATUS[s] ?? s : '');

const SEASONS: Record<string, string> = { WINTER: 'Hiver', SPRING: 'Printemps', SUMMER: 'Été', FALL: 'Automne' };
export const seasonLabel = (s: string | null, y: number | null) => [s ? SEASONS[s] ?? s : '', y ?? ''].join(' ').trim();

/** Total connu d'unités (épisodes ou chapitres), null si inconnu (série en cours). */
export const totalUnits = (m: Pick<MediaSnapshot, 'type' | 'episodes' | 'chapters'>) => (m.type === 'MOVIE' ? 1 : m.type === 'MANGA' ? m.chapters : m.episodes);

/** Épisode n (cumulé) d'une série → « S2 É5 » quand les saisons sont connues. */
export function episodeLabel(m: Pick<MediaSnapshot, 'seasons'>, n: number): string | null {
  if (!m.seasons?.length || n < 1) return null;
  let reste = n;
  for (const s of m.seasons) {
    if (reste <= s.episodes) return `S${s.number} É${reste}`;
    reste -= s.episodes;
  }
  return null;
}

export const formatNumber = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
