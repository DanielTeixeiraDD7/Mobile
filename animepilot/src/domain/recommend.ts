import { mediaTitle } from './labels';
import { buildProfile, cosine, features, profileVector, type TasteProfile } from './taste';
import { entryId, type LibraryEntry, type MediaSnapshot, type MediaType, type TitleLanguage } from './types';

export interface Candidate {
  media: MediaSnapshot;
  /** Titre de la bibliothèque pour lequel AniList recommande ce candidat. */
  from?: LibraryEntry;
  /** Votes de la communauté AniList pour cette recommandation. */
  rating?: number;
  trending?: boolean;
}

export interface Recommendation {
  media: MediaSnapshot;
  score: number;
  reasons: string[];
}

/**
 * Classement local : similarité avec le profil de goûts (70 %), votes AniList
 * liés à tes titres aimés (20 %), moyenne AniList (10 %). Titres déjà suivis exclus.
 */
export function recommend(entries: LibraryEntry[], candidates: Candidate[], type: MediaType, lang: TitleLanguage, limit = 10): Recommendation[] {
  const profile = buildProfile(entries, type);
  const pv = profileVector(profile);
  const owned = new Set(entries.map(e => e.id));
  const merged = new Map<number, { media: MediaSnapshot; froms: LibraryEntry[]; rating: number; trending: boolean }>();
  for (const c of candidates) {
    if (c.media.type !== type || c.media.isAdult || owned.has(entryId(c.media.type, c.media.id))) continue;
    const m = merged.get(c.media.id) ?? { media: c.media, froms: [], rating: 0, trending: false };
    if (c.from && !m.froms.some(f => f.id === c.from!.id)) m.froms.push(c.from);
    m.rating += Math.max(0, c.rating ?? 0);
    m.trending ||= !!c.trending;
    merged.set(c.media.id, m);
  }
  const out: Recommendation[] = [];
  for (const m of merged.values()) {
    const sim = Math.max(0, cosine(features(m.media), pv));
    const votes = Math.min(1, Math.log10(1 + m.rating) / 3);
    const avg = (m.media.averageScore ?? 60) / 100;
    const score = 0.7 * sim + 0.2 * votes + 0.1 * avg;
    const reasons: string[] = [];
    const liked = m.media.genres.filter(g => (profile.genres.get(g) ?? 0) > 0).sort((a, b) => (profile.genres.get(b) ?? 0) - (profile.genres.get(a) ?? 0));
    if (liked.length) reasons.push(`Genres que tu apprécies : ${liked.slice(0, 3).join(', ')}`);
    if (m.froms.length) reasons.push(`Recommandé par la communauté pour « ${mediaTitle(m.froms[0]!.media, lang)} »${m.froms.length > 1 ? ` et ${m.froms.length - 1} autre(s)` : ''}`);
    if (m.trending && !m.froms.length) reasons.push('Populaire en ce moment sur AniList');
    out.push({ media: m.media, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Titres aimés servant de point de départ (les mieux notés / terminés). */
export function seeds(entries: LibraryEntry[], type: MediaType, n = 5): LibraryEntry[] {
  return entries
    .filter(e => e.type === type && (e.score === null ? ['COMPLETED', 'REWATCH', 'CURRENT'].includes(e.status) : e.score >= 7))
    .sort((a, b) => (b.score ?? 7) - (a.score ?? 7) || b.updatedAt - a.updatedAt)
    .slice(0, n);
}

/** « Quoi regarder ensuite ? » parmi ta liste « à regarder », selon tes goûts. */
export function nextFromPlanning(entries: LibraryEntry[], type: MediaType, profile: TasteProfile = buildProfile(entries, type)): LibraryEntry[] {
  const pv = profileVector(profile);
  return entries
    .filter(e => e.type === type && e.status === 'PLANNING' && e.media.status !== 'NOT_YET_RELEASED')
    .map(e => ({ e, s: cosine(features(e.media), pv) + (e.media.averageScore ?? 60) / 400 }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.e);
}
