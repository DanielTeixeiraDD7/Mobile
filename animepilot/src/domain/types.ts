export type MediaType = 'ANIME' | 'MANGA';

/** Statuts internes, communs aux deux types ; seuls les libellés changent. */
export const ENTRY_STATUSES = ['CURRENT', 'PLANNING', 'PAUSED', 'COMPLETED', 'DROPPED', 'REWATCH'] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export type TitleLanguage = 'romaji' | 'english' | 'native';

/** Copie locale des infos AniList d'un titre de la bibliothèque (pas de collecte en masse). */
export interface MediaSnapshot {
  id: number;
  type: MediaType;
  title: { romaji: string | null; english: string | null; native: string | null };
  cover: string | null;
  coverColor: string | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  tags: { name: string; rank: number }[];
  season: string | null;
  seasonYear: number | null;
  startYear: number | null;
  averageScore: number | null;
  nextAiring: { episode: number; airingAt: number } | null;
  siteUrl: string | null;
  isAdult: boolean;
  fetchedAt: number;
}

export interface LibraryEntry {
  /** `${source}:${type}:${mediaId}` */
  id: string;
  source: 'anilist';
  mediaId: number;
  type: MediaType;
  status: EntryStatus;
  /** Épisodes (entier) ou chapitres (décimal autorisé : 10.5). */
  progress: number;
  volumes: number;
  /** Note personnelle 0–10 (pas de 0,5), null = non notée. */
  score: number | null;
  repeatCount: number;
  notes: string;
  startedAt: string | null;
  completedAt: string | null;
  addedAt: number;
  updatedAt: number;
  media: MediaSnapshot;
}

export type HistoryKind = 'add' | 'progress' | 'status' | 'score' | 'remove';

export interface HistoryEvent {
  id: string;
  entryId: string;
  at: number;
  kind: HistoryKind;
  /** État avant/après des champs modifiés, pour l'annulation. */
  before: Partial<Pick<LibraryEntry, 'progress' | 'status' | 'score' | 'startedAt' | 'completedAt' | 'repeatCount'>>;
  after: Partial<Pick<LibraryEntry, 'progress' | 'status' | 'score' | 'startedAt' | 'completedAt' | 'repeatCount'>>;
  undone: boolean;
  /** Copie complète du titre pour annuler une suppression. */
  snapshot?: LibraryEntry;
}

export interface Settings {
  titleLanguage: TitleLanguage;
  onboarded: boolean;
  reminderMinutes: number;
  /** Notifications pendant que l'app est ouverte (aucun serveur push). */
  notify: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  titleLanguage: 'romaji',
  onboarded: false,
  reminderMinutes: 15,
  notify: false,
};

export const entryId = (type: MediaType, mediaId: number) => `anilist:${type}:${mediaId}`;
