import { RARITIES, atLeast, type Rarity } from './types';

/** Source d'aléa : entier uniforme dans [0, max). Serveur : crypto.randomInt. */
export interface Rng { int(max: number): number }

export const WEIGHT_TOTAL = 100_000;

export type SlotRates = Partial<Record<Rarity, number>>;

export interface PoolCard { id: string; rarity: Rarity }

export interface BannerConfig {
  slots: SlotRates[];
  pool: PoolCard[];
  featuredIds: string[];
  /** Part (sur 100 000) des tirages d'une rareté qui tombent sur une carte mise en avant. */
  featuredShare: number;
  epicPityEvery: number;
  legendaryPityAt: number;
}

export interface PityState { sinceEpic: number; sinceLegendary: number }

export type PityTrigger = 'EPIC' | 'LEGENDARY' | null;

export interface DrawnCard { slot: number; cardId: string; rarity: Rarity }

export interface PackResult { cards: DrawnCard[]; pity: PityState; pityTriggered: PityTrigger }

/** Poids de secours quand un slot ne contient aucune rareté éligible à la pitié. */
const PITY_FALLBACK: SlotRates = { EPIC: 80_000, LEGENDARY: 16_000, SECRET: 4_000 };

export const DEFAULT_SLOTS: SlotRates[] = [
  { COMMON: 74_000, UNCOMMON: 24_000, RARE: 2_000 },
  { COMMON: 74_000, UNCOMMON: 24_000, RARE: 2_000 },
  { COMMON: 74_000, UNCOMMON: 24_000, RARE: 2_000 },
  { UNCOMMON: 70_000, RARE: 23_000, EPIC: 6_000, LEGENDARY: 900, SECRET: 100 },
  { RARE: 76_000, EPIC: 18_000, LEGENDARY: 5_000, SECRET: 1_000 },
];

export function pickWeighted<T>(entries: [T, number][], rng: Rng): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) throw new Error('Aucun poids positif');
  let roll = rng.int(total);
  for (const [v, w] of entries) {
    if (roll < w) return v;
    roll -= w;
  }
  throw new Error('Tirage hors bornes');
}

function availableRarities(pool: PoolCard[]): Set<Rarity> {
  return new Set(pool.map(c => c.rarity));
}

/** Poids effectifs d'un slot : raretés sans carte ignorées, éventuellement restreintes à une rareté minimale. */
export function effectiveWeights(rates: SlotRates, pool: PoolCard[], min?: Rarity): [Rarity, number][] {
  const avail = availableRarities(pool);
  const pick = (src: SlotRates) => RARITIES
    .filter(r => avail.has(r) && (!min || atLeast(r, min)))
    .map(r => [r, src[r] ?? 0] as [Rarity, number])
    .filter(([, w]) => w > 0);
  const own = pick(rates);
  return own.length || !min ? own : pick(PITY_FALLBACK);
}

export function pickCard(cfg: BannerConfig, rarity: Rarity, rng: Rng): string {
  const all = cfg.pool.filter(c => c.rarity === rarity);
  const featured = all.filter(c => cfg.featuredIds.includes(c.id));
  const list = featured.length && cfg.featuredShare > 0 && rng.int(WEIGHT_TOTAL) < cfg.featuredShare ? featured : all;
  return list[rng.int(list.length)]!.id;
}

export function openPack(cfg: BannerConfig, pity: PityState, rng: Rng): PackResult {
  const rarities = cfg.slots.map(s => pickWeighted(effectiveWeights(s, cfg.pool), rng));
  const last = rarities.length - 1;
  let pityTriggered: PityTrigger = null;

  const hasLeg = () => rarities.some(r => atLeast(r, 'LEGENDARY'));
  const hasEpic = () => rarities.some(r => atLeast(r, 'EPIC'));

  if (!hasLeg() && pity.sinceLegendary + 1 >= cfg.legendaryPityAt) {
    rarities[last] = pickWeighted(effectiveWeights(cfg.slots[last]!, cfg.pool, 'LEGENDARY'), rng);
    pityTriggered = 'LEGENDARY';
  } else if (!hasEpic() && pity.sinceEpic + 1 >= cfg.epicPityEvery) {
    rarities[last] = pickWeighted(effectiveWeights(cfg.slots[last]!, cfg.pool, 'EPIC'), rng);
    pityTriggered = 'EPIC';
  }

  const cards = rarities.map((rarity, slot) => ({ slot, rarity, cardId: pickCard(cfg, rarity, rng) }));
  return {
    cards,
    pityTriggered,
    pity: {
      sinceEpic: hasEpic() ? 0 : pity.sinceEpic + 1,
      sinceLegendary: hasLeg() ? 0 : pity.sinceLegendary + 1,
    },
  };
}

export interface RateTable {
  slots: { slot: number; rates: { rarity: Rarity; percent: number }[] }[];
  cards: { id: string; rarity: Rarity; perPackPercent: number; featured: boolean }[];
  pity: { epicEvery: number; legendaryAt: number };
}

/** Taux exacts affichés au joueur (hors effet de la pitié, décrite à part). */
export function rateTable(cfg: BannerConfig): RateTable {
  const slotProbs = cfg.slots.map(s => {
    const w = effectiveWeights(s, cfg.pool);
    const total = w.reduce((a, [, x]) => a + x, 0);
    return new Map(w.map(([r, x]) => [r, x / total]));
  });
  const cardProb = (c: PoolCard, rarity: Rarity) => {
    const all = cfg.pool.filter(p => p.rarity === rarity);
    const featured = all.filter(p => cfg.featuredIds.includes(p.id));
    const share = featured.length ? cfg.featuredShare / WEIGHT_TOTAL : 0;
    const base = (1 - share) / all.length;
    return featured.some(f => f.id === c.id) ? base + share / featured.length : base;
  };
  return {
    slots: slotProbs.map((m, slot) => ({ slot, rates: [...m].map(([rarity, p]) => ({ rarity, percent: round(p * 100) })) })),
    cards: cfg.pool.map(c => {
      const miss = slotProbs.reduce((acc, m) => acc * (1 - (m.get(c.rarity) ?? 0) * cardProb(c, c.rarity)), 1);
      return { id: c.id, rarity: c.rarity, perPackPercent: round((1 - miss) * 100, 4), featured: cfg.featuredIds.includes(c.id) };
    }),
    pity: { epicEvery: cfg.epicPityEvery, legendaryAt: cfg.legendaryPityAt },
  };
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

/** Générateur déterministe (combat, tests). */
export function seededRng(seed: number): Rng & { state(): number } {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: max => Math.floor(next() * max), state: () => s };
}
