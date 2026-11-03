import type { Rarity } from './types';

export const DUST_VALUE: Record<Rarity, number> = { COMMON: 5, UNCOMMON: 12, RARE: 30, EPIC: 120, LEGENDARY: 480, SECRET: 1200 };
export const CRAFT_COST: Record<Rarity, number> = { COMMON: 40, UNCOMMON: 100, RARE: 250, EPIC: 1000, LEGENDARY: 4000, SECRET: 10000 };

export const PACK_PRICE_EMBERS = 100;
export const PACK_PRICE_SHARDS = 60;
export const WELCOME_EMBERS = 200;
export const DAILY_LOGIN_EMBERS = 20;
export const STREAK_BONUS_EVERY = 7;
export const STREAK_BONUS_EMBERS = 100;

export const FREE_PACKS_PER_DAY = 2;
export const PASS_FREE_PACKS_PER_DAY = 3;
export const PASS_DUST_BONUS_PERCENT = 25;

export const MIN_AGE = 13;
export const ADULT_AGE = 18;
export const DEFAULT_MINOR_CAP_CENTS = 3000;

const DAY = 86_400_000;

export interface FreePackState { available: number; max: number; nextAt: string | null; updatedAt: string }

/** Recharge continue : 1 booster toutes les 24 h / max, plafonné à max. */
export function freePackState(stored: number, updatedAt: Date, now: Date, max: number): FreePackState {
  const interval = DAY / max;
  const gained = Math.max(0, Math.floor((now.getTime() - updatedAt.getTime()) / interval));
  const available = Math.min(max, stored + gained);
  if (available >= max) return { available: max, max, nextAt: null, updatedAt: now.toISOString() };
  const base = new Date(updatedAt.getTime() + gained * interval);
  return { available, max, nextAt: new Date(base.getTime() + interval).toISOString(), updatedAt: base.toISOString() };
}

export function consumeFreePack(stored: number, updatedAt: Date, now: Date, max: number): { stored: number; updatedAt: Date } | null {
  const s = freePackState(stored, updatedAt, now, max);
  if (s.available < 1) return null;
  return { stored: s.available - 1, updatedAt: new Date(s.updatedAt) };
}

export function dustFor(rarity: Rarity, pass: boolean): number {
  const v = DUST_VALUE[rarity];
  return pass ? Math.round(v * (1 + PASS_DUST_BONUS_PERCENT / 100)) : v;
}

export function ageOn(birth: Date, now: Date): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / DAY + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export const periodKey = (period: 'DAILY' | 'WEEKLY', d: Date) => (period === 'DAILY' ? dayKey(d) : weekKey(d));

export type MissionKind = 'LOGIN' | 'OPEN_PACKS' | 'RECYCLE' | 'CRAFT' | 'TRADE' | 'BATTLE_PLAY' | 'BATTLE_WIN';

export interface MissionDef { code: string; title: string; period: 'DAILY' | 'WEEKLY'; kind: MissionKind; target: number; rewardEmbers: number; rewardDust: number }

export const DEFAULT_MISSIONS: MissionDef[] = [
  { code: 'D_LOGIN', title: 'Revenir à la nuit tombée', period: 'DAILY', kind: 'LOGIN', target: 1, rewardEmbers: 10, rewardDust: 0 },
  { code: 'D_PACKS', title: 'Ouvrir 2 boosters', period: 'DAILY', kind: 'OPEN_PACKS', target: 2, rewardEmbers: 25, rewardDust: 0 },
  { code: 'D_BATTLE', title: 'Livrer 1 combat', period: 'DAILY', kind: 'BATTLE_PLAY', target: 1, rewardEmbers: 20, rewardDust: 10 },
  { code: 'W_PACKS', title: 'Ouvrir 10 boosters', period: 'WEEKLY', kind: 'OPEN_PACKS', target: 10, rewardEmbers: 120, rewardDust: 50 },
  { code: 'W_WINS', title: 'Remporter 3 combats', period: 'WEEKLY', kind: 'BATTLE_WIN', target: 3, rewardEmbers: 100, rewardDust: 40 },
  { code: 'W_TRADE', title: 'Conclure 1 échange', period: 'WEEKLY', kind: 'TRADE', target: 1, rewardEmbers: 60, rewardDust: 30 },
  { code: 'W_CRAFT', title: 'Invoquer 1 carte avec la poussière', period: 'WEEKLY', kind: 'CRAFT', target: 1, rewardEmbers: 50, rewardDust: 0 },
  { code: 'W_RECYCLE', title: 'Recycler des doublons', period: 'WEEKLY', kind: 'RECYCLE', target: 1, rewardEmbers: 30, rewardDust: 20 },
];

export type CosmeticKind = 'CARD_BACK' | 'FRAME' | 'AVATAR' | 'TITLE';

export interface CosmeticDef { code: string; name: string; kind: CosmeticKind; priceEmbers: number | null; passExclusive: boolean }

export const DEFAULT_COSMETICS: CosmeticDef[] = [
  { code: 'BACK_CLASSIC', name: 'Dos Sceau de Cendre', kind: 'CARD_BACK', priceEmbers: 0, passExclusive: false },
  { code: 'BACK_MOON', name: 'Dos Lune de Sang', kind: 'CARD_BACK', priceEmbers: 300, passExclusive: false },
  { code: 'BACK_ABYSS', name: 'Dos Marée Abyssale', kind: 'CARD_BACK', priceEmbers: 300, passExclusive: false },
  { code: 'BACK_NOCTURNE', name: 'Dos Pass Nocturne', kind: 'CARD_BACK', priceEmbers: null, passExclusive: true },
  { code: 'FRAME_SILVER', name: 'Cadre Argent Ciselé', kind: 'FRAME', priceEmbers: 400, passExclusive: false },
  { code: 'FRAME_THORNS', name: 'Cadre Ronces Noires', kind: 'FRAME', priceEmbers: null, passExclusive: true },
  { code: 'AV_BAT', name: 'Avatar Chauve-souris', kind: 'AVATAR', priceEmbers: 0, passExclusive: false },
  { code: 'AV_WOLF', name: 'Avatar Loup', kind: 'AVATAR', priceEmbers: 150, passExclusive: false },
  { code: 'AV_EYE', name: 'Avatar Œil Ancien', kind: 'AVATAR', priceEmbers: 150, passExclusive: false },
  { code: 'AV_CROWN', name: 'Avatar Couronne Nocturne', kind: 'AVATAR', priceEmbers: null, passExclusive: true },
  { code: 'TITLE_HUNTER', name: 'Titre « Chasseur de Lunes »', kind: 'TITLE', priceEmbers: 200, passExclusive: false },
  { code: 'TITLE_NOCTURNE', name: 'Titre « Enfant de la Nuit »', kind: 'TITLE', priceEmbers: null, passExclusive: true },
];

export const DEFAULT_SHOP: { code: string; name: string; kind: 'SHARDS' | 'PASS'; priceCents: number; shards: number }[] = [
  { code: 'SHARDS_60', name: 'Poignée d’Éclats', kind: 'SHARDS', priceCents: 99, shards: 60 },
  { code: 'SHARDS_330', name: 'Bourse d’Éclats', kind: 'SHARDS', priceCents: 499, shards: 330 },
  { code: 'SHARDS_700', name: 'Coffret d’Éclats', kind: 'SHARDS', priceCents: 999, shards: 700 },
  { code: 'SHARDS_1500', name: 'Reliquaire d’Éclats', kind: 'SHARDS', priceCents: 1999, shards: 1500 },
  { code: 'PASS_MONTHLY', name: 'Pass Nocturne (mensuel)', kind: 'PASS', priceCents: 499, shards: 0 },
];
