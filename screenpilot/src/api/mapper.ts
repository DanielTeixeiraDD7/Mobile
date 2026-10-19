import type { MediaSnapshot, MediaType } from '../domain/types';

export interface RawMedia {
  id: number;
  type: MediaType;
  isAdult: boolean | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  duration: number | null;
  chapters: number | null;
  volumes: number | null;
  title: { romaji: string | null; english: string | null; native: string | null } | null;
  coverImage: { large: string | null; color: string | null } | null;
  genres: (string | null)[] | null;
  tags: ({ name: string; rank: number | null; isMediaSpoiler: boolean | null; isAdult: boolean | null } | null)[] | null;
  season: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month?: number | null; day?: number | null } | null;
  averageScore: number | null;
  siteUrl: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

/** Réponse AniList → copie locale. Les tags spoilers ou adultes sont écartés. */
export function toSnapshot(r: RawMedia, now = Date.now()): MediaSnapshot {
  return {
    id: r.id,
    type: r.type,
    title: { romaji: r.title?.romaji ?? null, english: r.title?.english ?? null, native: r.title?.native ?? null },
    cover: r.coverImage?.large ?? null,
    coverColor: r.coverImage?.color ?? null,
    format: r.format,
    status: r.status,
    episodes: r.episodes,
    duration: r.duration,
    chapters: r.chapters,
    volumes: r.volumes,
    genres: (r.genres ?? []).filter((g): g is string => !!g),
    tags: (r.tags ?? [])
      .filter((t): t is NonNullable<typeof t> => !!t && !t.isMediaSpoiler && !t.isAdult && (t.rank ?? 0) >= 40)
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
      .slice(0, 12)
      .map(t => ({ name: t.name, rank: t.rank ?? 0 })),
    season: r.season,
    seasonYear: r.seasonYear,
    startYear: r.startDate?.year ?? r.seasonYear ?? null,
    releaseDate: r.startDate?.year && r.startDate.month && r.startDate.day
      ? `${r.startDate.year}-${String(r.startDate.month).padStart(2, '0')}-${String(r.startDate.day).padStart(2, '0')}` : null,
    averageScore: r.averageScore,
    nextAiring: r.nextAiringEpisode ? { episode: r.nextAiringEpisode.episode, airingAt: r.nextAiringEpisode.airingAt } : null,
    siteUrl: r.siteUrl,
    isAdult: !!r.isAdult,
    fetchedAt: now,
  };
}

/** Description AniList (HTML léger) → texte brut. */
export function plainText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
