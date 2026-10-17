import type { EntryStatus, MediaSnapshot, MediaType, TitleLanguage } from './types';

const STATUS_LABELS: Record<MediaType, Record<EntryStatus, string>> = {
  ANIME: { CURRENT: 'En cours', PLANNING: 'À regarder', PAUSED: 'En pause', COMPLETED: 'Terminé', DROPPED: 'Abandonné', REWATCH: 'À revoir' },
  MANGA: { CURRENT: 'En cours', PLANNING: 'À lire', PAUSED: 'En pause', COMPLETED: 'Terminé', DROPPED: 'Abandonné', REWATCH: 'À relire' },
};

export const statusLabel = (type: MediaType, s: EntryStatus) => STATUS_LABELS[type][s];
export const unitLabel = (type: MediaType, n = 2) => (type === 'ANIME' ? (n > 1 ? 'épisodes' : 'épisode') : n > 1 ? 'chapitres' : 'chapitre');
export const unitShort = (type: MediaType) => (type === 'ANIME' ? 'ép.' : 'ch.');

export function mediaTitle(m: Pick<MediaSnapshot, 'title'>, lang: TitleLanguage): string {
  const t = m.title;
  return t[lang] || t.romaji || t.english || t.native || 'Sans titre';
}

const FORMATS: Record<string, string> = {
  TV: 'Série TV', TV_SHORT: 'Format court', MOVIE: 'Film', SPECIAL: 'Spécial', OVA: 'OVA', ONA: 'ONA', MUSIC: 'Clip',
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
export const totalUnits = (m: Pick<MediaSnapshot, 'type' | 'episodes' | 'chapters'>) => (m.type === 'ANIME' ? m.episodes : m.chapters);

export const formatNumber = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
