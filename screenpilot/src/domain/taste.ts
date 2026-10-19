import type { LibraryEntry, MediaSnapshot, MediaType } from './types';

const STATUS_WEIGHT = { COMPLETED: 1, REWATCH: 1.3, CURRENT: 0.6, PAUSED: 0.2, PLANNING: 0.25, DROPPED: -0.8 } as const;

/** Poids d'un titre dans le profil : la note personnelle prime, sinon le statut. */
export function entryWeight(e: Pick<LibraryEntry, 'score' | 'status'>): number {
  if (e.score !== null) return (e.score - 5.5) / 2.25; // 10 → 2 ; 5,5 → 0 ; 1 → -2
  return STATUS_WEIGHT[e.status];
}

export interface TasteProfile {
  genres: Map<string, number>;
  tags: Map<string, number>;
  topGenres: { name: string; weight: number }[];
  topTags: { name: string; weight: number }[];
  disliked: { name: string; weight: number }[];
  basedOn: number;
  /** Moins de 5 titres pris en compte : profil peu fiable. */
  weak: boolean;
}

export function features(m: Pick<MediaSnapshot, 'genres' | 'tags'>): Map<string, number> {
  const f = new Map<string, number>();
  for (const g of m.genres) f.set('g:' + g, 1);
  for (const t of m.tags) f.set('t:' + t.name, (t.rank / 100) * 0.7);
  return f;
}

export function buildProfile(entries: LibraryEntry[], type?: MediaType): TasteProfile {
  const genres = new Map<string, number>();
  const tags = new Map<string, number>();
  let basedOn = 0;
  for (const e of entries) {
    if (type && e.type !== type) continue;
    const w = entryWeight(e);
    if (w === 0) continue;
    basedOn++;
    for (const g of e.media.genres) genres.set(g, (genres.get(g) ?? 0) + w);
    for (const t of e.media.tags) tags.set(t.name, (tags.get(t.name) ?? 0) + w * (t.rank / 100));
  }
  const sorted = (m: Map<string, number>) => [...m].map(([name, weight]) => ({ name, weight })).sort((a, b) => b.weight - a.weight);
  const g = sorted(genres);
  return {
    genres, tags,
    topGenres: g.filter(x => x.weight > 0).slice(0, 6),
    topTags: sorted(tags).filter(x => x.weight > 0).slice(0, 8),
    disliked: [...g].reverse().filter(x => x.weight < 0).slice(0, 4),
    basedOn,
    weak: basedOn < 5,
  };
}

/** Vecteur du profil dans le même espace que `features`. */
export function profileVector(p: TasteProfile): Map<string, number> {
  const v = new Map<string, number>();
  for (const [k, w] of p.genres) v.set('g:' + k, w);
  for (const [k, w] of p.tags) v.set('t:' + k, w * 0.7);
  return v;
}

export function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, x] of a) { na += x * x; const y = b.get(k); if (y !== undefined) dot += x * y; }
  for (const y of b.values()) nb += y * y;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
