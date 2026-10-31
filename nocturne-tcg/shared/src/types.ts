export const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'SECRET'] as const;
export type Rarity = (typeof RARITIES)[number];

export const FACTIONS = ['SANG', 'CROC', 'ABIME', 'SPECTRE', 'ALCHIMIE', 'CRYPTIDE', 'MYTHE'] as const;
export type Faction = (typeof FACTIONS)[number];

export const VARIANTS = ['NORMAL', 'HOLO', 'FULL_ART', 'ALTERNATE'] as const;
export type Variant = (typeof VARIANTS)[number];

export type Form = 'HUMAN' | 'MONSTER';
export type Currency = 'SHARDS' | 'EMBERS' | 'DUST';

export const ABILITY_KEYS = ['DRAIN', 'FURY', 'SHIELD', 'POISON', 'STUN', 'REGEN', 'SPLASH', 'LAST_WORDS', 'CURSE', 'RALLY'] as const;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

export const RARITY_LABEL: Record<Rarity, string> = {
  COMMON: 'Commune', UNCOMMON: 'Peu commune', RARE: 'Rare', EPIC: 'Épique', LEGENDARY: 'Légendaire', SECRET: 'Secrète',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: '#8a8f98', UNCOMMON: '#4fae7a', RARE: '#4a8fe0', EPIC: '#a45cf0', LEGENDARY: '#f0b43c', SECRET: '#e0315a',
};

export const FACTION_LABEL: Record<Faction, string> = {
  SANG: 'Sang', CROC: 'Croc', ABIME: 'Abîme', SPECTRE: 'Spectre', ALCHIMIE: 'Alchimie', CRYPTIDE: 'Cryptide', MYTHE: 'Mythe',
};

export const FACTION_COLOR: Record<Faction, [string, string]> = {
  SANG: ['#5a0b1c', '#1a0208'],
  CROC: ['#4a3a20', '#120c06'],
  ABIME: ['#0b3a4a', '#020a12'],
  SPECTRE: ['#3c4a6a', '#0a0c18'],
  ALCHIMIE: ['#2f4a1c', '#080f05'],
  CRYPTIDE: ['#3a2a4a', '#0c0612'],
  MYTHE: ['#5a4a14', '#140f02'],
};

export const VARIANT_LABEL: Record<Variant, string> = { NORMAL: 'Classique', HOLO: 'Holo', FULL_ART: 'Full Art', ALTERNATE: 'Couronne' };

/** Exemplaires « reverse holo » : même carte, finition holographique, clé de collection séparée. */
export const reverseKey = (cardId: string) => `${cardId}#R`;
export const REVERSE_LABEL = 'Reverse';

export const ABILITY_LABEL: Record<AbilityKey, string> = {
  DRAIN: 'Drain', FURY: 'Furie', SHIELD: 'Bouclier', POISON: 'Poison', STUN: 'Effroi',
  REGEN: 'Régénération', SPLASH: 'Onde', LAST_WORDS: 'Dernier souffle', CURSE: 'Malédiction', RALLY: 'Ralliement',
};

export const rarityRank = (r: Rarity) => RARITIES.indexOf(r);
export const atLeast = (r: Rarity, min: Rarity) => rarityRank(r) >= rarityRank(min);

export interface CardDef {
  code: string;
  number: number;
  name: string;
  rarity: Rarity;
  faction: Faction;
  hp: number;
  attack: number;
  abilityKey: AbilityKey;
  abilityName: string;
  abilityValue: number;
  lore: string;
  silhouette: string;
  variant: Variant;
  form: Form | null;
  pairCode: string | null;
  /** Carte classique dont celle-ci est une autre version (Full Art, Couronne). */
  baseCode: string | null;
  craftable: boolean;
  imageUrl: string | null;
}
