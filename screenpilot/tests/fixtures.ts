import type { LibraryEntry, MediaSnapshot, MediaType } from '../src/domain/types';
import { newEntry } from '../src/data/repo';

export function media(over: Partial<MediaSnapshot> & { id: number; type?: MediaType }): MediaSnapshot {
  return {
    type: 'ANIME',
    title: { romaji: `Titre ${over.id}`, english: null, native: null },
    cover: null, coverColor: null, format: 'TV', status: 'FINISHED',
    episodes: 12, duration: 24, chapters: null, volumes: null,
    genres: [], tags: [], season: null, seasonYear: null, startYear: 2020,
    averageScore: null, nextAiring: null, siteUrl: null, isAdult: false, fetchedAt: 0,
    ...over,
  };
}

export function entry(over: Partial<LibraryEntry> & { media: MediaSnapshot }): LibraryEntry {
  return { ...newEntry(over.media, 'PLANNING', 1000), ...over };
}
